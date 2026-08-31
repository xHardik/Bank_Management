package com.bank.ds;

import com.bank.model.Account;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Hash Table / HashMap implementation for O(1) average-time account lookups by Account Number.
 */
public class AccountHashMap {

    private final Map<String, Account> accountMap;

    public AccountHashMap() {
        this.accountMap = new HashMap<>();
    }

    /**
     * Inserts or updates an account in the hash table.
     * Time Complexity: O(1) avg
     */
    public void put(String accountNumber, Account account) {
        accountMap.put(accountNumber, account);
    }

    /**
     * Retrieves an account by account number.
     * Time Complexity: O(1) avg
     */
    public Account get(String accountNumber) {
        return accountMap.get(accountNumber);
    }

    /**
     * Checks if an account exists.
     * Time Complexity: O(1) avg
     */
    public boolean containsKey(String accountNumber) {
        return accountMap.containsKey(accountNumber);
    }

    /**
     * Removes an account from the hash table.
     * Time Complexity: O(1) avg
     */
    public Account remove(String accountNumber) {
        return accountMap.remove(accountNumber);
    }

    public List<Account> getAllAccounts() {
        return new ArrayList<>(accountMap.values());
    }

    public int getSize() {
        return accountMap.size();
    }
}
