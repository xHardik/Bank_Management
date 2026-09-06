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
  console.log("🔥 Firebase Firestore Initialized for Apex Bank!");
} else {
  console.warn("⚠️ Firebase SDK not loaded, falling back to LocalStorage.");
}

// Global Firebase Helper Functions
async function syncAccountToFirebase(account) {
  if (!db || !account || !account.accountNumber) return;
  try {
    await db.collection("accounts").doc(account.accountNumber).set(account, { merge: true });
    console.log(`🔥 Account ${account.accountNumber} synced to Firestore`);
  } catch (err) {
    console.warn("Firebase Account Sync Error:", err);
  }
}

async function syncTransactionToFirebase(txn) {
  if (!db || !txn) return;
  try {
    await db.collection("transactions").add(txn);
    console.log("🔥 Transaction synced to Firestore");
  } catch (err) {
    console.warn("Firebase Transaction Sync Error:", err);
  }
}

async function syncLoanToFirebase(loan) {
  if (!db || !loan || !loan.id) return;
  try {
    await db.collection("pending_loans").doc(String(loan.id)).set(loan, { merge: true });
    console.log(`🔥 Loan application ${loan.id} synced to Firestore`);
  } catch (err) {
    console.warn("Firebase Loan Sync Error:", err);
  }
}

async function syncApprovedLoanToFirebase(loan) {
  if (!db || !loan || !loan.id) return;
  try {
    await db.collection("approved_loans").doc(String(loan.id)).set(loan, { merge: true });
    await db.collection("pending_loans").doc(String(loan.id)).delete();
    console.log(`🔥 Loan ${loan.id} moved to approved_loans in Firestore`);
  } catch (err) {
    console.warn("Firebase Approved Loan Sync Error:", err);
  }
}

// Realtime Listener to populate and keep LocalStorage updated
function initFirebaseRealtimeListeners(onAccountsUpdated, onLoansUpdated) {
  if (!db) return;

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
