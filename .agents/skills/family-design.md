# Family Design System - CoFHE UI Style

## Overview

This skill defines the **Family** design system used for CoFHE interfaces. It's a playful illustrated style that makes fintech feel like an adventure game — warm, approachable, and memorable.

**Theme:** Light  
**Mood:** Children's book meets fintech dashboard  
**Character:** Pixar storyboard on cream paper with expressive flat-illustrated characters

## Color Tokens

### Surfaces
| Name | Value | Token | Purpose |
|------|-------|-------|---------|
| Warm Canvas | `#fbfaf9` | `--color-warm-canvas` | Page background, nav background, light button fill |
| Stone Surface | `#f2f0ed` | `--color-stone-surface` | Card inset border color, secondary button background |
| Parchment Card | `#f8f7f4` | `--color-parchment-card` | Feature card backgrounds |
| Card | `#ffffff` | `--color-card` | White card faces |
| Dark | `#000000` | `--color-dark` | Phone mockup cards, obsidian surfaces |

### Text
| Name | Value | Token | Purpose |
|------|-------|-------|---------|
| Graphite | `#474645` | `--color-graphite` | Body text, nav links, card body copy |
| Charcoal Primary | `#343433` | `--color-charcoal-primary` | Nav text, headings |
| Midnight | `#121212` | `--color-midnight` | Primary CTA button, high-contrast heading |
| Ash | `#848281` | `--color-ash` | Muted body text, secondary labels |
| Fog | `#c6c6c6` | `--color-fog` | Footer text, inactive borders |
| Smoke | `#a7a7a7` | `--color-smoke` | Disabled states, placeholder text |

### Brand - Primary
| Name | Value | Token |
|------|-------|-------|
| Ember Orange | `#ff3e00` | `--color-ember-orange` |

### Brand - Secondary
| Name | Value | Token |
|------|-------|-------|
| Meadow Green | `#00ca48` | `--color-meadow-green` |

### Brand - Tertiary
| Name | Value | Token |
|------|-------|-------|
| Sky Blue | `#0090ff` | `--color-sky-blue` |

### Brand - Quaternary
| Name | Value | Token |
|------|-------|-------|
| Sunburst Yellow | `#ffbb26` | `--color-sunburst-yellow` |

### Illustration Colors
| Name | Value |
|------|-------|
| Deep Amber | `#d48f00` |
| Ocean Blue | `#0086fc` |
| Ice Blue | `#64c6ff` |
| Spearmint | `#00c978` |
| Flamingo | `#ff58ae` |
| Violet Pop | `#9f4fff` |
| Coral Red | `#ff2b3a` |
| Valid Green | `#00c454` |

## Typography

### Font Families
- **Display (Hero):** Fraunces, Georgia, serif — weight 500
- **Body (UI):** Inter, system-ui, sans-serif — weights 400, 500, 600

### Type Scale
| Role | Size | Line Height | Letter Spacing | Token |
|------|------|-------------|----------------|-------|
| caption | 12px | 1.58 | -0.14px | `--text-caption` |
| body | 15px | 1.47 | -0.2px | `--text-body` |
| heading-sm | 19px | 1.38 | -0.25px | `--text-heading-sm` |
| heading | 23px | 1.2 | -0.44px | `--text-heading` |
| heading-lg | 44px | 1.09 | -1.14px | `--text-heading-lg` |
| display | 68px | 1.09 | -2.11px | `--text-display` |

## Spacing (4px base)

| Name | Value | Token |
|------|-------|-------|
| 4 | 4px | `--spacing-4` |
| 8 | 8px | `--spacing-8` |
| 12 | 12px | `--spacing-12` |
| 16 | 16px | `--spacing-16` |
| 20 | 20px | `--spacing-20` |
| 24 | 24px | `--spacing-24` |
| 28 | 28px | `--spacing-28` |
| 32 | 32px | `--spacing-32` |
| 36 | 36px | `--spacing-36` |
| 48 | 48px | `--spacing-48` |
| 60 | 60px | `--spacing-60` |
| 76 | 76px | `--spacing-76` |
| 80 | 80px | `--spacing-80` |
| 92 | 92px | `--spacing-92` |
| 96 | 96px | `--spacing-96` |
| 104 | 104px | `--spacing-104` |

## Border Radius

| Name | Value |
|------|-------|
| sm | 6px |
| md | 10px |
| lg | 17px |
| xl | 24px |
| 2xl | 32px |
| 3xl | 40px |
| full | 72px |

### Named Radii
- `tags`: 6px
- `cards`: 10px
- `icons`: 40px
- `inputs`: 10px
- `buttons`: 32px
- `cards-large`: 24px
- `buttons-pill`: 32px
- `illustrations`: 72px

## Shadows

| Name | Value | Token |
|------|-------|-------|
| subtle | `inset 0 0 0 1px #f2f0ed` | `--shadow-subtle` |
| card | `inset 0 0 0 1px #f2f0ed` | Card with warm stone border |
| phone | `0 0 24px 0 rgba(0,0,0,0.15)` | Dark phone mockup |
| nav | `0 0 0 1px rgba(0,0,0,0.04)` | Navigation bar |
| lg | `0 0 24px 0 rgba(0,0,0,0.15)` | Large elevation |
| sm | `0 1px 6px 0 rgba(0,0,0,0.04), 0 0 24px 0 rgba(0,0,0,0.05)` | Small elevation |

## Layout

- **Page max-width:** 1200px
- **Section gap:** 120-180px
- **Card padding:** 32px
- **Element gap:** 8-12px

## Surfaces (Elevation)

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 1 | Canvas | `#fbfaf9` | Page background |
| 2 | Card Surface | `#ffffff` | White card faces with warm inset border |
| 3 | Recessed Panel | `#f8f7f4` | Screenshot containers |
| 4 | Stone Tint | `#f2f0ed` | Secondary buttons, hover states |
| 5 | Dark Shell | `#000000` | Phone mockup cards |

## Components

### Primary CTA Button (Pill Dark)
```
background: #121212
text: #ffffff
border-radius: 32px
padding: 12px 28px
font: Inter 14px weight 500
hover: background → #343433
transition: 0.2s ease
```

### Secondary CTA Button (Pill Light)
```
background: #f6f4ef
text: #121212
border-radius: 32px
padding: 12px 28px
font: Inter 14px weight 500
hover: background → #f2f0ed
```

### Ghost Text Link
```
background: transparent
text: #ff3e00 (Ember Orange)
border-radius: 0px
padding: 4px 0
font: Inter 14-15px weight 500
underline: none
```

### Feature Card (White)
```
background: #ffffff
border: box-shadow inset 0 0 0 1px #f2f0ed
border-radius: 10px
padding: 32px
```

### Feature Card (Warm Cream)
```
background: #f8f7f4
border-radius: 12px
padding: 0 22.8px 14px
```

### Dark Phone Mockup Card
```
background: #000000
border-radius: 24px 24px 0 0
box-shadow: 0 0 24px 0 rgba(0,0,0,0.15)
```

### Navigation Bar
```
background: #fbfaf9
height: 64px
box-shadow: 0 0 0 1px rgba(0,0,0,0.04)
```

### Transaction Badge
```
width: 40px
height: 40px
border-radius: 40px
```
- Send: background `#ff3e00`
- Receive: background `#00ca48`
- Purchase: background `#ff58ae`

### Illustration Characters
```
border-radius: 72px
sizes: 60-120px
colors: Ember Orange, Meadow Green, Sky Blue, Sunburst Yellow
```

## Animation

- **Base duration:** 200ms
- **Easing:** ease (default), cubic-bezier(0.19, 1, 0.22, 1) (spring)
- **Properties:** transform, opacity, box-shadow

### Key Animations
- `float`: 4s ease-in-out infinite for characters
- `fadeIn`: 0.6s ease-out for content reveals
- `slideUp`: 0.8s cubic-bezier(0.19, 1, 0.22, 1) for staggered content

## Illustration System

### Character Vocabulary
- Organic blob shapes with stick limbs
- Expressive dot eyes and simple mouth curves
- Each character uses one dominant brand color
- Sizes: 60-120px

### Object Vocabulary
- Coins (gold #ffbb26 with amber stroke)
- Hearts (red #ff2b3a)
- Stars (yellow)
- Lock icons (gold)
- Magnifying glass (blue)
- Arrows (teal/green)

### Placement Rule
Hero characters bleed INTO the headline bounding box — intentional overlap creates depth through layering.

### Color Usage
- Maximum 4-5 brand colors per scene
- Each character claims one color family
- Avoid two characters of same hue adjacent

## CSS Custom Properties

```css
:root {
  /* Surfaces */
  --color-warm-canvas: #fbfaf9;
  --color-stone-surface: #f2f0ed;
  --color-parchment-card: #f8f7f4;
  --color-card: #ffffff;
  --color-dark: #000000;

  /* Text */
  --color-graphite: #474645;
  --color-charcoal: #343433;
  --color-midnight: #121212;
  --color-ash: #848281;
  --color-fog: #c6c6c6;
  --color-smoke: #a7a7a7;

  /* Brand */
  --color-ember-orange: #ff3e00;
  --color-meadow-green: #00ca48;
  --color-sky-blue: #0090ff;
  --color-sunburst-yellow: #ffbb26;

  /* Typography */
  --font-display: 'Fraunces', Georgia, serif;
  --font-sans: 'Inter', system-ui, sans-serif;

  /* Spacing */
  --spacing-unit: 4px;

  /* Shadows */
  --shadow-card: inset 0 0 0 1px #f2f0ed;
  --shadow-phone: 0 0 24px 0 rgba(0,0,0,0.15);
  --shadow-nav: 0 0 0 1px rgba(0,0,0,0.04);
}
```

## Tailwind Config

```typescript
const config: Config = {
  theme: {
    extend: {
      colors: {
        canvas: '#fbfaf9',
        stone: '#f2f0ed',
        parchment: '#f8f7f4',
        ember: '#ff3e00',
        meadow: '#00ca48',
        sky: '#0090ff',
        sunburst: '#ffbb26',
        // ... etc
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'buttons': '32px',
        'cards': '10px',
        'illustrations': '72px',
      },
      boxShadow: {
        'card': 'inset 0 0 0 1px #f2f0ed',
        'phone': '0 0 24px 0 rgba(0,0,0,0.15)',
      },
    },
  },
};
```

## Do's and Don'ts

### Do
- Use `#fbfaf9` as page background — never pure white
- Apply inset stone border (box-shadow: inset 0 0 0 1px #f2f0ed) on white cards
- Use border-radius 32px for all pill buttons
- Apply tight negative letter-spacing to large text (-2.11px at 68px, -1.14px at 44px)
- Restrict Fraunces to 44px and 68px only
- Use Ember Orange exclusively for text-link CTAs

### Don't
- Don't use drop shadows on content cards
- Don't use pure `#ffffff` as page background
- Don't use illustration characters below 60px
- Don't mix Inter weight 700+ with Fraunces
- Don't apply Ember Orange to more than one UI element per viewport
- Don't use border-radius below 10px on cards

## Quick Reference

### Button Classes
```jsx
<button className="bg-midnight text-white px-7 py-3 rounded-[32px] font-medium">
  Get Started
</button>
```

### Card Classes
```jsx
<div className="bg-white rounded-[10px] p-8 shadow-[inset_0_0_0_1px_#f2f0ed]">
  {/* Content */}
</div>
```

### Text Classes
```jsx
<h1 className="font-display text-[68px] leading-[1.09] tracking-[-2.11px] text-charcoal">
  Display Text
</h1>
<h2 className="font-sans text-[44px] font-semibold leading-[1.09] tracking-[-1.14px]">
  Heading Large
</h2>
```

## Usage

To apply this skill in your components:

1. Import Tailwind config with these tokens
2. Use `bg-canvas` for backgrounds, `text-charcoal` for headings
3. Apply `shadow-card` for white cards
4. Use `rounded-[32px]` for buttons, `rounded-[10px]` for cards
5. Add floating characters with `animate-float` class
6. Use staggered animations with `stagger-children` utility