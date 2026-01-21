# smartfeed Frontend Technical Specification

## 1. Technology Requirements

### Core Stack (Essentials Only)

- **Framework**: Next.js 15.1 with App Router
- **React**: React 19 with Server Components
- **Language**: TypeScript 5.7
- **Styling**: Tailwind CSS 3.4 (v4 available but v3.4 recommended for stability)
- **UI Components**: shadcn/ui (latest)
- **Form Handling**: React Hook Form 7.53 + Zod 3.23
- **API Client**: Axios 1.7 with interceptors
- **Authentication**: JWT with httpOnly cookies

### Development Tools

- **Package Manager**: pnpm 9 (recommended)
- **Runtime**: Node.js 20 LTS (stable) or Node.js 22 (latest)
- **Formatting**: Prettier 3.3
- **Type Checking**: TypeScript strict mode

## 2. Project Structure

```
src/
├── app/                       # Next.js App Router
│   ├── (auth)/               # Public auth routes
│   │   ├── login/
│   │   └── register/
│   ├── (creator)/            # Creator protected routes
│   │   ├── dashboard/
│   │   ├── feeds/
│   │   └── content/
│   ├── (subscriber)/         # Subscriber protected routes
│   │   ├── discover/
│   │   ├── portal/
│   │   └── subscriptions/
│   └── api/                  # API route handlers
├── components/
│   ├── ui/                   # shadcn/ui components
│   └── features/             # Feature-specific components
├── lib/
│   ├── api/                  # API client and services
│   ├── auth/                 # Authentication logic
│   ├── hooks/                # Custom React hooks
│   └── schemas/              # Zod schemas
└── config/
    └── api.config.ts         # API configuration
```

## 3. Authentication Setup

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token");
  const path = request.nextUrl.pathname;

  const isAuthRoute = path.startsWith("/login") || path.startsWith("/register");
  const isCreatorRoute = path.startsWith("/creator");
  const isSubscriberRoute = path.startsWith("/subscriber");

  if (!token && (isCreatorRoute || isSubscriberRoute)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/creator/:path*", "/subscriber/:path*", "/login", "/register"],
};
```

## 4. API Client Configuration

```typescript
// lib/api/client.ts
import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://localhost:8000/",
  timeout: 10000,
  withCredentials: true,
});

// Request interceptor for auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Token is sent via httpOnly cookie automatically
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

## 5. Service Layer Pattern

### Traditional Email/Password Authentication

```typescript
// lib/api/services/auth.service.ts
export const authService = {
  async login(email: string, password: string) {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const { data } = await apiClient.post("/auth/login", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return data;
  },

  async register(data: RegisterData) {
    const { data: user } = await apiClient.post("/auth/register", data);
    return user;
  },

  async getCurrentUser() {
    const { data } = await apiClient.get("/auth/me");
    return data;
  },

  async logout() {
    await apiClient.post("/auth/logout");
    window.location.href = "/";
  },
};
```

### Google OAuth Authentication (Added 2025-10-14)

**Implementation Location**: `src/lib/stores/auth-store.ts`

The Google OAuth methods are implemented in the auth store (Zustand) for better state management integration:

```typescript
// lib/stores/auth-store.ts
import { create } from "zustand";
import { apiClient } from "@/lib/api/client";

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Traditional auth methods
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;

  // Google OAuth methods (NEW)
  googleRegister: (userType: "creator" | "subscriber", affiliateHash?: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  handleGoogleCallback: (code: string, state: string) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // ... existing methods ...

  /**
   * Initiate Google OAuth registration flow
   * @param userType - User role: 'creator' or 'subscriber'
   * @param affiliateHash - Optional affiliate tracking code
   * @throws {Error} If backend returns invalid response
   */
  googleRegister: async (userType, affiliateHash) => {
    // POST to backend to get OAuth URL
    const response = await apiClient.post("/auth/google/register", {
      user_type: userType,
      ...(affiliateHash && { affiliate_hash: affiliateHash }),
    });

    const redirectUrl = response.data.redirect_url;

    // Extract backend-generated state from OAuth URL
    const url = new URL(redirectUrl);
    const state = url.searchParams.get("state");

    if (state) {
      // Store backend's state for CSRF validation
      sessionStorage.setItem("oauth_state", state);
    }

    // Redirect user to Google OAuth
    window.location.href = redirectUrl;
  },

  /**
   * Initiate Google OAuth login flow for existing users
   * @throws {Error} If backend returns invalid response
   */
  googleLogin: async () => {
    // POST to backend to get OAuth URL
    const response = await apiClient.post("/auth/google/login");

    const redirectUrl = response.data.redirect_url;

    // Extract backend-generated state from OAuth URL
    const url = new URL(redirectUrl);
    const state = url.searchParams.get("state");

    if (state) {
      // Store backend's state for CSRF validation
      sessionStorage.setItem("oauth_state", state);
    }

    // Redirect user to Google OAuth
    window.location.href = redirectUrl;
  },

  /**
   * Handle OAuth callback after Google authentication
   * Validates state parameter and exchanges code for tokens
   * @param code - Authorization code from Google
   * @param state - OAuth state parameter for CSRF protection
   * @throws {Error} If state validation fails or backend returns error
   */
  handleGoogleCallback: async (code, state) => {
    // Validate state parameter (CSRF protection)
    const storedState = sessionStorage.getItem("oauth_state");

    if (!storedState || state !== storedState) {
      sessionStorage.removeItem("oauth_state");
      throw new Error("Invalid OAuth state parameter");
    }

    // Exchange authorization code for tokens and user data
    const response = await apiClient.get("/auth/google/callback", {
      params: { code, state },
    });

    const { user, is_new_user } = response.data;

    // Update auth state
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
    });

    // Mark new users for welcome message display
    if (is_new_user) {
      sessionStorage.setItem("justSignedUp", "true");
    }

    // Clean up OAuth state
    sessionStorage.removeItem("oauth_state");
  },
}));
```

**Key Implementation Details:**

1. **Backend-Generated State**: The backend generates the OAuth state parameter, and the frontend extracts and stores it from the OAuth URL. This ensures state synchronization between frontend and backend.

2. **CSRF Protection**: State parameter is validated on callback - must match the value stored from the backend's OAuth URL.

3. **User Type Handling**: Registration flow requires `user_type` parameter to create the correct user role. Login flow infers user type from existing account.

4. **New User Detection**: `is_new_user` flag from backend triggers welcome message display via sessionStorage.

5. **Error Handling**: All methods throw errors that should be caught and displayed to the user with appropriate retry options.

**API Endpoints Used:**

- `POST /auth/google/register` - Returns OAuth URL with state parameter
- `POST /auth/google/login` - Returns OAuth URL with state parameter
- `GET /auth/google/callback` - Exchanges code for tokens, returns user data

**Usage Example:**

```typescript
// In a React component
import { useAuthStore } from '@/lib/stores/auth-store'

function LoginPage() {
  const { googleLogin } = useAuthStore()

  const handleGoogleLogin = async () => {
    try {
      await googleLogin() // Redirects to Google
    } catch (error) {
      toast.error('Failed to initiate Google login')
    }
  }

  return <Button onClick={handleGoogleLogin}>Sign in with Google</Button>
}
```

For complete documentation including sequence diagrams and error handling, see [Authentication Flow Documentation](../features/authentication.md#5-google-oauth-authentication-flow).

## 6. Form Validation with Zod

```typescript
// lib/schemas/auth.schema.ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Minimum 8 characters"),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(["creator", "subscriber"]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
```

## 7. Component Patterns

### Server Component (Default)

```typescript
// app/(subscriber)/discover/page.tsx
export default async function DiscoverPage() {
  // Fetch data on server
  const feeds = await fetch(`${API_URL}/feeds`).then(r => r.json());

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Discover Feeds</h1>
      <FeedGrid feeds={feeds} />
    </div>
  );
}
```

### Client Component (When Needed)

```typescript
// components/features/subscribe-button.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { subscriptionService } from '@/lib/api/services/subscription.service';

export function SubscribeButton({ feedId }: { feedId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      await subscriptionService.subscribe(feedId);
      // Handle success
    } catch (error) {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleSubscribe} disabled={isLoading}>
      {isLoading ? 'Subscribing...' : 'Subscribe'}
    </Button>
  );
}
```

## 8. shadcn/ui Setup Commands

```bash
# Initialize shadcn/ui
npx shadcn@latest init

# Add required components
npx shadcn@latest add button card form input label \
  dialog sheet tabs avatar badge separator \
  dropdown-menu navigation-menu toast

# Add authentication block
npx shadcn@latest block login-02

# Add dashboard block
npx shadcn@latest block dashboard-01
```

## 9. Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=https://localhost:8000/
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 10. Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "5.7.2",
    "@hookform/resolvers": "^3.9.0",
    "react-hook-form": "^7.53.0",
    "zod": "^3.23.8",
    "axios": "^1.7.7",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.2",
    "tailwindcss-animate": "^1.0.7",
    "@radix-ui/react-slot": "^1.1.0",
    "lucide-react": "^0.454.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^3.4.15",
    "postcss": "^8.4.47",
    "autoprefixer": "^10.4.20",
    "prettier": "^3.3.3",
    "eslint": "^8.57.0",
    "eslint-config-next": "15.1.0"
  }
}
```

## 11. Quick Start Commands

```bash
# 1. Create Next.js project
npx create-next-app@latest smartfeed --typescript --tailwind --app --no-src-dir

# 2. Install dependencies
cd smartfeed
pnpm add axios react-hook-form @hookform/resolvers zod \
  class-variance-authority clsx tailwind-merge lucide-react

# 3. Setup shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button card form input
npx shadcn@latest block login-02 dashboard-01

# 4. Create folder structure
mkdir -p app/\(auth\)/{login,register}
mkdir -p app/\(creator\)/{dashboard,feeds,content}
mkdir -p app/\(subscriber\)/{discover,portal,subscriptions}
mkdir -p components/{ui,features}
mkdir -p lib/{api,auth,hooks,schemas}

# 5. Start development
pnpm dev
```

## 12. Key Implementation Files

### Priority 1 - Authentication

- `middleware.ts` - Route protection
- `app/(auth)/login/page.tsx` - Login page
- `app/(auth)/register/page.tsx` - Registration page
- `lib/api/services/auth.service.ts` - Auth API calls
- `lib/schemas/auth.schema.ts` - Validation schemas

### Priority 2 - Creator Flow

- `app/(creator)/dashboard/page.tsx` - Creator dashboard
- `app/(creator)/feeds/page.tsx` - Feed management
- `lib/api/services/creator.service.ts` - Creator API calls

### Priority 3 - Subscriber Flow

- `app/(subscriber)/discover/page.tsx` - Feed discovery
- `app/(subscriber)/portal/page.tsx` - Content portal
- `lib/api/services/subscription.service.ts` - Subscription API calls

## Notes

- Use Server Components by default for better performance
- Only add "use client" when you need interactivity
- All API calls go through the Axios client with interceptors
- Forms use React Hook Form + Zod for validation
- shadcn/ui provides all UI components needed
- Authentication uses httpOnly cookies for security
- TypeScript strict mode is enabled for type safety
