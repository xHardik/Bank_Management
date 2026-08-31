package com.bank.ds;

import java.util.ArrayList;
import java.util.List;

/**
 * Custom Circular Queue with fixed array capacity for system audit logs.
 * Automatically overwrites oldest log entries when capacity is full.
 */
public class CircularLogQueue {

    private final String[] logBuffer;
    private int front;
    private int rear;
    private int count;
    private final int capacity;

    public CircularLogQueue(int capacity) {
        this.capacity = capacity;
        this.logBuffer = new String[capacity];
        this.front = 0;
        this.rear = -1;
        this.count = 0;
    }

    public synchronized void addLog(String logMessage) {
        rear = (rear + 1) % capacity;
        logBuffer[rear] = logMessage;
        if (count < capacity) {
            count++;
        } else {
            // Buffer full, advance front pointer
            front = (front + 1) % capacity;
        }
    }

    public synchronized List<String> getRecentLogs() {
        List<String> logs = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            int index = (front + i) % capacity;
            logs.add(logBuffer[index]);
        }
        return logs;
    }

    public int getCount() { return count; }
    public int getCapacity() { return capacity; }
}
