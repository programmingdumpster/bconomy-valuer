# Bconomy Inventory Value Calculator

This is a simple browser extension designed for the Bconomy online game. It helps you calculate the total base worth and market worth of items in your inventory, providing a quick overview of your assets and the difference between their base and market values.

{preview}
https://cdn.discordapp.com/attachments/1325192596800147606/1391765632764219483/2025-07-07_14-55-33.mov?ex=686d1640&is=686bc4c0&hm=1000eacffbaeb5316915ebeb04c7af8fe8558d4a963ab04369f87504c32167a4&


## Features

* Calculates total base worth of all items in your inventory.
* Calculates total market worth of all items in your inventory.
* Displays the percentage difference between market and base worth.
* Compact, collapsible UI panel that can be hidden or completely closed.
* "Show Inventory Value" button in the sidebar to easily bring back the panel if closed.

## Installation (for Developers/Testers)

This extension is not currently available on official browser stores. You can load it as a temporary or unpacked extension in your browser.

### Prerequisites

* A web browser (e.g., Mozilla Firefox, Google Chrome, Microsoft Edge).
* The extension's project folder (containing `manifest.json` and `content.js`).

### Steps for Mozilla Firefox

1.  **Download the Extension Files:** Obtain the entire extension folder (containing `manifest.json` and `content.js`). You can usually download it as a ZIP archive from the GitHub repository and then extract it.
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

1.  **Download the Extension Files:** Obtain the entire extension folder (containing `manifest.json` and `content.js`). Download it as a ZIP archive from the GitHub repository and extract it.
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
2.  **Go to "Items" Tab:** Once logged in, go to the "Items" section of the game.
3.  **Refresh the Page:** It's recommended to refresh the page (F5 or Ctrl+R) after installing the extension to ensure it loads correctly.
4.  **Locate the Calculator Panel:** A small panel titled "Inventory Value" will appear in the top-right corner of your screen.
5.  **Start Calculation:** Click the "Recalculate" button within the panel to start the inventory value calculation. The extension will automatically open and close item info popups to gather data.
6.  **Hide/Show Panel:** Use the `_` (underscore) button to minimize the panel (keeping only the title and buttons visible) or `+` to expand it.
7.  **Close Panel:** Use the `&times;` (X) button to completely hide the panel.
8.  **Re-open Closed Panel:** If you close the panel, a "Show Inventory Value" button will appear in the left sidebar of the game, allowing you to bring the panel back.

---

## Disclaimer

This extension is provided as-is and may require updates if the Bconomy game's website structure changes. Use at your own risk.

---

**Discord: @programmingdumpster**
