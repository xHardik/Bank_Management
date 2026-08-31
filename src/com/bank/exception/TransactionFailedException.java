package com.bank.exception;

/**
 * Thrown when a banking transaction fails validation or processing.
 */
public class TransactionFailedException extends Exception {
    public TransactionFailedException(String message) {
        super(message);
    }
}
