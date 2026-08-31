package com.bank.algo;

import com.bank.model.Account;
import java.util.ArrayList;
import java.util.List;

/**
 * Implements fundamental sorting algorithms (QuickSort & BubbleSort) to sort account records.
 */
public class AccountSorter {

    /**
     * Sorts accounts by Balance in Descending order using QuickSort.
     * Time Complexity: O(N log N) average.
     */
    public static List<Account> quickSortByBalanceDescending(List<Account> accounts) {
        List<Account> sorted = new ArrayList<>(accounts);
        quickSort(sorted, 0, sorted.size() - 1);
        return sorted;
    }

    private static void quickSort(List<Account> list, int low, int high) {
        if (low < high) {
            int pivotIndex = partition(list, low, high);
            quickSort(list, low, pivotIndex - 1);
            quickSort(list, pivotIndex + 1, high);
        }
    }

    private static int partition(List<Account> list, int low, int high) {
        double pivotBalance = list.get(high).getBalance();
        int i = low - 1;

        for (int j = low; j < high; j++) {
            // Descending order sort (highest balance first)
            if (list.get(j).getBalance() >= pivotBalance) {
                i++;
                swap(list, i, j);
            }
        }
        swap(list, i + 1, high);
        return i + 1;
    }

    /**
     * Sorts accounts by Account Number in Ascending order using BubbleSort.
     * Useful for preparing lists for Binary Search.
     * Time Complexity: O(N^2)
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
