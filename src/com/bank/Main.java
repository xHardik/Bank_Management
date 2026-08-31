package com.bank;

import com.bank.model.Account;
import com.bank.model.Transaction;
import com.bank.server.BankHttpServer;
import com.bank.service.BankService;
import com.bank.test.TestRunner;

import java.util.List;
import java.util.Scanner;

public class Main {

    public static void main(String[] args) {
        System.out.println("=========================================================");
        System.out.println("  SMART BANK ACCOUNT & TRANSACTION MANAGEMENT SYSTEM  ");
        System.out.println("=========================================================");

        BankService bankService = new BankService();

        // Start Web REST HTTP Server on Port 8080
        try {
            BankHttpServer server = new BankHttpServer(8080, bankService);
            server.start();
        } catch (Exception e) {
            System.err.println("Could not start Web Server: " + e.getMessage());
        }

        // Run interactive CLI menu alongside
        runCliMenu(bankService);
    }

    private static void runCliMenu(BankService bankService) {
        Scanner scanner = new Scanner(System.in);
        while (true) {
            System.out.println("\n---------------------------------------------------------");
            System.out.println(" MAIN TERMINAL MENU");
            System.out.println("---------------------------------------------------------");
            System.out.println(" 1. View All Accounts (HashMap)");
            System.out.println(" 2. Create New Account");
            System.out.println(" 3. Deposit Money");
            System.out.println(" 4. Withdraw Money");
            System.out.println(" 5. Transfer Funds");
            System.out.println(" 6. Undo Recent Transaction (Stack LIFO)");
            System.out.println(" 7. View Accounts Sorted by Balance (QuickSort)");
            System.out.println(" 8. Search Accounts (Binary Search / Linear Search)");
            System.out.println(" 9. Process Teller Service Queue (Queue FIFO)");
            System.out.println("10. Process VIP Service Queue (Max-Heap Priority Queue)");
            System.out.println("11. Run Automated Test Harness");
            System.out.println("12. Save & Exit");
            System.out.print("Select Option (1-12): ");

            String choiceStr = scanner.nextLine().trim();
            if (choiceStr.isEmpty()) continue;

            try {
                int choice = Integer.parseInt(choiceStr);
                switch (choice) {
                    case 1:
                        List<Account> accounts = bankService.getAllAccounts();
                        System.out.println("\n--- ACCOUNT LISTING ---");
                        for (Account a : accounts) {
                            System.out.println(a);
                        }
                        break;
                    case 2:
                        System.out.print("Enter Account Type (SAVINGS/CURRENT/FIXED_DEPOSIT): ");
                        String type = scanner.nextLine().trim();
                        System.out.print("Enter Customer Name: ");
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
                        Transaction depTx = bankService.deposit(depAcc, depAmt, "CLI Deposit");
                        System.out.println("SUCCESS! " + depTx);
                        break;
                    case 4:
                        System.out.print("Enter Account Number: ");
                        String wAcc = scanner.nextLine().trim();
                        System.out.print("Enter Withdrawal Amount: ");
                        double wAmt = Double.parseDouble(scanner.nextLine().trim());
                        Transaction wTx = bankService.withdraw(wAcc, wAmt, "CLI Withdrawal");
                        System.out.println("SUCCESS! " + wTx);
                        break;
                    case 5:
                        System.out.print("Enter Source Account Number: ");
                        String srcAcc = scanner.nextLine().trim();
                        System.out.print("Enter Target Account Number: ");
                        String tgtAcc = scanner.nextLine().trim();
                        System.out.print("Enter Transfer Amount: ");
                        double tAmt = Double.parseDouble(scanner.nextLine().trim());
                        Transaction tTx = bankService.transfer(srcAcc, tgtAcc, tAmt, "CLI Transfer");
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
                            System.out.printf("Acc #: %s | Name: %-15s | Type: %-13s | Balance: $%.2f%n",
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
                                System.out.println("ACCOUNT NOT FOUND.");
                            }
                        } else {
                            System.out.print("Enter Search Keyword: ");
                            String kw = scanner.nextLine().trim();
                            List<Account> matches = bankService.searchAccounts(kw);
                            System.out.println("FOUND " + matches.size() + " MATCHES:");
                            for (Account m : matches) {
                                System.out.println(m);
                            }
                        }
                        break;
                    case 9:
                        System.out.print("(1) Enqueue Request or (2) Dequeue Request: ");
                        String qOpt = scanner.nextLine().trim();
                        if ("1".equals(qOpt)) {
                            System.out.print("Enter Customer Inquiry Details: ");
                            String inq = scanner.nextLine().trim();
                            bankService.enqueueTellerRequest(inq);
                            System.out.println("Enqueued in Teller Queue.");
                        } else {
                            System.out.println("Serviced Customer: " + bankService.dequeueTellerRequest());
                        }
                        break;
                    case 10:
                        System.out.print("(1) Add VIP Request or (2) Process Top VIP Request: ");
                        String vipOpt = scanner.nextLine().trim();
                        if ("1".equals(vipOpt)) {
                            System.out.print("Customer Name: ");
                            String vName = scanner.nextLine().trim();
                            System.out.print("Priority Score (1-10): ");
                            int prio = Integer.parseInt(scanner.nextLine().trim());
                            bankService.addVipRequest("REQ" + System.currentTimeMillis() % 1000, vName, "VIP Inquiry", prio);
                            System.out.println("VIP Request added to Max-Heap.");
                        } else {
                            System.out.println("Serviced VIP: " + bankService.processVipRequest());
                        }
                        break;
                    case 11:
                        TestRunner.runAllTests(System.out);
                        break;
                    case 12:
                        bankService.saveState();
                        System.out.println("Banking state saved to disk. Goodbye!");
                        System.exit(0);
                        break;
                    default:
                        System.out.println("Invalid selection. Enter a number between 1 and 12.");
                }
            } catch (Exception e) {
                System.out.println("ERROR: " + e.getMessage());
            }
        }
    }
}
