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

---

## F. Dashboard Design Patterns

### Dashboard Layouts

**Admin Dashboard** (Platform/Organization Overview):
- **Hero Metrics**: 3-4 large stat cards in top row (grid-cols-4) showing critical KPIs
- **Charts Row**: 2 columns of data visualization (occupancy trends, incident timeline)
- **Activity Feed**: Right sidebar or bottom section showing recent actions across organization(s)
- **Quick Actions**: Floating action cards for common admin tasks
- **Organization Grid**: Card-based view of all managed organizations with quick stats

**Support Worker Dashboard** (Task-Focused, Mobile-First):
- **Today's Priority**: Large alert banner at top for urgent tasks/alerts
- **Task List**: Card-based checklist with large tap targets (min h-20)
- **My Residents**: Avatar grid with status indicators (3-col on mobile, 4-col on tablet)
- **Quick Actions**: 2x2 grid of large action buttons (log incident, add note, call, navigate)
- **Minimal Chrome**: Hide secondary navigation on mobile, focus on current task

### Stat Cards

**Structure**:
```
┌─────────────────────────┐
│ Icon  Label     [Trend] │
│ Large Number            │
│ Subtitle / Context      │
└─────────────────────────┘
```

**Specifications**:
- Min height: h-32
- Padding: p-6
- Icon: w-12 h-12 in top-left, muted color
- Number: text-3xl font-bold
- Trend indicator: Small arrow + percentage in top-right
- Hover: Subtle elevation (hover-elevate class)
- Click: Drill-down to filtered view

**Color Coding**:
- Positive metrics (occupancy, revenue): Success color accent
- Negative/risk metrics (incidents, arrears): Warning/error color accent
- Neutral metrics: Primary color accent

### Data Visualization

**Chart Types**:
1. **Line Charts**: Trends over time (occupancy, incidents, revenue)
2. **Bar Charts**: Comparisons (properties, staff performance)
3. **Donut Charts**: Proportions (resident status, incident categories)
4. **Heatmaps**: Risk visualization (property safety scores)

**Chart Specifications**:
- Use Recharts library (already installed)
- Height: 300px for primary charts, 200px for secondary
- Colors: Use theme colors (primary, secondary, success, warning, error)
- Tooltips: Show on hover with relevant context
- Responsive: Stack charts vertically on mobile
- Loading state: Skeleton placeholder with shimmer

**Accessibility**:
- Provide data table alternative below chart
- Use patterns/textures for color-blind users
- ARIA labels for screen readers

### Interactive Elements

**Real-Time Updates**:
- Use subtle pulse animation for new data (animate-pulse briefly)
- Badge notification counters on nav items
- Toast notifications for background updates
- Live data refresh every 30 seconds (configurable)

**Drag & Drop** (Future Enhancement):
- Dashboard widget rearrangement
- Task prioritization
- Document organization
- Use react-dnd or @dnd-kit for accessibility

**Drill-Down Interactions**:
- Click stat card → filtered table view
- Click chart segment → detail modal
- Click activity item → full record
- Breadcrumb navigation to return

**Filters & Search**:
- Sticky filter bar below header
- Date range picker for time-based data
- Multi-select dropdowns for categories
- Debounced search input (300ms delay)
- Clear all filters button

### Status Indicators

**Traffic Light System**:
- Green: Compliant, on-track, safe
- Amber: Attention needed, approaching deadline
- Red: Critical, overdue, non-compliant
- Blue: Informational, in-progress
- Gray: Inactive, archived

**Visual Representations**:
- Colored dots (w-3 h-3 rounded-full)
- Colored left border on cards (border-l-4)
- Background tints on rows/cards (bg-success/10)
- Icon + color combination for accessibility

### Activity Feed

**Structure**:
```
[Avatar] [Action Description] [Time]
         [Context/Details]
```

**Specifications**:
- Max height: max-h-96 with overflow-y-auto
- Item padding: p-4
- Dividers: border-b between items
- Timestamps: Relative time (2 minutes ago, 1 hour ago)
- Infinite scroll or "Load More" button
- Filter by action type (incidents, documents, compliance)

### Mobile-First Patterns (Support Workers)

**Touch Targets**:
- Minimum size: h-12 w-12 (48px)
- Spacing between: gap-3 minimum
- Large buttons: h-16 for primary actions

**Navigation**:
- Bottom tab bar on mobile (5 max tabs)
- Hamburger menu for secondary nav
- Sticky header with back button
- Breadcrumbs hidden on small screens

**Forms**:
- One field per row on mobile
- Large input fields: h-12
- Native HTML5 inputs for keyboards (tel, email, date)
- Voice input option for notes
- Camera integration for photos

**Gestures**:
- Swipe to archive/complete tasks
- Pull to refresh
- Long press for context menu
- Haptic feedback on actions (if supported)

**Offline Support** (Future Enhancement):
- Service worker for offline capability
- Queue actions for sync
- Clear offline indicator
- Local storage for draft forms

---

## G. Role-Based UI Considerations

### Platform Admin (ADMIN role)
**Priorities**: Portfolio oversight, cross-organization insights, system health
- Multi-organization selector in header
- Aggregated metrics across all orgs
- Color-coded organization cards
- System admin tools (user management, billing)

### Organization Admin (OPS/ORG_ADMIN)
**Priorities**: Operational efficiency, compliance, resource planning
- Single organization scope
- Department/property filters
- Staff rota gaps highlighted
- Compliance countdown timers

### Support Worker (SUPPORT role)
**Priorities**: Daily tasks, resident care, quick logging
- Today-focused view
- Minimal navigation depth
- Voice notes, quick photo upload
- Offline-capable (future)
- Large, clear typography

### Compliance Officer (COMPLIANCE_OFFICER)
**Priorities**: Audit readiness, evidence tracking, risk management
- Compliance score prominent
- Upcoming deadlines dashboard
- Evidence library quick access
- Export to PDF for inspectors

---

## H. UK Regulatory Compliance Patterns

### CQC (Care Quality Commission) Requirements

**Five Key Questions Status Display**:
```
[Safe] [Effective] [Caring] [Responsive] [Well-Led]
 ✓        ⚠          ✓          ✓           ✓
```

**Visual Indicators**:
- Green checkmark: Compliant, evidence ready
- Amber warning: Attention needed, gaps identified
- Red cross: Non-compliant, immediate action required
- Each clickable to show evidence and action plans

**Quality Statements (34 total)**:
- Group by Key Question
- Show completion percentage
- Link to evidence documents
- Highlight overdue items (red border-l-4)

**Inspection Readiness Score**:
- Large percentage (0-100%) with color coding
- Breakdown by category
- Days since last inspection
- Mock inspection button

### Safeguarding Requirements

**Incident Severity Classification**:
- **RIDDOR** (Reporting of Injuries, Diseases and Dangerous Occurrences Regulations)
  - Badge: Red with "RIDDOR" label
  - Auto-notification to HSE required
  - 10-day reporting countdown timer
  
- **Serious Incident (SI)** - NHS Framework
  - Badge: Orange with "SI" label
  - 72-hour reporting requirement
  - Investigation workflow triggered
  
- **Safeguarding Alert** - Local Authority
  - Badge: Red with shield icon
  - Immediate reporting required
  - Multi-agency referral form pre-populated

**Escalation Workflows**:
- Visual flowchart of escalation steps
- Automated notifications to managers
- Deadline countdowns with alerts
- Evidence collection checklist
- Sign-off requirements tracked

### RSH (Regulator of Social Housing) Compliance

**Tenant Satisfaction Measures (TSMs)**:
- 22 mandatory TSM metrics displayed
- Tenant survey response rates
- Complaints handling timescales
- Comparative data vs. sector benchmarks
- Red/amber/green RAG rating

**Consumer Standards**:
- Safety: Gas/electric certificate expiry countdown
- Transparency: Information published to tenants
- Engagement: Consultation records
- Tenancy: Tenancy sustainment rates

### Data Governance & GDPR

**Sensitive Information Handling**:
- **Redaction Modes**: 
  - View: Show masked fields (●●●●●●)
  - Edit: Require additional authentication
  - Export: Auto-redact PII unless authorized
  
- **Field-Level Permissions**:
  - Medical records: SUPPORT + COMPLIANCE_OFFICER only
  - Financial data: ADMIN + OPS only
  - Contact details: All roles (logged)
  
- **Sensitive Field Indicators**:
  - Lock icon next to field labels
  - Tooltip: "Protected data - access logged"
  - Audit trail on every view/edit

**Consent Tracking**:
- Consent status badges next to contact methods
  - ✓ Consent given (date shown on hover)
  - ✗ Consent withdrawn
  - ? Not recorded (prompt to capture)
- Communication preferences visible on resident card
- Expired consent highlighted (amber warning)
- GDPR right-to-access request button

**Audit Trail Display**:
- Expandable timeline below records
- Shows: Who, What, When for every change
- Filterable by user/action type
- Export capability for investigations
- Tamper-proof (read-only, timestamped)

**Retention Schedules**:
- Countdown timers for record deletion
- UK retention requirements:
  - Adult safeguarding: 50 years after case closure
  - Financial records: 6 years + current
  - Staff records: 6 years after employment ends
  - Incident reports: Minimum 3 years (RIDDOR: 3 years)
- Archive vs. Delete options
- Legal hold flag to prevent deletion

### Incident Classification Metadata

**NHS Serious Incident Framework Categories**:
1. **Never Events** (Red badge, immediate escalation)
2. **Unexpected death** (Red badge, coroner notification)
3. **Severe harm** (Orange badge, RCA required)
4. **Safeguarding incidents** (Red badge, LADO referral)

**Visual Coding**:
- Icon library for incident types (fall, medication error, abuse allegation)
- Color-coded severity scale
- Investigation status indicator
- Time-since-incident counter
- Regulatory body notification checkboxes

**Evidence Capture Requirements**:
- Photo upload for scene
- Witness statement forms
- Body map for injuries (care sector)
- Equipment involved (serial numbers, last service date)
- Environmental factors checklist
- Immediate actions taken log

### Inspection-Ready Exports

**CQC Evidence Pack**:
- One-click PDF generation
- Auto-includes:
  - Quality statement evidence matrix
  - Staff training records
  - Incident summaries (last 12 months)
  - Resident feedback (anonymized)
  - Policies and procedures (version-controlled)
  - Service improvement plans
- Watermarked, dated, signed digitally

**RSH Annual Reports**:
- TSM data tables (CSV export)
- Complaints handling summary
- Safety certificate compliance log
- Void property timescales
- Tenant engagement evidence

---

## I. Accessibility & Inclusion Standards

### GOV.UK / NHS Design Compliance

**WCAG 2.2 AA Requirements**:
- Color contrast: 4.5:1 minimum for text, 3:1 for UI elements
- Focus indicators: 2px solid outline, high contrast
- Keyboard navigation: All functions accessible without mouse
- Screen reader: Semantic HTML, ARIA labels, live regions for updates
- Text resize: Support up to 200% zoom without loss of functionality
- Touch targets: 44x44px minimum (already specified for mobile)

**Easy-Read Mode** (Supported Living Users):
- Toggle to simplified language
- Larger text (18px minimum)
- Shorter sentences, bullet points
- Supporting images/icons for concepts
- High contrast option (black on yellow)

**Assisted Digital Support**:
- Phone number prominent for users needing help
- Video tutorials embedded in help tooltips
- Step-by-step wizards for complex tasks
- Printable forms for offline completion

**Language Support**:
- English (UK) primary
- Translation button (Google Translate integration)
- Common languages in UK social housing:
  - Polish, Urdu, Bengali, Arabic, Romanian
- RTL (right-to-left) layout support for Arabic

**Neurodiversity Considerations**:
- Reduce animations (respect prefers-reduced-motion)
- Consistent layouts (no surprise navigation changes)
- Clear error messages with recovery steps
- Confirmation dialogs for destructive actions
- Progress indicators for multi-step processes

### Assistive Technology Testing

**Minimum Test Coverage**:
- JAWS screen reader (Windows)
- NVDA screen reader (Windows, free)
- VoiceOver (macOS/iOS)
- TalkBack (Android)
- Dragon NaturallySpeaking (voice control)
- ZoomText (screen magnification)

**Testing Checkpoints**:
- All forms completable via keyboard only
- All data tables navigable with screen reader
- All charts have text alternative
- All images have descriptive alt text
- All videos have captions (if used)
- All color-coded statuses have icon/text alternative