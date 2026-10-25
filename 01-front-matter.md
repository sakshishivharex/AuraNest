# Front Matter

---

## 1. Title Page

<center>

**Chandigarh University**

**Department of Computer Applications**

---

**PROJECT REPORT**

---

# AuraNest

### A Full-Stack E-Commerce Web Application for Home Furnishings

---

**Submitted in partial fulfilment of the requirements for the degree of**

**Master of Computer Applications (MCA)**

---

**Submitted by:**

| | |
|---|---|
| Name | Sakshi Shivhare |
| UID | 26mca20173 |
| Programme | Master of Computer Applications (MCA) |
| Academic Session | 2026–2028 |
| Semester | 1st |

---

**Under the guidance of**

**[PROJECT GUIDE]**

**Department of Computer Applications**

---

**Date:** 12 October 2026

</center>

---

## 2. Certificate

<center>

**Chandigarh University**

**Department of Computer Applications**

---

### CERTIFICATE

</center>

This is to certify that the project report entitled **"AuraNest — A Full-Stack E-Commerce
Web Application for Home Furnishings"** is a bonafide record of project work carried out
by

**Sakshi Shivhare**

bearing UID **26mca20173**, in partial fulfilment of the requirements for the award of the degree
of **Master of Computer Applications**, Department of Computer Applications, Chandigarh
University, during the academic session **2026–2028**.

The work embodied in this report has been carried out under my supervision and guidance,
and to the best of my knowledge the candidate has satisfied the requirements prescribed
for this project.

The candidate has duly acknowledged all sources consulted in the preparation of this report.

| | |
|---|---|
| | |
| **Project Guide** | **Head of Department** |
| [PROJECT GUIDE] | [HOD NAME] |
| Signature | Signature |

| | |
|---|---|
| | |
| **External Examiner** | **Date:** 12 October 2026 |
| [EXAMINER NAME] | |
| Signature | |

</center>

---

## 3. Declaration

I hereby declare that the project report entitled **"AuraNest — A Full-Stack E-Commerce
Web Application for Home Furnishings"** submitted to the Department of Computer
Applications, Chandigarh University, is a record of my own work carried out under the
guidance of **[PROJECT GUIDE]** during the academic session **2026–2028**.

This work has not been submitted, in whole or in part, to any other university, institution
or organisation for the award of any degree, diploma, fellowship or other similar title.

I further declare that all sources of information used have been duly acknowledged and
that this report does not contain any unlawful or plagiarised material.

| | |
|---|---|
| **Place:** Chandigarh University | |
| **Date:** 12 October 2026 | **Signature** |
| | **Sakshi Shivhare** |
| | **UID: 26mca20173** |

---

## 4. Acknowledgement

I wish to express my sincere gratitude to all those who contributed to the successful
completion of this project.

First and foremost, I am deeply grateful to **Chandigarh University** for providing the
academic environment, laboratory facilities and technical resources that made this work
possible. The infrastructure and learning opportunities extended by the university have
been instrumental in shaping the direction of this project.

I extend my heartfelt thanks to the **Department of Computer Applications** for its
continuous academic support and for fostering an atmosphere in which students are
encouraged to apply theoretical knowledge to practical problem solving.

My deepest appreciation goes to my **project guide, [PROJECT GUIDE]**, for the constant
guidance, patience and constructive criticism offered throughout the development of this
project. The regular discussions helped clarify the system design at several stages where
my own approach lacked rigour, and the suggestions regarding documentation quality
improved the final report considerably.

I am also thankful to the **faculty members of the Department of Computer Applications**
for the knowledge imparted during the course of this programme. Concepts relating to
databases, software engineering and web technologies that were taught in the classroom
found direct application in this work.

I acknowledge the support of my **classmates and friends**, who participated in informal
discussions, identified problems during testing and offered suggestions for improving the
usability of the application. Their observations were especially useful in the later stages
of interface refinement.

Finally, I thank my **family** for their encouragement, understanding and support during
the preparation of this report.

While I have received guidance from many individuals, any errors or omissions that remain
in this report are entirely my own.

---

## 5. Abstract

The growth of online retail has made web-based storefronts a standard expectation for
businesses of every scale, yet small and medium enterprises frequently lack access to
development approaches that are both affordable and understandable. Proprietary commerce
platforms impose recurring licensing costs and limited customisation, while template-based
systems often couple presentation logic tightly to a specific framework, making them
difficult to maintain when requirements change. This project addresses that gap through
the design and development of **AuraNest**, an e-commerce web application for a home
furnishings brand.

The objective was to build a storefront that separates concerns clearly between structure,
presentation, business logic and data, without relying on a front-end framework or a
build pipeline. The motivation for this approach was twofold: to keep the system
inspectable end to end, and to reduce the number of moving parts that a developer must
understand before making a change.

The proposed solution uses a three-tier architecture. **HTML**, **CSS** and
**vanilla JavaScript** form the presentation tier, authored directly as static templates
rather than compiled from components. A **Python** application built on the **Flask**
framework implements the application tier, exposing both server-rendered pages and a
JSON API. A **SQL** database forms the data tier, implemented with **SQLite** for
development and optionally **PostgreSQL** for deployment, accessed through a common
abstraction so that queries remain driver independent.

The implemented functionality covers the full browsing and selection cycle: a home page,
a filterable product catalogue, product detail pages with related items, a persistent
shopping cart with quantity management, and a consultation booking form. Supporting
features include newsletter subscription, category-based filtering, a mobile navigation
menu and a responsive layout. Monetary values are stored as integer paise and displayed
using Indian digit grouping conventions, which avoids floating-point rounding errors
commonly associated with currency arithmetic.

The database consists of five tables covering categories, products, cart contents,
subscribers and bookings, with foreign-key constraints and uniqueness rules enforcing
data integrity. Cart state is tracked through a signed session cookie referencing a
server-side identifier, keeping client-side state minimal while preserving cart contents
across requests.

The application was verified against a defined test suite covering page delivery,
validation failures, cart operations and data integrity checks. Automated audits of
accessibility, best practices and search engine optimisation returned full scores across
the principal pages. A deployment configuration for a serverless platform was also
prepared and validated, and in doing so several environment-specific defects were
identified and corrected.

Future work includes integrating a hosted database for durable persistence, introducing
an order fulfilment and payment workflow, adding an administrative interface for catalogue
management, and extending the interface to mobile application platforms.

---

## 6. Table of Contents

| Section | Title | Page |
|---------|-------|-----:|
| | **Front Matter** | |
| | Title Page | 1 |
| | Certificate | 2 |
| | Declaration | 3 |
| | Acknowledgement | 4 |
| | Abstract | 5 |
| | Table of Contents | 6 |
| | List of Figures | 7 |
| | List of Tables | 7 |
| | List of Abbreviations | 7 |
| **Chapter 1** | **Introduction** | **8** |
| 1.1 | Introduction | 8 |
| 1.2 | Background | 8 |
| 1.3 | Problem Statement | 9 |
| 1.4 | Motivation | 9 |
| 1.5 | Project Scope | 9 |
| 1.6 | Objectives | 10 |
| 1.7 | Significance of the Project | 10 |
| 1.8 | Technologies Used | 11 |
| 1.9 | Chapter Summary | 11 |
| **Chapter 2** | **Literature Review / Existing System** | **12** |
| 2.1 | Overview of Existing Systems | 12 |
| 2.2 | Existing Approaches | 12 |
| 2.3 | Limitations of Existing Systems | 13 |
| 2.4 | Comparative Analysis | 13 |
| 2.5 | Research Gap / Need for Proposed System | 14 |
| 2.6 | Proposed Solution | 14 |
| 2.7 | Chapter Summary | 14 |
| **Chapter 3** | **System Analysis and Design** | **15** |
| 3.1 | System Requirements | 15 |
| 3.2 | Hardware Requirements | 16 |
| 3.3 | Software Requirements | 16 |
| 3.4 | System Architecture | 16 |
| 3.5 | System Workflow | 17 |
| 3.6 | Data Flow / Module Design | 17 |
| 3.7 | Database Design | 18 |
| 3.8 | Algorithm / Methodology | 19 |
| 3.9 | Chapter Summary | 19 |
| **Chapter 4** | **Implementation and Results** | **20** |
| 4.1 | Development Environment | 20 |
| 4.2 | Module-wise Implementation | 20 |
| 4.3 | Important Code Components | 22 |
| 4.4 | User Interface | 23 |
| 4.5 | Results | 24 |
| 4.6 | Testing | 24 |
| 4.7 | Limitations | 25 |
| 4.8 | Chapter Summary | 25 |
| **Chapter 5** | **Conclusion and Future Scope** | **26** |
| 5.1 | Conclusion | 26 |
| 5.2 | Future Scope | 26 |
| 5.3 | Final Summary | 27 |
| | References | 28 |
| | Appendix A — Important Code | 29 |
| | Appendix B — Additional Screenshots | 29 |
| | Appendix C — Sample Input/Output | 30 |

> **Note:** The page numbers above are indicative placeholders. Regenerate this table in
> MS Word using *References → Table of Contents* after all content has been inserted and
> formatted.

---

### List of Figures

| Figure | Caption | Section |
|--------|---------|---------|
| Figure 3.1 | System Architecture | 3.4 |
| Figure 3.2 | System Workflow Flowchart | 3.5 |
| Figure 3.3 | Database Entity Relationship Diagram | 3.7 |
| Figure 4.1 | Home Page | 4.4 |
| Figure 4.2 | Product Catalogue | 4.4 |
| Figure 4.3 | Shopping Cart | 4.4 |
| Figure 4.4 | Consultation Booking Form | 4.4 |
| Figure 4.5 | Cart Operations Output | 4.5 |
| Figure B.1 | Product Detail Page | Appendix B |
| Figure B.2 | Mobile Navigation | Appendix B |

### List of Tables

| Table | Caption | Section |
|-------|---------|---------|
| Table 1.1 | Technologies Used and Their Purpose | 1.8 |
| Table 2.1 | Comparative Analysis of Existing and Proposed Systems | 2.4 |
| Table 3.1 | Functional Requirements | 3.1.1 |
| Table 3.2 | Non-Functional Requirements | 3.1.2 |
| Table 3.3 | Hardware Requirements | 3.2 |
| Table 3.4 | Software Requirements | 3.3 |
| Table 3.5 | Module Specifications | 3.6 |
| Table 3.6 | Database Tables and Key Attributes | 3.7 |
| Table 4.1 | HTTP Routes Exposed by the Application | 4.2 |
| Table 4.2 | Test Cases and Results | 4.6 |

### List of Abbreviations

| Abbreviation | Expansion |
|--------------|-----------|
| API | Application Programming Interface |
| CPU | Central Processing Unit |
| CRUD | Create, Read, Update, Delete |
| CSS | Cascading Style Sheets |
| DBMS | Database Management System |
| DOM | Document Object Model |
| HTML | HyperText Markup Language |
| HTTP | HyperText Transfer Protocol |
| INR | Indian Rupee |
| JS | JavaScript |
| JSON | JavaScript Object Notation |
| MCA | Master of Computer Applications |
| ORM | Object-Relational Mapping |
| RAM | Random Access Memory |
| REST | Representational State Transfer |
| SDK | Software Development Kit |
| SQL | Structured Query Language |
| SSL | Secure Sockets Layer |
| TLS | Transport Layer Security |
| URI | Uniform Resource Identifier |
| URL | Uniform Resource Locator |
| UI | User Interface |
| UML | Unified Modeling Language |
| WSGI | Web Server Gateway Interface |
| XML | Extensible Markup Language |
