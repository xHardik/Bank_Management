package com.bank.ds;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * Custom FIFO Queue implementation using a Linked Node structure for bank teller customer servicing.
 * Time Complexity: Enqueue O(1), Dequeue O(1).
 */
public class TellerQueue<T> {

    private static class Node<T> {
        private final T data;
        private Node<T> next;

        public Node(T data) {
            this.data = data;
            this.next = null;
        }
    }

    private Node<T> front;
    private Node<T> rear;
    private int size;

    public TellerQueue() {
        this.front = null;
        this.rear = null;
        this.size = 0;
    }

    /**
     * Enqueues a customer request to the end of the queue.
     */
    public void enqueue(T item) {
        Node<T> newNode = new Node<>(item);
        if (isEmpty()) {
            front = newNode;
            rear = newNode;
        } else {
            rear.next = newNode;
            rear = newNode;
        }
        size++;
    }

    /**
     * Dequeues and returns the customer request at the front of the queue.
     */
    public T dequeue() {
        if (isEmpty()) {
            throw new NoSuchElementException("Teller Queue is currently empty.");
        }
        T item = front.data;
        front = front.next;
        if (front == null) {
            rear = null;
        }
        size--;
        return item;
    }

    public T peek() {
        if (isEmpty()) {
            throw new NoSuchElementException("Teller Queue is currently empty.");
        }
        return front.data;
    }

    public List<T> getAllItems() {
        List<T> list = new ArrayList<>();
        Node<T> current = front;
        while (current != null) {
            list.add(current.data);
            current = current.next;
        }
        return list;
    }

    public boolean isEmpty() {
        return size == 0;
    }

    public int getSize() {
        return size;
    }
}
