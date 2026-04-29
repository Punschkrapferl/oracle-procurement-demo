# Backend Details

This document explains the backend implementation of the Oracle Procurement Demo project.

The backend is a Java 21 / Spring Boot 4 application that exposes a versioned REST API for supplier management, purchase order management, and purchase order workflow actions. It uses Oracle Database for persistence, Flyway for schema migrations, Spring Data JPA for data access, Bean Validation for request validation, and SpringDoc OpenAPI for interactive API documentation.

---

## Backend purpose

The backend models a small but realistic procurement workflow.

It is intentionally scoped as a portfolio project, but it includes the kind of backend concerns that appear in real business applications:

- layered architecture
- DTO-based API design
- request validation
- business rule enforcement
- workflow state transitions
- relational persistence
- database migrations
- consistent error responses
- integration tests against Oracle
- Docker-based runtime setup
- Swagger/OpenAPI documentation

---

## Architecture

![Backend Architecture](screenshots/backend_architecture.png)

The backend follows a layered Spring Boot architecture:

```text
External Clients
  ↓
REST Controllers
  ↓
Service Layer / Business Rules
  ↓
Spring Data JPA Repositories
  ↓
Oracle Database
```

### REST controllers

Controllers expose the HTTP API and delegate business decisions to the service layer.

Main controllers:

- `SupplierController`
- `PurchaseOrderController`

Controller responsibilities:

- define REST endpoints under `/api/v1`
- receive and validate request bodies
- return response DTOs
- define HTTP response statuses
- expose OpenAPI request examples

### Service layer

Services contain the main business logic.

Main services:

- `SupplierService`
- `PurchaseOrderService`

Service responsibilities:

- enforce supplier and purchase order rules
- validate workflow transitions
- check unique business keys
- calculate line totals and purchase order totals
- coordinate repository calls
- map entities to response DTOs

### Repositories

Repositories use Spring Data JPA for database access.

Main repositories:

- `SupplierRepository`
- `PurchaseOrderRepository`

Repository responsibilities:

- load and save entities
- check uniqueness
- load purchase order details with supplier and line data
- return purchase order status summary counts

---

## Package structure

The backend is organized by feature, with shared infrastructure under `common`.

```text
src/main/java/com/example/oracleprocurementdemo
├─ common
│  ├─ api
│  │  └─ ApiPaths
│  ├─ exception
│  │  ├─ ApiErrorResponse
│  │  ├─ BusinessRuleException
│  │  ├─ GlobalExceptionHandler
│  │  ├─ ResourceConflictException
│  │  └─ ResourceNotFoundException
│  └─ persistence
│     └─ BooleanToNumberConverter
├─ config
│  └─ OpenApiConfig
├─ purchaseorder
│  ├─ controller
│  ├─ dto
│  ├─ entity
│  ├─ repository
│  └─ service
├─ supplier
│  ├─ controller
│  ├─ dto
│  ├─ entity
│  ├─ repository
│  └─ service
└─ OracleProcurementDemoApplication
```

This structure keeps supplier logic and purchase order logic separate while still sharing common API paths, exception handling, and persistence helpers.

---

## Domain model

The backend currently models these main domain concepts:

```text
Supplier
PurchaseOrder
PurchaseOrderLine
PurchaseOrderStatus
```

A supplier can have many purchase orders.

A purchase order belongs to one supplier and contains one or more line items.

Each line item has:

- line number
- item description
- quantity
- unit price
- calculated line total

Each purchase order has:

- order number
- supplier
- requester
- order date
- status
- calculated total amount
- optional cancellation reason
- optional cancellation timestamp

---

## Purchase order workflow

A purchase order starts in `DRAFT`.

Valid workflow:

```text
DRAFT -> SUBMITTED -> APPROVED -> CANCELLED
```

Workflow rules:

- only `DRAFT` purchase orders can be edited
- only `DRAFT` purchase orders can be deleted
- only `DRAFT` purchase orders can be submitted
- only `SUBMITTED` purchase orders can be approved
- only `APPROVED` purchase orders can be cancelled
- cancelled purchase orders require a cancellation reason and timestamp

Once a purchase order leaves `DRAFT`, it becomes part of the business history and cannot be edited or deleted through the normal endpoints.

---

## Business rules

### Supplier rules

- Supplier codes must be unique.
- Supplier code, name, and contact email are required.
- Contact email must be valid.
- New suppliers are active by default when no active value is provided.
- Updating a supplier requires an explicit active value.
- Suppliers with purchase order history cannot be deleted.
- Suppliers with history should be deactivated instead.

### Purchase order rules

- Purchase order numbers must be unique.
- Purchase orders can only be created for active suppliers.
- A purchase order must contain at least one line item.
- Line numbers must be unique within the same purchase order.
- Quantity must be positive.
- Unit price must be non-negative.
- Line totals are calculated from quantity and unit price.
- Purchase order total amount is calculated from all line totals.
- Duplicate purchase order line numbers are rejected.
- Workflow transitions must follow the valid lifecycle.

These rules are enforced in the service layer and covered by backend tests.

---

## Database design

The Oracle schema is managed through Flyway migrations.

Migration files:

```text
src/main/resources/db/migration
├─ V1__create_sequences.sql
├─ V2__create_supplier_table.sql
├─ V3__create_purchase_order_table.sql
├─ V4__create_purchase_order_line_table.sql
└─ V5__add_purchase_order_cancellation_fields.sql
```

Main tables:

```text
suppliers
purchase_orders
purchase_order_lines
```

The application uses Oracle sequences for primary key generation:

```text
supplier_seq
purchase_order_seq
purchase_order_line_seq
```

Important database constraints include:

- unique supplier code
- unique purchase order number
- unique line number per purchase order
- foreign key from purchase orders to suppliers
- foreign key from purchase order lines to purchase orders
- status check constraint for purchase order states
- cancellation metadata constraint for cancelled orders
- positive quantity and non-negative price/total constraints

---

## Oracle-specific persistence

Oracle does not use a native boolean column in this schema.

The `suppliers.active` value is stored as:

```text
NUMBER(1)
```

The Java entity uses:

```text
Boolean active
```

The conversion is handled by:

```text
BooleanToNumberConverter
```

Conversion behavior:

```text
true  -> 1
false -> 0
```

This keeps the Java code readable while still using an Oracle-style database schema.

---

## Validation and error handling

The backend uses Bean Validation for request validation and a central exception handler for consistent error responses.

Shared error response type:

```text
ApiErrorResponse
```

Example error response:

```json
{
  "timestamp": "2026-04-14T12:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/v1/suppliers",
  "validationErrors": {
    "supplierCode": "must not be blank"
  }
}
```

Handled error types include:

| Situation                   | HTTP status                 |
|-----------------------------|-----------------------------|
| validation error            | `400 Bad Request`           |
| business rule failure       | `400 Bad Request`           |
| missing resource            | `404 Not Found`             |
| protected delete / conflict | `409 Conflict`              |
| unknown endpoint            | `404 Not Found`             |
| unexpected server error     | `500 Internal Server Error` |

This gives the frontend predictable responses for validation messages, conflicts, and workflow errors.

---

## API versioning and OpenAPI

All backend endpoints are versioned under:

```text
/api/v1
```

The path prefix is centralized in:

```text
ApiPaths
```

Swagger UI is available when the backend is running:

```text
http://localhost:8080/swagger-ui.html
```

OpenAPI JSON is available at:

```text
http://localhost:8080/v3/api-docs
```

OpenAPI metadata is configured in:

```text
OpenApiConfig
```

Controllers include request examples for common actions such as creating suppliers, creating purchase orders, updating draft purchase orders, and cancelling approved purchase orders.

For endpoint details, see:

```text
docs/api_overview.md
```

---

## Optional demo seed data

The project includes optional demo seed data:

```text
src/main/resources/db/demo/V100__seed_demo_data.sql
```

This file is intentionally stored under:

```text
db/demo
```

It is not stored under:

```text
db/migration
```

Therefore, Flyway does not run it automatically.

The seed file creates:

- 4 suppliers
- 4 purchase orders
- 8 purchase order lines
- one purchase order in each status:
  - `DRAFT`
  - `SUBMITTED`
  - `APPROVED`
  - `CANCELLED`

The seed script is useful for showing the dashboard, supplier list, purchase order list, workflow buttons, and cancelled purchase order detail page with realistic data.

### Load demo seed data

Start the demo environment first:

```bash
./scripts/demo/run-demo.sh
```

Then load the optional seed data:

```bash
./scripts/demo/seed-demo-data.sh
```

The seed script is re-runnable. It deletes and reinserts only the fixed demo records defined by the script, not arbitrary business data.

### Seed data test

The seed SQL is covered by:

```text
src/test/java/com/example/oracleprocurementdemo/demo/DemoSeedDataSqlTest.java
```

Run the test through:

```bash
./scripts/demo/run-demo-test.sh
```

The test script loads the required Oracle credentials from `.env`.

---

## Runtime setup

The project separates demo runtime and development runtime.

### Demo runtime

Used for showing the project as a portfolio demo.

Main files:

```text
docker-compose.yml
.env.example
.env
scripts/demo/run-demo.sh
scripts/demo/stop-demo.sh
scripts/demo/reset-demo-db.sh
scripts/demo/seed-demo-data.sh
scripts/demo/run-demo-test.sh
```

Demo runtime behavior:

- Oracle runs in Docker.
- Backend runs through Docker Compose.
- Environment variables use `DEMO_*`.
- Oracle is exposed on host port `1522`.
- Backend runs on port `8080`.

### Development runtime

Used for active development.

Main files:

```text
docker-compose-dev.yml
.env.dev
scripts/dev/run-dev.sh
scripts/dev/stop-dev.sh
scripts/dev/reset-dev-db.sh
scripts/dev/run-dev-test.sh
```

Development runtime behavior:

- Oracle runs in Docker.
- Backend usually runs locally through Spring Boot.
- Environment variables use `DEV_*`.
- Oracle is exposed on host port `1521`.
- Backend runs on `DEV_APP_PORT`, usually `8080`.

---

## Backend testing

The backend includes multiple test levels.

```text
src/test/java/com/example/oracleprocurementdemo
├─ demo
│  └─ DemoSeedDataSqlTest
├─ purchaseorder
│  ├─ controller
│  └─ service
├─ supplier
│  ├─ controller
│  └─ service
└─ OracleProcurementDemoApplicationTests
```

### Service unit tests

Service tests use Mockito and verify business rules without starting the full application.

Covered examples:

- supplier creation and update
- supplier deactivation
- supplier delete protection
- purchase order creation
- inactive supplier rejection
- duplicate order number rejection
- duplicate line number rejection
- draft update and line replacement
- submit, approve, and cancel workflow rules

### Web MVC controller tests

Controller tests use Spring Web MVC test support with mocked services.

Covered examples:

- request mapping
- response status codes
- validation errors
- not found errors
- conflict errors
- business rule errors
- workflow endpoint responses

### Oracle-backed integration tests

Integration tests start the Spring Boot application and verify real persistence behavior against Oracle.

Covered examples:

- create and fetch supplier
- create purchase order with line items
- submit and approve purchase order
- cancel approved purchase order
- reject invalid workflow transitions
- reject supplier deletion when order history exists
- deactivate supplier instead of deleting it
- verify purchase order status summary

### Run backend tests

Demo test path:

```bash
./scripts/demo/run-demo-test.sh
```

Development test path:

```bash
./scripts/dev/run-dev-test.sh
```

---

## Java monitoring note

The backend is a standard Spring Boot Java application, so it can be inspected with common JVM monitoring tools during local development.

Examples:

- Java VisualVM
- jProfiler
- Java Flight Recorder
- JVM heap and thread inspection tools

Useful things to inspect:

- heap usage
- thread count
- request behavior
- garbage collection behavior
- database-related runtime behavior

No special monitoring integration is required for this demo.

---

## What this backend demonstrates

This backend demonstrates practical junior-to-early-mid level backend skills:

- clean REST API design
- versioned API paths
- DTO-based request and response handling
- layered Spring Boot architecture
- business rule enforcement
- workflow state management
- relational data modeling
- Oracle-specific persistence handling
- Flyway database migrations
- central exception handling
- automated backend testing
- Docker-based local runtime setup
- Swagger/OpenAPI documentation