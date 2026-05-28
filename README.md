# SmartNews - Content Curation Platform

A production-grade content curation and newsletter platform showcasing modern frontend architecture, TypeScript mastery, and enterprise-level React patterns.

## 🎯 Project Overview

SmartNews is a full-stack web application that enables content creators to curate, manage, and distribute newsletters to subscribers. This portfolio adaptation demonstrates my expertise in building scalable, type-safe React applications with modern tooling.

---

## 🚀 Tech Stack & Skills Demonstrated

### Core Technologies
- **Next.js 15.5+** (App Router) - Server & client components, streaming SSR
- **React 19** - Latest features including concurrent rendering
- **TypeScript 5.9** - Strict mode, advanced types, generic patterns
- **Tailwind CSS** - Utility-first styling with custom design system
- **shadcn/ui + Radix UI** - Accessible component architecture

### State & Data Management
- **Zustand** - Lightweight state management with TypeScript
- **TanStack Query** - Server state, caching, optimistic updates
- **React Hook Form + Zod** - Type-safe form validation

### Developer Experience & Quality
- **ESLint + Prettier** - Strict linting with 0 warnings policy
- **Jest + React Testing Library** - Comprehensive unit tests
- **Playwright (Python)** - E2E test suite with custom utilities
- **TypeScript Strict Mode** - Full type safety across codebase

### Advanced Features
- **Framer Motion** - Complex animations and transitions
- **dnd-kit** - Drag-and-drop content organization
- **TanStack Table** - Advanced data tables with sorting/filtering
- **Google OAuth** - Third-party authentication integration

---

## 💡 Key Features & Technical Highlights

### 1. **Multi-User Authentication System**
- Role-based access control (Creator/Subscriber)
- JWT token management with httpOnly cookies
- Google OAuth integration
- Protected route middleware

**Code Example**: [`src/components/auth/`](src/components/auth/)

### 2. **Complex Feed Builder with Drag-and-Drop**
- Multi-step wizard with form state persistence
- Real-time content preview
- AI-powered keyword suggestions
- Drag-and-drop content organization

**Code Example**: [`src/components/feeds/wizard/`](src/components/feeds/wizard/)

### 3. **Advanced Content Management**
- Bulk actions (select, rate, organize)
- Real-time filtering and search
- Content rating system with keyword refinement
- RSS feed import and URL scraping

**Code Example**: [`src/components/content/library/`](src/components/content/library/)

### 4. **Responsive Dashboard System**
- Chart visualizations (Recharts)
- Real-time metrics updates
- Mobile-first responsive design
- Dark mode support

**Code Example**: [`src/app/(creator)/dashboard/`](src/app/(creator)/dashboard/)

### 5. **Comprehensive Settings System**
- Profile management with avatar upload/crop
- Email/password updates with verification
- Privacy controls and data export
- Social media integrations

**Code Example**: [`src/components/settings/`](src/components/settings/)

---

## 🏗️ Architecture Decisions

### Component Architecture
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth route group
│   ├── (creator)/         # Creator dashboard
│   └── (subscriber)/      # Public/subscriber views
├── components/
│   ├── ui/                # shadcn/ui base components
│   ├── auth/              # Auth-specific components
│   ├── feeds/             # Feed management
│   ├── content/           # Content curation
│   └── settings/          # Settings pages
├── lib/
│   ├── api/               # Type-safe API client
│   ├── stores/            # Zustand state stores
│   └── utils/             # Shared utilities
└── tests/
    ├── e2e/               # Playwright E2E tests
    └── __tests__/         # Jest unit tests
```

### Design Patterns Implemented
- **Compound Components** - Flexible, reusable component APIs
- **Custom Hooks** - Shared logic extraction
- **Context + Reducers** - Complex state management
- **Server/Client Component Split** - Optimal rendering strategy
- **API Route Handlers** - Type-safe backend integration

### Type Safety
- Strict TypeScript configuration
- Zod schemas for runtime validation
- Generic utility types for reusability
- Full API response typing

---

## 🎨 Code Quality & Best Practices

### Testing Strategy
- **Unit Tests**: Components, hooks, utilities
- **Integration Tests**: Form flows, API interactions
- **E2E Tests**: Complete user journeys
- **Accessibility Tests**: jest-axe integration

**Test Coverage**:
```bash
npm run test              # Run Jest unit tests
npm run test:e2e:feed-crud    # E2E feed management
npm run test:e2e:source-filtering  # E2E content filtering
```

### Code Standards
- **0 ESLint warnings** enforced in CI
- Prettier formatting across all files
- Semantic HTML with ARIA labels
- Mobile-first responsive design
- WCAG 2.1 AA compliance

### Performance Optimization
- React Server Components for static content
- Dynamic imports for code splitting
- Image optimization with Next.js Image
- Debounced search and filters
- Optimistic UI updates

---

## 📊 Showcase Highlights

### Complex State Management
**File**: [`src/lib/stores/auth-store.ts`](src/lib/stores/auth-store.ts)
- Zustand store with TypeScript generics
- Persistent authentication state
- Token refresh logic
- Type-safe actions

### Advanced Form Handling
**File**: [`src/components/feeds/wizard/BasicInfoStep.tsx`](src/components/feeds/wizard/BasicInfoStep.tsx)
- React Hook Form + Zod validation
- Multi-step wizard state persistence
- Real-time field validation
- Dynamic field dependencies

### Type-Safe API Client
**File**: [`src/lib/api/client.ts`](src/lib/api/client.ts)
- Axios interceptors for auth
- Generic request/response types
- Error handling with type guards
- Environment-based configuration

### Custom Hooks
**Examples**:
- `useAuth` - Authentication state and actions
- `useDebounce` - Performance optimization
- `useFeedForm` - Complex form state management
- `useMediaQuery` - Responsive breakpoints

### Accessibility Features
- Keyboard navigation support
- Screen reader announcements
- Focus management in modals
- High contrast mode support

---

## 🚀 Getting Started

### Prerequisites
```bash
node >= 18.0.0
npm >= 9.0.0
```

### Installation
```bash
# Clone repository
git clone https://github.com/wmamedio/newsletter_frontend.git

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API configuration

# Run development server
npm run dev
```

### Available Scripts
```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript validation
npm run test         # Run Jest tests
npm run test:e2e:*   # Run E2E tests
```

---

## 📁 Project Structure Deep Dive

### Key Directories

**`/src/app`** - Next.js 15 App Router
- Route groups for logical separation
- Server/client component optimization
- Parallel routes for modals
- Loading and error boundaries

**`/src/components`** - Component library
- Base UI components from shadcn/ui
- Feature-specific components
- Shared layout components
- Comprehensive test coverage

**`/src/lib`** - Utilities and services
- Type-safe API client
- Zustand stores
- Helper functions
- Custom hooks

**`/tests`** - Testing suite
- E2E tests with Playwright
- Unit tests with Jest
- Shared test utilities
- Screenshot artifacts

---

## 🔍 Code Examples Worth Reviewing

### 1. Complex Component with Drag-and-Drop
[`src/components/feeds/builder/DraggableItem.tsx`](src/components/feeds/builder/DraggableItem.tsx)
- dnd-kit integration
- TypeScript generics
- Performance optimization

### 2. Multi-Step Wizard Pattern
[`src/components/feeds/wizard/`](src/components/feeds/wizard/)
- Form state persistence
- Step validation
- Progress tracking
- Type-safe data flow

### 3. Advanced Table with Filtering
[`src/components/content/library/ContentGrid.tsx`](src/components/content/library/ContentGrid.tsx)
- TanStack Table integration
- Server-side sorting/filtering
- Bulk selection
- Optimistic updates

### 4. Reusable Hook Pattern
[`src/lib/hooks/`](src/lib/)
- Custom hook composition
- TypeScript generics
- Error boundaries
- Loading states

### 5. E2E Testing Utilities
[`tests/e2e/shared/test_utils.py`](tests/e2e/shared/test_utils.py)
- Reusable test helpers
- Page object pattern
- Screenshot capture
- API mocking

---

## 🎓 What This Project Demonstrates

### Frontend Engineering
✅ Modern React patterns (hooks, context, composition)
✅ TypeScript mastery (generics, utility types, strict mode)
✅ Performance optimization (memoization, code splitting)
✅ State management (Zustand, React Query, form state)
✅ Responsive design (mobile-first, touch interactions)

### Software Engineering
✅ Clean architecture (separation of concerns)
✅ SOLID principles in component design
✅ Comprehensive testing strategy
✅ CI/CD readiness (linting, type checking, builds)
✅ Documentation and maintainability

### Product Engineering
✅ User-centric design decisions
✅ Accessibility-first approach
✅ Error handling and edge cases
✅ Loading states and empty states
✅ Real-world feature complexity

---

## 📝 Documentation

- **[Architecture Overview](docs/frontend/README.md)** - System design and patterns
- **[Component Guide](docs/frontend/components/shadcn-components.md)** - Component usage
- **[API Integration](docs/frontend/api/integration-guide.md)** - Backend integration
- **[Testing Strategy](docs/architecture/testing-strategy.md)** - QA approach

---

## 🤝 Contact & Links

**Weverson Mamédio**
Senior Frontend Engineer | React/TypeScript Specialist

- **Portfolio**: [wmamedio.com](https://wmamedio.com)
- **GitHub**: [github.com/wmamedio](https://github.com/wmamedio)
- **LinkedIn**: [linkedin.com/in/wmamedio](https://www.linkedin.com/in/wmamedio/)

---

## 📄 License

This portfolio project is adapted from a production application and is for demonstration purposes.

---

## 🙏 Acknowledgments

Built with modern web technologies:
- [Next.js](https://nextjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Note for Recruiters**: This codebase demonstrates production-ready code quality, testing practices, and architectural decisions. Feel free to explore the source code and reach out with any questions about technical implementations.
