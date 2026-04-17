# Oracle Procurement Demo

A backend project built with **Java 21**, **Spring Boot 4**, **Oracle Database**, **Spring Data JPA**, **Flyway**, **Swagger/OpenAPI**, and **Docker**.

The application models a small procurement workflow around **suppliers** and **purchase orders**. The focus is on clean backend structure, business rules, validation, persistence, testing, and reproducible local setup.

---

## Overview

This project includes:

- Supplier CRUD
- Purchase order CRUD
- Purchase order line items
- Purchase order workflow actions:
  - submit
  - approve
  - cancel
- Purchase order status summary endpoint
- Flyway database migrations
- Centralized validation and error handling
- Swagger/OpenAPI documentation
- Separate **demo** and **development** runtime paths

---

## Workflow

A purchase order starts in `DRAFT` status and can move through a small workflow.

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

## Project structure

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
   └─ resources
      ├─ application-test.yml
      └─ application-test-dev.yml
````

---

## Runtime paths

The project currently supports two separate runtime modes.

### Demo runtime

The demo runtime is fully containerized.

* Oracle runs in Docker
* the application runs in Docker
* orchestration is handled through `docker-compose.yml`

### Development runtime

The development runtime keeps the database in Docker and runs the application locally.

* Oracle runs in Docker
* the application runs locally with Spring Boot
* orchestration uses `docker-compose-dev.yml` and helper scripts
* the active Spring profile is `dev`

---

## Configuration

The project uses separate configuration for demo and development.

### Environment files

* `.env.example`
  template for the demo setup

* `.env.demo`
  local demo runtime configuration

* `.env`
  local development runtime configuration

### Spring config files

* `application.yml`
  default/demo runtime using `DEMO_*`

* `application-dev.yml`
  development runtime using `DEV_*`

* `application-test.yml`
  demo test configuration

* `application-test-dev.yml`
  development test configuration

---

## Quick start

### Demo runtime

This is the simplest way to run the project.

#### Prerequisites

* Docker Desktop installed and running
* port `8080` free
* port `1522` free

#### Start

```bash
git clone https://github.com/Punschkrapferl/oracle-procurement-demo
cd oracle-procurement-demo
```

```bash
cp .env.example .env.demo
./scripts/demo/run-demo.sh
```

#### Open API documentation

* Swagger UI: `http://localhost:8080/swagger-ui.html`
* OpenAPI docs: `http://localhost:8080/v3/api-docs`

#### Stop

```bash
./scripts/demo/stop-demo.sh
```

#### Reset demo database

```bash
./scripts/demo/reset-demo-db.sh
./scripts/demo/run-demo.sh
```

---

### Development runtime

#### Prerequisites

* Docker Desktop installed and running
* Java 21 installed
* port `8080` free
* port `1521` free

#### Start

Create a local `.env` file with the `DEV_*` variables, then run:

```bash
./scripts/dev/run-dev.sh
```

#### Stop

```bash
./scripts/dev/stop-dev.sh
```

#### Reset development database

```bash
./scripts/dev/reset-dev-db.sh
```

#### Run development tests

```bash
./scripts/dev/run-dev-test.sh
```

---

## Docker setup

### Relevant files

* `docker-compose.yml`
* `docker-compose-dev.yml`
* `Dockerfile`
* `.dockerignore`

### Published image

* `punschkrapferl23/oracle-procurement-demo:1.0.2`

### Demo container networking

Inside Docker, the application connects to Oracle using the Compose service name and the Oracle container port:

```text
jdbc:oracle:thin:@oracle:1521/FREEPDB1
```

Important distinction:

* `1521` is the Oracle port inside Docker
* `1522` is the host port exposed for local machine access in the demo runtime

---

## API endpoints

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

## Example flow

A typical application flow looks like this:

1. Create a supplier
2. Create a purchase order linked to that supplier
3. Submit the purchase order
4. Approve or cancel it
5. Delete the supplier
6. Check the status summary endpoint

---

## Testing

The test setup covers several backend layers:

* service unit tests with Mockito
* Web MVC controller tests
* integration tests with Oracle-backed application setup

### Run tests

Demo-oriented test path:

```bash
./scripts/demo/run-demo-test.sh
```

Development-oriented test path:

```bash
./scripts/dev/run-dev-test.sh
```

---

## Notes

* This is a backend-focused project, not a full procurement platform
* The project keeps the scope intentionally small and practical
* Oracle is included as part of the persistence setup
* Swagger/OpenAPI is included for convenient API exploration
* Demo and development paths are intentionally separated to keep runtime behavior explicit

---

## Future improvements

Potential next steps outside the current scope:

* authentication and authorization
* audit logging
* pagination and filtering on more endpoints
* CI pipeline automation
* frontend client for the workflow
* deployment beyond local Docker usage

---

## License

MIT License

Copyright (c) 2026 Punschkrapferl

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is furnished
to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
