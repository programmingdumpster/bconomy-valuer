# Bconomy Inventory Value Calculator

This is a simple browser extension designed for the Bconomy online game. It helps you calculate the total base worth and market worth of items in your inventory, providing a quick overview of your assets and the difference between their base and market values.

## Features

* Calculates total base worth of all items in your inventory.
* Calculates total market worth of all items in your inventory.
* Allows input of a specific Player ID for calculation.
* Displays the top 10 most valuable items in the browser console (thats mostly for checking if someone has eq flooded with high market value craftables that noone buys ) .
* A fixed calculator icon appears on the page to open the modal.
 

## Installation 

This extension is not currently available on official browser stores. You can load it as a temporary or unpacked extension in your browser.

### Prerequisites

* A web browser (e.g., Mozilla Firefox, Google Chrome, Microsoft Edge).
* The extension's project folder (containing `manifest.json`, `content.js`, `background.js`, `modal.html`, `modal.css`, and `icons/calculator_icon.png`).
* A Bconomy API Key (obtained from Bconomy.net console).

### Steps for Mozilla Firefox

1.  **Download the Extension Files:** Obtain the entire extension folder. You can usually download it as a ZIP archive from the GitHub repository and then extract it.
2.  **Open `about:debugging`:**
    * Open a new tab in Firefox.
    * Type `about:debugging` in the address bar and press Enter.
3.  **Navigate to "This Firefox" (or "Firefox" for older versions):** On the left sidebar, click on "This Firefox".
4.  **Click "Load Temporary Add-on...":**
    * Click the "Load Temporary Add-on..." button.
    * A file dialog will open. Navigate to the folder where you extracted the extension files.
    * **Select the `manifest.json` file** inside that folder and click "Open".
5.  **Verify Installation:** The extension should now appear in the list of temporary add-ons.

### Steps for Google Chrome / Microsoft Edge

1.  **Download the Extension Files:** Obtain the entire extension folder. Download it as a ZIP archive from the GitHub repository and extract it.
2.  **Open Extensions Page:**
    * Open a new tab.
    * Type `chrome://extensions` (for Chrome) or `edge://extensions` (for Edge) in the address bar and press Enter.
3.  **Enable "Developer mode":** In the top right corner of the extensions page, toggle on the "Developer mode" switch.
4.  **Click "Load unpacked":**
    * Click the "Load unpacked" button that appears.
    * A file dialog will open. Navigate to and **select the entire extension folder** (not just the `manifest.json` file) and click "Select Folder".
5.  **Verify Installation:** The extension should now appear in your list of extensions.

---

## Usage

1.  **Open Bconomy.net:** Navigate to the Bconomy online game in your browser.
2.  **Locate the Calculator Icon:** A calculator icon will appear in the bottom-right corner of your screen.
3.  **Click the Icon:** Click the calculator icon to open the Bconomy Inventory Calculator modal window.
4.  **Enter API Key:** In the modal, enter your Bconomy API Key in the designated input field and click "Save API Key". This key will be stored securely.
5.  **Enter Player ID:** Enter the Bconomy Player ID for whom you want to calculate the inventory value.
6.  **Start Calculation:** Click the "Calculate Inventory Value" button. The modal will update with the status of the calculation, and once complete, it will display the total market worth and base worth. The top 10 most valuable items will be logged in your browser's console (F12 to open developer tools, then navigate to the "Console" tab).
7.  **Close Modal:** Use the "X" button in the top right of the modal to close it. You can reopen it at any time by clicking the calculator icon.

---

## Disclaimer

This extension is provided as-is and may require updates if the Bconomy game's website structure changes. Use at your own risk.

---

**Discord: @programmingdumpster**
