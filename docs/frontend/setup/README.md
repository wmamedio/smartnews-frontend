# SmartNews Frontend Setup Guide

## Prerequisites

- Node.js 20.0+ and npm/pnpm
- Git
- Code editor (VS Code recommended)
- Access to FastAPI backend at https://localhost:8000/

## Quick Start

### 1. Create Next.js Project

```bash
# Create new Next.js project
npx create-next-app@latest smartnews-frontend --typescript --tailwind --app

# Navigate to project
cd smartnews-frontend
```

### 2. Install shadcn/ui

```bash
# Initialize shadcn/ui
npx shadcn@latest init

# Install required components
npx shadcn@latest add alert avatar badge button card checkbox dialog \
  dropdown-menu form input label navigation-menu progress radio-group \
  select separator sheet skeleton table tabs textarea toast toggle toggle-group

# Install UI blocks
npx shadcn@latest block login-02
npx shadcn@latest block dashboard-01
```

### 3. Install Additional Dependencies

```bash
# Core dependencies
npm install axios react-hook-form @hookform/resolvers zod \
  date-fns recharts lucide-react class-variance-authority \
  @radix-ui/react-slot

# Development dependencies
npm install -D @types/node eslint-config-next prettier \
  eslint-plugin-prettier @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin
```

### 4. Environment Setup

Create `.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://localhost:8000/
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Features
NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN=true
NEXT_PUBLIC_ENABLE_MOCK_DATA=false
```

### 5. Project Structure Setup

```bash
# Create directory structure
mkdir -p src/{app,components,lib,config,styles,public}
mkdir -p src/app/{\(auth\),\(creator\),\(subscriber\),api}
mkdir -p src/components/{ui,auth,creator,subscriber,common,layouts}
mkdir -p src/lib/{api,auth,hooks,utils,types,schemas,context}
mkdir -p src/lib/api/{services,mock}
```

## Configuration Files

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Tailwind Configuration

```javascript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
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
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
```

### ESLint Configuration

```json
// .eslintrc.json
{
  "extends": ["next/core-web-vitals", "plugin:@typescript-eslint/recommended", "prettier"],
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

### Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 80
}
```

## Initial Implementation

### 1. Set Up API Client

Create `src/lib/api/client.ts`:

```typescript
import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add interceptors as shown in API Integration Guide

export { apiClient };
```

### 2. Create Auth Context

Create `src/lib/context/auth-context.tsx`:

```typescript
// Copy from Authentication Flow Documentation
```

### 3. Set Up Root Layout

Create `src/app/layout.tsx`:

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/context/auth-context';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SmartNews - Content Curation Platform',
  description: 'Monetize your content curation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 4. Create Landing Page

Create `src/app/page.tsx`:

```typescript
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            Welcome to SmartNews
          </h1>
          <p className="mx-auto max-w-[600px] text-gray-500 md:text-xl">
            Monetize your content curation. Join as a creator or discover amazing feeds.
          </p>
          <div className="space-x-4">
            <Button asChild size="lg">
              <Link href="/register">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 5. Implement Authentication Pages

Create login and registration pages using the shadcn login-02 block as base.

## Running the Application

### Development Mode

```bash
# Start development server
npm run dev

# Application will be available at http://localhost:3000
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Testing Setup

### Install Testing Dependencies

```bash
npm install -D jest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event jest-environment-jsdom
```

### Jest Configuration

Create `jest.config.js`:

```javascript
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testEnvironment: "jest-environment-jsdom",
};

module.exports = createJestConfig(customJestConfig);
```

Create `jest.setup.js`:

```javascript
import "@testing-library/jest-dom";
```

## Deployment

### Vercel Deployment (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

Build and run:

```bash
docker build -t smartnews-frontend .
docker run -p 3000:3000 smartnews-frontend
```

## Next Steps

1. **Implement Authentication**
   - Follow the [Authentication Flow Documentation](../features/authentication.md)
   - Set up login and registration pages

2. **Create User Dashboards**
   - Implement creator dashboard using dashboard-01 block
   - Build subscriber portal

3. **Integrate API Services**
   - Follow the [API Integration Guide](../api/integration-guide.md)
   - Implement service layers

4. **Add Features**
   - Implement creator stories from [Creator Stories](../features/creator-stories.md)
   - Implement subscriber stories from [Subscriber Stories](../features/subscriber-stories.md)

5. **Styling & Components**
   - Follow [shadcn Component Mapping](../components/shadcn-components.md)
   - Maintain consistent theming

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure the backend allows requests from http://localhost:3000
   - Check API_URL environment variable

2. **Authentication Failures**
   - Verify JWT token handling
   - Check cookie settings for local development

3. **Build Errors**
   - Clear `.next` folder: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

4. **TypeScript Errors**
   - Run `npm run type-check` to identify issues
   - Ensure all imports have proper types

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [FastAPI Documentation](https://localhost:8000//docs)
