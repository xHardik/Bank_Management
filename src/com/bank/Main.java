package com.bank;

import com.bank.model.Account;
import com.bank.model.Transaction;
import com.bank.server.BankHttpServer;
import com.bank.service.BankService;
import com.bank.test.TestRunner;

import java.util.List;
import java.util.Scanner;

/**
 * Console Application Launcher and Interactive CLI Entry Point for Bank Management System.
 * Supports dual-mode execution: Standalone Console Menu or Web Application Mode via embedded HTTP Server.
 */
public class Main {

    private static final int PORT = 8080;

    public static void main(String[] args) {
        BankService bankService = new BankService();

        // Launch Embedded Web Server in background thread
        try {
            BankHttpServer webServer = new BankHttpServer(PORT, bankService);
            webServer.start();
        } catch (Exception e) {
            System.err.println("Warning: Could not start web server on port " + PORT + ": " + e.getMessage());
        }

        // Run Interactive Console CLI
        Scanner scanner = new Scanner(System.in);
        System.out.println("\n=================================================");
        System.out.println("    APEX BANK MANAGEMENT SYSTEM (CLI)");
        System.out.println("=================================================");

        while (true) {
            System.out.println("\n--- MAIN MENU ---");
            System.out.println("1. List All Accounts");
            System.out.println("2. Create New Account");
            System.out.println("3. Deposit Funds");
            System.out.println("4. Withdraw Funds");
            System.out.println("5. Transfer Funds");
            System.out.println("6. Undo Last Transaction (LIFO Stack)");
            System.out.println("7. Sort Accounts by Balance (QuickSort)");
            System.out.println("8. Search Account (Linear / Binary Search)");
            System.out.println("9. Run Automated Diagnostics & Unit Tests");
            System.out.println("10. Exit");
            System.out.print("Select an option (1-10): ");

            String input = scanner.nextLine().trim();
            if ("10".equals(input) || "exit".equalsIgnoreCase(input)) {
                System.out.println("Thank you for using Apex Bank. Goodbye!");
                System.exit(0);
            }

            try {
                int choice = Integer.parseInt(input);
                switch (choice) {
                    case 1:
                        List<Account> accs = bankService.getAllAccounts();
                        System.out.println("\n--- ALL REGISTERED ACCOUNTS ---");
                        for (Account a : accs) {
                            System.out.printf("Acc #: %s | Cust ID: %s | Name: %-15s | Type: %-13s | Balance: Rs. %.2f%n",
                                    a.getAccountNumber(), a.getCustomerId(), a.getHolderName(), a.getAccountType(), a.getBalance());
                        }
                        break;
                    case 2:
                        System.out.print("Enter Account Type (SAVINGS / CURRENT / FIXED_DEPOSIT): ");
                        String type = scanner.nextLine().trim();
                        System.out.print("Enter Customer Full Name: ");
                        String name = scanner.nextLine().trim();
                        System.out.print("Enter Email: ");
                        String email = scanner.nextLine().trim();
                        System.out.print("Enter Phone: ");
                        String phone = scanner.nextLine().trim();
                        System.out.print("Enter Initial Deposit Amount: ");
                        double initBal = Double.parseDouble(scanner.nextLine().trim());
                        System.out.print("Set 4-Digit Security PIN: ");
                        String pin = scanner.nextLine().trim();
                        System.out.print("Extra Parameter (Overdraft limit / Tenure months or blank): ");
                        String extra = scanner.nextLine().trim();

                        Account newAcc = bankService.createAccount(type, name, email, phone, "123 Street", initBal, pin, extra);
                        System.out.println("SUCCESS! Account created: " + newAcc);
                        break;
                    case 3:
                        System.out.print("Enter Account Number: ");
                        String depAcc = scanner.nextLine().trim();
                        System.out.print("Enter Deposit Amount: ");
                        double depAmt = Double.parseDouble(scanner.nextLine().trim());
                        System.out.print("Enter 4-Digit Security PIN: ");
                        String depPin = scanner.nextLine().trim();
                        Transaction depTx = bankService.deposit(depAcc, depAmt, depPin, "CLI Deposit");
                        System.out.println("SUCCESS! " + depTx);
                        break;
                    case 4:
                        System.out.print("Enter Account Number: ");
                        String wAcc = scanner.nextLine().trim();
                        System.out.print("Enter Withdrawal Amount: ");
                        double wAmt = Double.parseDouble(scanner.nextLine().trim());
                        System.out.print("Enter 4-Digit Security PIN: ");
                        String wPin = scanner.nextLine().trim();
                        Transaction wTx = bankService.withdraw(wAcc, wAmt, wPin, "CLI Withdrawal");
                        System.out.println("SUCCESS! " + wTx);
                        break;
                    case 5:
                        System.out.print("Enter Source Account Number: ");
                        String srcAcc = scanner.nextLine().trim();
                        System.out.print("Enter Target Account Number: ");
                        String tgtAcc = scanner.nextLine().trim();
                        System.out.print("Enter Transfer Amount: ");
                        double tAmt = Double.parseDouble(scanner.nextLine().trim());
                        System.out.print("Enter Source Account Security PIN: ");
                        String tPin = scanner.nextLine().trim();
                        Transaction tTx = bankService.transfer(srcAcc, tgtAcc, tAmt, tPin, "CLI Transfer");
                        System.out.println("SUCCESS! Transfer completed: " + tTx);
                        break;
                    case 6:
                        String undoMsg = bankService.undoLastTransaction();
                        System.out.println(undoMsg);
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
                    default:
                        System.out.println("Invalid selection. Try again.");
                }
            } catch (Exception e) {
                System.err.println("Error: " + e.getMessage());
            }
        }
    }
}
