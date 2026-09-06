// Firebase Configuration & Initialization for Apex Bank
const firebaseConfig = {
  apiKey: "AIzaSyDkUstnnXyhtm5gYzIMeIO9VVqYWsSgo8c",
  authDomain: "apex-bankk.firebaseapp.com",
  projectId: "apex-bankk",
  storageBucket: "apex-bankk.firebasestorage.app",
  messagingSenderId: "265156850735",
  appId: "1:265156850735:web:4617c294fbda55a67a42da",
  measurementId: "G-WMNX7H5ZTQ"
};

let db = null;

if (typeof firebase !== 'undefined') {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  db = firebase.firestore();
  console.log("[Firebase] Firebase Firestore Initialized for Apex Bank!");
} else {
  console.warn("[Firebase] Warning: Firebase SDK not loaded, falling back to LocalStorage.");
}

// Global Firebase Helper Functions
async function syncAccountToFirebase(account) {
  if (!db || !account || !account.accountNumber) return;
  try {
    await db.collection("accounts").doc(account.accountNumber).set(account, { merge: true });
    console.log(`[Firebase] Account ${account.accountNumber} synced to Firestore`);
  } catch (err) {
    console.warn("Firebase Account Sync Error:", err);
  }
}

async function syncTransactionToFirebase(txn) {
  if (!db || !txn) return;
  try {
    const txDocId = String(txn.txId || 'TXN' + Date.now());
    await db.collection("transactions").doc(txDocId).set(txn, { merge: true });
    console.log(`[Firebase] Transaction ${txDocId} synced to Firestore`);
  } catch (err) {
    console.warn("Firebase Transaction Sync Error:", err);
  }
}

async function syncLoanToFirebase(loan) {
  if (!db || !loan) return;
  const loanId = String(loan.appId || loan.applicationId || loan.id || 'LOAN' + Date.now());
  try {
    await db.collection("pending_loans").doc(loanId).set({ ...loan, appId: loanId }, { merge: true });
    console.log(`[Firebase] Loan application ${loanId} synced to Firestore`);
  } catch (err) {
    console.warn("Firebase Loan Sync Error:", err);
  }
}

async function syncApprovedLoanToFirebase(loan) {
  if (!db || !loan) return;
  const loanId = String(loan.appId || loan.applicationId || loan.id || 'LOAN' + Date.now());
  try {
    await db.collection("approved_loans").doc(loanId).set({ ...loan, appId: loanId }, { merge: true });
    try {
      await db.collection("pending_loans").doc(loanId).delete();
    } catch (e) {}
    console.log(`[Firebase] Loan ${loanId} moved to approved_loans in Firestore`);
  } catch (err) {
    console.warn("Firebase Approved Loan Sync Error:", err);
  }
}

// One-time initial seed/sync to ensure Firestore gets data immediately
async function syncAllLocalToFirebase() {
  if (!db) return;
  try {
    let accounts = JSON.parse(localStorage.getItem('apex_bank_accounts') || '[]');
    if (accounts.length === 0) {
      accounts = [{
        accountNumber: 'ACC1001',
        holderName: 'Hardik Verma',
        type: 'SAVINGS',
        balance: 150450.00,
        pin: '1234',
        customerId: 'CUST101'
      }];
      localStorage.setItem('apex_bank_accounts', JSON.stringify(accounts));
    }
    for (const acc of accounts) {
      await syncAccountToFirebase(acc);
    }

    let pending = JSON.parse(localStorage.getItem('apex_bank_pending_loans') || '[]');
    for (const loan of pending) {
      await syncLoanToFirebase(loan);
    }

    let approved = JSON.parse(localStorage.getItem('apex_bank_approved_loans') || '[]');
    for (const loan of approved) {
      await syncApprovedLoanToFirebase(loan);
    }

    let txs = JSON.parse(localStorage.getItem('apex_bank_transactions') || '[]');
    if (txs.length === 0) {
      const sampleTx = {
        txId: 'TXN100001',
        timestamp: new Date().toLocaleString(),
        accNum: 'ACC1001',
        type: 'DEPOSIT',
        amount: 150450.00,
        balanceAfter: 150450.00,
        remarks: 'Opening Balance Deposit',
        targetAcc: 'N/A'
      };
      txs.push(sampleTx);
      localStorage.setItem('apex_bank_transactions', JSON.stringify(txs));
    }
    for (const txn of txs) {
      await syncTransactionToFirebase(txn);
    }
    console.log("[Firebase] Sync All Local Storage to Firebase Completed!");
  } catch (e) {
    console.warn("Error in syncAllLocalToFirebase:", e);
  }
}

// Realtime Listener to populate and keep LocalStorage updated
function initFirebaseRealtimeListeners(onAccountsUpdated, onLoansUpdated) {
  if (!db) return;

  // Run seed sync immediately
  syncAllLocalToFirebase();

  // Accounts Listener
  db.collection("accounts").onSnapshot((snapshot) => {
    if (snapshot.empty) return;
    let accounts = JSON.parse(localStorage.getItem('apex_bank_accounts') || '[]');
    snapshot.forEach((doc) => {
      const accData = doc.data();
      const idx = accounts.findIndex(a => a.accountNumber === accData.accountNumber);
      if (idx !== -1) {
        accounts[idx] = { ...accounts[idx], ...accData };
      } else {
        accounts.push(accData);
      }
    });
    localStorage.setItem('apex_bank_accounts', JSON.stringify(accounts));
    if (typeof onAccountsUpdated === 'function') onAccountsUpdated();
  }, err => console.warn("Firebase accounts snapshot error:", err));

  // Pending Loans Listener
  db.collection("pending_loans").onSnapshot((snapshot) => {
    let pendingLoans = [];
    snapshot.forEach((doc) => {
      pendingLoans.push(doc.data());
    });
    if (pendingLoans.length > 0) {
      localStorage.setItem('apex_bank_pending_loans', JSON.stringify(pendingLoans));
      if (typeof onLoansUpdated === 'function') onLoansUpdated();
    }
  }, err => console.warn("Firebase pending loans snapshot error:", err));

  // Approved Loans Listener
  db.collection("approved_loans").onSnapshot((snapshot) => {
    let approvedLoans = [];
    snapshot.forEach((doc) => {
      approvedLoans.push(doc.data());
    });
    if (approvedLoans.length > 0) {
      localStorage.setItem('apex_bank_approved_loans', JSON.stringify(approvedLoans));
      if (typeof onLoansUpdated === 'function') onLoansUpdated();
    }
  }, err => console.warn("Firebase approved loans snapshot error:", err));
}
