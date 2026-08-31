package com.bank.ds;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * Custom Priority Queue (Max-Heap) for prioritizing VIP requests / high-value operations.
 * Operations: Insert O(log N), Extract-Max O(log N).
 */
public class PriorityServiceQueue {

    public static class ServiceRequest implements Comparable<ServiceRequest> {
        private final String requestId;
        private final String customerName;
        private final String requestType; // e.g. "LOAN_APPROVAL", "VIP_DEPOSIT", "WIRE_TRANSFER"
        private final int priorityScore; // Higher score = higher priority

        public ServiceRequest(String requestId, String customerName, String requestType, int priorityScore) {
            this.requestId = requestId;
            this.customerName = customerName;
            this.requestType = requestType;
            this.priorityScore = priorityScore;
        }

        public String getRequestId() { return requestId; }
        public String getCustomerName() { return customerName; }
        public String getRequestType() { return requestType; }
        public int getPriorityScore() { return priorityScore; }

        @Override
        public int compareTo(ServiceRequest other) {
            return Integer.compare(other.priorityScore, this.priorityScore); // High score first
        }

        @Override
        public String toString() {
            return String.format("[Priority %d] ID: %s | %s - %s", priorityScore, requestId, customerName, requestType);
        }
    }

    private final List<ServiceRequest> heap;

    public PriorityServiceQueue() {
        this.heap = new ArrayList<>();
    }

    public void insert(ServiceRequest request) {
        heap.add(request);
        heapifyUp(heap.size() - 1);
    }

    public ServiceRequest extractMax() {
        if (isEmpty()) {
            throw new NoSuchElementException("Priority Queue is empty.");
        }
        ServiceRequest maxItem = heap.get(0);
        ServiceRequest lastItem = heap.remove(heap.size() - 1);
        if (!isEmpty()) {
            heap.set(0, lastItem);
            heapifyDown(0);
        }
        return maxItem;
    }

    public ServiceRequest peekMax() {
        if (isEmpty()) {
            throw new NoSuchElementException("Priority Queue is empty.");
        }
        return heap.get(0);
    }

    private void heapifyUp(int index) {
        while (index > 0) {
            int parentIndex = (index - 1) / 2;
            if (heap.get(index).getPriorityScore() > heap.get(parentIndex).getPriorityScore()) {
                swap(index, parentIndex);
                index = parentIndex;
            } else {
                break;
            }
        }
    }

    private void heapifyDown(int index) {
        int size = heap.size();
        while (index < size) {
            int leftChild = 2 * index + 1;
            int rightChild = 2 * index + 2;
            int largest = index;

            if (leftChild < size && heap.get(leftChild).getPriorityScore() > heap.get(largest).getPriorityScore()) {
                largest = leftChild;
            }
            if (rightChild < size && heap.get(rightChild).getPriorityScore() > heap.get(largest).getPriorityScore()) {
                largest = rightChild;
            }

            if (largest != index) {
                swap(index, largest);
                index = largest;
            } else {
                break;
            }
        }
    }

    private void swap(int i, int j) {
        ServiceRequest temp = heap.get(i);
        heap.set(i, heap.get(j));
        heap.set(j, temp);
    }

    public boolean isEmpty() {
        return heap.isEmpty();
    }

    public int getSize() {
        return heap.size();
    }

    public List<ServiceRequest> getAllRequests() {
        return new ArrayList<>(heap);
    }
}
