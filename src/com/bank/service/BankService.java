package com.bank.service;

import com.bank.algo.AccountSearch;
import com.bank.algo.AccountSorter;
import com.bank.algo.BankNetworkGraph;
import com.bank.algo.CustomerTrie;
import com.bank.ds.*;
import com.bank.exception.InsufficientFundsException;
import com.bank.exception.InvalidAccountException;
import com.bank.exception.TransactionFailedException;
import com.bank.model.*;
import com.bank.util.FileStorageManager;

import java.util.*;

/**
 * Main Service Facade coordinating Banking Operations, Data Structures, and Persistence.
 * Enforces Security PIN authentication, Lockouts, Graph Fraud Analysis, and Loan Priority Queues.
 */
public class BankService {

    private final AccountHashMap accountHashMap;
    private final List<Customer> customerList;
    private final List<Transaction> masterTransactionList;
    private final TransactionStack undoStack;
    private final TellerQueue<String> tellerQueue;
    private final PriorityServiceQueue priorityQueue;
    private final CircularLogQueue auditLog;

    // Advanced DSA Modules
    private final LoanPriorityQueue loanPriorityQueue;
    private final BankNetworkGraph networkGraph;
    private final CustomerTrie customerTrie;
    private final CustomerBST customerBST;
    private final Map<String, Integer> failedPinAttempts;

    public BankService() {
        this.accountHashMap = new AccountHashMap();
        this.customerList = new ArrayList<>();
        this.masterTransactionList = new ArrayList<>();
        this.undoStack = new TransactionStack();
        this.tellerQueue = new TellerQueue<>();
        this.priorityQueue = new PriorityServiceQueue();
        this.auditLog = new CircularLogQueue(50);

        this.loanPriorityQueue = new LoanPriorityQueue();
        this.networkGraph = new BankNetworkGraph();
        this.customerTrie = new CustomerTrie();
        this.customerBST = new CustomerBST();
        this.failedPinAttempts = new HashMap<>();

        loadInitialData();
    }

    private void loadInitialData() {
        List<Customer> loadedCusts = FileStorageManager.loadCustomers();
        for (Customer c : loadedCusts) {
            this.customerList.add(c);
            this.customerTrie.insert(c.getName());
            this.customerBST.insert(c);
        }

        List<Account> loadedAccs = FileStorageManager.loadAccounts();
        for (Account acc : loadedAccs) {
            this.accountHashMap.put(acc.getAccountNumber(), acc);
        }

        List<Transaction> loadedTxs = FileStorageManager.loadTransactions();
        for (Transaction tx : loadedTxs) {
            this.masterTransactionList.add(tx);
            Account acc = accountHashMap.get(tx.getAccountNumber());
            if (acc != null) {
                acc.getStatementLedger().addLast(tx);
            }
            if (tx.getTargetAccountNumber() != null && !tx.getTargetAccountNumber().equals("N/A")) {
                networkGraph.addTransactionEdge(tx.getAccountNumber(), tx.getTargetAccountNumber());
            }
        }

        if (accountHashMap.getSize() == 0) {
            seedDefaultAccounts();
        }
    }

    private void seedDefaultAccounts() {
        Customer c1 = new Customer("CUST101", "Hardik Verma", "hardik@apexbank.in", "+91 98765 43210", "Mumbai");
        this.customerList.add(c1);
        this.customerTrie.insert(c1.getName());
        this.customerBST.insert(c1);

        SavingsAccount acc1 = new SavingsAccount("ACC1001", "CUST101", "Hardik Verma", 150450.00, "1234");
        accountHashMap.put("ACC1001", acc1);

        Customer c2 = new Customer("CUST102", "Priya Sharma", "priya@apexbank.in", "+91 98123 45678", "Delhi");
        this.customerList.add(c2);
        this.customerTrie.insert(c2.getName());
        this.customerBST.insert(c2);

        CurrentAccount acc2 = new CurrentAccount("ACC1002", "CUST102", "Priya Sharma", 85200.00, "1234", 500000.00);
        accountHashMap.put("ACC1002", acc2);

        saveState();
        auditLog.addLog("SYSTEM SEEDED Default accounts for Hardik Verma (ACC1001) and Priya Sharma (ACC1002)");
    }

    private void validatePinWithLockout(Account acc, String inputPin) {
        if (!acc.validatePin(inputPin)) {
            int attempts = failedPinAttempts.getOrDefault(acc.getAccountNumber(), 0) + 1;
            failedPinAttempts.put(acc.getAccountNumber(), attempts);
            auditLog.addLog(String.format("FAILED PIN Attempt %d/3 for %s", attempts, acc.getAccountNumber()));
            if (attempts >= 3) {
                auditLog.addLog(String.format("SECURITY LOCKOUT: Account %s FROZEN due to 3 failed PIN attempts!", acc.getAccountNumber()));
                throw new TransactionFailedException("Account FROZEN due to 3 failed PIN attempts. Contact Admin.");
            }
            throw new TransactionFailedException(String.format("Invalid Security PIN. Attempt %d/3.", attempts));
        }
        failedPinAttempts.put(acc.getAccountNumber(), 0);
    }

    public synchronized Account createAccount(String type, String name, String email, String phone, double initialBalance, String pin, String extra) {
        String custId = "CUST" + (customerList.size() + 101);
        Customer customer = new Customer(custId, name, email, phone, "India");
        customerList.add(customer);
        customerTrie.insert(name);
        customerBST.insert(customer);

        String accNum = "ACC" + (accountHashMap.getSize() + 1001);
        Account newAcc;
        switch (type.toUpperCase()) {
            case "CURRENT":
                double overdraft = extra != null && !extra.isEmpty() ? Double.parseDouble(extra) : 500000.00;
                newAcc = new CurrentAccount(accNum, custId, name, initialBalance, pin, overdraft);
                break;
            case "FIXED_DEPOSIT":
                int months = extra != null && !extra.isEmpty() ? Integer.parseInt(extra) : 12;
                newAcc = new FixedDepositAccount(accNum, custId, name, initialBalance, pin, months);
                break;
            case "SAVINGS":
            default:
                newAcc = new SavingsAccount(accNum, custId, name, initialBalance, pin);
                break;
        }

        accountHashMap.put(accNum, newAcc);
        saveState();

        auditLog.addLog(String.format("ACCOUNT CREATED: %s (%s) for %s with Initial Balance Rs. %.2f", accNum, type, name, initialBalance));
        return newAcc;
    }

    public synchronized Transaction deposit(String accNum, double amount, String pin, String remarks) {
        Account acc = getAccountOrThrow(accNum);
        validatePinWithLockout(acc, pin);

        acc.deposit(amount);

        String txId = "TX" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Transaction tx = new Transaction(txId, accNum, TransactionType.DEPOSIT, amount, acc.getBalance(), "N/A", remarks);

        acc.getStatementLedger().addLast(tx);
        masterTransactionList.add(tx);
        undoStack.push(tx);
        saveState();

        auditLog.addLog(String.format("DEPOSIT: Rs. %.2f to %s. New Balance: Rs. %.2f", amount, accNum, acc.getBalance()));
        return tx;
    }

    public synchronized Transaction withdraw(String accNum, double amount, String pin, String remarks) {
        Account acc = getAccountOrThrow(accNum);
        validatePinWithLockout(acc, pin);

        if (!acc.withdraw(amount)) {
            throw new InsufficientFundsException("Withdrawal rejected due to minimum balance / overdraft rules.");
        }

        String txId = "TX" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Transaction tx = new Transaction(txId, accNum, TransactionType.WITHDRAWAL, amount, acc.getBalance(), "N/A", remarks);

        acc.getStatementLedger().addLast(tx);
        masterTransactionList.add(tx);
        undoStack.push(tx);
        saveState();

        auditLog.addLog(String.format("WITHDRAWAL: Rs. %.2f from %s. New Balance: Rs. %.2f", amount, accNum, acc.getBalance()));
        return tx;
    }

    public synchronized Transaction transfer(String sourceAccNum, String targetAccNum, double amount, String pin, String remarks) {
        if (sourceAccNum.equals(targetAccNum)) {
            throw new InvalidAccountException("Source and Target accounts cannot be identical.");
        }

        Account srcAcc = getAccountOrThrow(sourceAccNum);
        Account targetAcc = getAccountOrThrow(targetAccNum);
        validatePinWithLockout(srcAcc, pin);

        if (!srcAcc.withdraw(amount)) {
            throw new InsufficientFundsException("Transfer failed: Insufficient funds in source account.");
        }

        targetAcc.deposit(amount);

        String txId = "TX" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Transaction txSrc = new Transaction(txId, sourceAccNum, TransactionType.TRANSFER_OUT, amount, srcAcc.getBalance(), targetAccNum, remarks);
        Transaction txTgt = new Transaction(txId + "_R", targetAccNum, TransactionType.TRANSFER_IN, amount, targetAcc.getBalance(), sourceAccNum, remarks);

        srcAcc.getStatementLedger().addLast(txSrc);
        targetAcc.getStatementLedger().addLast(txTgt);
        masterTransactionList.add(txSrc);
        masterTransactionList.add(txTgt);
        undoStack.push(txSrc);

        networkGraph.addTransactionEdge(sourceAccNum, targetAccNum);
        saveState();

        auditLog.addLog(String.format("TRANSFER: Rs. %.2f from %s to %s. TxID: %s", amount, sourceAccNum, targetAccNum, txId));
        return txSrc;
    }

    public synchronized boolean undoLastTransaction() {
        if (undoStack.isEmpty()) throw new TransactionFailedException("No recent operations to undo.");
        Transaction lastTx = undoStack.pop();
        Account acc = accountHashMap.get(lastTx.getAccountNumber());
        if (acc == null) return false;

        if (lastTx.getType() == TransactionType.DEPOSIT) {
            acc.withdraw(lastTx.getAmount());
        } else if (lastTx.getType() == TransactionType.WITHDRAWAL) {
            acc.deposit(lastTx.getAmount());
        } else if (lastTx.getType() == TransactionType.TRANSFER_OUT) {
            acc.deposit(lastTx.getAmount());
            Account tgt = accountHashMap.get(lastTx.getTargetAccountNumber());
            if (tgt != null) tgt.withdraw(lastTx.getAmount());
        }

        saveState();
        auditLog.addLog(String.format("UNDO EXECUTED: Reverted transaction %s for account %s", lastTx.getTransactionId(), lastTx.getAccountNumber()));
        return true;
    }

    // Loan Processing Module (Priority Queue)
    public synchronized LoanApplication applyForLoan(String customerName, String accountNumber, String loanType, double amount) {
        int score = 5;
        if (loanType.equalsIgnoreCase("EMERGENCY")) score = 10;
        else if (loanType.equalsIgnoreCase("SENIOR_CITIZEN")) score = 9;
        else if (loanType.equalsIgnoreCase("EDUCATION")) score = 7;

        String appId = "LOAN" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        LoanApplication app = new LoanApplication(appId, customerName, accountNumber, loanType, amount, score);
        loanPriorityQueue.insert(app);
        auditLog.addLog(String.format("LOAN SUBMITTED: %s for Rs. %.2f by %s (Priority %d)", loanType, amount, customerName, score));
        return app;
    }

    public synchronized LoanApplication approveHighestPriorityLoan() {
        LoanApplication app = loanPriorityQueue.extractMax();
        if (app != null) {
            app.setStatus("APPROVED");
            Account acc = accountHashMap.get(app.getAccountNumber());
            if (acc != null) {
                acc.deposit(app.getAmount());
            }
            auditLog.addLog(String.format("LOAN APPROVED: %s (Rs. %.2f) credited to %s", app.getApplicationId(), app.getAmount(), app.getAccountNumber()));
            saveState();
        }
        return app;
    }

    public List<LoanApplication> getPendingLoans() {
        return loanPriorityQueue.getAllApplications();
    }

    public List<String> autocompleteCustomerNames(String prefix) {
        return customerTrie.autocomplete(prefix);
    }

    public List<String> getShortestTransferRoute(String src, String target) {
        return networkGraph.findShortestRoutingPath(src, target);
    }

    public boolean checkCircularFraud(String accNum) {
        return networkGraph.detectCircularFraudLoop(accNum);
    }

    public Account getAccountOrThrow(String accountNumber) {
        Account acc = accountHashMap.get(accountNumber);
        if (acc == null) throw new InvalidAccountException("Account #" + accountNumber + " does not exist.");
        return acc;
    }

    public List<Account> getAllAccountsSorted(String sortBy) {
        List<Account> accounts = accountHashMap.getAllAccounts();
        if (sortBy == null) return accounts;
        switch (sortBy.toLowerCase()) {
            case "balance_asc": return AccountSorter.quickSortByBalance(accounts, true);
            case "name_asc": return AccountSorter.quickSortByName(accounts, true);
            case "name_desc": return AccountSorter.quickSortByName(accounts, false);
            case "balance_desc": default: return AccountSorter.quickSortByBalance(accounts, false);
        }
    }

    public List<Account> getAccountsSortedByBalance() {
        return AccountSorter.quickSortByBalance(accountHashMap.getAllAccounts(), false);
    }

    public Account binarySearchByAccNum(String accNum) {
        List<Account> sorted = AccountSorter.quickSortByBalance(accountHashMap.getAllAccounts(), true);
        int idx = AccountSearch.binarySearchByAccountNumber(sorted, accNum);
        return idx != -1 ? sorted.get(idx) : null;
    }

    public List<Account> searchAccounts(String query) {
        List<Account> accounts = accountHashMap.getAllAccounts();
        if (query == null || query.trim().isEmpty()) return accounts;
        
        List<Account> sortedByNum = AccountSorter.quickSortByBalance(accounts, true);
        int idx = AccountSearch.binarySearchByAccountNumber(sortedByNum, query.trim());
        if (idx != -1) {
            return Collections.singletonList(sortedByNum.get(idx));
        }
        return AccountSearch.linearSearchByName(accounts, query.trim());
    }

    public void enqueueTellerRequest(String request) { tellerQueue.enqueue(request); auditLog.addLog("TELLER QUEUE: Enqueued " + request); }
    public String dequeueTellerRequest() { String req = tellerQueue.dequeue(); auditLog.addLog("TELLER QUEUE: Dequeued " + req); return req; }
    public void enqueueVipRequest(String name, String type, int prio) {
        String reqId = "REQ" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        priorityQueue.insert(new PriorityServiceQueue.ServiceRequest(reqId, name, type, prio));
        auditLog.addLog("VIP QUEUE: Enqueued " + name + " (Prio " + prio + ")");
    }
    public PriorityServiceQueue.ServiceRequest dequeueVipRequest() {
        if (priorityQueue.isEmpty()) return null;
        PriorityServiceQueue.ServiceRequest req = priorityQueue.extractMax();
        if (req != null) auditLog.addLog("VIP QUEUE: Serviced VIP " + req.getCustomerName());
        return req;
    }

    public List<Account> getAllAccounts() { return accountHashMap.getAllAccounts(); }
    public List<Transaction> getMasterTransactions() { return masterTransactionList; }
    public List<String> getAuditLogs() { return auditLog.getRecentLogs(); }

    private void saveState() {
        FileStorageManager.saveData(customerList, accountHashMap, masterTransactionList);
    }
}
