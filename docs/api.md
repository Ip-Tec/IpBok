# Ipbok API Documentation

This document provides a comprehensive overview of the available API endpoints for the Ipbok platform.

## Base URL
The API is accessible at `/api`.

---

## 1. Authentication

### **Registration**
- **Endpoint**: `POST /api/auth/register`
- **Description**: Registers a new user (OWNER or AGENT). Owners automatically create a business.
- **Request Body**:
    ```json
    {
      "name": "Full Name",
      "email": "user@example.com",
      "password": "securepassword",
      "role": "OWNER" // or "AGENT"
    }
    ```
- **Responses**:
    - `201 Created`: Registration successful. Verification email sent.
    - `400 Bad Request`: Missing fields or user already exists.
    - `503 Service Unavailable`: Database connectivity issues.

### **Email Verification**
- **Endpoint**: `GET /api/auth/verify?token=YOUR_TOKEN`
- **Description**: Verifies a user's email address using the token sent during registration.
- **Query Parameters**:
    - `token`: The UUID token from the email.

---

## 2. Transactions

### **Fetch Transactions**
- **Endpoint**: `GET /api/transactions`
- **Description**: Retrieves a paginated list of transactions for a specific business.
- **Query Parameters**:
    - `businessId` (Required): ID of the business.
    - `page` (Optional): Default `1`.
    - `limit` (Optional): Default `10`.
    - `searchQuery` (Optional): Filter by agent name or email.
    - `status` (Optional): Filter by transaction status.
    - `type` (Optional): Filter by transaction type (Deposit, Withdrawal, etc.).
- **Response**:
    ```json
    {
      "transactions": [...],
      "totalPages": 5
    }
    ```

### **Create Transaction**
- **Endpoint**: `POST /api/transactions`
- **Description**: Records a new transaction. Used by both Owners and Agents.
- **Request Body**:
    ```json
    {
      "type": "Deposit",
      "amount": 5000,
      "paymentMethod": "CASH", // CASH, ATM_CARD, BANK_TRANSFER, etc.
      "businessId": "BUSINESS_ID",
      "userId": "AGENT_ID",
      "date": "2026-01-01T10:00:00Z",
      "description": "Optional note"
    }
    ```
- **Auth**: Requires an active session (Owner or Agent).

---

## 3. Business Management

### **Fetch Business Details**
- **Endpoint**: `GET /api/business/[businessId]`
- **Description**: Returns details for a specific business.
- **Auth**: Requires OWNER role for that business.

### **Update Business**
- **Endpoint**: `PUT /api/business/[businessId]`
- **Description**: Updates business information (name, address, phone).
- **Request Body**:
    ```json
    {
      "name": "New Name",
      "address": "123 Street",
      "phone": "08012345678"
    }
    ```

---

## 4. Agents & Summary

### **Agent Summary**
- **Endpoint**: `GET /api/agents/[agentId]/summary`
- **Description**: Provides a daily summary for an agent, including totals collected and balance.
- **Response**:
    ```json
    {
      "todayTotalCollected": 5000,
      "cashCollectedToday": 2000,
      "bankCollectedToday": 3000,
      "pendingReconciliationStatus": "Pending",
      "currentCashBalance": 15000,
      "currentBankBalance": 25000
    }
    ```

---

## 5. Reports

### **Financial Reports**
- **Endpoint**: `GET /api/reports`
- **Description**: Generates high-level financial data for the owner dashboard.
- **Query Parameters**:
    - `startDate`, `endDate` (Optional): Filter by date range.
- **Response**:
    ```json
    {
      "totalRevenue": 150000,
      "totalTransactions": 120,
      "activeAgents": 4,
      "averageTransaction": 1250,
      "agentPerformance": [...],
      "revenueOverTime": [...]
    }
    ```

---

## 6. Payments (Paystack)

### **Initialize Payment**
- **Endpoint**: `POST /api/payment/paystack/initialize`
- **Description**: Starts a Paystack transaction for subscription or other payments.

### **Webhook**
- **Endpoint**: `POST /api/payment/paystack/webhook`
- **Description**: Listener for Paystack events to update transaction statuses.

---

## Error Handling
The API uses standard HTTP status codes:
- `200 OK`, `201 Created`
- `400 Bad Request`: Input validation failed.
- `401 Unauthorized`: Authentication required.
- `403 Forbidden`: Insufficient permissions.
- `404 Not Found`: Resource doesn't exist.
- `500 Internal Server Error`: Unexpected server issue.
