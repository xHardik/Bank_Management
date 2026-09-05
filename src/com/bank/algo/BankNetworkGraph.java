package com.bank.algo;

import java.util.*;

public class BankNetworkGraph {
    private Map<String, List<String>> adjList;

    public BankNetworkGraph() {
        this.adjList = new HashMap<>();
    }

    public void addTransactionEdge(String sourceAcc, String targetAcc) {
        adjList.putIfAbsent(sourceAcc, new ArrayList<>());
        adjList.putIfAbsent(targetAcc, new ArrayList<>());
        adjList.get(sourceAcc).add(targetAcc);
    }

    // BFS Shortest Path Routing between Bank Accounts
    public List<String> findShortestRoutingPath(String src, String target) {
        if (!adjList.containsKey(src) || !adjList.containsKey(target)) {
            return Collections.emptyList();
        }

        Queue<String> queue = new LinkedList<>();
        Map<String, String> parentMap = new HashMap<>();
        Set<String> visited = new HashSet<>();

        queue.add(src);
        visited.add(src);

        boolean found = false;
        while (!queue.isEmpty()) {
            String curr = queue.poll();
            if (curr.equals(target)) {
                found = true;
                break;
            }

            for (String neighbor : adjList.getOrDefault(curr, Collections.emptyList())) {
                if (!visited.contains(neighbor)) {
                    visited.add(neighbor);
                    parentMap.put(neighbor, curr);
                    queue.add(neighbor);
                }
            }
        }

        if (!found) return Collections.emptyList();

        List<String> path = new ArrayList<>();
        String curr = target;
        while (curr != null) {
            path.add(curr);
            curr = parentMap.get(curr);
        }
        Collections.reverse(path);
        return path;
    }

    // DFS Cycle Detection for Money Laundering / Rapid Circular Transfer Ring Detection
    public boolean detectCircularFraudLoop(String startAcc) {
        Set<String> visited = new HashSet<>();
        Set<String> recStack = new HashSet<>();
        return dfsCycleCheck(startAcc, visited, recStack);
    }

    private boolean dfsCycleCheck(String node, Set<String> visited, Set<String> recStack) {
        visited.add(node);
        recStack.add(node);

        for (String neighbor : adjList.getOrDefault(node, Collections.emptyList())) {
            if (!visited.contains(neighbor)) {
                if (dfsCycleCheck(neighbor, visited, recStack)) return true;
            } else if (recStack.contains(neighbor)) {
                return true; // Circular transaction loop detected!
            }
        }

        recStack.remove(node);
        return false;
    }

    public Map<String, List<String>> getGraphRepresentation() {
        return adjList;
    }
}
