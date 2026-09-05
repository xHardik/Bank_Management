package com.bank.ds;

import com.bank.model.Customer;
import java.util.ArrayList;
import java.util.List;

public class CustomerBST {
    private static class Node {
        Customer customer;
        Node left;
        Node right;

        Node(Customer customer) {
            this.customer = customer;
        }
    }

    private Node root;

    public void insert(Customer customer) {
        root = insertRecursive(root, customer);
    }

    private Node insertRecursive(Node current, Customer customer) {
        if (current == null) {
            return new Node(customer);
        }

        int cmp = customer.getCustomerId().compareTo(current.customer.getCustomerId());
        if (cmp < 0) {
            current.left = insertRecursive(current.left, customer);
        } else if (cmp > 0) {
            current.right = insertRecursive(current.right, customer);
        } else {
            current.customer = customer; // Overwrite
        }
        return current;
    }

    public Customer search(String customerId) {
        return searchRecursive(root, customerId);
    }

    private Customer searchRecursive(Node current, String customerId) {
        if (current == null) return null;
        int cmp = customerId.compareTo(current.customer.getCustomerId());
        if (cmp == 0) return current.customer;
        return cmp < 0 ? searchRecursive(current.left, customerId) : searchRecursive(current.right, customerId);
    }

    public List<Customer> getInorderList() {
        List<Customer> result = new ArrayList<>();
        inorderRecursive(root, result);
        return result;
    }

    private void inorderRecursive(Node current, List<Customer> result) {
        if (current != null) {
            inorderRecursive(current.left, result);
            result.add(current.customer);
            inorderRecursive(current.right, result);
        }
    }
}
