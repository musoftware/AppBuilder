# Component Patterns

Reusable UI patterns organized by aesthetic category. Use these as starting points when generating components.

## Dark Precision (Vercel, Linear, Cursor, Raycast)

Characteristics: Deep blacks, sharp whites, single accent color, minimal ornamentation, monospace accents, terminal/editor vibes.

### Hero Section

```css
.hero {
  background: #000;
  color: #fff;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-8);
}

.hero h1 {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 8vw, 5rem);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1;
  margin-bottom: var(--space-4);
}

.hero p {
  font-size: var(--text-lg);
  color: #888;
  max-width: 600px;
  margin: 0 auto var(--space-6);
}

.hero .cta {
  background: #fff;
  color: #000;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: var(--text-sm);
  text-decoration: none;
  transition: all var(--duration-base) var(--ease-default);
}

.hero .cta:hover {
  background: #e5e5e5;
  transform: scale(1.05);
}
```

### Card

```css
.card-dark {
  background: #0a0a0a;
  border: 1px solid #1a1a1a;
  border-radius: var(--radius-md);
  padding: var(--space-4);
  color: #fff;
  transition: border-color var(--duration-base) var(--ease-default);
}

.card-dark:hover {
  border-color: #333;
}

.card-dark h3 {
  font-size: var(--text-lg);
  font-weight: 600;
  margin-bottom: var(--space-2);
}

.card-dark p {
  color: #888;
  font-size: var(--text-sm);
  line-height: var(--line-height-base);
}
```

### Navbar

```css
.navbar-dark {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid #1a1a1a;
  padding: var(--space-3) var(--space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-dark .logo {
  font-weight: 700;
  font-size: var(--text-lg);
  color: #fff;
  text-decoration: none;
}

.navbar-dark nav {
  display: flex;
  gap: var(--space-4);
}

.navbar-dark nav a {
  color: #888;
  text-decoration: none;
  font-size: var(--text-sm);
  transition: color var(--duration-base) var(--ease-default);
}

.navbar-dark nav a:hover {
  color: #fff;
}
```

### CLI-Style Element

```html
<div class="terminal">
  <div class="terminal-header">
    <span class="dot red"></span>
    <span class="dot yellow"></span>
    <span class="dot green"></span>
    <span class="title">terminal</span>
  </div>
  <div class="terminal-body">
    <p><span class="prompt">$</span> deploy --prod</p>
    <p class="output">✓ Deployed successfully in 2.3s</p>
    <p><span class="prompt">$</span> <span class="cursor"></span></p>
  </div>
</div>
```

```css
.terminal {
  background: #0a0a0a;
  border-radius: var(--radius-md);
  overflow: hidden;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  border: 1px solid #1a1a1a;
}

.terminal-header {
  background: #141414;
  padding: var(--space-2) var(--space-3);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.dot.red {
  background: #ff5f56;
}
.dot.yellow {
  background: #ffbd2e;
}
.dot.green {
  background: #27c93f;
}

.terminal-body {
  padding: var(--space-4);
  color: #e5e5e5;
}

.prompt {
  color: #27c93f;
}
.output {
  color: #888;
  margin: var(--space-2) 0;
}

.cursor {
  display: inline-block;
  width: 8px;
  height: 1em;
  background: #e5e5e5;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}
```

---

## Gradient-Rich (Stripe, Cohere, Framer, Arc)

Characteristics: Bold gradients, angled backgrounds, weight-300 typography, layered transparencies, creative color combinations.

### Hero with Angled Gradient

```css
.hero-gradient {
  position: relative;
  background: linear-gradient(150deg, #0a2540 0%, #635bff 50%, #00d4aa 100%);
  color: #fff;
  padding: var(--space-16) var(--space-4);
  text-align: center;
  overflow: hidden;
}

.hero-gradient::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url('data:image/svg+xml,...'); /* Mesh or noise texture */
  opacity: 0.1;
}

.hero-gradient h1 {
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 300; /* Light weight for elegance */
  letter-spacing: -0.02em;
  position: relative;
  z-index: 1;
}

.hero-gradient p {
  font-size: var(--text-lg);
  opacity: 0.9;
  max-width: 640px;
  margin: var(--space-4) auto var(--space-6);
  position: relative;
  z-index: 1;
}

.hero-gradient .cta {
  background: #fff;
  color: #0a2540;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-full);
  font-weight: 600;
  text-decoration: none;
  position: relative;
  z-index: 1;
  transition: transform var(--duration-base) var(--ease-default);
}

.hero-gradient .cta:hover {
  transform: translateY(-2px);
}
```

### Pricing Card

```css
.pricing-card {
  background: #fff;
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.pricing-card.featured {
  background: linear-gradient(135deg, #635bff 0%, #00d4aa 100%);
  color: #fff;
}

.pricing-card.featured .price,
.pricing-card.featured .feature {
  color: #fff;
}

.pricing-card .plan {
  font-size: var(--text-sm);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 600;
  color: #635bff;
  margin-bottom: var(--space-2);
}

.pricing-card .price {
  font-size: var(--text-5xl);
  font-weight: 700;
  color: #0a2540;
  margin-bottom: var(--space-4);
}

.pricing-card .feature {
  color: #425466;
  font-size: var(--text-sm);
  padding: var(--space-2) 0;
  border-bottom: 1px solid #e3e8ee;
}
```

### Gradient Button

```css
.btn-gradient {
  background: linear-gradient(135deg, #635bff 0%, #00d4aa 100%);
  color: #fff;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-full);
  font-weight: 600;
  border: none;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition:
    transform var(--duration-base) var(--ease-default),
    box-shadow var(--duration-base) var(--ease-default);
}

.btn-gradient::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #7c73ff 0%, #33e0c0 100%);
  opacity: 0;
  transition: opacity var(--duration-base) var(--ease-default);
}

.btn-gradient:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(99, 91, 255, 0.4);
}

.btn-gradient:hover::before {
  opacity: 1;
}

.btn-gradient span {
  position: relative;
  z-index: 1;
}
```

---

## Editorial/Warm (Notion, Airbnb, Substack, Medium)

Characteristics: Warm whites, serif typography, large imagery, block-based layouts, reading-optimized, human-centered.

### Blog Post Layout

```css
.article {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-4);
}

.article .cover-image {
  width: calc(100% + var(--space-8));
  margin-left: calc(var(--space-4) * -1);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-6);
  aspect-ratio: 16/9;
  object-fit: cover;
}

.article h1 {
  font-family: var(--font-display); /* Serif font */
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  line-height: 1.2;
  color: #1a1a1a;
  margin-bottom: var(--space-3);
}

.article .meta {
  color: #666;
  font-size: var(--text-sm);
  margin-bottom: var(--space-6);
  display: flex;
  gap: var(--space-3);
}

.article .content {
  font-family: var(--font-body);
  font-size: var(--text-lg);
  line-height: var(--line-height-relaxed);
  color: #333;
}

.article .content p {
  margin-bottom: var(--space-4);
}

.article .content h2 {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  margin-top: var(--space-8);
  margin-bottom: var(--space-3);
}

.article .content blockquote {
  border-left: 3px solid #1a1a1a;
  padding-left: var(--space-4);
  margin: var(--space-6) 0;
  font-style: italic;
  color: #555;
}
```

### Property Card (Airbnb-style)

```css
.property-card {
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: #fff;
  box-shadow: var(--shadow-sm);
  transition:
    transform var(--duration-base) var(--ease-default),
    box-shadow var(--duration-base) var(--ease-default);
}

.property-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.property-card .image {
  aspect-ratio: 1/1;
  object-fit: cover;
  width: 100%;
}

.property-card .content {
  padding: var(--space-3);
}

.property-card .location {
  font-weight: 600;
  font-size: var(--text-base);
  color: #1a1a1a;
  margin-bottom: var(--space-1);
}

.property-card .details {
  color: #717171;
  font-size: var(--text-sm);
}

.property-card .price {
  margin-top: var(--space-2);
  font-size: var(--text-base);
}

.property-card .price strong {
  font-weight: 600;
  color: #1a1a1a;
}
```

---

## Automotive/Luxury (Ferrari, BMW, Tesla)

Characteristics: Full-viewport heroes, dramatic imagery, spec tables, bold typography, speed/luxury vibes.

### Full-V viewport Hero

```css
.hero-auto {
  position: relative;
  height: 100vh;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.hero-auto .bg {
  position: absolute;
  inset: 0;
  background: url('/car-hero.jpg') center/cover no-repeat;
}

.hero-auto .overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 60%);
}

.hero-auto .content {
  position: relative;
  z-index: 1;
  padding: var(--space-8);
  color: #fff;
  max-width: 800px;
}

.hero-auto h1 {
  font-size: clamp(3rem, 10vw, 6rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 0.95;
  text-transform: uppercase;
}

.hero-auto .tagline {
  font-size: var(--text-xl);
  opacity: 0.8;
  margin-top: var(--space-3);
}

.hero-auto .cta-group {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

.hero-auto .btn-primary {
  background: #fff;
  color: #000;
  padding: var(--space-3) var(--space-6);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: all var(--duration-base) var(--ease-default);
}

.hero-auto .btn-primary:hover {
  background: #e5e5e5;
}

.hero-auto .btn-outline {
  border: 2px solid #fff;
  color: #fff;
  padding: var(--space-3) var(--space-6);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-decoration: none;
  transition: all var(--duration-base) var(--ease-default);
}

.hero-auto .btn-outline:hover {
  background: #fff;
  color: #000;
}
```

### Spec Table

```css
.spec-table {
  width: 100%;
  border-collapse: collapse;
}

.spec-table th,
.spec-table td {
  text-align: left;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid #e5e5e5;
}

.spec-table th {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #666;
  font-weight: 600;
}

.spec-table td {
  font-size: var(--text-lg);
  font-weight: 600;
  color: #1a1a1a;
}

.spec-table tr:last-child td {
  border-bottom: none;
}
```

---

## Dev-Tool Dashboard (Supabase, PostHog, Sentry, GitHub)

Characteristics: Data-dense, monospace accents, status indicators, table-heavy, sidebar navigation, action-oriented.

### Dashboard Layout

```css
.dashboard {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
}

.sidebar {
  background: #1a1a2e;
  color: #fff;
  padding: var(--space-4);
  border-right: 1px solid #2a2a3e;
}

.sidebar .logo {
  font-size: var(--text-xl);
  font-weight: 700;
  margin-bottom: var(--space-6);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.sidebar nav a {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: #8888aa;
  text-decoration: none;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  transition: all var(--duration-base) var(--ease-default);
}

.sidebar nav a:hover,
.sidebar nav a.active {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.main {
  background: #0f0f1a;
  padding: var(--space-6);
  color: #e5e5e5;
}

.main h1 {
  font-size: var(--text-2xl);
  font-weight: 700;
  margin-bottom: var(--space-6);
}
```

### Stat Card

```css
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.stat-card {
  background: #1a1a2e;
  border: 1px solid #2a2a3e;
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.stat-card .label {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #8888aa;
  margin-bottom: var(--space-2);
}

.stat-card .value {
  font-size: var(--text-3xl);
  font-weight: 700;
  color: #fff;
  font-family: var(--font-mono);
}

.stat-card .change {
  font-size: var(--text-sm);
  margin-top: var(--space-1);
}

.stat-card .change.positive {
  color: #3ecf8e;
}

.stat-card .change.negative {
  color: #ff4f4f;
}
```

### Data Table

```css
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.data-table th {
  text-align: left;
  padding: var(--space-3) var(--space-4);
  background: #1a1a2e;
  color: #8888aa;
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  border-bottom: 1px solid #2a2a3e;
}

.data-table td {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid #1a1a2e;
  color: #e5e5e5;
}

.data-table tr:hover td {
  background: rgba(255, 255, 255, 0.02);
}

.status-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.success {
  background: rgba(62, 207, 142, 0.2);
  color: #3ecf8e;
}

.status-badge.error {
  background: rgba(255, 79, 79, 0.2);
  color: #ff4f4f;
}

.status-badge.warning {
  background: rgba(245, 166, 35, 0.2);
  color: #f5a623;
}
```

---

## Playful/Toy-like (Figma, Discord, Slack, Duolingo)

Characteristics: Rounded corners, bright colors, friendly vibes, illustrative elements, approachable design.

### Friendly Card

```css
.card-playful {
  background: #fff;
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
  transition: all var(--duration-base) var(--ease-default);
}

.card-playful:hover {
  border-color: #5865f2; /* Discord blurple or brand accent */
  transform: translateY(-4px) rotate(-1deg);
  box-shadow: 0 8px 24px rgba(88, 101, 242, 0.15);
}

.card-playful .icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, #5865f2, #7289da);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-3);
  font-size: var(--text-2xl);
}

.card-playful h3 {
  font-size: var(--text-xl);
  font-weight: 700;
  color: #232323;
  margin-bottom: var(--space-2);
}

.card-playful p {
  color: #6b7280;
  line-height: var(--line-height-base);
}
```

### Playful Button

```css
.btn-playful {
  background: #5865f2;
  color: #fff;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-full);
  font-weight: 700;
  font-size: var(--text-sm);
  border: none;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all var(--duration-base) var(--ease-bounce);
}

.btn-playful:hover {
  transform: scale(1.05) rotate(-2deg);
  box-shadow: 0 4px 12px rgba(88, 101, 242, 0.4);
}

.btn-playful:active {
  transform: scale(0.95);
}
```

---

## Usage Notes

1. **Mix and match** — A project might use a dark precision navbar with playful cards. Don't be rigid about categories.
2. **Adapt, don't copy** — These are starting points. Modify colors, spacing, and animations to match the specific brand's tokens.
3. **Animation matters** — The CSS transitions and hover states are part of the aesthetic. Don't strip them out.
4. **Responsive** — All patterns should be adapted for mobile. Use `clamp()` for fluid typography and CSS Grid for flexible layouts.
5. **Accessibility** — Ensure sufficient color contrast (4.5:1 minimum for body text). Add `:focus-visible` styles for keyboard users.
