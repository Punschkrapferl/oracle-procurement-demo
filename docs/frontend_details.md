# Frontend Details

This document explains the Angular frontend of the Oracle Procurement Demo project.

The frontend is an Angular 20 application that provides a small procurement user interface for suppliers, purchase orders, purchase order line items, workflow actions, and dashboard summaries.

It uses TypeScript, standalone components, Angular signals, reactive forms, typed API services, Karma/Jasmine unit tests, Playwright end-to-end tests, and an optional Docker/nginx runtime.

---

## Frontend purpose

The frontend is designed as a practical portfolio UI for the Spring Boot backend.

It demonstrates:

- a working Angular application structure
- routing between feature pages
- typed REST API integration
- reactive create/edit forms
- frontend validation
- workflow-specific UI behavior
- dashboard summary rendering
- loading, empty, success, and error states
- unit tests and end-to-end tests
- local and Dockerized runtime options

The frontend does not connect directly to Oracle. All data access goes through the Spring Boot REST API.

---

## Architecture

![Frontend Architecture](screenshots/frontend_architecture.png)

The frontend follows a feature-based Angular structure:

```text
Angular Frontend
  ↓
App Shell / Router
  ↓
Feature Pages
  ↓
Typed API Services
  ↓
Angular HttpClient
  ↓
Spring Boot Backend
  ↓
Oracle Database
```

The application communicates with the backend through the versioned API base path:

```text
/api/v1
```

---

## Runtime API flow

The API base path is configured through:

```text
src/environments/environment.ts
src/environments/environment.prod.ts
src/app/core/config/api.config.ts
```

### Local development flow

During local development, the frontend runs through the Angular dev server:

```bash
npm start
```

The dev server uses:

```text
proxy.conf.json
```

The local flow is:

```text
Browser
  ↓
Angular dev server on localhost:4200
  ↓
proxy.conf.json
  ↓
Spring Boot backend on localhost:8080
  ↓
Oracle Database
```

The frontend calls:

```text
/api/v1
```

The proxy forwards `/api` requests to:

```text
http://localhost:8080
```

### Docker frontend flow

The frontend can also run as a Dockerized nginx build.

The Docker flow is:

```text
Browser
  ↓
nginx frontend container on localhost:4200
  ↓
nginx /api proxy
  ↓
Spring Boot backend on host.docker.internal:8080
  ↓
Oracle Database
```

In this setup:

- Angular is built as a static production bundle.
- nginx serves the generated frontend files.
- nginx proxies `/api/` requests to the backend.

---

## Project structure

```text
frontend
├─ e2e
│  ├─ helpers
│  │  └─ data.ts
│  ├─ navigation.spec.ts
│  ├─ purchase-orders.spec.ts
│  ├─ smoke.spec.ts
│  └─ suppliers.spec.ts
├─ src
│  ├─ app
│  │  ├─ core
│  │  │  ├─ api
│  │  │  ├─ config
│  │  │  └─ models
│  │  ├─ features
│  │  │  ├─ dashboard
│  │  │  ├─ purchase-orders
│  │  │  └─ suppliers
│  │  ├─ app.config.ts
│  │  ├─ app.css
│  │  ├─ app.html
│  │  ├─ app.routes.ts
│  │  └─ app.ts
│  ├─ environments
│  ├─ index.html
│  ├─ main.ts
│  └─ styles.css
├─ angular.json
├─ docker-compose.yml
├─ Dockerfile
├─ nginx.conf
├─ package.json
├─ playwright.config.ts
├─ proxy.conf.json
└─ tsconfig.json
```

Generated folders such as `dist`, `.angular`, `node_modules`, `playwright-report`, and `test-results` are not part of the source architecture.

---

## App shell and routing

The root app component is defined in:

```text
src/app/app.ts
src/app/app.html
src/app/app.css
```

The app shell contains:

- sidebar navigation
- topbar
- main content area
- router outlet

Feature routes are defined in:

```text
src/app/app.routes.ts
```

Main routes:

| Route                       | Page                               |
|-----------------------------|------------------------------------|
| `/dashboard`                | Dashboard                          |
| `/suppliers`                | Supplier list                      |
| `/suppliers/new`            | Create supplier                    |
| `/suppliers/:id/edit`       | Edit supplier                      |
| `/purchase-orders`          | Purchase order list                |
| `/purchase-orders/new`      | Create purchase order              |
| `/purchase-orders/:id/edit` | Edit purchase order                |
| `/purchase-orders/:id`      | Purchase order detail              |
| empty route                 | redirects to `/dashboard`          |
| unknown route               | redirects to `/dashboard`          |

---

## Angular setup

The application uses standalone Angular components instead of Angular modules.

Application providers are configured in:

```text
src/app/app.config.ts
```

The app uses:

- `provideRouter(routes)`
- `provideHttpClient()`
- `provideZonelessChangeDetection()`
- `provideBrowserGlobalErrorListeners()`

Page-level state is handled with Angular signals and computed values where appropriate.

Reactive forms are used for create/edit pages.

---

## API services and models

Typed API services live in:

```text
src/app/core/api
```

Current API services:

```text
supplier-api.service.ts
purchase-order-api.service.ts
```

The services centralize HTTP calls and keep feature components independent from raw endpoint strings.

Typed request and response models live in:

```text
src/app/core/models
```

Model groups include:

```text
CreateSupplierRequest
UpdateSupplierRequest
SupplierResponse

CreatePurchaseOrderRequest
UpdatePurchaseOrderRequest
CancelPurchaseOrderRequest
PurchaseOrderResponse
PurchaseOrderLineRequest
PurchaseOrderLineResponse
PurchaseOrderStatusSummaryResponse
```

This keeps the frontend aligned with the backend DTO structure and improves type safety during API integration.

---

## Dashboard feature

The dashboard is located under:

```text
src/app/features/dashboard/pages/dashboard-page
```

The dashboard shows:

- purchase order status summary cards
- total purchase order count
- latest purchase orders
- recently cancelled purchase orders
- cancellation reasons
- loading state
- backend connectivity error state
- empty state for cancelled orders

The dashboard uses:

```text
PurchaseOrderApiService.getPurchaseOrderStatusSummary()
PurchaseOrderApiService.getAllPurchaseOrders()
```

This gives a quick overview of the procurement workflow state.

---

## Supplier feature

The supplier feature is located under:

```text
src/app/features/suppliers
```

### Supplier list page

The supplier list page shows:

- supplier ID
- supplier code
- supplier name
- contact email
- active/inactive status badge
- edit action
- loading state
- backend error state
- empty state

### Supplier form page

The supplier form page supports:

- creating suppliers
- editing suppliers
- loading existing supplier data in edit mode
- active/inactive checkbox
- trimming form values before submission
- frontend validation messages
- backend error messages
- duplicate supplier code handling

Supplier form validation includes:

- supplier code required
- supplier code maximum length
- supplier name required
- supplier name maximum length
- contact email required
- valid email format
- contact email maximum length

The active flag allows suppliers with purchase order history to be deactivated instead of deleted.

---

## Purchase order feature

The purchase order feature is located under:

```text
src/app/features/purchase-orders
```

### Purchase order list page

The purchase order list page shows:

- order number
- supplier
- requester
- order date
- total amount
- status badge
- view action
- edit action for draft orders
- delete action for draft orders
- loading state
- backend error state
- empty state
- success message after deletion

Business behavior in the UI:

- only `DRAFT` purchase orders show the edit action
- only `DRAFT` purchase orders show the delete action
- delete requires browser confirmation

### Purchase order form page

The purchase order form page supports:

- creating purchase orders
- editing draft purchase orders
- loading active suppliers into the supplier dropdown
- filtering out inactive suppliers
- loading existing purchase order data in edit mode
- blocking edit mode for non-draft purchase orders
- dynamic line items
- add line item
- remove line item
- automatic line number recalculation
- line total calculation
- order total calculation
- decimal input sanitization
- backend validation error handling

Purchase order form validation includes:

- order number required
- order number maximum length
- supplier must be selected
- requester required
- requester maximum length
- order date required
- item description required
- item description maximum length
- quantity must be at least 1
- unit price must be valid
- unit price must use `.` as decimal separator

### Purchase order detail page

The purchase order detail page shows:

- purchase order metadata
- supplier display name
- requester
- order date
- created timestamp
- updated timestamp
- total amount
- line items
- cancellation reason
- cancellation timestamp
- workflow actions

Workflow actions shown by status:

| Status      | Available UI actions      |
|-------------|---------------------------|
| `DRAFT`     | edit, delete, submit      |
| `SUBMITTED` | approve                   |
| `APPROVED`  | cancel                    |
| `CANCELLED` | show cancellation history |

Cancellation requires a reason with a maximum length of 500 characters.

---

## Styling approach

Global shared styles are defined in:

```text
src/styles.css
```

Shared styles include:

- page layout
- page headers
- cards
- buttons
- status badges
- alerts
- forms
- validation messages
- tables
- responsive behavior

Feature-specific CSS files are used for page-specific layout and styling.

This keeps repeated styles centralized and helps avoid unnecessary duplication across components.

---

## Local frontend development

Prerequisites:

- Node.js
- npm
- backend running on `http://localhost:8080`

Install dependencies:

```bash
npm install
```

Start the Angular dev server:

```bash
npm start
```

The frontend runs on:

```text
http://localhost:4200
```

The Angular proxy forwards API requests from:

```text
/api
```

to:

```text
http://localhost:8080
```

---

## Production build

Build the frontend:

```bash
npm run build
```

The production output is written to:

```text
dist/frontend/browser
```

The Docker image copies this build output into nginx:

```text
/usr/share/nginx/html
```

---

## Frontend Docker runtime

The frontend Docker setup uses a multi-stage build.

Main files:

```text
frontend/Dockerfile
frontend/docker-compose.yml
frontend/nginx.conf
```

Dockerfile behavior:

1. Build stage:
    - uses Node Alpine
    - installs dependencies
    - builds the Angular app

2. Runtime stage:
    - uses nginx Alpine
    - copies the Angular production build
    - copies the nginx configuration
    - serves the app on container port `80`

Docker Compose exposes the frontend as:

```text
localhost:4200 -> container port 80
```

Start the Dockerized frontend:

```bash
cd frontend
docker compose up -d
```

Stop the Dockerized frontend:

```bash
cd frontend
docker compose down
```

The nginx configuration supports Angular client-side routing:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

It also proxies backend API calls:

```nginx
location /api/ {
    proxy_pass http://host.docker.internal:8080/api/;
}
```

---

## Unit tests

Frontend unit tests use Karma and Jasmine.

Run unit tests:

```bash
npm test
```

Test files are colocated with the source files they test.

Examples:

```text
src/app/app.spec.ts
src/app/core/api/supplier-api.service.spec.ts
src/app/core/api/purchase-order-api.service.spec.ts
src/app/features/dashboard/pages/dashboard-page/dashboard-page.spec.ts
src/app/features/suppliers/pages/supplier-list-page/supplier-list-page.spec.ts
src/app/features/suppliers/pages/supplier-form-page/supplier-form-page.spec.ts
src/app/features/purchase-orders/pages/purchase-order-list-page/purchase-order-list-page.spec.ts
src/app/features/purchase-orders/pages/purchase-order-form-page/purchase-order-form-page.spec.ts
src/app/features/purchase-orders/pages/purchase-order-detail-page/purchase-order-detail-page.spec.ts
```

Unit test coverage includes:

- app shell rendering
- route redirects
- API service HTTP methods and paths
- dashboard data loading
- dashboard computed values
- supplier list loading
- supplier form validation
- supplier create/edit behavior
- purchase order list behavior
- purchase order form line calculations
- purchase order create/edit behavior
- purchase order detail workflow actions
- frontend error handling

---

## End-to-end tests

End-to-end tests use Playwright.

Run e2e tests:

```bash
npm run test:e2e
```

Additional Playwright commands:

```bash
npm run test:e2e:ui
npm run test:e2e:headed
npm run test:e2e:debug
```

Main e2e files:

```text
e2e/smoke.spec.ts
e2e/navigation.spec.ts
e2e/suppliers.spec.ts
e2e/purchase-orders.spec.ts
e2e/helpers/data.ts
```

Playwright coverage includes:

- app shell loads
- sidebar navigation works
- supplier creation flow
- purchase order creation flow
- purchase order appears in the list
- purchase order detail page opens
- submit workflow action
- approve workflow action
- approved purchase order shows the cancellation form

The e2e tests create unique supplier codes and purchase order numbers, for example:

```text
SUP-E2E-{timestamp-random}
PO-E2E-{timestamp-random}
```

This avoids collisions during repeated local test runs.

---

## TypeScript strictness

The frontend uses strict TypeScript settings.

Important settings include:

```json
{
  "strict": true,
  "noImplicitOverride": true,
  "noPropertyAccessFromIndexSignature": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true,
  "isolatedModules": true
}
```

Angular template strictness is also enabled:

```json
{
  "strictInjectionParameters": true,
  "strictInputAccessModifiers": true,
  "typeCheckHostBindings": true,
  "strictTemplates": true
}
```

These settings make the frontend stricter and reduce accidental runtime errors.

---

## What this frontend demonstrates

This frontend demonstrates practical Angular full-stack skills:

- standalone Angular components
- feature-based project structure
- typed REST API integration
- reactive forms
- frontend validation
- Angular signals for page state
- workflow-aware UI behavior
- dashboard rendering from backend data
- loading, empty, success, and error states
- unit tests with Karma/Jasmine
- e2e tests with Playwright
- Dockerized nginx production runtime