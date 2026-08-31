// Smart API Base Auto-detection
const API_BASE = (window.location.protocol === 'file:' || !window.location.port || window.location.port !== '8080')
    ? 'http://localhost:8080/api'
    : '/api';

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
    loadAccounts();
    loadTransactions();
    loadQueues();
    loadAuditLogs();
});

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');

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
            throw new Error(`Java REST Backend offline. Returned HTML instead of JSON.`);
        }

        const data = JSON.parse(text);
        if (!res.ok) {
            throw new Error(data.error || `HTTP ${res.status}`);
        }
        return data;
    } catch (err) {
        console.error('API Error:', err);
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
    banner.innerHTML = `
        ⚠️ <strong>Java Backend Offline:</strong> Run <code>java -cp bin com.bank.Main</code> in your terminal.<br>
        <span style="font-size: 0.8rem; opacity: 0.8;">Details: ${msg}</span>
    `;
}

function hideServerWarningBanner() {
    const banner = document.getElementById('server-warning-banner');
    if (banner) banner.remove();
}

async function loadDashboardData() {
    const accounts = await apiCall('/accounts');
    const transactions = await apiCall('/transactions');

    if (accounts) {
        hideServerWarningBanner();
        document.getElementById('total-accounts-val').innerText = accounts.length;
        const totalCap = accounts.reduce((sum, a) => sum + a.balance, 0);
        document.getElementById('total-capital-val').innerText = `$${totalCap.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

        if (accounts.length > 0) {
            updateCreditCardPreview(accounts[0]);
        }
    }

    if (transactions) {
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
    if (cardBal) cardBal.innerText = `$${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (cardType) cardType.innerText = acc.type;
}

async function loadAccounts() {
    const accounts = await apiCall('/accounts');
    if (accounts) renderAccountsTable(accounts);
}

function getAvatarUrl(name) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff&bold=true`;
}

function renderAccountsTable(accounts) {
    const tbody = document.getElementById('accounts-body');
    if (!tbody) return;

    if (accounts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No accounts found.</td></tr>';
        return;
    }

    tbody.innerHTML = accounts.map(a => {
        let badgeClass = 'badge-savings';
        let icon = '💎';
        if (a.type === 'CURRENT') { badgeClass = 'badge-current'; icon = '⚡'; }
        if (a.type === 'FIXED_DEPOSIT') { badgeClass = 'badge-fd'; icon = '🔒'; }

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
                <td><span class="badge ${badgeClass}">${icon} ${a.type}</span></td>
                <td><strong class="amount-green">$${a.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-sm btn-success" onclick="quickAction('deposit', '${a.accountNumber}')">↓ Deposit</button>
                        <button class="btn-sm btn-warning" onclick="quickAction('withdraw', '${a.accountNumber}')">↑ Withdraw</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function loadTransactions() {
    const transactions = await apiCall('/transactions');
    if (transactions) {
        renderTransactions(transactions.slice().reverse());
    }
}

function renderTransactions(transactions) {
    const tbody = document.getElementById('transactions-body');
    if (!tbody) return;

    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No transactions recorded.</td></tr>';
        return;
    }

    tbody.innerHTML = transactions.map(t => {
        let typeColor = 'badge-deposit';
        let sign = '+';
        let txIcon = '📥';
        if (t.type.includes('WITHDRAWAL')) { typeColor = 'badge-withdrawal'; sign = '-'; txIcon = '📤'; }
        if (t.type.includes('TRANSFER')) { typeColor = 'badge-transfer'; sign = '⇄'; txIcon = '🔄'; }

        return `
            <tr>
                <td><code class="tx-code">${t.txId}</code></td>
                <td><span class="sub-text">${t.timestamp}</span></td>
                <td><strong>${t.accNum}</strong></td>
                <td><span class="badge-tx ${typeColor}">${txIcon} ${t.type}</span></td>
                <td><strong class="${sign === '+' ? 'text-green' : 'text-red'}">${sign} $${t.amount.toFixed(2)}</strong></td>
                <td>$${t.balanceAfter.toFixed(2)}</td>
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
        alert(`🎉 Account Created Successfully!\nAccount #: ${res.accountNumber}\nBalance: $${res.balance.toFixed(2)}`);
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
        remarks: document.getElementById('dep-remarks').value
    };

    const res = await apiCall('/deposit', 'POST', data);
    if (res && res.success) {
        alert(`✅ Deposit Successful!\nNew Balance: $${res.newBalance.toFixed(2)}`);
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
        remarks: document.getElementById('w-remarks').value
    };

    const res = await apiCall('/withdraw', 'POST', data);
    if (res && res.success) {
        alert(`✅ Withdrawal Successful!\nNew Balance: $${res.newBalance.toFixed(2)}`);
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
        remarks: document.getElementById('t-remarks').value
    };

    const res = await apiCall('/transfer', 'POST', data);
    if (res && res.success) {
        alert(`💸 Transfer Successful!\nTx ID: ${res.txId}\nSource New Balance: $${res.sourceBalance.toFixed(2)}`);
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
        alert('↺ ' + res.message);
        loadDashboardData();
        loadAccounts();
    } else if (res) {
        alert('Undo Failed: ' + res.error);
    }
}

async function sortAccountsByBalance() {
    const sorted = await apiCall('/sorted-accounts');
    if (sorted) renderAccountsTable(sorted);
}

async function searchAccounts() {
    const q = document.getElementById('search-input').value;
    if (!q) return loadAccounts();
    const results = await apiCall(`/search?q=${encodeURIComponent(q)}`);
    if (results) renderAccountsTable(results);
}

async function loadQueues() {
    loadAuditLogs();
}

async function enqueueTeller() {
    const req = document.getElementById('teller-inquiry-input').value;
    if (!req) return alert('Please enter inquiry details.');
    const res = await apiCall('/teller/enqueue', 'POST', { request: req });
    if (res && res.success) {
        alert('📥 ' + res.message);
        document.getElementById('teller-inquiry-input').value = '';
    }
}

async function dequeueTeller() {
    const res = await apiCall('/teller/dequeue', 'POST');
    if (res && res.success) {
        alert('✅ Serviced Customer: ' + res.processed);
    }
}

async function enqueueVip() {
    const name = document.getElementById('vip-name-input').value;
    const type = document.getElementById('vip-type-select').value;
    const priority = document.getElementById('vip-prio-input').value;

    if (!name) return alert('Enter VIP client name.');
    const res = await apiCall('/vip/enqueue', 'POST', { name, type, priority });
    if (res && res.success) {
        alert('👑 ' + res.message);
        document.getElementById('vip-name-input').value = '';
    }
}

async function dequeueVip() {
    const res = await apiCall('/vip/dequeue', 'POST');
    if (res && res.success) {
        if (res.name) {
            alert(`👑 Serviced High-Priority VIP Request:\nRequest ID: ${res.requestId}\nName: ${res.name}\nPriority Score: ${res.priority}`);
        } else {
            alert(res.message);
        }
    }
}

async function loadAuditLogs() {
    const logs = await apiCall('/audit-logs');
    if (logs) {
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
    box.innerText = '⚡ Executing System Diagnostics...\nPlease wait...';

    const res = await apiCall('/tests/run');
    if (res) {
        box.innerText = res.log;
    }
}
