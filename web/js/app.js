const API_BASE = '/api';

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
    if (tabId === 'queues') loadQueues();
    if (tabId === 'audit') loadAuditLogs();
}

function openModal(id) {
    document.getElementById(id).style.display = 'flex';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// Fetch API Helper
async function apiCall(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body) options.body = JSON.stringify(body);
        const res = await fetch(API_BASE + endpoint, options);
        return await res.json();
    } catch (err) {
        console.error('API Error:', err);
        alert('Server communication error: ' + err.message);
    }
}

async function loadDashboardData() {
    const accounts = await apiCall('/accounts');
    const transactions = await apiCall('/transactions');

    if (accounts) {
        document.getElementById('total-accounts-val').innerText = accounts.length;
        const totalCap = accounts.reduce((sum, a) => sum + a.balance, 0);
        document.getElementById('total-capital-val').innerText = `$${totalCap.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }

    if (transactions) {
        document.getElementById('total-tx-val').innerText = transactions.length;
        renderTransactions(transactions.slice(-10).reverse()); // show 10 recent
    }
}

async function loadAccounts() {
    const accounts = await apiCall('/accounts');
    if (accounts) renderAccountsTable(accounts);
}

function renderAccountsTable(accounts) {
    const tbody = document.getElementById('accounts-body');
    if (accounts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No accounts found.</td></tr>';
        return;
    }

    tbody.innerHTML = accounts.map(a => {
        let badgeClass = 'badge-savings';
        if (a.type === 'CURRENT') badgeClass = 'badge-current';
        if (a.type === 'FIXED_DEPOSIT') badgeClass = 'badge-fd';

        return `
            <tr>
                <td><strong>${a.accountNumber}</strong></td>
                <td>${a.holderName}</td>
                <td>${a.customerId}</td>
                <td><span class="badge ${badgeClass}">${a.type}</span></td>
                <td>$${a.balance.toFixed(2)}</td>
                <td>
                    <button class="btn-sm btn-success" onclick="quickAction('deposit', '${a.accountNumber}')">Deposit</button>
                    <button class="btn-sm btn-warning" onclick="quickAction('withdraw', '${a.accountNumber}')">Withdraw</button>
                </td>
            </tr>
        `;
    }).join('');
}

async function loadTransactions() {
    const transactions = await apiCall('/transactions');
    if (transactions) {
        renderTransactions(transactions.reverse());
    }
}

function renderTransactions(transactions) {
    const tbody = document.getElementById('transactions-body');
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No transactions recorded.</td></tr>';
        return;
    }

    tbody.innerHTML = transactions.map(t => {
        let typeColor = 'badge-deposit';
        if (t.type.includes('WITHDRAWAL')) typeColor = 'badge-withdrawal';
        if (t.type.includes('TRANSFER')) typeColor = 'badge-transfer';

        return `
            <tr>
                <td><code>${t.txId}</code></td>
                <td>${t.timestamp}</td>
                <td><strong>${t.accNum}</strong></td>
                <td><span class="${typeColor}">${t.type}</span></td>
                <td>$${t.amount.toFixed(2)}</td>
                <td>$${t.balanceAfter.toFixed(2)}</td>
                <td>${t.targetAcc !== 'N/A' ? 'To/From: ' + t.targetAcc : t.remarks}</td>
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
        alert(`Account Created Successfully!\nAccount #: ${res.accountNumber}\nBalance: $${res.balance.toFixed(2)}`);
        closeModal('create-account-modal');
        loadDashboardData();
        loadAccounts();
    } else {
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
        alert(`Deposit Successful!\nNew Balance: $${res.newBalance.toFixed(2)}`);
        closeModal('deposit-modal');
        loadDashboardData();
        loadAccounts();
    } else {
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
        alert(`Withdrawal Successful!\nNew Balance: $${res.newBalance.toFixed(2)}`);
        closeModal('withdraw-modal');
        loadDashboardData();
        loadAccounts();
    } else {
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
        alert(`Transfer Successful!\nTx ID: ${res.txId}\nSource New Balance: $${res.sourceBalance.toFixed(2)}`);
        closeModal('transfer-modal');
        loadDashboardData();
        loadAccounts();
    } else {
        alert('Transfer Failed: ' + res.error);
    }
}

async function triggerUndo() {
    if (!confirm('Are you sure you want to undo the last transaction using Stack (LIFO)?')) return;
    const res = await apiCall('/undo', 'POST');
    if (res && res.success) {
        alert(res.message);
        loadDashboardData();
        loadAccounts();
    } else {
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

// Queues Handling
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
    if (logs) {
        const consoleEl = document.getElementById('log-console');
        consoleEl.innerHTML = logs.map(l => `<div class="log-line">${l}</div>`).join('');
        consoleEl.scrollTop = consoleEl.scrollHeight;
    }
}

async function runAutomatedTests() {
    openModal('test-modal');
    const box = document.getElementById('test-output-box');
    box.innerText = 'Executing Automated Java Backend Unit Tests...\nPlease wait...';

    const res = await apiCall('/tests/run');
    if (res) {
        box.innerText = res.log;
    }
}
