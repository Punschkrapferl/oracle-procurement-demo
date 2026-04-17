# Oracle Procurement Demo

Small backend portfolio project built with **Java 21**, **Spring Boot 4**, **Oracle Database**, **Spring Data JPA**, **Flyway**, **Swagger/OpenAPI**, and **Docker Compose**.

This project models a simple procurement workflow with **suppliers** and **purchase orders**. It focuses on backend concerns that are useful in a recruiter review: **clean API design, validation, workflow rules, persistence, database migrations, exception handling, testing, and reproducible local setup**.

---

## What this project demonstrates

- REST API design with Spring Boot 4
- Oracle-backed persistence with Spring Data JPA
- Database migrations with Flyway
- Validation and centralized exception handling
- Simple procurement workflow rules
- Swagger/OpenAPI documentation for fast API review
- Automated tests across service, controller, and integration levels
- Docker-based local setup for reproducible reviewing
- Published Docker image for low-friction project review

---

## Scope

The project intentionally stays small and practical.

### Implemented features

- Supplier CRUD
- Purchase order CRUD
- Purchase order line items
- Workflow actions:
  - submit
  - approve
  - cancel
- Purchase order status summary endpoint
- Validation and structured error responses
- Flyway-based schema management
- Swagger/OpenAPI UI
- Dockerized Oracle database
- Dockerized application setup for easy review

### Workflow idea

A purchase order starts as a draft and can move through a small approval flow.

Example lifecycle:

`DRAFT -> SUBMITTED -> APPROVED`

Cancellation is also supported according to the business rules implemented in the service layer.

---

## Tech stack

- Java 21
- Spring Boot 4
- Spring Web MVC
- Spring Data JPA
- Oracle Database
- Flyway
- Hibernate Validator
- SpringDoc OpenAPI / Swagger UI
- JUnit 5
- Mockito
- Docker Compose

---

## Architecture overview

![Architecture Diagram](docs/architecture_diagram.png)

---

## Package structure

```text
src
├─ main
│  ├─ java/com/example/oracleprocurementdemo
│  │  ├─ common/exception
│  │  ├─ config
│  │  ├─ supplier
│  │  │  ├─ controller
│  │  │  ├─ dto
│  │  │  ├─ entity
│  │  │  ├─ repository
│  │  │  └─ service
│  │  └─ purchaseorder
│  │     ├─ controller
│  │     ├─ dto
│  │     ├─ entity
│  │     ├─ repository
│  │     └─ service
│  └─ resources
│     ├─ db/migration
│     ├─ application.yml
│     └─ application-dev.yml
└─ test
   ├─ java/com/example/oracleprocurementdemo
   └─ resources/application-test.yml
````

---

## Quick review path

This is the main and recommended way to review the project.

### Prerequisites

* Docker Desktop installed and running
* Port `8080` free for the application
* Port `1521` free for Oracle

### 1. Create a local environment file

```bash
cp .env.example .env
```

### 2. Start the full stack

```bash
docker compose up -d --wait --wait-timeout 600
```

### 3. Open the API docs

* Swagger UI: `http://localhost:8080/swagger-ui.html`
* OpenAPI docs: `http://localhost:8080/v3/api-docs`

### 4. Stop the stack

```bash
docker compose down
```

### 5. Full reset

If you want a completely fresh Oracle database:

```bash
docker compose down -v
docker compose up -d --wait --wait-timeout 600
```

This removes the Oracle volume and recreates the schema from scratch through Flyway.

---

## Why a full reset may be necessary

The Oracle container initializes database users and passwords on first startup.

If database credentials are changed later, the existing Oracle volume still contains the old initialized state. In that case, use:

```bash
docker compose down -v
```

before starting again.

---

## Runtime model

The project uses one clean Docker-based runtime path:

* **Oracle container**
* **application container**
* **Docker Compose orchestration**

The main reviewer flow does not depend on a local `spring-boot:run` path.

### Container responsibilities

#### Oracle container

Responsible for database initialization:

* `ORACLE_PASSWORD`
* `APP_USER`
* `APP_USER_PASSWORD`

#### Application container

Responsible for connecting to Oracle:

* `DB_URL`
* `DB_USERNAME`
* `DB_PASSWORD`

### Required credential mapping

These values must match:

* `APP_USER = DB_USERNAME`
* `APP_USER_PASSWORD = DB_PASSWORD`

### Networking rule

When the application runs inside Docker, it connects to Oracle using the Compose service name:

* `oracle`

not:

* `localhost`

So the Docker datasource URL is:

```text
jdbc:oracle:thin:@oracle:1521/FREEPDB1
```

From your browser on your machine, the app is reached via:

* `http://localhost:8080`

---

## Environment configuration

The project uses environment-variable based configuration.

### Files

* `.env.example`
  committed, safe template for local setup

* `.env`
  local active configuration file, not committed

### Main variables

#### Oracle initialization

* `ORACLE_PASSWORD`
* `APP_USER`
* `APP_USER_PASSWORD`

#### Application datasource

* `DB_URL`
* `DB_USERNAME`
* `DB_PASSWORD`

### Local setup

Create your local environment file like this:

```bash
cp .env.example .env
```

Then edit `.env` if you want custom local values.

### Example `.env.example`

```env
ORACLE_PASSWORD=REMOVED_OLD_ROOT_PASSWORD
APP_USER=
APP_USER_PASSWORD=REMOVED_OLD_APP_PASSWORD

DB_URL=
DB_USERNAME=
DB_PASSWORD=REMOVED_OLD_APP_PASSWORD
```

---

## Docker setup

The main review path uses a published application image.

### Relevant files

* `docker-compose.yml`
* `Dockerfile`
* `.dockerignore`
* `.env.example`

### Published image

* `punschkrapferl23/oracle-procurement-demo:1.0.1`

### Start command

```bash
docker compose up -d --wait --wait-timeout 600
```

### Useful reset command

```bash
docker compose down -v
docker compose up -d --wait --wait-timeout 600
```

---

## API documentation

Swagger UI is included to make backend review easy.

### Suppliers

* `GET /api/suppliers`
* `GET /api/suppliers/{id}`
* `POST /api/suppliers`
* `PUT /api/suppliers/{id}`
* `DELETE /api/suppliers/{id}`

### Purchase orders

* `GET /api/purchase-orders`
* `GET /api/purchase-orders/{id}`
* `POST /api/purchase-orders`
* `PUT /api/purchase-orders/{id}`
* `DELETE /api/purchase-orders/{id}`

### Workflow actions

* `POST /api/purchase-orders/{id}/submit`
* `POST /api/purchase-orders/{id}/approve`
* `POST /api/purchase-orders/{id}/cancel`

### Summary

* `GET /api/purchase-orders/summary/status`

---

## Example review flow

A quick end-to-end review can look like this:

1. Start the stack with Docker Compose
2. Open Swagger UI
3. Create a supplier
4. Create a purchase order linked to that supplier
5. Submit the purchase order
6. Approve the purchase order
7. Call the status summary endpoint

This covers the main workflow without needing to inspect the database manually.

---

## Testing

The test setup covers multiple layers of the backend.

### Included test types

* Service unit tests with Mockito
* Web MVC slice tests for controllers
* Integration tests with Oracle-backed application setup

### Run all tests

```bash
cp .env.example .env
./scripts/run-integration-tests.sh
```

---

## Notes for reviewers

* This is a backend-focused demo, not a full procurement platform
* The project prioritizes clarity and reviewability over feature breadth
* Docker is used to reduce setup friction
* Oracle is included intentionally to demonstrate working integration with a non-trivial relational database setup
* Swagger/OpenAPI is included so the workflow can be reviewed interactively without needing a separate client

---

## Future improvements

Potential next steps, intentionally not required for the current demo:

* authentication and authorization
* audit logging
* pagination and filtering on more endpoints
* CI pipeline automation
* frontend client for the workflow
* deployment beyond local Docker review

---

## License

MIT License

Copyright (c) 2026 Punschkrapferl

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

