# Node.js Puppeteer Internet Connection Checker

This app uses Puppeteer to check if your computer has an active internet connection. If not, it opens the network LDAP login page and enters credentials automatically.

## Features
- Checks for active internet connection by attempting to access a reliable website (e.g., https://www.google.com).
- If offline, opens the LDAP login page and fills in credentials.

## Setup
1. Install dependencies:
   ```sh
   npm install
   ```
2. Set your LDAP credentials in the `.env` file (see `.env.example`).
3. Run the app:
   ```sh
   node index.js
   ```

## Security
- **Never commit your real credentials.** Use environment variables or a secrets manager.

## Requirements
- Node.js 16+
- Google Chrome (Puppeteer will download Chromium by default, but you can configure it to use your installed Chrome)

---

Replace placeholder URLs and credentials as needed for your environment.
