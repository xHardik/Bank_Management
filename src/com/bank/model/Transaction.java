package com.bank.model;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Represents an immutable transaction entry in the banking system ledger.
 */
public class Transaction {
    private final String transactionId;
    private final String accountNumber;
    private final TransactionType type;
    private final double amount;
    private final double balanceAfter;
    private final String targetAccountNumber; // Used for transfers
    private final String timestamp;
    private final String remarks;

    public Transaction(String transactionId, String accountNumber, TransactionType type, 
                       double amount, double balanceAfter, String targetAccountNumber, String remarks) {
        this.transactionId = transactionId;
        this.accountNumber = accountNumber;
        this.type = type;
        this.amount = amount;
        this.balanceAfter = balanceAfter;
        this.targetAccountNumber = targetAccountNumber != null ? targetAccountNumber : "N/A";
        this.timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        this.remarks = remarks;
    }

    // Constructor with custom timestamp (used during file loading)
    public Transaction(String transactionId, String accountNumber, TransactionType type, 
                       double amount, double balanceAfter, String targetAccountNumber, String timestamp, String remarks) {
        this.transactionId = transactionId;
        this.accountNumber = accountNumber;
        this.type = type;
        this.amount = amount;
        this.balanceAfter = balanceAfter;
        this.targetAccountNumber = targetAccountNumber != null ? targetAccountNumber : "N/A";
        this.timestamp = timestamp;
        this.remarks = remarks;
    }

    public String getTransactionId() { return transactionId; }
    public String getAccountNumber() { return accountNumber; }
    public TransactionType getType() { return type; }
    public double getAmount() { return amount; }
    public double getBalanceAfter() { return balanceAfter; }
    public String getTargetAccountNumber() { return targetAccountNumber; }
    public String getTimestamp() { return timestamp; }
    public String getRemarks() { return remarks; }

    @Override
    public String toString() {
        return String.format("[%s] ID: %s | %s | Amount: $%.2f | Balance: $%.2f | Remarks: %s",
                timestamp, transactionId, type, amount, balanceAfter, remarks);
    }
}
