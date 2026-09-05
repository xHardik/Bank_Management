package com.bank.model;

public class LoanApplication implements Comparable<LoanApplication> {
    private String applicationId;
    private String customerName;
    private String accountNumber;
    private String loanType; // EMERGENCY, SENIOR_CITIZEN, EDUCATION, PERSONAL
    private double amount;
    private int priorityScore; // 10 (Highest - Emergency) to 1 (Lowest)
    private String status; // PENDING, APPROVED, REJECTED
    private String timestamp;

    public LoanApplication(String applicationId, String customerName, String accountNumber, String loanType, double amount, int priorityScore) {
        this.applicationId = applicationId;
        this.customerName = customerName;
        this.accountNumber = accountNumber;
        this.loanType = loanType;
        this.amount = amount;
        this.priorityScore = priorityScore;
        this.status = "PENDING";
        this.timestamp = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm"));
    }

    public String getApplicationId() { return applicationId; }
    public String getCustomerName() { return customerName; }
    public String getAccountNumber() { return accountNumber; }
    public String getLoanType() { return loanType; }
    public double getAmount() { return amount; }
    public int getPriorityScore() { return priorityScore; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getTimestamp() { return timestamp; }

    @Override
    public int compareTo(LoanApplication other) {
        return Integer.compare(other.priorityScore, this.priorityScore); // Max-Heap ordering
    }

    @Override
    public String toString() {
        return String.format("%s | %s | %s (Rs. %.2f) | Priority: %d | Status: %s",
            applicationId, customerName, loanType, amount, priorityScore, status);
    }
}
