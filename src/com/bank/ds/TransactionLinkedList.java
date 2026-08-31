package com.bank.ds;

import com.bank.model.Transaction;
import java.util.ArrayList;
import java.util.List;

/**
 * Custom Doubly Linked List for storing an Account's Transaction History.
 * Allows O(1) appending and efficient bidirectional traversal.
 */
public class TransactionLinkedList {

    public static class Node {
        private final Transaction data;
        private Node next;
        private Node prev;

        public Node(Transaction data) {
            this.data = data;
            this.next = null;
            this.prev = null;
        }

        public Transaction getData() { return data; }
        public Node getNext() { return next; }
        public Node getPrev() { return prev; }
    }

    private Node head;
    private Node tail;
    private int size;

    public TransactionLinkedList() {
        this.head = null;
        this.tail = null;
        this.size = 0;
    }

    /**
     * Appends a new transaction to the end of the doubly linked list.
     * Time Complexity: O(1)
     */
    public void addLast(Transaction transaction) {
        Node newNode = new Node(transaction);
        if (head == null) {
            head = newNode;
            tail = newNode;
        } else {
            tail.next = newNode;
            newNode.prev = tail;
            tail = newNode;
        }
        size++;
    }

    /**
     * Retrieves all transactions as a list (Chronological order).
     * Time Complexity: O(N)
     */
    public List<Transaction> getAllTransactions() {
        List<Transaction> list = new ArrayList<>();
        Node current = head;
        while (current != null) {
            list.add(current.data);
            current = current.next;
        }
        return list;
    }

    /**
     * Retrieves transactions in Reverse Chronological order (Most recent first).
     * Time Complexity: O(N)
     */
    public List<Transaction> getReverseTransactions() {
        List<Transaction> list = new ArrayList<>();
        Node current = tail;
        while (current != null) {
            list.add(current.data);
            current = current.prev;
        }
        return list;
    }

    public Node getHead() { return head; }
    public Node getTail() { return tail; }
    public int getSize() { return size; }
    public boolean isEmpty() { return size == 0; }
}
