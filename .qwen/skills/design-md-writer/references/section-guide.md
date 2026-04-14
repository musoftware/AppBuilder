# Section Guide

Detailed specifications for each of the 9 DESIGN.md sections. Follow these exactly.

---

## 1. Visual Theme & Atmosphere

**Purpose**: One-paragraph aesthetic direction that an AI can read and immediately understand the vibe.

**Format**: 2–4 sentences, prose not bullets.

**What to include**:

- The dominant aesthetic (minimal? maximalist? warm? technical?)
- The mood/feeling (trustworthy? playful? luxurious? efficient?)
- One or two comparison anchors ("like Airbnb" or "similar to Stripe")
- Key differentiator (what makes this brand visually unique?)

**Example**:

```markdown
## 1. Visual Theme & Atmosphere

Airbnb's design communicates warmth, trust, and belonging. The aesthetic is editorial-meets-digital-product: large immersive photography, generous white space, refined typography, and a restrained color palette anchored by the signature Rausch Red accent. It feels premium but approachable — never cold or corporate. Photography does the heavy lifting; UI elements stay out of the way.
```

**What to avoid**:

- Generic adjectives ("beautiful", "modern")
- Technical details here (save for later sections)
- Lists or tables (prose only)

---

## 2. Color Palette & Roles

**Purpose**: Every color with exact values, names, and usage rules.

**Format**: Named groups with hex values, CSS variable names, and role descriptions.

**Structure**:

```markdown
## 2. Color Palette & Roles

### Core Brand Colors

| Name       | Hex       | CSS Variable                 | Usage                            |
| ---------- | --------- | ---------------------------- | -------------------------------- |
| Rausch Red | `#ff385c` | `--palette-bg-primary-core`  | Primary CTAs, links, brand marks |
| Babu Pink  | `#ff5a5f` | `--palette-bg-primary-hover` | Hover states, secondary accents  |

### Neutral Colors

| Name       | Hex       | CSS Variable                     | Usage                            |
| ---------- | --------- | -------------------------------- | -------------------------------- |
| White      | `#ffffff` | `--palette-bg-surface-primary`   | Page backgrounds, card surfaces  |
| Foggy Gray | `#f7f7f7` | `--palette-bg-surface-secondary` | Alternate sections, sidebar      |
| Charcoal   | `#222222` | `--palette-text-primary`         | Headings, primary body text      |
| Cloud Gray | `#717171` | `--palette-text-secondary`       | Captions, metadata, placeholders |

### Functional Colors

| Name           | Hex       | CSS Variable              | Usage                               |
| -------------- | --------- | ------------------------- | ----------------------------------- |
| Success Green  | `#008a05` | `--palette-text-positive` | Confirmation messages, availability |
| Warning Yellow | `#ffa726` | `--palette-text-warning`  | Caution states, pending status      |
| Error Red      | `#e04450` | `--palette-text-negative` | Error messages, unavailable dates   |
```

**Rules**:

- Every color must have a hex value — no "warm gray" without `#xxxxxx`
- Name colors after the brand's internal naming if known (Airbnb uses "Rausch", "Babu", "Bai", etc.)
- Include CSS variable names if the brand uses them
- Specify what each color is USED FOR, not just what it looks like
- Group by function: brand, neutrals, functional states

---

## 3. Typography Rules

**Purpose**: Complete type scale with exact sizes, weights, line heights, and spacing.

**Format**: Tables, never prose lists.

**Structure**:

```markdown
## 3. Typography Rules

### Font Families

- **Display/Headings**: `Cereal` (Airbnb custom, fallback: `Circular`, `Nunito Sans`, sans-serif)
- **Body**: `Nunito Sans` (Google Fonts: https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700&display=swap)
- **Fallback**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

### Size Scale

| Role           | Size (px) | Size (rem) | Weight | Line Height | Letter Spacing     | CSS Variable             |
| -------------- | --------- | ---------- | ------ | ----------- | ------------------ | ------------------------ |
| h1 / Display   | 48px      | 3rem       | 700    | 1.1         | -0.02em            | `--font-size-display-xl` |
| h2             | 32px      | 2rem       | 700    | 1.2         | -0.01em            | `--font-size-display-lg` |
| h3             | 24px      | 1.5rem     | 600    | 1.3         | 0                  | `--font-size-display-md` |
| h4             | 18px      | 1.125rem   | 600    | 1.4         | 0                  | `--font-size-display-sm` |
| Body Large     | 18px      | 1.125rem   | 400    | 1.6         | 0                  | `--font-size-body-lg`    |
| Body           | 16px      | 1rem       | 400    | 1.5         | 0                  | `--font-size-body`       |
| Small/Caption  | 14px      | 0.875rem   | 400    | 1.4         | 0                  | `--font-size-caption`    |
| Overline/Label | 12px      | 0.75rem    | 600    | 1.2         | 0.08em (uppercase) | `--font-size-overline`   |
```

**Rules**:

- Always include BOTH px and rem values
- Include line heights (unitless, e.g., 1.5 not 24px)
- Include letter spacing where relevant (especially for uppercase labels)
- Note which weights are actually used (don't list 300 if they only use 400/600/700)
- If using a custom font, note the fallback chain

---

## 4. Component Stylings

**Purpose**: How key components look — buttons, cards, inputs, navigation, etc.

**Format**: Per-component specs with exact values.

**Structure**:

```markdown
## 4. Component Stylings

### Buttons

**Primary CTA:**

- Background: `--palette-bg-primary-core` (#ff385c)
- Text: `--palette-bg-surface-primary` (#ffffff)
- Padding: `14px 24px`
- Border radius: `8px`
- Font weight: 600, size: 16px
- Hover: lighten background by 10% or use `#e31c5f`
- Active: scale(0.98)
- Focus: 2px outline, offset 2px, color `--palette-text-primary` (#222222)
- Disabled: opacity 0.5, cursor: not-allowed

**Secondary/Outline:**

- Background: transparent
- Border: 1px solid `--palette-text-primary` (#222222)
- Text: `--palette-text-primary` (#222222)
- Same padding, radius, weight as primary
- Hover: background `--palette-bg-surface-secondary` (#f7f7f7)

### Cards

- Background: `--palette-bg-surface-primary` (#ffffff)
- Border radius: `12px`
- Box shadow: `0 6px 20px rgba(0,0,0,0.1)` (elevated), `0 2px 8px rgba(0,0,0,0.08)` (default)
- Padding: `24px`
- Hover: translateY(-4px), shadow increases
- No border by default

### Inputs

- Background: `--palette-bg-surface-primary` (#ffffff)
- Border: 1px solid `--palette-border-divider` (#dddddd)
- Border radius: `8px`
- Padding: `12px 16px`
- Font size: 16px (prevents iOS zoom)
- Focus: border-color `--palette-text-primary` (#222222), box-shadow: 0 0 0 2px rgba(34,34,34,0.2)
- Error: border-color `--palette-text-negative` (#e04450)
```

**Rules**:

- Cover all interactive states: default, hover, active, focus, disabled, error
- Use exact values from the color palette
- Include padding, radius, shadows, transitions
- Note unique behaviors (e.g., "16px font prevents iOS zoom")

---

## 5. Layout Principles

**Purpose**: How content is structured on the page — grids, spacing, containers.

**Format**: Rules with values.

**Structure**:

```markdown
## 5. Layout Principles

### Grid System

- Base unit: `8px` (all spacing is a multiple of 8)
- Max content width: `1280px`
- Grid: 12 columns, 24px gutters (desktop), 4 columns, 16px gutters (mobile)
- Container padding: `24px` (tablet), `48px` (desktop)

### Spacing Scale

| Token | Value | Usage                        |
| ----- | ----- | ---------------------------- |
| xs    | 4px   | Tight gaps (icon + text)     |
| sm    | 8px   | Small gaps (inline elements) |
| md    | 16px  | Standard gaps (form fields)  |
| lg    | 24px  | Card padding, section gaps   |
| xl    | 32px  | Section padding              |
| 2xl   | 48px  | Major section gaps           |
| 3xl   | 64px  | Hero padding, page margins   |
| 4xl   | 80px  | Full-screen sections         |

### Page Structure

- Hero sections: full-bleed or max-width, centered
- Content blocks: stacked vertically, alternating background colors for visual separation
- Image ratio: 4:3 for listing cards, 16:9 for hero/cover images
- Asymmetric: text left (50%), image right (50%) on feature sections
```

**Rules**:

- Specify the base unit (4px or 8px grid)
- Include max-width, grid columns, gutters
- Spacing scale with usage guidance
- Note any unique layout patterns (e.g., "alternating backgrounds")

---

## 6. Depth & Elevation

**Purpose**: Shadows, layering, z-index hierarchy.

**Format**: Named elevation levels with exact shadow values.

**Structure**:

```markdown
## 6. Depth & Elevation

### Shadow Scale

| Level        | Value                         | Usage                           |
| ------------ | ----------------------------- | ------------------------------- |
| 0 (flat)     | `none`                        | Inline elements, dividers       |
| 1 (raised)   | `0 2px 4px rgba(0,0,0,0.06)`  | Cards at rest, surfaces         |
| 2 (elevated) | `0 4px 12px rgba(0,0,0,0.1)`  | Cards on hover, dropdowns       |
| 3 (overlay)  | `0 8px 28px rgba(0,0,0,0.15)` | Modals, popovers, menus         |
| 4 (floating) | `0 16px 48px rgba(0,0,0,0.2)` | Toasts, tooltips, drag elements |

### Z-Index Scale

| Layer   | Value | Element                  |
| ------- | ----- | ------------------------ |
| Base    | 1     | Content                  |
| Sticky  | 100   | Sticky headers, sidebars |
| Overlay | 200   | Dropdown menus, popovers |
| Modal   | 300   | Modal dialogs            |
| Toast   | 400   | Toast notifications      |
| Fixed   | 500   | Fixed navigation bars    |
```

**Rules**:

- Use exact rgba values (not "light shadow")
- Name the elevation levels
- Specify what each level is used for
- Include z-index if the brand has a defined scale

---

## 7. Do's and Don'ts

**Purpose**: Specific, actionable rules that prevent common mistakes.

**Format**: Paired do/don't with brief explanation.

**Structure**:

```markdown
## 7. Do's and Don'ts

### Colors

- **DO** use Rausch Red (`#ff385c`) only for primary actions and critical highlights. It should draw the eye immediately.
- **DON'T** use red for non-action elements. If something is red, users will assume it's clickable or critical.

### Typography

- **DO** use the full type scale. Don't invent intermediate sizes — if 16px and 18px exist, use one or the other, not 17px.
- **DON'T** use more than 3 font weights per page. This brand uses 400, 600, and 700. Anything else looks off-brand.

### Spacing

- **DO** use the 8px grid. All padding, margins, and gaps should be multiples of 8 (4px only for tight icon+text spacing).
- **DON'T** center everything. This brand favors asymmetric layouts with clear visual hierarchy.

### Photography

- **DO** use authentic, diverse, real-looking photography. Images should feel candid, not stock-photo perfect.
- **DON'T** use illustrated or cartoon elements. This brand is photography-driven, never illustrative.

### Components

- **DO** give cards generous padding and breathing room. They should feel spacious, not dense.
- **DON'T** add borders to cards. This brand uses shadows and whitespace for separation.
```

**Rules**:

- Be SPECIFIC to the brand (not generic design advice)
- Reference exact values from earlier sections
- Explain WHY (not just what)
- Cover colors, typography, spacing, components, imagery
- 5-8 paired rules minimum

---

## 8. Responsive Behavior

**Purpose**: How the design adapts across breakpoints.

**Format**: Breakpoint table + per-component adaptation notes.

**Structure**:

```markdown
## 8. Responsive Behavior

### Breakpoints

| Name    | Width          | Target               |
| ------- | -------------- | -------------------- |
| Mobile  | < 768px        | Phones               |
| Tablet  | 768px – 1024px | iPads, small laptops |
| Desktop | > 1024px       | Laptops, monitors    |

### Key Adaptations

| Element    | Desktop                  | Tablet               | Mobile              |
| ---------- | ------------------------ | -------------------- | ------------------- |
| Navigation | Horizontal top bar       | Condensed horizontal | Hamburger menu      |
| Hero       | Full-width, text overlay | Full-width, stacked  | Cropped, text below |
| Grid       | 12 columns               | 8 columns            | 4 columns           |
| Cards      | 3–4 per row              | 2 per row            | 1 per row (stacked) |
| Font sizes | Full scale               | 90% of desktop       | 80% of desktop      |
| Spacing    | Full scale (8px grid)    | 80% of desktop       | 60% of desktop      |

### Mobile-Specific Rules

- Touch targets: minimum 44×44px (increase tap areas)
- No hover states: replace with tap feedback (opacity 0.7)
- Sticky bottom bar: primary CTA moves to fixed bottom bar on mobile
- Hide decorative elements: focus on content
```

**Rules**:

- Define breakpoints with px values
- Note what changes per component (not just "it's responsive")
- Include mobile-specific rules (touch targets, no hover)
- Note typography and spacing scale adjustments

---

## 9. Agent Prompt Guide

**Purpose**: The most important section — enables AI agents to generate on-brand output immediately.

**Format**: Quick reference table + example prompts + iteration rules.

**Structure**:

```markdown
## 9. Agent Prompt Guide

### Quick Color Reference

| Token             | Value                        | Use for                    |
| ----------------- | ---------------------------- | -------------------------- |
| Background        | `#ffffff`                    | Page, card, input surfaces |
| Text primary      | `#222222`                    | Headings, body text        |
| Text secondary    | `#717171`                    | Captions, labels           |
| Accent            | `#ff385c`                    | CTAs, links, highlights    |
| Border            | `#dddddd`                    | Inputs, dividers           |
| Surface secondary | `#f7f7f7`                    | Alternating sections       |
| Shadow            | `0 6px 20px rgba(0,0,0,0.1)` | Elevated cards             |

### Example Component Prompts

These prompts produce correct output when given to an AI agent:

1. **"Create a primary button: #ff385c background, white text, 14px 24px padding, 8px border-radius, 600 weight 16px font, hover darken to #e31c5f, focus 2px outline offset 2px."**

2. **"Create a listing card: white background, 12px border-radius, 24px padding, shadow 0 6px 20px rgba(0,0,0,0.1), hover translateY(-4px) with shadow 0 8px 28px rgba(0,0,0,0.15). Image 4:3 ratio at top."**

3. **"Create a search input: white background, 1px #dddddd border, 8px border-radius, 12px 16px padding, 16px font (prevents iOS zoom), focus border-color #222222 with 0 0 0 2px rgba(34,34,34,0.2) ring."**

4. **"Create a hero section: full-width, centered text over background image, h1 48px 700 weight -0.02em letter-spacing, subtitle 18px 400 weight 1.6 line-height, primary CTA button below."**

### Building in This Design System

1. **Start with the color palette.** Use only the defined colors. Never invent new colors or use generic values.
2. **Use the type scale exactly.** Pick from the defined sizes. Don't interpolate or create intermediate values.
3. **Follow the 8px grid.** All spacing, padding, and gaps are multiples of 8 (4px only for tight icon+text).
4. **Shadows, not borders, for depth.** Cards use shadows to separate from background. Don't add borders unless specified.
5. **Generous whitespace.** Components should feel spacious. Default card padding is 24px, not 16px.
6. **Photography over illustration.** Use real photos for visual content. Don't use SVG illustrations, icons as hero elements, or cartoon elements.
7. **Mobile-first for CTAs.** Primary actions should work on mobile: large touch targets, fixed bottom bar for key flows.
```

**Rules**:

- Quick reference must be COMPACT — one table, all essential values
- Example prompts must use EXACT values from the design system
- Example prompts should be copy-pasteable and produce correct output
- Iteration rules should be ordered: foundation → detail
- 5-7 rules minimum
- Rules should prevent common AI generation mistakes

---

## Writing Checklist

Before finalizing any section:

- [ ] Section 1: 2-4 sentences, prose, no technical details
- [ ] Section 2: All colors have hex values, named, grouped by function
- [ ] Section 3: Tables, px + rem, weights, line heights, letter spacing
- [ ] Section 4: All states covered (default, hover, active, focus, disabled, error)
- [ ] Section 5: Base unit, max-width, grid, spacing scale with usage
- [ ] Section 6: Exact rgba values, named levels, z-index if applicable
- [ ] Section 7: Brand-specific, references exact values, explains why
- [ ] Section 8: Breakpoints defined, per-component adaptations, mobile rules
- [ ] Section 9: Compact reference table, 3-5 example prompts, 5-7 iteration rules
