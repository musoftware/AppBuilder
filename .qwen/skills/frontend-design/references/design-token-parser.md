# Design Token Parser

How to read DESIGN.md files from getdesign.md and map them to usable CSS custom properties.

## DESIGN.md Structure

Each DESIGN.md file from `https://getdesign.md/{brand}/design-md` follows this general structure:

```markdown
# {Brand} Design System

## Colors

- Primary: #XXXXXX
- Secondary: #XXXXXX
- Background: #XXXXXX
- Text: #XXXXXX
- Accent: #XXXXXX

## Typography

- Display Font: Font Name
- Body Font: Font Name
- Heading sizes: h1: XXpx, h2: XXpx, h3: XXpx
- Body size: XXpx
- Line height: X.X

## Spacing

- Scale: 4px, 8px, 16px, 24px, 32px, 48px, 64px

## Border Radius

- Small: Xpx
- Medium: Xpx
- Large: Xpx

## Shadows

- Small: 0 Xpx Xpx rgba(...)
- Medium: 0 Xpx Xpx rgba(...)
- Large: 0 Xpx Xpx rgba(...)

## Motion

- Duration: Xms
- Easing: cubic-bezier(...)

## Layout

- Max width: XXXpx
- Grid: X columns
- Container padding: XXpx
```

Note: Not every file will have every section. Use what's available and apply sensible defaults for the rest.

## Extraction Rules

### Colors

Extract all color values and map to semantic CSS variables:

```css
:root {
  --color-primary: #635bff; /* Main brand color */
  --color-secondary: #0a2540; /* Secondary brand color */
  --color-accent: #00d4aa; /* Highlight/CTA accent */
  --color-background: #ffffff; /* Page background */
  --color-surface: #f6f9fc; /* Card/surface background */
  --color-text: #0a2540; /* Primary text */
  --color-text-secondary: #425466; /* Secondary/muted text */
  --color-border: #e3e8ee; /* Border/divider color */
  --color-success: #3ecf8e; /* Success state */
  --color-warning: #f5a623; /* Warning state */
  --color-error: #ff4f4f; /* Error state */
}
```

**Gradient extraction**: If a gradient is mentioned (e.g., Stripe's signature angled gradient):

```css
:root {
  --gradient-primary: linear-gradient(135deg, #635bff 0%, #00d4aa 100%);
  --gradient-hero: linear-gradient(
    150deg,
    #0a2540 0%,
    #635bff 50%,
    #00d4aa 100%
  );
}
```

**Dark mode**: If both light and dark tokens exist, use media query:

```css
:root {
  --color-background: #ffffff;
  --color-text: #0a2540;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #0a0a0a;
    --color-text: #ffffff;
    --color-surface: #1a1a1a;
    --color-border: #2a2a2a;
  }
}
```

### Typography

Extract font information:

```css
:root {
  --font-display: 'Söhne', sans-serif; /* Headings, hero text */
  --font-body: 'Inter', sans-serif; /* Body copy, UI text */
  --font-mono: 'JetBrains Mono', monospace; /* Code, terminal */

  --text-xs: 0.75rem; /* 12px — captions, labels */
  --text-sm: 0.875rem; /* 14px — secondary text */
  --text-base: 1rem; /* 16px — body */
  --text-lg: 1.125rem; /* 18px — lead text */
  --text-xl: 1.25rem; /* 20px — small headings */
  --text-2xl: 1.5rem; /* 24px — section headings */
  --text-3xl: 2rem; /* 32px — page headings */
  --text-4xl: 2.5rem; /* 40px — hero headings */
  --text-5xl: 3.5rem; /* 56px — display/large hero */

  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --line-height-tight: 1.1; /* Headings */
  --line-height-base: 1.5; /* Body */
  --line-height-relaxed: 1.7; /* Long-form text */

  --letter-spacing-tight: -0.02em; /* Display headings */
  --letter-spacing-normal: 0; /* Body */
  --letter-spacing-wide: 0.05em; /* Labels, uppercase */
}
```

**Font loading**: If using Google Fonts, add to HTML:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link
  href="https://fonts.googleapis.com/css2?family=Font+Name:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

For non-Google fonts (Söhne, Clash Display, etc.), note them in a comment and use the closest available alternative if needed.

### Spacing

Extract the spacing scale:

```css
:root {
  --space-1: 4px; /* Tight gaps, icon padding */
  --space-2: 8px; /* Small gaps, button padding */
  --space-3: 12px; /* Moderate padding */
  --space-4: 16px; /* Standard gap, card padding */
  --space-5: 24px; /* Section padding */
  --space-6: 32px; /* Large section gap */
  --space-8: 48px; /* Major section gap */
  --space-10: 64px; /* Hero padding */
  --space-12: 80px; /* Page margins */
  --space-16: 128px; /* Full-screen sections */
}
```

If the DESIGN.md only gives a base value (e.g., "8px grid"), derive the scale:

```css
--space-unit: 8px;
--space-1: calc(var(--space-unit) * 0.5); /* 4px */
--space-2: var(--space-unit); /* 8px */
--space-3: calc(var(--space-unit) * 1.5); /* 12px */
--space-4: calc(var(--space-unit) * 2); /* 16px */
--space-5: calc(var(--space-unit) * 3); /* 24px */
--space-6: calc(var(--space-unit) * 4); /* 32px */
--space-8: calc(var(--space-unit) * 6); /* 48px */
--space-10: calc(var(--space-unit) * 8); /* 64px */
```

### Border Radius

```css
:root {
  --radius-none: 0; /* Sharp corners */
  --radius-sm: 4px; /* Subtle rounding */
  --radius-md: 8px; /* Standard cards */
  --radius-lg: 12px; /* Large cards, modals */
  --radius-xl: 16px; /* Panels */
  --radius-2xl: 24px; /* Large panels */
  --radius-full: 9999px; /* Pills, circles */
}
```

### Shadows

Extract shadow values or create from elevation description:

```css
:root {
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
  --shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.25);
  --shadow-inner: inset 0 2px 4px rgba(0, 0, 0, 0.06);
}
```

**Colored shadows** (common in Stripe, Framer, etc.):

```css
:root {
  --shadow-primary: 0 4px 14px rgba(99, 91, 255, 0.25);
  --shadow-accent: 0 4px 14px rgba(0, 212, 170, 0.25);
}
```

### Motion

```css
:root {
  --duration-fast: 100ms;
  --duration-base: 200ms;
  --duration-slow: 300ms;
  --duration-slower: 500ms;

  --ease-default: cubic-bezier(0.4, 0, 0.2, 1); /* Standard ease */
  --ease-in: cubic-bezier(0.4, 0, 1, 1); /* Accelerating */
  --ease-out: cubic-bezier(0, 0, 0.2, 1); /* Decelerating */
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1); /* Spring bounce */
}
```

### Layout

```css
:root {
  --max-width-xs: 480px; /* Mobile content */
  --max-width-sm: 640px; /* Small content */
  --max-width-md: 768px; /* Medium content, blog width */
  --max-width-lg: 1024px; /* Standard content */
  --max-width-xl: 1280px; /* Wide content */
  --max-width-2xl: 1536px; /* Full width */

  --container-padding: 24px; /* Mobile */
}

@media (min-width: 768px) {
  :root {
    --container-padding: 48px; /* Tablet+ */
  }
}
```

## Fallback Values

When tokens are missing from the DESIGN.md, use these defaults:

```css
:root {
  /* Colors */
  --color-primary: #6366f1;
  --color-background: #ffffff;
  --color-surface: #f8f9fa;
  --color-text: #1a1a2e;
  --color-text-secondary: #6b7280;
  --color-border: #e5e7eb;

  /* Typography */
  --font-display: system-ui, sans-serif;
  --font-body: system-ui, sans-serif;
  --text-base: 1rem;
  --line-height-base: 1.5;

  /* Spacing */
  --space-4: 16px;

  /* Border radius */
  --radius-md: 8px;

  /* Shadows */
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);

  /* Motion */
  --duration-base: 200ms;
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
}
```

## Applying Tokens

Once extracted, apply tokens consistently:

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--duration-base) var(--ease-default);
}

.card:hover {
  box-shadow: var(--shadow-md);
}

.heading {
  font-family: var(--font-display);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tight);
  color: var(--color-text);
}

.body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: var(--line-height-base);
  color: var(--color-text-secondary);
}

.button-primary {
  background: var(--color-primary);
  color: white;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-semibold);
  transition: all var(--duration-base) var(--ease-default);
}

.button-primary:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}
```

## Quick Reference: Token → Property Map

| Token                    | CSS Property                          | Common Use                 |
| ------------------------ | ------------------------------------- | -------------------------- |
| `--color-primary`        | `background`, `color`, `border-color` | CTAs, links, active states |
| `--color-text`           | `color`                               | Headings, primary text     |
| `--color-text-secondary` | `color`                               | Body text, captions        |
| `--font-display`         | `font-family`                         | h1-h3, hero text           |
| `--font-body`            | `font-family`                         | paragraphs, labels         |
| `--space-*`              | `padding`, `margin`, `gap`            | All spacing                |
| `--radius-*`             | `border-radius`                       | Cards, buttons, inputs     |
| `--shadow-*`             | `box-shadow`                          | Cards, dropdowns, modals   |
| `--duration-*`           | `transition-duration`                 | Hover, focus, page load    |
| `--ease-*`               | `transition-timing-function`          | Motion curves              |
