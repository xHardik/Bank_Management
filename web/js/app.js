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

function initLoginPage() {
    const cleanPath = window.location.pathname.replace(/\/$/, '');
    if (cleanPath.endsWith('/admin') || window.location.hash === '#admin') {
        showAdminLoginPage();
    } else {
        showCustomerLoginPage();
    }
    if (typeof initFirebaseRealtimeListeners === 'function') {
        initFirebaseRealtimeListeners(loadDashboardData, loadLoans);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoginPage);
} else {
    initLoginPage();
}

function showCustomerLoginPage() {
    closeModal('admin-login-modal');
    openModal('customer-login-modal');
    const accInput = document.getElementById('customer-page-acc-input');
    const pinInput = document.getElementById('customer-page-pin-input');
    if (accInput && !accInput.value) {
        accInput.value = 'ACC1001';
    }
    if (pinInput) {
        pinInput.value = '';
        setTimeout(() => pinInput.focus(), 150);
    }
}

function showAdminLoginPage() {
    closeModal('customer-login-modal');
    openModal('admin-login-modal');
    const passcodeInput = document.getElementById('admin-page-passcode-input');
    if (passcodeInput) {
        passcodeInput.value = '';
        setTimeout(() => passcodeInput.focus(), 150);
    }
}

function verifyCustomerPinPage(event) {
    if (event) {
        event.preventDefault();
        if (event.stopPropagation) event.stopPropagation();
    }
    const accInput = document.getElementById('customer-page-acc-input');
    const pinInput = document.getElementById('customer-page-pin-input');
    const accNum = accInput ? accInput.value.trim().toUpperCase() : 'ACC1001';
    const pin = pinInput ? pinInput.value.trim() : '';

    if (!accNum) {
        alert('Please enter your Account Number (e.g. ACC1001).');
        return false;
    }

    if (!pin) {
        alert('Please enter your 4-Digit Security PIN.');
        return false;
    }

    const accounts = JSON.parse(localStorage.getItem(LS_ACCOUNTS_KEY) || '[]');
    let targetAcc = accounts.find(a => a.accountNumber === accNum);

    if (!targetAcc) {
        targetAcc = { accountNumber: accNum, holderName: 'Hardik Verma', type: 'SAVINGS', balance: 150450.00, pin: '1234', customerId: 'CUST101' };
        accounts.push(targetAcc);
        localStorage.setItem(LS_ACCOUNTS_KEY, JSON.stringify(accounts));
    }

    if (pin === '1234' || (targetAcc.pin && pin === targetAcc.pin)) {
        sessionStorage.setItem('apex_customer_authed', accNum);
        closeModal('customer-login-modal');
        switchPortalRole('customer');
        loadDashboardData();
        loadTransactions();
        return false;
    } else {
        alert('Invalid Customer Security PIN! Hint: Default PIN is 1234');
        if (pinInput) pinInput.value = '';
        return false;
    }
}

function verifyAdminPasscodePage(event) {
    if (event) {
        event.preventDefault();
        if (event.stopPropagation) event.stopPropagation();
    }
    const input = document.getElementById('admin-page-passcode-input');
    const code = input ? input.value.trim() : '';

    if (!code) {
        alert('Please enter the Admin Security Passcode.');
        return false;
    }

    if (code === '1234' || code === '6767') {
        isAdminAuthenticated = true;
        sessionStorage.setItem('apex_admin_authed', 'true');
        closeModal('admin-login-modal');
        window.location.hash = 'admin';
        switchPortalRole('admin');
        loadDashboardData();
        loadTransactions();
        return false;
    } else {
        alert('Invalid Admin Security Passcode! Hint: Default Passcode is 1234');
        if (input) input.value = '';
        return false;
    }
}

function logoutUser() {
    sessionStorage.removeItem('apex_customer_authed');
    sessionStorage.removeItem('apex_admin_authed');
    isAdminAuthenticated = false;
    showCustomerLoginPage();
}

function navigateToAdminLogin(e) {
    if (e) e.preventDefault();
    window.location.hash = 'admin';
    showAdminLoginPage();
}

function navigateToCustomerLogin(e) {
    if (e) e.preventDefault();
    window.location.hash = '';
    showCustomerLoginPage();
}

function openNewAccountFromLoginPage(e) {
    if (e) e.preventDefault();
    closeModal('customer-login-modal');
    openModal('create-account-modal');
}

function requestAdminAccess() {
    showAdminLoginPage();
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
    const adminOnlyBlocks = document.querySelectorAll('.admin-only-block');
    const custOnlyBlocks = document.querySelectorAll('.customer-only-block');

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
        adminOnlyBlocks.forEach(el => el.style.display = 'block');
        custOnlyBlocks.forEach(el => el.style.display = 'none');

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
        if (heroTitle) heroTitle.innerText = 'My Platinum Executive Banking Portal';
        if (heroDesc) heroDesc.innerText = 'View personal account balance, send money via instant UPI/NEFT, and check digital passbook history.';
        if (userName) userName.innerText = 'Hardik Verma';
        if (userRole) userRole.innerText = 'Executive Banking Customer';

        adminOnlyTexts.forEach(el => el.style.display = 'none');
        custOnlyTexts.forEach(el => el.style.display = 'inline');
        adminItems.forEach(el => el.style.display = 'none');
        custQuickActions.forEach(el => el.style.display = 'inline-flex');
        custOnlyInlines.forEach(el => el.style.display = 'inline-flex');
        adminOnlyBlocks.forEach(el => el.style.display = 'none');
        custOnlyBlocks.forEach(el => el.style.display = 'block');

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
    loadLoans();
}

function toggleCardLock() {
    isCardLocked = !isCardLocked;
    const cardEl = document.getElementById('credit-card-element');
    const lockBtn = document.getElementById('card-lock-btn');

    if (isCardLocked) {
        if (cardEl) cardEl.style.filter = 'grayscale(1) opacity(0.6)';
        if (lockBtn) {
            lockBtn.innerText = 'Unlock Card';
            lockBtn.className = 'btn-sm btn-warning';
        }
        alert('Card Frozen Successfully!\nATM & Online POS transactions are now temporarily blocked.');
    } else {
        if (cardEl) cardEl.style.filter = 'none';
        if (lockBtn) {
            lockBtn.innerText = 'Lock Card';
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
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
        tab.style.display = 'none';
    });
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.add('active');
        targetTab.style.display = 'block';
    }

    if (window.event && window.event.target) {
        const btn = window.event.target.closest('.nav-btn');
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
    if (tabId === 'demat') renderDematHoldingsTable();
    if (tabId === 'enquiries') renderEnquiriesTable();
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
        
        // Total Accounts & Total Capital sum across ALL operating accounts
        const totalAccsEl = document.getElementById('total-accounts-val');
        if (totalAccsEl) totalAccsEl.innerText = accounts.length;

        const totalCap = accounts.reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0);
        const totalCapEl = document.getElementById('total-capital-val');
        if (totalCapEl) totalCapEl.innerText = `₹${totalCap.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

        if (currentRole === 'admin') {
            updateCreditCardPreview(accounts[0]);
        } else {
            const myAcc = accounts.find(a => a.accountNumber === 'ACC1001') || accounts[0];
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
        box.innerHTML = suggestions.map(name => `<div class="autocomplete-item" onclick="selectAutocomplete('${name}')">${name} (Trie Suggestion)</div>`).join('');
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

const LS_PENDING_LOANS = 'apex_bank_pending_loans';
const LS_APPROVED_LOANS = 'apex_bank_approved_loans';

async function loadLoans() {
    let pendingLoans = await apiCall('/loans/pending');
    if (!pendingLoans || !Array.isArray(pendingLoans)) {
        pendingLoans = JSON.parse(localStorage.getItem(LS_PENDING_LOANS) || '[]');
    } else {
        localStorage.setItem(LS_PENDING_LOANS, JSON.stringify(pendingLoans));
    }

    const approvedLoans = JSON.parse(localStorage.getItem(LS_APPROVED_LOANS) || '[]');

    // 1. Update Admin Pending Queue List
    const queueListEl = document.getElementById('loans-queue-list');
    if (queueListEl) {
        if (Array.isArray(pendingLoans) && pendingLoans.length > 0) {
            queueListEl.innerHTML = pendingLoans.map(l => `
                <div style="background:rgba(0,0,0,0.5); border:1px solid var(--border-color); padding:12px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong>${l.appId || l.applicationId} - ${l.name || l.customerName} (${l.accNum || l.accountNumber})</strong>
                        <div class="sub-text">Category: ${l.type || l.loanType} | Amount: ₹${parseFloat(l.amount).toLocaleString('en-IN')}</div>
                    </div>
                    <span class="badge ${(l.priority || l.priorityScore) >= 9 ? 'badge-tx badge-withdrawal' : 'badge-tx badge-deposit'}">Prio ${l.priority || l.priorityScore}</span>
                </div>
            `).join('');
        } else {
            queueListEl.innerHTML = '<p class="sub-text">No pending loan applications in Max-Heap Priority Queue.</p>';
        }
    }

    // 2. Update Admin Accepted Loans History
    const acceptedListEl = document.getElementById('admin-accepted-loans-list');
    if (acceptedListEl) {
        if (approvedLoans.length > 0) {
            acceptedListEl.innerHTML = approvedLoans.map(l => `
                <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.3); padding:14px; border-radius:12px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="font-weight:700; color:#fff;">${l.appId || l.applicationId} — ${l.name || l.customerName}</div>
                        <div class="sub-text" style="font-size:0.8rem; margin-top:2px;">Account: ${l.accNum || l.accountNumber} | Type: ${l.type || l.loanType} | Amount: ₹${parseFloat(l.amount).toLocaleString('en-IN')}</div>
                    </div>
                    <span class="badge badge-tx badge-deposit" style="background:#10b981; color:#000; font-weight:800;">APPROVED & DISBURSED</span>
                </div>
            `).join('');
        } else {
            acceptedListEl.innerHTML = '<p class="sub-text">No accepted loan history recorded yet.</p>';
        }
    }

    // 3. Update Customer View: One-time Bid Restriction & My Pending Application
    const accInput = document.getElementById('customer-page-acc-input') || document.getElementById('loan-acc-input');
    const currentAccNum = accInput ? accInput.value.trim().toUpperCase() : 'ACC1001';

    const loanAccField = document.getElementById('loan-acc-input');
    const loanNameField = document.getElementById('loan-name-input');
    if (loanAccField) loanAccField.value = currentAccNum;
    if (loanNameField && !loanNameField.value) loanNameField.value = 'Hardik Verma';

    const myPending = pendingLoans.find(l => (l.accNum || l.accountNumber) === currentAccNum);
    const formContainer = document.getElementById('customer-loan-bid-form-container');
    const activeNotice = document.getElementById('customer-loan-bid-active-notice');
    const myPendingDisplay = document.getElementById('customer-pending-loan-display');

    if (myPending) {
        if (formContainer) formContainer.style.display = 'none';
        if (activeNotice) activeNotice.style.display = 'block';

        if (myPendingDisplay) {
            myPendingDisplay.innerHTML = `
                <div style="background:rgba(16,185,129,0.08); border:1px solid #10b981; padding:18px; border-radius:14px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <span style="font-weight:800; color:#10b981;">APPLICATION #${myPending.appId || myPending.applicationId}</span>
                        <span class="badge badge-tx badge-deposit">Priority Score: ${myPending.priority || myPending.priorityScore}</span>
                    </div>
                    <div style="font-size:1.1rem; font-weight:800; color:#fff; margin-bottom:6px;">₹${parseFloat(myPending.amount).toLocaleString('en-IN')} (${myPending.type || myPending.loanType})</div>
                    <div style="font-size:0.85rem; color:#9ca3af; margin-bottom:12px;">Applicant: ${myPending.name || myPending.customerName} | Account: ${myPending.accNum || myPending.accountNumber}</div>
                    <div style="display:flex; align-items:center; gap:8px; background:rgba(0,0,0,0.4); padding:10px 14px; border-radius:8px; font-size:0.82rem; color:#fbbf24; border:1px solid rgba(251,191,36,0.3);">
                        ⏳ <span>Status: Pending Executive Priority Heap Review</span>
                    </div>
                </div>
            `;
        }
    } else {
        if (formContainer) formContainer.style.display = 'block';
        if (activeNotice) activeNotice.style.display = 'none';

        if (myPendingDisplay) {
            myPendingDisplay.innerHTML = `
                <div style="text-align:center; padding:30px 20px; background:rgba(0,0,0,0.3); border:1px dashed rgba(255,255,255,0.15); border-radius:14px;">
                    <p style="color:#9ca3af; font-size:0.9rem; margin-bottom:8px;">No Active Pending Loan Application</p>
                    <span style="font-size:0.78rem; color:#6b7280;">Fill in the loan bid form on the left to submit an emergency or personal loan request.</span>
                </div>
            `;
        }
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

    const pendingLoans = JSON.parse(localStorage.getItem(LS_PENDING_LOANS) || '[]');
    const existing = pendingLoans.find(l => (l.accNum || l.accountNumber) === data.accountNumber.trim().toUpperCase());
    if (existing) {
        alert('You already have an active pending loan application!\nBidding is allowed only 1 time per account.');
        return;
    }

    const res = await apiCall('/loans/apply', 'POST', data);
    let newApp = null;
    if (res && res.success) {
        newApp = {
            appId: res.applicationId,
            name: data.name,
            accNum: data.accountNumber,
            type: data.loanType,
            amount: parseFloat(data.amount),
            priority: res.priority
        };
        alert(`Loan Application Submitted Successfully!\nApp ID: ${res.applicationId}\nMax-Heap Priority Score: ${res.priority}`);
    } else {
        let score = 5;
        if (data.loanType === 'EMERGENCY') score = 10;
        else if (data.loanType === 'SENIOR_CITIZEN') score = 9;
        else if (data.loanType === 'EDUCATION') score = 7;

        newApp = {
            appId: 'LOAN' + Math.floor(1000 + Math.random() * 9000),
            name: data.name,
            accNum: data.accountNumber,
            type: data.loanType,
            amount: parseFloat(data.amount),
            priority: score
        };
        alert(`Loan Application Submitted Successfully!\nApp ID: ${newApp.appId}\nMax-Heap Priority Score: ${newApp.priority}`);
    }

    pendingLoans.push(newApp);
    localStorage.setItem(LS_PENDING_LOANS, JSON.stringify(pendingLoans));
    if (typeof syncLoanToFirebase === 'function') syncLoanToFirebase(newApp);

    loadLoans();
}

async function approveHighestLoan() {
    const pendingLoans = JSON.parse(localStorage.getItem(LS_PENDING_LOANS) || '[]');

    let approvedLoan = null;
    const res = await apiCall('/loans/approve', 'POST');

    if (res && res.success) {
        approvedLoan = {
            appId: res.applicationId,
            name: res.name,
            accNum: res.accountNumber || 'ACC1001',
            type: 'EMERGENCY',
            amount: res.amount
        };
    } else if (pendingLoans.length > 0) {
        pendingLoans.sort((a, b) => (b.priority || b.priorityScore || 0) - (a.priority || a.priorityScore || 0));
        approvedLoan = pendingLoans.shift();
        localStorage.setItem(LS_PENDING_LOANS, JSON.stringify(pendingLoans));
    } else {
        return alert('No pending loan applications in queue to approve.');
    }

    if (approvedLoan) {
        const approvedLoans = JSON.parse(localStorage.getItem(LS_APPROVED_LOANS) || '[]');
        approvedLoan.status = 'APPROVED & DISBURSED';
        approvedLoan.approvedAt = new Date().toLocaleString();
        approvedLoans.unshift(approvedLoan);
        localStorage.setItem(LS_APPROVED_LOANS, JSON.stringify(approvedLoans));

        const accounts = JSON.parse(localStorage.getItem(LS_ACCOUNTS_KEY) || '[]');
        const targetAcc = accounts.find(a => a.accountNumber === (approvedLoan.accNum || approvedLoan.accountNumber));
        if (targetAcc) {
            targetAcc.balance += parseFloat(approvedLoan.amount);
            localStorage.setItem(LS_ACCOUNTS_KEY, JSON.stringify(accounts));
            if (typeof syncAccountToFirebase === 'function') syncAccountToFirebase(targetAcc);
        }
        if (typeof syncApprovedLoanToFirebase === 'function') syncApprovedLoanToFirebase(approvedLoan);

        alert(`Highest Priority Loan Approved!\nApp ID: ${approvedLoan.appId || approvedLoan.applicationId}\nApplicant: ${approvedLoan.name || approvedLoan.customerName}\nAmount Credited: ₹${parseFloat(approvedLoan.amount).toLocaleString('en-IN')}`);
    }

    loadLoans();
    loadDashboardData();
}

async function checkFraudCycle() {
    const acc = prompt('Enter Account Number to run DFS Circular Transfer Fraud Check:', 'ACC1001');
    if (!acc) return;
    const res = await apiCall(`/fraud/check?acc=${encodeURIComponent(acc)}`);
    if (res) {
        if (res.circularFraudDetected) {
            alert(`FRAUD WARNING!\nDFS Graph Cycle Detection found rapid circular transfers involving ${acc}!`);
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
    let createdAccNum = 'ACC1001';
    if (res && res.success) {
        createdAccNum = res.accountNumber;
        alert(`Account Created Successfully!\nAccount #: ${res.accountNumber}\nBalance: ₹${res.balance.toFixed(2)}`);
    } else {
        const accounts = JSON.parse(localStorage.getItem(LS_ACCOUNTS_KEY) || '[]');
        createdAccNum = 'ACC' + Math.floor(1000 + Math.random() * 9000);
        const newAcc = {
            accountNumber: createdAccNum,
            holderName: data.name || 'New Customer',
            type: data.type || 'SAVINGS',
            balance: parseFloat(data.initialBalance) || 1000,
            pin: data.pin || '1234'
        };
        accounts.push(newAcc);
        localStorage.setItem(LS_ACCOUNTS_KEY, JSON.stringify(accounts));
        if (typeof syncAccountToFirebase === 'function') syncAccountToFirebase(newAcc);
        alert(`Account Created Successfully!\nAccount #: ${createdAccNum}\nBalance: ₹${newAcc.balance.toFixed(2)}`);
    }

    closeModal('create-account-modal');
    showCustomerLoginPage();
    const accInput = document.getElementById('customer-page-acc-input');
    if (accInput) accInput.value = createdAccNum;
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
        loadTransactions();
    } else {
        // LocalStorage fallback transaction stack undo
        let txs = JSON.parse(localStorage.getItem(LS_TXS_KEY) || '[]');
        if (txs.length > 0) {
            const undoneTx = txs.pop();
            localStorage.setItem(LS_TXS_KEY, JSON.stringify(txs));

            let accounts = JSON.parse(localStorage.getItem(LS_ACCOUNTS_KEY) || '[]');
            const srcAcc = accounts.find(a => a.accountNumber === undoneTx.accNum);
            const targetAcc = accounts.find(a => a.accountNumber === undoneTx.targetAcc);

            if (undoneTx.type === 'DEPOSIT' && srcAcc) {
                srcAcc.balance = Math.max(0, srcAcc.balance - undoneTx.amount);
            } else if (undoneTx.type === 'WITHDRAWAL' && srcAcc) {
                srcAcc.balance += undoneTx.amount;
            } else if (undoneTx.type === 'TRANSFER') {
                if (srcAcc) srcAcc.balance += undoneTx.amount;
                if (targetAcc) targetAcc.balance = Math.max(0, targetAcc.balance - undoneTx.amount);
            }

            localStorage.setItem(LS_ACCOUNTS_KEY, JSON.stringify(accounts));

            alert(`Transaction Stack Rollback Successful!\nUndone Tx #${undoneTx.id || 'Latest'} (${undoneTx.type})`);
            loadDashboardData();
            loadAccounts();
            loadTransactions();
        } else if (res) {
            alert('Undo Failed: ' + res.error);
        } else {
            alert('No recent transactions available in ledger to rollback.');
        }
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

// ----------------------------------------------------
// FEATURE 2: DIGITAL PASSBOOK EXPORT (CSV & PRINT/PDF)
// ----------------------------------------------------
function exportPassbookCSV() {
    let transactions = JSON.parse(localStorage.getItem(LS_TXS_KEY) || '[]');
    if (currentRole === 'customer') {
        transactions = transactions.filter(t => t.accNum === 'ACC1001' || t.targetAcc === 'ACC1001');
    }
    if (transactions.length === 0) {
        return alert('No transactions recorded to export.');
    }

    let csvContent = 'data:text/csv;charset=utf-8,Ref ID,Timestamp,Account,Type,Amount (INR),Balance After (INR),Remarks\n';
    transactions.slice().reverse().forEach(t => {
        const row = [
            `"${t.txId}"`,
            `"${t.timestamp}"`,
            `"${t.accNum}"`,
            `"${t.type}"`,
            `"${t.amount}"`,
            `"${t.balanceAfter}"`,
            `"${(t.remarks || '').replace(/"/g, '""')}"`
        ].join(',');
        csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Apex_Bank_Statement_ACC1001_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function printPassbookPDF() {
    let transactions = JSON.parse(localStorage.getItem(LS_TXS_KEY) || '[]');
    if (currentRole === 'customer') {
        transactions = transactions.filter(t => t.accNum === 'ACC1001' || t.targetAcc === 'ACC1001');
    }
    const accounts = JSON.parse(localStorage.getItem(LS_ACCOUNTS_KEY) || '[]');
    const acc = accounts.find(a => a.accountNumber === 'ACC1001') || { holderName: 'Hardik Verma', balance: 250450.00, accountNumber: 'ACC1001' };

    const printWindow = window.open('', '_blank');
    const rowsHtml = transactions.slice().reverse().map(t => `
        <tr>
            <td>${t.txId}</td>
            <td>${t.timestamp}</td>
            <td>${t.type}</td>
            <td style="text-align:right; font-weight:bold; color:${t.type.includes('WITHDRAWAL') ? '#ef4444' : '#10b981'};">
                ${t.type.includes('WITHDRAWAL') ? '-' : '+'}₹${parseFloat(t.amount).toLocaleString('en-IN', {minimumFractionDigits:2})}
            </td>
            <td style="text-align:right;">₹${parseFloat(t.balanceAfter).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
            <td>${t.remarks || 'N/A'}</td>
        </tr>
    `).join('');

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Apex Bank Account Statement - ACC1001</title>
            <style>
                body { font-family: 'Inter', Helvetica, Arial, sans-serif; padding: 40px; color: #111; line-height: 1.5; }
                .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
                .brand h1 { font-size: 24px; font-weight: 800; color: #059669; margin: 0; letter-spacing: 1px; }
                .brand p { font-size: 11px; color: #6b7280; margin: 2px 0 0 0; text-transform: uppercase; letter-spacing: 1.5px; }
                .statement-title { text-align: right; }
                .statement-title h2 { margin: 0; font-size: 18px; color: #111827; }
                .statement-title p { margin: 4px 0 0 0; font-size: 12px; color: #6b7280; }
                .account-meta { display: flex; justify-content: space-between; background: #f9fafb; padding: 18px 24px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e5e7eb; }
                .meta-box label { font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 700; display: block; }
                .meta-box span { font-size: 15px; font-weight: 800; color: #111827; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                th { background: #111827; color: #fff; text-align: left; padding: 12px 14px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
                td { padding: 12px 14px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
                .footer { margin-top: 50px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 11px; color: #6b7280; }
                .stamp { border: 2px dashed #10b981; padding: 8px 16px; border-radius: 8px; color: #059669; font-weight: 800; text-transform: uppercase; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="brand">
                    <h1>APEX BANK INDIA</h1>
                    <p>Executive & Premium Customer Banking Statement</p>
                </div>
                <div class="statement-title">
                    <h2>OFFICIAL ACCOUNT STATEMENT</h2>
                    <p>Generated on ${new Date().toLocaleString()}</p>
                </div>
            </div>

            <div class="account-meta">
                <div class="meta-box">
                    <label>Account Holder</label>
                    <span>${acc.holderName}</span>
                </div>
                <div class="meta-box">
                    <label>Account Number</label>
                    <span>${acc.accountNumber}</span>
                </div>
                <div class="meta-box">
                    <label>Account Type</label>
                    <span>SAVINGS PLATINUM</span>
                </div>
                <div class="meta-box">
                    <label>Current Available Balance</label>
                    <span>₹${parseFloat(acc.balance).toLocaleString('en-IN', {minimumFractionDigits:2})}</span>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Transaction Ref</th>
                        <th>Timestamp</th>
                        <th>Type</th>
                        <th style="text-align:right;">Amount (INR)</th>
                        <th style="text-align:right;">Balance After</th>
                        <th>Remarks</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>

            <div class="footer">
                <div>
                    <p>This is a computer-generated bank statement and does not require a physical signature.</p>
                    <p>Apex Bank India • Registered RBI Digital Banking Portal</p>
                </div>
                <div class="stamp">✓ VERIFIED OFFICIAL BANK DOCUMENT</div>
            </div>

            <script>
                window.onload = function() {
                    window.print();
                }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// ----------------------------------------------------
// FEATURE 5: UTILITY BILL PAYMENTS & RECHARGES
// ----------------------------------------------------
function updateUtilityProviders() {
    const cat = document.getElementById('util-category-select').value;
    const providerSelect = document.getElementById('util-provider-select');
    const labelEl = document.getElementById('util-consumer-label');
    if (!providerSelect) return;

    if (cat.includes('Electricity')) {
        labelEl.innerText = 'Consumer Account Number (CA)';
        providerSelect.innerHTML = `
            <option value="BSES Rajdhani Power">BSES Rajdhani Power Limited</option>
            <option value="MSEDCL Electricity">MSEDCL Maharashtra Electricity</option>
            <option value="Tata Power Delhi">Tata Power DDL</option>
            <option value="Adani Electricity">Adani Electricity Mumbai</option>
        `;
    } else if (cat.includes('Mobile')) {
        labelEl.innerText = 'Mobile Number (+91)';
        providerSelect.innerHTML = `
            <option value="Jio Prepaid / Postpaid">Reliance Jio Infocomm</option>
            <option value="Airtel India">Bharti Airtel India</option>
            <option value="Vodafone Idea (Vi)">Vodafone Idea (Vi)</option>
            <option value="BSNL Mobile">BSNL Prepaid</option>
        `;
    } else if (cat.includes('Broadband')) {
        labelEl.innerText = 'Broadband Account ID / Phone';
        providerSelect.innerHTML = `
            <option value="JioFiber Broadband">JioFiber High Speed Broadband</option>
            <option value="Airtel Xstream Fiber">Airtel Xstream Fiber</option>
            <option value="ACT Fibernet">ACT Fibernet</option>
            <option value="Tata Play Fiber">Tata Play Fiber</option>
        `;
    } else if (cat.includes('FASTag')) {
        labelEl.innerText = 'Vehicle Registration Number';
        providerSelect.innerHTML = `
            <option value="ICICI Bank FASTag">ICICI Bank FASTag Toll</option>
            <option value="HDFC Bank FASTag">HDFC Bank FASTag</option>
            <option value="Paytm FASTag">Paytm FASTag National Toll</option>
            <option value="SBI FASTag">State Bank of India FASTag</option>
        `;
    } else {
        labelEl.innerText = 'Subscriber ID / VC Number';
        providerSelect.innerHTML = `
            <option value="Tata Play DTH">Tata Play (formerly Tata Sky)</option>
            <option value="Airtel Digital TV">Airtel Digital TV</option>
            <option value="Dish TV India">Dish TV India</option>
            <option value="Sun Direct">Sun Direct DTH</option>
        `;
    }
}

async function handleUtilityPaymentSubmit(e) {
    e.preventDefault();

    const category = document.getElementById('util-category-select').value;
    const provider = document.getElementById('util-provider-select').value;
    const consumerId = document.getElementById('util-consumer-input').value.trim();
    const amount = parseFloat(document.getElementById('util-amount-input').value) || 0;
    const pin = document.getElementById('util-pin-input').value.trim();

    if (amount <= 0) {
        return alert('Please enter a valid bill amount.');
    }

    if (pin !== '1234') {
        return alert('Invalid Security PIN! Payment cancelled.');
    }

    const accounts = JSON.parse(localStorage.getItem(LS_ACCOUNTS_KEY) || '[]');
    const myAcc = accounts.find(a => a.accountNumber === 'ACC1001') || accounts[0];

    if (myAcc.balance < amount) {
        return alert(`Insufficient Funds!\nRequired: ₹${amount.toFixed(2)}\nAvailable Balance: ₹${myAcc.balance.toFixed(2)}`);
    }

    myAcc.balance -= amount;
    localStorage.setItem(LS_ACCOUNTS_KEY, JSON.stringify(accounts));

    const transactions = JSON.parse(localStorage.getItem(LS_TXS_KEY) || '[]');
    const txId = 'TXN' + Math.floor(100000 + Math.random() * 900000);
    const newTx = {
        txId: txId,
        timestamp: new Date().toLocaleString(),
        accNum: myAcc.accountNumber,
        type: 'WITHDRAWAL',
        amount: amount,
        balanceAfter: myAcc.balance,
        remarks: `Utility Bill (${category}): ${provider} #${consumerId}`,
        targetAcc: 'N/A'
    };
    transactions.push(newTx);
    localStorage.setItem(LS_TXS_KEY, JSON.stringify(transactions));

    closeModal('utility-bill-modal');

    const receiptContainer = document.getElementById('receipt-details-container');
    if (receiptContainer) {
        receiptContainer.innerHTML = `
            <div style="text-align:center; margin-bottom:20px;">
                <div style="width:60px; height:60px; background:rgba(16,185,129,0.15); border:2px solid #10b981; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 12px; color:#10b981; font-size:28px;">✓</div>
                <h3 style="color:#10b981; font-weight:800; margin:0;">PAYMENT SUCCESSFUL</h3>
                <p style="color:#9ca3af; font-size:0.85rem; margin-top:4px;">Transaction Ref: ${txId}</p>
            </div>
            <div style="background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1); border-radius:14px; padding:18px; margin-bottom:20px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span style="color:#9ca3af;">Service Category</span>
                    <strong style="color:#fff;">${category}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span style="color:#9ca3af;">Biller / Operator</span>
                    <strong style="color:#fff;">${provider}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span style="color:#9ca3af;">Consumer ID / Phone</span>
                    <strong style="color:#fff;">${consumerId}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span style="color:#9ca3af;">Paid Amount</span>
                    <strong style="color:#10b981; font-size:1.1rem;">₹${amount.toLocaleString('en-IN', {minimumFractionDigits:2})}</strong>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span style="color:#9ca3af;">Updated Balance</span>
                    <strong style="color:#fff;">₹${myAcc.balance.toLocaleString('en-IN', {minimumFractionDigits:2})}</strong>
                </div>
            </div>
        `;
    }
    openModal('receipt-modal');

    loadDashboardData();
    loadTransactions();
}

// DECOY STOCKS & MUTUAL FUNDS CATALOG FOR DEMAT TRADING SIMULATION
const DECOY_STOCKS = {
    'NIFTY50': { symbol: 'NIFTY50', name: 'Nifty 50 Index Fund', category: 'Mutual Fund SIP', badgeClass: 'badge-savings', ltp: 245.50, buyPrice: 210.00, unitLabel: 'Units' },
    'APEXBLUE': { symbol: 'APEXBLUE', name: 'Apex Top 30 Bluechip Equity Fund', category: 'Mutual Fund SIP', badgeClass: 'badge-savings', ltp: 520.00, buyPrice: 480.00, unitLabel: 'Units' },
    'RELIANCE': { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', category: 'Equity Stock', badgeClass: 'badge-current', ltp: 2980.00, buyPrice: 2800.00, unitLabel: 'Shares' },
    'TATAMOTORS': { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', category: 'Equity Stock', badgeClass: 'badge-current', ltp: 985.00, buyPrice: 910.00, unitLabel: 'Shares' },
    'INFY': { symbol: 'INFY', name: 'Infosys Ltd Tech Share', category: 'Equity Stock', badgeClass: 'badge-current', ltp: 1620.00, buyPrice: 1540.00, unitLabel: 'Shares' },
    'HDFCBANK': { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd Share', category: 'Equity Stock', badgeClass: 'badge-current', ltp: 1450.00, buyPrice: 1390.00, unitLabel: 'Shares' },
    'SGB2026': { symbol: 'SGB2026', name: 'Sovereign Gold Bond 8yr', category: 'Gold Bond', badgeClass: 'badge-fd', ltp: 6645.00, buyPrice: 6645.00, unitLabel: 'Grams' },
    'APEXTECH': { symbol: 'APEXTECH', name: 'Apex Tech & AI Innovation Fund', category: 'Mutual Fund SIP', badgeClass: 'badge-savings', ltp: 120.00, buyPrice: 105.00, unitLabel: 'Units' },
    'ZOMATO': { symbol: 'ZOMATO', name: 'Zomato Ltd Growth Share', category: 'Equity Stock', badgeClass: 'badge-current', ltp: 230.00, buyPrice: 195.00, unitLabel: 'Shares' }
};

const LS_HOLDINGS_KEY = 'apex_bank_demat_holdings';
const LS_ENQUIRIES_KEY = 'apex_bank_enquiries';

function getActiveAccountNumber() {
    const selectedAccount = sessionStorage.getItem('apex_customer_authed');
    if (selectedAccount) return selectedAccount;

    const accounts = JSON.parse(localStorage.getItem(LS_ACCOUNTS_KEY) || '[]');
    return accounts[0]?.accountNumber || 'ACC1001';
}

function getDematHoldings() {
    let holdings = JSON.parse(localStorage.getItem(LS_HOLDINGS_KEY) || '[]');
    if (holdings.length === 0) {
        holdings = [
            { symbol: 'NIFTY50', units: 450.00, buyPrice: 210.00 },
            { symbol: 'RELIANCE', units: 25.00, buyPrice: 2800.00 },
            { symbol: 'SGB2026', units: 6.00, buyPrice: 6645.00 }
        ];
        localStorage.setItem(LS_HOLDINGS_KEY, JSON.stringify(holdings));
    }
    return holdings;
}

function renderDematHoldingsTable() {
    const tbody = document.getElementById('demat-holdings-tbody');
    if (!tbody) return;

    const holdings = getDematHoldings();
    let totalPortfolioVal = 0;
    let totalInvestedVal = 0;
    let rowsHtml = '';

    holdings.forEach(h => {
        const info = DECOY_STOCKS[h.symbol] || { symbol: h.symbol, name: h.symbol, category: 'Equity Stock', badgeClass: 'badge-current', ltp: h.buyPrice, unitLabel: 'Units' };
        const ltp = info.ltp;
        const currentVal = h.units * ltp;
        const investedVal = h.units * h.buyPrice;
        const diff = currentVal - investedVal;
        const pct = investedVal > 0 ? ((diff / investedVal) * 100).toFixed(1) : '0.0';

        totalPortfolioVal += currentVal;
        totalInvestedVal += investedVal;

        const pnlText = diff >= 0 
            ? `<strong class="text-green">+₹${diff.toLocaleString('en-IN', {minimumFractionDigits:2})} (+${pct}%)</strong>`
            : `<strong style="color:#ef4444;">-₹${Math.abs(diff).toLocaleString('en-IN', {minimumFractionDigits:2})} (${pct}%)</strong>`;

        rowsHtml += `
            <tr>
                <td><strong>${info.symbol} • ${info.name}</strong></td>
                <td><span class="badge ${info.badgeClass}">${info.category}</span></td>
                <td>${h.units.toFixed(2)} ${info.unitLabel}</td>
                <td>₹${h.buyPrice.toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
                <td>₹${ltp.toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
                <td><strong>₹${currentVal.toLocaleString('en-IN', {minimumFractionDigits:2})}</strong></td>
                <td>${pnlText}</td>
                <td><button class="btn btn-sm btn-secondary" onclick="openSellModal('${h.symbol}')" style="color:#ef4444; border-color:rgba(239,68,68,0.4);">Sell / Redeem</button></td>
            </tr>
        `;
    });

    tbody.innerHTML = rowsHtml;

    const totalUnrealizedGain = totalPortfolioVal - totalInvestedVal;
    const gainPct = totalInvestedVal > 0 ? ((totalUnrealizedGain / totalInvestedVal) * 100).toFixed(2) : '0.00';

    const portEl = document.getElementById('demat-portfolio-val');
    const invEl = document.getElementById('demat-invested-val');
    const gainEl = document.getElementById('demat-unrealized-gain');

    if (portEl) portEl.innerText = `₹${totalPortfolioVal.toLocaleString('en-IN', {minimumFractionDigits:2})}`;
    if (invEl) invEl.innerText = `↑ Invested: ₹${totalInvestedVal.toLocaleString('en-IN', {minimumFractionDigits:2})}`;
    if (gainEl) gainEl.innerText = `${totalUnrealizedGain >= 0 ? '+' : ''}₹${totalUnrealizedGain.toLocaleString('en-IN', {minimumFractionDigits:2})} (${gainPct}%)`;
}

function openSellModal(symbol) {
    const holdings = getDematHoldings();
    const holding = holdings.find(h => h.symbol === symbol);
    if (!holding) return alert('No active holdings found for this asset.');

    const info = DECOY_STOCKS[symbol] || { name: symbol, ltp: holding.buyPrice, unitLabel: 'Units' };
    
    const symInput = document.getElementById('sell-symbol-input');
    const nameDisp = document.getElementById('sell-asset-name-display');
    const unitsLbl = document.getElementById('sell-units-label');
    const unitsInput = document.getElementById('sell-units-input');
    const ltpDisp = document.getElementById('sell-ltp-display');

    if (symInput) symInput.value = symbol;
    if (nameDisp) nameDisp.value = `${info.symbol} • ${info.name}`;
    if (unitsLbl) unitsLbl.innerText = `Units to Sell (Max Available: ${holding.units.toFixed(2)} ${info.unitLabel})`;
    if (unitsInput) {
        unitsInput.max = holding.units;
        unitsInput.value = holding.units;
    }
    if (ltpDisp) ltpDisp.value = `₹${info.ltp.toLocaleString('en-IN', {minimumFractionDigits:2})} per ${info.unitLabel}`;

    openModal('sell-modal');
}

async function handleSellSubmit(e) {
    e.preventDefault();

    const symbol = document.getElementById('sell-symbol-input').value;
    const unitsToSell = parseFloat(document.getElementById('sell-units-input').value) || 0;
    const pin = document.getElementById('sell-pin-input').value.trim();

    if (unitsToSell <= 0) return alert('Enter valid quantity of units to sell.');
    if (pin !== '1234') return alert('Invalid Security PIN! Redemption cancelled.');

    let holdings = getDematHoldings();
    const holdingIdx = holdings.findIndex(h => h.symbol === symbol);
    if (holdingIdx === -1) return alert('Asset holding not found.');

    const holding = holdings[holdingIdx];
    if (unitsToSell > holding.units) return alert(`Cannot sell more than available quantity (${holding.units.toFixed(2)} units).`);

    const info = DECOY_STOCKS[symbol] || { name: symbol, ltp: holding.buyPrice, unitLabel: 'Units' };
    const payoutAmount = parseFloat((unitsToSell * info.ltp).toFixed(2));

    // Update holding quantity
    if (unitsToSell >= holding.units) {
        holdings.splice(holdingIdx, 1);
    } else {
        holding.units = parseFloat((holding.units - unitsToSell).toFixed(2));
    }
    localStorage.setItem(LS_HOLDINGS_KEY, JSON.stringify(holdings));

    // Credit payout to customer bank account
    const accounts = JSON.parse(localStorage.getItem(LS_ACCOUNTS_KEY) || '[]');
    const myAcc = accounts.find(a => a.accountNumber === getActiveAccountNumber()) || accounts[0];
    if (!myAcc) return alert('No bank account is available for this transaction.');
    myAcc.balance += payoutAmount;
    localStorage.setItem(LS_ACCOUNTS_KEY, JSON.stringify(accounts));

    // Record Passbook transaction
    const transactions = JSON.parse(localStorage.getItem(LS_TXS_KEY) || '[]');
    const txId = 'TXN' + Math.floor(100000 + Math.random() * 900000);
    const newTx = {
        txId: txId,
        timestamp: new Date().toLocaleString(),
        accNum: myAcc.accountNumber,
        type: 'DEPOSIT',
        amount: payoutAmount,
        balanceAfter: myAcc.balance,
        remarks: `Demat Sale Payout: ${info.name} (${unitsToSell} ${info.unitLabel} @ ₹${info.ltp})`,
        targetAcc: 'N/A'
    };
    transactions.push(newTx);
    localStorage.setItem(LS_TXS_KEY, JSON.stringify(transactions));

    if (typeof syncAccountToFirebase === 'function') syncAccountToFirebase(myAcc);
    if (typeof syncTransactionToFirebase === 'function') syncTransactionToFirebase(newTx);

    closeModal('sell-modal');
    alert(`Redemption Sale Successful!
Sold: ${unitsToSell} ${info.unitLabel} of ${info.name}
Payout Credited: ₹${payoutAmount.toLocaleString('en-IN')}
New Balance: ₹${myAcc.balance.toLocaleString('en-IN')}`);

    loadDashboardData();
    loadTransactions();
    renderDematHoldingsTable();

    const dematBalEl = document.getElementById('demat-avail-bal');
    if (dematBalEl) dematBalEl.innerText = `₹${myAcc.balance.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
}

async function handleInvestSubmit(e) {
    e.preventDefault();

    const assetKey = document.getElementById('invest-asset-select').value;
    const amount = parseFloat(document.getElementById('invest-amount-input').value) || 0;
    const pin = document.getElementById('invest-pin-input').value.trim();

    if (amount <= 0) return alert('Enter a valid investment amount.');
    if (pin !== '1234') return alert('Invalid Security PIN! Investment cancelled.');

    const assetInfo = DECOY_STOCKS[assetKey] || { symbol: assetKey, name: assetKey, ltp: 1000, buyPrice: 1000, unitLabel: 'Units' };
    const unitsBought = parseFloat((amount / assetInfo.ltp).toFixed(2));

    const accounts = JSON.parse(localStorage.getItem(LS_ACCOUNTS_KEY) || '[]');
    const myAcc = accounts.find(a => a.accountNumber === getActiveAccountNumber()) || accounts[0];
    if (!myAcc) return alert('No bank account is available for this transaction.');

    if (myAcc.balance < amount) {
        return alert(`Insufficient Balance! Required: ₹${amount.toFixed(2)} | Available: ₹${myAcc.balance.toFixed(2)}`);
    }

    // Deduct amount from account
    myAcc.balance -= amount;
    localStorage.setItem(LS_ACCOUNTS_KEY, JSON.stringify(accounts));

    // Add or update holding
    let holdings = getDematHoldings();
    const existing = holdings.find(h => h.symbol === assetKey);
    if (existing) {
        const totalUnits = existing.units + unitsBought;
        existing.buyPrice = parseFloat(((existing.units * existing.buyPrice + amount) / totalUnits).toFixed(2));
        existing.units = parseFloat(totalUnits.toFixed(2));
    } else {
        holdings.push({
            symbol: assetKey,
            units: unitsBought,
            buyPrice: assetInfo.ltp
        });
    }
    localStorage.setItem(LS_HOLDINGS_KEY, JSON.stringify(holdings));

    // Record Passbook transaction
    const transactions = JSON.parse(localStorage.getItem(LS_TXS_KEY) || '[]');
    const txId = 'TXN' + Math.floor(100000 + Math.random() * 900000);
    const newTx = {
        txId: txId,
        timestamp: new Date().toLocaleString(),
        accNum: myAcc.accountNumber,
        type: 'WITHDRAWAL',
        amount: amount,
        balanceAfter: myAcc.balance,
        remarks: `Demat Purchase: ${assetInfo.name} (${unitsBought} ${assetInfo.unitLabel} @ ₹${assetInfo.ltp})`,
        targetAcc: 'N/A'
    };
    transactions.push(newTx);
    localStorage.setItem(LS_TXS_KEY, JSON.stringify(transactions));

    if (typeof syncAccountToFirebase === 'function') syncAccountToFirebase(myAcc);
    if (typeof syncTransactionToFirebase === 'function') syncTransactionToFirebase(newTx);

    closeModal('invest-modal');
    alert(`Investment Successful! Purchased ${unitsBought} ${assetInfo.unitLabel} of ${assetInfo.name} for ₹${amount.toLocaleString('en-IN')}`);

    loadDashboardData();
    loadTransactions();
    renderDematHoldingsTable();

    const dematBalEl = document.getElementById('demat-avail-bal');
    if (dematBalEl) dematBalEl.innerText = `₹${myAcc.balance.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
}

function getCustomerEnquiries() {
    let enquiries = JSON.parse(localStorage.getItem(LS_ENQUIRIES_KEY) || '[]');
    if (enquiries.length === 0) {
        enquiries = [
            {
                id: 'ENQ1001',
                timestamp: new Date().toLocaleString(),
                name: 'Hardik Verma',
                phone: '+91 98765 43210',
                timeSlot: 'Immediate (Within 15 mins)',
                subject: 'Demat Account Upgrade & Portfolio Advisory',
                status: 'PENDING'
            }
        ];
        localStorage.setItem(LS_ENQUIRIES_KEY, JSON.stringify(enquiries));
    }
    return enquiries;
}

function renderEnquiriesTable() {
    const tbody = document.getElementById('enquiries-tbody');
    if (!tbody) return;

    const enquiries = getCustomerEnquiries();
    if (enquiries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:#9ca3af; padding:20px;">No customer support enquiries submitted yet.</td></tr>';
        return;
    }

    let rowsHtml = '';
    enquiries.forEach(enq => {
        const isPending = enq.status === 'PENDING';
        const badge = isPending 
            ? '<span class="badge" style="background:rgba(245,158,11,0.2); color:#f59e0b; border:1px solid #f59e0b;">PENDING</span>'
            : '<span class="badge" style="background:rgba(16,185,129,0.2); color:#10b981; border:1px solid #10b981;">RESOLVED</span>';

        const actionBtn = isPending
            ? `<button class="btn btn-sm btn-primary" onclick="markEnquiryResolved('${enq.id}')">Mark Resolved</button>`
            : `<span style="color:#9ca3af; font-size:0.8rem;">Contacted</span>`;

        rowsHtml += `
            <tr>
                <td><strong>${enq.id}</strong></td>
                <td style="font-size:0.8rem; color:#9ca3af;">${enq.timestamp}</td>
                <td><strong>${enq.name}</strong></td>
                <td>${enq.phone}</td>
                <td><span style="font-size:0.8rem; color:#3b82f6;">${enq.timeSlot}</span></td>
                <td>${enq.subject}</td>
                <td>${badge}</td>
                <td>${actionBtn}</td>
            </tr>
        `;
    });

    tbody.innerHTML = rowsHtml;
}

function markEnquiryResolved(id) {
    let enquiries = JSON.parse(localStorage.getItem(LS_ENQUIRIES_KEY) || '[]');
    const target = enquiries.find(e => e.id === id);
    if (target) {
        target.status = 'RESOLVED';
        localStorage.setItem(LS_ENQUIRIES_KEY, JSON.stringify(enquiries));
        if (typeof syncEnquiryToFirebase === 'function') syncEnquiryToFirebase(target);
        renderEnquiriesTable();
        alert(`Enquiry #${id} marked as RESOLVED! Customer has been contacted.`);
    }
}

function handleRequestCallbackSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('contact-name-input').value.trim();
    const phone = document.getElementById('contact-phone-input').value.trim();
    const time = document.getElementById('contact-time-select').value;
    const subject = document.getElementById('contact-subject-input').value.trim() || 'General Executive Banking Inquiry';

    const newEnquiry = {
        id: 'ENQ' + Math.floor(100000 + Math.random() * 900000),
        timestamp: new Date().toLocaleString(),
        name: name,
        phone: phone,
        timeSlot: time,
        subject: subject,
        status: 'PENDING'
    };

    let enquiries = JSON.parse(localStorage.getItem(LS_ENQUIRIES_KEY) || '[]');
    enquiries.unshift(newEnquiry);
    localStorage.setItem(LS_ENQUIRIES_KEY, JSON.stringify(enquiries));

    if (typeof syncEnquiryToFirebase === 'function') syncEnquiryToFirebase(newEnquiry);

    alert(`Priority Callback Request Scheduled! Ref ID: ${newEnquiry.id}. An Apex Senior Wealth Executive will call you shortly.`);
    document.getElementById('contact-subject-input').value = '';

    renderEnquiriesTable();
}
