# Design Guidelines: CAPTCHA System (hCaptcha-style)

## Design Approach
**Design System Approach** - Using a hybrid of Material Design and modern SaaS patterns (inspired by Stripe, Vercel, Linear) for clarity, trust, and functionality. This is a utility-focused security product where reliability and ease of integration are paramount.

## Core Design Principles
1. **Trust & Security**: Clean, professional aesthetic that conveys reliability
2. **Minimal Friction**: CAPTCHA widget should be unobtrusive and fast
3. **Developer-First**: Clear documentation, easy integration, powerful dashboard
4. **Performance**: Lightweight, fast-loading components

## Typography
- **Primary Font**: Inter (via Google Fonts CDN)
- **Monospace**: JetBrains Mono (for API keys, code snippets)

**Hierarchy:**
- Hero Headlines: text-5xl to text-6xl, font-bold
- Section Headers: text-3xl to text-4xl, font-semibold
- Subsection Headers: text-xl to text-2xl, font-semibold
- Body Text: text-base, font-normal
- Small Text/Captions: text-sm, font-medium
- Code/Technical: text-sm, font-mono

## Layout System
**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Tight spacing: gap-2, p-4
- Standard spacing: gap-4, p-6, p-8
- Section spacing: py-16, py-20, py-24
- Component padding: p-6, p-8

**Containers:**
- Marketing pages: max-w-7xl
- Dashboard: w-full with fluid layout
- CAPTCHA widget: Fixed dimensions (300px-400px width)
- Documentation: max-w-4xl

## Component Library

### CAPTCHA Widget Components
**Challenge Box**: Compact container (340px × 78px collapsed, expands to ~400px × 300px for challenges)
- Rounded corners: rounded-lg
- Border: border with subtle shadow
- Checkbox verification state with checkmark icon
- Puzzle slider with smooth drag interaction
- Loading states with subtle animations

**Verification Badge**: Small, unobtrusive indicator showing "Verified by [YourCaptcha]" with shield icon

### Dashboard Components
**Sidebar Navigation**: Fixed left sidebar (240px-280px)
- Icon + label navigation items
- Collapsible on mobile
- Clear active states

**Stats Cards**: Grid of metric cards showing:
- Total verifications, success rate, blocked attempts
- Card layout: p-6, rounded-xl, with large numbers (text-3xl) and labels (text-sm)

**Analytics Graphs**: Line/bar charts using Chart.js or similar
- Time-series verification data
- Geographic distribution
- Challenge type breakdown

**API Key Management**: 
- Copy-to-clipboard buttons for keys
- Masked display with reveal toggle
- Generation and revocation actions
- Key type indicators (Public/Private with distinct badges)

**Activity Log Table**: 
- Timestamp, IP, challenge type, result columns
- Sortable headers
- Pagination
- Search/filter functionality

### Marketing/Landing Page Components
**Hero Section**: (60-70vh)
- Large headline emphasizing security and ease of use
- Live demo CAPTCHA widget embedded
- Primary CTA: "Get Started Free" + Secondary: "View Documentation"
- Trust indicators: "Protecting 50M+ requests daily"

**Features Grid**: 3-column layout (lg:grid-cols-3)
- Proof-of-Work Security
- Easy Integration
- Real-time Analytics
- Rate Limiting
- Multiple Challenge Types
- Developer-Friendly API

**Integration Code Examples**: Side-by-side 2-column
- Left: Code snippet with syntax highlighting
- Right: Visual preview/explanation

**Pricing Table**: 3-column comparison (Free, Pro, Enterprise)
- Clear feature differentiation
- Prominent CTA buttons

**Documentation Section**: 
- Quick start guide
- API reference cards
- SDK installation steps

### Form Elements
**Input Fields**: Consistent across all forms
- Height: h-12
- Padding: px-4
- Rounded: rounded-lg
- Focus ring with offset

**Buttons**:
- Primary: Solid, font-semibold, px-6, py-3, rounded-lg
- Secondary: Border variant with hover fill
- Destructive: For delete/revoke actions

## Navigation
**Marketing Nav**: Horizontal, sticky top
- Logo left, links center, CTA buttons right
- Transparent with backdrop blur on scroll

**Dashboard Nav**: Two-tier
- Top bar: User menu, notifications, search
- Side nav: Main sections (Overview, Analytics, Settings, API Keys, Logs)

## Icons
Use Heroicons (outline for nav, solid for emphasis) via CDN

## Images
**Hero Section**: Abstract security visualization or clean dashboard preview screenshot (1200×600px)
**Feature Cards**: Simple, flat illustrations or icons (no photography)
**Dashboard**: Real chart/graph examples, no stock photos

## Accessibility
- All interactive elements keyboard navigable
- ARIA labels for CAPTCHA states
- High contrast text ratios (WCAG AA minimum)
- Focus indicators on all interactive elements
- Screen reader friendly status announcements for CAPTCHA completion

## Key Differentiators
- CAPTCHA widget must feel lightweight and modern (not intrusive like old reCAPTCHA)
- Dashboard emphasizes real-time data and actionable insights
- Documentation integrated seamlessly with marketing content
- Copy-paste ready code examples throughout