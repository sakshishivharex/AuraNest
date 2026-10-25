# Chapter 5 — Conclusion and Future Scope

---

## 5.1 Conclusion

This project set out to address a specific practical problem: a small retailer needs an
online storefront that presents a product catalogue, supports browsing and cart operations,
and accepts customer enquiries, without incurring the licensing cost of a hosted platform
or the structural complexity of a heavily abstracted front-end framework.

The proposed solution was a three-tier web application named AuraNest. The presentation
tier was authored directly in HTML, CSS and JavaScript, avoiding a build step so that the
served output corresponds closely to the authored source. The application tier was
implemented in Python using the Flask framework, exposing both server-rendered pages and
a JSON API from a single set of handlers. The data tier used a SQL database, implemented
with SQLite by default and PostgreSQL when a connection string is configured, with schema
expressed in two parallel files differing only in identity-column syntax.

The delivered functionality covers the complete browsing and selection cycle: a home page
with featured products, a filterable catalogue of eight products across three categories,
product detail pages with related items, a persistent cart supporting add, update, remove
and clear operations, and a consultation booking form with server-side validation.
Newsletter subscription is provided with duplicate suppression. Cart totals including a
₹1,500 delivery charge and a ₹50,000 free-delivery threshold are computed on the server.

Twelve design decisions worth recording emerged from the implementation. Prices are stored
as integer paise to avoid floating-point rounding and formatted with Indian digit grouping.
Cart lines are keyed by an opaque session identifier because no user accounts exist. All
queries use bound parameters. Schema and seed data are separated from application logic.
Client-side JavaScript enhances operations that already work without it. Input validation
is authoritative on the server. Each of these choices was made for a reason that can be
stated in a sentence, which is itself an argument for the transparency this project sought.

The system was verified against twelve test cases, all of which passed, covering page
delivery, filtering, cart arithmetic, validation failure handling and duplicate suppression.
Automated audits returned full scores for accessibility, best practices and search engine
optimisation on the principal pages. The application was also deployed to a serverless
platform, and in that process several environment-specific defects were identified that no
local test could have exposed.

The overall outcome is an application that functions as intended within its declared
scope, documented in a form that allows its complete request path to be understood. Its
limitations are stated explicitly in Section 4.7 and are consequences of deliberate
scoping decisions rather than incomplete work.

---

## 5.2 Future Scope

The following improvements are considered realistic extensions of the implemented system.

1. **Persistent database in deployment.** Configuring a hosted PostgreSQL instance
   through the existing `DATABASE_URL` mechanism would allow carts, bookings and
   subscriptions to survive between requests in a serverless environment. The application
   already supports this; it requires a database and a configuration value rather than
   new code.

2. **User accounts and authentication.** Introducing registration and login would allow a
   cart to be associated with an identity and resumed across devices. This would require
   password hashing, session management tied to a user record, and additional tables.

3. **Order placement and payment.** A checkout flow with address collection and an
   integration to a payment gateway would complete the transaction cycle. This is the
   single largest gap between the current state and a production storefront.

4. **Administrative interface.** A protected area for adding products, editing prices,
   adjusting stock and reviewing bookings would remove the need to edit seed data
   directly.

5. **Inventory reservation.** Stock could be decremented at the point of order rather
   than checked only at the point of cart addition, resolving the concurrency limitation
   described in Section 4.7.

6. **Search and sorting.** Adding a text search across product name and description, and
   allowing sorting by price or recency, would improve catalogue navigation as the
   product count grows.

7. **Mobile application.** The JSON API already exposes every operation, so a mobile
   client could be developed against the same endpoints without modifying the server.

8. **Email notifications.** Sending a confirmation for bookings and a welcome message for
   newsletter subscriptions would close the loop for user-facing feedback.

9. **Performance and caching.** Static asset caching headers, compression, and caching of
   read-heavy catalogue queries would reduce response latency under load.

10. **Automated testing.** The test cases documented in Table 4.2 could be converted into
    an automated suite executed before each deployment, preventing regressions during
    future modification.

---

## 5.3 Final Summary

The project was undertaken to build a working e-commerce web application while keeping its
structure simple enough to be understood in full. It delivered that outcome: a functional
storefront with catalogue browsing, category filtering, a persistent shopping cart,
consultation booking and a JSON API, built on HTML, CSS, JavaScript, Python, Flask and a
SQL database.

The approach validated its central premise. Separating presentation, logic and data into
distinct files, avoiding a build pipeline, and expressing schema in plain SQL produced a
system in which each request can be traced from route to database and back. It also
demonstrated that such an approach does not require sacrificing validation, accessibility
or correct handling of monetary values.

At the same time, the project made clear where its boundaries lie. It does not yet support
accounts, payments or administration, and it requires an external database for durable
persistence in a hosted environment. These are documented as limitations and identified
as the most valuable directions for further work.

Within the scope it set for itself, the system performs the functions it was designed to
perform, and it has been verified rather than assumed to do so.

---
