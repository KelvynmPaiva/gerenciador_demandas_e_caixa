---
name: Automotive Tier Task Suite
colors:
  surface: '#f8f9fb'
  surface-dim: '#d9dadc'
  surface-bright: '#f8f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#edeef0'
  surface-container-high: '#e7e8ea'
  surface-container-highest: '#e1e2e4'
  on-surface: '#191c1e'
  on-surface-variant: '#434655'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f3'
  outline: '#747686'
  outline-variant: '#c4c5d8'
  surface-tint: '#1f4fdf'
  primary: '#0040cf'
  on-primary: '#ffffff'
  primary-container: '#2f5bea'
  on-primary-container: '#e5e8ff'
  inverse-primary: '#b7c4ff'
  secondary: '#585f6c'
  on-secondary: '#ffffff'
  secondary-container: '#dce2f3'
  on-secondary-container: '#5e6572'
  tertiary: '#4a5162'
  on-tertiary: '#ffffff'
  tertiary-container: '#62697b'
  on-tertiary-container: '#e3e9ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001452'
  on-primary-fixed-variant: '#0038b7'
  secondary-fixed: '#dce2f3'
  secondary-fixed-dim: '#c0c7d6'
  on-secondary-fixed: '#151c27'
  on-secondary-fixed-variant: '#404754'
  tertiary-fixed: '#dce2f7'
  tertiary-fixed-dim: '#c0c6db'
  on-tertiary-fixed: '#141b2b'
  on-tertiary-fixed-variant: '#404758'
  background: '#f8f9fb'
  on-background: '#191c1e'
  surface-variant: '#e1e2e4'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.015em
  title-sm:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.01em
  body-default:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: -0.005em
  body-medium:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  label-header:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-badge:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style
The design system delivers an operational cockpit tailored for enterprise automotive marketing teams handling Tier-1 and luxury vehicular campaigns. The interface balances high-density data handling with executive polish. Drawing inspiration from clean, utilitarian architectures like shadcn/ui, the system eliminates ornamental excess in favor of crisp typography, structural borders, low-amplitude elevation, and decisive status communication.

The experience evokes:
- **Precision:** Clean linear separation, razor-sharp alignment, and disciplined spacing.
- **Sovereignty:** Calm, neutral canvases that let creative automotive assets and campaign deliverables hold focus.
- **Urgency without Alarm:** Chromatically balanced status pills (overdue invoices, media authorizations, production stages) that stand out instantly without breaking visual cadence.

## Colors
The color architecture rests on deliberate functional roles optimized for high-information-density desktop canvases:

- **Canvas & Structural Layers:**
  - Base Application Background: `#F6F7F9`
  - Cards, Tables, and Structural Panels: `#FFFFFF`
  - Structural Dividing Lines and Cell Separators: `#E5E7EB`
- **Text & Foreground:**
  - Primary Text (Titles, data values, table contents): `#111827`
  - Secondary Text (Subtitles, metadata, table headers, breadcrumbs): `#6B7280`
  - Muted Inactive / Placeholders: `#9CA3AF`
- **Interaction & State:**
  - Primary Action / Key Indicator: `#2F5BEA`
  - Interactive Accent / Soft Selection / Table Row Hover: `#E8EEFD`
  - Focus Ring: `#2F5BEA` with a 2px offset on light tokens.
- **Semantic Badging & Task Statuses:**
  - *Critical / Atrasado / NF Pendente:* Text `#DC2626`, Background `#FEE2E2`, Border `#FECACA`
  - *Success / Concluído / NF Lançada:* Text `#16A34A`, Background `#DCFCE7`, Border `#BBF7D0`
  - *Warning / Atenção / Falta Valor Real:* Text `#D97706`, Background `#FEF3C7`, Border `#FDE68A`

## Typography
Typography is driven solely by Inter to ensure mechanical legibility, tabular balance, and functional neutrality across large matrices of campaign schedules and automotive SKU data.

- **Headlines:** Set with tight tracking (`-0.02em` to `-0.015em`) and semi-bold weights (`600`), establishing authoritative hierarchy without consuming undue vertical viewport space.
- **Data & Tables:** Body cells leverage 14px regular/medium. Numerical values and financial records (e.g., campaign investments, billing valuations) must utilize tabular figures (`font-feature-settings: 'tnum' 1`).
- **Headers & Column Descriptors:** Table column headers use `label-header` rendered in all-caps with generous letter-spacing (`0.05em`) to distinguish data descriptors from interactive content.

## Layout & Spacing
Optimized primarily for desktop interfaces (`1440px`), the layout utilizes a fixed-width container logic within fluid shells:

- **Canvas Shell:** Fixed left navigation sidebar (260px), collapsible sub-filter rail (optional 280px), and an expandable primary data canvas occupying remaining screen geometry.
- **Content Max-Width:** Data density controls can scale fluidly up to `1440px` with outer canvas margins pinned at `2rem` (32px).
- **Rhythm & Alignments:** Strict 4px base increment model. Component gaps standardise at `0.75rem` (12px) for form clusters, `1rem` (16px) for card interiors, and `1.25rem` (20px) for table module offsets.

## Elevation & Depth
Depth adheres strictly to a flat, low-contrast system inspired by contemporary headless and utility UI frameworks:

- **Outlines over Elevation:** Depth is achieved primarily through `1px solid #E5E7EB` borders rather than heavy drop shadows.
- **Base Containers & Data Panels:** Styled with `#FFFFFF` backgrounds, `1px solid #E5E7EB`, and `box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05)`.
- **Modals, Floating Toolbars & Dropdown Menus:** Use elevated layering (`z-index: 50`), bordered with `#E5E7EB`, accompanied by a refined dual shadow: `box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)`.
- **Interactive Active Surfaces:** Selection states do not raise physical depth; instead, they shift tint to `#E8EEFD` with a crisp `#2F5BEA` contour.

## Shapes
The visual identity standardizes on a `10px` radius curve profile across core structural elements:

- **Cards, Modals, Panels & Containers:** Formed with a `10px` (`rounded-xl` in tailored utility scales) radius to eliminate harsh enterprise boxiness while sustaining clean geometry.
- **Buttons, Form Inputs, Badges & Filter Selectors:** Standardized at `8px` (`rounded-lg`) to balance the macro `10px` perimeter of parent cards.
- **Status Pills & Inline Counters:** Retain semi-pill rounding (`6px` to `8px`) with compact inner padding to maintain horizontal economy.

## Components

### Buttons
- **Primary:** Solid `#2F5BEA` fill, white `#FFFFFF` text, `8px` border radius, font weight `500`. Hover: `#2548BA`. Focus: ring with 2px offset.
- **Secondary / Outline:** `#FFFFFF` background, `1px solid #E5E7EB`, `#111827` text. Hover: `#F9FAFB` with border `#D1D5DB`.
- **Ghost:** Transparent background, `#6B7280` text. Hover: `#E8EEFD`, text `#2F5BEA`.
- **Height & Padding:** Standard height `36px` (`padding: 0 14px`), compact table actions `28px` (`padding: 0 10px`).

### Status Badges & Pills
- **Atrasado / NF Pendente:** Text `#DC2626`, background `#FEE2E2`, border `1px solid #FECACA`.
- **Concluído / NF Lançada:** Text `#16A34A`, background `#DCFCE7`, border `1px solid #BBF7D0`.
- **Atenção / Falta Valor Real:** Text `#D97706`, background `#FEF3C7`, border `1px solid #FDE68A`.
- **Neutral / Planejado:** Text `#4B5563`, background `#F3F4F6`, border `1px solid #E5E7EB`.
- *Sizing:* `height: 22px`, `padding: 0 8px`, typography `label-badge`.

### Form Inputs & Filters
- **Text Inputs & Dropdowns:** `36px` height, background `#FFFFFF`, border `1px solid #E5E7EB`, radius `8px`, typography `body-default`.
- **States:** Hover border `#D1D5DB`; Focus border `#2F5BEA` with `ring: 1px #2F5BEA`.
- **Placeholders:** `#9CA3AF`.

### Tables (Task & Invoicing Grid)
- **Container:** Wrapped in a container with background `#FFFFFF`, border `1px solid #E5E7EB`, radius `10px`, and `overflow: hidden`.
- **Header:** Height `40px`, background `#F9FAFB`, bottom border `1px solid #E5E7EB`. Typography `label-header`, color `#6B7280`.
- **Rows:** Height `48px`, border bottom `1px solid #E5E7EB`. Default background `#FFFFFF`. Hover state background `#E8EEFD`.
- **Financial/Invoice Columns:** Right-aligned, formatted with tabular figures.

### Checkboxes & Selectors
- **Checkbox:** `16px x 16px`, radius `4px`, border `1px solid #D1D5DB`. Checked state `#2F5BEA` fill with white SVG checkmark.

### Cards & KPI Summaries
- **Structure:** Solid `#FFFFFF` fill, `1px solid #E5E7EB`, `10px` radius, subtle shadow (`0 1px 2px rgba(0,0,0,0.05)`).
- **Metric Modules:** Upper label `12px` (`#6B7280`), central metric `24px` semibold (`#111827`), bottom trend tag with semantic status colors.

### Iconography
- **Style:** Clean 1.5px to 1.75px stroke icons (Lucide pattern), neutral gray `#6B7280` or inheriting parent text color. Size standard: `16px x 16px` within buttons/table rows, `20px x 20px` in global navigation.