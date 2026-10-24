# Design Profile

> Status: **Draft v0.1** · Started 2026-10-22 · Owner: design
>
> This is the source of truth for how the product looks, feels and behaves. Every rule here traces back to a recorded decision (§10). If you want to break a rule, add a decision first and leave the rule alone until then.
>
> It was written from the product, not from the existing UI. Any overlap with the current build is a coincidence.

---

## 1. The thesis: the Shoebox and the Ledger

Every small-business accountant knows the client who shows up with **a shoebox**: crumpled receipts, a sticky note with a phone number, an IRS letter folded in four, a bank statement with a coffee ring. The accountant's job is to turn that box into **a ledger page**: ruled, columned, ticked, totalled, with one line at the bottom that says what to do.

That is this product. The user hands us the shoebox (a messy free-text description, maybe a file). We hand back the ledger page (category, extracted facts, urgency, confidence, the bottom line).

**Money** = the ledger: columnar paper, rules, tabular figures, tick marks, double underlines, stamps, discipline.
**Mess** = the shoebox: thermal receipts, torn edges, highlighter, pencil, staples, the owner's own words.

The design never fakes either one. Mess is always *the user's* material, shown with respect. Order is always *our* output, earned by the work. The interface is the desk where one becomes the other.

### What this rules in
- Real materials from real bookkeeping: columnar pads, thermal receipts, rubber stamps, auditor tick marks, pencil versus ink, carbon copies, staples, file folders.
- Domain conventions used *as interface*: the double rule under a total, the suspense account, "pencil it in", the bottom line.

### What this rules out
- Generic "AI app" visuals (see §9). No sparkles, no gradients that only show it's a product, no glass.
- Skeuomorphism for its own sake. A material appears only if it *carries meaning* (§2.3).
- Cuteness. The user may be about to miss payroll.

---

## 2. Principles

### 2.1 The worksheet, not the brochure
The result should read like a senior accountant's worksheet: quiet, precise, dense with information, small confident type. Reassurance comes from **order**, not from friendliness or decoration. *(D-003)*

### 2.2 Their mess, our order
Two material families, never mixed up:

| | Belongs to the user (mess) | Belongs to the system (order) |
|---|---|---|
| Surface | Thermal receipt paper, torn edge | Columnar ledger paper, ruled |
| Marks | Highlighter, staples | Ink, tick marks, stamps, double rules |
| Type | Their words, verbatim, sans | Our structure: serif verdicts, condensed column heads |
| Shape | Irregular edges allowed | Square-cut, aligned to the grid |

A user's message must never be rendered on ledger paper, and a system result must never look torn or handwritten. *(D-004)*

### 2.3 Every texture has a job
Tactile texture appears throughout *(D-002)*, but each one must answer "what does this tell the user?":

| Material | Meaning it carries |
|---|---|
| Ledger rules | "This has been organised" |
| Receipt paper + torn edge | "These are your words, as you gave them" |
| Highlighter | "We found this fact here, in what you said" |
| Tick mark ✓ | "This fact was extracted and checked" |
| Pencil (graphite) | "Provisional: low confidence" |
| Ink | "Committed: confident" |
| Rubber stamp | "Urgency verdict" |
| Staple | "A file is attached" |
| Double rule | "This is the bottom line" |
| Carbon blue | "A copy or reference, not the original" |

If a texture can't be justified this way, delete it.

### 2.4 Pencil until it's ink
Confidence is shown through a real bookkeeping convention: provisional entries go in pencil and get inked once confirmed. A low-confidence result renders in **pencil state** (§6.7). No percentage bars, no gauges. *(D-008)*

### 2.5 The bottom line is literal
Every result ends with one recommended action, set **below a double rule**, the same way a final total sits in accounting. It is the most important line on the screen, and it is in the place an accountant's eye already goes. *(D-007)*

### 2.6 Calm under pressure
Urgency is communicated once, clearly, with a stamp. It never comes as flashing, red backgrounds, toasts or exclamation marks. The page gets *more* orderly as stakes rise, not louder.

---

## 3. Color

### 3.1 Palette philosophy
Colors are **inks and papers**, named for the physical thing they imitate. Hue is semantic. It is never used to decorate, and never to tell categories apart *(D-010)*. There is no brand gradient.

Green is the money color, but it is **printed green**: the deep, desaturated green of banknote ink and columnar-pad rules. It is never fintech mint or neon. *(D-005)*

### 3.2 Light theme: "Desk"

| Token | Hex | Material / use |
|---|---|---|
| `--paper` | `#EFF2E8` | Page ground. Columnar-pad paper, faint green-grey. Never pure white. |
| `--paper-sheet` | `#F7F8F2` | Raised sheet (result ledger, dialogs) |
| `--receipt` | `#FAFAF7` | Thermal receipt: the user's messages and the composer |
| `--rule` | `#A9C3A6` | Ledger rules, column dividers (decorative, non-text) |
| `--rule-strong` | `#7FA07C` | Header rules, table edges |
| `--margin-red` | `#C9604A` | The vertical margin rule and the double rule above the bottom line |
| `--ink` | `#1C2621` | Primary text. Iron-gall near-black with a green cast. |
| `--graphite` | `#565D58` | Secondary text, labels |
| `--pencil` | `#6B6F6A` | Low-confidence (pencil state) text. 4.5:1 minimum is respected. |
| `--ledger-green` | `#2D5A40` | Primary action fill, positive or committed marks, the brand |
| `--stamp-red` | `#A3302A` | Critical/high urgency stamps, destructive actions |
| `--carbon` | `#2B3784` | Links, references, copies, case IDs |
| `--highlighter` | `#F1DF74` | Fact highlights in the user's text (background only) |

### 3.3 Dark theme: "Binding"
Dark mode is **not** inverted paper. It is the other material on an accountant's desk: the **cloth binding of a ledger book**, deep green-black with dim sheets on top. It gets full parity: every component is designed for both. *(D-006)*

| Token | Hex | Note |
|---|---|---|
| `--paper` | `#111713` | Binding cloth |
| `--paper-sheet` | `#19201B` | Sheet on the binding |
| `--receipt` | `#1F2521` | Receipt (warmer, lifted) |
| `--rule` | `#2C3D31` | |
| `--rule-strong` | `#3F5745` | |
| `--margin-red` | `#B8604F` | |
| `--ink` | `#E5E9DD` | |
| `--graphite` | `#A3AAA2` | |
| `--pencil` | `#8E948D` | |
| `--ledger-green` | `#8FC4A0` | Used as text/marks. Filled buttons use ink-on-green (see 3.4). |
| `--stamp-red` | `#EE8A7C` | |
| `--carbon` | `#9EA9F0` | |
| `--highlighter` | `#4A4318` | Becomes a dull ochre band so it doesn't glow |

### 3.4 Verified contrast (WCAG 2.x)
All text pairs pass AA (4.5:1) on every surface they appear on. Measured values:

| Pair | Light (paper / sheet / receipt) | Dark (paper / sheet / receipt) |
|---|---|---|
| ink | 13.7 / 14.6 / 14.9 | 14.7 / 13.5 / 12.7 |
| graphite | 6.0 / 6.3 / 6.5 | 7.6 / 7.0 / 6.6 |
| pencil | 4.5 / 4.8 / 4.9 | 5.9 / 5.4 / 5.0 |
| ledger-green | 7.0 / 7.4 / 7.6 | 9.2 / 8.4 / 7.9 |
| stamp-red | 6.2 / 6.5 / 6.7 | 7.4 / 6.8 / 6.4 |
| carbon | 9.4 / 9.9 / 10.1 | 8.1 / 7.4 / 7.0 |
| ink on highlighter | 11.5 | 8.1 |
| button label on ledger-green | 7.0 (paper on green) | 9.2 (binding on green) |

`--pencil` in light mode sits exactly at the AA floor. **Don't lighten it.** The texture rules (§7) exist partly to protect it.

### 3.5 Color rules
- Red means urgency or destruction. Nothing else is red. A red error message for a typo is wrong (§6.12).
- Green fill appears **once per view** at most: the single primary action.
- Highlighter is a background behind user text only. Never use it to highlight our own copy.
- Category is never a color.

---

## 4. Typography

### 4.1 Families *(D-009)*

| Role | Family | Why |
|---|---|---|
| **Verdict / display** | **Libre Caslon Text** (Display cut for ≥ 32px) | Caslon is the face of early American account books, legal notices and civic printing. It carries institutional trust without bank-logo pomp. Used for the system's *voice*: headings, the primary issue, the bottom line. |
| **Interface / body** | **Source Sans 3** | A humanist sans: warmer and calmer than a grotesque, very legible in long advice text, with true tabular figures. Replaced IBM Plex Sans, which read as mechanical and "technical" for owners under stress *(D-018)*. |
| **Column heads / labels** | **Source Sans 3**, 600–800, uppercase, tracked | Same family as the interface, so labels and body never argue. The separate condensed face was dropped *(D-018)*. |
| **Machine print** | **Source Code Pro** | *Only* for things a machine printed: case references, timestamps, file names, request IDs. It's from the same Source family, so it sits with the sans. Never used for prose. |

**No handwriting or "marker" fonts, ever.** Pencil and highlighter are expressed with color, marks and SVG strokes, never a novelty typeface. *(D-011)*

### 4.2 Scale (worksheet density)
Base 16px, with a 4px baseline grid. The scale is deliberately tight. This is a worksheet, not a landing page.

| Token | Size / line | Family | Use |
|---|---|---|---|
| `display` | 44 / 48 | Caslon Display | Landing headline only |
| `h1` | 28 / 32 | Caslon Text | Page title, primary issue |
| `h2` | 20 / 24 | Caslon Text | Section heads, the bottom line |
| `body` | 16 / 24 | Plex Sans | Default |
| `body-sm` | 14 / 20 | Plex Sans | Ledger cells, marginalia |
| `label` | 12 / 16 | Plex Sans Condensed, 600, uppercase, +0.06em | Column heads, field labels |
| `machine` | 13 / 20 | Plex Mono | Refs, timestamps, files |
| `fine` | 12 / 16 | Plex Sans | Disclaimer (§6.11) |

### 4.3 Figures
- All numbers in Plex use `font-variant-numeric: tabular-nums lining-nums slashed-zero`.
- Money is right-aligned in columns and never in mono.
- Currency follows accounting convention: `$15,000.00`, with negatives in parentheses `($2,400.00)` and not a minus sign.
- Dates are `14 Nov 2026` in prose and `2026-11-14` in machine print.

### 4.4 Voice in type
- The system's verdicts (primary issue, bottom line) are **Caslon**. The system's structure (labels, cells) is **Plex**. The user's words are **Plex on receipt**. You can tell who is speaking by the typeface.
- Sentence case everywhere except `label` tokens.

---

## 5. Space, grid & shape

### 5.1 The ledger rhythm
- Base unit **4px**. Spacing scale: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 72`.
- **Rule pitch = 24px.** It matches the `body` line height, so text on ledger surfaces sits *on* the rules, the way it does on real columnar paper. Ledger surfaces must keep the baseline. If text drifts off the rules, the spacing is wrong.

### 5.2 Columnar layout *(D-012)*
Ledger surfaces use a columnar-pad structure:

```
│ REF    ║ DESCRIPTION                          │ ACCOUNT     │ ✓ │
│────────╫──────────────────────────────────────┼─────────────┼───│
│ C-0142 ║ IRS notice, $15,000, 2023 back taxes │ 210 Tax     │ ✓ │
```

- A narrow left **ref column** sits behind a **red double margin rule** (`║`). That's the classic ledger margin.
- A wide description column.
- Right-hand narrow columns for account, status and tick.

### 5.3 Page layout

| Breakpoint | Layout |
|---|---|
| **≥ 1200px** | Three zones: case drawer (264px) · worksheet (max 720px measure) · margin (240px) for marginalia (§6.8) |
| **768–1199px** | Drawer collapses to a tab. Marginalia move inline under the line they annotate. |
| **< 768px** | Single column, 16px gutters, no horizontal scroll. Ledger columns stack into label/value pairs. The ref column becomes a header line. Stamps and the bottom line stay full-strength. |

Phone and desktop are both first-class *(D-013)*. The phone layout is designed on its own, not as a squeezed desktop.

### 5.4 Shape
- **Paper is cut square.** Sheets and surfaces get a 0–2px radius. No 12px "card" radius, no pills.
- **Receipts are torn.** User-message surfaces get a serrated bottom edge (6px zig-zag mask).
- **Stamps are rounded rectangles** (4px radius, double border), the only "soft" shape in the system.
- Buttons: 2px radius, solid. Form fields sit on a single bottom rule like a ledger line, not in a boxed outline.

### 5.5 Elevation: paper on a desk
No blurred, floating shadows. Paper lies flat.

| Token | Value | Use |
|---|---|---|
| `--lift-0` | none | Page ground |
| `--lift-1` | `0 1px 0 rgb(0 0 0 / .06), 0 1px 2px rgb(0 0 0 / .05)` | A sheet resting on the desk |
| `--lift-stack` | `1px 1px 0 var(--paper-sheet), 2px 2px 0 var(--rule)` | Stacked sheets (case history, multi-page results) |
| `--lift-2` | `0 2px 0 rgb(0 0 0 / .08), 0 6px 12px -6px rgb(0 0 0 / .18)` | Dialogs (a sheet picked up) |

In the dark theme, shadows mostly disappear. Elevation comes from the lighter sheet value instead.

---

## 6. Components & patterns

Each component names its material, its data source (from the API's `AdvisoryResponse`) and its states.

### 6.1 Composer: "the intake slip"
- **Material:** receipt paper on the desk, torn top edge (it's being fed in).
- **Placeholder copy:** invites the mess. For example: *"Tell it the way you'd tell your accountant. Dump it all in; we'll sort it."*
- Optional context fields (`business_type`, `state`, `annual_revenue`, `urgency_hint`) sit under a fold, labelled like the header boxes on a form: `BUSINESS · STATE · REVENUE`.
- **File attach:** a staple glyph. An attached file shows as a small stapled slip with a mono filename.
- **Submit:** the single green primary action. Label: **"Sort this out"**, not "Send" or "Generate".
- **States:** empty · typing · file attached · submitting (the slip "feeds" up into the worksheet, §8) · error.

### 6.2 User message: "the receipt"
- The user's text, verbatim, on `--receipt` with a torn bottom edge.
- A mono header line: `RECEIVED 14:32 · 22 OCT 2026`.
- After a result arrives, **extracted facts are highlighted in this text** (§6.5). It's the visible link between mess and order.

### 6.3 Result: "the ledger entry"
The core of the product. It's a ruled sheet with this fixed order:

1. **Header row:** case ref (mono, carbon) · account (category, §6.4) · urgency stamp (§6.6), top-right.
2. **Primary issue:** Caslon `h1`, one sentence (`extracted_fields.primary_issue`).
3. **Extracted facts:** ledger rows with ticks (§6.5).
4. **Rationale:** `body`, graphite, labelled `WORKING`, the accountant's working notes.
5. **Double rule** in `--margin-red`.
6. **The bottom line:** `recommended_action` in Caslon `h2`, ink. Nothing visually competes with it.
7. **Fine print:** disclaimer (§6.11).

Missing information and follow-up questions are **marginalia** (§6.8), not part of the entry.

### 6.4 Category: "the account"
Categories are shown as **accounts from a chart of accounts**, with a code and a name and never a colored chip. *(D-010)*

| Code | Account | API value |
|---|---|---|
| 110 | Cash Flow | `cash_flow_management` |
| 210 | Tax Compliance | `tax_compliance` |
| 250 | Funding & Capital | `funding_and_capital` |
| 310 | Bookkeeping | `bookkeeping_and_accounting` |
| 410 | Business Structure | `business_structure` |
| 510 | Insurance & Risk | `insurance_and_risk` |
| 999 | **Suspense** | `other` |

`other` maps to the **suspense account**, which is literally where accountants park an entry they can't classify yet. It is honest, and it tells the user the next step is clarification, not that they failed. Rendered as `210 · Tax Compliance` in `label` style.

### 6.5 Extracted facts: "tick and bump"
- Each fact (`financial_amount`, `deadline`, `entities_involved`, `prior_actions`) is a ledger row: `label` · value · auditor's tick ✓ in `--ledger-green`.
- Amounts are right-aligned with tabular figures. Deadlines are written as a date where possible.
- **Cross-reference:** hovering or focusing a fact highlights its source span in the user's receipt with the highlighter, and the reverse works too. On touch, tapping a fact scrolls to and pulses its highlight.
- A null field is **left off**, not shown as "N/A". An empty row is noise.

### 6.6 Urgency: "the stamp" *(D-014)*
A rubber-stamp impression, top-right of the entry, rotated by a deterministic −3°…+3° seeded from the request ID (so it is stable across reloads and never random-looking on re-render).

| Urgency | Stamp text | Treatment |
|---|---|---|
| `critical` | ACT TODAY | `--stamp-red`, solid ink fill, paper-colored text |
| `high` | THIS WEEK | `--stamp-red`, double-border outline |
| `medium` | THIS MONTH | `--carbon`, outline |
| `low` | WHEN READY | `--graphite`, outline |

- The stamp text is always readable as text (`aria-label="Urgency: critical, act today"`). Ink grain is a mask on the border and fill, never on the letters.
- One stamp per entry. Nothing else on the page uses stamp styling.

### 6.7 Confidence: pencil state *(D-008)*
- `low_confidence_flag = false`: the entry is **inked**, with ink text and green ticks.
- `low_confidence_flag = true`: the entry is **pencilled**. Primary issue and fact values use `--pencil`, ticks become open circles ○ (to be confirmed), the double rule is drawn in graphite rather than red, and a marginal note says: *"Pencilled in: we're not sure yet. Answer the questions alongside and we'll ink it."*
- The raw `confidence` number is available on demand (a `WORKING` disclosure), never shown as a headline.
- When follow-up answers produce a confident result, the entry **inks over** (§8): pencil turns to ink. This is the product's signature moment.

### 6.8 Marginalia: missing info & follow-ups
- `missing_information` and `follow_up_questions` sit in the **right margin** at ≥1200px, each aligned to the line it concerns, in `body-sm` with a thin carbon leader line.
- Below 1200px they go inline after the facts, with a 2px carbon left rule.
- Follow-up questions are **actionable**: tapping one puts it into the composer as a prompt to answer.
- `has_sufficient_info = false` puts a margin header on top: `QUERIES BEFORE WE CAN ADVISE`.

### 6.9 Case history: "the file drawer"
- Past cases are a vertical stack of **file folder tabs**. Each shows case ref (mono), account code, a one-line primary issue and a tiny stamp-colored dot for urgency (the label is announced to screen readers).
- Inside the drawer, cases group by month like a ledger period: `OCTOBER 2026`.
- An empty drawer says: *"No cases on file."*

### 6.10 Loading: "the adding-machine tape"
- While waiting, a narrow strip of tape feeds out under the receipt. Mono lines print one at a time, describing real steps: `READING…` `SORTING INTO ACCOUNTS…` `CHECKING DEADLINES…`.
- No spinners, no shimmering skeletons, no "thinking" sparkles.
- If the wait passes 8 seconds (for example a Render cold start), one line prints plainly: `STILL WORKING. THE FIRST REQUEST AFTER A QUIET SPELL IS SLOW.`

### 6.11 Disclaimer: "the fine print"
- `fine` token, graphite, set like the small print on the back of a bank statement, under a hairline rule.
- Always present on a result, never in a modal and never dismissible.

### 6.12 Errors
- Our failure is not the user's fault, so errors are **never red and never stamped**. They come as a plain sheet in graphite and ink, in calm language, using the API's `recommended_action`.
- `rate_limited` / `llm_unavailable`: *"Our desk is backed up. Try again in 30 seconds. Your note is saved."* The draft is always kept.
- Validation errors appear inline, on the field's bottom rule, in ink, with an `ⓘ` mark.

### 6.13 Brand mark & the one ornament
- The mark is name-agnostic for now (§11): a **double rule with a tick**, the auditor's sign-off.
- **Guilloche** (banknote engraving pattern) is allowed in exactly two places: the brand mark lockup and the landing hero ground, at ≤ 6% contrast. Nowhere else. *(D-015)*

---

## 7. Texture system

Texture is implemented in CSS and SVG, with no raster images, and it is cheap enough for low-end phones.

| Texture | Implementation | Where | Opacity budget |
|---|---|---|---|
| Paper fibre | SVG `feTurbulence` (baseFrequency ≈ 0.9) as a fixed body background | Page ground only | Light 3% · Dark 5% |
| Ledger rules | `repeating-linear-gradient` at 24px pitch, 1px `--rule` | Result sheets only, never the whole page | Solid rule color |
| Margin rule | Two 1px `--margin-red` lines, 2px apart | Left of ref column, above the bottom line | Solid |
| Torn edge | CSS `mask` zig-zag (6px) | Receipts, composer | n/a |
| Stamp ink | SVG noise mask, seeded per request | Stamp only | Grain removes ≤ 15% of ink |
| Highlighter | Slightly skewed background band with an irregular end-cap SVG | User text spans | Solid token |

**Rules**
1. Texture is never placed behind text smaller than 16px at more than 3% opacity.
2. There are at most **two textures** on any one surface.
3. `prefers-reduced-transparency` and Windows High Contrast drop all textures. The layout must still read as ledger versus receipt from structure alone.
4. Textures are seeded and deterministic, so a screenshot always matches what the user saw.

---

## 8. Motion

Motion is physical paper handling: brief, damped, no bounce. Paper doesn't spring.

| Token | Duration | Easing | Use |
|---|---|---|---|
| `--t-snap` | 120ms | `cubic-bezier(.3,0,0,1)` | Stamp press, tick appearance |
| `--t-settle` | 240ms | `cubic-bezier(.2,0,0,1)` | A sheet settling, drawer open |
| `--t-feed` | 420ms | `cubic-bezier(.4,0,.2,1)` | The intake slip feeding up, the tape printing |
| `--t-ink` | 600ms | linear | Pencil inking over to ink |

**Choreography of a result**, the only sequence allowed to last more than 300ms:
1. The receipt settles (`settle`).
2. The ledger sheet lays down beneath it (`settle`).
3. Fact rows write in top to bottom, 40ms apart. Ticks appear (`snap`).
4. Highlights sweep across the receipt from left to right, in sync with their facts.
5. The stamp presses down: scale 1.04 → 1, opacity 0 → 1 (`snap`).
6. The double rule draws, then the bottom line appears.

With `prefers-reduced-motion`, everything appears at once with a 120ms fade. Nothing moves.

---

## 9. Anti-patterns: we never do this *(D-016)*

These are the tells of a templated AI product. Each one is banned.

- ✗ Purple, indigo or violet-to-pink gradients. Gradient text. "Aurora" blobs.
- ✗ Sparkle ✨ or wand icons to mean "AI". The product is an accountant's desk, not magic.
- ✗ Glassmorphism, frosted panels, backdrop blur.
- ✗ Inter, Geist, Space Grotesk, Fraunces, Instrument Serif or Playfair as primary faces.
- ✗ Pill buttons and 12–16px radius "cards" floating on large soft shadows.
- ✗ Chat bubbles (left grey and right blue). We have receipts and ledger entries.
- ✗ Typewriter-streaming prose for structured results. The structure arrives as structure.
- ✗ Emoji as UI (🔴🟡🟢). Urgency is a stamp.
- ✗ Percentage confidence meters or radial gauges.
- ✗ A rainbow of category colors.
- ✗ Bento grids of feature cards on the landing page.
- ✗ Dark mode as the hero aesthetic, a black page with neon accents.
- ✗ Handwriting or marker fonts.
- ✗ Exclamation marks in system copy. Ever.

---

## 10. Decision log

Status: **Accepted** (build to it) · **Provisional** (build to it, revisit) · **Open** (needs an answer).

| ID | Decision | Rationale | Rejected alternatives | Status |
|---|---|---|---|---|
| D-001 | The core concept is **the Shoebox and the Ledger** | It names the exact transformation the product performs (messy input to structured triage) using a scene every small-business owner and accountant recognises. | "Calm fintech" (generic). "Chaos to clarity" abstract swirls (cliché, no domain). | Accepted |
| D-002 | Tactile texture throughout, under professional restraint | User direction. It differentiates the product from flat, templated AI apps and makes money feel physical. | Mess only in the input zone. Metaphor only, with clean visuals. | Accepted |
| D-003 | Register: **accountant's worksheet** (dense, quiet, precise) | User direction. A stressed owner is reassured by visible order and competence more than by friendliness. It drives the tight type scale and ruled layouts. | Financial-newspaper drama. Friendly-note softness. | Accepted |
| D-004 | Strict material split: user = receipt, system = ledger | It lets the user tell who is speaking without reading, and keeps the mess-to-order story legible on every screen. | One unified surface for all messages (it loses the story). | Accepted |
| D-005 | The money color is printed banknote/columnar green, not mint | Mint and neon green read as trading apps and crypto. Deep printed green reads as bookkeeping. | Fintech mint. Navy-blue "bank" (generic). Gold (luxury and wealth, wrong audience). | Accepted |
| D-006 | Full dark-mode parity, with dark as **ledger binding cloth** | User direction. Inverting paper makes a muddy grey. Binding is a real, distinct material from the same desk. | Inverted paper. Pure black OLED. Light only. | Accepted |
| D-007 | The recommended action sits below a red double rule ("the bottom line") | It borrows the strongest accounting convention for "the final figure" and puts the most important line where the eye already goes. | A highlighted callout box. A CTA-style card. | Accepted |
| D-008 | Confidence is shown as **pencil vs ink** | It's a real bookkeeping convention, it's understood without numbers, and it creates the signature "inking over" moment when follow-ups resolve uncertainty. | Percentage bar. Traffic light. A hidden confidence number alone. | Accepted |
| D-009 | Type: Libre Caslon (voice) + IBM Plex Sans / Condensed / Mono (structure) | Caslon brings civic and ledger printing heritage. Plex brings a business-machines lineage, tabular figures, a slashed zero, and the condensed width needed for columns. Free and on Google Fonts. | Inter or Geist (generic). Fraunces or Instrument Serif (over-used in AI sites). Playfair (too fashion). A mono-heavy "dev" look. | Provisional (test Caslon at 20px on low-DPI Windows) |
| D-010 | Categories are chart-of-accounts codes; `other` = **Suspense** | It's domain-true, it scales without inventing colors, and "suspense" frames ambiguity honestly. | Colored category chips. Icons per category. | Accepted |
| D-011 | No handwriting fonts. Pencil and highlighter come from color and marks. | Handwriting fonts read as novelty and hurt legibility, which goes against "professional". | Caveat, Kalam, etc. for annotations. | Accepted |
| D-012 | Columnar-pad layout with a red double margin rule | It's the single most recognisable ledger artifact and gives a strict grid for dense data. | A generic card list of fields. | Accepted |
| D-013 | Phone and desktop are equally first-class | User direction. Owners often write from a phone between tasks and then review at a desk. | Desktop-first. Phone-first. | Accepted |
| D-014 | Urgency is a seeded rubber stamp with deadline-shaped labels | A stamp is the physical "verdict" mark. The labels (ACT TODAY…) tell the user *when*, which is more useful than "critical". Seeding keeps it stable. | Colored badges. Banners. Emoji traffic lights. | Accepted |
| D-015 | Guilloche is limited to the brand mark and the landing hero | Banknote engraving signals money powerfully but becomes kitsch quickly. Scarcity keeps it meaningful. | Guilloche borders on results or buttons. | Provisional |
| D-016 | An explicit anti-pattern list (§9) | It makes "not vibe-coded" testable in review rather than a matter of taste. | Leaving it implicit. | Accepted |
| D-018 | UI type moves from IBM Plex to the **Source** family (Sans 3 + Code Pro); Caslon stays for the system's voice | User feedback: Plex felt wrong for the product. Source Sans 3 is humanist and warm, keeps tabular figures, and its mono sibling keeps machine print in one family. | Public Sans (too plain), Libre Franklin (heavy at small sizes), Inter/Geist (banned in §9). | Accepted · supersedes the UI half of D-009 |
| D-019 | One-temperature palette: warm green-grey neutrals, ledger green as the only brand accent, ochre highlighter, desaturated urgency hues; dark mode keeps the same hues with a real lightness ladder | User feedback: light mode mixed cool greys with orange, green, cream and blue; in dark mode text tones were nearly identical, paper lines were invisible and the category band stayed bright. Tokens are now generated for both modes from one table (`web/src/styles/tokens.css`), and every text pair checked passes AA. | Patching individual hex values (left the mixed temperatures in place). | Accepted |
| D-017 | The API may change to support the design (§12) | User direction. The fact-to-source highlight is the clearest proof of mess-to-order and needs span data. | Designing only within the current response. | Accepted |

---

## 11. Naming (open)

The product name is open. The design is name-agnostic. Directions that would fit the thesis:

| Candidate | Why it fits |
|---|---|
| **Daybook** | The "book of original entry": where messy daily transactions are first written down before being posted to the ledger. The literal mess-to-ledger step. |
| **Tickmark** | The auditor's sign-off mark. Short, ownable, matches the brand mark. |
| **Shoebox** | Names the mess with affection. Warm, but it risks reading as consumer or casual. |
| **Suspense** | Too clever. Recorded so we don't revisit it. |

The brand mark (§6.13) works with any of them.

---

## 12. Required API changes

These are small backend additions the design depends on. Until they ship, each has a fallback.

| Need | Change | Used by | Fallback until shipped |
|---|---|---|---|
| Fact-to-source highlighting | Add `source_spans: [{field, start, end}]` (character offsets into `problem_description`) to `AdvisoryResponse` | §6.2, §6.5 | Client-side exact match of the extracted strings (amounts, dates) in the text. Skip the highlight if there's no match. |
| Marginalia alignment | Add an optional `relates_to` field on each `missing_information` / `follow_up_questions` item (e.g. `"deadline"`) | §6.8 | Show marginalia stacked at the top of the margin. |
| Stable stamp seed | None (`request_id` already exists) | §6.6 | n/a |
| Inking-over | A follow-up request that references a prior `request_id` and returns the updated entry | §6.7, §8 | Show the new result as a fresh entry stacked on the old one (`--lift-stack`). |
| Deadline as a date | Add an optional `deadline_date` (ISO) next to the free-text `deadline` | §6.5 | Show the free text. |

---

## 13. Open questions

1. **Microcopy voice.** The worksheet register (D-003) sets the visual tone. The written voice needs its own short guide: how plain, how warm, and whether we ever use "we".
2. **Landing page.** Not specified yet. Proposed direction: a single shoebox-to-ledger demonstration using a real example, in place of feature cards.
3. **Print / PDF export.** A ledger entry is begging to be printed for an accountant. This needs a print stylesheet decision.
4. **Name** (§11).

---

## 14. Implementation map

Where each part of this document lives in `web/src`:

| Spec | Code |
|---|---|
| Tokens, type scale, materials, textures, motion (§3–5, §7–8) | `index.css` |
| Accounts, stamps, working brand name (§6.4, §6.6, §11) | `lib/meta.ts` (`ACCOUNTS`, `STAMPS`, `BRAND`) |
| Stamp seeding, case refs, dates, fact-to-source matching (§6.5, §12 fallback) | `lib/ledger.ts` |
| Ledger entry: facts, pencil/ink, double rule, marginalia (§6.3–6.8) | `components/app/LedgerEntry.tsx` |
| Receipt and highlighter (§6.2) | `components/app/Receipt.tsx`, `components/app/linking.tsx` |
| Intake slip (§6.1) | `components/app/ChatComposer.tsx`, `components/landing/HeroComposer.tsx` |
| File drawer (§6.9) | `components/app/Sidebar.tsx` |
| Adding-machine tape, error sheet (§6.10, §6.12) | `components/app/Thread.tsx` |
| Mark, staple, tick (§2.3, §6.13) | `components/ui.tsx` |
| Guilloche (D-015) | `components/landing/Guilloche.tsx` |

Theme: `html[data-theme]` is set before first paint from the saved choice, or else the OS preference. The toggle names the material you would switch *to* ("Binding" / "Desk").

---

## Appendix A: Token starter (CSS)

```css
:root {
  /* Desk (light) */
  --paper: #EFF2E8;  --paper-sheet: #F7F8F2;  --receipt: #FAFAF7;
  --rule: #A9C3A6;   --rule-strong: #7FA07C;  --margin-red: #C9604A;
  --ink: #1C2621;    --graphite: #565D58;     --pencil: #6B6F6A;
  --ledger-green: #2D5A40; --stamp-red: #A3302A; --carbon: #2B3784;
  --highlighter: #F1DF74;

  --font-voice: "Libre Caslon Text", Georgia, serif;
  --font-ui: "IBM Plex Sans", system-ui, sans-serif;
  --font-label: "IBM Plex Sans Condensed", "IBM Plex Sans", sans-serif;
  --font-machine: "IBM Plex Mono", ui-monospace, monospace;

  --rule-pitch: 24px;
  --t-snap: 120ms; --t-settle: 240ms; --t-feed: 420ms; --t-ink: 600ms;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    /* Binding (dark) */
    --paper: #111713;  --paper-sheet: #19201B;  --receipt: #1F2521;
    --rule: #2C3D31;   --rule-strong: #3F5745;  --margin-red: #B8604F;
    --ink: #E5E9DD;    --graphite: #A3AAA2;     --pencil: #8E948D;
    --ledger-green: #8FC4A0; --stamp-red: #EE8A7C; --carbon: #9EA9F0;
    --highlighter: #4A4318;
  }
}
/* Mirror the dark block under :root[data-theme="dark"] for the manual toggle. */
```
