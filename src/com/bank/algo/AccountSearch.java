package com.bank.algo;

import com.bank.model.Account;
import com.bank.model.Transaction;
import java.util.ArrayList;
import java.util.List;

/**
 * Implements fundamental searching algorithms (Linear Search & Binary Search).
 */
public class AccountSearch {

    /**
     * Performs Linear Search to find accounts matching holder name or keyword.
     * Time Complexity: O(N)
     */
    public static List<Account> linearSearchByName(List<Account> accounts, String keyword) {
        List<Account> results = new ArrayList<>();
        if (keyword == null || keyword.trim().isEmpty()) {
            return results;
        }
        String lowerKeyword = keyword.trim().toLowerCase();
        for (Account acc : accounts) {
            if (acc.getHolderName().toLowerCase().contains(lowerKeyword) ||
                acc.getAccountNumber().toLowerCase().contains(lowerKeyword)) {
                results.add(acc);
            }
        }
        return results;
    }

    /**
     * Performs Binary Search on a list of Accounts SORTED by Account Number.
     * Time Complexity: O(log N)
     * @return Index of matching account, or -1 if not found.
     */
    public static int binarySearchByAccountNumber(List<Account> sortedAccounts, String targetAccNum) {
        int low = 0;
        int high = sortedAccounts.size() - 1;

        while (low <= high) {
            int mid = low + (high - low) / 2;
            String midAccNum = sortedAccounts.get(mid).getAccountNumber();
            int cmp = midAccNum.compareTo(targetAccNum);

            if (cmp == 0) {
                return mid; // Account found
            } else if (cmp < 0) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return -1; // Not found
    }

    /**
     * Linear Search for transactions containing a specific keyword in remarks.
     * Time Complexity: O(N)
     */
    public static List<Transaction> linearSearchTransactions(List<Transaction> transactions, String keyword) {
        List<Transaction> matches = new ArrayList<>();
        if (keyword == null) return matches;
        String lower = keyword.toLowerCase();
        for (Transaction tx : transactions) {
            if (tx.getRemarks().toLowerCase().contains(lower) || 
                tx.getTransactionId().toLowerCase().contains(lower)) {
                matches.add(tx);
            }
        }
        return matches;
    }
}
