# MCA Project Report — AuraNest

**Project Title:** AuraNest — A Full-Stack E-Commerce Web Application for Home Furnishings
**Programme:** Master of Computer Applications (MCA)
**University:** Chandigarh University
**Department:** Department of Computer Applications

---

## Document Structure

The report is split into separate files so each section can be edited, reviewed and
copied into MS Word independently. Merge them in the order shown below.

| # | File | Contents | Est. Pages |
|---|------|----------|-----------:|
| 1 | `01-front-matter.md` | Title Page, Certificate, Declaration, Acknowledgement, Abstract, Table of Contents, List of Figures, List of Tables, List of Abbreviations | 6 |
| 2 | `02-chapter-1-introduction.md` | Chapter 1 — Introduction | 2.5 |
| 3 | `03-chapter-2-literature-review.md` | Chapter 2 — Literature Review / Existing System | 2.5 |
| 4 | `04-chapter-3-system-analysis-design.md` | Chapter 3 — System Analysis and Design | 3.0 |
| 5 | `05-chapter-4-implementation-results.md` | Chapter 4 — Implementation and Results | 3.5 |
| 6 | `06-chapter-5-conclusion.md` | Chapter 5 — Conclusion and Future Scope | 1.5 |
| 7 | `07-references.md` | References | 0.5 |
| 8 | `08-appendix.md` | Appendix A–C | 0.5 |
| 9 | `09-information-needed.md` | Values required to replace `[TO BE ADDED]` | — |
| | | **Total** | **≈ 20** |

`README.md` (this file) is an index only and is not part of the submitted report.

---

## Estimated Page Allocation

```
Front matter   ████████████████████  6.0 pages
Chapter 1      █████████             2.5 pages
Chapter 2      █████████             2.5 pages
Chapter 3      ███████████           3.0 pages
Chapter 4      █████████████         3.5 pages
Chapter 5      █████                 1.5 pages
References     ██                    0.5 pages
Appendix       ██                    0.5 pages
                              ────────────────
                              ≈ 20 pages
```

Figure and table placements are marked inline as `[INSERT ... HERE]`. Inserting the
ten screenshots and two diagrams listed in Section 6 will push the report toward the
upper end of the 15–20 page range.

---

## Formatting Specification

Apply once, globally, in MS Word:

| Element | Setting |
|---------|---------|
| Font | Times New Roman |
| Body text | 12 pt, justified |
| Chapter heading | 16 pt bold |
| Main heading (1.1, 2.3) | 14 pt bold |
| Subheading (3.1.1) | 12 pt bold |
| Line spacing | 1.15–1.5 |
| Margins | Normal (2.54 cm all sides) |
| Page numbers | Bottom centre |
| Table captions | Above table, centred |
| Figure captions | Below figure, centred |
| Heading numbering | `Chapter N` → `N.M` → `N.M.P` |

---

## Split Reports (frontend / backend / database)

| Folder | Report | Docx |
|---|---|---|
| `frontend/` | `report.md` — templates, styling, JS, accessibility | `AuraNest Frontend Report - Sakshi Shivhare.docx` |
| `backend/` | `report.md` — routes, validation, cart logic, API | `AuraNest Backend Report - Sakshi Shivhare.docx` |
| `database/` | `report.md` — schema, constraints, drivers, seed | `AuraNest Database Report - Sakshi Shivhare.docx` |

Rebuild all docx:

```
python build_docx.py                       # combined report (01–08)
python build_docx.py frontend/report.md    # one split report
python build_docx.py backend/report.md
python build_docx.py database/report.md
```

---

## Submission Checklist

- [x] Student name, UID, semester, place and date filled in (Sakshi Shivhare, 26mca20173, 1st, CU, 12 October 2026)
- [x] Editor/IDE not mentioned anywhere
- [x] Code snippets attached — Section 4.3 and Appendix A (real `app.py`, `db.py`, `schema.sql`, `main.js`)
- [ ] Project guide name, HOD name (left blank)
- [ ] Insert architecture diagram (Section 3.4)
- [ ] Insert workflow flowchart (Section 3.5)
- [ ] Insert ER diagram (Section 3.7)
- [ ] Insert 6 screenshots (Sections 4.4, 4.5, Appendix B)
- [ ] Capture API responses for Appendix C.2
- [ ] Verify Table of Contents matches final headings
- [ ] Convert Markdown tables to Word table styles
- [ ] Confirm page count is 15–20 after rendering
