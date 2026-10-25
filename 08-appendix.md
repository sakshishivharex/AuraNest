# Appendix

---

## Appendix A — Important Code

Code is reproduced directly from the submitted source files.

### A.1 Indian Currency Formatter

**Source file:** `app.py`

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

*Rounding behaviour: the value is converted to integer paise, divided by 100 into
rupees and remainder, and the remainder is rendered as two decimal digits when
non-zero. `280000` → `₹2,800`; `5000` → `₹50.00`; `0` → `₹0`.*

### A.2 Cart Line Upsert and Quantity Clamping

**Source file:** `app.py`

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

*Visible here: the stock clamp and the ten-per-line clamp on one `min()` line, and
the `ON CONFLICT ... DO UPDATE` clause that makes a repeated addition increment the
existing line instead of creating a duplicate row.*

### A.3 Driver Selection and Placeholder Translation

**Source file:** `db.py`

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

### A.4 Connection Management, Error Mapping and Initialisation

**Source file:** `db.py`

```python
def get_db():
    """One connection per request, stored on flask.g."""
    if "db" not in g:
        if USING_POSTGRES:
            g.db = _PostgresConn(DATABASE_URL)
        else:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            conn.execute("PRAGMA foreign_keys = ON")
            g.db = conn
    return g.db


def unique_violation_error():
    """The driver's UNIQUE-constraint exception.

    app.py catches this for duplicate newsletter signups; the type differs
    between sqlite3 and psycopg, so callers use this instead of importing
    either driver directly. psycopg is only imported when Postgres is in use.
    """
    if USING_POSTGRES:
        import psycopg.errors
        return psycopg.errors.UniqueViolation
    return sqlite3.IntegrityError


def init_db() -> None:
    """Create tables if missing, then seed when the catalog is empty.

    Runs on import, not just under __main__: on Vercel the module is imported
    as ``app``, so a __main__-only call would never create the tables.
    """
    if USING_POSTGRES:
        conn = _PostgresConn(DATABASE_URL)
    else:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
    try:
        _apply_schema(conn)
        conn.commit()
        if _is_empty(conn):
            seed(conn)
    finally:
        conn.close()
```

### A.5 Schema Definition

**Source file:** `schema.sql`

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    slug        TEXT    NOT NULL UNIQUE,
    name        TEXT    NOT NULL,
    tagline     TEXT,
    image       TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    slug         TEXT    NOT NULL UNIQUE,
    name         TEXT    NOT NULL,
    category_id  INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    -- Money stored as integer paise (1 rupee = 100 paise) to avoid float rounding.
    price_paise  INTEGER NOT NULL CHECK (price_paise >= 0),
    description  TEXT    NOT NULL DEFAULT '',
    image        TEXT,
    stock        INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    featured     INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
    created_at   TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category  ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured  ON products (featured);
CREATE INDEX IF NOT EXISTS idx_products_price     ON products (price_paise);

CREATE TABLE IF NOT EXISTS cart_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    cart_id     TEXT    NOT NULL,
    product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity    INTEGER NOT NULL CHECK (quantity > 0),
    created_at  TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (cart_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items (cart_id);

CREATE TABLE IF NOT EXISTS subscribers (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT    NOT NULL UNIQUE,
    created_at  TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,
    email           TEXT    NOT NULL,
    phone           TEXT,
    service         TEXT    NOT NULL DEFAULT 'Full-home styling',
    preferred_date  TEXT,
    message         TEXT    NOT NULL DEFAULT '',
    created_at      TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings (preferred_date);
```

*The PostgreSQL equivalent, `schema.postgres.sql`, is identical except that primary
keys use `SERIAL` instead of `INTEGER PRIMARY KEY AUTOINCREMENT`.*

### A.6 Cart Fetch and State Update

**Source file:** `static/js/main.js`

```javascript
var api = {
  get: function (url) {
    return fetch(url, { credentials: "same-origin" });
  },
  send: function (url, method, body) {
    return fetch(url, {
      method: method,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {})
    });
  }
};

function updateBadge(units) {
  var badge = document.querySelector("[data-cart-count]");
  if (!badge) return;
  badge.textContent = units;
  badge.hidden = !units;
}
```

---

## Appendix B — Additional Screenshots

**Figure B.1 — Product Detail Page**

[INSERT SCREENSHOT HERE]

**Figure B.2 — Mobile Navigation Menu (Expanded)**

[INSERT SCREENSHOT HERE]

**Figure B.3 — Validation Error Message Displayed on the Booking Form**

[INSERT SCREENSHOT HERE]

*Captions must appear below each figure, consistent with Section 4.4.*

---

## Appendix C — Sample Input / Output

### C.1 Seed Catalogue

The following records are inserted automatically when the database is created.

| Product Name | Price (₹) | Stock | Featured |
|--------------|----------:|------:|:--------:|
| Terracotta Vessel | 2,800 | 24 | Yes |
| Arch Oak Mirror | 12,500 | 11 | Yes |
| Oatmeal Knit Throw | 4,200 | 42 | Yes |
| Sculpted Oak Stool | 9,800 | 8 | Yes |
| Linen Slipcover Sofa | 68,000 | 6 | No |
| Paper Lantern Pendant | 7,600 | 15 | No |
| Brass Table Lamp | 13,500 | 9 | No |
| Boucle Cushion Pair | 5,400 | 30 | No |

*Prices are stored in the database as integer paise (for example, `280000`) and
formatted at render time.*

### C.2 Sample API Request and Response

**Request**

```http
POST /api/cart HTTP/1.1
Content-Type: application/json

{"slug": "terracotta-vessel", "quantity": 2}
```

**Response**

```json
[INSERT ACTUAL RESPONSE HERE]
```

**Request**

```http
PATCH /api/cart/1 HTTP/1.1
Content-Type: application/json

{"quantity": 3}
```

**Response**

```json
[INSERT ACTUAL RESPONSE HERE]
```

### C.3 Sample Cart Totals

| Quantity | Subtotal | Delivery | Total |
|---------:|---------:|---------:|------:|
| 2 × ₹2,800 | ₹5,600 | ₹1,500 | ₹7,100 |
| 3 × ₹2,800 | ₹8,400 | ₹1,500 | ₹9,900 |
| 1 × ₹68,000 | ₹68,000 | ₹0 | ₹68,000 |

*Free delivery is applied when the subtotal reaches or exceeds ₹50,000.*

### C.4 Seeded Categories

| Slug | Name |
|------|------|
| seating | Seating |
| lighting | Lighting |
| textiles | Textiles |

---

*End of Report*
