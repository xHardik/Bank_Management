package com.bank.model;

import com.bank.exception.InsufficientFundsException;
import com.bank.exception.TransactionFailedException;

/**
 * Subclass representing a Current/Checking Bank Account.
 * Supports Overdraft Facility up to a configured overdraft limit.
 */
public class CurrentAccount extends Account {
    private static final double DEFAULT_OVERDRAFT_LIMIT = 5000.00;
    private final double overdraftLimit;

    public CurrentAccount(String accountNumber, String customerId, String holderName, double initialBalance, String pin) {
        super(accountNumber, customerId, holderName, initialBalance, pin);
        this.overdraftLimit = DEFAULT_OVERDRAFT_LIMIT;
    }

    public CurrentAccount(String accountNumber, String customerId, String holderName, double initialBalance, String pin, double overdraftLimit) {
        super(accountNumber, customerId, holderName, initialBalance, pin);
        this.overdraftLimit = overdraftLimit;
    }

    @Override
    public boolean withdraw(double amount) throws InsufficientFundsException, TransactionFailedException {
        if (amount <= 0) {
            throw new TransactionFailedException("Withdrawal amount must be strictly positive.");
        }
        if (this.balance - amount < -overdraftLimit) {
            throw new InsufficientFundsException(String.format(
                "Withdrawal of Rs. %.2f exceeds Current Account overdraft limit of Rs. %.2f. Maximum available: Rs. %.2f",
                amount, overdraftLimit, (this.balance + overdraftLimit)));
        }
        this.balance -= amount;
        return true;
    }

    @Override
    public void applyMonthlyInterestOrFees() {
        // Apply monthly account maintenance fee
        double maintenanceFee = 15.00;
        this.balance -= maintenanceFee;
    }

    @Override
    public String getAccountType() {
        return "CURRENT";
    }

    public double getOverdraftLimit() {
        return overdraftLimit;
    }
}
