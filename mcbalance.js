// Network Configuration
const networkConfigs = {
    ethereum: {
        apiBaseUrl: 'https://api.etherscan.io/api',
        apiKeyPlaceholder: 'Enter your Etherscan API Key',
        icon: 'fab fa-ethereum',
        decimals: 18
    },
    bsc: {
        apiBaseUrl: 'https://api.bscscan.com/api',
        apiKeyPlaceholder: 'Enter your BscScan API Key',
        icon: 'fab fa-bitcoin',
        decimals: 18
    },
    polygon: {
        apiBaseUrl: 'https://api.polygonscan.com/api',
        apiKeyPlaceholder: 'Enter your PolygonScan API Key',
        icon: 'fas fa-cube',
        decimals: 18
    },
    base: {
        apiBaseUrl: 'https://api.basescan.org/api',
        apiKeyPlaceholder: 'Enter your BaseScan API Key',
        icon: 'fas fa-layer-group',
        decimals: 18
    }
};

let currentNetwork = 'ethereum';

// Dark/Light Mode Toggle
const modeToggle = document.getElementById('modeToggle');
let isDarkMode = false;

modeToggle.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    updateTheme();
});

function updateTheme() {
    const root = document.documentElement;
    if (isDarkMode) {
        root.style.setProperty('--primary-color', 'var(--primary-color-dark)');
        root.style.setProperty('--secondary-color', 'var(--secondary-color-dark)');
        root.style.setProperty('--background-color', 'var(--background-color-dark)');
        root.style.setProperty('--card-color', 'var(--card-color-dark)');
        root.style.setProperty('--text-color', 'var(--text-color-dark)');
        root.style.setProperty('--navbar-color', 'var(--navbar-color-dark)');
        root.style.setProperty('--navbar-text', 'var(--navbar-text-dark)');
        modeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        root.style.setProperty('--primary-color', 'var(--primary-color-light)');
        root.style.setProperty('--secondary-color', 'var(--secondary-color-light)');
        root.style.setProperty('--background-color', 'var(--background-color-light)');
        root.style.setProperty('--card-color', 'var(--card-color-light)');
        root.style.setProperty('--text-color', 'var(--text-color-light)');
        root.style.setProperty('--navbar-color', 'var(--navbar-color-light)');
        root.style.setProperty('--navbar-text', 'var(--navbar-text-light)');
        modeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// Network Selection
const networkLinks = document.querySelectorAll('.navbar-menu a');
const headerIcon = document.querySelector('.header h1 i');
const headerTitle = document.querySelector('.header h1');
const headerSubtitle = document.querySelector('.header p');
const apiKeyInput = document.getElementById('apiKeyInput');
const apiKeyIcon = document.getElementById('apiKeyIcon');

networkLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        // Remove active class from all links
        networkLinks.forEach(l => l.classList.remove('active'));
        
        // Add active to clicked link
        e.currentTarget.classList.add('active');
        
        // Update current network
        currentNetwork = e.currentTarget.dataset.network;
        
        // Update header based on selected network
        updateNetworkHeader(currentNetwork);
        
        // Update API key input
        const config = networkConfigs[currentNetwork];
        apiKeyInput.placeholder = config.apiKeyPlaceholder;
        apiKeyIcon.className = config.icon;
    });
});

function updateNetworkHeader(network) {
    const config = networkConfigs[network];
    headerIcon.className = config.icon;
    headerTitle.innerHTML = `<i class="${config.icon}"></i> ${network.charAt(0).toUpperCase() + network.slice(1)} Address Balance Tracker`;
    headerSubtitle.textContent = `Check balances for multiple ${network.charAt(0).toUpperCase() + network.slice(1)} addresses efficiently`;
}

async function checkBalances() {
    const resultsDiv = document.getElementById('results');
    const apiKey = document.getElementById('apiKeyInput').value;
    
    // Clear previous results
    resultsDiv.innerHTML = '';
    
    // Get addresses
    let addresses = [];
    const textInput = document.getElementById('addressInput').value;
    const fileInput = document.getElementById('fileInput');
    
    // Check text input
    if (textInput.trim()) {
        // Split by newline or comma, trim whitespace
        addresses = textInput.split(/[\n,]/).map(addr => addr.trim()).filter(addr => addr);
    }
    
    // Check file input
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const fileText = await file.text();
        const fileAddresses = fileText.split(/[\n,]/).map(addr => addr.trim()).filter(addr => addr);
        addresses = [...addresses, ...fileAddresses];
    }
    
    // Validate addresses
    if (addresses.length === 0) {
        resultsDiv.innerHTML = `
            <div class="address-result error">
                <i class="fas fa-exclamation-triangle"></i> No valid addresses found
            </div>
        `;
        return;
    }

    // Limit addresses
    if (addresses.length > 20000) {
        resultsDiv.innerHTML = `
            <div class="address-result error">
                <i class="fas fa-times-circle"></i> Maximum limit of 20,000 addresses exceeded. 
                Current addresses: ${addresses.length}
            </div>
        `;
        return;
    }
    
    // Validate API Key
    if (!apiKey) {
        resultsDiv.innerHTML = `
            <div class="address-result error">
                <i class="fas fa-key"></i> Please enter a ${networkConfigs[currentNetwork].apiKeyPlaceholder}
            </div>
        `;
        return;
    }
    
    // Check each address
    for (let address of addresses) {
        const addressResultDiv = document.createElement('div');
        addressResultDiv.classList.add('address-result');
        addressResultDiv.innerHTML = `
            <p class="loading">
                <i class="fas fa-spinner fa-spin"></i> Checking balance for ${address}...
            </p>
        `;
        resultsDiv.appendChild(addressResultDiv);
        
        try {
            const config = networkConfigs[currentNetwork];
            const response = await axios.get(config.apiBaseUrl, {
                params: {
                    module: 'account',
                    action: 'balance',
                    address: address,
                    tag: 'latest',
                    apikey: apiKey
                }
            });
            
            if (response.data.status === '1') {
                // Convert from Wei to Native Token
                const balanceInToken = (parseInt(response.data.result) / Math.pow(10, config.decimals)).toFixed(4);
                const balanceClass = parseFloat(balanceInToken) > 0 ? 'has-balance' : 'zero-balance';
                
                addressResultDiv.classList.add(balanceClass);
                addressResultDiv.innerHTML = `
                    <p class="${balanceClass === 'has-balance' ? 'error' : 'success'}">
                        <i class="${config.icon}"></i> Address: ${address}<br>
                        Balance: ${balanceInToken} ${currentNetwork.toUpperCase()}
                        ${balanceClass === 'has-balance' ? '<strong>(Non-Zero Balance!)</strong>' : ''}
                    </p>
                `;
            } else {
                addressResultDiv.innerHTML = `
                    <p class="error">
                        <i class="fas fa-exclamation-circle"></i> Address: ${address}<br>
                        Error: ${response.data.message}
                    </p>
                `;
            }
        } catch (error) {
            addressResultDiv.innerHTML = `
                <p class="error">
                    <i class="fas fa-times-circle"></i> Address: ${address}<br>
                    Error: ${error.message}
                </p>
            `;
        }
    }
}