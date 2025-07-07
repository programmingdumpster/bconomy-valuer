// discord: @programmingdumpster
// content.js

const ITEM_LIST_ITEM_SELECTOR = 'div[style*="position: relative;"][style*="width: 100%;"][style*="height: 40px;"][style*="background-color: rgb(56, 56, 56);"][style*="border-radius: 5px;"][style*="margin-top: 5px;"][style*="cursor: pointer;"][style*="overflow: hidden;"]';
const MODAL_BODY_SELECTOR = 'div.modal-body';
const CLOSE_BUTTON_SELECTOR = 'button.btn-close';

const CLICK_DELAY_MS = 150;
const READ_DELAY_MS = 100;
const CLOSE_DELAY_MS = 150;

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function parseBCValue(text) {
    if (!text) return 0;
    const cleanedText = text.replace(/BC\/ea|BC|ea|[^0-9.]/g, '');
    return parseFloat(cleanedText);
}

let lastCalculatedResults = {
    baseWorth: 0,
    marketWorth: 0,
    totalItems: 0
};

async function calculateInventoryValue() {
    let currentBaseWorth = 0;
    let currentMarketWorth = 0;
    const itemsProcessed = new Set();

    const itemElements = document.querySelectorAll(ITEM_LIST_ITEM_SELECTOR);

    if (itemElements.length === 0) {
        lastCalculatedResults = { baseWorth: 0, marketWorth: 0, totalItems: 0 };
        displayResults(0, 0, 0);
        return;
    }

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
            min-width: 150px;
            transition: width 0.3s ease-in-out, height 0.3s ease-in-out, padding 0.3s ease-in-out;
            overflow: hidden;
        `;
        document.body.appendChild(statusDisplay);
    }
    statusDisplay.style.display = 'block';
    statusDisplay.style.width = '300px';
    statusDisplay.style.height = 'auto';
    statusDisplay.style.padding = '10px';

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

    attachPanelListeners();

    for (let i = 0; i < itemElements.length; i++) {
        const itemElement = itemElements[i];

        const quantitySpan = itemElement.querySelector('div[style*="left: 45px;"] span[style*="font-weight: 700;"]');
        const nameSpan = itemElement.querySelector('div[style*="left: 45px;"] span[style*="font-weight: 400;"]');

        if (!quantitySpan || !nameSpan) {
            document.getElementById('calculatorContent').querySelector('p:nth-child(2)').textContent = `Processed: ${i + 1}/${itemElements.length}`;
            continue;
        }

        const quantity = parseInt(quantitySpan.innerText.replace(/,/g, ''));
        const itemName = nameSpan.innerText.trim();

        if (itemsProcessed.has(itemName)) {
            document.getElementById('calculatorContent').querySelector('p:nth-child(2)').textContent = `Processed: ${i + 1}/${itemElements.length}`;
            continue;
        }

        document.getElementById('calculatorContent').querySelector('p:nth-child(1)').textContent = `Status: Processing "${itemName}"...`;
        document.getElementById('calculatorContent').querySelector('p:nth-child(2)').textContent = `Processed: ${i + 1}/${itemElements.length}`;

        const infoButtons = itemElement.querySelectorAll('button.btn.btn-secondary');
        let infoButton = null;
        for (const btn of infoButtons) {
            if (btn.innerText.trim() === 'Info') {
                infoButton = btn;
                break;
            }
        }

        if (!infoButton) {
            continue;
        }

        infoButton.click();
        await delay(CLICK_DELAY_MS);

        const modalBody = await waitForElement(MODAL_BODY_SELECTOR, 5000);
        if (!modalBody) {
            const closeBtn = document.querySelector(CLOSE_BUTTON_SELECTOR);
            if (closeBtn) closeBtn.click();
            await delay(CLOSE_DELAY_MS);
            continue;
        }

        const baseWorthElement = Array.from(modalBody.querySelectorAll('p')).find(p => p.innerText.includes('base worth'));
        let baseWorthPerItem = 0;
        if (baseWorthElement) {
            baseWorthPerItem = parseBCValue(baseWorthElement.innerText);
            currentBaseWorth += quantity * baseWorthPerItem;
        }

        const marketWorthElement = Array.from(modalBody.querySelectorAll('p')).find(p => p.innerText.includes('on Market'));
        let marketWorthPerItem = 0;
        if (marketWorthElement) {
            marketWorthPerItem = parseBCValue(marketWorthElement.innerText);
            currentMarketWorth += quantity * marketWorthPerItem;
        }
        
        itemsProcessed.add(itemName);

        const closeButton = document.querySelector(CLOSE_BUTTON_SELECTOR);
        if (closeButton) {
            closeButton.click();
        }
        await delay(CLOSE_DELAY_MS);
    }

    lastCalculatedResults = {
        baseWorth: currentBaseWorth,
        marketWorth: currentMarketWorth,
        totalItems: itemElements.length
    };
    displayResults(currentBaseWorth, currentMarketWorth, itemElements.length);
}

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
                resolve(null);
            }
        }, 50);
    });
}

function displayResults(baseWorth, marketWorth, totalItems) {
    let resultDisplay = document.getElementById('bconomy-value-status');
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
    resultDisplay.style.display = 'block';
    resultDisplay.style.width = '300px';
    resultDisplay.style.height = 'auto';
    resultDisplay.style.padding = '10px';

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

    attachPanelListeners();
}

function attachPanelListeners() {
    const resultDisplay = document.getElementById('bconomy-value-status');
    const calculatorContent = document.getElementById('calculatorContent');
    const hideShowButton = document.getElementById('hideShowButton');
    const closeButton = document.getElementById('closeButton');
    const recalculateButton = document.getElementById('recalculateButton');

    if (hideShowButton && calculatorContent && resultDisplay) {
        hideShowButton.onclick = () => {
            if (calculatorContent.style.display === 'none') {
                calculatorContent.style.display = 'block';
                resultDisplay.style.width = '300px';
                resultDisplay.style.height = 'auto';
                resultDisplay.style.padding = '10px';
                hideShowButton.textContent = '_';
            } else {
                calculatorContent.style.display = 'none';
                resultDisplay.style.width = 'fit-content';
                resultDisplay.style.height = 'fit-content';
                resultDisplay.style.padding = '5px 10px';
                hideShowButton.textContent = '+';
            }
        };
    }

    if (closeButton && resultDisplay) {
        closeButton.onclick = () => {
            resultDisplay.style.display = 'none';
            const showValueSidebarButton = document.getElementById('show-bconomy-value-button');
            if (showValueSidebarButton) {
                showValueSidebarButton.style.display = 'block';
            }
        };
    }

    if (recalculateButton) {
        recalculateButton.onclick = () => {
            calculateInventoryValue();
        };
    }
}

function formatBC(num) {
    return num.toLocaleString('en-US');
}

function addShowValueButtonToSidebar() {
    const navMenu = document.querySelector('div.sidebar-nav');

    if (navMenu) {
        const showValueButton = document.createElement('div');
        showValueButton.id = 'show-bconomy-value-button';
        showValueButton.innerHTML = `
            <div class="sidebar-item" style="cursor: pointer; padding: 10px; background-color: #383838; border-radius: 5px; margin-top: 5px;">
                <span style="font-weight: bold; color: white;">Show Inventory Value</span>
            </div>
        `;
        showValueButton.style.cssText = `
            margin-top: 10px;
            display: none;
        `;

        const marketItem = navMenu.querySelector('a[href="/market"]');
        if (marketItem && marketItem.parentElement) {
             marketItem.parentElement.insertAdjacentElement('afterend', showValueButton);
        } else {
             navMenu.appendChild(showValueButton);
        }
       
        showValueButton.onclick = () => {
            displayResults(lastCalculatedResults.baseWorth, lastCalculatedResults.marketWorth, lastCalculatedResults.totalItems);
            const statusDisplay = document.getElementById('bconomy-value-status');
            if (statusDisplay) {
                statusDisplay.style.display = 'block';
            }
            showValueButton.style.display = 'none';
        };
    }
}

window.addEventListener('load', () => {
    if (window.location.href.includes('bconomy.net')) {
        addShowValueButtonToSidebar();
        setTimeout(calculateInventoryValue, 1000); 
    }
});
