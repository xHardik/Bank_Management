package com.bank.util;

import com.bank.model.*;
import com.bank.ds.AccountHashMap;

import java.io.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Utility for persisting and loading banking system data to/from plain text/CSV files.
 * Handles Accounts, Customers, and Transaction ledgers.
 */
public class FileStorageManager {

    private static final String DATA_DIR = "data";
    private static final String ACCOUNTS_FILE = "data/accounts.txt";
    private static final String CUSTOMERS_FILE = "data/customers.txt";
    private static final String TRANSACTIONS_FILE = "data/transactions.txt";

    public static void ensureDataDirectoryExists() {
        File dir = new File(DATA_DIR);
        if (!dir.exists()) {
            dir.mkdirs();
        }
    }

    /**
     * Saves all customers, accounts, and transactions to text storage.
     */
    public static void saveData(List<Customer> customers, AccountHashMap accountsMap, List<Transaction> allTransactions) {
        ensureDataDirectoryExists();
        saveCustomers(customers);
        saveAccounts(accountsMap.getAllAccounts());
        saveTransactions(allTransactions);
    }

    private static void saveCustomers(List<Customer> customers) {
        try (PrintWriter writer = new PrintWriter(new FileWriter(CUSTOMERS_FILE))) {
            for (Customer c : customers) {
                // CSV format: customerId,name,email,phone,address
                writer.println(String.format("%s,%s,%s,%s,%s",
                        c.getCustomerId(), c.getName(), c.getEmail(), c.getPhone(), c.getAddress()));
            }
        } catch (IOException e) {
            System.err.println("Error saving customers: " + e.getMessage());
        }
    }

    private static void saveAccounts(List<Account> accounts) {
        try (PrintWriter writer = new PrintWriter(new FileWriter(ACCOUNTS_FILE))) {
            for (Account a : accounts) {
                // Format: accountNumber,customerId,holderName,balance,pin,accountType,extraVal
                String extra = "0";
                if (a instanceof CurrentAccount) {
                    extra = String.valueOf(((CurrentAccount) a).getOverdraftLimit());
                } else if (a instanceof FixedDepositAccount) {
                    extra = String.valueOf(((FixedDepositAccount) a).getTenureMonths());
                }
                writer.println(String.format("%s,%s,%s,%.2f,%s,%s,%s",
                        a.getAccountNumber(), a.getCustomerId(), a.getHolderName(),
                        a.getBalance(), a.getPin(), a.getAccountType(), extra));
            }
        } catch (IOException e) {
            System.err.println("Error saving accounts: " + e.getMessage());
        }
    }

    private static void saveTransactions(List<Transaction> transactions) {
        try (PrintWriter writer = new PrintWriter(new FileWriter(TRANSACTIONS_FILE))) {
            for (Transaction t : transactions) {
                // Format: txId,accNum,type,amount,balanceAfter,targetAccNum,timestamp,remarks
                writer.println(String.format("%s,%s,%s,%.2f,%.2f,%s,%s,%s",
                        t.getTransactionId(), t.getAccountNumber(), t.getType(),
                        t.getAmount(), t.getBalanceAfter(), t.getTargetAccountNumber(),
                        t.getTimestamp(), t.getRemarks()));
            }
        } catch (IOException e) {
            System.err.println("Error saving transactions: " + e.getMessage());
        }
    }

    public static List<Customer> loadCustomers() {
        List<Customer> list = new ArrayList<>();
        File file = new File(CUSTOMERS_FILE);
        if (!file.exists()) return list;

        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] parts = line.split(",");
                if (parts.length >= 5) {
                    list.add(new Customer(parts[0], parts[1], parts[2], parts[3], parts[4]));
                }
            }
        } catch (IOException e) {
            System.err.println("Error loading customers: " + e.getMessage());
        }
        return list;
    }

    public static List<Account> loadAccounts() {
        List<Account> list = new ArrayList<>();
        File file = new File(ACCOUNTS_FILE);
        if (!file.exists()) return list;

        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] parts = line.split(",");
                if (parts.length >= 6) {
                    String accNum = parts[0];
                    String custId = parts[1];
                    String holder = parts[2];
                    double balance = Double.parseDouble(parts[3]);
                    String pin = parts[4];
                    String type = parts[5];
                    String extra = parts.length >= 7 ? parts[6] : "0";

                    Account acc;
                    if ("CURRENT".equalsIgnoreCase(type)) {
                        double overdraft = Double.parseDouble(extra);
                        acc = new CurrentAccount(accNum, custId, holder, balance, pin, overdraft);
                    } else if ("FIXED_DEPOSIT".equalsIgnoreCase(type)) {
                        int tenure = Integer.parseInt(extra);
                        acc = new FixedDepositAccount(accNum, custId, holder, balance, pin, tenure);
                    } else {
                        acc = new SavingsAccount(accNum, custId, holder, balance, pin);
                    }
                    list.add(acc);
                }
            }
        } catch (IOException e) {
            System.err.println("Error loading accounts: " + e.getMessage());
        }
        return list;
    }

    public static List<Transaction> loadTransactions() {
        List<Transaction> list = new ArrayList<>();
        File file = new File(TRANSACTIONS_FILE);
        if (!file.exists()) return list;

        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                String[] parts = line.split(",");
                if (parts.length >= 8) {
                    list.add(new Transaction(
                            parts[0], parts[1], TransactionType.valueOf(parts[2]),
                            Double.parseDouble(parts[3]), Double.parseDouble(parts[4]),
                            parts[5], parts[6], parts[7]));
                }
            }
        } catch (IOException e) {
            System.err.println("Error loading transactions: " + e.getMessage());
        }
        return list;
    }
}
