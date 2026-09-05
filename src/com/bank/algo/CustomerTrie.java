package com.bank.algo;

import java.util.*;

public class CustomerTrie {
    private static class TrieNode {
        Map<Character, TrieNode> children = new HashMap<>();
        boolean isEndOfWord = false;
        String fullName = null;
    }

    private final TrieNode root;

    public CustomerTrie() {
        this.root = new TrieNode();
    }

    public void insert(String name) {
        if (name == null || name.trim().isEmpty()) return;
        TrieNode curr = root;
        String cleanName = name.trim();
        for (char ch : cleanName.toLowerCase().toCharArray()) {
            curr.children.putIfAbsent(ch, new TrieNode());
            curr = curr.children.get(ch);
        }
        curr.isEndOfWord = true;
        curr.fullName = cleanName;
    }

    public List<String> autocomplete(String prefix) {
        if (prefix == null || prefix.trim().isEmpty()) return Collections.emptyList();
        TrieNode curr = root;
        for (char ch : prefix.trim().toLowerCase().toCharArray()) {
            if (!curr.children.containsKey(ch)) {
                return Collections.emptyList();
            }
            curr = curr.children.get(ch);
        }

        List<String> results = new ArrayList<>();
        collectWords(curr, results);
        return results;
    }

    private void collectWords(TrieNode node, List<String> results) {
        if (node == null) return;
        if (node.isEndOfWord && node.fullName != null) {
            results.add(node.fullName);
        }
        for (TrieNode child : node.children.values()) {
            collectWords(child, results);
        }
    }
}
