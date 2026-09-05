package com.bank;

import com.bank.model.Account;
import com.bank.model.Transaction;
import com.bank.server.BankHttpServer;
import com.bank.service.BankService;
import com.bank.test.TestRunner;

import java.io.IOException;
import java.util.List;
import java.util.Scanner;

public class Main {

    public static void main(String[] args) {
        System.out.println("Initializing Apex Core Banking System...");
        BankService bankService = new BankService();

        int port = 8080;
        try {
            BankHttpServer server = new BankHttpServer(port, bankService);
            server.start();
        } catch (IOException e) {
            System.err.println("Failed to start HTTP server on port " + port + ": " + e.getMessage());
        }

        Scanner scanner = new Scanner(System.in);
        boolean running = true;

        System.out.println("\n--- APEX BANK INTERACTIVE CLI & SERVER CONSOLE ---");
        while (running) {
            System.out.println("\n1. Deposit Funds");
            System.out.println("2. Withdraw Cash");
            System.out.println("3. Inter-Account Transfer");
            System.out.println("4. View All Accounts");
            System.out.println("5. View Master Transaction Ledger");
            System.out.println("6. Undo Most Recent Operation (Stack LIFO)");
            System.out.println("7. Sort Accounts by Balance (QuickSort)");
            System.out.println("8. Search Account (Linear / Binary Search)");
            System.out.println("9. Run Automated Diagnostics & Unit Tests");
            System.out.println("10. Exit System");
            System.out.print("Select Operation (1-10): ");

            String input = scanner.nextLine().trim();
            try {
                int choice = Integer.parseInt(input);
                switch (choice) {
                    case 1:
                        System.out.print("Enter Account Number (e.g. ACC1001): ");
                        String depAcc = scanner.nextLine().trim();
                        System.out.print("Enter Amount (INR): ");
                        double depAmt = Double.parseDouble(scanner.nextLine().trim());
                        System.out.print("Enter 4-Digit Security PIN: ");
                        String depPin = scanner.nextLine().trim();
                        Transaction depTx = bankService.deposit(depAcc, depAmt, depPin, "CLI Cash Deposit");
                        System.out.println("Deposit Successful! Tx ID: " + depTx.getTransactionId() + " | New Balance: Rs. " + depTx.getBalanceAfter());
                        break;
                    case 2:
                        System.out.print("Enter Account Number: ");
                        String wAcc = scanner.nextLine().trim();
                        System.out.print("Enter Amount (INR): ");
                        double wAmt = Double.parseDouble(scanner.nextLine().trim());
                        System.out.print("Enter 4-Digit Security PIN: ");
                        String wPin = scanner.nextLine().trim();
                        Transaction wTx = bankService.withdraw(wAcc, wAmt, wPin, "CLI Cash Withdrawal");
                        System.out.println("Withdrawal Successful! Tx ID: " + wTx.getTransactionId() + " | New Balance: Rs. " + wTx.getBalanceAfter());
                        break;
                    case 3:
                        System.out.print("Enter Source Account Number: ");
                        String srcAcc = scanner.nextLine().trim();
                        System.out.print("Enter Target Account Number: ");
                        String tgtAcc = scanner.nextLine().trim();
                        System.out.print("Enter Amount (INR): ");
                        double tAmt = Double.parseDouble(scanner.nextLine().trim());
                        System.out.print("Enter Source Security PIN: ");
                        String tPin = scanner.nextLine().trim();
                        Transaction tTx = bankService.transfer(srcAcc, tgtAcc, tAmt, tPin, "CLI Transfer");
                        System.out.println("Transfer Successful! Tx ID: " + tTx.getTransactionId() + " | Source New Balance: Rs. " + tTx.getBalanceAfter());
                        break;
                    case 4:
                        System.out.println("\n--- ALL REGISTERED ACCOUNTS ---");
                        for (Account a : bankService.getAllAccounts()) {
                            System.out.printf("Acc #: %s | Name: %-15s | Type: %-13s | Balance: Rs. %.2f%n",
                                    a.getAccountNumber(), a.getHolderName(), a.getAccountType(), a.getBalance());
                        }
                        break;
                    case 5:
                        System.out.println("\n--- MASTER TRANSACTION LEDGER ---");
                        for (Transaction t : bankService.getMasterTransactions()) {
                            System.out.println(t);
                        }
                        break;
                    case 6:
                        boolean ok = bankService.undoLastTransaction();
                        if (ok) {
                            System.out.println("Undo Successful! Most recent transaction rolled back.");
                        } else {
                            System.out.println("Nothing to undo.");
                        }
                        break;
                    case 7:
                        List<Account> sorted = bankService.getAccountsSortedByBalance();
                        System.out.println("\n--- ACCOUNTS SORTED BY BALANCE (QuickSort Descending) ---");
                        for (Account a : sorted) {
                            System.out.printf("Acc #: %s | Name: %-15s | Type: %-13s | Balance: Rs. %.2f%n",
                                    a.getAccountNumber(), a.getHolderName(), a.getAccountType(), a.getBalance());
                        }
                        break;
                    case 8:
                        System.out.print("Search by (1) Name/Keyword (Linear Search) or (2) Acc Number (Binary Search): ");
                        String mode = scanner.nextLine().trim();
                        if ("2".equals(mode)) {
                            System.out.print("Enter Exact Account Number: ");
                            String searchAccNum = scanner.nextLine().trim();
                            Account match = bankService.binarySearchByAccNum(searchAccNum);
                            if (match != null) {
                                System.out.println("FOUND (Binary Search): " + match);
                            } else {
                                System.out.println("Account not found.");
                            }
                        } else {
                            System.out.print("Enter Name Keyword: ");
                            String kw = scanner.nextLine().trim();
                            List<Account> matches = bankService.searchAccounts(kw);
                            System.out.println("Found " + matches.size() + " matching account(s):");
                            for (Account m : matches) {
                                System.out.println(" - " + m);
                            }
                        }
                        break;
                    case 9:
                        TestRunner.runAllTests(System.out);
                        break;
                    case 10:
                        System.out.println("Shutting down Apex Bank System. Goodbye!");
                        running = false;
                        break;
                    default:
                        System.out.println("Invalid option. Please enter 1-10.");
                }
            } catch (Exception e) {
                System.err.println("Error: " + e.getMessage());
            }
        }
        scanner.close();
        System.exit(0);
    }
}
