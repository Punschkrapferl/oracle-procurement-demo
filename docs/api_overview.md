# API Overview

This document gives a high-level overview of the REST API used by the Oracle Procurement Demo application.

The backend exposes versioned REST endpoints for supplier management, purchase order management, purchase order workflow actions, and purchase order status summaries.

Full interactive API documentation is available through Swagger UI when the backend is running:

```text
http://localhost:8080/swagger-ui.html
```

OpenAPI JSON is available at:

```text
http://localhost:8080/v3/api-docs
```

---

## Base URL

All backend endpoints are versioned under:

```text
/api/v1
```

Local backend URL:

```text
http://localhost:8080/api/v1
```

Frontend note:

- The Angular frontend calls `/api/v1`.
- In local frontend development, `proxy.conf.json` forwards `/api` requests to `http://localhost:8080`.
- In Docker frontend runtime, nginx proxies `/api/` requests to the backend.

---

## Main resources

The API is organized around two main business resources:

```text
suppliers
purchase-orders
```

Supplier endpoints manage supplier master data.

Purchase order endpoints manage purchase order headers, line items, workflow actions, and status summaries.

---

## Supplier endpoints

| Method   | Endpoint                 | Description                                                |
|----------|--------------------------|------------------------------------------------------------|
| `GET`    | `/api/v1/suppliers`      | List all suppliers                                         |
| `GET`    | `/api/v1/suppliers/{id}` | Get one supplier by id                                     |
| `POST`   | `/api/v1/suppliers`      | Create a supplier                                          |
| `PUT`    | `/api/v1/suppliers/{id}` | Update a supplier                                          |
| `DELETE` | `/api/v1/suppliers/{id}` | Delete a supplier only if it has no purchase order history |

---

### Create supplier

```http
POST /api/v1/suppliers
Content-Type: application/json
```

Request body:

```json
{
  "supplierCode": "SUP-1001",
  "name": "Acme Industrial Supplies",
  "contactEmail": "orders@acme-industrial.com",
  "active": true
}
```

Successful response:

```http
201 Created
```

Example response body:

```json
{
  "id": 1,
  "supplierCode": "SUP-1001",
  "name": "Acme Industrial Supplies",
  "contactEmail": "orders@acme-industrial.com",
  "active": true,
  "createdAt": "2026-04-14T12:00:00"
}
```

Validation rules:

- `supplierCode` must not be blank
- `supplierCode` must be at most 50 characters
- `name` must not be blank
- `name` must be at most 150 characters
- `contactEmail` must not be blank
- `contactEmail` must be a valid email address
- `contactEmail` must be at most 150 characters

Business rules:

- supplier code must be unique
- if `active` is missing during creation, the backend defaults it to `true`

---

### Update supplier

```http
PUT /api/v1/suppliers/{id}
Content-Type: application/json
```

Request body:

```json
{
  "supplierCode": "SUP-1001",
  "name": "Acme Industrial Supplies Europe",
  "contactEmail": "procurement@acme-industrial.com",
  "active": true
}
```

Successful response:

```http
200 OK
```

Validation rules:

- same validation as supplier creation
- `active` is required during update

Business rules:

- supplier code must remain unique
- suppliers can be deactivated even if purchase order history exists
- deactivation is the safe alternative to deleting a supplier with business history

---

### Delete supplier

```http
DELETE /api/v1/suppliers/{id}
```

Successful response:

```http
204 No Content
```

Business rule:

A supplier can only be deleted if it has no purchase order history.

If purchase order history exists, the backend returns:

```http
409 Conflict
```

Example error message:

```json
{
  "timestamp": "2026-04-14T12:00:00",
  "status": 409,
  "error": "Conflict",
  "message": "Supplier cannot be deleted because purchase order history exists for it. Deactivate the supplier instead.",
  "path": "/api/v1/suppliers/10",
  "validationErrors": null
}
```

---

## Purchase order endpoints

| Method   | Endpoint                       | Description                   |
|----------|--------------------------------|-------------------------------|
| `GET`    | `/api/v1/purchase-orders`      | List all purchase orders      |
| `GET`    | `/api/v1/purchase-orders/{id}` | Get one purchase order by id  |
| `POST`   | `/api/v1/purchase-orders`      | Create a purchase order       |
| `PUT`    | `/api/v1/purchase-orders/{id}` | Update a draft purchase order |
| `DELETE` | `/api/v1/purchase-orders/{id}` | Delete a draft purchase order |

---

### Create purchase order

```http
POST /api/v1/purchase-orders
Content-Type: application/json
```

Request body:

```json
{
  "orderNumber": "PO-2026-1001",
  "supplierId": 1,
  "requestedBy": "Punschkrapferl",
  "orderDate": "2026-04-14",
  "lines": [
    {
      "lineNumber": 1,
      "itemDescription": "Industrial safety gloves",
      "quantity": 50,
      "unitPrice": 4.90
    },
    {
      "lineNumber": 2,
      "itemDescription": "Protective safety goggles",
      "quantity": 20,
      "unitPrice": 12.50
    }
  ]
}
```

Successful response:

```http
201 Created
```

Example response body:

```json
{
  "id": 100,
  "orderNumber": "PO-2026-1001",
  "supplierId": 1,
  "supplierCode": "SUP-1001",
  "supplierName": "Acme Industrial Supplies",
  "status": "DRAFT",
  "requestedBy": "Punschkrapferl",
  "orderDate": "2026-04-14",
  "totalAmount": 495.00,
  "createdAt": "2026-04-14T10:00:00",
  "updatedAt": "2026-04-14T10:00:00",
  "cancellationReason": null,
  "cancelledAt": null,
  "lines": [
    {
      "id": 1,
      "lineNumber": 1,
      "itemDescription": "Industrial safety gloves",
      "quantity": 50,
      "unitPrice": 4.90,
      "lineTotal": 245.00
    },
    {
      "id": 2,
      "lineNumber": 2,
      "itemDescription": "Protective safety goggles",
      "quantity": 20,
      "unitPrice": 12.50,
      "lineTotal": 250.00
    }
  ]
}
```

Validation rules:

- `orderNumber` must not be blank
- `orderNumber` must be at most 50 characters
- `supplierId` must be positive
- `requestedBy` must not be blank
- `requestedBy` must be at most 100 characters
- `orderDate` is required
- at least one line item is required
- line number must be positive
- item description must not be blank
- item description must be at most 255 characters
- quantity must be positive
- unit price must be valid and non-negative

Business rules:

- purchase order number must be unique
- purchase orders can only be created for active suppliers
- duplicate line numbers are rejected
- new purchase orders start in `DRAFT` status
- total amount is calculated from the line totals

---

### Update purchase order

```http
PUT /api/v1/purchase-orders/{id}
Content-Type: application/json
```

Request body:

```json
{
  "orderNumber": "PO-2026-1001",
  "supplierId": 1,
  "requestedBy": "Punschkrapferl",
  "orderDate": "2026-04-14",
  "lines": [
    {
      "lineNumber": 1,
      "itemDescription": "Industrial safety gloves",
      "quantity": 60,
      "unitPrice": 4.90
    },
    {
      "lineNumber": 2,
      "itemDescription": "Protective safety goggles",
      "quantity": 25,
      "unitPrice": 12.50
    }
  ]
}
```

Successful response:

```http
200 OK
```

Business rules:

- only `DRAFT` purchase orders can be updated
- purchase order number must remain unique
- purchase orders can only be linked to active suppliers
- duplicate line numbers are rejected
- line items are replaced during update
- total amount is recalculated after update

---

### Delete purchase order

```http
DELETE /api/v1/purchase-orders/{id}
```

Successful response:

```http
204 No Content
```

Business rule:

Only `DRAFT` purchase orders can be deleted.

If the order is not in `DRAFT` status, the backend returns:

```http
400 Bad Request
```

Example error message:

```json
{
  "timestamp": "2026-04-14T12:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Only DRAFT purchase orders can be edited or deleted",
  "path": "/api/v1/purchase-orders/700",
  "validationErrors": null
}
```

---

## Purchase order workflow endpoints

| Method | Endpoint                               | Description                        |
|--------|----------------------------------------|------------------------------------|
| `POST` | `/api/v1/purchase-orders/{id}/submit`  | Submit a draft purchase order      |
| `POST` | `/api/v1/purchase-orders/{id}/approve` | Approve a submitted purchase order |
| `POST` | `/api/v1/purchase-orders/{id}/cancel`  | Cancel an approved purchase order  |

---

## Purchase order workflow

Valid workflow:

```text
DRAFT -> SUBMITTED -> APPROVED -> CANCELLED
```

Rules:

- only `DRAFT` purchase orders can be submitted
- only `SUBMITTED` purchase orders can be approved
- only `APPROVED` purchase orders can be cancelled
- cancelled purchase orders keep their cancellation reason and timestamp
- cancelled purchase orders remain business history

---

### Submit purchase order

```http
POST /api/v1/purchase-orders/{id}/submit
```

Successful response:

```http
200 OK
```

Result:

```json
{
  "id": 100,
  "orderNumber": "PO-2026-1001",
  "status": "SUBMITTED"
}
```

Business rule:

Only `DRAFT` purchase orders can be submitted.

---

### Approve purchase order

```http
POST /api/v1/purchase-orders/{id}/approve
```

Successful response:

```http
200 OK
```

Result:

```json
{
  "id": 100,
  "orderNumber": "PO-2026-1001",
  "status": "APPROVED"
}
```

Business rule:

Only `SUBMITTED` purchase orders can be approved.

---

### Cancel purchase order

```http
POST /api/v1/purchase-orders/{id}/cancel
Content-Type: application/json
```

Request body:

```json
{
  "reason": "Supplier could not confirm the delivery timeline"
}
```

Successful response:

```http
200 OK
```

Result:

```json
{
  "id": 100,
  "orderNumber": "PO-2026-1001",
  "status": "CANCELLED",
  "cancellationReason": "Supplier could not confirm the delivery timeline",
  "cancelledAt": "2026-04-14T12:30:00"
}
```

Validation rules:

- cancellation reason must not be blank
- cancellation reason must be at most 500 characters

Business rules:

- only `APPROVED` purchase orders can be cancelled
- already cancelled purchase orders cannot be cancelled again
- cancellation metadata is required for cancelled orders

---

## Summary endpoint

| Method | Endpoint                                 | Description                                 |
|--------|------------------------------------------|---------------------------------------------|
| `GET`  | `/api/v1/purchase-orders/summary/status` | Get purchase order counts grouped by status |

---

### Get purchase order status summary

```http
GET /api/v1/purchase-orders/summary/status
```

Successful response:

```http
200 OK
```

Example response body:

```json
[
  {
    "status": "DRAFT",
    "count": 1
  },
  {
    "status": "SUBMITTED",
    "count": 1
  },
  {
    "status": "APPROVED",
    "count": 1
  },
  {
    "status": "CANCELLED",
    "count": 1
  }
]
```

This endpoint is used by the dashboard to show purchase order lifecycle counts.

---

## Status values

Purchase orders can have one of these statuses:

```text
DRAFT
SUBMITTED
APPROVED
CANCELLED
```

Status meaning:

| Status      | Meaning                                               |
|-------------|-------------------------------------------------------|
| `DRAFT`     | The order is still editable and can be deleted        |
| `SUBMITTED` | The order was submitted and is waiting for approval   |
| `APPROVED`  | The order was approved and can be cancelled if needed |
| `CANCELLED` | The order was cancelled with a reason and timestamp   |

---

## Error response format

The backend uses a consistent error response body.

Example validation error:

```json
{
  "timestamp": "2026-04-14T12:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/v1/suppliers",
  "validationErrors": {
    "supplierCode": "must not be blank",
    "contactEmail": "must be a well-formed email address"
  }
}
```

Example business rule error:

```json
{
  "timestamp": "2026-04-14T12:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Only SUBMITTED purchase orders can be approved",
  "path": "/api/v1/purchase-orders/500/approve",
  "validationErrors": null
}
```

---

## Common HTTP status codes

| Status                      | Meaning                                        |
|-----------------------------|------------------------------------------------|
| `200 OK`                    | Request succeeded                              |
| `201 Created`               | Resource was created                           |
| `204 No Content`            | Resource was deleted successfully              |
| `400 Bad Request`           | Validation or business rule failure            |
| `404 Not Found`             | Resource or endpoint was not found             |
| `409 Conflict`              | Unique constraint or protected delete conflict |
| `500 Internal Server Error` | Unexpected server error                        |

---

## Notes

- The API is intentionally small and focused.
- The backend API is versioned under `/api/v1`.
- Swagger UI should be used for full interactive request and response exploration.
- The Angular frontend consumes these endpoints through typed API services.
- The frontend never connects directly to Oracle.