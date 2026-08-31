package com.bank.model;

import com.bank.exception.InsufficientFundsException;
import com.bank.exception.TransactionFailedException;

/**
 * Subclass representing a Fixed Deposit (FD) Account.
 * Has a fixed tenure (months) and high interest rate, with premature withdrawal penalty.
 */
public class FixedDepositAccount extends Account {
    private final int tenureMonths;
    private static final double FD_INTEREST_RATE = 0.07; // 7% per year
    private static final double PENALTY_RATE = 0.02; // 2% penalty on early exit

    public FixedDepositAccount(String accountNumber, String customerId, String holderName, double initialBalance, String pin, int tenureMonths) {
        super(accountNumber, customerId, holderName, initialBalance, pin);
        this.tenureMonths = tenureMonths;
    }

    @Override
    public boolean withdraw(double amount) throws InsufficientFundsException, TransactionFailedException {
        if (amount <= 0) {
            throw new TransactionFailedException("Withdrawal amount must be strictly positive.");
        }
        // Fixed Deposit allows full liquidation with penalty
        double penalty = amount * PENALTY_RATE;
        double totalDeduction = amount + penalty;
        
        if (this.balance < totalDeduction) {
            throw new InsufficientFundsException(String.format(
                "FD Premature withdrawal requires total deduction of $%.2f (including $%.2f early exit penalty), but balance is $%.2f",
                totalDeduction, penalty, this.balance));
        }
        this.balance -= totalDeduction;
        return true;
    }

    @Override
    public void applyMonthlyInterestOrFees() {
        double monthlyInterest = this.balance * (FD_INTEREST_RATE / 12.0);
        this.balance += monthlyInterest;
    }

    @Override
    public String getAccountType() {
        return "FIXED_DEPOSIT";
    }

    public int getTenureMonths() {
        return tenureMonths;
    }
}
