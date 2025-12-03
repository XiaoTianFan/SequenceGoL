# Material Atlas: Style & Aesthetic Summary

**Project:** Material Atlas for Coastal Construction (MACC)  
**Version:** Current Production  
**Date:** 2024

---

## 1. Design Philosophy

Material Atlas follows a **minimalist, high-tech aesthetic** with an academic research platform feel. The design emphasizes:

- **Content-first approach** - Data and information take precedence over decorative elements
- **Crisp, technical precision** - Sharp edges, no rounded corners, structured layouts
- **Dark mode only** - Deep charcoal backgrounds with high contrast text
- **Glass morphism** - Frosted glass panels with backdrop blur effects
- **Smooth micro-interactions** - Subtle animations that enhance usability without distraction

---

## 2. Color Palette

### Primary Colors (MACC Palette)

```css
/* Core Brand Colors */
--color-accent: #25e394;        /* Primary accent - Bright mint green */
--color-secondary: #328c67;     /* Secondary accent - Darker green */
--color-success: #999cf7;        /* Success/positive - Lavender purple */
--color-warning: #f16a71;        /* Warning/error - Coral red */
--color-highlight: #ffcb80;      /* Highlight - Warm peach */
--color-primary-bg: #171717;    /* Primary background - Near black */
```

### Semantic Colors

```css
/* Text & UI */
--foreground: #ededed;           /* Primary text color - Off white */
--background: var(--color-primary-bg);

/* Panel & Surface Colors */
--color-panel-bg: rgba(23, 23, 23, 0.6);
--color-panel-border: rgba(255, 255, 255, 0.08);

/* Background Opacity Variants (for layering) */
--color-primary-bg-90: rgba(23, 23, 23, 0.9);
--color-primary-bg-80: rgba(23, 23, 23, 0.8);
--color-primary-bg-60: rgba(23, 23, 23, 0.6);
--color-primary-bg-40: rgba(23, 23, 23, 0.4);
--color-primary-bg-20: rgba(23, 23, 23, 0.2);
--color-primary-bg-10: rgba(23, 23, 23, 0.1);
--color-primary-bg-5: rgba(23, 23, 23, 0.05);
```

### Color Usage Guidelines

- **Accent (#25e394)**: Primary CTAs, active states, hover highlights, links, active tab indicators
- **Secondary (#328c67)**: Secondary actions, muted accents, scrollbar default state
- **Success (#999cf7)**: Positive states, success messages, "Lab" section branding
- **Warning (#f16a71)**: Error states, warnings, "Studio" section branding
- **Highlight (#ffcb80)**: Emphasis, special highlights, "Compare" section branding
- **Foreground (#ededed)**: Primary text, headings, main content
- **Gray variants**: Secondary text, borders, dividers (typically `text-gray-400`, `text-gray-500`)

---

## 3. Typography

### Font Families

**Primary Font (Body & UI):**
- **Geist Mono** - Monospace font for all body text, UI elements, and code
- Fallback: System monospace fonts

**Display Font (Headings & Branding):**
- **Teko** - Sans-serif display font for large headings, brand name, section titles
- Applied via CSS variable: `var(--font-teko), sans-serif`
- Used for: Page titles, hero text, card titles, navigation labels

### Typography Scale

```css
/* Headings */
h1: text-4xl to text-7xl (responsive), font-bold, tracking-tight
h2: text-3xl to text-4xl, font-bold
h3: text-xl to text-2xl, font-bold

/* Body */
Base: text-sm to text-base (14-16px)
Small: text-xs to text-sm (12-14px)
Tiny: text-[10px] (10px) - for labels, badges

/* Special */
Uppercase labels: text-xs uppercase tracking-widest
Monospace IDs: font-mono text-xs
```

### Typography Patterns

- **Tight tracking** (`tracking-tight`) for headings
- **Wide tracking** (`tracking-widest`) for uppercase labels and badges
- **Line height**: Generally tight (`leading-tight`) for headings, relaxed (`leading-relaxed`) for body text
- **Font weights**: Primarily `font-bold` for headings, `font-medium` for emphasis, default for body

---

## 4. Layout & Spacing

### Border Radius

**CRITICAL:** No rounded corners anywhere in the design system.

```css
/* Global Reset */
* {
  border-radius: 0 !important;
}
```

- All buttons, cards, inputs, panels use sharp, square corners
- Exception: Some badges may use `rounded-full` or `rounded-sm` for specific UI elements (status badges), but this is minimal

### Spacing System

Uses Tailwind's default spacing scale:
- Small gaps: `gap-1`, `gap-2` (4-8px)
- Medium gaps: `gap-4`, `gap-6` (16-24px)
- Large gaps: `gap-8`, `gap-12` (32-48px)
- Padding: Typically `p-4`, `p-5`, `p-6`, `p-8` for cards/panels

### Grid & Layout

- **Card grids**: Responsive grid layouts (`grid md:grid-cols-2 lg:grid-cols-4`)
- **Flex layouts**: Common for navigation, toolbars, content sections
- **Full-bleed**: Some views (Atlas) use full-screen layouts with overlays

---

## 5. Glass Morphism Panels

### Standard Glass Panel

```css
.glass-panel {
  background: rgba(23, 23, 23, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(14px) saturate(160%);
}
```

### Panel Variations

**Light Panel:**
- Background: `bg-(--color-primary-bg-80)` or `bg-primary-bg/40`
- Border: `border border-white/10`
- Backdrop: `backdrop-blur-md` or `backdrop-blur-sm`

**Heavy Panel:**
- Background: `bg-(--color-primary-bg-90)`
- Border: `border-white/10` or `border-white/20`
- Backdrop: `backdrop-blur-lg`

**Transparent Panel:**
- Background: `bg-white/5` or `bg-white/10`
- Border: `border-white/10`
- Minimal backdrop blur

---

## 6. Component Patterns

### Cards

**Standard Card:**
```tsx
className="bg-(--color-primary-bg-80) border border-white/10 
           hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5 
           transition-all duration-300"
```

**Card Hover Effects:**
- Lift: `hover:y-[-4px]` or `scale-[1.02]`
- Border color change: `hover:border-accent/50`
- Shadow: `hover:shadow-lg hover:shadow-accent/5`
- Text color: `group-hover:text-accent`

### Buttons

**Primary Button:**
```tsx
className="px-8 py-4 bg-white text-black font-bold text-sm 
           uppercase tracking-wider hover:bg-accent transition-colors"
```

**Secondary Button:**
```tsx
className="px-8 py-4 bg-black/50 border border-white/20 text-white 
           font-bold text-sm uppercase tracking-wider 
           hover:bg-white/10 hover:border-white/40 transition-all backdrop-blur-sm"
```

**Ghost/Text Button:**
```tsx
className="text-gray-400 hover:text-white hover:bg-white/5 
           transition-colors"
```

### Inputs & Form Elements

**Text Input:**
```tsx
className="bg-(--color-primary-bg-90) border border-white/10 
           py-1.5 px-3 text-sm text-white 
           focus:outline-none focus:border-accent"
```

**Search Input:**
- Typically includes icon on left (`absolute left-2`)
- Padding left adjusted: `pl-8 pr-3`

### Tabs

**Tab Container:**
```tsx
className="flex space-x-1 border-b border-white/10"
```

**Tab Button:**
```tsx
className="px-4 py-2 text-sm font-medium transition-colors
           active: text-accent
           inactive: text-gray-400 hover:text-white"
```

**Active Tab Indicator:**
- Animated underline using Framer Motion `layoutId`
- `h-[2px]` or `h-0.5` height
- `bg-accent` color

### Badges & Labels

**Status Badge:**
```tsx
className="px-2.5 py-0.5 text-xs font-medium border rounded-full
           bg-[color]/10 text-[color] border-[color]/20"
```

**Type Label:**
```tsx
className="text-[10px] font-mono text-gray-500 border border-white/5 
           px-1.5 py-0.5 uppercase"
```

---

## 7. Animations & Transitions

### Animation Library

**Framer Motion** is used for all animations and transitions.

### Common Animation Patterns

**Page Transitions:**
```tsx
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.8, ease: "easeOut" }}
```

**Card Hover:**
```tsx
whileHover={{ y: -4, scale: 1.02 }}
whileTap={{ scale: 0.98 }}
```

**Modal/Drawer Entrance:**
```tsx
initial={{ scale: 0.95, opacity: 0, y: 20 }}
animate={{ scale: 1, opacity: 1, y: 0 }}
exit={{ scale: 0.95, opacity: 0, y: 20 }}
```

**Spring Animations:**
```tsx
// For smooth, physics-based animations
useSpring(motionValue, { stiffness: 300, damping: 30 })
```

**Layout Animations:**
```tsx
// For shared element transitions (tabs, active states)
<motion.div layoutId="activeTab" />
```

### Transition Timing

- **Fast**: 200ms (`duration-200`, `transition-colors`)
- **Standard**: 300ms (`duration-300`)
- **Smooth**: 500-700ms for page transitions
- **Easing**: Typically `easeInOut` or `easeOut`

---

## 8. Scrollbar Styling

```css
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--color-secondary); /* #328c67 */
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-accent); /* #25e394 */
}
```

---

## 9. Iconography

**Library:** Lucide React

**Icon Sizes:**
- Small: `size={12}` or `h-3 w-3` (12px)
- Medium: `size={14}` or `h-4 w-4` (16px)
- Large: `size={20}` or `h-5 w-5` (20px)
- Extra Large: `size={32}` or `h-8 w-8` (32px)

**Icon Usage:**
- Outline style (default Lucide style)
- Consistent stroke width
- Used inline with text or as standalone elements
- Color typically matches text color or accent color

---

## 10. Shadows & Effects

### Shadow Patterns

**Card Hover Shadow:**
```css
hover:shadow-lg hover:shadow-accent/5
```

**Modal Shadow:**
```css
shadow-2xl
```

**Glow Effects:**
- Rarely used, but when present: `shadow-accent/20` or similar

### Backdrop Effects

**Gradient Overlays:**
```css
bg-[radial-gradient(circle_at_center,rgba(23,23,23,0.4)_0%,rgba(23,23,23,0.2)_100%)]
bg-linear-to-b from-primary-bg/20 via-primary-bg/10 to-primary-bg/90
```

---

## 11. Interactive States

### Hover States

- **Links**: `hover:text-accent`
- **Buttons**: Background color change, border color change
- **Cards**: Lift effect, border highlight, shadow
- **Icons**: Color change to accent

### Active States

- **Tabs**: Accent color text, animated underline
- **Buttons**: Slightly darker/lighter than hover
- **Selected Items**: Accent border or background

### Focus States

- **Inputs**: `focus:border-accent` with `focus:outline-none`
- **Buttons**: Typically same as hover
- **Keyboard Navigation**: Ensure visible focus indicators

### Disabled States

- **Opacity**: `opacity-50` or `disabled:opacity-50`
- **Cursor**: `disabled:cursor-not-allowed`
- **Hover**: Disabled on disabled elements

---

## 12. Responsive Design

### Breakpoints

Uses Tailwind's default breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

### Responsive Patterns

- **Typography**: `text-4xl md:text-7xl` (scales up on larger screens)
- **Grids**: `grid md:grid-cols-2 lg:grid-cols-4`
- **Spacing**: `px-4 md:px-6 lg:px-8`
- **Visibility**: `hidden md:block` for desktop-only elements

### Mobile Considerations

- Full-screen overlays for modals/drawers on mobile
- Stacked layouts (`flex-col md:flex-row`)
- Touch-friendly tap targets (minimum 44x44px)

---

## 13. Data Visualization

### Chart Colors

Uses the MACC palette for data visualization:
- Primary series: Accent color (#25e394)
- Secondary series: Success (#999cf7)
- Tertiary: Warning (#f16a71)
- Additional: Highlight (#ffcb80)

### Graph/Network Visualization

- Dark background with accent-colored nodes
- Subtle edges/connections
- Interactive hover states with accent highlights

---

## 14. Accessibility Considerations

### Color Contrast

- Foreground (#ededed) on Primary BG (#171717) = High contrast
- Accent (#25e394) on Primary BG = Good contrast
- Ensure sufficient contrast for all text/background combinations

### Focus Indicators

- Visible focus states on interactive elements
- Keyboard navigation support
- Screen reader friendly labels (`sr-only` class for icon-only buttons)

### Typography

- Minimum font size: 12px (typically 14px+)
- Sufficient line height for readability
- Clear hierarchy with font sizes and weights

---

## 15. Implementation Notes

### CSS Architecture

- **Tailwind CSS 4** with `@theme` directive for custom properties
- **CSS Variables** for theming and dynamic values
- **Utility-first** approach with custom utilities where needed

### Component Structure

- **shadcn/ui** components as base (customized to match style)
- **Radix UI** primitives for accessible components
- Custom components built on top of base system

### State Management

- **Zustand** for global state
- **TanStack Query** for server state
- **Framer Motion** for animation state

---

## 16. Key Visual Characteristics Summary

1. **Sharp, angular** - No rounded corners
2. **Dark & high contrast** - Near-black backgrounds, bright accents
3. **Glass morphism** - Frosted, semi-transparent panels
4. **Monospace typography** - Technical, code-like feel
5. **Smooth animations** - Physics-based, spring animations
6. **Minimal chrome** - Focus on content, not decoration
7. **Color-coded sections** - Each major section has its accent color
8. **Layered depth** - Multiple opacity levels create visual hierarchy
9. **Precise spacing** - Clean, structured layouts
10. **Interactive feedback** - Clear hover, active, and focus states

---

## 17. Example Component Implementations

### Header/Navigation

- Transparent by default, darkens on hover
- Centered navigation with animated active indicator
- Brand name on left, user actions on right
- Smooth opacity transitions

### Cards

- Glass panel background
- Border that highlights on hover
- Subtle lift animation
- Accent color text on hover for titles

### Tables/Data Views

- Dark backgrounds with subtle borders
- Row hover states
- Accent-colored highlights for active/selected rows
- Monospace font for IDs and codes

### Modals/Drawers

- Backdrop blur overlay
- Glass panel content area
- Smooth scale + fade entrance
- Close on backdrop click or ESC key

---

## 18. Brand Identity

**Name:** Materials Atlas (or Material Atlas)  
**Tagline:** "Materials Atlas for Coastal Construction"  
**Visual Identity:** Technical, research-focused, data-driven  
**Tone:** Professional, academic, precise, minimalist

---

## Quick Reference: Color Codes

| Purpose | Hex Code | CSS Variable |
|---------|----------|--------------|
| Primary Accent | `#25e394` | `--color-accent` |
| Secondary | `#328c67` | `--color-secondary` |
| Success | `#999cf7` | `--color-success` |
| Warning | `#f16a71` | `--color-warning` |
| Highlight | `#ffcb80` | `--color-highlight` |
| Background | `#171717` | `--color-primary-bg` |
| Foreground | `#ededed` | `--foreground` |

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Maintained By:** Material Atlas Design Team

