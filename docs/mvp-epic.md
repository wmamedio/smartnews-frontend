# SmartNews MVP Epic

## Epic Title

SmartNews Core Platform MVP - Creator-to-Subscriber Value Chain

## Epic Goal

Deliver the minimal viable platform that enables creators to onboard, curate content, create feeds, and generate revenue while providing subscribers with discoverable, high-quality content feeds via web and email delivery.

### Existing System Context

**Project Type:** Greenfield development
**Technology Stack:** Next.js + Tailwind + Shadcn/ui

### Enhancement Details

**What's being built:**
The core SmartNews platform that establishes the complete creator-to-subscriber value chain. This MVP focuses on the essential P0 features that validate the business model: creators can monetize content curation while subscribers receive valuable, personalized content feeds.

**How it integrates:**

- **Frontend:** Next.js web application with responsive design for creators, subscribers, and basic admin functions
- **Backend:** Using FastAPI (https://localhost:8000/openapi.json)
- **External Services:** Stripe Connect for revenue processing, email service for content delivery
- **Data Flow:** Content ingestion → Feed creation → Subscriber delivery → Revenue attribution → Creator payouts

**Success Criteria:**

1. **Creator Activation:** 50+ creators successfully onboard and create their first feed within 30 days
2. **Content Pipeline:** System processes 1000+ content pieces daily from diverse sources (RSS, social, manual)
3. **Subscriber Engagement:** 500+ active subscribers with 60%+ email open rates
4. **Revenue Flow:** End-to-end revenue attribution working with first creator payouts processed
5. **Platform Stability:** 99%+ uptime with <3 second dashboard load times

## Stories

### 1. Creator Onboarding & Authentication System

**Goal:** Enable creators to easily join the platform and start curating content immediately

- Creator registration with email/password or social authentication
- Direct access to dashboard for immediate content curation
- Optional profile completion accessible from dashboard/settings
- **Acceptance Criteria:** Creator can register and access content curation tools in <2 minutes without mandatory onboarding steps

### 2. Content Curation & Ingestion Pipeline

**Goal:** Allow creators to import and manage content from multiple sources

- Support for RSS feeds, social media imports, bookmark uploads, and manual URL entry
- Batch processing and content validation
- Content scheduling and preview capabilities
- **Acceptance Criteria:** Creator can import 100+ content pieces from 5+ different source types in single session

### 3. Feed Creation & Publication System

**Goal:** Enable creators to organize content into publishable feeds with scheduling

- Named feed creation with descriptions and categories
- Content organization and curation tools
- Publication scheduling and preview functionality
- **Acceptance Criteria:** Creator can create, preview, and schedule a feed with 20+ curated content pieces

### 4. Revenue Attribution & Tracking Engine

**Goal:** Implement transparent revenue tracking from subscriber attribution to creator payouts

- Unique tracking links for subscriber attribution
- Real-time revenue calculations with audit trails
- Stripe Connect integration for automated payouts
- **Acceptance Criteria:** Complete revenue flow from subscriber sign-up through creator payout with full transparency

### 5. Creator Dashboard & Analytics

**Goal:** Provide creators with real-time visibility into performance and earnings

- Live subscriber counts and growth metrics
- Revenue tracking with transparent calculation breakdowns
- Content performance analytics
- **Acceptance Criteria:** Dashboard loads in <3 seconds showing real-time subscriber and revenue data

### 6. Subscriber Discovery & Experience

**Goal:** Enable subscribers to find relevant newsletters and consume content via multiple channels

- Newsletter discovery by category and popularity
- Subscription management and preference settings
- Multi-channel delivery (web portal and email newsletters)
- **Acceptance Criteria:** Subscriber can discover, subscribe to, and receive content from 3+ newsletters within first session

### 7. Basic Admin & Content Moderation

**Goal:** Provide essential platform management and quality control tools

- Creator approval and suspension workflows
- Basic content moderation and spam prevention
- User account management and platform health monitoring
- **Acceptance Criteria:** Admin can approve/suspend creators and moderate content with audit trail

## User Journey Diagrams

### Creator Journey Flow

```mermaid
sequenceDiagram
    participant C as Creator
    participant W as Web App
    participant A as Auth API
    participant S as Social API
    participant CP as Content Pipeline
    participant D as Dashboard
    participant P as Payment System

    Note over C,P: Story 1: Creator Onboarding & Authentication
    C->>W: Visit platform landing page
    W->>C: Display creator value proposition
    C->>W: Click "Join as Creator"
    W->>A: Email/password registration
    A->>A: Create user account (role: creator)
    A-->>W: Return auth tokens + user data
    W-->>C: Redirect to creator dashboard immediately

    Note over C,P: Optional Profile Enhancement (Accessible Anytime)
    C->>W: Navigate to Profile/Settings (optional)
    C->>W: Connect social accounts (optional)
    W->>S: OAuth YouTube/Twitter/Reddit
    S-->>W: Return follower stats
    W->>A: Calculate revenue estimates
    W-->>C: Show earning potential (when social connected)

    Note over C,P: Story 2: Content Curation & Ingestion
    C->>W: Navigate to "Import Content"
    C->>W: Upload RSS feeds, bookmarks, social saves
    W->>CP: Process content sources
    CP->>CP: Validate & extract content
    CP->>CP: Schedule background ingestion
    CP-->>W: Content import status
    W-->>C: Show imported content (100+ pieces)

    Note over C,P: Story 3: Feed Creation & Publication
    C->>D: Access feed management
    C->>D: Create new feed "Tech Weekly"
    C->>D: Add curated content to feed
    D->>D: Generate feed preview
    D-->>C: Show feed preview with scheduling
    C->>D: Set publication schedule
    D-->>C: Feed published with unique tracking link

    Note over C,P: Story 4 & 5: Revenue Attribution & Dashboard
    loop Daily Revenue Tracking
        D->>P: Calculate subscriber attribution
        P->>P: Track revenue from ads/subscriptions
        P->>D: Update creator revenue balance
        D-->>C: Display real-time earnings
    end

    Note over C,P: Monthly Payout
    P->>P: Process monthly creator payouts
    P->>P: Generate tax documentation
    P-->>C: Payout notification & tax forms
```

### Subscriber Journey Flow

```mermaid
sequenceDiagram
    participant S as Subscriber
    participant W as Web Portal
    participant A as Auth API
    participant F as Feed API
    participant E as Email Service
    participant T as Tracking System

    Note over S,T: Story 6: Subscriber Discovery & Experience
    S->>W: Visit localhost/
    W->>F: Load featured newsletters by category
    F-->>W: Return creator newsletters + editorial newsletters
    W-->>S: Display newsletter discovery page

    S->>W: Browse "Tech" category newsletters
    W->>F: Filter newsletters by category
    F-->>W: Return tech-focused newsletters
    W-->>S: Show "Tech Weekly", "DevTool Insider", etc.

    S->>W: Preview "Tech Weekly" newsletter
    W->>F: Get newsletter preview + sample content
    F-->>W: Return recent newsletter content
    W-->>S: Show newsletter preview with creator info

    S->>W: Click "Subscribe to Tech Weekly"
    W->>A: Check if user authenticated
    A-->>W: Require sign-up/login
    S->>A: Complete email registration
    A-->>S: Account created

    W->>T: Record subscription with creator attribution
    T->>T: Generate unique tracking link
    T-->>W: Subscription confirmed
    W-->>S: Subscription success + preferences

    Note over S,T: Content Delivery
    loop Weekly Newsletter
        E->>F: Fetch latest feed content
        F-->>E: Return curated content for subscriber
        E->>E: Generate personalized newsletter
        E-->>S: Deliver email newsletter

        S->>E: Click content links in email
        E->>T: Track engagement & attribute to creator
        T->>T: Update revenue attribution
    end

    S->>W: Access web portal
    W->>F: Get personalized newsletter content
    F-->>W: Return subscribed newsletters content
    W-->>S: Display personalized content dashboard
```

### Admin Journey Flow

```mermaid
sequenceDiagram
    participant A as Admin
    participant AP as Admin Portal
    participant UA as User API
    participant CM as Content Moderation
    participant M as Monitoring
    participant P as Payment System

    Note over A,P: Story 7: Basic Admin & Content Moderation
    A->>AP: Login to admin dashboard
    AP->>M: Load platform health metrics
    M-->>AP: System status + key metrics
    AP-->>A: Show platform overview dashboard

    Note over A,P: Creator Approval Workflow
    AP->>UA: Get pending creator applications
    UA-->>AP: Return creator approval queue
    AP-->>A: Display pending creators with stats

    A->>AP: Review creator profile + social proof
    AP->>UA: Get detailed creator analytics
    UA-->>AP: Return follower verification + content quality
    AP-->>A: Show creator assessment details

    A->>AP: Approve/reject creator application
    AP->>UA: Update creator status
    UA->>UA: Send approval/rejection notification
    UA-->>A: Creator status updated

    Note over A,P: Content Moderation
    loop Daily Moderation
        AP->>CM: Get flagged content reports
        CM-->>AP: Return content requiring review
        AP-->>A: Display content moderation queue

        A->>AP: Review flagged content piece
        AP->>CM: Get content details + context
        CM-->>AP: Show content + user reports
        AP-->>A: Display content with moderation options

        A->>AP: Moderate content (approve/remove/warn)
        AP->>CM: Execute moderation action
        CM->>CM: Update content status + notify users
        CM-->>A: Moderation action completed
    end

    Note over A,P: Platform Health Monitoring
    A->>AP: Access system health dashboard
    AP->>M: Get real-time platform metrics
    M-->>AP: Return uptime, performance, errors
    AP->>P: Get payment system status
    P-->>AP: Return transaction health + failed payments
    AP-->>A: Display comprehensive platform health

    Note over A,P: User Account Management
    A->>AP: Access user management
    AP->>UA: Get user account issues
    UA-->>AP: Return support tickets + account problems
    AP-->>A: Show user account management queue

    A->>AP: Resolve user account issue
    AP->>UA: Execute account action (suspend/restore/delete)
    UA->>UA: Update user status + send notification
    UA-->>A: Account action completed
```

### Revenue Attribution Flow

```mermaid
flowchart TD
    S[Subscriber Signs Up] --> T[Unique Tracking Link Generated]
    T --> A[Attribution Recorded]
    A --> C[Subscriber Receives Content]
    C --> E[Subscriber Engages with Content]
    E --> R[Revenue Event Triggered]
    R --> RC[Revenue Calculated]
    RC --> CA[Creator Attribution Applied]
    CA --> D[Dashboard Updated]
    D --> P[Monthly Payout Processed]

    subgraph "Attribution System"
        T
        A
        CA
    end

    subgraph "Revenue Engine"
        R
        RC
        P
    end

    subgraph "Creator Dashboard"
        D
    end

    style S fill:#e1f5fe
    style P fill:#c8e6c9
    style D fill:#fff3e0
```

### System Integration Overview

```mermaid
flowchart LR
    subgraph "Frontend"
        WA[Web App<br/>Next.js 15.5]
        CD[Creator Dashboard]
        SD[Subscriber Portal]
        AD[Admin Dashboard]
    end

    subgraph "Backend APIs"
        API[REST API<br/>Laravel 12]
        AUTH[Auth API<br/>Sanctum]
        PAY[Payment API<br/>Stripe Connect]
    end

    subgraph "Data Layer"
        DB[(PostgreSQL<br/>User Data)]
        REDIS[(Redis<br/>Cache & Queue)]
        S3[(Supabase Storage<br/>Files & Media)]
    end

    subgraph "External Services"
        SOCIAL[Social Media APIs<br/>YouTube, Twitter, Reddit]
        EMAIL[Email Service<br/>Resend]
        LLM[Content Scoring<br/>OpenAI API]
    end

    subgraph "Background Jobs"
        QUEUE[Laravel Horizon<br/>Job Processing]
        CONTENT[Content Pipeline]
        REVENUE[Revenue Calculator]
    end

    WA --> API
    CD --> API
    SD --> API
    AD --> API

    API --> AUTH
    API --> PAY
    API --> DB
    API --> REDIS
    API --> S3

    API --> QUEUE
    QUEUE --> CONTENT
    QUEUE --> REVENUE

    CONTENT --> LLM
    AUTH --> SOCIAL
    REVENUE --> PAY
    EMAIL --> SD

    style WA fill:#e3f2fd
    style API fill:#f3e5f5
    style DB fill:#e8f5e8
    style QUEUE fill:#fff3e0
```

## Compatibility Requirements

- [x] Frontend components built with accessibility standards (WCAG 2.1)
- [x] Email templates responsive across all major email clients

## Definition of Done

### Technical Completion

- [x] All 7 epic stories completed with acceptance criteria met
- [x] Frontend responsive across desktop, tablet, and mobile viewports

### Business Validation

- [x] End-to-end creator journey tested: onboarding → content import → feed creation → revenue tracking
- [x] End-to-end subscriber journey tested: discovery → subscription → content delivery → engagement
- [x] Revenue attribution verified: subscriber sign-up → content engagement → creator payout
- [x] Admin workflows validated: creator approval → content moderation → platform monitoring

### Quality Assurance

- [x] Frontend components tested with Vitest + Testing Library
- [x] E2E critical paths tested with Playwright
- [x] Performance benchmarks met: <3s dashboard load, 99%+ uptime
- [x] Security audit passed: authentication, authorization, payment processing

## Success Metrics (30 Days Post-Launch)

**Creator Metrics:**

- 50+ active creators with completed onboarding
- 200+ feeds created and published
- 80%+ creator satisfaction score (onboarding survey)

**Subscriber Metrics:**

- 500+ active subscribers across all feeds
- 60%+ email newsletter open rate
- 25%+ click-through rate on curated content

**Platform Metrics:**

- 99%+ platform uptime
- <3 second average dashboard load time
- 1000+ content pieces processed daily

**Revenue Metrics:**

- First creator payouts successfully processed
- $1000+ total platform revenue (proof of monetization model)
- 95%+ revenue attribution accuracy (audit verified)

---

**Epic Priority:** P0 (Launch Blocker)  
**Estimated Timeline:** 8-12 weeks  
**Team Dependencies:** Frontend, DevOps, QA  
**External Dependencies:** Stripe Connect approval

## UPDATES

- Updated to frontend project by Wev (2025-09-25)
- **Terminology Change (2025-11-12)**: Implemented product-wide terminology strategy:
  - **Core Model**: "Feed" (for creator's curated publications)
  - **Subscriber-facing**: "Feed" → "Newsletter" (for public subscriptions)
  - **Content Sources**: Retained "Feed Source" (RSS feeds, YouTube feeds, etc.)
  - **Rationale**: Clearer distinction between content sources (feed sources) and curated publications (feeds/newsletters). Backend API already distinguishes `Feed` (internal model), `FeedSource` (content sources), and `Newsletter` (subscriber deliveries).
  - **Implementation**: Frontend-only terminology mapping. Zero backend API changes.
  - **See**: Sprint Change Proposal SCP-2025-003 for full analysis and migration plan.
