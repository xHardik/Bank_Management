package com.bank.service;

import com.bank.algo.AccountSearch;
import com.bank.algo.AccountSorter;
import com.bank.ds.*;
import com.bank.exception.InsufficientFundsException;
import com.bank.exception.InvalidAccountException;
import com.bank.exception.TransactionFailedException;
import com.bank.model.*;
import com.bank.util.FileStorageManager;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Main Service Facade coordinating Banking Operations, Data Structures, and Persistence.
 * Enforces Security PIN authentication across all financial operations.
 */
public class BankService {

    private final AccountHashMap accountHashMap;
    private final List<Customer> customerList;
    private final List<Transaction> masterTransactionList;
    private final TransactionStack undoStack;
    private final TellerQueue<String> tellerQueue;
    private final PriorityServiceQueue priorityQueue;
    private final CircularLogQueue auditLog;

    public BankService() {
        this.accountHashMap = new AccountHashMap();
        this.customerList = new ArrayList<>();
        this.masterTransactionList = new ArrayList<>();
        this.undoStack = new TransactionStack();
        this.tellerQueue = new TellerQueue<>();
        this.priorityQueue = new PriorityServiceQueue();
        this.auditLog = new CircularLogQueue(50); // Rolling buffer of 50 events

        loadInitialData();
    }

    private void loadInitialData() {
        List<Customer> loadedCusts = FileStorageManager.loadCustomers();
        this.customerList.addAll(loadedCusts);

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
        }

        if (accountHashMap.getSize() == 0) {
            seedSampleData();
        }
        logEvent("BankService initialized successfully.");
    }

    private void seedSampleData() {
        // Seed initial customers and accounts for testing
        Customer c1 = new Customer("CUST101", "Hardik Verma", "hardik@apexbank.in", "98765-43210", "123 MG Road, Mumbai");
        Customer c2 = new Customer("CUST102", "Rajesh Kumar", "rajesh@example.com", "98765-43211", "456 Connaught Place, Delhi");
        Customer c3 = new Customer("CUST103", "Priya Sharma", "priya@example.com", "98765-43212", "789 Brigade Road, Bengaluru");

        customerList.add(c1);
        customerList.add(c2);
        customerList.add(c3);

        Account a1 = new SavingsAccount("ACC1001", c1.getCustomerId(), c1.getName(), 150450.00, "1234");
        Account a2 = new CurrentAccount("ACC1002", c2.getCustomerId(), c2.getName(), 350000.00, "1234", 500000.00);
        Account a3 = new FixedDepositAccount("ACC1003", c3.getCustomerId(), c3.getName(), 1000000.00, "1234", 12);

        accountHashMap.put(a1.getAccountNumber(), a1);
        accountHashMap.put(a2.getAccountNumber(), a2);
        accountHashMap.put(a3.getAccountNumber(), a3);

        saveState();
        logEvent("Seeded sample Indian bank data.");
    }

    public void logEvent(String msg) {
        auditLog.addLog("[" + java.time.LocalTime.now() + "] " + msg);
    }

    // Account Creation
    public Account createAccount(String type, String name, String email, String phone, String address, double initialBalance, String pin, String extraParam) throws TransactionFailedException {
        if (initialBalance < 0) {
            throw new TransactionFailedException("Initial balance cannot be negative.");
        }
        if (pin == null || pin.trim().length() < 4) {
            throw new TransactionFailedException("A valid 4-digit Security PIN is required.");
        }

        String custId = "CUST" + (100 + customerList.size() + 1);
        Customer cust = new Customer(custId, name, email, phone, address);
        customerList.add(cust);

        String accNum = "ACC" + (1000 + accountHashMap.getSize() + 1);
        Account account;

        if ("CURRENT".equalsIgnoreCase(type)) {
            double overdraft = extraParam != null && !extraParam.isEmpty() ? Double.parseDouble(extraParam) : 500000.00;
            account = new CurrentAccount(accNum, custId, name, initialBalance, pin, overdraft);
        } else if ("FIXED_DEPOSIT".equalsIgnoreCase(type)) {
            int tenure = extraParam != null && !extraParam.isEmpty() ? Integer.parseInt(extraParam) : 12;
            account = new FixedDepositAccount(accNum, custId, name, initialBalance, pin, tenure);
        } else {
            if (initialBalance < SavingsAccount.getMinimumBalance()) {
                throw new TransactionFailedException("Savings Account requires a minimum initial balance of Rs. " + SavingsAccount.getMinimumBalance());
            }
            account = new SavingsAccount(accNum, custId, name, initialBalance, pin);
        }

        accountHashMap.put(accNum, account);
        saveState();
        logEvent("Created " + type + " Account: " + accNum + " for " + name);
        return account;
    }

    // Deposit Operation with PIN Authentication
    public Transaction deposit(String accountNumber, double amount, String pin, String remarks) throws InvalidAccountException, TransactionFailedException {
        Account acc = getAccountOrThrow(accountNumber);
        if (!acc.validatePin(pin)) {
            throw new TransactionFailedException("Invalid Security PIN entered for Account #" + accountNumber);
        }
        acc.deposit(amount);

        String txId = "TX" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Transaction tx = new Transaction(txId, accountNumber, TransactionType.DEPOSIT, amount, acc.getBalance(), null, remarks);

        acc.getStatementLedger().addLast(tx);
        masterTransactionList.add(tx);
        undoStack.push(tx);

        saveState();
        logEvent("Deposit of Rs. " + amount + " into " + accountNumber);
        return tx;
    }

    // Withdraw Operation with PIN Authentication
    public Transaction withdraw(String accountNumber, double amount, String pin, String remarks) throws InvalidAccountException, InsufficientFundsException, TransactionFailedException {
        Account acc = getAccountOrThrow(accountNumber);
        if (!acc.validatePin(pin)) {
            throw new TransactionFailedException("Invalid Security PIN entered for Account #" + accountNumber);
        }
        acc.withdraw(amount);

        String txId = "TX" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Transaction tx = new Transaction(txId, accountNumber, TransactionType.WITHDRAWAL, amount, acc.getBalance(), null, remarks);

        acc.getStatementLedger().addLast(tx);
        masterTransactionList.add(tx);
        undoStack.push(tx);

        saveState();
        logEvent("Withdrawal of Rs. " + amount + " from " + accountNumber);
        return tx;
    }

    // Transfer Operation with PIN Authentication
    public Transaction transfer(String sourceAccNum, String targetAccNum, double amount, String pin, String remarks) throws InvalidAccountException, InsufficientFundsException, TransactionFailedException {
        if (sourceAccNum.equals(targetAccNum)) {
            throw new TransactionFailedException("Source and Target account numbers cannot be identical.");
        }
        Account sourceAcc = getAccountOrThrow(sourceAccNum);
        Account targetAcc = getAccountOrThrow(targetAccNum);

        if (!sourceAcc.validatePin(pin)) {
            throw new TransactionFailedException("Invalid Security PIN entered for Source Account #" + sourceAccNum);
        }

        // Perform withdrawal from source
        sourceAcc.withdraw(amount);
        // Deposit into target
        targetAcc.deposit(amount);

        String txId = "TX" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Transaction txSource = new Transaction(txId + "-OUT", sourceAccNum, TransactionType.TRANSFER_OUT, amount, sourceAcc.getBalance(), targetAccNum, remarks);
        Transaction txTarget = new Transaction(txId + "-IN", targetAccNum, TransactionType.TRANSFER_IN, amount, targetAcc.getBalance(), sourceAccNum, remarks);

        sourceAcc.getStatementLedger().addLast(txSource);
        targetAcc.getStatementLedger().addLast(txTarget);
        masterTransactionList.add(txSource);
        masterTransactionList.add(txTarget);

        undoStack.push(txSource);

        saveState();
        logEvent("Transfer of Rs. " + amount + " from " + sourceAccNum + " to " + targetAccNum);
        return txSource;
    }

    // Undo Last Transaction using Stack
    public String undoLastTransaction() throws TransactionFailedException {
        if (undoStack.isEmpty()) {
            throw new TransactionFailedException("No recent transactions available to undo.");
        }
        Transaction tx = undoStack.pop();
        Account acc = accountHashMap.get(tx.getAccountNumber());
        if (acc == null) {
            throw new TransactionFailedException("Associated account no longer exists.");
        }

        if (tx.getType() == TransactionType.DEPOSIT) {
            acc.adjustBalanceForRollback(-tx.getAmount());
        } else if (tx.getType() == TransactionType.WITHDRAWAL) {
            acc.adjustBalanceForRollback(tx.getAmount());
        } else if (tx.getType() == TransactionType.TRANSFER_OUT) {
            acc.adjustBalanceForRollback(tx.getAmount());
            Account targetAcc = accountHashMap.get(tx.getTargetAccountNumber());
            if (targetAcc != null) {
                targetAcc.adjustBalanceForRollback(-tx.getAmount());
            }
        }

        saveState();
        String msg = "Successfully Undid Transaction " + tx.getTransactionId() + " (" + tx.getType() + " Rs. " + tx.getAmount() + ")";
        logEvent(msg);
        return msg;
    }

    // Customer Service Queues
    public void enqueueTellerRequest(String requestDetails) {
        tellerQueue.enqueue(requestDetails);
        logEvent("Enqueued Teller Request: " + requestDetails);
    }

    public String dequeueTellerRequest() {
        if (tellerQueue.isEmpty()) return "Queue is empty.";
        String req = tellerQueue.dequeue();
        logEvent("Processed Teller Request: " + req);
        return req;
    }

    public void addVipRequest(String reqId, String customerName, String type, int priority) {
        PriorityServiceQueue.ServiceRequest sr = new PriorityServiceQueue.ServiceRequest(reqId, customerName, type, priority);
        priorityQueue.insert(sr);
        logEvent("Added VIP Service Request: " + sr);
    }

    public PriorityServiceQueue.ServiceRequest processVipRequest() {
        if (priorityQueue.isEmpty()) return null;
        PriorityServiceQueue.ServiceRequest sr = priorityQueue.extractMax();
        logEvent("Processed High-Priority VIP Request: " + sr);
        return sr;
    }

    // Algorithms: Searching & Sorting
    public List<Account> searchAccounts(String keyword) {
        return AccountSearch.linearSearchByName(getAllAccounts(), keyword);
    }

    public Account binarySearchByAccNum(String accNum) {
        List<Account> sortedAccs = AccountSorter.bubbleSortByAccountNumber(getAllAccounts());
        int idx = AccountSearch.binarySearchByAccountNumber(sortedAccs, accNum);
        return idx != -1 ? sortedAccs.get(idx) : null;
    }

    public List<Account> getAccountsSortedByBalance() {
        return AccountSorter.quickSortByBalanceDescending(getAllAccounts());
    }

    public Account getAccountOrThrow(String accountNumber) throws InvalidAccountException {
        Account acc = accountHashMap.get(accountNumber);
        if (acc == null) {
            throw new InvalidAccountException("Account #" + accountNumber + " does not exist.");
        }
        return acc;
    }

    public void saveState() {
        FileStorageManager.saveData(customerList, accountHashMap, masterTransactionList);
    }

    public List<Account> getAllAccounts() { return accountHashMap.getAllAccounts(); }
    public List<Customer> getAllCustomers() { return customerList; }
    public List<Transaction> getMasterTransactionList() { return masterTransactionList; }
    public List<String> getTellerQueueItems() { return tellerQueue.getAllItems(); }
    public List<PriorityServiceQueue.ServiceRequest> getVipRequests() { return priorityQueue.getAllRequests(); }
    public List<String> getAuditLogs() { return auditLog.getRecentLogs(); }
}
