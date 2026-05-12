# Plan: Shopify Theme Code Audit Report

A structured, prioritized markdown report covering all identified issues across the full theme codebase — custom sections, JS assets, Liquid snippets/templates, settings schema, accessibility, and performance.

The audit is executed **step by step, file group by file group**. After each file group and after each step, findings are confirmed before proceeding. This allows for early feedback and course correction at the finest granularity.

---

## Step 1 — Deep-read all custom brand sections

For each file below, read, catalogue findings, and **confirm before moving to the next file**.

### 1.1 `sections/home_hero.liquid`
- Inline `<style>` blocks
- Inline `<script>` blocks
- Hardcoded asset names or values (e.g. Figma export filenames)
- `section_has_bg_image` logic correctness
- Foreign class references
- Duplicated block rendering logic

> **Checkpoint 1.1** — Document findings for `home_hero.liquid`. Confirm before proceeding to 1.2.

---

### 1.2 `sections/pest-selector.liquid`
- Inline `<style>` and `<script>` blocks
- Hardcoded values
- Foreign class references (e.g. `home-hero__heading`)
- Duplicated block rendering logic
- Indentation / formatting issues

> **Checkpoint 1.2** — Document findings for `pest-selector.liquid`. Confirm before proceeding to 1.3.

---

### 1.3 `sections/customers-feedback.liquid`
- Inline `<style>` and `<script>` blocks (expect ~300 lines of embedded JS)
- Duplicate DOM nodes for carousel infinite scroll
- Unlazyloaded video iframes
- Non-English comments indicating external authorship
- Foreign class references
- Hardcoded `z-index` values

> **Checkpoint 1.3** — Document findings for `customers-feedback.liquid`. Confirm before proceeding to 1.4.

---

### 1.4 `sections/why-super-ninja-works.liquid`
- Inline `<style>` and `<script>` blocks
- Hardcoded values
- Copy-pasted block rendering logic (heading/text/button pattern)

> **Checkpoint 1.4** — Document findings for `why-super-ninja-works.liquid`. Confirm before proceeding to 1.5.

---

### 1.5 `sections/pdp-stats-section.liquid`
- Inline `<style>` with hardcoded colors (e.g. `#FFFFFF`)
- Color scheme override bypassing theme variables
- Duplicated block rendering logic

> **Checkpoint 1.5** — Document findings for `pdp-stats-section.liquid`. Confirm before proceeding to 1.6.

---

### 1.6 `sections/about-image-text.liquid`
- Inline `<style>` blocks
- `<img>` tags without `srcset`/`sizes`
- Duplicated block rendering logic

> **Checkpoint 1.6** — Document findings for `about-image-text.liquid`. Confirm before proceeding to 1.7.

---

### 1.7 `sections/super-ninja-vs-rest.liquid`
- Inline SVG paths duplicated within the same file
- Inline `<style>` blocks
- Missing shared snippet extraction

> **Checkpoint 1.7** — Document findings for `super-ninja-vs-rest.liquid`. Confirm before proceeding to Step 2.

### 1.8 Global scan of remaining ~13 brand sections

**Rapid cross-file analysis — do NOT deep-read each file**

- List all remaining brand sections (not Horizon base)
- For each, scan for:
	- Inline `<style>` blocks (yes/no)
	- Inline `<script>` blocks (yes/no)
	- Hardcoded asset names (yes/no, which ones)
	- Copy-pasted block pattern indicators (heading/text/typography pattern)
	- Cross-section class references (any detected)
	- External CDN dependencies (yes/no)
	- Raw HTML comments (non-English or suspicious)
- Tally patterns: How many sections have inline styles? How many use same hardcoded asset names?
- Summarize: Top N recurring issues across all ~20 brand sections

> **Checkpoint 1.8** — Global pattern report for remaining brand sections. Confirm before proceeding to Step 2.

---
---

## Step 2 — Audit JS assets

For each file below, read, catalogue findings, and **confirm before moving to the next file**.

### 2.1 `assets/localization.js`
- `innerHTML` usage with user-supplied input (`#highlightMatches` + search value)
- Verify whether `searchValue` is escaped before injection
- Any other unsafe DOM manipulation patterns

> **Checkpoint 2.1** — Document findings for `localization.js`. Confirm before proceeding to 2.2.

---

### 2.2 `assets/events.js`
- Naming inconsistency (`FilterUpdate` PascalCase vs. camelCase convention)
- Incorrect JSDoc example (`e.detail.variant` vs. actual `e.detail.resource`)
- Any missing or undocumented events

> **Checkpoint 2.2** — Document findings for `events.js`. Confirm before proceeding to 2.3.

---

### 2.3 `assets/price-per-item.js`
- Unsafe `innerHTML` with `dataset.*` values from Liquid
- Verify whether data attributes are escaped at the Liquid level
- Any other unsafe patterns

> **Checkpoint 2.3** — Document findings for `price-per-item.js`. Confirm before proceeding to 2.4.

---

### 2.4 `assets/section-hydration.js`
- Full read — unsampled file
- How it interacts with brand custom sections
- Any unexpected side effects or overrides

> **Checkpoint 2.4** — Document findings for `section-hydration.js`. Confirm before proceeding to 2.5.

---

### 2.5 Global JS sweep of remaining `assets/*.js`

**Rapid cross-file analysis — do NOT deep-read every file line-by-line**

- Scan all remaining JS files in `assets/` excluding files already audited in 2.1–2.4
- For each file, flag yes/no for:
	- Unsafe HTML writes (`innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`)
	- Unprotected JSON parsing (`JSON.parse` without try/catch)
	- Global document/window listeners without cleanup
	- External CDN/network dependencies
	- Dead/unused exports or functions (heuristic)
	- Naming/style inconsistencies that impact maintainability
- Tally recurring patterns and list top-risk files
- Summarize top recurring issues across all remaining JS assets

> **Checkpoint 2.5** — Global JS risk matrix and aggregate findings. Confirm before proceeding to Step 3.

---

## Step 3 — Review Liquid snippets and templates

### 3.1 `snippets/` — anti-pattern scan
- Missing `{% doc %}` documentation blocks
- Unescaped output (missing `| escape` or `| strip_html`)
- Unsafe variable assignments (`null` sentinel + boolean reassignment pattern)

> **Checkpoint 3.1** — Document findings for snippets. Confirm before proceeding to 3.2.

---

### 3.2 `templates/` — product-specific JSON templates
- Review all 5 product-specific JSON templates
- Assess whether product data belongs in the theme repository
- Flag `product.fruit-fly-trap.context.netherlans.json` filename typo

> **Checkpoint 3.2** — Document findings for templates. Confirm before proceeding to Step 4.

---

## Step 4 — Review `config/settings_schema.json`

### 4.1 Orphaned settings
- Cross-reference all setting IDs against section/block schema definitions
- Flag any settings defined in the schema but never referenced

> **Checkpoint 4.1** — Document orphaned settings. Confirm before proceeding to 4.2.

---

### 4.2 Typography control granularity
- Flag per-block font-size, font-weight, line-height controls that bloat `settings_data.json`
- Suggest consolidation into shared design tokens

> **Checkpoint 4.2** — Document typography findings. Confirm before proceeding to 4.3.

---

### 4.3 Deprecated or non-standard schema fields
- Check for any deprecated Shopify settings schema fields
- Verify all `type` values are current Shopify-supported input types

> **Checkpoint 4.3** — Document schema findings. Confirm before proceeding to Step 5.

---

## Step 5 — Accessibility pass

### 5.1 `role="img"` and `aria-label` usage
- Are these applied only when a meaningful image is actually present?
- Flag always-true assignments (e.g. `section_has_bg_image = true`)

> **Checkpoint 5.1** — Document ARIA findings. Confirm before proceeding to 5.2.

---

### 5.2 Missing `alt` attributes
- Scan all `<img>` tags in brand sections for missing or empty `alt`
- Flag decorative images that should use `alt=""`

> **Checkpoint 5.2** — Document alt-text findings. Confirm before proceeding to 5.3.

---

### 5.3 `z-index` and layer management
- Flag hardcoded `z-index` values vs. Horizon's `--layer-*` CSS variable system
- Note any stacking context conflicts

> **Checkpoint 5.3** — Document z-index findings. Confirm before proceeding to 5.4.

---

### 5.4 Dynamic tag elements
- Review `<{{ tag }}>` usage across brand sections
- Confirm appropriate ARIA roles are applied where the element is not naturally semantic

> **Checkpoint 5.4** — Document dynamic tag findings. Confirm before proceeding to Step 6.

---

## Step 6 — Performance pass

### 6.1 Images without responsive markup
- Catalog all `<img>` tags in brand sections missing `srcset` and `sizes`
- Compare against Horizon's `image_tag` filter pattern

> **Checkpoint 6.1** — Document image findings. Confirm before proceeding to 6.2.

---

### 6.2 Inline `<style>` blocks
- Full catalog of sections using raw `<style>` instead of Shopify `{% style %}`
- Note render-blocking and deduplication implications

> **Checkpoint 6.2** — Document inline style findings. Confirm before proceeding to 6.3.

---

### 6.3 Carousel DOM duplication
- Confirm the double-render of video blocks in `customers-feedback.liquid`
- Assess impact of live `<iframe>` players being instantiated twice

> **Checkpoint 6.3** — Document carousel findings. Confirm before proceeding to 6.4.

---

### 6.4 Unoptimized video iframes
- Check for missing `loading="lazy"` on `<iframe>` video embeds
- Flag any autoplay or heavyweight embeds loaded unconditionally

> **Checkpoint 6.4** — Document iframe findings. Confirm before proceeding to Step 7.

---

## Step 7 — Compile final prioritized report

Aggregate all confirmed findings from checkpoints 1.1–6.4 into a single report:

- Severity tiers: **Critical / Serious / Moderate / Minor**
- Estimated effort per fix: **Low / Medium / High**
- Recommended fix per issue
- Issues grouped by category (Security, Code Quality, Accessibility, Performance)

> **Checkpoint 7** — Review compiled report. Approve before delivering as final output.

---

## Verification

The report is the deliverable. Individual JS issues can be validated by searching for flagged patterns. Liquid issues should be verified in a Shopify development store.

## Decisions

- Full-scope audit across all requested areas (custom sections, JS, Liquid snippets+templates, settings schema, accessibility, performance)
- Step-by-step execution with a checkpoint after **every file group and every step**
- Output: a single prioritized markdown report (no code edits at this stage)
