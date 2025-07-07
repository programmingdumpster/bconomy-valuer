// content.js

console.log("Bconomy Inventory Value Calculator content script loaded.");

// General selector for an item row
const ITEM_LIST_ITEM_SELECTOR = 'div[style*="position: relative;"][style*="width: 100%;"][style*="height: 40px;"][style*="background-color: rgb(56, 56, 56);"][style*="border-radius: 5px;"][style*="margin-top: 5px;"][style*="cursor: pointer;"][style*="overflow: hidden;"]';
// Selector for the modal popup body
const MODAL_BODY_SELECTOR = 'div.modal-body';
// Selector for the close button in the modal
const CLOSE_BUTTON_SELECTOR = 'button.btn-close';

// Delays to prevent overwhelming the game server or UI
const CLICK_DELAY_MS = 150; // Delay after clicking "Info"
const READ_DELAY_MS = 100; // Delay before trying to read from popup
const CLOSE_DELAY_MS = 150; // Delay after closing popup, before next item

// Helper function to create a delay
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to clean and parse BC values (e.g., "570,000 BC/ea" -> 570000)
function parseBCValue(text) {
    if (!text) return 0;
    // Remove "BC/ea", commas, and anything that isn't a digit or dot
    const cleanedText = text.replace(/BC\/ea|BC|ea|[^0-9.]/g, '');
    return parseFloat(cleanedText);
}

// Global variable to store results, so we can re-display without recalculating
let lastCalculatedResults = {
    baseWorth: 0,
    marketWorth: 0,
    totalItems: 0
};

// Main function to calculate inventory value
async function calculateInventoryValue() {
    console.log("Starting inventory value calculation...");

    let currentBaseWorth = 0;
    let currentMarketWorth = 0;
    const itemsProcessed = new Set(); // To prevent reprocessing if items list reloads

    // Select all item elements
    const itemElements = document.querySelectorAll(ITEM_LIST_ITEM_SELECTOR);

    if (itemElements.length === 0) {
        console.warn("No item elements found on the page.");
        lastCalculatedResults = { baseWorth: 0, marketWorth: 0, totalItems: 0 };
        displayResults(0, 0, 0);
        return;
    }

    // Create or update display area for status and results
    let statusDisplay = document.getElementById('bconomy-value-status');
    if (!statusDisplay) {
        statusDisplay = document.createElement('div');
        statusDisplay.id = 'bconomy-value-status';
        statusDisplay.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background-color: rgba(40, 44, 52, 0.9);
            color: white;
            padding: 10px;
            border-radius: 8px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            border: 1px solid #4CAF50;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            max-width: 300px;
            min-width: 150px; /* Ensure it doesn't get too small */
            transition: width 0.3s ease-in-out, height 0.3s ease-in-out, padding 0.3s ease-in-out;
            overflow: hidden; /* Hide overflow when minimized */
        `;
        document.body.appendChild(statusDisplay);
    }
    // Show the display if it was hidden
    statusDisplay.style.display = 'block';
    statusDisplay.style.width = '300px'; // Reset width for full view
    statusDisplay.style.height = 'auto'; // Reset height for full view
    statusDisplay.style.padding = '10px'; // Reset padding

    // Set initial status content
    statusDisplay.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <h3 style="margin: 0;">Inventory Value</h3>
            <div>
                <button id="hideShowButton" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; padding: 0 5px;">_</button>
                <button id="closeButton" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; padding: 0 5px;">&times;</button>
            </div>
        </div>
        <div id="calculatorContent">
            <p>Status: Initializing...</p>
            <p>Processed: 0/${itemElements.length}</p>
            <p>Base Worth: Loading...</p>
            <p>Market Worth: Loading...</p>
            <p>Market vs Base Difference: Loading...</p>
            <button id="recalculateButton" style="width: 100%; padding: 8px; margin-top: 10px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Recalculate</button>
        </div>
    `;

    // Attach listeners for hide/show and close buttons immediately
    attachPanelListeners();


    for (let i = 0; i < itemElements.length; i++) {
        const itemElement = itemElements[i];

        // Extract item name and quantity from the list view
        // Quantity is font-weight: 700
        const quantitySpan = itemElement.querySelector('div[style*="left: 45px;"] span[style*="font-weight: 700;"]');
        // Name is font-weight: 400
        const nameSpan = itemElement.querySelector('div[style*="left: 45px;"] span[style*="font-weight: 400;"]');

        if (!quantitySpan || !nameSpan) {
            console.warn("Could not find quantity or name for an item element.", itemElement);
            // Update processed count even for skipped items to reflect accurate progress
            document.getElementById('calculatorContent').querySelector('p:nth-child(2)').textContent = `Processed: ${i + 1}/${itemElements.length}`;
            continue;
        }

        const quantity = parseInt(quantitySpan.innerText.replace(/,/g, ''));
        const itemName = nameSpan.innerText.trim();

        // Use itemName as part of the processed items key to avoid issues with similar names if any
        if (itemsProcessed.has(itemName)) {
            console.log(`Skipping already processed item: ${itemName}`);
            document.getElementById('calculatorContent').querySelector('p:nth-child(2)').textContent = `Processed: ${i + 1}/${itemElements.length}`;
            continue; // Skip if already processed
        }

        document.getElementById('calculatorContent').querySelector('p:nth-child(1)').textContent = `Status: Processing "${itemName}"...`;
        document.getElementById('calculatorContent').querySelector('p:nth-child(2)').textContent = `Processed: ${i + 1}/${itemElements.length}`;

        // Find the "Info" button for this specific item.
        // We look for a button with classes 'btn' and 'btn-secondary' within the item element,
        // and then check its text content.
        const infoButtons = itemElement.querySelectorAll('button.btn.btn-secondary');
        let infoButton = null;
        for (const btn of infoButtons) {
            if (btn.innerText.trim() === 'Info') {
                infoButton = btn;
                break;
            }
        }

        if (!infoButton) {
            console.warn(`"Info" button not found for item: ${itemName}`);
            continue;
        }

        // Click the "Info" button to open the modal
        infoButton.click();
        await delay(CLICK_DELAY_MS); // Wait for the modal to start opening

        // Wait for the modal content to appear
        const modalBody = await waitForElement(MODAL_BODY_SELECTOR, 5000); // Max 5 seconds wait
        if (!modalBody) {
            console.error(`Modal for ${itemName} did not appear or was not found within timeout.`);
            // Try to close any open modal if it somehow failed
            const closeBtn = document.querySelector(CLOSE_BUTTON_SELECTOR); //
            if (closeBtn) closeBtn.click();
            await delay(CLOSE_DELAY_MS);
            continue;
        }

        // Extract Base Worth
        // Use text content check instead of :contains()
        const baseWorthElement = Array.from(modalBody.querySelectorAll('p')).find(p => p.innerText.includes('base worth'));
        let baseWorthPerItem = 0;
        if (baseWorthElement) {
            baseWorthPerItem = parseBCValue(baseWorthElement.innerText);
            currentBaseWorth += quantity * baseWorthPerItem;
        } else {
            console.warn(`Base worth element not found for ${itemName}.`);
        }

        // Extract Market Worth
        // Use text content check instead of :contains()
        const marketWorthElement = Array.from(modalBody.querySelectorAll('p')).find(p => p.innerText.includes('on Market'));
        let marketWorthPerItem = 0;
        if (marketWorthElement) {
            marketWorthPerItem = parseBCValue(marketWorthElement.innerText);
            currentMarketWorth += quantity * marketWorthPerItem;
        } else {
            console.warn(`Market worth element not found for ${itemName}.`);
        }
        
        itemsProcessed.add(itemName); // Mark as processed

        // Find and click the close button to close the modal
        const closeButton = document.querySelector(CLOSE_BUTTON_SELECTOR); // Use document to query for the modal's close button
        if (closeButton) {
            closeButton.click();
        } else {
            console.warn("Close button not found in modal. This might cause issues for subsequent items.");
        }
        await delay(CLOSE_DELAY_MS); // Give time for modal to close before next action
    }

    lastCalculatedResults = {
        baseWorth: currentBaseWorth,
        marketWorth: currentMarketWorth,
        totalItems: itemElements.length
    };
    displayResults(currentBaseWorth, currentMarketWorth, itemElements.length);
    console.log("Inventory value calculation finished.");
}

// Helper function to wait for an element to appear in the DOM
function waitForElement(selector, timeout = 3000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            const element = document.querySelector(selector);
            if (element) {
                clearInterval(interval);
                resolve(element);
            } else if (Date.now() - startTime > timeout) {
                clearInterval(interval);
                console.error(`Timeout waiting for element: ${selector}`);
                resolve(null); // Resolve with null if timeout
            }
        }, 50); // Check every 50ms
    });
}

// Function to display results on the page
function displayResults(baseWorth, marketWorth, totalItems) {
    let resultDisplay = document.getElementById('bconomy-value-status');
    // If resultDisplay doesn't exist, create it (e.g., if re-run after closing)
    if (!resultDisplay) {
        resultDisplay = document.createElement('div');
        resultDisplay.id = 'bconomy-value-status';
        resultDisplay.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background-color: rgba(40, 44, 52, 0.9);
            color: white;
            padding: 10px;
            border-radius: 8px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            border: 1px solid #4CAF50;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            max-width: 300px;
            min-width: 150px;
            transition: width 0.3s ease-in-out, height 0.3s ease-in-out, padding 0.3s ease-in-out;
            overflow: hidden;
        `;
        document.body.appendChild(resultDisplay);
    }
    // Ensure it's visible if it was created or hidden
    resultDisplay.style.display = 'block';
    resultDisplay.style.width = '300px'; // Full width
    resultDisplay.style.height = 'auto'; // Auto height
    resultDisplay.style.padding = '10px'; // Full padding

    let marketVsBaseDifference = 0;
    if (baseWorth > 0) {
        marketVsBaseDifference = ((marketWorth - baseWorth) / baseWorth) * 100;
    }

    resultDisplay.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <h3 style="margin: 0;">Inventory Value</h3>
            <div>
                <button id="hideShowButton" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; padding: 0 5px;">_</button>
                <button id="closeButton" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; padding: 0 5px;">&times;</button>
            </div>
        </div>
        <div id="calculatorContent">
            <p>Status: Calculation Complete!</p>
            <p>Processed Items: ${totalItems}</p>
            <p>Total Base Worth: <strong>${formatBC(baseWorth)} BC</strong></p>
            <p>Total Market Worth: <strong>${formatBC(marketWorth)} BC</strong></p>
            <p>Market vs Base Diff: <strong>${marketVsBaseDifference.toFixed(2)}% ${marketVsBaseDifference >= 0 ? 'higher' : 'lower'}</strong></p>
            <button id="recalculateButton" style="width: 100%; padding: 8px; margin-top: 10px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Recalculate</button>
        </div>
    `;

    attachPanelListeners(); // Re-attach listeners after updating innerHTML
}

function attachPanelListeners() {
    const resultDisplay = document.getElementById('bconomy-value-status');
    const calculatorContent = document.getElementById('calculatorContent');
    const hideShowButton = document.getElementById('hideShowButton');
    const closeButton = document.getElementById('closeButton');
    const recalculateButton = document.getElementById('recalculateButton');

    if (hideShowButton && calculatorContent && resultDisplay) {
        hideShowButton.onclick = () => { // Use onclick to easily replace handler if innerHTML is updated
            if (calculatorContent.style.display === 'none') {
                // Show content
                calculatorContent.style.display = 'block';
                resultDisplay.style.width = '300px'; // Full width
                resultDisplay.style.height = 'auto'; // Auto height
                resultDisplay.style.padding = '10px'; // Full padding
                hideShowButton.textContent = '_'; // Minimize icon
            } else {
                // Hide content, keep title and buttons visible
                calculatorContent.style.display = 'none';
                resultDisplay.style.width = 'fit-content'; // Shrink to content width (title + buttons)
                resultDisplay.style.height = 'fit-content'; // Shrink to content height
                resultDisplay.style.padding = '5px 10px'; // Smaller padding
                hideShowButton.textContent = '+'; // Maximize icon
            }
        };
    }

    if (closeButton && resultDisplay) {
        closeButton.onclick = () => { // Use onclick
            resultDisplay.style.display = 'none'; // Completely hide the panel
            // Also update the "Show Value" button in the sidebar if it exists
            const showValueSidebarButton = document.getElementById('show-bconomy-value-button');
            if (showValueSidebarButton) {
                showValueSidebarButton.style.display = 'block'; // Make sure sidebar button is visible
            }
        };
    }

    if (recalculateButton) {
        recalculateButton.onclick = () => { // Use onclick
            calculateInventoryValue(); // Re-run the calculation
        };
    }
}


// Helper function to format large BC numbers with commas
function formatBC(num) {
    return num.toLocaleString('en-US');
}

// Function to add a button to the sidebar to re-show the panel
function addShowValueButtonToSidebar() {
    // Find the navigation menu where "Items", "Market" etc. are located
    // Based on provided screenshots, it looks like a div with a specific structure.
    // Let's try to target based on common parent for items/market.
    // This selector might need adjustment if the game's HTML structure changes.
    const navMenu = document.querySelector('div.sidebar-nav'); // Adjust this selector if needed based on actual HTML

    if (navMenu) {
        // Create the new button element
        const showValueButton = document.createElement('div');
        showValueButton.id = 'show-bconomy-value-button';
        showValueButton.innerHTML = `
            <div class="sidebar-item" style="cursor: pointer; padding: 10px; background-color: #383838; border-radius: 5px; margin-top: 5px;">
                <span style="font-weight: bold; color: white;">Show Inventory Value</span>
            </div>
        `;
        showValueButton.style.cssText = `
            margin-top: 10px;
            display: none; /* Hidden by default, only shown if panel is closed */
        `;

        // Find a good place to insert it. For example, after "Market" or "Coinflip" if they exist.
        // Or simply append to the nav menu.
        const marketItem = navMenu.querySelector('a[href="/market"]'); // Find the market link to insert after it
        if (marketItem && marketItem.parentElement) {
             marketItem.parentElement.insertAdjacentElement('afterend', showValueButton);
        } else {
             navMenu.appendChild(showValueButton);
        }
       
        // Add event listener to the button
        showValueButton.onclick = () => {
            // Restore the last calculated results or start a new calculation
            displayResults(lastCalculatedResults.baseWorth, lastCalculatedResults.marketWorth, lastCalculatedResults.totalItems);
            const statusDisplay = document.getElementById('bconomy-value-status');
            if (statusDisplay) {
                statusDisplay.style.display = 'block'; // Ensure the panel is visible
            }
            showValueButton.style.display = 'none'; // Hide this sidebar button
        };
    }
}


// Start the calculation when the page is fully loaded
window.addEventListener('load', () => {
    // Only run if on the items page (you might want a more robust check)
    if (window.location.href.includes('bconomy.net')) {
        // Add the show value button to the sidebar
        addShowValueButtonToSidebar();
        // We might want to put a small delay here too, to ensure all items are rendered
        setTimeout(calculateInventoryValue, 1000); 
    }
});