---
name: design-md-writer
description: Write a DESIGN.md file — a structured design system document that AI coding agents use to generate brand-accurate UI. Use this skill whenever the user wants to document a design system, reverse-engineer a brand's visual identity, create a DESIGN.md for a website or product, capture design tokens for AI consumption, or says anything like "write a design.md", "document our design system", "capture the styles of X", "make a design file for our brand", or "create a design reference for AI". Always trigger this skill for any DESIGN.md creation request, even if the user only names a brand or shows a screenshot.
---

# DESIGN.md Writer

A DESIGN.md is a structured markdown document that describes a brand's complete visual design system in a way AI coding agents can directly consume to generate accurate, on-brand UI. It is not a style guide for humans — it is a prompt-ready spec for machines.

The Airbnb example shows the gold standard: every value is precise, every token is named, every rule is actionable.

## Your Input Sources

The user may provide any of these — use whatever is available:

- A live website URL → use `web_fetch` to inspect it
- Screenshots or images → analyze visually
- An existing style guide or brand doc → extract from it
- A brand name only → use `web_search` to research, then `web_fetch` the site
- A DESIGN.md from another brand as reference/inspiration

## The 9-Section Structure

Every DESIGN.md must contain these sections in order. Read `references/section-guide.md` for the detailed spec of each section.

```
1. Visual Theme & Atmosphere
2. Color Palette & Roles
3. Typography Rules
4. Component Stylings
5. Layout Principles
6. Depth & Elevation
7. Do's and Don'ts
8. Responsive Behavior
9. Agent Prompt Guide
```

## Step-by-Step Workflow

### Step 1 — Research the Brand

If you have a URL or brand name, fetch the primary website and inspect:

- CSS custom properties (`--color-*`, `--palette-*`, `--font-*`, etc.)
- Google Fonts or custom font imports
- Computed styles on key elements (buttons, cards, headings, nav)
- Screenshot the homepage mentally: what is the dominant aesthetic?

If the user provided a DESIGN.md or style doc, skip fetching and go straight to extraction.

### Step 2 — Extract Design Tokens

Gather the raw values before writing prose. Fill this checklist:

**Colors**

- [ ] Primary background color
- [ ] Primary text color
- [ ] Brand accent color(s) — name each one (like "Rausch Red")
- [ ] Secondary/muted text color
- [ ] Surface colors (cards, sidebars, inputs)
- [ ] Border colors
- [ ] Error/warning/success states
- [ ] Shadow values (exact rgba strings)

**Typography**

- [ ] Font family name(s) — primary and any secondary
- [ ] Is it a custom/variable font or a web font?
- [ ] Fallback stack
- [ ] Size scale (px and rem for each heading level + body + small)
- [ ] Weight scale used (which weights: 300? 400? 500? 600? 700?)
- [ ] Line heights per role
- [ ] Letter spacing per role

**Spacing & Geometry**

- [ ] Base unit (usually 4px or 8px)
- [ ] Spacing scale values
- [ ] Border radius values for each context (button, card, badge, pill, circle)
- [ ] Max content width
- [ ] Grid columns and gutter

**Motion** (if applicable)

- [ ] Default transition duration
- [ ] Easing curve(s)
- [ ] Key animation patterns (hover lift, fade in, slide, etc.)

### Step 3 — Write Each Section

Follow the detailed guide in `references/section-guide.md`. Key rules:

- **Be precise**: Every color must be a hex or rgba value. No "warm blue" without the hex.
- **Be named**: Give each color a human name + its token name + its hex (e.g., "Rausch Red (`#ff385c`): `--palette-bg-primary-core`")
- **Be role-aware**: Don't just list colors — say what each one is for
- **Use tables**: Typography hierarchy and spacing scales must be tables, not prose lists
- **Use the brand's naming**: If they call it "Rausch Red", use that. If they use `--color-brand-500`, use that token name.

### Step 4 — Write the Agent Prompt Guide (Section 9)

This is the most important section for AI usability. It must include:

1. **Quick Color Reference** — a compact lookup table with: background, text, accent, secondary, disabled, shadow
2. **3–5 Example Component Prompts** — copy-pasteable prompts that produce correct output when given to an AI agent. Format: `"Create a [component]: [precise spec with exact values]"`
3. **Iteration Guide** — 5–7 numbered rules for building in this design system, from most to least foundational

### Step 5 — Quality Check

Before finalizing, verify:

- [ ] Every color value is a precise hex or rgba — no vague descriptions
- [ ] Every font size is in both px and rem
- [ ] Do's and Don'ts are specific and actionable (not generic design advice)
- [ ] Section 9 prompts use exact values from the design system, not approximations
- [ ] The document reads as a spec, not a blog post — dense, precise, structured

## Output Format

Deliver as a single markdown file named `DESIGN.md`. If the user is in a file-creation context, write it to `/mnt/user-data/outputs/DESIGN.md` and present it. Otherwise deliver inline.

The document should be 800–2000 words depending on brand complexity. Sparse brands (Vercel, Tesla) warrant shorter docs. Complex marketplaces (Airbnb, Shopify) warrant longer ones.

---

Read `references/section-guide.md` for the detailed spec of each of the 9 sections.
