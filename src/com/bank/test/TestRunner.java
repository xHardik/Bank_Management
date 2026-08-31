package com.bank.test;

import com.bank.algo.AccountSearch;
import com.bank.algo.AccountSorter;
import com.bank.ds.*;
import com.bank.exception.InsufficientFundsException;
import com.bank.exception.InvalidAccountException;
import com.bank.exception.TransactionFailedException;
import com.bank.model.*;
import com.bank.service.BankService;

import java.io.PrintStream;
import java.util.ArrayList;
import java.util.List;

/**
 * Self-contained Automated Unit Test Harness for verifying Data Structures & Banking Operations.
 */
public class TestRunner {

    public static boolean runAllTests(PrintStream out) {
        int passed = 0;
        int total = 0;

        out.println("=== RUNNING AUTOMATED UNIT & DS TESTS ===");

        // Test 1: Savings Account Minimum Balance Invariant
        total++;
        try {
            SavingsAccount sa = new SavingsAccount("TST101", "CUST1", "Test User", 500.00, "1234");
            sa.withdraw(450.00); // Should throw InsufficientFundsException because min balance is $100
            out.println("[FAIL] Test 1: Savings Min Balance check failed (did not throw exception)");
        } catch (InsufficientFundsException e) {
            passed++;
            out.println("[PASS] Test 1: Savings Min Balance exception enforced correctly.");
        } catch (Exception e) {
            out.println("[FAIL] Test 1: Unexpected exception: " + e);
        }

        // Test 2: Current Account Overdraft Facility
        total++;
        try {
            CurrentAccount ca = new CurrentAccount("TST102", "CUST2", "Test User 2", 100.00, "1234", 1000.00);
            boolean success = ca.withdraw(500.00); // Should succeed using overdraft
            if (success && ca.getBalance() == -400.00) {
                passed++;
                out.println("[PASS] Test 2: Current Account Overdraft allowed withdrawal to -$400.00.");
            } else {
                out.println("[FAIL] Test 2: Overdraft balance incorrect: " + ca.getBalance());
            }
        } catch (Exception e) {
            out.println("[FAIL] Test 2: Overdraft exception: " + e);
        }

        // Test 3: Custom Doubly Linked List Ledger
        total++;
        try {
            TransactionLinkedList list = new TransactionLinkedList();
            Transaction t1 = new Transaction("TX1", "ACC1", TransactionType.DEPOSIT, 100, 100, null, "Test 1");
            Transaction t2 = new Transaction("TX2", "ACC1", TransactionType.WITHDRAWAL, 50, 50, null, "Test 2");
            list.addLast(t1);
            list.addLast(t2);

            if (list.getSize() == 2 && list.getTail().getData().getTransactionId().equals("TX2")) {
                passed++;
                out.println("[PASS] Test 3: Doubly Linked List tail and size verified.");
            } else {
                out.println("[FAIL] Test 3: Doubly Linked List size/tail mismatch.");
            }
        } catch (Exception e) {
            out.println("[FAIL] Test 3: Exception: " + e);
        }

        // Test 4: Custom Stack Undo Operation (LIFO)
        total++;
        try {
            TransactionStack stack = new TransactionStack();
            Transaction t1 = new Transaction("TX1", "ACC1", TransactionType.DEPOSIT, 100, 100, null, "Test");
            Transaction t2 = new Transaction("TX2", "ACC1", TransactionType.DEPOSIT, 200, 300, null, "Test");
            stack.push(t1);
            stack.push(t2);

            Transaction popped = stack.pop();
            if (popped.getTransactionId().equals("TX2") && stack.getSize() == 1) {
                passed++;
                out.println("[PASS] Test 4: Stack LIFO Pop order verified.");
            } else {
                out.println("[FAIL] Test 4: Stack pop failed.");
            }
        } catch (Exception e) {
            out.println("[FAIL] Test 4: Stack exception: " + e);
        }

        // Test 5: Priority Queue (Max-Heap) VIP Ordering
        total++;
        try {
            PriorityServiceQueue pq = new PriorityServiceQueue();
            pq.insert(new PriorityServiceQueue.ServiceRequest("R1", "Normal User", "Inquiry", 2));
            pq.insert(new PriorityServiceQueue.ServiceRequest("R2", "VIP User", "Loan", 10));
            pq.insert(new PriorityServiceQueue.ServiceRequest("R3", "Medium User", "Deposit", 5));

            PriorityServiceQueue.ServiceRequest maxReq = pq.extractMax();
            if (maxReq.getPriorityScore() == 10 && maxReq.getCustomerName().equals("VIP User")) {
                passed++;
                out.println("[PASS] Test 5: Max-Heap Priority Queue extracted highest priority request first.");
            } else {
                out.println("[FAIL] Test 5: Priority Queue order incorrect: " + maxReq);
            }
        } catch (Exception e) {
            out.println("[FAIL] Test 5: Priority Queue exception: " + e);
        }

        // Test 6: QuickSort & Binary Search
        total++;
        try {
            List<Account> accounts = new ArrayList<>();
            accounts.add(new SavingsAccount("ACC999", "C1", "Zack", 500, "1234"));
            accounts.add(new SavingsAccount("ACC111", "C2", "Adam", 1500, "1234"));
            accounts.add(new SavingsAccount("ACC555", "C3", "Mary", 3000, "1234"));

            // QuickSort by balance descending
            List<Account> sortedByBal = AccountSorter.quickSortByBalanceDescending(accounts);
            boolean sortOk = sortedByBal.get(0).getBalance() == 3000 && sortedByBal.get(2).getBalance() == 500;

            // BubbleSort by acc number ascending
            List<Account> sortedByAcc = AccountSorter.bubbleSortByAccountNumber(accounts);
            int idx = AccountSearch.binarySearchByAccountNumber(sortedByAcc, "ACC555");
            boolean binSearchOk = idx != -1 && sortedByAcc.get(idx).getHolderName().equals("Mary");

            if (sortOk && binSearchOk) {
                passed++;
                out.println("[PASS] Test 6: QuickSort Descending and Binary Search verified successfully.");
            } else {
                out.println("[FAIL] Test 6: QuickSort/BinarySearch check failed.");
            }
        } catch (Exception e) {
            out.println("[FAIL] Test 6: Sort/Search exception: " + e);
        }

        out.println(String.format("=== SUMMARY: %d / %d TESTS PASSED ===", passed, total));
        return passed == total;
    }

    public static void main(String[] args) {
        runAllTests(System.out);
    }
}
