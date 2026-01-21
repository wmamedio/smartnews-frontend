# Technology Stack - smartfeed Frontend

## Overview

Complete technology stack documentation for the smartfeed frontend application. This document serves as the single source of truth for all technologies, libraries, and tools used in the project.

---

## 1. Core Framework

### Next.js 15.5.4

**Purpose**: React framework with App Router, Server Components, and file-based routing

**Key Features**:

- App Router for modern routing
- React Server Components by default
- Built-in TypeScript support
- API Routes for backend endpoints
- Image optimization
- Turbopack for fast development

**Configuration**:

```javascript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["test.api.smartnews.example", "api.smartnews.example"],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

export default nextConfig;
```

**Scripts**:

```json
{
  "dev": "next dev --turbo",
  "build": "next build",
  "start": "next start"
}
```

---

## 2. React Ecosystem

### React 19.1.1

**Purpose**: UI library for building component-based interfaces

**Key Features**:

- Function components
- Hooks API
- Server Components support
- Automatic batching
- Concurrent rendering

### React DOM 19.1.1

**Purpose**: React renderer for web applications

---

## 3. TypeScript

### TypeScript 5.9.2

**Purpose**: Typed superset of JavaScript for type safety

**Configuration** (`tsconfig.json`):

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    },
    "forceConsistentCasingInFileNames": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Type Packages

- `@types/node@24.5.2` - Node.js type definitions
- `@types/react@19.1.13` - React type definitions
- `@types/react-dom@19.1.9` - React DOM type definitions
- `@types/js-cookie@3.0.6` - JS Cookie type definitions
- `@types/jsonwebtoken@9.0.10` - JWT type definitions
- `@types/jest@30.0.0` - Jest type definitions

---

## 4. Styling & UI Framework

### Tailwind CSS 3.4.17

**Purpose**: Utility-first CSS framework

**Configuration** (`tailwind.config.ts`):

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
};

export default config;
```

### Related Packages

- `autoprefixer@10.4.21` - PostCSS plugin to parse CSS and add vendor prefixes
- `postcss@8.5.6` - Tool for transforming CSS with JavaScript
- `tailwindcss-animate@1.0.7` - Animation utilities for Tailwind
- `@tailwindcss/forms@0.5.10` - Form styles plugin
- `@tailwindcss/typography@0.5.19` - Typography plugin

---

## 5. UI Component Library

### shadcn/ui (Latest)

**Purpose**: Re-usable component library built on Radix UI

**CRITICAL**: Always use shadcn/ui blocks and components. Never build custom UI from scratch.

### Radix UI Components

**Purpose**: Unstyled, accessible component primitives

**Installed Components**:

- `@radix-ui/react-alert-dialog@1.1.15` - Alert dialogs
- `@radix-ui/react-avatar@1.1.10` - Avatar components
- `@radix-ui/react-checkbox@1.3.3` - Checkbox inputs
- `@radix-ui/react-collapsible@1.1.12` - Collapsible content
- `@radix-ui/react-dialog@1.1.15` - Modal dialogs
- `@radix-ui/react-dropdown-menu@2.1.16` - Dropdown menus
- `@radix-ui/react-label@2.1.7` - Form labels
- `@radix-ui/react-navigation-menu@1.2.14` - Navigation menus
- `@radix-ui/react-progress@1.1.7` - Progress indicators
- `@radix-ui/react-radio-group@1.3.8` - Radio button groups
- `@radix-ui/react-select@2.2.6` - Select dropdowns
- `@radix-ui/react-separator@1.1.7` - Visual separators
- `@radix-ui/react-slot@1.2.3` - Component composition
- `@radix-ui/react-switch@1.2.6` - Toggle switches
- `@radix-ui/react-tabs@1.1.13` - Tab navigation
- `@radix-ui/react-toast@1.2.15` - Toast notifications
- `@radix-ui/react-toggle@1.1.10` - Toggle buttons
- `@radix-ui/react-toggle-group@1.1.11` - Toggle button groups
- `@radix-ui/react-tooltip@1.2.8` - Tooltips

### UI Utilities

- `class-variance-authority@0.7.1` - CVA for variant-based styling
- `clsx@2.1.1` - Utility for constructing className strings
- `tailwind-merge@3.3.1` - Merge Tailwind CSS classes
- `lucide-react@0.544.0` - Icon library

---

## 6. Form Management

### React Hook Form 7.63.0

**Purpose**: Performant form library with validation

**Key Features**:

- Uncontrolled components for performance
- Built-in validation
- TypeScript support
- Small bundle size

**Usage Pattern**:

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: {
    /* ... */
  },
});
```

### @hookform/resolvers 5.2.2

**Purpose**: Validation resolver adapters for React Hook Form

**Supports**: Zod, Yup, Joi, and more

---

## 7. Schema Validation

### Zod 4.1.11

**Purpose**: TypeScript-first schema validation

**Key Features**:

- Type inference
- Composable schemas
- Custom error messages
- Runtime validation

**Example**:

```typescript
import { z } from "zod";

const userSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Minimum 8 characters"),
});

type User = z.infer<typeof userSchema>;
```

---

## 8. HTTP Client

### Axios 1.12.2

**Purpose**: Promise-based HTTP client

**Configuration**:

```typescript
import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  withCredentials: true,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Token sent via httpOnly cookie
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

---

## 9. State Management

### Zustand 5.0.8

**Purpose**: Small, fast state management library

**Key Features**:

- Simple API
- No boilerplate
- TypeScript support
- DevTools integration

**Usage**:

```typescript
import { create } from "zustand";

interface State {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<State>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
```

---

## 10. Data Fetching

### @tanstack/react-query 5.90.2

**Purpose**: Data fetching and caching library

**Key Features**:

- Automatic caching
- Background updates
- Request deduplication
- Optimistic updates

**Configuration**:

```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});
```

---

## 11. Data Display

### @tanstack/react-table 8.21.3

**Purpose**: Headless table library for complex data grids

**Key Features**:

- Sorting, filtering, pagination
- Column resizing
- Row selection
- Virtualization support

### Recharts 3.2.1

**Purpose**: Composable charting library built on React

**Components Used**:

- Line charts
- Bar charts
- Area charts
- Pie charts

---

## 12. Drag & Drop

### @dnd-kit

**Packages**:

- `@dnd-kit/core@6.3.1` - Core DnD functionality
- `@dnd-kit/sortable@10.0.0` - Sortable lists
- `@dnd-kit/utilities@3.2.2` - Utility functions

**Purpose**: Modern drag and drop toolkit for React

**Used For**:

- Feed content reordering
- Dashboard customization

---

## 13. Date & Time

### date-fns 4.1.0

**Purpose**: Modern JavaScript date utility library

**Key Features**:

- Modular (tree-shakeable)
- Immutable
- TypeScript support
- i18n support

**Common Functions**:

```typescript
import { format, formatDistance, addDays } from "date-fns";

format(new Date(), "yyyy-MM-dd");
formatDistance(new Date(), addDays(new Date(), 3));
```

---

## 14. Animation

### Framer Motion 12.23.22

**Purpose**: Production-ready animation library

**Key Features**:

- Declarative animations
- Layout animations
- Gesture support
- Server Component compatible

**Usage**:

```typescript
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

---

## 15. Authentication

### jsonwebtoken 9.0.2

**Purpose**: JWT token generation and verification

**Usage**: Server-side token validation

### js-cookie 3.0.5

**Purpose**: Simple JavaScript API for handling cookies

**Usage**: Client-side cookie management (non-httpOnly cookies only)

---

## 16. Notifications

### Sonner 2.0.7

**Purpose**: Toast notification library

**Key Features**:

- Beautiful default styling
- Customizable
- Promise-based API
- Keyboard accessible

**Usage**:

```typescript
import { toast } from "sonner";

toast.success("Feed created successfully");
toast.error("Failed to create feed");
toast.loading("Creating feed...");
```

---

## 17. File Upload

### react-dropzone 14.3.8

**Purpose**: File drag-and-drop zone

**Key Features**:

- Multiple file support
- File type validation
- Size validation
- Preview generation

---

## 18. Theme Management

### next-themes 0.4.6

**Purpose**: Theme switching for Next.js

**Features**:

- Dark/light mode
- System preference detection
- No flash on load
- Server Component compatible

---

## 19. Utilities

### react-intersection-observer 9.16.0

**Purpose**: React wrapper for Intersection Observer API

**Used For**:

- Infinite scroll
- Lazy loading
- Animation triggers

---

## 20. Testing

### Jest 30.2.0

**Purpose**: JavaScript testing framework

**Configuration** (`jest.config.js`):

```javascript
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

module.exports = createJestConfig(customJestConfig);
```

### Testing Library

- `@testing-library/react@16.3.0` - React component testing
- `@testing-library/jest-dom@6.8.0` - Custom Jest matchers
- `@testing-library/user-event@14.6.1` - User interaction simulation
- `jest-environment-jsdom@30.2.0` - JSDOM test environment

### Accessibility Testing

- `axe-core@4.10.3` - Accessibility engine
- `jest-axe@10.0.0` - Jest matcher for axe

---

## 21. Code Quality

### ESLint 9.36.0

**Purpose**: JavaScript/TypeScript linter

**Configuration**:

```json
{
  "extends": ["next/core-web-vitals", "prettier"],
  "plugins": ["prettier"],
  "rules": {
    "prettier/prettier": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

**Packages**:

- `eslint-config-next@15.5.4` - Next.js ESLint config
- `eslint-config-prettier@10.1.8` - Disable conflicting rules
- `eslint-plugin-prettier@5.5.4` - Run Prettier as ESLint rule

### Prettier 3.6.2

**Purpose**: Code formatter

**Configuration** (`.prettierrc`):

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always"
}
```

---

## 22. Development Tools

### Node.js & Package Management

- **Node.js**: 20 LTS (recommended) or 22 (latest)
- **Package Manager**: npm (default)

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=https://localhost:8000/
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**CRITICAL**: All API calls MUST use `NEXT_PUBLIC_API_URL`, never hardcoded URLs

---

## 23. Docker

### Dockerfile

```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

---

## 24. API Backend

### FastAPI Backend

**Test Environment**: https://localhost:8000/
**Production**: https://localhost:8000/

**Documentation**:

- OpenAPI Spec: `/openapi.json`
- Swagger UI: `/docs`
- ReDoc: `/redoc`

**Authentication**: JWT tokens via httpOnly cookies

---

## 25. Version Management

### Key Versions Summary

| Package               | Version | Purpose          |
| --------------------- | ------- | ---------------- |
| Next.js               | 15.5.4  | Framework        |
| React                 | 19.1.1  | UI Library       |
| TypeScript            | 5.9.2   | Type Safety      |
| Tailwind CSS          | 3.4.17  | Styling          |
| React Hook Form       | 7.63.0  | Forms            |
| Zod                   | 4.1.11  | Validation       |
| Axios                 | 1.12.2  | HTTP Client      |
| Zustand               | 5.0.8   | State Management |
| @tanstack/react-query | 5.90.2  | Data Fetching    |
| Jest                  | 30.2.0  | Testing          |

---

## 26. Installation Commands

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd smartfeed_admin_ui

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your values

# Run development server
npm run dev
```

### shadcn/ui Setup

```bash
# Initialize shadcn/ui
npx shadcn@latest init

# Add core components
npx shadcn@latest add button card form input label
npx shadcn@latest add alert avatar badge checkbox dialog
npx shadcn@latest add dropdown-menu navigation-menu progress
npx shadcn@latest add radio-group select separator sheet
npx shadcn@latest add skeleton table tabs textarea toast
npx shadcn@latest add toggle toggle-group switch tooltip

# Add blocks
npx shadcn@latest block login-02
npx shadcn@latest block dashboard-01
```

---

## 27. Build & Deployment

### Build Commands

```bash
# Development
npm run dev          # Start dev server with Turbopack

# Production Build
npm run build        # Build for production
npm run start        # Start production server

# Quality Checks
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm run format       # Format code with Prettier
npm run test         # Run Jest tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report

# Docker Build
docker build -t smartfeed-frontend .
docker run -p 3000:3000 smartfeed-frontend
```

---

## Summary

### Technology Decisions

1. **Next.js 15** - Modern React framework with App Router
2. **TypeScript** - Type safety and better DX
3. **Tailwind CSS** - Utility-first styling
4. **shadcn/ui** - High-quality, accessible components
5. **React Hook Form + Zod** - Form handling and validation
6. **Axios** - HTTP client with interceptors
7. **Zustand** - Simple state management
8. **React Query** - Data fetching and caching
9. **Jest + Testing Library** - Comprehensive testing

### Critical Rules

- ✅ Use shadcn/ui blocks and components (ALWAYS)
- ✅ Use CSS variables from globals.css (NEVER hardcode colors)
- ✅ Use NEXT_PUBLIC_API_URL environment variable (NEVER hardcode API URLs)
- ✅ Server Components by default, Client Components only when needed
- ✅ TypeScript strict mode enabled
- ✅ All quality checks must pass before deployment
