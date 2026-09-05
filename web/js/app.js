// Smart API Base Auto-detection for Vercel + Render Hybrid Architecture
const RENDER_BACKEND_URL = 'https://bank-management-7uwe.onrender.com';

function getApiBaseUrl() {
    if (window.location.hostname.includes('render.com') || window.location.port === '8080') {
        return '/api';
    }
    if (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:8080/api';
    }
    return RENDER_BACKEND_URL.replace(/\/$/, '') + '/api';
}

const API_BASE = getApiBaseUrl();

// LocalStorage Persistence Keys
const LS_ACCOUNTS_KEY = 'apex_bank_accounts';
const LS_TXS_KEY = 'apex_bank_transactions';
let currentRole = 'customer';
let isAdminAuthenticated = false;
let isCardLocked = false;

document.addEventListener('DOMContentLoaded', () => {
    // URL Hash Routing (#admin or /admin prompts for passcode 7878)
    if (window.location.hash === '#admin' || window.location.pathname.endsWith('/admin')) {
        requestAdminAccess();
    } else {
        switchPortalRole('customer');
    }
});

function requestAdminAccess() {
    if (isAdminAuthenticated) {
        switchPortalRole('admin');
        return;
    }
    const modal = document.getElementById('admin-auth-modal');
    if (modal) {
        modal.classList.add('active');
        const pwdInput = document.getElementById('admin-passcode-input');
        if (pwdInput) {
            pwdInput.value = '';
            setTimeout(() => pwdInput.focus(), 100);
        }
    }
}

function closeAdminAuthModal() {
    const modal = document.getElementById('admin-auth-modal');
    if (modal) modal.classList.remove('active');
    if (!isAdminAuthenticated) {
        switchPortalRole('customer');
    }
}

function verifyAdminPasscode(event) {
    if (event) event.preventDefault();
    const input = document.getElementById('admin-passcode-input');
    const code = input ? input.value.trim() : '';

    if (code === '7878') {
        isAdminAuthenticated = true;
        closeAdminAuthModal();
        window.location.hash = 'admin';
        switchPortalRole('admin');
    } else {
        alert('Invalid Security Passcode! Access Denied.');
        if (input) input.value = '';
    }
}

function switchPortalRole(role) {
    if (role === 'admin' && !isAdminAuthenticated) {
        requestAdminAccess();
        return;
    }

    currentRole = role;
    const body = document.body;
    const adminBtn = document.getElementById('role-btn-admin');
    const custBtn = document.getElementById('role-btn-customer');
    const badge = document.getElementById('portal-subtitle-badge');
    const heroTag = document.getElementById('portal-hero-tag');
    const heroTitle = document.getElementById('portal-hero-title');
    const heroDesc = document.getElementById('portal-hero-desc');
    const userName = document.getElementById('user-display-name');
    const userRole = document.getElementById('user-display-role');

    const adminOnlyTexts = document.querySelectorAll('.admin-only-text');
    const custOnlyTexts = document.querySelectorAll('.customer-only-text');
    const adminItems = document.querySelectorAll('.admin-nav-item');
    const custQuickActions = document.querySelectorAll('.customer-quick-action');
    const custOnlyInlines = document.querySelectorAll('.customer-only-inline');

    if (role === 'admin') {
        body.classList.remove('role-customer');
        body.classList.add('role-admin');

        if (adminBtn) adminBtn.className = 'role-pill-btn active admin';
        if (custBtn) custBtn.className = 'role-pill-btn customer';

        if (badge) badge.innerText = 'ADMIN EXECUTIVE PORTAL';
        if (heroTag) heroTag.innerText = 'System Admin Mode';
        if (heroTitle) heroTitle.innerText = 'Apex Executive Banking Portal';
        if (heroDesc) heroDesc.innerText = 'Real-time INR ledgers, instant funds transfers across Indian banks, and priority VIP concierge desk.';
        if (userName) userName.innerText = 'System Administrator';
        if (userRole) userRole.innerText = 'Super Admin Rights';

        adminOnlyTexts.forEach(el => el.style.display = 'inline');
        custOnlyTexts.forEach(el => el.style.display = 'none');
        adminItems.forEach(el => el.style.display = '');
        custQuickActions.forEach(el => el.style.display = 'none');
        custOnlyInlines.forEach(el => el.style.display = 'none');

        document.getElementById('capital-card-label').innerText = 'Total Managed Capital (INR)';
        document.getElementById('tx-card-label').innerText = 'Transactions Processed';
        document.getElementById('tx-page-title').innerText = 'Transaction Ledger Log';
        document.getElementById('tx-page-desc').innerText = 'Complete historical record of deposits, withdrawals, and inter-bank transfers.';
    } else {
        body.classList.remove('role-admin');
        body.classList.add('role-customer');

        if (adminBtn) adminBtn.className = 'role-pill-btn admin';
        if (custBtn) custBtn.className = 'role-pill-btn active customer';

        if (badge) badge.innerText = 'CUSTOMER MOBILE PORTAL';
        if (heroTag) heroTag.innerText = 'Welcome Back, Hardik';
        if (heroTitle) heroTitle.innerText = 'My NRI Platinum Banking Portal';
        if (heroDesc) heroDesc.innerText = 'View personal account balance, send money via instant UPI/NEFT, and check digital passbook history.';
        if (userName) userName.innerText = 'Hardik Verma';
        if (userRole) userRole.innerText = 'Executive NRI Customer';

        adminOnlyTexts.forEach(el => el.style.display = 'none');
        custOnlyTexts.forEach(el => el.style.display = 'inline');
        adminItems.forEach(el => el.style.display = 'none');
        custQuickActions.forEach(el => el.style.display = 'inline-flex');
        custOnlyInlines.forEach(el => el.style.display = 'inline-flex');

        document.getElementById('capital-card-label').innerText = 'My Total Account Balance (INR)';
        document.getElementById('tx-card-label').innerText = 'My Completed Transactions';
        document.getElementById('tx-page-title').innerText = 'My Digital Passbook';
        document.getElementById('tx-page-desc').innerText = 'Personal transaction ledger statement for Account #ACC1001.';

        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab && (activeTab.id === 'accounts' || activeTab.id === 'queues' || activeTab.id === 'audit')) {
            showTab('dashboard');
        }
    }

    loadDashboardData();
    loadTransactions();
}

function toggleCardLock() {
    isCardLocked = !isCardLocked;
    const cardEl = document.getElementById('credit-card-element');
    const lockBtn = document.getElementById('card-lock-btn');

    if (isCardLocked) {
        if (cardEl) cardEl.style.filter = 'grayscale(1) opacity(0.6)';
        if (lockBtn) {
            lockBtn.innerText = '🔓 Unlock Card';
            lockBtn.className = 'btn-sm btn-warning';
        }
        alert('Card Frozen Successfully!\nATM & Online POS transactions are now temporarily blocked.');
    } else {
        if (cardEl) cardEl.style.filter = 'none';
        if (lockBtn) {
            lockBtn.innerText = '🔒 Lock Card';
            lockBtn.className = 'btn-sm btn-secondary';
        }
        alert('Card Unfrozen!\nCard is active for domestic & international transactions.');
    }
}

function calculateInterest() {
    const p = parseFloat(document.getElementById('calc-principal').value) || 0;
    const rate = parseFloat(document.getElementById('calc-type').value) || 4.0;
    const months = parseInt(document.getElementById('calc-months').value) || 12;

    const interest = (p * rate * (months / 12)) / 100;
    const resEl = document.getElementById('calc-result-val');
    if (resEl) {
        resEl.innerText = `₹${interest.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
}

function toggleMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.add('active');

    if (event && event.target) {
        const btn = event.target.closest('.nav-btn');
        if (btn) btn.classList.add('active');
    }

    const sidebar = document.querySelector('.sidebar');
    if (sidebar && window.innerWidth <= 768) {
        sidebar.classList.remove('open');
    }

    if (tabId === 'dashboard') loadDashboardData();
    if (tabId === 'accounts') loadAccounts();
    if (tabId === 'transactions') loadTransactions();
    if (tabId === 'loans') loadLoans();
    if (tabId === 'queues') loadQueues();
    if (tabId === 'audit') loadAuditLogs();
}

function openModal(id) {
    document.getElementById(id).style.display = 'flex';
    if (id === 'calc-modal') calculateInterest();
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
        
        if (currentRole === 'admin') {
            document.getElementById('total-accounts-val').innerText = accounts.length;
            const totalCap = accounts.reduce((sum, a) => sum + a.balance, 0);
            document.getElementById('total-capital-val').innerText = `₹${totalCap.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
            updateCreditCardPreview(accounts[0]);
        } else {
            const myAcc = accounts.find(a => a.accountNumber === 'ACC1001') || accounts[0];
            document.getElementById('total-capital-val').innerText = `₹${myAcc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
            updateCreditCardPreview(myAcc);
        }
    }

    if (transactions.length > 0) {
        if (currentRole === 'admin') {
            document.getElementById('total-tx-val').innerText = transactions.length;
        } else {
            const myTxs = transactions.filter(t => t.accNum === 'ACC1001' || t.targetAcc === 'ACC1001');
            document.getElementById('total-tx-val').innerText = myTxs.length;
        }
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

async function handleSearchAutocomplete(prefix) {
    if (!prefix || prefix.trim().length === 0) {
        const box = document.getElementById('autocomplete-box');
        if (box) box.style.display = 'none';
        return searchAccounts();
    }

    const suggestions = await apiCall(`/autocomplete?q=${encodeURIComponent(prefix)}`);
    const box = document.getElementById('autocomplete-box');
    if (box && Array.isArray(suggestions) && suggestions.length > 0) {
        box.style.display = 'block';
        box.innerHTML = suggestions.map(name => `<div class="autocomplete-item" onclick="selectAutocomplete('${name}')">👤 ${name} (Trie Suggestion)</div>`).join('');
    } else if (box) {
        box.style.display = 'none';
    }
    searchAccounts();
}

function selectAutocomplete(name) {
    const input = document.getElementById('search-input');
    if (input) input.value = name;
    const box = document.getElementById('autocomplete-box');
    if (box) box.style.display = 'none';
    searchAccounts();
}

async function loadLoans() {
    const loans = await apiCall('/loans/pending');
    const listEl = document.getElementById('loans-queue-list');
    if (!listEl) return;

    if (Array.isArray(loans) && loans.length > 0) {
        listEl.innerHTML = loans.map(l => `
            <div style="background:rgba(0,0,0,0.5); border:1px solid var(--border-color); padding:12px; border-radius:8px; display:flex; justify-space-between; align-items:center;">
                <div>
                    <strong>${l.appId} - ${l.name} (${l.accNum})</strong>
                    <div class="sub-text">Category: ${l.type} | Amount: ₹${l.amount.toLocaleString('en-IN')}</div>
                </div>
                <span class="badge ${l.priority >= 9 ? 'badge-tx badge-withdrawal' : 'badge-tx badge-deposit'}">Prio ${l.priority}</span>
            </div>
        `).join('');
    } else {
        listEl.innerHTML = '<p class="sub-text">No pending loan applications in Max-Heap Priority Queue.</p>';
    }
}

async function handleApplyLoanSubmit(e) {
    e.preventDefault();
    const data = {
        name: document.getElementById('loan-name-input').value,
        accountNumber: document.getElementById('loan-acc-input').value,
        loanType: document.getElementById('loan-type-select').value,
        amount: document.getElementById('loan-amount-input').value
    };

    const res = await apiCall('/loans/apply', 'POST', data);
    if (res && res.success) {
        alert(`Loan Application Submitted!\nApp ID: ${res.applicationId}\nMax-Heap Priority Score: ${res.priority}`);
        loadLoans();
    }
}

async function approveHighestLoan() {
    const res = await apiCall('/loans/approve', 'POST');
    if (res && res.success) {
        alert(`Highest Priority Loan Approved!\nApp ID: ${res.applicationId}\nApplicant: ${res.name}\nAmount Credited: ₹${res.amount}`);
        loadLoans();
        loadDashboardData();
    } else if (res) {
        alert(res.message);
    }
}

async function checkFraudCycle() {
    const acc = prompt('Enter Account Number to run DFS Circular Transfer Fraud Check:', 'ACC1001');
    if (!acc) return;
    const res = await apiCall(`/fraud/check?acc=${encodeURIComponent(acc)}`);
    if (res) {
        if (res.circularFraudDetected) {
            alert(`🚨 FRAUD WARNING!\nDFS Graph Cycle Detection found rapid circular transfers involving ${acc}!`);
        } else {
            alert(`✅ CLEAN ROUTING!\nNo circular fraud cycles detected for account ${acc}.`);
        }
    }
}

async function loadAccounts() {
    const sortVal = document.getElementById('accounts-sort-select')?.value || 'balance_desc';
    applyAccountSort(sortVal);
}

async function applyAccountSort(sortBy = 'balance_desc') {
    const sorted = await apiCall(`/sorted-accounts?sort=${encodeURIComponent(sortBy)}`);
    if (Array.isArray(sorted) && sorted.length > 0) {
        renderAccountsTable(sorted);
    } else {
        let accounts = JSON.parse(localStorage.getItem(LS_ACCOUNTS_KEY) || '[]');
        if (sortBy === 'balance_desc') {
            accounts.sort((a, b) => b.balance - a.balance);
        } else if (sortBy === 'balance_asc') {
            accounts.sort((a, b) => a.balance - b.balance);
        } else if (sortBy === 'name_asc') {
            accounts.sort((a, b) => a.holderName.localeCompare(b.holderName));
        } else if (sortBy === 'name_desc') {
            accounts.sort((a, b) => b.holderName.localeCompare(a.holderName));
        }
        renderAccountsTable(accounts);
    }
}

function getAvatarUrl(name) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff&bold=true`;
}

function renderAccountsTable(accounts) {
    const tbody = document.getElementById('accounts-body');
    if (!tbody) return;

    if (!accounts || accounts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No matching accounts found.</td></tr>';
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

    let filtered = transactions;
    if (currentRole === 'customer') {
        filtered = transactions.filter(t => t.accNum === 'ACC1001' || t.targetAcc === 'ACC1001');
    }

    renderTransactions(filtered.slice().reverse());
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
    if (isCardLocked && currentRole === 'customer') {
        return alert('Transaction Blocked!\nYour RuPay card is currently locked. Unlock your card to perform transactions.');
    }

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
    if (isCardLocked && currentRole === 'customer') {
        return alert('Transaction Blocked!\nYour RuPay card is currently locked. Unlock your card to perform transactions.');
    }

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
    if (isCardLocked && currentRole === 'customer') {
        return alert('Transaction Blocked!\nYour RuPay card is currently locked. Unlock your card to perform transactions.');
    }

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

async function searchAccounts() {
    const q = document.getElementById('search-input').value.trim();
    if (!q) return loadAccounts();

    const accountsTab = document.getElementById('accounts');
    if (accountsTab && !accountsTab.classList.contains('active')) {
        showTab('accounts');
    }

    const results = await apiCall(`/search?q=${encodeURIComponent(q)}`);
    if (Array.isArray(results) && results.length > 0) {
        renderAccountsTable(results);
    } else {
        const allAccounts = JSON.parse(localStorage.getItem(LS_ACCOUNTS_KEY) || '[]');
        const filtered = allAccounts.filter(a =>
            a.accountNumber.toLowerCase().includes(q.toLowerCase()) ||
            a.holderName.toLowerCase().includes(q.toLowerCase()) ||
            a.type.toLowerCase().includes(q.toLowerCase()) ||
            a.customerId.toLowerCase().includes(q.toLowerCase())
        );
        renderAccountsTable(filtered);
    }
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
