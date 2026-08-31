package com.bank.model;

import com.bank.ds.TransactionLinkedList;
import com.bank.exception.InsufficientFundsException;
import com.bank.exception.TransactionFailedException;

/**
 * Abstract Base Class representing a generic Bank Account.
 * Demonstrates Abstraction and Encapsulation.
 */
public abstract class Account {
    private final String accountNumber;
    private final String customerId;
    private final String holderName;
    protected double balance;
    private String pin; // Simple PIN security
    private final TransactionLinkedList statementLedger;

    public Account(String accountNumber, String customerId, String holderName, double initialBalance, String pin) {
        this.accountNumber = accountNumber;
        this.customerId = customerId;
        this.holderName = holderName;
        this.balance = Math.max(0, initialBalance);
        this.pin = pin;
        this.statementLedger = new TransactionLinkedList();
    }

    // Abstraction: Overridden by specialized account subclasses
    public abstract boolean withdraw(double amount) throws InsufficientFundsException, TransactionFailedException;
    public abstract void applyMonthlyInterestOrFees();
    public abstract String getAccountType();

    public void deposit(double amount) throws TransactionFailedException {
        if (amount <= 0) {
            throw new TransactionFailedException("Deposit amount must be strictly positive.");
        }
        this.balance += amount;
    }

    public boolean validatePin(String inputPin) {
        return this.pin != null && this.pin.equals(inputPin);
    }

    public void setPin(String newPin) {
        if (newPin != null && newPin.length() >= 4) {
            this.pin = newPin;
        }
    }

    public void adjustBalanceForRollback(double delta) {
        this.balance += delta;
    }

    public String getAccountNumber() { return accountNumber; }
    public String getCustomerId() { return customerId; }
    public String getHolderName() { return holderName; }
    public double getBalance() { return balance; }
    public String getPin() { return pin; }
    public TransactionLinkedList getStatementLedger() { return statementLedger; }

    @Override
    public String toString() {
        return String.format("[%s] Acc #: %s | Name: %s | Balance: $%.2f", 
                getAccountType(), accountNumber, holderName, balance);
    }
}
