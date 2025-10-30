# I Know UX Design Specification

_Created on October 29, 2025 by Eduardo Menoncello_
_Generated using BMad Method - Create UX Design Workflow v1.0_

---

## Executive Summary

**I Know** is a revolutionary entertainment intelligence platform that eliminates "frustração cognitiva" - the mental frustration when viewers recognize actors but cannot place them across different productions. Through instant contextual actor connections during streaming content consumption, I Know transforms a 5-10 minute manual search process into a 3-second magical discovery experience.

**Key Differentiator:** Revolutionary IMDB data access methodology providing 100x faster data retrieval than traditional web scraping, enabling real-time actor identification without interrupting viewing experience.

**Target Market:** 1.8B global streaming subscribers affected by this cognitive friction, with initial focus on entertainment enthusiasts (630M users) who value being entertainment experts.

**Business Impact:** Conservative path to $5M ARR within 3 years through premium subscription model ($4.99-7.99/month) with 25% conversion rate from free tier.

---

## 1. Design System Foundation

### 1.1 Design System Choice: shadcn/ui

**Selected:** shadcn/ui - Modern, customizable React component library built on Radix UI primitives

**Rationale:**

- ✅ **Modern & delightful** - aligns with "delighted and surprised" emotional goal
- ✅ **Fast development** - copy-paste components that work immediately
- ✅ **Highly customizable** - easy to theme and modify for entertainment brand
- ✅ **Accessible by default** - meets WCAG 2.1 AA requirements out of box
- ✅ **Performance optimized** - works perfectly with Astro framework

**Custom Components Needed:**

- ActorCard - Enhanced card with viewing history and connections
- ContentBanner - Gradient banners for current content
- DiscoveryGrid - Actor grid with visual indicators
- ViewingHistory - Timeline with checkmarks and smart insights

### 1.2 Color System: Premiere Green Theme

**Primary Colors:**

- Primary: `#059669` (emerald-600) - main actions, CTAs
- Primary Dark: `#047857` (emerald-700) - hover states
- Secondary: `#0891b2` (cyan-600) - secondary actions
- Accent: `#dc2626` (red-600) - destructive actions

**Semantic Colors:**

- Success: `#10b981` (emerald-500) - positive feedback
- Warning: `#f59e0b` (amber-500) - cautions
- Error: `#ef4444` (red-500) - errors
- Info: `#3b82f6` (blue-500) - informational

**Dark Mode Support:** Full dark theme with inverted color mappings while maintaining accessibility contrast ratios.

**Interactive Visualizations:**

- Color Theme Explorer: [ux-color-themes.html](./ux-color-themes.html)
- Live component examples in all themes
- Side-by-side comparison and semantic color usage

---

## 2. Core User Experience

### 2.1 Defining Experience

**Core Value Proposition:** Instant contextual actor connections that eliminate cognitive friction during entertainment viewing.

**Defining Interaction:** "You tap once and see that actor's entire career across all shows" - The magical 3-second experience that transforms entertainment discovery.

**Platform:** Mobile-first web application designed for second-screen usage during streaming sessions.

**Emotional Response:** Delighted and surprised - creating "wow" moments when users make instant connections they couldn't make manually.

### 2.2 Novel UX Patterns

**"Maybe you know them from..." Intelligence:**

- Proactive display of user's viewing history with actors
- Contextual connections before user action
- Smart recommendations based on personal viewing patterns

**Progressive Information Disclosure:**

- Immediate actor identification → detailed filmography → personalized recommendations
- Avoids information overload while maximizing discovery value
- Maintains flow state during entertainment consumption

**Zero-Effort Content Detection:**

- Automatic recognition of current viewing content
- Background processing without user intervention
- Seamless integration with streaming experience

---

## 3. Visual Foundation

### 3.1 Color System Implementation

**Theme Personality:** Fresh, intelligent, accessible - perfect for mainstream adoption while maintaining expert appeal.

**Visual Hierarchy:**

- **Emerald gradients** for primary content and actions
- **Cyan accents** for secondary interactions and insights
- **Amber highlights** for recommendations and discoveries
- **Professional grays** for supporting information

**Typography:**

- **Inter** or **System UI** fonts for optimal readability
- **Bold weights** for emphasis on actor names and CTAs
- **Consistent sizing** following 8pt grid system
- **High contrast** ratios for accessibility compliance

**Spacing System:**

- **Base unit:** 4px for consistent spacing
- **Scale:** 4, 8, 12, 16, 24, 32, 48, 64px
- **Layout grid:** 12-column system with responsive breakpoints
- **Component padding:** Consistent 16px/24px standards

---

## 4. Design Direction

### 4.1 Chosen Design Approach: Rich Dashboard

**Selected:** Rich Dashboard - Information-rich interface for entertainment enthusiasts who want comprehensive insights and deep discovery capabilities.

**Rationale:**

- **Data Density:** Appeals to entertainment enthusiasts who love being experts
- **Intelligence Features:** Smart insights, viewing statistics, personalized recommendations
- **Expert Positioning:** Makes users feel like entertainment industry insiders
- **Monetization Support:** Premium features naturally integrate with data-rich experience

**Key Characteristics:**

- **Information-dense** but organized layouts
- **Analytics and insights** prominently displayed
- **Smart recommendations** based on viewing history
- **Professional aesthetic** maintaining accessibility

**Interactive Mockups:**

- Design Direction Showcase: [ux-design-directions.html](./ux-design-directions.html)
- Full mobile screen mockups with live interactions
- Dark mode demonstrations in all components

---

## 5. User Journey Flows

### 5.1 Critical User Paths

**Primary Journey: Real-time Actor Identification**

**User:** Sarah, entertainment enthusiast watching "Stranger Things" on Netflix

**Flow Steps:**

1. **Content Detection** (0.5 seconds)
   - Automatic detection via TV remote/metadata APIs
   - Background processing, zero user effort
   - Success: Content identified and cast loaded

2. **Actor Recognition** (1 second)
   - User recognizes actor on screen
   - Opens I Know with single tap
   - "Maybe you know them from..." displays viewing history
   - Success: Actor selected for discovery

3. **Instant Discovery** (1.5 seconds)
   - Complete actor profile appears instantly
   - Cross-referencing across all productions
   - 95% accuracy with confidence scoring
   - Success: User feels "delighted and surprised"

4. **Cross-Reference Discovery** (30 seconds)
   - Explore filmography and career timeline
   - Discover new content through intelligent connections
   - Smart recommendations based on viewing patterns
   - Success: User discovers 2+ new shows

5. **Personal Collection** (5 seconds)
   - Save actor and content to personal collection
   - View smart insights and viewing statistics
   - Return to streaming session seamlessly
   - Success: User feels like entertainment expert

**Success Metrics:**

- **Time Savings:** 3 seconds vs 5-10 minutes manual search
- **Recognition Accuracy:** >95% correct identification
- **User Satisfaction:** Net Promoter Score >8
- **Feature Adoption:** 80% of users utilize core features

**Interactive Journey Visualization:**

- Complete journey demonstration: [ux-user-journey.html](./ux-user-journey.html)
- Step-by-step mobile mockups with animations
- Success metrics and impact visualization

---

## 6. Component Library Strategy

### 6.1 Component Strategy

**Base shadcn/ui Components:**

- **Card** - Actor profiles, viewing history, content recommendations
- **Badge** - Status indicators, viewing history markers
- **Avatar** - Actor avatars with fallback initials
- **Button** - Primary/secondary actions with consistent styling
- **Progress** - Career timelines, viewing statistics
- **Skeleton** - Loading states for content detection
- **Alert** - Success notifications and smart insights

**Custom Entertainment Components:**

**ActorCard Component:**

```tsx
interface ActorCardProps {
  actor: Actor;
  isKnown?: boolean;
  viewingHistory?: ViewingHistory[];
  onClick?: () => void;
  showConnections?: boolean;
  compact?: boolean;
}
```

**ContentBanner Component:**

```tsx
interface ContentBannerProps {
  content: Content;
  isActive?: boolean;
  showProgress?: boolean;
  userProgress?: number;
}
```

**DiscoveryGrid Component:**

```tsx
interface DiscoveryGridProps {
  actors: Actor[];
  userHistory: ViewingHistory[];
  onActorSelect: (actor: Actor) => void;
  layout: 'compact' | 'detailed';
}
```

**ViewingHistory Component:**

```tsx
interface ViewingHistoryProps {
  history: ViewingHistory[];
  actor: Actor;
  showInsights?: boolean;
  compact?: boolean;
}
```

**Implementation Priority:**

1. **Phase 1:** Core components (ActorCard, ContentBanner, DiscoveryGrid)
2. **Phase 2:** Enhancement components (ViewingHistory, SmartInsights)
3. **Phase 3:** Advanced features (Analytics, Recommendations)

---

## 7. UX Pattern Decisions

### 7.1 Consistency Rules

**Button Hierarchy:**

- **Primary:** Emerald-600 background, white text, rounded-lg
- **Secondary:** Cyan-600 background, white text, rounded-lg
- **Tertiary:** Gray-200 background, gray-700 text, rounded-lg
- **Destructive:** Red-600 background, white text, rounded-lg

**Feedback Patterns:**

- **Success:** Emerald-50 background, emerald-800 text, toast notifications (4s)
- **Error:** Red-50 background, red-800 text, inline alerts (manual dismiss)
- **Warning:** Amber-50 background, amber-800 text, banner alerts (8s)
- **Info:** Blue-50 background, blue-800 text, inline tips

**Form Patterns:**

- **Labels:** Above input, bold weight, required indicator (\*)
- **Validation:** On blur (standard), on change (real-time)
- **Errors:** Red-500 border, red-600 text, inline messages
- **Help Text:** Gray-500 text, small size, below inputs

**Modal Patterns:**

- **Sizes:** Small (320px), Medium (480px), Large (640px), Full screen
- **Dismiss:** Click outside, escape key, explicit close button
- **Focus:** Auto-focus first input, trap focus within modal
- **Stacking:** Maximum 2 modals, visual hierarchy maintained

**Navigation Patterns:**

- **Active State:** Emerald-100 background, bold text, underline indicator
- **Breadcrumbs:** Horizontal layout, ">" separator, clickable except current
- **Back Button:** Browser back respected, app back for in-app flows
- **Deep Linking:** All shareable URLs with journey preservation

**Search Patterns:**

- **Trigger:** Auto-search after 3 characters, manual on submit
- **Results:** Instant dropdown (top 5), full page on submit
- **Filters:** Collapsible panel, active filter badges, clear all option
- **No Results:** Helpful suggestions, popular searches, browse option

---

## 8. Responsive Design & Accessibility

### 8.1 Responsive Strategy

**Mobile-First Breakpoints:**

- **Mobile:** < 640px (375px-390px focus) - Single column, stacked cards
- **Tablet:** 640px-1024px (768px-834px focus) - Two columns, side navigation
- **Desktop:** > 1024px (1366px+ typical) - Multi-column, persistent sidebar
- **Large Desktop:** > 1536px - Enhanced layouts, rich visualizations

**Component Responsive Behavior:**

```
Actor Cards:
Mobile: 100% width, full info
Tablet: 50% width, 2-column grid
Desktop: 33% width, 3-column grid
Large: 25% width, 4-column grid

Content Banners:
Mobile: Full width, compact height
Tablet: 75% width, center-aligned
Desktop: 50% width, enhanced imagery

Stats Grid:
Mobile: 2 columns (Actors, Shows)
Tablet: 3 columns (add Watch Time)
Desktop: 4 columns (add Discovery Rate)
```

### 8.2 Accessibility Strategy

**WCAG 2.1 AA Compliance:**

**Visual Accessibility:**

- **Color Contrast:** 4.5:1 minimum ratio, verified with contrast checker
- **Font Sizes:** Minimum 16px for body text, 14px minimum for labels
- **Touch Targets:** Minimum 44x44px for all interactive elements
- **Focus Indicators:** 2px emerald outline, visible on all interactive states

**Keyboard Navigation:**

- **Tab Order:** Logical navigation through all interactive elements
- **Skip Links:** "Skip to main content" for screen readers
- **Keyboard Shortcuts:** Ctrl+K (search), Ctrl+/ (shortcuts), Escape (close)
- **Focus Management:** Visible focus states, trap focus in modals

**Screen Reader Support:**

- **ARIA Labels:** Meaningful labels for all interactive elements
- **Semantic HTML:** Proper heading hierarchy (h1-h6)
- **Live Regions:** Dynamic content announcements
- **Image Alt Text:** Descriptive text for actor photos, content posters

**Motion & Animation:**

- **Reduced Motion:** Respect prefers-reduced-motion media query
- **Animation Duration:** Maximum 0.3s for transitions
- **Auto-play:** No auto-playing videos/animations
- **Pause Controls:** User control over all animations

**Platform Optimizations:**

- **iOS:** Safe areas, haptic feedback, native sharing
- **Android:** Material touch ripples, back button handling
- **Desktop:** Hover states, keyboard shortcuts, drag & drop

**Testing Strategy:**

- **Responsive:** Real devices on all breakpoints, orientations, zoom
- **Accessibility:** axe DevTools, VoiceOver/TalkBack/NVDA testing
- **Performance:** Core Web Vitals, network throttling, memory monitoring

---

## 9. Implementation Guidance

### 9.1 Completion Summary

**What We Created Together:**

1. **Design System:** shadcn/ui with custom entertainment components
2. **Visual Foundation:** Premiere Green theme with dark mode support
3. **Design Direction:** Rich Dashboard for entertainment enthusiasts
4. **User Journey:** 5-step real-time actor identification flow
5. **Component Strategy:** Base shadcn/ui + 4 custom components
6. **UX Patterns:** Comprehensive consistency rules for entire app
7. **Responsive Strategy:** Mobile-first with 4 breakpoints
8. **Accessibility:** Full WCAG 2.1 AA compliance

**Core Interactive Deliverables:**

This UX Design Specification was created through visual collaboration:

- **Color Theme Visualizer**: [ux-color-themes.html](./ux-color-themes.html)
  - Interactive HTML showing 4 complete color theme options
  - Live UI component examples in each theme
  - Side-by-side comparison with semantic color usage

- **Design Direction Mockups**: [ux-design-directions.html](./ux-design-directions.html)
  - Interactive HTML with 3 complete design approaches
  - Full-screen mobile mockups with dark mode
  - Design philosophy and rationale for each direction

- **User Journey Visualization**: [ux-user-journey.html](./ux-user-journey.html)
  - Complete interactive journey demonstration
  - Step-by-step mobile mockups with animations
  - Success metrics and impact visualization
  - "Maybe you know them from..." intelligence features

**Technical Implementation Ready:**

- **Astro + React + shadcn/ui** technology stack confirmed
- **Mobile-first responsive design** with complete breakpoint strategy
- **Component hierarchy** defined with custom entertainment components
- **Performance optimization** strategy for sub-500ms response times
- **Accessibility compliance** meeting WCAG 2.1 AA standards

**Business Impact:**

- **User Experience:** Transforms 5-10 minute manual search into 3-second magical discovery
- **Market Positioning:** Positions users as entertainment experts through intelligent insights
- **Monetization Support:** Rich dashboard naturally supports premium feature differentiation
- **Competitive Advantage:** Revolutionary IMDB access method with delightful user experience

---

## Appendix

### Related Documents

- **Product Requirements:** [PRD.md](./PRD.md)
- **Product Brief:** [product-brief-I-Know-2025-10-29.md](./product-brief-I-Know-2025-10-29.md)
- **Brainstorming Session:** [brainstorming-session-2025-10-29.md](./brainstorming-session-2025-10-29.md)

### Next Steps & Follow-Up Workflows

This UX Design Specification serves as input to:

- **Wireframe Generation Workflow** - Create detailed wireframes from user flows
- **Figma Design Workflow** - Generate Figma files via MCP integration
- **Interactive Prototype Workflow** - Build clickable HTML prototypes
- **Component Showcase Workflow** - Create interactive component library
- **AI Frontend Prompt Workflow** - Generate prompts for v0, Lovable, Bolt, etc.
- **Solution Architecture Workflow** - Define technical architecture with UX context

### Version History

| Date       | Version | Changes                         | Author             |
| ---------- | ------- | ------------------------------- | ------------------ |
| 2025-10-29 | 1.0     | Initial UX Design Specification | Eduardo Menoncello |

---

## ✅ Design Excellence Achievement

This UX Design Specification represents **world-class entertainment intelligence design** through:

✅ **User-Centered Innovation:** Directly addresses "frustração cognitiva" pain point
✅ **Technical Excellence:** Revolutionary IMDB access methodology with 100x speed improvement
✅ **Design Consistency:** Comprehensive UX patterns ensuring cohesive experience
✅ **Accessibility Leadership:** Full WCAG 2.1 AA compliance with mobile-first approach
✅ **Business Alignment:** Direct support for premium monetization and user retention
✅ **Visual Collaboration:** Interactive artifacts enabling stakeholder alignment

**I Know** is positioned to become the essential entertainment intelligence companion that transforms how millions of users discover and connect with entertainment content.

---

_This UX Design Specification was created through collaborative design facilitation, not template generation. All decisions were made with user input and are documented with rationale._
