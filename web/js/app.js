// Smart API Base Auto-detection for Vercel + Render Hybrid Architecture
const RENDER_BACKEND_URL = 'https://bank-management-7uwe.onrender.com';

function getApiBaseUrl() {
    // 1. If deployed on Render directly or running on port 8080 locally -> Use relative /api path
    if (window.location.hostname.includes('render.com') || window.location.port === '8080') {
        return '/api';
    }
    // 2. If running locally via file:// or dev servers
    if (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:8080/api';
    }
    // 3. If deployed on Vercel / Netlify
    return RENDER_BACKEND_URL.replace(/\/$/, '') + '/api';
}

const API_BASE = getApiBaseUrl();

// LocalStorage Persistence Keys
const LS_ACCOUNTS_KEY = 'apex_bank_accounts';
const LS_TXS_KEY = 'apex_bank_transactions';

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
    loadAccounts();
    loadTransactions();
    loadQueues();
    loadAuditLogs();
});

function toggleMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    if (event && event.target) {
        const btn = event.target.closest('.nav-btn');
        if (btn) btn.classList.add('active');
    }

    // Auto-close mobile drawer when tab is clicked
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && window.innerWidth <= 768) {
        sidebar.classList.remove('open');
    }

    if (tabId === 'dashboard') loadDashboardData();
    if (tabId === 'accounts') loadAccounts();
    if (tabId === 'transactions') loadTransactions();
    if (tabId === 'queues') loadQueues();
    if (tabId === 'audit') loadAuditLogs();
}

function openModal(id) {
    document.getElementById(id).style.display = 'flex';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// Resilient API Fetch Helper
async function apiCall(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body) options.body = JSON.stringify(body);

        const res = await fetch(API_BASE + endpoint, options);
        const text = await res.text();

        if (text.trim().startsWith('<')) {
            showServerWarningBanner("Server returned HTML instead of JSON. Cold boot in progress.");
            return null;
        }

        const data = JSON.parse(text);
        hideServerWarningBanner();
        return data;
    } catch (err) {
        console.error('Network / Server Error:', err);
        showServerWarningBanner(err.message);
        return null;
    }
}

function showServerWarningBanner(msg) {
    let banner = document.getElementById('server-warning-banner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'server-warning-banner';
        banner.className = 'warning-banner';
        document.body.prepend(banner);
    }
    
    if (window.location.hostname === 'localhost' || window.location.protocol === 'file:') {
        banner.innerHTML = `
            ⚡ <strong>Local Java Backend Offline:</strong> Run <code>java -cp bin com.bank.Main</code> in your terminal.<br>
            <span style="font-size: 0.8rem; opacity: 0.8;">Target API: ${API_BASE} | Details: ${msg}</span>
        `;
    } else {
        banner.innerHTML = `
            ⏳ <strong>Connecting to Render Backend...</strong> Render free tier takes ~30s to boot.<br>
            <span style="font-size: 0.8rem; opacity: 0.8;">Target API: ${API_BASE} | Details: ${msg}</span>
        `;
    }
}

function hideServerWarningBanner() {
    const banner = document.getElementById('server-warning-banner');
    if (banner) banner.remove();
}

async function loadDashboardData() {
    let accounts = await apiCall('/accounts');
    let transactions = await apiCall('/transactions');

    if (!Array.isArray(accounts)) {
        accounts = JSON.parse(localStorage.getItem(LS_ACCOUNTS_KEY) || '[]');
    } else {
        localStorage.setItem(LS_ACCOUNTS_KEY, JSON.stringify(accounts));
    }

    if (!Array.isArray(transactions)) {
        transactions = JSON.parse(localStorage.getItem(LS_TXS_KEY) || '[]');
    } else {
        localStorage.setItem(LS_TXS_KEY, JSON.stringify(transactions));
    }

    if (accounts.length > 0) {
        hideServerWarningBanner();
        document.getElementById('total-accounts-val').innerText = accounts.length;
        const totalCap = accounts.reduce((sum, a) => sum + a.balance, 0);
        document.getElementById('total-capital-val').innerText = `₹${totalCap.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

        updateCreditCardPreview(accounts[0]);
    }

    if (transactions.length > 0) {
        document.getElementById('total-tx-val').innerText = transactions.length;
    }
}

function updateCreditCardPreview(acc) {
    const cardHolder = document.getElementById('card-holder-name');
    const cardNum = document.getElementById('card-acc-num');
    const cardBal = document.getElementById('card-acc-bal');
    const cardType = document.getElementById('card-type-badge');

    if (cardHolder) cardHolder.innerText = acc.holderName.toUpperCase();
    if (cardNum) cardNum.innerText = `•••• •••• •••• ${acc.accountNumber.replace('ACC', '')}`;
    if (cardBal) cardBal.innerText = `₹${acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    if (cardType) cardType.innerText = acc.type;
}

async function loadAccounts() {
    let accounts = await apiCall('/accounts');
    if (Array.isArray(accounts) && accounts.length > 0) {
        localStorage.setItem(LS_ACCOUNTS_KEY, JSON.stringify(accounts));
    } else {
        accounts = JSON.parse(localStorage.getItem(LS_ACCOUNTS_KEY) || '[]');
    }
    renderAccountsTable(accounts);
}

function getAvatarUrl(name) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff&bold=true`;
}

function renderAccountsTable(accounts) {
    const tbody = document.getElementById('accounts-body');
    if (!tbody) return;

    if (!accounts || accounts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No accounts found.</td></tr>';
        return;
    }

    tbody.innerHTML = accounts.map(a => {
        let badgeClass = 'badge-savings';
        if (a.type === 'CURRENT') { badgeClass = 'badge-current'; }
        if (a.type === 'FIXED_DEPOSIT') { badgeClass = 'badge-fd'; }

        return `
            <tr>
                <td>
                    <div class="user-profile-cell">
                        <img src="${getAvatarUrl(a.holderName)}" class="avatar-img" alt="${a.holderName}">
                        <div>
                            <strong>${a.accountNumber}</strong>
                            <div class="sub-text">Cust ID: ${a.customerId}</div>
                        </div>
                    </div>
                </td>
                <td><strong>${a.holderName}</strong></td>
                <td><span class="badge ${badgeClass}">${a.type}</span></td>
                <td><strong class="amount-green">₹${a.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-sm btn-success" onclick="quickAction('deposit', '${a.accountNumber}')">Deposit</button>
                        <button class="btn-sm btn-warning" onclick="quickAction('withdraw', '${a.accountNumber}')">Withdraw</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function loadTransactions() {
    let transactions = await apiCall('/transactions');
    if (Array.isArray(transactions) && transactions.length > 0) {
        localStorage.setItem(LS_TXS_KEY, JSON.stringify(transactions));
    } else {
        transactions = JSON.parse(localStorage.getItem(LS_TXS_KEY) || '[]');
    }
    renderTransactions(transactions.slice().reverse());
}

function renderTransactions(transactions) {
    const tbody = document.getElementById('transactions-body');
    if (!tbody) return;

    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No transactions recorded.</td></tr>';
        return;
    }

    tbody.innerHTML = transactions.map(t => {
        let typeColor = 'badge-deposit';
        let sign = '+';
        if (t.type.includes('WITHDRAWAL')) { typeColor = 'badge-withdrawal'; sign = '-'; }
        if (t.type.includes('TRANSFER')) { typeColor = 'badge-transfer'; sign = '⇄'; }

        return `
            <tr>
                <td><code class="tx-code">${t.txId}</code></td>
                <td><span class="sub-text">${t.timestamp}</span></td>
                <td><strong>${t.accNum}</strong></td>
                <td><span class="badge-tx ${typeColor}">${t.type}</span></td>
                <td><strong class="${sign === '+' ? 'text-green' : 'text-red'}">${sign} ₹${t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
                <td>₹${t.balanceAfter.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td>${t.targetAcc !== 'N/A' ? 'Target: <strong>' + t.targetAcc + '</strong>' : t.remarks}</td>
            </tr>
        `;
    }).join('');
}

function quickAction(type, accNum) {
    if (type === 'deposit') {
        document.getElementById('dep-acc-num').value = accNum;
        openModal('deposit-modal');
    } else if (type === 'withdraw') {
        document.getElementById('w-acc-num').value = accNum;
        openModal('withdraw-modal');
    }
}

async function handleCreateAccount(e) {
    e.preventDefault();
    const data = {
        type: document.getElementById('new-acc-type').value,
        name: document.getElementById('new-cust-name').value,
        email: document.getElementById('new-cust-email').value,
        phone: document.getElementById('new-cust-phone').value,
        initialBalance: document.getElementById('new-acc-bal').value,
        pin: document.getElementById('new-acc-pin').value,
        extra: document.getElementById('new-acc-extra').value
    };

    const res = await apiCall('/accounts/create', 'POST', data);
    if (res && res.success) {
        alert(`Account Created Successfully!\nAccount #: ${res.accountNumber}\nBalance: ₹${res.balance.toFixed(2)}`);
        closeModal('create-account-modal');
        loadDashboardData();
        loadAccounts();
    } else if (res) {
        alert('Creation Failed: ' + (res.error || 'Unknown error'));
    }
}

async function handleDeposit(e) {
    e.preventDefault();
    const data = {
        accountNumber: document.getElementById('dep-acc-num').value,
        amount: document.getElementById('dep-amount').value,
        pin: document.getElementById('dep-pin').value,
        remarks: document.getElementById('dep-remarks').value
    };

    const res = await apiCall('/deposit', 'POST', data);
    if (res && res.success) {
        alert(`Deposit Successful!\nNew Balance: ₹${res.newBalance.toFixed(2)}`);
        closeModal('deposit-modal');
        loadDashboardData();
        loadAccounts();
    } else if (res) {
        alert('Deposit Failed: ' + res.error);
    }
}

async function handleWithdraw(e) {
    e.preventDefault();
    const data = {
        accountNumber: document.getElementById('w-acc-num').value,
        amount: document.getElementById('w-amount').value,
        pin: document.getElementById('w-pin').value,
        remarks: document.getElementById('w-remarks').value
    };

    const res = await apiCall('/withdraw', 'POST', data);
    if (res && res.success) {
        alert(`Withdrawal Successful!\nNew Balance: ₹${res.newBalance.toFixed(2)}`);
        closeModal('withdraw-modal');
        loadDashboardData();
        loadAccounts();
    } else if (res) {
        alert('Withdrawal Failed: ' + res.error);
    }
}

async function handleTransfer(e) {
    e.preventDefault();
    const data = {
        sourceAccount: document.getElementById('t-src-num').value,
        targetAccount: document.getElementById('t-target-num').value,
        amount: document.getElementById('t-amount').value,
        pin: document.getElementById('t-pin').value,
        remarks: document.getElementById('t-remarks').value
    };

    const res = await apiCall('/transfer', 'POST', data);
    if (res && res.success) {
        alert(`Transfer Successful!\nTx ID: ${res.txId}\nSource New Balance: ₹${res.sourceBalance.toFixed(2)}`);
        closeModal('transfer-modal');
        loadDashboardData();
        loadAccounts();
    } else if (res) {
        alert('Transfer Failed: ' + res.error);
    }
}

async function triggerUndo() {
    if (!confirm('Are you sure you want to rollback the most recent transaction?')) return;
    const res = await apiCall('/undo', 'POST');
    if (res && res.success) {
        alert(res.message);
        loadDashboardData();
        loadAccounts();
    } else if (res) {
        alert('Undo Failed: ' + res.error);
    }
}

async function sortAccountsByBalance() {
    const sorted = await apiCall('/sorted-accounts');
    if (Array.isArray(sorted)) renderAccountsTable(sorted);
}

async function searchAccounts() {
    const q = document.getElementById('search-input').value;
    if (!q) return loadAccounts();
    const results = await apiCall(`/search?q=${encodeURIComponent(q)}`);
    if (Array.isArray(results)) renderAccountsTable(results);
}

async function loadQueues() {
    loadAuditLogs();
}

async function enqueueTeller() {
    const req = document.getElementById('teller-inquiry-input').value;
    if (!req) return alert('Please enter inquiry details.');
    const res = await apiCall('/teller/enqueue', 'POST', { request: req });
    if (res && res.success) {
        alert(res.message);
        document.getElementById('teller-inquiry-input').value = '';
    }
}

async function dequeueTeller() {
    const res = await apiCall('/teller/dequeue', 'POST');
    if (res && res.success) {
        alert('Serviced Customer: ' + res.processed);
    }
}

async function enqueueVip() {
    const name = document.getElementById('vip-name-input').value;
    const type = document.getElementById('vip-type-select').value;
    const priority = document.getElementById('vip-prio-input').value;

    if (!name) return alert('Enter VIP client name.');
    const res = await apiCall('/vip/enqueue', 'POST', { name, type, priority });
    if (res && res.success) {
        alert(res.message);
        document.getElementById('vip-name-input').value = '';
    }
}

async function dequeueVip() {
    const res = await apiCall('/vip/dequeue', 'POST');
    if (res && res.success) {
        if (res.name) {
            alert(`Serviced High-Priority VIP Request:\nRequest ID: ${res.requestId}\nName: ${res.name}\nPriority Score: ${res.priority}`);
        } else {
            alert(res.message);
        }
    }
}

async function loadAuditLogs() {
    const logs = await apiCall('/audit-logs');
    if (Array.isArray(logs)) {
        const consoleEl = document.getElementById('log-console');
        if (consoleEl) {
            consoleEl.innerHTML = logs.map(l => `<div class="log-line">⚡ ${l}</div>`).join('');
            consoleEl.scrollTop = consoleEl.scrollHeight;
        }
    }
}

async function runAutomatedTests() {
    openModal('test-modal');
    const box = document.getElementById('test-output-box');
    box.innerText = 'Executing System Diagnostics...\nPlease wait...';

    const res = await apiCall('/tests/run');
    if (res) {
        box.innerText = res.log;
    }
}
