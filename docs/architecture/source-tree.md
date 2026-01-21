# Source Tree - smartfeed Frontend

## Overview

Complete documentation of the smartfeed frontend project structure. This file serves as a map for navigating the codebase and understanding file organization.

---

## Project Root Structure

```
smartfeed_admin_ui/
├── .bmad-core/              # BMAD agent configurations
├── .next/                   # Next.js build output (generated)
├── docs/                    # Project documentation
│   ├── architecture/        # Architecture docs
│   ├── frontend/           # Frontend specifications
│   ├── prd/                # Product requirements
│   ├── qa/                 # QA reports
│   └── stories/            # Development stories
├── node_modules/           # Dependencies (generated)
├── public/                 # Static assets
├── src/                    # Source code (detailed below)
├── .env.example            # Environment variables template
├── .env.local             # Local environment (not in git)
├── .eslintrc.json         # ESLint configuration
├── .gitignore             # Git ignore rules
├── .prettierrc            # Prettier configuration
├── components.json        # shadcn/ui configuration
├── Dockerfile             # Docker configuration
├── jest.config.js         # Jest testing configuration
├── jest.setup.js          # Jest setup file
├── next.config.mjs        # Next.js configuration
├── package.json           # Dependencies and scripts
├── postcss.config.mjs     # PostCSS configuration
├── README.md              # Project README
├── tailwind.config.ts     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

---

## Source Directory (`src/`) - Complete Structure

### Top-Level Organization

```
src/
├── app/                    # Next.js App Router (routes & pages)
├── components/             # React components
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities, services, and helpers
└── [root files]            # Root-level utilities
```

---

## 1. App Directory (`src/app/`)

### Next.js App Router - File-based Routing

```
app/
├── (auth)/                         # Authentication route group (no layout)
│   ├── callback/                   # OAuth callback routes
│   │   └── google/
│   │       └── page.tsx           # Google OAuth callback handler
│   ├── login/                      # Login routes
│   │   ├── __tests__/
│   │   │   └── page.test.tsx      # Login tests
│   │   ├── creator/
│   │   │   └── page.tsx           # Creator login page
│   │   ├── subscriber/
│   │   │   └── page.tsx           # Subscriber login page
│   │   └── page.tsx               # Main login redirect
│   └── register/                   # Registration routes
│       ├── __tests__/
│       │   └── page.test.tsx      # Register tests
│       ├── creator/
│       │   └── page.tsx           # Creator signup page
│       ├── subscriber/
│       │   └── page.tsx           # Subscriber signup page
│       └── page.tsx               # Main register redirect
│
├── (creator)/                      # Creator route group (shared layout)
│   ├── content/                    # Content management
│   │   ├── import/
│   │   │   └── page.tsx           # Content import page
│   │   ├── library/
│   │   │   └── page.tsx           # Content library page
│   │   ├── sources/
│   │   │   └── page.tsx           # Content sources page
│   │   └── page.tsx               # Content hub page
│   ├── dashboard/
│   │   └── page.tsx               # Creator dashboard
│   ├── feeds/                      # Feed management
│   │   ├── [id]/                  # Dynamic feed routes
│   │   │   └── page.tsx           # Individual feed page
│   │   ├── create/
│   │   │   └── page.tsx           # Feed creation wizard
│   │   ├── drafts/
│   │   │   └── page.tsx           # Draft feeds page
│   │   └── page.tsx               # Feeds list page
│   ├── revenue/
│   │   └── page.tsx               # Revenue dashboard
│   ├── settings/                   # Settings pages
│   │   ├── account/
│   │   │   └── page.tsx           # Account settings
│   │   ├── appearance/
│   │   │   └── page.tsx           # Appearance settings
│   │   ├── notifications/
│   │   │   └── page.tsx           # Notification settings
│   │   ├── privacy/
│   │   │   └── page.tsx           # Privacy settings
│   │   ├── profile/
│   │   │   └── page.tsx           # Profile settings
│   │   ├── social-connections/
│   │   │   └── page.tsx           # Social media connections
│   │   ├── layout.tsx             # Settings layout (sidebar)
│   │   └── page.tsx               # Settings hub/redirect
│   └── layout.tsx                 # Creator layout (sidebar, header)
│
├── api/                            # API route handlers
│   ├── proxy/
│   │   └── [...path]/
│   │       └── route.ts           # API proxy for backend
│   └── test/
│       └── route.ts               # Test endpoint
│
├── creator/                        # Public creator profiles
│   └── [id]/
│       └── page.tsx               # Creator profile page
│
├── globals.css                    # Global CSS & Tailwind imports
├── layout.tsx                     # Root layout (providers, fonts)
└── page.tsx                       # Home page
```

### Route Group Patterns

**`(auth)`** - Public authentication routes

- No shared layout
- Accessible to unauthenticated users
- Includes login, register, OAuth callbacks

**`(creator)`** - Protected creator routes

- Shared creator layout with sidebar
- Requires authentication
- Role: creator

---

## 2. Components Directory (`src/components/`)

### Component Organization by Feature

```
components/
├── auth/                           # Authentication components
│   ├── __tests__/
│   │   └── GoogleOAuthButton.test.tsx
│   └── GoogleOAuthButton.tsx       # Google OAuth integration
│
├── content/                        # Content management components
│   ├── import/
│   │   ├── BulkUrlInput.tsx       # Bulk URL import field
│   │   └── FileDropzone.tsx       # File drag-and-drop zone
│   ├── library/
│   │   ├── __tests__/
│   │   │   ├── accessibility.test.tsx
│   │   │   ├── BulkActionBar.test.tsx
│   │   │   ├── ContentCard.test.tsx
│   │   │   └── ContentCardGrid.test.tsx
│   │   ├── BulkActionBar.tsx      # Bulk action controls
│   │   ├── ContentCard.tsx        # Content item card
│   │   ├── ContentCardGrid.tsx    # Grid layout for cards
│   │   ├── ContentFilters.tsx     # Filter controls
│   │   └── ContentGrid.tsx        # Main content grid
│   └── sources/
│       ├── CreateSourceDialog.tsx # New source dialog
│       ├── SourceCard.tsx         # Source card component
│       └── SourceManager.tsx      # Source management UI
│
├── dashboard/                      # Dashboard components
│   ├── FloatingQuickAdd.tsx       # Quick add FAB
│   └── MiniChart.tsx              # Small chart component
│
├── feeds/                          # Feed management components
│   ├── builder/
│   │   ├── DraggableItem.tsx      # Drag-and-drop item
│   │   └── SectionDivider.tsx     # Section separator
│   ├── dialogs/
│   │   ├── __tests__/
│   │   │   ├── DeleteFeedDialog.test.tsx
│   │   │   └── PublishFeedDialog.test.tsx
│   │   ├── DeleteFeedDialog.tsx   # Delete confirmation
│   │   └── PublishFeedDialog.tsx  # Publish confirmation
│   ├── preview/
│   │   └── FeedPreview.tsx        # Feed preview component
│   ├── shared/
│   │   ├── FeedCard.tsx           # Feed card component
│   │   └── FeedStats.tsx          # Feed statistics
│   └── wizard/                     # Feed creation wizard
│       ├── __tests__/
│       │   ├── FilterConfigurationStep.test.tsx
│       │   └── SourceSelectionStep.test.tsx
│       ├── FilterConfigurationStep.tsx
│       ├── PublishSettingsStep.tsx
│       ├── ReviewStep.tsx
│       ├── SourceSelectionStep.tsx
│       └── StepProgress.tsx
│
├── layout/                         # Layout components
│   └── app-sidebar.tsx            # Application sidebar
│
├── revenue/                        # Revenue components
│   └── dashboard/
│       ├── MetricCard.tsx         # Revenue metric card
│       ├── PayoutHistory.tsx      # Payout history table
│       └── RevenueChart.tsx       # Revenue chart
│
├── settings/                       # Settings components
│   ├── __tests__/
│   │   ├── AvatarUploader.test.tsx
│   │   ├── EmailUpdateForm.test.tsx
│   │   ├── PasswordChangeForm.test.tsx
│   │   ├── ProfileForm.test.tsx
│   │   └── SocialConnections.test.tsx
│   ├── AccountDeletion.tsx        # Account deletion UI
│   ├── AvatarUploader.tsx         # Avatar upload component
│   ├── EmailUpdateForm.tsx        # Email change form
│   ├── NotificationSettings.tsx   # Notification preferences
│   ├── PasswordChangeForm.tsx     # Password change form
│   ├── PrivacySettings.tsx        # Privacy controls
│   ├── ProfileForm.tsx            # Profile edit form
│   ├── SettingsBreadcrumb.tsx     # Settings breadcrumbs
│   ├── SettingsCard.tsx           # Settings card wrapper
│   ├── SettingsSidebar.tsx        # Settings sidebar nav
│   ├── SettingsTabs.tsx           # Settings tab navigation
│   ├── SocialConnections.tsx      # Social media linking
│   └── ThemeSelector.tsx          # Theme selection UI
│
├── ui/                             # shadcn/ui components (DO NOT MODIFY)
│   ├── alert-dialog.tsx           # Alert dialog component
│   ├── alert.tsx                  # Alert component
│   ├── avatar.tsx                 # Avatar component
│   ├── badge.tsx                  # Badge component
│   ├── button.tsx                 # Button component
│   ├── card.tsx                   # Card component
│   ├── checkbox.tsx               # Checkbox component
│   ├── collapsible.tsx            # Collapsible component
│   ├── dialog.tsx                 # Dialog component
│   ├── dropdown-menu.tsx          # Dropdown menu component
│   ├── form.tsx                   # Form components
│   ├── input.tsx                  # Input component
│   ├── label.tsx                  # Label component
│   ├── progress.tsx               # Progress bar component
│   ├── radio-group.tsx            # Radio group component
│   ├── select.tsx                 # Select component
│   ├── separator.tsx              # Separator component
│   ├── sheet.tsx                  # Sheet (drawer) component
│   ├── sidebar.tsx                # Sidebar component
│   ├── skeleton.tsx               # Skeleton loader
│   ├── switch.tsx                 # Switch component
│   ├── table.tsx                  # Table component
│   ├── tabs.tsx                   # Tabs component
│   ├── textarea.tsx               # Textarea component
│   ├── toast.tsx                  # Toast notification (use sonner)
│   ├── toggle-group.tsx           # Toggle group component
│   ├── toggle.tsx                 # Toggle component
│   └── tooltip.tsx                # Tooltip component
│
├── dev-theme-switcher.tsx         # Development theme toggle
└── theme-provider.tsx             # Theme context provider
```

### Component Naming Conventions

- **Feature Components**: PascalCase (`FeedCard.tsx`)
- **UI Components**: PascalCase (`button.tsx` - shadcn convention)
- **Test Files**: `*.test.tsx` or `*.test.ts`
- **Type Files**: `types.ts` or `*.types.ts`

---

## 3. Hooks Directory (`src/hooks/`)

### Custom React Hooks

```
hooks/
├── use-auth.tsx              # Authentication hook
├── use-content-filters.tsx   # Content filtering state
├── use-feed-builder.tsx      # Feed builder state
├── use-mobile.tsx            # Mobile detection hook
└── use-toast.tsx             # Toast notifications (re-export)
```

---

## 4. Library Directory (`src/lib/`)

### Core Utilities and Services

```
lib/
├── api/                              # API integration
│   ├── __tests__/
│   │   └── client.test.ts           # API client tests
│   ├── services/                     # API service layer
│   │   ├── __tests__/
│   │   │   ├── feed-items.service.test.ts
│   │   │   └── feed-sources.service.test.ts
│   │   ├── auth.service.ts          # Authentication API
│   │   ├── creator.service.ts       # Creator API
│   │   ├── feed-items.service.ts    # Feed items API
│   │   ├── feed-sources.service.ts  # Feed sources API
│   │   ├── feeds.service.ts         # Feeds API
│   │   └── subscription.service.ts  # Subscriptions API
│   ├── client.ts                    # Axios client configuration
│   └── feeds.ts                     # Feed API utilities
│
├── schemas/                          # Zod validation schemas
│   ├── __tests__/
│   │   ├── auth.test.ts
│   │   └── settings.test.ts
│   ├── auth.ts                      # Auth validation schemas
│   ├── content.ts                   # Content schemas
│   ├── profile.ts                   # Profile schemas
│   └── settings.ts                  # Settings schemas
│
├── services/                         # Business logic services
│   ├── preferences-service.ts       # User preferences
│   ├── profile-service.ts           # Profile management
│   └── social-service.ts            # Social media integration
│
├── stores/                           # Zustand state stores
│   ├── __tests__/
│   │   └── auth-store.test.ts
│   ├── auth-store.ts                # Authentication state
│   └── content-selection.store.ts   # Content selection state
│
├── types/                            # TypeScript type definitions
│   ├── api.types.ts                 # API types
│   ├── auth.types.ts                # Auth types
│   ├── content.types.ts             # Content types
│   ├── feed.types.ts                # Feed types
│   └── user.types.ts                # User types
│
├── utils/                            # Utility functions
│   ├── __tests__/
│   │   └── password-strength.test.ts
│   ├── cn.ts                        # className utility (tailwind-merge)
│   ├── date.ts                      # Date formatting utilities
│   ├── password-strength.ts         # Password validation
│   └── validation.ts                # Common validators
│
└── utils.ts                         # General utilities (cn, etc.)
```

---

## 5. Key File Purposes

### Configuration Files

| File                 | Purpose                                       |
| -------------------- | --------------------------------------------- |
| `components.json`    | shadcn/ui configuration (import paths, style) |
| `next.config.mjs`    | Next.js build & runtime configuration         |
| `tailwind.config.ts` | Tailwind CSS theme and plugin configuration   |
| `tsconfig.json`      | TypeScript compiler options                   |
| `jest.config.js`     | Jest testing framework configuration          |
| `.eslintrc.json`     | ESLint code quality rules                     |
| `.prettierrc`        | Prettier code formatting rules                |
| `postcss.config.mjs` | PostCSS plugins (Tailwind, autoprefixer)      |
| `Dockerfile`         | Docker container configuration                |

### Root Files

| File            | Purpose                                 |
| --------------- | --------------------------------------- |
| `package.json`  | Dependencies, scripts, project metadata |
| `README.md`     | Project overview and setup instructions |
| `.env.example`  | Environment variable template           |
| `.gitignore`    | Git ignore patterns                     |
| `middleware.ts` | Next.js middleware (auth, redirects)    |

---

## 6. File Organization Principles

### Directory Structure Rules

1. **Feature-based Organization**: Group by feature, not by type

   ```
   ✅ components/feeds/wizard/
   ❌ components/wizards/feeds/
   ```

2. **Colocation**: Keep related files together

   ```
   components/feed-card/
   ├── feed-card.tsx
   ├── feed-card.test.tsx
   ├── use-feed-card.ts
   └── types.ts
   ```

3. **Test Proximity**: Tests live next to implementation
   ```
   ✅ components/button/__tests__/button.test.tsx
   ❌ tests/unit/components/button.test.tsx
   ```

### Naming Conventions

- **Components**: `FeedCard.tsx` (PascalCase)
- **Utilities**: `format-date.ts` (kebab-case)
- **Hooks**: `use-auth.tsx` (kebab-case, use- prefix)
- **Services**: `feeds.service.ts` (kebab-case, .service suffix)
- **Stores**: `auth-store.ts` (kebab-case, -store suffix)
- **Types**: `feed.types.ts` (kebab-case, .types suffix)
- **Tests**: `*.test.tsx` or `*.test.ts`

---

## 7. Import Path Aliases

### TypeScript Path Mapping

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Usage Examples

```typescript
// ✅ CORRECT: Using path aliases
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { Feed } from "@/lib/types/feed.types";

// ❌ WRONG: Relative paths
import { Button } from "../../../components/ui/button";
import { apiClient } from "../../lib/api/client";
```

---

## 8. Special Directories

### `public/` - Static Assets

```
public/
├── images/
│   ├── logo.svg
│   └── placeholder.png
├── fonts/                  # Custom fonts (if any)
└── favicon.ico
```

### `docs/` - Documentation

```
docs/
├── architecture/           # Technical architecture
│   ├── coding-standards.md
│   ├── tech-stack.md
│   └── source-tree.md
├── frontend/              # Frontend specifications
│   ├── README.md
│   ├── api/
│   ├── architecture/
│   ├── components/
│   ├── features/
│   ├── setup/
│   └── ux/
├── prd/                   # Product requirements
├── qa/                    # QA reports
└── stories/               # Development stories
```

### `.bmad-core/` - BMAD Agent System

```
.bmad-core/
├── agents/                # Agent definitions
├── checklists/            # Quality checklists
├── data/                  # Agent data
├── tasks/                 # Automated tasks
├── templates/             # Document templates
├── utils/                 # Agent utilities
└── core-config.yaml       # Core configuration
```

---

## 9. Generated Directories (Not in Git)

### `.next/` - Next.js Build Output

```
.next/
├── cache/                 # Build cache
├── server/                # Server-side bundles
├── static/                # Static assets
└── types/                 # Generated types
```

### `node_modules/` - Dependencies

Managed by npm/yarn/pnpm based on `package.json`

---

## 10. Route Patterns

### Next.js App Router Conventions

| Pattern         | Example                | Purpose                      |
| --------------- | ---------------------- | ---------------------------- |
| `page.tsx`      | `/feeds/page.tsx`      | Route page component         |
| `layout.tsx`    | `/feeds/layout.tsx`    | Shared layout                |
| `loading.tsx`   | `/feeds/loading.tsx`   | Loading UI                   |
| `error.tsx`     | `/feeds/error.tsx`     | Error boundary               |
| `not-found.tsx` | `/feeds/not-found.tsx` | 404 page                     |
| `route.ts`      | `/api/feeds/route.ts`  | API endpoint                 |
| `[id]`          | `/feeds/[id]/page.tsx` | Dynamic route                |
| `[...slug]`     | `/[...slug]/page.tsx`  | Catch-all route              |
| `(group)`       | `/(creator)/`          | Route group (no URL segment) |

---

## 11. Code Location Guidelines

### Where to Put New Code

**New Page/Route?** → `src/app/[route-group]/[feature]/page.tsx`

**New Component?**

- Feature-specific → `src/components/[feature]/ComponentName.tsx`
- Shared/Reusable → `src/components/shared/ComponentName.tsx`
- UI Primitive → Use shadcn/ui (DO NOT create custom)

**New Hook?** → `src/hooks/use-feature-name.tsx`

**New API Service?** → `src/lib/api/services/feature.service.ts`

**New Type?** → `src/lib/types/feature.types.ts`

**New Schema?** → `src/lib/schemas/feature.ts`

**New Store?** → `src/lib/stores/feature-store.ts`

**New Utility?** → `src/lib/utils/utility-name.ts`

**New Test?** → Next to implementation in `__tests__/` folder

---

## 12. File Size Guidelines

### Recommended Limits

- **Components**: < 250 lines (split into smaller components)
- **Pages**: < 150 lines (move logic to components/hooks)
- **Services**: < 300 lines (split by resource)
- **Utilities**: < 100 lines (focused functions)
- **Types**: < 200 lines (split by domain)

### When to Split Files

1. Component > 250 lines → Extract sub-components
2. Service > 300 lines → Split by resource
3. Type file > 200 lines → Split by domain
4. Multiple unrelated exports → Separate files

---

## Summary

### Key Takeaways

1. **App Router**: File-based routing in `src/app/`
2. **Feature Organization**: Components grouped by feature in `src/components/`
3. **Service Layer**: API services in `src/lib/api/services/`
4. **Type Safety**: Type definitions in `src/lib/types/`
5. **State Management**: Zustand stores in `src/lib/stores/`
6. **Validation**: Zod schemas in `src/lib/schemas/`
7. **Tests**: Colocated with implementation in `__tests__/`
8. **shadcn/ui**: All UI components in `src/components/ui/`

### Navigation Tips

- **Find a route**: Check `src/app/` matching the URL structure
- **Find a component**: Look in `src/components/[feature]/`
- **Find API code**: Check `src/lib/api/services/`
- **Find types**: Look in `src/lib/types/`
- **Find business logic**: Check `src/lib/services/`
- **Find state management**: Look in `src/lib/stores/`

### Resources

- [Coding Standards](/Users/weverson/GroDigital/smartfeed_admin_ui/docs/architecture/coding-standards.md)
- [Tech Stack](/Users/weverson/GroDigital/smartfeed_admin_ui/docs/architecture/tech-stack.md)
- [Frontend README](/Users/weverson/GroDigital/smartfeed_admin_ui/docs/frontend/README.md)
