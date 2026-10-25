# Chapter 3 — System Analysis and Design

---

## 3.1 System Requirements

### 3.1.1 Functional Requirements

**Table 3.1 — Functional Requirements**

| ID | Requirement Description |
|----|-------------------------|
| FR-01 | The system shall render a home page containing featured products, collection entries and a service description, retrieved from the database at request time. |
| FR-02 | The system shall display a product catalogue and filter it by category when a category identifier is supplied as a query parameter. |
| FR-03 | The system shall display a product detail page for a valid product identifier, including related products from the same category, and return HTTP 404 for an invalid identifier. |
| FR-04 | The system shall allow a visitor to add a product to the cart from either the catalogue or the product detail page. |
| FR-05 | The system shall allow a cart line quantity to be increased, decreased or set to an explicit value, and shall remove the line when the quantity is set below one. |
| FR-06 | The system shall constrain the requested quantity to the available stock and to a maximum of ten units per line. |
| FR-07 | The system shall compute subtotal, shipping charge and total server-side, applying free delivery above ₹50,000. |
| FR-08 | The system shall retain cart contents across requests for the duration of a session. |
| FR-09 | The system shall validate consultation bookings server-side, rejecting an invalid email address, a missing name and a date earlier than the current date. |
| FR-10 | The system shall accept a newsletter subscription, normalise the address to lower case and return a success response for a duplicate address without creating a second record. |
| FR-11 | The system shall expose every catalogue and cart operation through a JSON API in addition to the rendered page. |
| FR-12 | The system shall create its schema and seed data automatically when the database is empty. |

### 3.1.2 Non-Functional Requirements

**Table 3.2 — Non-Functional Requirements**

| Category | Requirement |
|----------|-------------|
| Performance | Each page is produced in a single request cycle; no round trip is added for initial content. Static assets are served directly from the file system. |
| Reliability | Foreign-key constraints and uniqueness rules prevent invalid states. All write operations are committed explicitly. |
| Usability | Navigation is consistent across pages, the cart provides immediate visual feedback, and forms display validation messages adjacent to the control. |
| Security | All queries use bound parameters, preventing SQL injection. Session identifiers are generated randomly and signed. Input is validated on the server for every write. Secrets are read from environment variables rather than committed. |
| Maintainability | Schema is expressed in plain SQL in a dedicated file, separate from application logic. Presentation, logic and data access are located in separate files. |
| Scalability | The application is stateless apart from the session cookie, so requests may be distributed across instances. Database access is compatible with a hosted PostgreSQL instance for horizontal scaling. |
| Accessibility | Document structure uses semantic elements with a single heading of level one per page, labels are programmatically associated with their controls, and colour contrast satisfies automated audit criteria. |
| Portability | Queries are written in a syntax translatable between SQLite and PostgreSQL, allowing deployment on either without code modification. |

---

## 3.2 Hardware Requirements

**Table 3.3 — Hardware Requirements**

| Component | Requirement |
|-----------|-------------|
| Processor | Dual-core 1.5 GHz or higher |
| RAM | 2 GB minimum (4 GB recommended) |
| Storage | 100 MB for the application, plus space for the database file |
| Display | 1024 × 768 minimum; layout is responsive below this width |
| Network | Internet access required only for deployment; development runs locally |

*No specialised hardware is required. The measured footprint of the complete project,
including images and database, was approximately 10.8 MB.*

---

## 3.3 Software Requirements

**Table 3.4 — Software Requirements**

| Software | Purpose |
|----------|---------|
| Operating System | Windows, Linux or macOS; development performed on Windows |
| Programming Language | Python 3 for the server; HTML5, CSS3 and JavaScript for the client |
| Libraries / Frameworks | Flask 3.1.3 (routing and templating); Jinja2 (templates); psycopg 3.3.6 (PostgreSQL driver) |
| Template Engine | Jinja2, with automatic template reloading enabled during development |
| Database | SQLite (development, default) or PostgreSQL (production, via `DATABASE_URL`) |
| Version Control | Git, with repository initialised on the local machine |
| Web Server | Flask development server locally; Gunicorn for production; Vercel serverless runtime for deployment |
| Browser | [TO BE ADDED — browser used for verification] |
| Testing Tools | Python standard-library HTTP client for automated checks; automated Lighthouse audit for accessibility and SEO scoring |

---

## 3.4 System Architecture

The application follows a classic three-tier architecture in which each tier communicates
only with its adjacent neighbour.

[INSERT SYSTEM ARCHITECTURE DIAGRAM HERE]

*Figure 3.1 — System Architecture*

**Presentation Tier.** Consists of eight Jinja templates extending a common base layout,
one stylesheet and one JavaScript file. The browser requests a page, receives rendered
HTML, and loads the stylesheet and script as separate static resources. JavaScript is
used only to enhance operations that already work without it; cart mutations are the
exception, as they require asynchronous updates to avoid a full page reload.

**Application Tier.** A single Python module registers twenty-one routes. Each route
handler performs input validation, issues one or more parameterised queries through the
data layer, and returns either a rendered template or a JSON document. A context processor
injects the current year and cart item count into every template.

**Data Tier.** The data module manages a single connection per request, stored in the
request context, and closes it when the request completes. It selects SQLite or
PostgreSQL at import time based on configuration, and applies the corresponding schema
file.

**Request flow.**

```
Browser
  → HTTP request
    → Flask router (path match)
      → validation
        → data layer (parameterised query)
          → SQL engine (SQLite / PostgreSQL)
        ← result rows
      ← Python dictionaries
    ← rendered HTML or JSON
  ← response
```

---

## 3.5 System Workflow

The workflow differs slightly for read operations and for cart mutations.

[INSERT SYSTEM WORKFLOW / FLOWCHART HERE]

*Figure 3.2 — System Workflow Flowchart*

**Page request.**

```
Request → Route match → Load cart count → Execute query → Render template → Response
```

**Add to cart.**

```
Input (slug, quantity)
  → Validate format and range
  → Resolve product and read stock
  → Read current cart line
  → Clamp target = min(current + requested, stock, 10)
  → Reject if no quantity may be added
  → Upsert cart line
  → Recompute subtotal, shipping, total
  → Response (201 with updated cart)
```

**Booking submission.**

```
Input (name, email, date, service, message)
  → Trim all fields
  → Verify name present and email matches format
  → Verify date parses and is not earlier than today
  → Insert row
  → Redirect to confirmation page
```

---

## 3.6 Data Flow / Module Design

**Table 3.5 — Module Specifications**

| Module | Purpose | Input | Processing | Output |
|--------|---------|-------|------------|--------|
| Routing (`app.py`) | Maps URL paths to handler functions | HTTP method and path | Matches against registered routes; invokes the corresponding handler | HTML page or JSON document |
| Validation | Rejects malformed input before storage | Form fields or JSON payload | Applies regular-expression and range checks; normalises strings | Validated values, or an HTTP 400 response with a message |
| Catalogue | Retrieves and filters products | Category slug (optional) | Executes a parameterised join over products and categories; orders the result | List of product dictionaries |
| Cart | Manages cart lines and totals | Cart identifier, product identifier, quantity | Reads and clamps quantities; upserts lines; aggregates subtotal and delivery charge | Cart payload containing lines and computed totals |
| Currency | Formats stored integer values | Integer paise | Groups digits according to Indian numbering convention | Formatted string such as `₹12,34,567` |
| Subscription | Registers newsletter addresses | Email address | Normalises to lower case; inserts; catches uniqueness violation | HTTP 201 on first submission, HTTP 200 for a duplicate |
| Booking | Records consultation requests | Name, email, date, message | Validates; inserts a row | HTTP 302 redirect, or HTTP 400 with a message |
| Data access | Provides one connection per request | None | Opens the connection on first use, stores it in the request context, closes it on completion | Connection object |
| Schema manager | Creates structure and initial data | Database path | Applies schema if absent; seeds catalogue when the products table is empty | Populated database |

---

## 3.7 Database Design

Five tables are used. Relationships are enforced by foreign keys with defined
delete behaviour.

[INSERT DATABASE ER DIAGRAM HERE]

*Figure 3.3 — Database Entity Relationship Diagram*

**Table 3.6 — Database Tables and Key Attributes**

| Table | Purpose | Primary Key | Foreign Key | Notable Constraints |
|-------|---------|-------------|-------------|---------------------|
| `categories` | Product groupings | `id` | — | `slug` unique |
| `products` | Catalogue items | `id` | `category_id` → `categories.id` | `slug` unique; `price_paise ≥ 0`; `stock ≥ 0`; `featured ∈ {0,1}` |
| `cart_items` | Per-session cart lines | `id` | `product_id` → `products.id` | Unique pair (`cart_id`, `product_id`); `quantity > 0` |
| `subscribers` | Newsletter addresses | `id` | — | `email` unique |
| `bookings` | Consultation requests | `id` | — | Indexed on `preferred_date` |

**Column detail.**

`categories(id, slug, name, tagline, image, sort_order)`

`products(id, slug, name, category_id, price_paise, description, image, stock, featured, created_at)`

`cart_items(id, cart_id, product_id, quantity, created_at)`

`subscribers(id, email, created_at)`

`bookings(id, name, email, phone, service, preferred_date, message, created_at)`

**Design decisions.**

Prices are stored in paise rather than rupees so that no value requires a fractional
integer column. Display formatting is applied at presentation time, which keeps arithmetic
exact and confines formatting rules to one function.

`cart_items` is keyed by an opaque `cart_id` string rather than a user identifier, because
no user accounts exist. Referential integrity is maintained through the foreign key to
`products`, so deleting a product removes its cart lines.

`categories` and `products` are linked by `ON DELETE SET NULL`, allowing a category to be
retained for historical purposes while its products remain listed without a group.

Two schema files exist — `schema.sql` for SQLite and `schema.postgres.sql` for PostgreSQL.
They are identical apart from the use of `SERIAL` primary keys and `TIMESTAMPTZ` defaults
in the latter.

---

## 3.8 Algorithm / Methodology

The cart computation is the component whose correctness is most sensitive to input. The
clamping procedure is given below in pseudocode.

```
FUNCTION AddToCart(cartId, productId, requested):

    IF requested < 1 THEN
        RETURN ERROR "Quantity must be at least 1"

    product ← SELECT stock FROM products WHERE slug = productId
    IF product NOT FOUND THEN
        RETURN ERROR "Product not found"

    IF product.stock = 0 THEN
        RETURN ERROR "Item unavailable"

    current ← SELECT quantity FROM cart_items
              WHERE cart_id = cartId AND product_id = product.id
    IF no row THEN current ← 0

    MAX_PER_LINE ← 10
    target ← MIN(current + requested, product.stock, MAX_PER_LINE)

    IF target ≤ current THEN
        RETURN ERROR "Only N in stock"

    UPSERT INTO cart_items (cart_id, product_id, quantity)
        VALUES (cartId, product.id, target)
        ON CONFLICT (cart_id, product_id)
        DO UPDATE SET quantity = excluded.quantity

    RETURN SUCCESS (target - current)

END FUNCTION
```

The totalling procedure is:

```
FUNCTION ComputeTotals(cartId):

    subtotal ← SUM(quantity × price_paise) over cart lines for cartId
    units    ← SUM(quantity) over cart lines for cartId

    FREE_THRESHOLD ← 5000000        # ₹50,000 in paise
    FLAT_SHIPPING  ← 150000         # ₹1,500 in paise

    IF subtotal = 0 OR subtotal ≥ FREE_THRESHOLD THEN
        shipping ← 0
    ELSE
        shipping ← FLAT_SHIPPING

    total ← subtotal + shipping
    RETURN subtotal, shipping, total, units
END FUNCTION
```

**Currency formatting.** Values are grouped by Indian convention, in which the rightmost
group holds three digits and preceding groups hold two. The algorithm separates the last
three digits, iteratively extracts two-digit groups from the remaining portion, and
reverses their order before joining. A remainder below one rupee is rendered as a decimal.

**Placeholder translation.** Queries are authored using SQLite's `?` placeholder. When
PostgreSQL is selected, each `?` is replaced by `%s`, and for statements beginning with
`INSERT` a `RETURNING id` clause is appended so that the inserted identifier can be
retrieved. No query in the application contains a literal question mark within a string
literal, which is the condition that makes textual replacement safe here.

---

## 3.9 Chapter Summary

This chapter analysed the system through its functional and non-functional requirements,
followed by explicit hardware and software tables. The three-tier architecture was
described together with its request flow, and placeholders were provided for the
architecture and workflow diagrams.

The design was then decomposed into nine modules, each specified by its input, processing
and output. The database design presented five tables with their keys, constraints and
relationships, and recorded the reasoning behind storing prices as integer paise and
keying carts by an opaque identifier. Finally, the cart clamping algorithm, the totalling
procedure and the placeholder translation method were given in pseudocode. Chapter 4
describes how these designs were implemented and the results obtained.
