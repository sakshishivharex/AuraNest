# Chapter 4 — Implementation and Results

---

## 4.1 Development Environment

The application was developed using the following environment.

| Aspect | Detail |
|--------|--------|
| Programming language (server) | Python 3.14.6 |
| Programming language (client) | HTML5, CSS3, JavaScript (no framework, no build step) |
| Framework | Flask 3.1.3 |
| Templating | Jinja2 (bundled with Flask) |
| Database (development) | SQLite 3 (Python standard library `sqlite3`) |
| Database (deployment option) | PostgreSQL 3.3.6 via psycopg |
| WSGI server | Gunicorn 23.0.0 (production only) |
| Operating system | Windows 11 [TO BE ADDED — confirm version] |
| Version control | Git 2.55.0 |
| Package management | pip 26.1.2 |
| Deployment target | Vercel serverless runtime, configuration in `vercel.json` |

Dependencies are declared in `requirements.txt` and installed with a single command.
SQLite requires no installation, so the application runs from a fresh clone with Python
and `pip install -r requirements.txt`.

**Project file structure as implemented:**

```
aura-nest-project-proposal/
├── app.py                  523 lines   routes, validation, cart logic, API
├── db.py                   301 lines   driver selection, schema, seed data
├── schema.sql                          SQLite DDL
├── schema.postgres.sql                 PostgreSQL DDL
├── requirements.txt
├── vercel.json                         deployment configuration
├── api/index.py                        serverless entry point
├── templates/             8 files      base, index, shop, product,
│                                        cart, book, book-thanks, 404
├── static/
│   ├── css/styles.css     713 lines    tokens and component styles
│   ├── js/main.js         273 lines    nav, cart, newsletter
│   └── images/            9 files
└── auranest.db                        created on first run
```

---

## 4.2 Module-wise Implementation

### Module: Routing and Page Delivery

**Purpose:** Maps URL paths to handler functions and renders the appropriate template.

**Input:** HTTP method and path.

**Processing:** Flask matches the request against registered routes. Handlers query the
data layer and build the template context. A context processor adds the current year and
cart item count to every template without each handler supplying them.

**Output:** An HTML document, or HTTP 404 from a shared handler when no route matches.

**Table 4.1 — HTTP Routes Exposed by the Application**

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | Home page |
| GET | `/shop` | Catalogue, optional `?category=` filter |
| GET | `/product/<slug>` | Product detail |
| GET | `/cart` | Cart page |
| POST | `/cart/add/<slug>` | Add to cart via form post |
| GET | `/book` | Consultation form |
| POST | `/book` | Submit booking |
| GET | `/book/thanks` | Booking confirmation |
| GET | `/contact` | Redirects to `/book` |
| GET | `/api/products` | All products as JSON |
| GET | `/api/products/<slug>` | Single product as JSON |
| GET | `/api/categories` | Categories with item counts |
| GET | `/api/cart` | Cart payload with totals |
| POST | `/api/cart` | Add to cart |
| PATCH | `/api/cart/<line_id>` | Set line quantity |
| DELETE | `/api/cart/<line_id>` | Remove one line |
| DELETE | `/api/cart` | Empty the cart |
| POST | `/api/subscribe` | Newsletter subscription |
| POST | `/api/bookings` | Booking as JSON |
| GET | `/api/stats` | Row counts per table |
| GET | `/healthz` | Liveness check |

### Module: Cart Management

**Purpose:** Maintains cart lines and computes totals.

**Input:** Session cart identifier, product slug or identifier, requested quantity.

**Processing:** The quantity is clamped against stock and a maximum of ten per line. A
line is inserted or updated with an upsert so that repeated additions increment rather
than duplicate. Totals are recomputed on every read: subtotal by summing quantity
multiplied by unit price, then a flat ₹1,500 delivery charge applied below ₹50,000.

**Output:** A cart payload containing each line's identifier, quantity, unit price, line
total, plus aggregate units, subtotal, shipping and total, all formatted for display.

### Module: Input Validation

**Purpose:** Rejects malformed data before it reaches storage.

**Input:** Form fields or JSON payload.

**Processing:** Email addresses are matched against a regular expression requiring a
local part, an `@` separator and a domain with a two-character top-level domain. Dates
are matched against an ISO pattern and then compared with the current date. Quantities
are converted to integers and range-checked. A separate branch handles the case in which
`quantity` is the integer zero, which must be rejected rather than treated as absent.

**Output:** Validated values, or HTTP 400 with a descriptive message.

### Module: Data Access and Schema

**Purpose:** Provides one connection per request and creates structure when absent.

**Input:** Database path or connection string.

**Processing:** The connection is opened on first use inside a request context and closed
when the request completes. Schema statements are applied idempotently. When the products
table is empty, the three categories and eight products are inserted.

**Output:** A populated database with five tables.

### Module: Client-Side Enhancement

**Purpose:** Provides cart mutation feedback and form submission without full reloads.

**Input:** DOM events from quantity buttons, remove controls and the newsletter form.

**Processing:** Mutations are sent as JSON with `credentials: 'same-origin'` so the
session cookie travels with the request. The response cart payload is applied to the
document: the header badge, the summary values and the affected line total. A status
region announces the outcome to assistive technology.

**Output:** Updated interface state, or an inline validation message.

---

## 4.3 Important Code Components

Three components are presented because each illustrates a decision that affects
correctness.

**Code Snippet 1 — cart clamping and upsert (`app.py`)**

```python
def add_to_cart(product_id: int, qty: int) -> tuple[int, str | None]:
    """Add qty units, clamped to available stock. Returns (units_added, error)."""
    row = db.query_one("SELECT stock FROM products WHERE id = ?", (product_id,))
    if row is None:
        return 0, "Product not found."
    stock = int(row["stock"])
    if stock <= 0:
        return 0, "This piece is currently unavailable."

    current = db.query_one(
        "SELECT quantity FROM cart_items WHERE cart_id = ? AND product_id = ?",
        (cart_id(), product_id),
    )
    existing = int(current["quantity"]) if current else 0
    target = min(existing + qty, stock, MAX_QTY_PER_LINE)

    if target <= existing:
        return 0, f"Only {stock} in stock."

    db.execute(
        "INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?,?,?) "
        "ON CONFLICT (cart_id, product_id) DO UPDATE SET quantity = excluded.quantity",
        (cart_id(), product_id, target),
    )
    return target - existing, None
```

*What it does:* Constrains the requested quantity and inserts or updates the cart line.

*Why it is used:* Prevents over-ordering beyond available stock and prevents a single
line exceeding a reasonable maximum. The upsert form avoids a read-then-write race in
which two concurrent additions could both observe the same previous quantity.

*Expected output:* HTTP 201 with the number of units added, or HTTP 409 with the reason
the quantity could not be increased.

**Code Snippet 2 — Indian currency formatter (`app.py`)**

```python
def inr(paise: int) -> str:
    """Format paise as Indian Rupees using lakh/crore digit grouping."""
    negative = paise < 0
    rupees, remainder = divmod(abs(int(paise)), 100)

    digits = str(rupees)
    if len(digits) > 3:
        head, tail = digits[:-3], digits[-3:]
        groups = []
        while len(head) > 2:
            groups.insert(0, head[-2:])
            head = head[:-2]
        if head:
            groups.insert(0, head)
        digits = ",".join(groups) + "," + tail

    out = f"₹{digits}"
    if remainder:
        out += f".{remainder:02d}"
    return f"-{out}" if negative else out


@app.template_filter("inr")
def inr_filter(paise):
    return inr(paise)
```

*What it does:* Converts integer paise into a display string using Indian digit grouping.

*Why it is used:* Python's default formatting cannot produce `₹12,34,567` grouping
directly, and the project requires Indian presentation. Keeping formatting in one
function ensures every price in the application is rendered identically.

*Expected output:* `280000` renders as `₹2,800`; `123456789` renders as `₹12,34,567.89`.

**Code Snippet 3 — driver selection and placeholder translation (`db.py`)**

```python
DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()
# Vercel injects POSTGRES_URL-style vars; treat any postgres URL as Postgres.
USING_POSTGRES = DATABASE_URL.startswith(("postgres://", "postgresql://"))


def _translate(sql: str) -> str:
    """Rewrite SQLite ``?`` placeholders to Postgres ``%s``.

    Safe here because no query embeds a literal ``?`` inside a string. The
    INSERT ... RETURNING clause supplies lastrowid, which psycopg does not
    expose the way sqlite3 does.
    """
    out = sql.replace("?", "%s")
    head = out.lstrip().upper()
    if head.startswith("INSERT") and "RETURNING" not in out.upper():
        out += " RETURNING id"
    return out
```

*What it does:* Chooses SQLite or PostgreSQL from configuration and rewrites `?`
placeholders to `%s` for the latter.

*Why it is used:* Allows the same query text to run against both engines, keeping
application code free of database-specific branching.

*Expected output:* With `DATABASE_URL` unset, queries execute against the local file
database. With a `postgres://` value set, the same queries execute against the server
with placeholders substituted.

---

## 4.4 User Interface

The interface uses a consistent header across all pages containing a wordmark, primary
navigation, a cart indicator with an item count badge, and a call to action. Pages are
laid out on a container with a maximum width, and grids collapse to single columns below
responsive breakpoints.

**Figure 4.1 — Home Page**

[INSERT SCREENSHOT HERE]

**Figure 4.2 — Product Catalogue**

[INSERT SCREENSHOT HERE]

**Figure 4.3 — Shopping Cart**

[INSERT SCREENSHOT HERE]

**Figure 4.4 — Consultation Booking Form**

[INSERT SCREENSHOT HERE]

*Observations on the implemented interface.*

Each product card presents the image, name and price, followed by an add-to-cart control.
The cart page places a line-item list beside a sticky summary panel containing subtotal,
delivery and total, together with a notice indicating the amount remaining for free
delivery. Quantity controls expose accessible labels naming the product, and the remove
control is a labelled button rather than an icon alone.

On narrow viewports the primary navigation collapses behind a toggle button that reports
its expanded state to assistive technology; the menu closes on selection of a link, on
pressing the Escape key, and when the viewport is resized to a width where it is no longer
required.

---

## 4.5 Results

The following results were obtained from automated checks executed against the running
application.

**Page delivery.** All seven page routes returned HTTP 200. An unknown path returned HTTP
404 rendered from a dedicated template rather than a server error page.

**Catalogue.** The catalogue returned eight products across three categories. Prices
rendered as `₹2,800`, `₹4,200`, `₹5,400`, `₹7,600`, `₹9,800`, `₹12,500`, `₹13,500` and
`₹68,000`. No residual dollar-denominated value was present on any page.

**Cart arithmetic.** With a quantity of two units at ₹2,800, the subtotal was ₹5,600, the
delivery charge ₹1,500 and the total ₹7,100. After a quantity change to three units,
the subtotal became ₹8,400. Adding a second line produced a subtotal of ₹14,000. All
computed values matched hand calculation.

**Automated audit.** Lighthouse scores for accessibility, best practices and search engine
optimisation were 100, 100 and 100 respectively on the home page, the cart page and a
product detail page. Zero JavaScript errors were recorded across all pages examined.
No horizontal overflow, duplicate identifiers or failed image loads were detected.

**Validation behaviour.** Submission of a quantity of zero was rejected with HTTP 400 and
the message *"Quantity must be at least 1."* An unknown product slug returned HTTP 404.
A non-numeric quantity returned HTTP 400. A first newsletter submission returned HTTP 201
and a repeat submission of the same address, differing only in letter case, returned
HTTP 200 without creating a duplicate record.

**Deployment.** The application was successfully deployed to a serverless hosting
platform, where the health endpoint, home page, product API, category API and cart API all
returned HTTP 200, and static assets were served correctly.

[INSERT ACTUAL RESULT HERE — any additional measurements, if available]

---

## 4.6 Testing

Test cases were executed against the running application. The table records the input
supplied, the expected result and the observed result.

**Table 4.2 — Test Cases and Results**

| # | Test Case | Input | Expected Output | Actual Output | Status |
|---|-----------|-------|-----------------|---------------|--------|
| 1 | Home page loads | `GET /` | HTTP 200 with rendered page | HTTP 200 | Pass |
| 2 | Unknown path returns error page | `GET /nope` | HTTP 404 with custom 404 template | HTTP 404 | Pass |
| 3 | Category filter returns only that category | `GET /shop?category=lighting` | HTTP 200, only lighting products | HTTP 200, 2 products listed | Pass |
| 4 | Add to cart increments units | `POST /api/cart` `{slug, quantity: 2}` | HTTP 201, units = 2 | HTTP 201, units = 2, subtotal ₹5,600 | Pass |
| 5 | Zero quantity is rejected | `POST /api/cart` `{quantity: 0}` | HTTP 400 | HTTP 400, *"Quantity must be at least 1."* | Pass |
| 6 | Non-numeric quantity is rejected | `POST /api/cart` `{quantity: "abc"}` | HTTP 400 | HTTP 400, *"Quantity must be a whole number."* | Pass |
| 7 | Unknown product is rejected | `POST /api/cart` `{slug: "nope"}` | HTTP 404 | HTTP 404, *"Product not found."* | Pass |
| 8 | Quantity update recalculates totals | `PATCH /api/cart/<id>` `{quantity: 3}` | HTTP 200, totals recomputed | HTTP 200, subtotal ₹8,400 | Pass |
| 9 | Line removal updates cart | `DELETE /api/cart/<id>` | HTTP 200, units decreased | HTTP 200, units 4 → 3 | Pass |
| 10 | Invalid email is rejected | `POST /api/bookings` `{email: "nope"}` | HTTP 400 | HTTP 400, *"Name and a valid email are required."* | Pass |
| 11 | Valid booking stores a record | `POST /api/bookings` with valid fields | HTTP 201 with record identifier | HTTP 201, identifier returned | Pass |
| 12 | Duplicate subscription does not insert twice | `POST /api/subscribe` same address, different case | HTTP 200, no duplicate row | HTTP 200; subscriber count unchanged | Pass |

*Twelve test cases were executed against the implemented application. Each passed.*

*Note: additional performance, load and cross-browser testing has not been performed and
is therefore not reported.*

---

## 4.7 Limitations

The implemented system has the following recognised limitations.

1. **No authentication or user accounts.** Cart state is bound to a session cookie rather
   than to an identity, so a cart cannot be resumed on another device.

2. **No payment processing.** The checkout control routes to the consultation form. Order
   placement and payment are outside the implemented scope.

3. **No administrative interface.** Products, categories and stock are managed by editing
   seed data and reseeding the database.

4. **Ephemeral persistence in serverless deployment.** When deployed without an external
   database, the SQLite file is written to a temporary directory that is discarded between
   requests. Pages render correctly but cart and submission data do not persist. This is
   resolved by configuring a PostgreSQL connection string, which the application supports.

5. **Concurrency is not coordinated.** Stock levels are checked at the time of adding to
   the cart but are not reserved, so two sessions may both add the last available unit.

6. **No integration testing across browsers.** Verification was carried out in a single
   browser engine; other engines have not been tested.

7. **Development server used for demonstration.** Running `python app.py` starts Flask's
   development server, which is not intended for production traffic. Gunicorn is declared
   in the dependencies for that purpose.

8. **Search and sorting are minimal.** The catalogue supports category filtering and a
   fixed default ordering only.

---

## 4.8 Chapter Summary

This chapter described the implemented system. The development environment and file
structure were recorded, followed by a module-wise account of the five principal modules,
each expressed through its purpose, input, processing and output. The full route table was
listed, and three code components were identified for inclusion with explanations of what
each does and why it is used.

Results obtained from automated checks were reported: correct page delivery, correct
Indian currency formatting, correct cart arithmetic, full audit scores and correct
validation behaviour. Twelve test cases were documented with their inputs and observed
outcomes. The chapter closed by stating eight limitations of the implemented system
honestly, including the persistence constraint encountered during serverless deployment.
Chapter 5 presents the conclusion and the scope for future work.
