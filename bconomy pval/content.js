/* discord: @programmingdumpster */

console.log("Bconomy Inventory Calculator content script loaded.");

const BCONOMY_API_ENDPOINT = "https://bconomy.net/api/data";
let BCONOMY_API_KEY = "";

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function formatBC(num) {
    if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) {
        return 'N/A';
    }
    return num.toLocaleString('en-US');
}

let cachedItemData = null;
let cachedMarketPricesData = null;
let lastMarketPriceFetchTime = 0;
const MARKET_CACHE_DURATION = 5 * 60 * 1000;

async function fetchBconomyApi(type, id = null, itemId = null, date = null) {
    if (!BCONOMY_API_KEY) {
        updateModalStatus("Error: API Key Not Set. Please enter and save your API Key.", "error");
        return null;
    }

    const body = { type: type };
    if (id !== null) {
        body.id = id;
    } else if (itemId !== null) {
        body.itemId = itemId;
    }
    if (date !== null) body.date = date;

    try {
        const rawData = await fetch(BCONOMY_API_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": BCONOMY_API_KEY,
            },
            body: JSON.stringify(body),
        });

        if (!rawData.ok) {
            console.error(`API call failed for type "${type}" with status: ${rawData.status} ${rawData.statusText}`);
            const errorText = await rawData.text();
            console.error("Error details:", errorText);
            let errorMessage = `API Error: ${rawData.status} ${rawData.statusText}`;
            if (rawData.status === 403) {
                errorMessage = "API Error: Invalid API Key. Please check your key.";
            } else if (rawData.status === 400 && errorText.includes("Invalid ID specified")) {
                errorMessage = "API Error: Invalid Player ID. Please ensure the ID is correct.";
            }
            updateModalStatus(errorMessage, "error");
            return null;
        }

        const parsedData = await rawData.json();
        return parsedData;
    } catch (error) {
        console.error("Error fetching Bconomy API:", error);
        updateModalStatus("API Error: Network/Unknown issue during fetch.", "error");
        return null;
    }
}

async function getItemData() {
    if (cachedItemData) {
        console.log("Using cached Item Data.");
        return cachedItemData;
    }
    updateModalStatus("Status: Fetching item data...", "info");
    const data = await fetchBconomyApi("itemData");
    if (data) {
        cachedItemData = new Map();
        data.forEach(item => {
            cachedItemData.set(item.flatId, item);
            if (item.id !== undefined && item.id !== null) {
                cachedItemData.set(item.id, item);
            }
        });
        console.log("Item Data cached.");
    }
    return cachedItemData;
}

async function getMarketPrices() {
    if (cachedMarketPricesData && (Date.now() - lastMarketPriceFetchTime < MARKET_CACHE_DURATION)) {
        console.log("Using cached Market Prices.");
        return cachedMarketPricesData;
    }
    updateModalStatus("Status: Fetching market prices...", "info");
    const fullMarketPreview = await fetchBconomyApi("marketPreview");
    if (fullMarketPreview && fullMarketPreview.data) {
        cachedMarketPricesData = fullMarketPreview.data;
        lastMarketPriceFetchTime = Date.now();
        console.log("Market Prices cached.");
    } else {
        console.warn("Failed to fetch market preview data or it has an unexpected structure.");
        cachedMarketPricesData = null;
    }
    return cachedMarketPricesData;
}

async function calculateInventoryValue(playerBcId) {
    if (!BCONOMY_API_KEY) {
        updateModalStatus("Error: API Key Not Set. Please enter and save your API Key.", "error");
        return;
    }
    if (!playerBcId) {
        updateModalStatus("Error: Player ID not provided for calculation.", "error");
        return;
    }

    updateModalStatus("Status: Initializing calculation...", "info");
    setModalCalculationResult("Loading...", "Loading...");
    setModalPlayerName("Processing Player...");


    const itemDataMap = await getItemData();
    if (!itemDataMap) {
        updateModalStatus("Failed to fetch item data.", "error");
        return;
    }

    updateModalStatus("Status: Fetching player profile...", "info");
    const playerProfile = await fetchBconomyApi("profile", playerBcId);
    if (!playerProfile || !playerProfile.name) {
        updateModalStatus(`Failed to fetch profile for ID ${playerBcId}. Please check the ID.`, "error");
        setModalPlayerName(`Player ${playerBcId} (Unknown)`);
        setModalCalculationResult("N/A", "N/A");
        return;
    }
    const playerName = playerProfile.name;
    setModalPlayerName(`${playerName} #${playerBcId}`);


    updateModalStatus("Status: Fetching inventory...", "info");
    const flatInventory = await fetchBconomyApi("flatInventory", playerBcId);
    if (!flatInventory) {
        updateModalStatus(`Failed to fetch inventory for ${playerName}.`, "error");
        setModalCalculationResult("N/A", "N/A");
        return;
    }

    updateModalStatus("Status: Fetching market prices...", "info");
    const marketPrices = await getMarketPrices();
    if (!marketPrices) {
        updateModalStatus("Failed to fetch market prices.", "error");
        setModalCalculationResult("N/A", "N/A");
        return;
    }

    let currentBaseWorth = 0;
    let currentMarketWorth = 0;
    let totalItemsCount = 0;
    const inventorySize = Object.keys(flatInventory).length;
    
    const itemValueDetails = []; 

    for (const flatId in flatInventory) {
        const quantity = flatInventory[flatId];
        const item = itemDataMap.get(flatId);

        if (item) {
            totalItemsCount++;
            updateModalStatus(`Status: Processing "${item.name}"... (${totalItemsCount}/${inventorySize})`, "info");

            const baseWorthPerItem = typeof item.cost === 'number' ? item.cost : 0;
            const marketPricePerItem = typeof marketPrices[flatId] === 'number' ? marketPrices[flatId] : baseWorthPerItem;
            
            const totalBaseValue = quantity * baseWorthPerItem;
            const totalMarketValue = quantity * marketPricePerItem;

            currentBaseWorth += totalBaseValue;
            currentMarketWorth += totalMarketValue;

            itemValueDetails.push({
                name: item.name,
                quantity: quantity,
                baseValue: totalBaseValue,
                marketValue: totalMarketValue,
                basePricePerUnit: baseWorthPerItem,
                marketPricePerUnit: marketPricePerItem
            });

        } else {
            console.warn(`Item with flatId ${flatId} not found in itemDataMap.`);
        }
    }

    setModalCalculationResult(currentMarketWorth, currentBaseWorth);
    updateModalStatus("Calculation Complete!", "success");
    console.log(`Inventory value calculation finished for ${playerName} (ID: ${playerBcId}).`);

    displayTop10ItemsInConsole(itemValueDetails);
}

function displayTop10ItemsInConsole(itemValueDetails) {
    if (!itemValueDetails || itemValueDetails.length === 0) {
        console.log("No items found in inventory to display top 10.");
        return;
    }

    itemValueDetails.sort((a, b) => b.marketValue - a.marketValue);

    console.groupCollapsed("💰 Top 10 Most Valuable Items by Market Worth 💰");
    console.log("----------------------------------------------------------------------------------");
    console.log("%c#  Name (Qty)                          Market Value           Base Value", "font-weight: bold; color: #007bff;");
    console.log("----------------------------------------------------------------------------------");

    const top10 = itemValueDetails.slice(0, 10);

    top10.forEach((item, index) => {
        const marketWorthFormatted = formatBC(item.marketValue) + " BC";
        const baseWorthFormatted = formatBC(item.baseValue) + " BC";
        
        const nameAndQty = `${item.name} (${item.quantity})`;
        const paddedName = nameAndQty.padEnd(30);
        const paddedMarket = marketWorthFormatted.padEnd(20);

        console.log(`${String(index + 1).padEnd(3)}. ${paddedName} ${paddedMarket} ${baseWorthFormatted}`);
    });
    console.log("----------------------------------------------------------------------------------");
    console.groupEnd();
}


let modalContainer = null;
let isModalReady = false;

async function createModal() {
    if (isModalReady) return;

    modalContainer = document.createElement('div');
    modalContainer.id = 'bconomy-calculator-modal-container';
    modalContainer.style.display = 'none'; 
    document.body.appendChild(modalContainer);

    const modalHtmlUrl = chrome.runtime.getURL('modal.html');
    try {
        const response = await fetch(modalHtmlUrl);
        if (!response.ok) {
            throw new Error(`Failed to load modal.html: ${response.statusText}`);
        }
        modalContainer.innerHTML = await response.text();
    } catch (error) {
        console.error('Error loading modal.html:', error);
        return;
    }

    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.type = 'text/css';
    styleLink.href = chrome.runtime.getURL('modal.css');
    document.head.appendChild(styleLink);
    
    attachModalListeners();
    loadApiKeyIntoModal();
    isModalReady = true;
    console.log("Modal created and listeners attached.");
}

function showModal() {
    if (!modalContainer) {
        console.warn("Modal container not found. Attempting to create.");
        createModal().then(() => {
            if (modalContainer) {
                modalContainer.classList.remove('hide');
                modalContainer.querySelector('.bconomy-modal').classList.remove('hide');
                modalContainer.style.display = 'flex';
            }
        });
    } else {
        modalContainer.classList.remove('hide');
        modalContainer.querySelector('.bconomy-modal').classList.remove('hide');
        modalContainer.style.display = 'flex';
    }
    updateModalStatus("Enter API Key and Player ID to calculate.", "info");
    setModalPlayerName("Player Name: N/A");
    setModalCalculationResult("Loading...", "Loading...");
}

function hideModal() {
    if (modalContainer) {
        modalContainer.classList.add('hide');
        const modalContent = modalContainer.querySelector('.bconomy-modal');
        if (modalContent) {
            modalContent.classList.add('hide');
        }

        setTimeout(() => {
            modalContainer.style.display = 'none';
        }, 400);
    }
}

function attachModalListeners() {
    const closeButton = document.getElementById('bconomy-modal-close-button');
    if (closeButton) {
        closeButton.addEventListener('click', hideModal);
    } else { console.warn("Close button not found after modal creation."); }

    const saveApiKeyButton = document.getElementById('save-api-key-button');
    if (saveApiKeyButton) {
        saveApiKeyButton.addEventListener('click', () => {
            const apiKeyInput = document.getElementById('api-key-input');
            const apiKeyStatus = document.getElementById('api-key-status');
            const apiKey = apiKeyInput.value.trim();
            if (apiKey) {
                chrome.runtime.sendMessage({ type: "setApiKey", apiKey: apiKey }, response => {
                    if (response && response.status === "API Key set") {
                        BCONOMY_API_KEY = apiKey;
                        apiKeyStatus.textContent = 'API Key saved successfully!';
                        apiKeyStatus.className = 'status-message success';
                    } else if (response && response.status === "error") {
                        apiKeyStatus.textContent = `Error saving API Key: ${response.message}`;
                        apiKeyStatus.className = 'status-message error';
                    } else {
                        apiKeyStatus.textContent = 'API Key saved successfully!';
                        apiKeyStatus.className = 'status-message success';
                        BCONOMY_API_KEY = apiKey;
                    }
                    if (chrome.runtime.lastError) {
                         console.error("Error from runtime.sendMessage (setApiKey):", chrome.runtime.lastError);
                         apiKeyStatus.textContent = `Error: ${chrome.runtime.lastError.message}`;
                         apiKeyStatus.className = 'status-message error';
                    }
                });
            } else {
                apiKeyStatus.textContent = 'API Key cannot be empty.';
                apiKeyStatus.className = 'status-message error';
            }
        });
    } else { console.warn("Save API Key button not found."); }

    const confirmPlayerIdButton = document.getElementById('confirm-player-id-button');
    if (confirmPlayerIdButton) {
        confirmPlayerIdButton.addEventListener('click', () => {
            const playerIdInput = document.getElementById('player-id-input');
            const playerId = parseInt(playerIdInput.value.trim());
            const playerIdInputStatus = document.getElementById('player-id-input-status');

            if (!BCONOMY_API_KEY) {
                playerIdInputStatus.textContent = "Error: API Key not set. Please save it first.";
                playerIdInputStatus.className = 'status-message error';
                return;
            }

            if (isNaN(playerId) || playerId <= 0) {
                playerIdInputStatus.textContent = "Please enter a valid Player ID (a positive number).";
                playerIdInputStatus.className = 'status-message error';
                setModalPlayerName("Player Name: N/A");
                setModalCalculationResult("N/A", "N/A");
                updateModalStatus("Invalid Player ID.", "error");
            } else {
                playerIdInputStatus.textContent = "";
                playerIdInputStatus.className = 'status-message';
                calculateInventoryValue(playerId);
            }
        });
    } else { console.warn("Confirm Player ID button not found."); }
}

function loadApiKeyIntoModal() {
    const apiKeyInput = document.getElementById('api-key-input');
    const apiKeyStatus = document.getElementById('api-key-status');
    if (apiKeyInput && apiKeyStatus) {
        chrome.runtime.sendMessage({ type: "requestApiKey" }, response => {
            if (response && response.apiKey) {
                apiKeyInput.value = response.apiKey;
                BCONOMY_API_KEY = response.apiKey;
                apiKeyStatus.textContent = 'API Key loaded from storage.';
                apiKeyStatus.className = 'status-message success';
            } else {
                apiKeyInput.value = '';
                apiKeyStatus.textContent = 'No API Key set. Please enter one.';
                apiKeyStatus.className = 'status-message error';
            }
             if (chrome.runtime.lastError) {
                 console.error("Error from runtime.sendMessage (requestApiKey):", chrome.runtime.lastError);
                 apiKeyStatus.textContent = `Error loading API Key: ${chrome.runtime.lastError.message}`;
                 apiKeyStatus.className = 'status-message error';
            }
        });
    } else { console.warn("API Key input or status element not found in modal."); }
}

function updateModalStatus(message, type = "info") {
    const statusMessageElement = document.getElementById('modal-status-message');
    if (statusMessageElement) {
        statusMessageElement.textContent = message;
        statusMessageElement.className = `status-message ${type}`;
    }
}

function setModalPlayerName(name) {
    const playerNameElement = document.getElementById('player-name-display');
    if (playerNameElement) {
        playerNameElement.innerHTML = `<span>${name}</span>`;
    }
}

function setModalCalculationResult(marketWorth, baseWorth) {
    const marketWorthElement = document.getElementById('market-worth-display');
    const baseWorthElement = document.getElementById('base-worth-display');
    if (marketWorthElement && baseWorthElement) {
        marketWorthElement.textContent = formatBC(marketWorth);
        baseWorthElement.textContent = formatBC(baseWorth);
    }
}

function addCalculatorIcon() {
    let calculatorIcon = document.getElementById('bconomy-calculator-icon');
    if (calculatorIcon) return;

    calculatorIcon = document.createElement('img');
    calculatorIcon.id = 'bconomy-calculator-icon';
    calculatorIcon.src = chrome.runtime.getURL('icons/calculator_icon.png'); 
    calculatorIcon.title = 'Open Bconomy Calculator';
    calculatorIcon.style.cssText = `
        position: fixed;
        bottom: 25px; 
        right: 25px;
        width: 60px; 
        height: 60px;
        cursor: pointer;
        z-index: 10000;
        background-color: rgba(40, 44, 52, 0.9);
        border: 3px solid #4a90e2; 
        border-radius: 50%;
        padding: 8px;
        box-shadow: 0 6px 15px rgba(0,0,0,0.5);
        transition: transform 0.2s ease-in-out, box-shadow 0.2s ease;
    `;
    calculatorIcon.onmouseover = () => calculatorIcon.style.transform = 'scale(1.15) rotate(15deg)';
    calculatorIcon.onmouseout = () => calculatorIcon.style.transform = 'scale(1.0) rotate(0deg)';

    calculatorIcon.addEventListener('click', showModal);

    document.body.appendChild(calculatorIcon);
    console.log("Bconomy Calculator icon added to the page.");
}

window.addEventListener('load', () => {
    addCalculatorIcon();
    createModal();
});
setTimeout(() => {
    addCalculatorIcon();
    if (!isModalReady) createModal();
}, 2000);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "setApiKey") {
        chrome.storage.sync.set({ bconomyApiKey: request.apiKey }, () => {
            if (chrome.runtime.lastError) {
                console.error("Error setting API Key in background:", chrome.runtime.lastError);
                sendResponse({ status: "error", message: chrome.runtime.lastError.message });
            } else {
                sendResponse({ status: "API Key set" });
            }
        });
        return true;
    }
});