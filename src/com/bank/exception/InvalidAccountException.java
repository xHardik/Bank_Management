package com.bank.exception;

/**
 * Thrown when an account number is not found or invalid.
 */
public class InvalidAccountException extends Exception {
    public InvalidAccountException(String message) {
        super(message);
    }
}
