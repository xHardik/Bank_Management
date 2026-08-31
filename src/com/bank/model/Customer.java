package com.bank.model;

/**
 * Represents a bank customer profile with encapsulated personal information.
 */
public class Customer {
    private final String customerId;
    private String name;
    private String email;
    private String phone;
    private String address;

    public Customer(String customerId, String name, String email, String phone, String address) {
        this.customerId = customerId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.address = address;
    }

    public String getCustomerId() { return customerId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    @Override
    public String toString() {
        return String.format("Customer[ID: %s, Name: %s, Email: %s, Phone: %s]", customerId, name, email, phone);
    }
}
