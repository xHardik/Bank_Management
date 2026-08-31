package com.bank.ds;

import com.bank.model.Transaction;
import java.util.EmptyStackException;

/**
 * Custom Stack Implementation (LIFO) for Transaction Undo & Rollback functionality.
 * Time Complexity: Push O(1), Pop O(1), Peek O(1).
 */
public class TransactionStack {

    private static class Node {
        private final Transaction transaction;
        private final Node next;

        public Node(Transaction transaction, Node next) {
            this.transaction = transaction;
            this.next = next;
        }
    }

    private Node top;
    private int size;

    public TransactionStack() {
        this.top = null;
        this.size = 0;
    }

    /**
     * Pushes a transaction onto the undo stack.
     */
    public void push(Transaction transaction) {
        top = new Node(transaction, top);
        size++;
    }

    /**
     * Pops and returns the most recent transaction from the stack.
     */
    public Transaction pop() {
        if (isEmpty()) {
            throw new EmptyStackException();
        }
        Transaction item = top.transaction;
        top = top.next;
        size--;
        return item;
    }

    /**
     * Peeks at the top transaction without removing it.
     */
    public Transaction peek() {
        if (isEmpty()) {
            throw new EmptyStackException();
        }
        return top.transaction;
    }

    public boolean isEmpty() {
        return top == null;
    }

    public int getSize() {
        return size;
    }
}
