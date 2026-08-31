package com.bank.exception;

/**
 * Thrown when an account does not have sufficient funds for withdrawal or transfer.
 */
public class InsufficientFundsException extends Exception {
    public InsufficientFundsException(String message) {
        super(message);
    }
}
