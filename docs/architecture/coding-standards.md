# Coding Standards - smartfeed Frontend

## Overview

This document defines the coding standards, best practices, and quality requirements for the smartfeed frontend codebase. All developers must adhere to these standards to ensure consistency, maintainability, and quality.

---

## 1. TypeScript Standards

### Strict Mode Requirements

```typescript
// tsconfig.json - MUST use strict mode
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Type Definitions

- **NEVER use `any`** - Use `unknown` and type guards instead
- **Avoid type assertions** - Use proper type narrowing
- **Export all public types** - Make types reusable
- **Use `interface` for object shapes** - Use `type` for unions/intersections

```typescript
// ✅ CORRECT
interface User {
  id: string;
  email: string;
  role: "creator" | "subscriber";
}

function processUser(user: unknown): User {
  if (isUser(user)) {
    return user;
  }
  throw new Error("Invalid user");
}

// ❌ WRONG
function processUser(user: any) {
  return user as User;
}
```

### Naming Conventions

- **Interfaces/Types**: PascalCase (`UserProfile`, `FeedData`)
- **Components**: PascalCase (`FeedCard`, `LoginForm`)
- **Functions/Variables**: camelCase (`getUserData`, `isAuthenticated`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_RETRIES`)
- **Files**: kebab-case (`user-profile.tsx`, `feed-service.ts`)

---

## 2. React & Next.js Standards

### Component Structure

```typescript
// ✅ CORRECT: Organized component with proper structure
'use client' // Only when needed

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Feed } from '@/lib/types'

interface FeedCardProps {
  feed: Feed
  onSubscribe?: (feedId: string) => void
}

export function FeedCard({ feed, onSubscribe }: FeedCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubscribe = async () => {
    setIsLoading(true)
    try {
      await onSubscribe?.(feed.id)
    } catch (error) {
      console.error('Subscribe failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="feed-card">
      <h3>{feed.name}</h3>
      <Button onClick={handleSubscribe} disabled={isLoading}>
        {isLoading ? 'Subscribing...' : 'Subscribe'}
      </Button>
    </div>
  )
}
```

### Server vs Client Components

- **Default to Server Components** - Only use `'use client'` when necessary
- **Client Components needed for**:
  - Event handlers (`onClick`, `onChange`)
  - React hooks (`useState`, `useEffect`, etc.)
  - Browser APIs (`window`, `localStorage`)
  - Third-party libraries requiring client-side execution

```typescript
// ✅ Server Component (default)
export default async function FeedsPage() {
  const feeds = await fetchFeeds()
  return <FeedList feeds={feeds} />
}

// ✅ Client Component (when needed)
'use client'

export function SubscribeButton({ feedId }: { feedId: string }) {
  const [subscribed, setSubscribed] = useState(false)
  // ... client-side logic
}
```

---

## 3. shadcn/ui Component Standards

### CRITICAL RULES

1. **ALWAYS use shadcn/ui blocks first** - Search MCP before building
2. **NEVER create custom components** when shadcn equivalents exist
3. **ONLY use color variables** from globals.css - NO hardcoded colors
4. **Maintain original block structure** - Extend, don't replace

### Component Discovery Workflow

```bash
# 1. Search for relevant blocks/components
mcp__shadcn__search_items_in_registries --query "dashboard"

# 2. View component details
mcp__shadcn__view_items_in_registries --items "@shadcn/button"

# 3. Get usage examples
mcp__shadcn__get_item_examples_from_registries --query "button-demo"

# 4. Install component
npx shadcn@latest add button
```

### Correct Usage Patterns

```typescript
// ✅ CORRECT: Using shadcn Card structure
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

export function FeedCard({ feed }: { feed: Feed }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{feed.name}</CardTitle>
        <CardDescription>{feed.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Content here */}
      </CardContent>
      <CardFooter>
        <Button>Subscribe</Button>
      </CardFooter>
    </Card>
  )
}

// ❌ WRONG: Custom card implementation
export function FeedCard({ feed }: { feed: Feed }) {
  return (
    <div className="custom-card bg-white rounded-lg shadow-md">
      {/* Don't create custom components! */}
    </div>
  )
}
```

### Color Standards

```typescript
// ✅ CORRECT: Using CSS variables from globals.css
<div className="bg-background text-foreground border border-border">
<Button className="bg-primary text-primary-foreground">Submit</Button>

// ❌ WRONG: Hardcoded colors
<div className="bg-white text-black border-gray-300">
<Button className="bg-blue-500 text-white">Submit</Button>
```

---

## 4. API Integration Standards

### Service Layer Pattern

```typescript
// lib/api/services/feeds.service.ts
import { apiClient } from "@/lib/api/client";
import type { Feed, CreateFeedData } from "@/lib/types";

export const feedsService = {
  async getAll(): Promise<Feed[]> {
    const { data } = await apiClient.get("/feeds");
    return data;
  },

  async getById(id: string): Promise<Feed> {
    const { data } = await apiClient.get(`/feeds/${id}`);
    return data;
  },

  async create(feedData: CreateFeedData): Promise<Feed> {
    const { data } = await apiClient.post("/feeds", feedData);
    return data;
  },

  async update(id: string, feedData: Partial<CreateFeedData>): Promise<Feed> {
    const { data } = await apiClient.put(`/feeds/${id}`, feedData);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/feeds/${id}`);
  },
};
```

### Error Handling

```typescript
// ✅ CORRECT: Comprehensive error handling
import { toast } from "sonner";

async function handleSubmit(data: FormData) {
  try {
    const result = await feedsService.create(data);
    toast.success("Feed created successfully");
    return result;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || "Failed to create feed";
      toast.error(message);
    } else {
      toast.error("An unexpected error occurred");
    }
    throw error;
  }
}

// ❌ WRONG: Generic error handling
async function handleSubmit(data: FormData) {
  try {
    return await feedsService.create(data);
  } catch (error) {
    console.log("Error:", error); // Not user-friendly
  }
}
```

### Environment Variables

```typescript
// ✅ CORRECT: Use NEXT_PUBLIC_API_URL
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// ❌ WRONG: Hardcoded API URLs
const apiUrl = "https://localhost:8000";
```

---

## 5. Form Handling Standards

### React Hook Form + Zod Pattern

```typescript
// ✅ CORRECT: Complete form implementation
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const feedSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string(),
})

type FeedFormData = z.infer<typeof feedSchema>

export function CreateFeedForm() {
  const form = useForm<FeedFormData>({
    resolver: zodResolver(feedSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
    },
  })

  const onSubmit = async (data: FeedFormData) => {
    try {
      await feedsService.create(data)
      toast.success('Feed created')
      form.reset()
    } catch (error) {
      toast.error('Failed to create feed')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Feed Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter feed name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Creating...' : 'Create Feed'}
        </Button>
      </form>
    </Form>
  )
}
```

---

## 6. State Management Standards

### Zustand Store Pattern

```typescript
// lib/stores/auth-store.ts
import { create } from "zustand";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, isLoading: false }),
}));
```

---

## 7. Testing Standards

### Test Structure

```typescript
// __tests__/feed-card.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { FeedCard } from '../feed-card'

describe('FeedCard', () => {
  const mockFeed = {
    id: '1',
    name: 'Test Feed',
    description: 'Test description',
  }

  it('renders feed information', () => {
    render(<FeedCard feed={mockFeed} />)
    expect(screen.getByText('Test Feed')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('handles subscribe button click', async () => {
    const onSubscribe = jest.fn()
    render(<FeedCard feed={mockFeed} onSubscribe={onSubscribe} />)

    fireEvent.click(screen.getByText('Subscribe'))
    expect(onSubscribe).toHaveBeenCalledWith('1')
  })
})
```

### Accessibility Testing

```typescript
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

it('has no accessibility violations', async () => {
  const { container } = render(<FeedCard feed={mockFeed} />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

---

## 8. Code Organization Standards

### File Structure

```
component-folder/
├── component-name.tsx           # Main component
├── component-name.test.tsx      # Tests
├── use-component-name.ts        # Custom hooks
├── types.ts                     # Type definitions
└── utils.ts                     # Helper functions
```

### Import Order

```typescript
// 1. React & Next.js
import { useState } from "react";
import Link from "next/link";

// 2. Third-party libraries
import { z } from "zod";
import { useForm } from "react-hook-form";

// 3. Internal components
import { Button } from "@/components/ui/button";

// 4. Internal utilities
import { cn } from "@/lib/utils";
import { feedsService } from "@/lib/api/services/feeds.service";

// 5. Types
import type { Feed } from "@/lib/types";
```

---

## 9. Performance Standards

### Code Splitting

```typescript
// ✅ Use dynamic imports for heavy components
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('@/components/charts/revenue-chart'), {
  loading: () => <Skeleton className="h-[300px]" />,
  ssr: false,
})
```

### Image Optimization

```typescript
// ✅ Always use Next.js Image component
import Image from 'next/image'

<Image
  src={feed.imageUrl}
  alt={feed.name}
  width={400}
  height={300}
  className="object-cover"
/>
```

---

## 10. Accessibility Standards

### Minimum Requirements

- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Focus States**: Visible focus indicators on all focusable elements
- **ARIA Labels**: Proper labels for screen readers
- **Color Contrast**: WCAG AA compliance (4.5:1 for text)
- **Semantic HTML**: Use proper HTML elements

```typescript
// ✅ CORRECT: Accessible button
<Button
  onClick={handleClick}
  aria-label="Subscribe to feed"
  disabled={isLoading}
>
  Subscribe
</Button>

// ❌ WRONG: Non-accessible div
<div onClick={handleClick}>
  Subscribe
</div>
```

---

## 11. Validation & Quality Checks

### Pre-commit Checklist

```bash
# 1. Type checking
npm run type-check

# 2. Linting
npm run lint

# 3. Format check
npm run format

# 4. Unit tests
npm run test

# 5. Build validation
npm run build

# 6. Docker build test
docker build -t test-build .
```

### Before Marking Story Complete

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Code formatted with Prettier
- [ ] Accessibility checks pass
- [ ] Build succeeds
- [ ] Docker build succeeds
- [ ] Manual testing complete

---

## 12. Git Commit Standards

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Build process or auxiliary tool changes

### Examples

```bash
feat(feeds): add feed creation wizard

- Implement multi-step form with validation
- Add preview step before submission
- Include image upload functionality

Closes #123
```

---

## 13. Security Standards

### Authentication

```typescript
// ✅ CORRECT: httpOnly cookies for tokens
// Backend sets httpOnly cookie
// Frontend automatically sends it

// ❌ WRONG: Storing tokens in localStorage
localStorage.setItem("token", token); // NEVER DO THIS
```

### Input Validation

```typescript
// ✅ CORRECT: Always validate user input
const schema = z.object({
  url: z.string().url("Invalid URL"),
  title: z.string().min(1).max(200),
});

// Validate before sending to API
const validated = schema.parse(userInput);
```

---

## 14. Documentation Standards

### Component Documentation

````typescript
/**
 * FeedCard component displays feed information and subscription controls
 *
 * @component
 * @example
 * ```tsx
 * <FeedCard
 *   feed={feedData}
 *   onSubscribe={handleSubscribe}
 * />
 * ```
 */
export function FeedCard({ feed, onSubscribe }: FeedCardProps) {
  // Implementation
}
````

### Function Documentation

```typescript
/**
 * Validates feed data before submission
 * @param data - Raw feed data from form
 * @returns Validated feed data
 * @throws {ValidationError} If data is invalid
 */
function validateFeedData(data: unknown): FeedData {
  return feedSchema.parse(data);
}
```

---

## Summary

### Golden Rules

1. **TypeScript strict mode** - No `any`, proper types always
2. **shadcn/ui blocks first** - Never build custom UI from scratch
3. **CSS variables only** - No hardcoded colors
4. **Server Components default** - Client only when needed
5. **Comprehensive error handling** - User-friendly messages
6. **Full validation suite** - All checks must pass before completion
7. **Accessibility first** - Keyboard nav, ARIA, contrast
8. **Test everything** - Unit tests, accessibility tests, build tests

### Resources

- [Frontend README](/Users/weverson/GroDigital/smartfeed_admin_ui/docs/frontend/README.md)
- [Tech Stack Details](/Users/weverson/GroDigital/smartfeed_admin_ui/docs/architecture/tech-stack.md)
- [Project Structure](/Users/weverson/GroDigital/smartfeed_admin_ui/docs/architecture/source-tree.md)
- [API Documentation](https://localhost:8000/docs)
