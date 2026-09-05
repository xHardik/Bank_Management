package com.bank.ds;

import com.bank.model.LoanApplication;
import java.util.ArrayList;
import java.util.List;

public class LoanPriorityQueue {
    private List<LoanApplication> heap;

    public LoanPriorityQueue() {
        this.heap = new ArrayList<>();
    }

    public void insert(LoanApplication app) {
        heap.add(app);
        heapifyUp(heap.size() - 1);
    }

    public LoanApplication extractMax() {
        if (heap.isEmpty()) return null;
        LoanApplication max = heap.get(0);
        LoanApplication last = heap.remove(heap.size() - 1);
        if (!heap.isEmpty()) {
            heap.set(0, last);
            heapifyDown(0);
        }
        return max;
    }

    private void heapifyUp(int i) {
        while (i > 0) {
            int parent = (i - 1) / 2;
            if (heap.get(i).compareTo(heap.get(parent)) < 0) {
                swap(i, parent);
                i = parent;
            } else {
                break;
            }
        }
    }

    private void heapifyDown(int i) {
        int size = heap.size();
        while (i < size) {
            int left = 2 * i + 1;
            int right = 2 * i + 2;
            int largest = i;

            if (left < size && heap.get(left).compareTo(heap.get(largest)) < 0) {
                largest = left;
            }
            if (right < size && heap.get(right).compareTo(heap.get(largest)) < 0) {
                largest = right;
            }

            if (largest != i) {
                swap(i, largest);
                i = largest;
            } else {
                break;
            }
        }
    }

    private void swap(int i, int j) {
        LoanApplication temp = heap.get(i);
        heap.set(i, heap.get(j));
        heap.set(j, temp);
    }

    public List<LoanApplication> getAllApplications() {
        return new ArrayList<>(heap);
    }

    public boolean isEmpty() {
        return heap.isEmpty();
    }

    public int size() {
        return heap.size();
    }
}
