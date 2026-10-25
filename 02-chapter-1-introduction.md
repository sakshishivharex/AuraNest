# Chapter 1 — Introduction

---

## 1.1 Introduction

The manner in which consumers discover and purchase household products has changed
substantially over the past decade. What was once limited to physical showrooms and
printed catalogues now largely occurs through web applications, where a customer can
browse a collection, inspect specifications, evaluate price and complete a purchase
without leaving the browser. For a business operating in the home furnishings segment,
a functioning storefront is therefore not an optional addition but a practical
requirement.

Developing such a storefront, however, involves a set of concerns that extend well beyond
placing products on a page. The system must present a catalogue that can be browsed and
filtered, maintain the state of a shopping cart across user interactions, validate input
before it reaches storage, persist data reliably, and deliver all of this on devices of
varying screen sizes. Each of these concerns must be addressed in a way that remains
maintainable as the application grows.

**AuraNest** is a full-stack web application developed to address this problem for a home
furnishings brand. It is implemented as a three-tier system in which the presentation
layer is written directly in HTML, CSS and vanilla JavaScript, the application layer is
implemented in Python using the Flask framework, and the data layer uses a SQL database.
The system supports product browsing, category filtering, product detail views, cart
management and consultation booking, with monetary values expressed in Indian Rupees.

---

## 1.2 Background

**Current Situation.** Small and medium retailers generally reach customers through one of
three routes: a hosted commerce platform, a content management system extended with a
commerce plug-in, or a bespoke application developed in-house. Each route carries
different trade-offs. Hosted platforms remove the burden of maintenance but introduce
recurring costs and constrain how the interface may be designed. Content management
solutions offer greater flexibility in presentation but often require additional
configuration to support cart and inventory behaviour. Bespoke development offers the
greatest control but demands sustained technical effort.

**Importance of the Field.** Web application development remains important because the
delivery model has become the default expectation. A storefront must render correctly in a
browser, respond to network failures gracefully, remain usable with a keyboard, and
withstand malformed input. These are not decorative requirements; they determine whether
an interface can be used at all.

**Existing Problems.** Conventional approaches to storefront development frequently couple
presentation logic to a particular framework. In such designs, changing a layout or
adjusting a component's behaviour can require understanding a component model, a build
configuration and a templating abstraction simultaneously. This coupling raises the cost
of small changes and increases the likelihood of regression.

**Role of Technology.** The technologies selected for this project were chosen partly
because they do not require a build step. HTML, CSS and JavaScript can be inspected
directly in their final form, which makes debugging more direct. Server-side rendering
with a Python framework allows a page to be produced from database state in a single
request, avoiding the additional round trip that a purely client-side application would
require for initial content.

**Relevance of this Project.** The project is relevant because it demonstrates a complete
and coherent implementation of a commerce workflow using an approach that prioritises
transparency. The entire request path, from route handler through query execution to
template rendering, is short enough to be understood in full, which makes the application
suitable for academic study as well as for further extension.

---

## 1.3 Problem Statement

Small-scale retailers require an online storefront that presents a product catalogue,
supports browsing by category, allows customers to maintain a shopping cart and permits
enquiry or booking, without incurring the licensing overhead of a hosted commerce platform
or the maintenance complexity of a heavily abstracted front-end framework.

Existing approaches either impose recurring costs with limited control over presentation,
or couple presentation logic tightly to a framework's component model, raising the
effort required for routine modifications. The problem addressed by this project is the
design and implementation of a web application that satisfies the above functional
requirements while keeping the system structurally simple, inspectable and maintainable
by a single developer.

---

## 1.4 Motivation

This project was selected for two practical reasons.

The first was to develop an end-to-end understanding of web application development as an
integrated process rather than as a collection of independent topics. Academic curricula
typically present markup, styling, scripting, server-side programming and databases as
separate subjects. A working storefront requires all of them to function together, and the
points at which they interact are precisely where defects are most likely to appear.

The second was to build something functionally useful rather than demonstrative. The
application was required to handle real validation rules, real state management and real
data constraints. Several of the defects identified during development — such as the
behaviour of attribute lookup in templating engines — could only be observed in a working
system.

From a business perspective, the project addresses a genuine need: a retailer with a
limited catalogue requires a storefront that can be operated and extended without
dedicated engineering support.

---

## 1.5 Project Scope

**What the system covers.**

The implemented system supports the following operations:

- Displaying a home page containing featured products, collection summaries and service
  descriptions.
- Presenting a product catalogue that can be filtered by category.
- Displaying individual product pages with description, price, stock indicator and
  related products.
- Adding products to a shopping cart, either from the catalogue or the product page.
- Modifying quantities within the cart, removing individual lines and clearing the cart.
- Calculating subtotal, shipping charge and total, together with a free-delivery
  threshold notification.
- Retaining cart contents between requests using a signed session cookie.
- Submitting a consultation booking form, with server-side validation.
- Registering a newsletter subscription with duplicate suppression.
- Providing a JSON API for all catalogue and cart operations.
- Delivering a responsive layout including a collapsible mobile navigation menu.

**What the system does not cover.**

The following are explicitly outside the scope of the implemented project:

- User registration, authentication and account management.
- Payment processing or integration with a payment gateway.
- Order fulfilment, invoicing or shipping calculation based on address.
- An administrative interface for managing products, categories or orders.
- Real-time inventory synchronisation across concurrent users.
- Email delivery for bookings or newsletter confirmations.
- Search, sorting beyond the implemented default ordering, or product reviews.
- SSL/TLS termination, which is provided at the hosting layer rather than by the
  application.

The absence of these features is a deliberate scoping decision rather than an omission,
and each is revisited as a candidate for future work in Chapter 5.

---

## 1.6 Objectives

The objectives of the project are stated below in measurable terms.

1. To implement a three-tier web application separating presentation, application and
   data concerns into distinct layers.

2. To deliver a product catalogue of at least eight items across three categories,
   each with price, description, image and stock attributes, retrieved from a SQL
   database rather than embedded in markup.

3. To implement category-based filtering of the catalogue such that a request for a
   category returns only products belonging to that category.

4. To implement a persistent shopping cart supporting add, update, remove and clear
   operations, with quantities constrained by available stock.

5. To perform server-side validation of all user input, including email format, date
   range and quantity bounds, returning appropriate HTTP status codes on failure.

6. To store monetary values as integers, avoiding floating-point rounding errors, and
   to format them using Indian digit grouping conventions.

7. To expose a JSON API in parallel with server-rendered pages, such that every cart
   and catalogue operation is accessible programmatically.

8. To achieve a responsive layout that functions across desktop and mobile viewports
   without horizontal overflow.

9. To verify the implementation against a defined test suite covering page delivery,
   validation, cart behaviour and data integrity.

---

## 1.7 Significance of the Project

**For Users.** The primary benefit is a browsing experience that does not depend on
JavaScript for basic navigation. Product pages, the catalogue and the booking form are
server-rendered, so core content remains available if client-side scripts fail to load.
Cart operations additionally provide immediate feedback through visual state updates.

**For Organisations.** A retailer adopting this structure avoids recurring licence fees
and retains full ownership of the codebase and the data. Because the schema is expressed
in standard SQL with an equivalent version for PostgreSQL, the system can be migrated
between storage engines without rewriting application logic.

**For Students and Developers.** The application serves as a compact reference in which
every layer is small enough to be reviewed completely. The request lifecycle can be traced
from route registration, through parameter validation and query execution, to template
rendering, without encountering abstraction layers that must first be understood.

**For the Domain.** The project documents several practices relevant to web application
development more generally: the use of integer arithmetic for currency, parameterised
queries to prevent injection, the separation of schema from seed data, and the use of
placeholder-aware translation when supporting multiple database engines.

---

## 1.8 Technologies Used

**Table 1.1 — Technologies Used and Their Purpose**

| Technology | Purpose |
|------------|---------|
| HTML5 | Page structure and semantic markup for all templates |
| CSS3 | Styling, responsive layout and design tokens using the OKLCH colour space |
| Vanilla JavaScript | Mobile navigation, cart interactions and newsletter submission via `fetch` |
| Python 3 | Server-side application logic, validation and query construction |
| Flask 3.1.3 | HTTP routing, request handling, templating and session management |
| Jinja2 | Server-side template rendering and template inheritance |
| SQLite | Default development database; zero-configuration file-based SQL engine |
| PostgreSQL | Optional production database, selected through an environment variable |
| psycopg 3.3.6 | PostgreSQL driver, loaded only when PostgreSQL is in use |
| JSON | Response format for the application's REST-style API |
| Gunicorn 23.0.0 | Production WSGI server for deployment outside the development environment |
| Vercel | Serverless hosting platform targeted by the deployment configuration |

*Table 1.1 — Technology stack used in the AuraNest application.*

---

## 1.9 Chapter Summary

This chapter introduced AuraNest as a full-stack e-commerce web application for home
furnishings. It established the current context of storefront development, identified the
problem of excessive framework coupling in existing approaches, and stated a concise
problem statement. The motivations for undertaking the project were presented as both
academic and practical.

The scope was defined explicitly in both directions, distinguishing the functionality
delivered from the functionality deliberately excluded. Nine measurable objectives were
then specified, followed by an assessment of the project's significance to users,
organisations, developers and the wider domain. A technology table summarised the tools
employed and their roles. Chapter 2 examines the systems and approaches currently
available to address the problem and evaluates their limitations.
