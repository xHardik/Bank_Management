package com.bank.server;

import com.bank.model.Account;
import com.bank.model.LoanApplication;
import com.bank.model.Transaction;
import com.bank.ds.PriorityServiceQueue;
import com.bank.service.BankService;
import com.bank.test.TestRunner;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Embedded HTTP REST Server using native JDK com.sun.net.httpserver.HttpServer.
 * Provides zero-dependency REST APIs and serves static HTML/CSS/JS frontend files.
 */
public class BankHttpServer {

    private final int port;
    private final BankService bankService;
    private HttpServer server;

    public BankHttpServer(int port, BankService bankService) {
        this.port = port;
        this.bankService = bankService;
    }

    public void start() throws IOException {
        server = HttpServer.create(new InetSocketAddress(port), 0);

        // API Handler
        server.createContext("/api", new ApiHandler(bankService));
        // Static Web Files Handler
        server.createContext("/", new StaticFileHandler());

        server.setExecutor(null); // default executor
        server.start();
        System.out.println("=================================================");
        System.out.println(" Banking Web Application Server Started!");
        System.out.println(" Web UI URL: http://localhost:" + port);
        System.out.println(" REST API Base: http://localhost:" + port + "/api");
        System.out.println("=================================================");
    }

    public void stop() {
        if (server != null) {
            server.stop(0);
        }
    }

    public static void sendHttpResponse(HttpExchange exchange, int statusCode, String contentType, String response) throws IOException {
        byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", contentType);
        exchange.sendResponseHeaders(statusCode, bytes.length);
        OutputStream os = exchange.getResponseBody();
        os.write(bytes);
        os.close();
    }

    // Static File Handler
    static class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath();
            if (path.equals("/")) {
                path = "/index.html";
            }

            File file = new File("web" + path);
            if (!file.exists() || file.isDirectory()) {
                sendHttpResponse(exchange, 404, "text/plain", "404 Not Found");
                return;
            }

            String contentType = getContentType(path);
            byte[] bytes = Files.readAllBytes(file.toPath());
            exchange.getResponseHeaders().set("Content-Type", contentType);
            exchange.sendResponseHeaders(200, bytes.length);
            OutputStream os = exchange.getResponseBody();
            os.write(bytes);
            os.close();
        }

        private String getContentType(String path) {
            if (path.endsWith(".html")) return "text/html";
            if (path.endsWith(".css")) return "text/css";
            if (path.endsWith(".js")) return "application/javascript";
            if (path.endsWith(".json")) return "application/json";
            if (path.endsWith(".png")) return "image/png";
            return "text/plain";
        }
    }

    // API Handler
    static class ApiHandler implements HttpHandler {
        private final BankService bankService;

        public ApiHandler(BankService bankService) {
            this.bankService = bankService;
        }

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            // Enable CORS
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            String method = exchange.getRequestMethod();
            String path = exchange.getRequestURI().getPath();

            try {
                if ("GET".equalsIgnoreCase(method) && "/api/accounts".equals(path)) {
                    handleGetAccounts(exchange);
                } else if ("POST".equalsIgnoreCase(method) && "/api/accounts/create".equals(path)) {
                    handleCreateAccount(exchange);
                } else if ("POST".equalsIgnoreCase(method) && "/api/deposit".equals(path)) {
                    handleDeposit(exchange);
                } else if ("POST".equalsIgnoreCase(method) && "/api/withdraw".equals(path)) {
                    handleWithdraw(exchange);
                } else if ("POST".equalsIgnoreCase(method) && "/api/transfer".equals(path)) {
                    handleTransfer(exchange);
                } else if ("POST".equalsIgnoreCase(method) && "/api/undo".equals(path)) {
                    handleUndo(exchange);
                } else if ("GET".equalsIgnoreCase(method) && "/api/transactions".equals(path)) {
                    handleGetTransactions(exchange);
                } else if ("GET".equalsIgnoreCase(method) && path.startsWith("/api/sorted-accounts")) {
                    handleSortedAccounts(exchange);
                } else if ("GET".equalsIgnoreCase(method) && path.startsWith("/api/search")) {
                    handleSearch(exchange);
                } else if ("GET".equalsIgnoreCase(method) && path.startsWith("/api/autocomplete")) {
                    handleAutocomplete(exchange);
                } else if ("POST".equalsIgnoreCase(method) && "/api/loans/apply".equals(path)) {
                    handleApplyLoan(exchange);
                } else if ("POST".equalsIgnoreCase(method) && "/api/loans/approve".equals(path)) {
                    handleApproveLoan(exchange);
                } else if ("GET".equalsIgnoreCase(method) && "/api/loans/pending".equals(path)) {
                    handleGetLoans(exchange);
                } else if ("GET".equalsIgnoreCase(method) && path.startsWith("/api/fraud/check")) {
                    handleFraudCheck(exchange);
                } else if ("POST".equalsIgnoreCase(method) && "/api/teller/enqueue".equals(path)) {
                    handleTellerEnqueue(exchange);
                } else if ("POST".equalsIgnoreCase(method) && "/api/teller/dequeue".equals(path)) {
                    handleTellerDequeue(exchange);
                } else if ("POST".equalsIgnoreCase(method) && "/api/vip/enqueue".equals(path)) {
                    handleVipEnqueue(exchange);
                } else if ("POST".equalsIgnoreCase(method) && "/api/vip/dequeue".equals(path)) {
                    handleVipDequeue(exchange);
                } else if ("GET".equalsIgnoreCase(method) && "/api/audit-logs".equals(path)) {
                    handleGetLogs(exchange);
                } else if ("GET".equalsIgnoreCase(method) && "/api/tests/run".equals(path)) {
                    handleRunTests(exchange);
                } else {
                    sendHttpResponse(exchange, 404, "application/json", "{\"error\": \"Endpoint not found\"}");
                }
            } catch (Exception e) {
                sendHttpResponse(exchange, 500, "application/json", "{\"error\": \"" + escapeJson(e.getMessage()) + "\"}");
            }
        }

        private void handleGetAccounts(HttpExchange exchange) throws IOException {
            List<Account> accounts = bankService.getAllAccounts();
            StringBuilder json = new StringBuilder("[");
            for (int i = 0; i < accounts.size(); i++) {
                Account a = accounts.get(i);
                json.append(String.format("{\"accountNumber\":\"%s\",\"holderName\":\"%s\",\"type\":\"%s\",\"balance\":%.2f,\"customerId\":\"%s\"}",
                        a.getAccountNumber(), escapeJson(a.getHolderName()), a.getAccountType(), a.getBalance(), a.getCustomerId()));
                if (i < accounts.size() - 1) json.append(",");
            }
            json.append("]");
            sendHttpResponse(exchange, 200, "application/json", json.toString());
        }

        private void handleCreateAccount(HttpExchange exchange) throws IOException {
            Map<String, String> body = parseJsonBody(exchange);
            try {
                String type = body.getOrDefault("type", "SAVINGS");
                String name = body.getOrDefault("name", "Unknown");
                String email = body.getOrDefault("email", "");
                String phone = body.getOrDefault("phone", "");
                double initialBalance = Double.parseDouble(body.getOrDefault("initialBalance", "0"));
                String pin = body.getOrDefault("pin", "1234");
                String extra = body.getOrDefault("extra", "");

                Account acc = bankService.createAccount(type, name, email, phone, initialBalance, pin, extra);
                String resp = String.format("{\"success\":true,\"accountNumber\":\"%s\",\"balance\":%.2f}", acc.getAccountNumber(), acc.getBalance());
                sendHttpResponse(exchange, 200, "application/json", resp);
            } catch (Exception e) {
                sendHttpResponse(exchange, 400, "application/json", "{\"success\":false,\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
            }
        }

        private void handleDeposit(HttpExchange exchange) throws IOException {
            Map<String, String> body = parseJsonBody(exchange);
            try {
                String accNum = body.get("accountNumber");
                double amount = Double.parseDouble(body.get("amount"));
                String pin = body.get("pin");
                String remarks = body.getOrDefault("remarks", "Deposit");

                Transaction tx = bankService.deposit(accNum, amount, pin, remarks);
                String resp = String.format("{\"success\":true,\"txId\":\"%s\",\"newBalance\":%.2f}", tx.getTransactionId(), tx.getBalanceAfter());
                sendHttpResponse(exchange, 200, "application/json", resp);
            } catch (Exception e) {
                sendHttpResponse(exchange, 400, "application/json", "{\"success\":false,\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
            }
        }

        private void handleWithdraw(HttpExchange exchange) throws IOException {
            Map<String, String> body = parseJsonBody(exchange);
            try {
                String accNum = body.get("accountNumber");
                double amount = Double.parseDouble(body.get("amount"));
                String pin = body.get("pin");
                String remarks = body.getOrDefault("remarks", "Withdrawal");

                Transaction tx = bankService.withdraw(accNum, amount, pin, remarks);
                String resp = String.format("{\"success\":true,\"txId\":\"%s\",\"newBalance\":%.2f}", tx.getTransactionId(), tx.getBalanceAfter());
                sendHttpResponse(exchange, 200, "application/json", resp);
            } catch (Exception e) {
                sendHttpResponse(exchange, 400, "application/json", "{\"success\":false,\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
            }
        }

        private void handleTransfer(HttpExchange exchange) throws IOException {
            Map<String, String> body = parseJsonBody(exchange);
            try {
                String src = body.get("sourceAccount");
                String tgt = body.get("targetAccount");
                double amount = Double.parseDouble(body.get("amount"));
                String pin = body.get("pin");
                String remarks = body.getOrDefault("remarks", "Transfer");

                Transaction tx = bankService.transfer(src, tgt, amount, pin, remarks);
                String resp = String.format("{\"success\":true,\"txId\":\"%s\",\"sourceBalance\":%.2f}", tx.getTransactionId(), tx.getBalanceAfter());
                sendHttpResponse(exchange, 200, "application/json", resp);
            } catch (Exception e) {
                sendHttpResponse(exchange, 400, "application/json", "{\"success\":false,\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
            }
        }

        private void handleUndo(HttpExchange exchange) throws IOException {
            try {
                boolean ok = bankService.undoLastTransaction();
                if (ok) {
                    sendHttpResponse(exchange, 200, "application/json", "{\"success\":true,\"message\":\"Most recent transaction rolled back successfully.\"}");
                } else {
                    sendHttpResponse(exchange, 400, "application/json", "{\"success\":false,\"error\":\"Nothing to undo.\"}");
                }
            } catch (Exception e) {
                sendHttpResponse(exchange, 400, "application/json", "{\"success\":false,\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
            }
        }

        private void handleGetTransactions(HttpExchange exchange) throws IOException {
            List<Transaction> txs = bankService.getMasterTransactions();
            StringBuilder json = new StringBuilder("[");
            for (int i = 0; i < txs.size(); i++) {
                Transaction t = txs.get(i);
                json.append(String.format("{\"txId\":\"%s\",\"timestamp\":\"%s\",\"accNum\":\"%s\",\"type\":\"%s\",\"amount\":%.2f,\"balanceAfter\":%.2f,\"targetAcc\":\"%s\",\"remarks\":\"%s\"}",
                        t.getTransactionId(), t.getTimestamp(), t.getAccountNumber(), t.getType(), t.getAmount(), t.getBalanceAfter(),
                        t.getTargetAccountNumber() != null ? t.getTargetAccountNumber() : "N/A", escapeJson(t.getRemarks())));
                if (i < txs.size() - 1) json.append(",");
            }
            json.append("]");
            sendHttpResponse(exchange, 200, "application/json", json.toString());
        }

        private void handleSortedAccounts(HttpExchange exchange) throws IOException {
            String query = exchange.getRequestURI().getQuery();
            String sortBy = "balance_desc";
            if (query != null && query.contains("sort=")) {
                sortBy = query.split("sort=")[1].split("&")[0];
            }

            List<Account> accounts = bankService.getAllAccountsSorted(sortBy);
            StringBuilder json = new StringBuilder("[");
            for (int i = 0; i < accounts.size(); i++) {
                Account a = accounts.get(i);
                json.append(String.format("{\"accountNumber\":\"%s\",\"holderName\":\"%s\",\"type\":\"%s\",\"balance\":%.2f,\"customerId\":\"%s\"}",
                        a.getAccountNumber(), escapeJson(a.getHolderName()), a.getAccountType(), a.getBalance(), a.getCustomerId()));
                if (i < accounts.size() - 1) json.append(",");
            }
            json.append("]");
            sendHttpResponse(exchange, 200, "application/json", json.toString());
        }

        private void handleSearch(HttpExchange exchange) throws IOException {
            String query = exchange.getRequestURI().getQuery();
            String q = "";
            if (query != null && query.contains("q=")) {
                q = java.net.URLDecoder.decode(query.split("q=")[1].split("&")[0], StandardCharsets.UTF_8);
            }

            List<Account> results = bankService.searchAccounts(q);
            StringBuilder json = new StringBuilder("[");
            for (int i = 0; i < results.size(); i++) {
                Account a = results.get(i);
                json.append(String.format("{\"accountNumber\":\"%s\",\"holderName\":\"%s\",\"type\":\"%s\",\"balance\":%.2f,\"customerId\":\"%s\"}",
                        a.getAccountNumber(), escapeJson(a.getHolderName()), a.getAccountType(), a.getBalance(), a.getCustomerId()));
                if (i < results.size() - 1) json.append(",");
            }
            json.append("]");
            sendHttpResponse(exchange, 200, "application/json", json.toString());
        }

        private void handleAutocomplete(HttpExchange exchange) throws IOException {
            String query = exchange.getRequestURI().getQuery();
            String q = "";
            if (query != null && query.contains("q=")) {
                q = java.net.URLDecoder.decode(query.split("q=")[1].split("&")[0], StandardCharsets.UTF_8);
            }
            List<String> names = bankService.autocompleteCustomerNames(q);
            StringBuilder json = new StringBuilder("[");
            for (int i = 0; i < names.size(); i++) {
                json.append("\"").append(escapeJson(names.get(i))).append("\"");
                if (i < names.size() - 1) json.append(",");
            }
            json.append("]");
            sendHttpResponse(exchange, 200, "application/json", json.toString());
        }

        private void handleApplyLoan(HttpExchange exchange) throws IOException {
            Map<String, String> body = parseJsonBody(exchange);
            String name = body.get("name");
            String accNum = body.get("accountNumber");
            String type = body.get("loanType");
            double amount = Double.parseDouble(body.get("amount"));

            LoanApplication app = bankService.applyForLoan(name, accNum, type, amount);
            sendHttpResponse(exchange, 200, "application/json", String.format("{\"success\":true,\"applicationId\":\"%s\",\"priority\":%d}", app.getApplicationId(), app.getPriorityScore()));
        }

        private void handleApproveLoan(HttpExchange exchange) throws IOException {
            LoanApplication app = bankService.approveHighestPriorityLoan();
            if (app != null) {
                sendHttpResponse(exchange, 200, "application/json", String.format("{\"success\":true,\"applicationId\":\"%s\",\"name\":\"%s\",\"amount\":%.2f}", app.getApplicationId(), escapeJson(app.getCustomerName()), app.getAmount()));
            } else {
                sendHttpResponse(exchange, 200, "application/json", "{\"success\":false,\"message\":\"No loan applications pending.\"}");
            }
        }

        private void handleGetLoans(HttpExchange exchange) throws IOException {
            List<LoanApplication> loans = bankService.getPendingLoans();
            StringBuilder json = new StringBuilder("[");
            for (int i = 0; i < loans.size(); i++) {
                LoanApplication l = loans.get(i);
                json.append(String.format("{\"appId\":\"%s\",\"name\":\"%s\",\"accNum\":\"%s\",\"type\":\"%s\",\"amount\":%.2f,\"priority\":%d,\"status\":\"%s\"}",
                        l.getApplicationId(), escapeJson(l.getCustomerName()), l.getAccountNumber(), l.getLoanType(), l.getAmount(), l.getPriorityScore(), l.getStatus()));
                if (i < loans.size() - 1) json.append(",");
            }
            json.append("]");
            sendHttpResponse(exchange, 200, "application/json", json.toString());
        }

        private void handleFraudCheck(HttpExchange exchange) throws IOException {
            String query = exchange.getRequestURI().getQuery();
            String acc = "ACC1001";
            if (query != null && query.contains("acc=")) {
                acc = query.split("acc=")[1].split("&")[0];
            }
            boolean isFraud = bankService.checkCircularFraud(acc);
            sendHttpResponse(exchange, 200, "application/json", String.format("{\"accountNumber\":\"%s\",\"circularFraudDetected\":%b}", acc, isFraud));
        }

        private void handleTellerEnqueue(HttpExchange exchange) throws IOException {
            Map<String, String> body = parseJsonBody(exchange);
            String req = body.getOrDefault("request", "General Inquiry");
            bankService.enqueueTellerRequest(req);
            sendHttpResponse(exchange, 200, "application/json", "{\"success\":true,\"message\":\"Inquiry enqueued to Teller Queue.\"}");
        }

        private void handleTellerDequeue(HttpExchange exchange) throws IOException {
            String req = bankService.dequeueTellerRequest();
            if (req != null) {
                sendHttpResponse(exchange, 200, "application/json", "{\"success\":true,\"processed\":\"" + escapeJson(req) + "\"}");
            } else {
                sendHttpResponse(exchange, 200, "application/json", "{\"success\":false,\"message\":\"Queue is empty.\"}");
            }
        }

        private void handleVipEnqueue(HttpExchange exchange) throws IOException {
            Map<String, String> body = parseJsonBody(exchange);
            String name = body.getOrDefault("name", "VIP Client");
            String type = body.getOrDefault("type", "Wealth Management");
            int prio = Integer.parseInt(body.getOrDefault("priority", "5"));

            bankService.enqueueVipRequest(name, type, prio);
            sendHttpResponse(exchange, 200, "application/json", "{\"success\":true,\"message\":\"VIP Client enqueued to Priority Queue.\"}");
        }

        private void handleVipDequeue(HttpExchange exchange) throws IOException {
            PriorityServiceQueue.ServiceRequest req = bankService.dequeueVipRequest();
            if (req != null) {
                String json = String.format("{\"success\":true,\"requestId\":\"%s\",\"name\":\"%s\",\"type\":\"%s\",\"priority\":%d}",
                        req.getRequestId(), escapeJson(req.getCustomerName()), req.getRequestType(), req.getPriorityScore());
                sendHttpResponse(exchange, 200, "application/json", json);
            } else {
                sendHttpResponse(exchange, 200, "application/json", "{\"success\":false,\"message\":\"VIP Queue is empty.\"}");
            }
        }

        private void handleGetLogs(HttpExchange exchange) throws IOException {
            List<String> logs = bankService.getAuditLogs();
            StringBuilder json = new StringBuilder("[");
            for (int i = 0; i < logs.size(); i++) {
                json.append("\"").append(escapeJson(logs.get(i))).append("\"");
                if (i < logs.size() - 1) json.append(",");
            }
            json.append("]");
            sendHttpResponse(exchange, 200, "application/json", json.toString());
        }

        private void handleRunTests(HttpExchange exchange) throws IOException {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PrintStream ps = new PrintStream(baos);
            TestRunner.runAllTests(ps);
            String log = baos.toString(StandardCharsets.UTF_8);
            sendHttpResponse(exchange, 200, "application/json", "{\"log\":\"" + escapeJson(log) + "\"}");
        }

        private Map<String, String> parseJsonBody(HttpExchange exchange) throws IOException {
            InputStream is = exchange.getRequestBody();
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            byte[] buf = new byte[1024];
            int len;
            while ((len = is.read(buf)) != -1) {
                baos.write(buf, 0, len);
            }
            String bodyStr = baos.toString(StandardCharsets.UTF_8).trim();

            Map<String, String> map = new HashMap<>();
            if (bodyStr.startsWith("{") && bodyStr.endsWith("}")) {
                bodyStr = bodyStr.substring(1, bodyStr.length() - 1);
                String[] pairs = bodyStr.split(",");
                for (String pair : pairs) {
                    String[] kv = pair.split(":", 2);
                    if (kv.length == 2) {
                        String key = kv[0].trim().replaceAll("^\"|\"$", "");
                        String val = kv[1].trim().replaceAll("^\"|\"$", "");
                        map.put(key, val);
                    }
                }
            }
            return map;
        }

        private String escapeJson(String raw) {
            if (raw == null) return "";
            return raw.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
        }
    }
}
