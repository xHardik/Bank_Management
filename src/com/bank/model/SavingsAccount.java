package com.bank.model;

import com.bank.exception.InsufficientFundsException;
import com.bank.exception.TransactionFailedException;

/**
 * Subclass representing a Savings Bank Account.
 * Implements Minimum Balance checks and Interest calculation.
 */
public class SavingsAccount extends Account {
    private static final double MINIMUM_BALANCE = 100.00;
    private static final double ANNUAL_INTEREST_RATE = 0.04; // 4% per year

    public SavingsAccount(String accountNumber, String customerId, String holderName, double initialBalance, String pin) {
        super(accountNumber, customerId, holderName, initialBalance, pin);
    }

    @Override
    public boolean withdraw(double amount) throws InsufficientFundsException, TransactionFailedException {
        if (amount <= 0) {
            throw new TransactionFailedException("Withdrawal amount must be strictly positive.");
        }
        if (this.balance - amount < MINIMUM_BALANCE) {
            throw new InsufficientFundsException(String.format(
                "Withdrawal of $%.2f rejected. Savings Account must maintain a minimum balance of $%.2f.",
                amount, MINIMUM_BALANCE));
        }
        this.balance -= amount;
        return true;
    }

    @Override
    public void applyMonthlyInterestOrFees() {
        double monthlyInterest = this.balance * (ANNUAL_INTEREST_RATE / 12.0);
        this.balance += monthlyInterest;
    }

    @Override
    public String getAccountType() {
        return "SAVINGS";
    }

    public static double getMinimumBalance() {
        return MINIMUM_BALANCE;
    }
}
