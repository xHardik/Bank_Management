# Project Report & Technical Documentation
## Title: Smart Bank Account and Transaction Management System
### Domain: Banking & Financial Services
**Language**: Java | **Frontend**: HTML5 / CSS3 / JavaScript | **Backend**: Native Java HttpServer REST API

---

# Executive Summary & Rubric Alignment (25 Marks Total)

| Evaluation Rubric Category | Allocated Marks | Project Coverage & Implementation Highlights |
| :--- | :---: | :--- |
| **1. Problem Definition & Design** | **5 Marks** | Clear real-world problem definition, modular architecture diagram, data flow charts, and pseudocode. |
| **2. Java OOP Implementation** | **5 Marks** | Abstract `Account` base class, `SavingsAccount`, `CurrentAccount`, `FixedDepositAccount` subclasses, custom exceptions, encapsulation, file persistence. |
| **3. Data Structures & Algorithms** | **5 Marks** | Custom Doubly Linked List, LIFO Stack, FIFO Queue, Circular Queue, Max-Heap Priority Queue, HashMap, QuickSort, BubbleSort, Binary Search, Linear Search, Complexity Analysis. |
| **4. Functionality & Testing** | **5 Marks** | Interactive Web UI Dashboard & CLI Menu, 100% passing automated unit test suite (`TestRunner`), exception safety. |
| **5. Documentation & Viva Prep** | **5 Marks** | Complete report, time/space complexity matrices, screenshots walkthrough, and viva Q&A guide. |

---

# Section 1: Problem Definition & Application Design (5 Marks)

## 1.1 Problem Statement
Modern banking institutions handle millions of financial transactions daily—including customer onboarding, deposits, withdrawals, fund transfers, monthly interest accruals, teller service queues, and audit trail logging. 

Traditional linear array-based transaction records cause severe performance degradation:
- Account lookup in unordered lists takes $O(N)$ linear time.
- Transaction statements require dynamic insertion; static arrays cause memory reallocation overhead.
- Transaction rollbacks (undoing erroneous deposits/transfers) require LIFO memory structures.
- High-priority VIP customer service requires priority queue scheduling.

## 1.2 Proposed Solution
This project implements a **Smart Bank Account & Transaction Management System** in pure Java with an HTML5/CSS3 Web Dashboard. The system solves performance bottlenecks through:
1. **O(1) Hash Table Lookup**: Instant account retrieval via `AccountHashMap`.
2. **Dynamic Ledger**: Custom `TransactionLinkedList` (Doubly Linked List) for $O(1)$ transaction logging.
3. **Transaction Rollback**: Custom `TransactionStack` (LIFO) allowing instant undo of recent transactions.
4. **Queue Management**: `TellerQueue` (FIFO) for customer lines and `PriorityServiceQueue` (Max-Heap) for VIP requests.
5. **Fast Sorting & Searching**: QuickSort for high-balance rankings ($O(N \log N)$) and Binary Search ($O(\log N)$).

## 1.3 System Module Architecture

```
                                +---------------------------------------+
                                |      HTML5 / CSS3 Web UI Dashboard    |
                                +-------------------+-------------------+
                                                    | REST API (JSON)
                                                    v
                                +---------------------------------------+
                                |  Java HttpServer REST Backend (:8080) |
                                +-------------------+-------------------+
                                                    |
       +--------------------------------------------+--------------------------------------------+
       |                                            |                                            |
+------v------------------+              +----------v---------------+               +------------v-------------+
|    Model Layer (OOP)    |              | Data Structures & Algo   |               | Persistence & Service    |
+-------------------------+              +--------------------------+               +--------------------------+
| Account (Abstract Base) |              | HashMap (O(1) Lookups)   |               | BankService              |
|  ├─ SavingsAccount      |              | Doubly Linked List       |               | FileStorageManager       |
|  ├─ CurrentAccount      |              | Transaction Stack (Undo) |               |  ├─ accounts.txt         |
|  └─ FixedDepositAccount |              | Teller Queue (FIFO)      |               |  ├─ customers.txt        |
| Customer                |              | Circular Log Queue       |               |  └─ transactions.txt     |
| Transaction             |              | Priority Queue (Max-Heap)|               | TestRunner               |
| TransactionType         |              | QuickSort & BinarySearch |               |                          |
+-------------------------+              +--------------------------+               +--------------------------+
```

## 1.4 System Data Flowchart & Pseudocode

### Transfer Operation Dataflow
```
[User Request: Transfer $X from Acc A to Acc B]
                    │
                    ▼
          Validate Accounts exist in HashMap O(1)
                    │
                    ▼
     Validate PIN & Check Source Balance >= $X
        ├── NO  ──► Throw InsufficientFundsException
        └── YES ──► Continue
                    │
                    ▼
       Acc A.balance -= $X  │  Acc B.balance += $X
                    │
                    ▼
 Create Outgoing & Incoming Transactions (TransactionLinkedList)
                    │
                    ▼
   Push Transaction onto TransactionStack (for Undo option)
                    │
                    ▼
        Persist to data/storage files & Return HTTP 200
```

---

# Section 2: Java Programming Implementation (5 Marks)

## 2.1 Object-Oriented Programming (OOP) Pillars

### 1. Abstraction
- Abstract class `com.bank.model.Account` defines the contract for all bank accounts.
- Abstract methods force specialized implementations:
  ```java
  public abstract boolean withdraw(double amount) throws InsufficientFundsException, TransactionFailedException;
  public abstract void applyMonthlyInterestOrFees();
  public abstract String getAccountType();
  ```

### 2. Inheritance
- Subclasses extend the base `Account` class:
  - `SavingsAccount extends Account` (adds minimum balance invariant of \$100 and annual interest rate calculation).
  - `CurrentAccount extends Account` (adds overdraft facility up to \$5,000 and monthly maintenance fees).
  - `FixedDepositAccount extends Account` (adds fixed tenure and premature withdrawal penalty rates).

### 3. Polymorphism
- Dynamic Method Dispatch allows calling `account.withdraw(amount)` or `account.applyMonthlyInterestOrFees()` on any `Account` reference, automatically invoking the correct specialized subclass behavior at runtime.

### 4. Encapsulation
- All data fields (`balance`, `pin`, `accountNumber`, `customerId`) are marked `private` or `protected`. Access and modifications are guarded by validated getters and methods (e.g. `deposit()`, `withdraw()`, `validatePin()`).

## 2.2 Custom Exception Handling
The system implements custom exception classes extending `java.lang.Exception`:
- `InsufficientFundsException`: Thrown when withdrawal/transfer exceeds available balance or overdraft limit.
- `InvalidAccountException`: Thrown when an account number is not found in the hash table.
- `TransactionFailedException`: Thrown when input validation fails (e.g., negative deposit amount).

---

# Section 3: Data Structures & Algorithms (5 Marks)

## 3.1 Data Structure Selection & Complexity Analysis

| Data Structure | Implementation | Real-World Banking Application | Time Complexity | Space Complexity |
| :--- | :--- | :--- | :--- | :--- |
| **Hash Table** | `AccountHashMap` | $O(1)$ fast account lookup by unique Account Number. | Search: $O(1)$ avg<br>Insert: $O(1)$ avg | $O(N)$ |
| **Doubly Linked List** | `TransactionLinkedList` | Account transaction statement ledger with dynamic insertion and bidirectional browsing. | Insert: $O(1)$<br>Traverse: $O(N)$ | $O(N)$ |
| **Stack (LIFO)** | `TransactionStack` | Stores recent operations for multi-level transaction Rollback / Undo. | Push: $O(1)$<br>Pop: $O(1)$ | $O(N)$ |
| **Queue (FIFO)** | `TellerQueue` | Customer service request queue at the bank teller window. | Enqueue: $O(1)$<br>Dequeue: $O(1)$ | $O(N)$ |
| **Circular Queue** | `CircularLogQueue` | Fixed-size rolling system audit log buffer to prevent memory leaks. | Enqueue: $O(1)$<br>Dequeue: $O(1)$ | $O(K)$ bounded |
| **Priority Queue** | `PriorityServiceQueue` | Max-Heap ordering VIP customer loan and high-value wire transfer requests. | Insert: $O(\log N)$<br>Extract-Max: $O(\log N)$ | $O(N)$ |

## 3.2 Algorithms Selection & Complexity Analysis

| Algorithm | Method Class | Application | Time Complexity | Space Complexity |
| :--- | :--- | :--- | :--- | :--- |
| **Linear Search** | `AccountSearch.linearSearchByName` | Search accounts or transaction remarks matching substring keywords. | Best: $O(1)$<br>Worst: $O(N)$ | $O(1)$ auxiliary |
| **Binary Search** | `AccountSearch.binarySearchByAccountNumber` | Fast binary search on accounts sorted by Account Number. | Best: $O(1)$<br>Worst: $O(\log N)$ | $O(1)$ auxiliary |
| **QuickSort** | `AccountSorter.quickSortByBalanceDescending` | Ranks accounts by balance in descending order for financial reports. | Avg: $O(N \log N)$<br>Worst: $O(N^2)$ | $O(\log N)$ auxiliary |
| **BubbleSort** | `AccountSorter.bubbleSortByAccountNumber` | Sorts accounts by Account Number to prepare data for Binary Search. | Avg: $O(N^2)$<br>Worst: $O(N^2)$ | $O(1)$ auxiliary |

---

# Section 4: Application Functionality, Testing & Output (5 Marks)

## 4.1 Automated Unit Test Harness (`TestRunner`)
The project includes a self-contained automated unit testing harness (`com.bank.test.TestRunner`) verifying core banking logic and data structure correctness.

### Execution Results:
```text
=== RUNNING AUTOMATED UNIT & DS TESTS ===
[PASS] Test 1: Savings Min Balance exception enforced correctly.
[PASS] Test 2: Current Account Overdraft allowed withdrawal to -$400.00.
[PASS] Test 3: Doubly Linked List tail and size verified.
[PASS] Test 4: Stack LIFO Pop order verified.
[PASS] Test 5: Max-Heap Priority Queue extracted highest priority request first.
[PASS] Test 6: QuickSort Descending and Binary Search verified successfully.
=== SUMMARY: 6 / 6 TESTS PASSED ===
```

## 4.2 Web Dashboard & REST API Features
1. **Interactive Dashboard**: Real-time stats cards for Total Accounts, Total Capital, Ledger Entries, and VIP Queue Count.
2. **Account Management**: Create Savings, Current, or Fixed Deposit accounts with automatic validation.
3. **Financial Operations**: Instant Deposit, Withdrawal, and Inter-account Fund Transfers.
4. **Transaction Undo**: Instant LIFO rollback of recent transactions powered by `TransactionStack`.
5. **VIP Priority Queue**: Max-heap ordering of high-priority client requests.
6. **Persistence Layer**: Automatic loading and saving of system state to `data/accounts.txt`, `data/customers.txt`, and `data/transactions.txt`.

---

# Section 5: Documentation, Presentation & Viva Guide (5 Marks)

## 5.1 Project Folder Structure
```text
e:/VAAC/
├── src/
│   └── com/
│       └── bank/
│           ├── model/          (Account, SavingsAccount, CurrentAccount, FixedDepositAccount, Customer, Transaction)
│           ├── ds/             (AccountHashMap, TransactionLinkedList, TransactionStack, TellerQueue, CircularLogQueue, PriorityServiceQueue)
│           ├── algo/           (AccountSearch, AccountSorter)
│           ├── exception/      (InsufficientFundsException, InvalidAccountException, TransactionFailedException)
│           ├── util/           (FileStorageManager)
│           ├── service/        (BankService)
│           ├── server/         (BankHttpServer)
│           ├── test/           (TestRunner)
│           └── Main.java       (App Entry Point)
├── web/                        (HTML5/CSS3/JS Frontend)
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── data/                       (Text file storage)
└── PROJECT_DOCUMENTATION.md   (Complete Project Documentation)
```

## 5.2 Viva Voice (Q&A) Technical Defense Guide

### Q1: Why did you choose HashMap for account storage instead of an Array or Linked List?
> **Answer**: Account lookups happen frequently (every deposit, withdrawal, or transfer). In an Array or Linked List, searching for an account takes $O(N)$ linear time. Hash Table / HashMap provides $O(1)$ constant average time complexity by hashing the unique Account Number key directly to its storage bucket.

### Q2: How does the Transaction Undo feature work? Which data structure is used and why?
> **Answer**: Undo requires Last-In, First-Out (LIFO) semantics so that the most recent transaction is reverted first. We implemented a custom `TransactionStack`. When a transaction is performed, it is pushed onto the stack. When the user clicks "Undo", we pop the top transaction, invert the financial operation (e.g., deducting a deposit or crediting a withdrawal), and update the account balance.

### Q3: Explain how Polymorphism is demonstrated in your account hierarchy.
> **Answer**: Abstract base class `Account` defines the abstract method `withdraw(amount)`. `SavingsAccount` overrides `withdraw` to enforce a minimum balance of \$100. `CurrentAccount` overrides `withdraw` to allow negative balances down to an overdraft limit of -\$5,000. `FixedDepositAccount` overrides `withdraw` to impose a premature penalty. The service layer invokes `account.withdraw(amount)` polymorphically without needing to check the specific account type at compile time.

### Q4: What is the difference between QuickSort and BubbleSort in your sorting module?
> **Answer**: 
> - **QuickSort** is a Divide-and-Conquer algorithm with an average time complexity of $O(N \log N)$. We use it to rank accounts by balance descending.
> - **BubbleSort** is a comparison-based sorting algorithm with a time complexity of $O(N^2)$. We use it to sort accounts by Account Number to prepare the list for Binary Search ($O(\log N)$).

### Q5: How is memory managed in your system audit log?
> **Answer**: We implemented a `CircularLogQueue` with a fixed array capacity (50 logs). When the log buffer fills up, the circular pointers wrap around, overwriting the oldest log entry. This ensures fixed $O(1)$ memory space overhead regardless of how long the application runs.
