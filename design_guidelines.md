# Design Guidelines: Supported Accommodation SaaS Platform

## Design Approach

**Selected Approach**: Design System - Material Design 3

**Justification**: This enterprise SaaS platform requires data-dense interfaces, complex form handling, and multi-level navigation. Material Design 3 provides robust enterprise patterns for tables, cards, modals, and data visualization while maintaining accessibility and consistency across modules.

**Key Design Principles**:
- **Information Hierarchy**: Clear visual separation between primary actions, data, and metadata
- **Workflow Efficiency**: Minimize clicks, provide contextual actions, support keyboard navigation
- **Trust & Professionalism**: Clean, structured layouts that convey reliability and security
- **Scalable Complexity**: Design patterns that work for both simple views and data-heavy screens

---

## Core Design Elements

### A. Color Palette

**Light Mode**:
- Primary: 210 100% 45% (Professional blue - trust, stability)
- Primary Variant: 210 100% 35% (Darker blue for hover states)
- Secondary: 160 60% 45% (Teal - success, positive actions)
- Background: 0 0% 98% (Off-white for reduced eye strain)
- Surface: 0 0% 100% (White cards and panels)
- Surface Variant: 210 20% 96% (Subtle differentiation)
- Error: 0 85% 58% (Red for critical alerts)
- Warning: 38 95% 62% (Amber for caution)
- Success: 142 70% 45% (Green for confirmations)
- Text Primary: 220 15% 20% (Near-black)
- Text Secondary: 220 10% 45% (Medium gray)
- Border: 220 15% 88% (Subtle dividers)

**Dark Mode**:
- Primary: 210 100% 65% (Lighter blue for contrast)
- Primary Variant: 210 100% 75%
- Secondary: 160 60% 55%
- Background: 220 20% 12% (Deep navy-gray)
- Surface: 220 18% 16% (Elevated panels)
- Surface Variant: 220 16% 20%
- Error: 0 75% 65%
- Warning: 38 85% 68%
- Success: 142 65% 55%
- Text Primary: 0 0% 95%
- Text Secondary: 220 10% 70%
- Border: 220 15% 25%

### B. Typography

**Font Families**:
- Primary: 'Inter' (Google Fonts) - excellent for data-dense interfaces, strong numerals
- Monospace: 'JetBrains Mono' - for IDs, codes, financial amounts

**Type Scale**:
- Display: 32px / 600 / -0.5px letter-spacing (Page headers)
- Heading 1: 24px / 600 / -0.25px (Module titles)
- Heading 2: 20px / 600 / 0 (Section headers, card titles)
- Heading 3: 16px / 600 / 0 (Subsections, table headers)
- Body Large: 16px / 400 / 0 (Primary content)
- Body: 14px / 400 / 0 (Standard text, form labels)
- Body Small: 13px / 400 / 0 (Metadata, timestamps)
- Caption: 12px / 400 / 0.15px (Helper text, table footer)
- Button: 14px / 500 / 0.5px uppercase (Action text)

### C. Layout System

**Spacing Primitives**: Use Tailwind units of 1, 2, 3, 4, 6, 8, 12, 16
- Component padding: p-4 (cards), p-6 (modals)
- Section spacing: space-y-6 (forms), space-y-8 (page sections)
- Grid gaps: gap-4 (cards), gap-6 (dashboard widgets)
- Page margins: px-6 md:px-8 (mobile to desktop)

**Grid System**:
- Dashboard: 12-column grid (lg:grid-cols-12)
- Forms: 6-column grid (lg:grid-cols-6) for flexible field layouts
- Lists: Single column with max-w-7xl container
- Cards: 2-4 columns responsive (md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4)

### D. Component Library

**Navigation**:
- Top bar: Fixed header with app logo, global search, notifications, user menu (h-16)
- Sidebar: Collapsible navigation with icons and labels (w-64 expanded, w-16 collapsed)
- Breadcrumbs: Location context with chevron separators
- Tabs: Material-style underline tabs for module sections

**Data Display**:
- Tables: Striped rows, sticky header, sortable columns, row actions menu, pagination
- Cards: Elevated surface with shadow-sm, hover:shadow-md transition, rounded-lg corners
- Stats: Large number with label and trend indicator (up/down arrows)
- Badges: Pill-shaped status indicators (rounded-full, px-3, py-1, text-xs)

**Forms**:
- Input fields: Border focus ring, floating labels, helper text below
- Select dropdowns: Chevron icon, max-height with scroll for long lists
- Checkboxes/Radio: Material-style with ripple effect on interaction
- Date pickers: Calendar popup with month/year navigation
- File upload: Drag-drop zone with file preview and progress

**Feedback**:
- Alerts: Colored left border with icon, dismiss button (border-l-4)
- Toast notifications: Slide in from top-right, auto-dismiss after 5s
- Loading states: Skeleton screens for tables, spinner for actions
- Empty states: Icon, message, and primary action centered

**Overlays**:
- Modals: Centered with backdrop blur, max-w-2xl for forms, max-w-4xl for complex content
- Side panels: Slide from right, full height, w-96 for quick views
- Dropdowns: Shadow-lg, rounded-lg, max-h-64 with scroll

**Actions**:
- Primary buttons: Solid background, hover lift effect, px-6 py-2.5
- Secondary buttons: Outline with transparent background, hover background fill
- Icon buttons: Circular, p-2, hover background
- FAB: Fixed bottom-right for primary action (if needed)

### E. Animations

**Minimal Motion** (respect prefers-reduced-motion):
- Transitions: 150ms ease-in-out for hover states
- Page transitions: Fade only, no sliding (200ms)
- Modal/drawer: Slide with backdrop fade (250ms)
- No decorative animations, scroll effects, or parallax

---

## Images

**No hero images** - This is an enterprise application focused on data and workflows. Images should be functional:
- Empty state illustrations: Simple line art for "no data" states
- User avatars: Circular thumbnails in header and records
- Property photos: Thumbnail grid in property records, lightbox on click
- Document previews: PDF/image thumbnails in document vault
- ID verification: Secure document scans in tenant vault

All images should serve a functional purpose (identification, documentation, verification) rather than decorative appeal.