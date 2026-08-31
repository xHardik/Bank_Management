package com.bank.algo;

import com.bank.model.Account;
import java.util.ArrayList;
import java.util.List;

/**
 * Implements fundamental sorting algorithms (QuickSort & BubbleSort) to sort account records.
 * Supports sorting by Balance (Ascending/Descending) and Customer Holder Name (Ascending/Descending).
 */
public class AccountSorter {

    /**
     * Sorts accounts by Balance in Descending order using QuickSort.
     */
    public static List<Account> quickSortByBalanceDescending(List<Account> accounts) {
        return quickSortByBalance(accounts, false);
    }

    /**
     * Sorts accounts by Balance (Ascending if true, Descending if false) using QuickSort.
     */
    public static List<Account> quickSortByBalance(List<Account> accounts, boolean ascending) {
        List<Account> sorted = new ArrayList<>(accounts);
        if (sorted.isEmpty()) return sorted;
        quickSortBalance(sorted, 0, sorted.size() - 1, ascending);
        return sorted;
    }

    private static void quickSortBalance(List<Account> list, int low, int high, boolean ascending) {
        if (low < high) {
            int pivotIndex = partitionBalance(list, low, high, ascending);
            quickSortBalance(list, low, pivotIndex - 1, ascending);
            quickSortBalance(list, pivotIndex + 1, high, ascending);
        }
    }

    private static int partitionBalance(List<Account> list, int low, int high, boolean ascending) {
        double pivotBalance = list.get(high).getBalance();
        int i = low - 1;

        for (int j = low; j < high; j++) {
            boolean condition = ascending ? (list.get(j).getBalance() <= pivotBalance) : (list.get(j).getBalance() >= pivotBalance);
            if (condition) {
                i++;
                swap(list, i, j);
            }
        }
        swap(list, i + 1, high);
        return i + 1;
    }

    /**
     * Sorts accounts by Customer Name (A-Z if ascending, Z-A if descending) using QuickSort.
     */
    public static List<Account> quickSortByName(List<Account> accounts, boolean ascending) {
        List<Account> sorted = new ArrayList<>(accounts);
        if (sorted.isEmpty()) return sorted;
        quickSortName(sorted, 0, sorted.size() - 1, ascending);
        return sorted;
    }

    private static void quickSortName(List<Account> list, int low, int high, boolean ascending) {
        if (low < high) {
            int pivotIndex = partitionName(list, low, high, ascending);
            quickSortName(list, low, pivotIndex - 1, ascending);
            quickSortName(list, pivotIndex + 1, high, ascending);
        }
    }

    private static int partitionName(List<Account> list, int low, int high, boolean ascending) {
        String pivotName = list.get(high).getHolderName().toLowerCase();
        int i = low - 1;

        for (int j = low; j < high; j++) {
            int cmp = list.get(j).getHolderName().toLowerCase().compareTo(pivotName);
            boolean condition = ascending ? (cmp <= 0) : (cmp >= 0);
            if (condition) {
                i++;
                swap(list, i, j);
            }
        }
        swap(list, i + 1, high);
        return i + 1;
    }

    /**
     * Sorts accounts by Account Number in Ascending order using BubbleSort.
     */
    public static List<Account> bubbleSortByAccountNumber(List<Account> accounts) {
        List<Account> sorted = new ArrayList<>(accounts);
        int n = sorted.size();
        boolean swapped;

        for (int i = 0; i < n - 1; i++) {
            swapped = false;
            for (int j = 0; j < n - i - 1; j++) {
                if (sorted.get(j).getAccountNumber().compareTo(sorted.get(j + 1).getAccountNumber()) > 0) {
                    swap(sorted, j, j + 1);
                    swapped = true;
                }
            }
            if (!swapped) break;
        }
        return sorted;
    }

    private static void swap(List<Account> list, int i, int j) {
        Account temp = list.get(i);
        list.set(i, list.get(j));
        list.set(j, temp);
    }
}
