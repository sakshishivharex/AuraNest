# Chapter 2 — Literature Review / Existing System

---

## 2.1 Overview of Existing Systems

The problem of presenting a product catalogue and maintaining a shopping cart is solved
by a large number of existing systems. These can be grouped into four broad categories.

**Hosted commerce platforms.** Services such as Shopify, BigCommerce and WooCommerce
Hosted provide a storefront together with inventory management, payment processing and
order tracking as a single subscription product. They are operationally convenient and
require no development effort to launch, but the merchant has limited influence over the
presentation layer and pays an ongoing fee whose structure may change.

**Content management systems with commerce plug-ins.** Systems such as WordPress
extended by WooCommerce, or Drupal with Drupal Commerce, keep content and commerce in a
single installation. This approach offers good control over presentation but requires
familiarity with the host platform's templating conventions, plug-in configuration and
update cycle. Customising cart behaviour frequently means overriding a plug-in's own
template files.

**Full-stack frameworks.** Frameworks including Django, Ruby on Rails, Laravel and ASP.NET
Core provide routing, templating, an ORM and often an administrative interface. They are
well suited to larger teams, but a substantial portion of the framework's capability lies
outside the needs of a single-catalogue storefront, and understanding its conventions
becomes a prerequisite to making even narrow changes.

**Single-page application stacks.** A common contemporary arrangement is to develop the
interface in React or Vue with a separate API service. This yields a highly responsive
interface once the initial bundle has loaded, but introduces a build pipeline, a
dependency tree and a separation between the code authored and the code executed. The
trade-off was considered and, for this project, rejected; the reasoning appears in
Section 2.5.

---

## 2.2 Existing Approaches

Several recurring techniques characterise the systems reviewed.

**Server-side rendering.** The server assembles the complete document for each request and
returns HTML. This remains the default for content-heavy and commerce sites because the
first response already contains meaningful content, which benefits indexing and reduces
the work performed by the client. Its principal limitation is that interactions requiring
a state change generally trigger a new request, unless handled asynchronously.

**Client-side rendering.** The server delivers a minimal document and the interface is
constructed in the browser from JavaScript. Interaction latency after the initial load is
low, but the document initially contains no content, which complicates search indexing and
makes the application dependent on script execution.

**Hybrid rendering.** Content pages are rendered on the server and interactive components
are hydrated on the client. This addresses the shortcomings of both approaches but
requires tooling capable of producing two rendering modes.

**Object-relational mapping.** An ORM presents database tables as language-level objects
and converts operations into generated SQL. It reduces repetitive query code and provides
useful abstractions for schema migration, at the cost of a layer whose behaviour must be
understood when queries need to be optimised or when a specific SQL construct has no
direct expression.

**Session-based cart state.** A cart is most commonly held either entirely on the client,
in browser storage, or on the server keyed by an identifier stored in a cookie. The
server-side approach permits validation against stock and price at the moment of reading,
and prevents the client from asserting a value the application has not confirmed.

**Parameterised queries.** Data access through prepared statements, in which values are
bound separately from the query text, is a well-established protection against SQL
injection. This technique is applied throughout the implementation described in this
report.

---

## 2.3 Limitations of Existing Systems

The limitations listed below are those relevant to the requirements of this project.

**Excessive coupling between presentation and framework.** In component-based stacks, a
change to layout frequently requires understanding a component's lifecycle, state
propagation and build configuration. Routine interface modifications therefore carry a
disproportionate cost.

**Build pipelines and tooling overhead.** A compilation step between authored source and
served output introduces caching, configuration and version-maintenance concerns. For a
small catalogue it also means that the file inspected during debugging is not the file
executed by the browser.

**Recurring licensing cost.** Hosted platforms charge continuously, and the cost is
unrelated to the size of the catalogue. A retailer with eight products and a retailer with
eight thousand may pay comparable fees.

**Limited control over data.** Hosted platforms expose data through their own interfaces
and may restrict direct database access. Exporting the catalogue, migrating to another
service, or producing a custom report can consequently become difficult.

**Abstraction leakage in data access.** ORMs perform well for conventional operations but
often require escaping to raw SQL for aggregate queries, joins with specific behaviour, or
performance work. The developer must then understand both the ORM and the underlying SQL.

**Validation inconsistencies.** Applications that validate input only in the browser
accept any data submitted by a client that bypasses the interface. Server-side validation
must therefore be treated as the authoritative check.

**Currency precision.** Representing monetary values as floating-point numbers introduces
rounding errors that accumulate during multiplication and summation. Shopping carts are
particularly exposed to this, since totals are derived from repeated multiplication.

**Accessibility gaps.** Interfaces assembled without semantic markup or explicit labelling
become unusable for keyboard-only and screen-reader users. This limitation is common in
markup generated dynamically without deliberate attention to document structure.

---

## 2.4 Comparative Analysis

**Table 2.1 — Comparative Analysis of Existing and Proposed Systems**

| Feature | Hosted Commerce Platform | Component-Based SPA | Proposed System (AuraNest) |
|---------|:------------------------:|:-------------------:|:--------------------------:|
| Monthly licensing cost | Yes | No (tooling cost) | No |
| Build step required | No | Yes | No |
| Direct database access | Restricted | Through API only | Full |
| Server-side rendering | Varies | Generally no | Yes |
| Works with JavaScript disabled | Partial | No | Yes |
| Cart validation server-side | Yes | Yes | Yes |
| Integer-based currency storage | Platform dependent | Not guaranteed | Yes (integer paise) |
| Framework lock-in | High | Moderate | Low |
| Source inspection without tooling | No | No | Yes |
| SQL dialect portable | No | No | Yes (SQLite / PostgreSQL) |
| Administrative interface | Yes | Varies | Not implemented |
| Payment processing | Yes | Varies | Not implemented |
| Customisable presentation | Limited | High | High |
| Deployment target | Vendor-controlled | Any host | Any WSGI host / serverless |

*Table 2.1 — Comparison across functional and operational dimensions.*

The comparison indicates that the proposed system matches hosted platforms on operational
simplicity and matches component-based systems on presentation flexibility, while avoiding
the recurring cost of the former and the build requirement of the latter. The trade-off is
the absence of an administrative interface and payment processing, both of which are
declared outside scope in Section 1.5.

---

## 2.5 Research Gap / Need for Proposed System

Three specific gaps motivate the proposed system.

**The inspectability gap.** In a compiled front-end application, the markup executed by the
browser is generated from components that the developer does not directly edit. During
academic study and during maintenance, this indirection adds a step between observation
and correction. A system in which the served output corresponds closely to the authored
source removes that step.

**The scale-appropriateness gap.** Existing solutions tend to sit at either extreme: a
lightweight script that handles no data, or a full framework with an administrative
interface, ORM, migrations and authentication. A catalogue of eight to a few hundred
products does not require the latter, yet still requires more than the former offers. The
proposed system occupies the intermediate position.

**The portability gap.** Applications built for a specific managed database service are
difficult to move. Storing schema in plain SQL, keeping queries in a single database-agnostic
layer and translating only placeholder syntax allows the same application to run against
SQLite during development and PostgreSQL in production without duplicating logic.

The proposed system addresses these gaps through direct authoring of markup and styling,
a deliberately minimal application layer consisting of a single routing module and a
single data-access module, and a database layer that selects its driver from configuration
rather than from application code.

---

## 2.6 Proposed Solution

The proposed solution is a three-tier application structured as follows.

The **presentation tier** consists of eight HTML templates using a shared base layout,
one stylesheet containing design tokens and component styles, and one JavaScript file
handling progressive enhancements. Templates are rendered on the server.

The **application tier** is a Python module that registers routes, validates input,
constructs parameterised queries and returns either rendered HTML or JSON. It exposes
twenty-one HTTP routes covering seven pages and thirteen API operations.

The **data tier** is a SQL database containing five tables. The driver is chosen at
runtime: SQLite when no external connection string is provided, PostgreSQL when one is.
Schema definitions are held in two parallel files that differ only in identity-column
syntax.

Cart state is maintained by assigning a random identifier to a session cookie and storing
cart lines against that identifier. Monetary values are stored as integer paise and
formatted using Indian digit grouping. Validation is performed on the server for every
write operation.

---

## 2.7 Chapter Summary

This chapter reviewed the four categories of existing solution relevant to online
storefronts and identified the techniques commonly used in their construction. It then
enumerated limitations of those solutions, restricting the list to those bearing on the
project's requirements.

A comparative table evaluated three approaches across thirteen dimensions, making clear
both what the proposed system achieves and what it deliberately omits. Three research gaps
were identified — inspectability, scale-appropriateness and portability — and the proposed
solution was described in terms of how each is addressed. Chapter 3 presents the
requirements analysis, architecture and database design of the implemented system.
