# SmartNews Frontend Documentation

## Overview

SmartNews frontend is a Next.js 15+ application providing interfaces for two primary user types:

- **Creators**: Content curators who create feeds and earn revenue
- **Subscribers**: Users who discover and consume content feeds

## Technology Stack

- **Framework**: Next.js 15.5+ (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **API**: FastAPI backend at https://localhost:8000/
- **State Management**: React Context + Server Components
- **Authentication**: JWT tokens with secure httpOnly cookies

## Project Structure

```
frontend/
├── app/                    # Next.js app router
│   ├── (auth)/            # Authentication routes
│   │   ├── login/         # Login redirect page
│   │   │   ├── creator/   # Creator login (shadcn login-02)
│   │   │   └── subscriber/# Subscriber login (shadcn login-02)
│   │   └── register/      # Registration redirect page
│   │       ├── creator/   # Creator signup (shadcn login-02 pattern)
│   │       └── subscriber/# Subscriber signup (shadcn login-02 pattern)
│   ├── (creator)/         # Creator dashboard routes
│   │   ├── dashboard/     # Main creator dashboard (shadcn dashboard-01)
│   │   ├── feeds/         # Feed management
│   │   ├── content/       # Content curation tools
│   │   └── revenue/       # Revenue analytics
│   ├── (subscriber)/      # Subscriber routes
│   │   ├── discover/      # Feed discovery
│   │   ├── subscriptions/ # Manage subscriptions
│   │   └── portal/        # Content consumption portal
│   └── api/               # API route handlers
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   ├── auth/             # Authentication components
│   ├── creator/          # Creator-specific components
│   └── subscriber/       # Subscriber-specific components
├── lib/                   # Utilities and helpers
│   ├── api/              # API client and types
│   ├── auth/             # Authentication utilities
│   └── utils/            # General utilities
└── public/               # Static assets
```

## Key Features

### Authentication System

**Updated 2025-10-08**: Enhanced with role-specific pages

- **Separate auth pages** for creators and subscribers with dedicated branding
- **Smart redirects**: `/login` and `/register` redirect to creator versions by default
- **Cross-linking**: Easy switching between creator/subscriber auth pages
- **Welcome messages**: "Welcome" for new users, "Welcome back" for returning users
- JWT-based authentication with refresh tokens
- Protected route middleware
- Role-based access control

### Creator Features

1. **Profile Management**
   - Social media integration (YouTube, Twitter, Reddit)
   - Revenue estimation calculator
   - Application submission workflow

2. **Content Curation**
   - Manual URL addition
   - RSS feed import
   - Social media bookmarks import
   - Batch processing interface

3. **Feed Management**
   - Create and edit feeds
   - Schedule publications
   - Preview before publishing
   - Analytics dashboard

4. **Revenue Dashboard**
   - Real-time subscriber counts
   - Revenue tracking
   - Payout history
   - Performance metrics

### Subscriber Features

1. **Feed Discovery**
   - Browse by category
   - Search and filter
   - Preview feed content
   - Creator profiles

2. **Subscription Management**
   - Subscribe/unsubscribe to feeds
   - Delivery preferences
   - Content personalization

3. **Content Portal**
   - Web-based reading experience
   - Content rating system
   - Personal content sources
   - Reading history

## API Integration

All API endpoints are documented at:

- OpenAPI JSON: https://localhost:8000//openapi.json
- Swagger UI: https://localhost:8000//docs
- ReDoc: https://localhost:8000//redoc

### Authentication Endpoints

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

### Creator Endpoints

- `GET/POST/PUT /creator/profile` - Profile management
- `POST /creator/profile/upload` - File uploads
- `GET /creator/revenue/estimate` - Revenue estimation
- `POST /creator/apply` - Submit application

### Subscriber Endpoints

- `GET/POST/PUT /subscriber/profile` - Profile management

### Content Management

- `/feeds` - Feed CRUD operations
- `/source-items` - Content items management (renamed from `/feed-items`)
- `/feed-sources` - Content source management
- `/subscriptions` - Subscription management

## shadcn/ui Component Usage

**CRITICAL RULE**: Always use shadcn/ui blocks and components as the foundation for UI implementation. Never build custom components from scratch when shadcn equivalents exist.

### Implementation Priority Order

1. **Use Existing Blocks First** - Search for relevant blocks that match your feature
2. **Use Individual Components** - Build with shadcn components if no block exists
3. **Extend, Don't Replace** - Customize shadcn code, never build from scratch
4. **Maintain Original Structure** - Keep the original block/component structure intact

### Core UI Blocks (MUST USE)

- **Authentication**: `login-02` block - Use exact structure for all auth pages
- **Dashboard**: `dashboard-01` block - Use exact structure for all dashboard layouts
- **Additional Blocks**: Always search for relevant blocks before building custom layouts

### Required Installation

```bash
# Initialize with exact settings
npx shadcn@latest init

# Essential blocks (use original structure)
npx shadcn@latest block login-02
npx shadcn@latest block dashboard-01

# Core components (build all UI from these)
npx shadcn@latest add alert avatar badge button card checkbox dialog
npx shadcn@latest add dropdown-menu form input label navigation-menu
npx shadcn@latest add progress radio-group select separator sheet
npx shadcn@latest add skeleton table tabs textarea toast toggle toggle-group
```

### Block Usage Guidelines

#### Authentication Pages

- **MUST** start with `login-02` block structure
- Extend with role selection, social login, etc.
- Never recreate login forms from scratch

#### Dashboard Layouts

- **MUST** start with `dashboard-01` block structure
- Use existing sidebar, header, and content areas
- Customize metrics cards and charts within the structure

#### Content Cards

- **MUST** use shadcn Card component with CardHeader, CardContent, CardFooter
- Never create custom card layouts

#### Forms

- **MUST** use shadcn Form with react-hook-form integration
- Use FormField, FormItem, FormLabel, FormControl, FormMessage pattern

### shadcn MCP Integration

**ALWAYS use the shadcn MCP for component discovery and implementation:**

```bash
# Search for blocks before building any UI
# Examples: "login", "dashboard", "card", "form", "navigation"
mcp shadcn search "your-feature-keyword"

# View block/component details and code
mcp shadcn view "@shadcn/block-name"

# Get usage examples
mcp shadcn examples "block-name-demo"

# Get installation commands
mcp shadcn add "@shadcn/component-name"
```

### Implementation Workflow

1. **Feature Planning** → Search shadcn MCP for relevant blocks/components
2. **Block Discovery** → Find the closest match to your UI needs
3. **View & Analyze** → Examine the block structure and code
4. **Install & Implement** → Use exact block structure as foundation
5. **Extend & Customize** → Add smartnews-specific logic and styling
6. **Never Start From Scratch** → Always build on shadcn foundation

### Code Example Standards

```typescript
// ✅ CORRECT: Build on shadcn block structure
import { LoginForm } from "@/registry/default/blocks/login-02"

export function CreatorLogin() {
  return (
    <LoginForm> {/* Use original block structure */}
      {/* Add role selection here */}
      <RoleSelector />
      {/* Extend with additional fields */}
    </LoginForm>
  )
}

// ❌ WRONG: Custom implementation from scratch
export function CustomLoginForm() {
  return (
    <div className="custom-login-container">
      {/* Don't build custom forms */}
    </div>
  )
}
```

### When to Search for Additional Blocks

Before implementing ANY new feature, search for these common block patterns:

- **Authentication**: login, register, forgot-password
- **Dashboards**: dashboard, analytics, metrics
- **Content**: cards, lists, grids, feeds
- **Forms**: contact, profile, settings, multi-step
- **Navigation**: sidebar, header, breadcrumbs, tabs
- **Data Display**: tables, charts, stats, progress
- **Layout**: hero, pricing, testimonials, FAQ

### Quality Assurance Checklist

Before submitting any UI code, verify:

- [ ] **Block Foundation**: Started with a shadcn block or component
- [ ] **Structure Preserved**: Original shadcn structure maintained
- [ ] **MCP Used**: Searched shadcn MCP for relevant components
- [ ] **No Custom UI**: No custom layouts built from scratch
- [ ] **Proper Extensions**: SmartNews features added to shadcn foundation
- [ ] **Consistent Styling**: Uses shadcn CSS variables and classes
- [ ] **Accessibility**: Maintains shadcn accessibility features

## Getting Started

See [Setup Guide](./setup/README.md) for detailed installation instructions.

## Documentation Index

- [Architecture Overview](./architecture/technical-spec.md)
- [Authentication Flow](./features/authentication.md)
- [Creator Features](./features/creator-stories.md)
- [Subscriber Features](./features/subscriber-stories.md)
- [API Integration Guide](./api/integration-guide.md)
- [Component Library](./components/shadcn-components.md)
