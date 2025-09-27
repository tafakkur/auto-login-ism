import puppeteer from "puppeteer";
import dotenv from "dotenv";
import https from "https";

// Load environment variables
dotenv.config();

const TEST_URL = "https://www.google.com"; // Used to check internet connection
const LDAP_URL = process.env.PUPPETEER_LDAP_URL;
const LDAP_USERNAME = process.env.LDAP_USERNAME;
const LDAP_PASSWORD = process.env.LDAP_PASSWORD;

function hasInternetConnection() {
	return new Promise((resolve) => {
		const req = https.get(TEST_URL, (res) => {
			resolve(true);
		});
		req.on("error", (err) => {
			resolve(false);
		});
		req.setTimeout(1000, () => {
			req.destroy();
			resolve(false);
		});
	});
}

async function loginToLdap() {
	if (!LDAP_URL) {
		throw new Error("PUPPETEER_LDAP_URL is not set in your environment.");
	}
	const browser = await puppeteer.launch({
		headless: true,
		ignoreHTTPSErrors: true,
		args: [
			"--no-sandbox",
			"--disable-setuid-sandbox",
			"--ignore-certificate-errors",
			"--disable-web-security",
			"--disable-features=IsolateOrigins,site-per-process"
		]
	});
	const page = await browser.newPage();
	try {
		await page.goto(TEST_URL, { waitUntil: "networkidle0" });

		// TODO: Update selectors below to match your LDAP login page
		await page.type('input[name="username"]', LDAP_USERNAME);
		await page.type('input[name="password"]', LDAP_PASSWORD);
		await page.click('button[type="submit"]');

		// Wait for navigation or success indication
		await page.waitForTimeout(5000);
		await browser.close();
	} catch (error) {
		await page.reload({ waitUntil: "networkidle0" });
		// TODO: Update selectors below to match your LDAP login page
		await page.type('input[name="username"]', LDAP_USERNAME);
		await page.type('input[name="password"]', LDAP_PASSWORD);
		await page.click('input[type="submit"]');
		await page.waitForTimeout(5000);
		await browser.close();
	}
}

const main = async () => {
	if (await hasInternetConnection()) {
		console.log("Internet connection is active.");
	} else {
		console.log("No internet connection. Attempting LDAP login...");
		await loginToLdap();
	}
};

await main();
