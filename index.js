import puppeteer from "puppeteer";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Add timestamps to console output
const originalLog = console.log;
console.log = function (...args) {
	originalLog(`[${new Date().toLocaleString()}]`, ...args);
};
const originalError = console.error;
console.error = function (...args) {
	originalError(`[${new Date().toLocaleString()}]`, ...args);
};

const LDAP_URL = process.env.LDAP_URL || process.env.PUPPETEER_LDAP_URL || "https://netaccess.iitism.ac.in:6082/";
const LDAP_USERNAME = process.env.LDAP_USERNAME;
const LDAP_PASSWORD = process.env.LDAP_PASSWORD;

/**
 * Tests if the internet is working or not by navigating to Google.
 */
async function testInternet(page) {
	console.log("Testing internet connection by visiting google.com...");
	try {
		await page.goto("https://www.google.com", { waitUntil: "networkidle2", timeout: 10000 });
		const url = page.url();
		// If the URL remains google.com, we have internet
		if (url.includes("google.com")) {
			console.log("Internet is working fine.");
			return true;
		}
		console.log(`No internet. Redirected to: ${url}`);
		return false;
	} catch (e) {
		console.log(`Failed to load Google: ${e.message}`);
		return false;
	}
}

/**
 * Navigates to the LDAP URL and handles the 'Already Connected' state.
 */
async function goToLoginPage(page, ldapUrl) {
	console.log(`Navigating to LDAP login page: ${ldapUrl}`);
	await page.goto(ldapUrl, { waitUntil: "networkidle0" });

	// Check if the portal thinks we are already logged in
	const isAlreadyLoggedIn = await page.evaluate(() => {
		return document.body.innerText.includes("Already Connected") || !!document.querySelector(".btn-logout");
	});

	if (isAlreadyLoggedIn) {
		console.log("Portal says 'Already Connected' but internet check failed. Forcing re-login...");
		const reloginUrl = new URL("/portal/relogin", page.url()).href;
		await page.goto(reloginUrl, { waitUntil: "networkidle0" });
	}
}

/**
 * Enters the login credentials at the LDAP URL page and submits.
 */
async function enterCreds(page, username, password) {
	console.log("Entering credentials...");

	// Wait for and fill the username field
	await page.waitForSelector('input[name="username"], input[type="text"]', { timeout: 10000 });
	const usernameInputs = await page.$$('input[name="username"], input[type="text"]');
	if (usernameInputs.length > 0) {
		await usernameInputs[0].type(username);
	}

	// Wait for and fill the password field
	const passwordInputs = await page.$$('input[name="password"], input[type="password"]');
	if (passwordInputs.length > 0) {
		await passwordInputs[0].type(password);
	}

	// Attempt to click the submit button
	const submitBtns = await page.$$('button[type="submit"], input[type="submit"]');
	let clicked = false;
	for (const btn of submitBtns) {
		await btn.click();
		clicked = true;
		break;
	}

	if (!clicked) {
		// Fallback: press Enter if no button found
		await page.keyboard.press("Enter");
	}

	console.log("Waiting for login to complete...");
	await new Promise((res) => setTimeout(res, 5000));
}

async function main() {
	if (!LDAP_USERNAME || !LDAP_PASSWORD) {
		console.error("Please set LDAP_USERNAME and LDAP_PASSWORD in your .env file.");
		return;
	}

	console.log("Starting background browser...");
	const browser = await puppeteer.launch({
		headless: true,
		ignoreHTTPSErrors: true,
		args: [
			"--no-sandbox",
			"--disable-setuid-sandbox",
			"--ignore-certificate-errors",
			"--disable-web-security",
			"--disable-features=IsolateOrigins,site-per-process",
		],
	});

	try {
		const page = await browser.newPage();
		let attempts = 0;

		while (true) {
			attempts++;
			console.log(`[Attempt #${attempts}] Checking internet connection...`);

			const isConnected = await testInternet(page);
			if (isConnected) {
				console.log("Internet is active! Exiting process.");
				break;
			}

			console.log("Internet is down. Attempting LDAP login workflow...");

			try {
				await goToLoginPage(page, LDAP_URL);
				await enterCreds(page, LDAP_USERNAME, LDAP_PASSWORD);

				// Check internet after login attempt
				const isConnectedNow = await testInternet(page);
				if (isConnectedNow) {
					console.log("Success! You are now logged in and connected to the internet.");
					break;
				} else {
					console.log("Login submitted, but internet is still not working. Will retry...");
				}
			} catch (err) {
				console.error(`Login attempt failed: ${err.message}`);
			}

			// After every 10 tries, wait for 30 seconds
			if (attempts % 10 === 0) {
				console.log(`Reached ${attempts} attempts. Waiting 30 seconds before next try...`);
				await new Promise((res) => setTimeout(res, 30000));
			} else {
				// Short wait before immediate retry
				await new Promise((res) => setTimeout(res, 2000));
			}
		}
	} catch (error) {
		console.error("An unhandled error occurred during the auto-login process:", error);
	} finally {
		console.log("Closing browser...");
		await browser.close();
	}
}

main();
