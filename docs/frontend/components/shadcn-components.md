# shadcn/ui Component Mapping Guide

## Overview

This document maps SmartNews features to specific shadcn/ui components and blocks, ensuring consistent UI implementation across the application.

## Installation & Setup

### Initial Setup

```bash
# Initialize shadcn/ui in your Next.js project
npx shadcn@latest init

# Choose the following options:
# - Would you like to use TypeScript? → Yes
# - Which style would you like to use? → Default
# - Which color would you like to use as base color? → Slate
# - Where is your global CSS file? → app/globals.css
# - Would you like to use CSS variables for colors? → Yes
# - Where is your tailwind.config.js located? → tailwind.config.ts
# - Configure the import alias for components? → @/components
# - Configure the import alias for utils? → @/lib/utils
```

### Required Components

```bash
# Core components needed for SmartNews
npx shadcn@latest add alert
npx shadcn@latest add avatar
npx shadcn@latest add badge
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add checkbox
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add navigation-menu
npx shadcn@latest add progress
npx shadcn@latest add radio-group
npx shadcn@latest add select
npx shadcn@latest add separator
npx shadcn@latest add sheet
npx shadcn@latest add skeleton
npx shadcn@latest add table
npx shadcn@latest add tabs
npx shadcn@latest add textarea
npx shadcn@latest add toast
npx shadcn@latest add toggle
npx shadcn@latest add toggle-group
```

### Required Blocks

```bash
# Authentication block
npx shadcn@latest block login-02

# Dashboard block
npx shadcn@latest block dashboard-01
```

## Component Usage by Feature

### 1. Authentication Pages

#### Login Page (login-02 block)

**Location:** `app/(auth)/login/page.tsx`
**Components Used:**

- `Card` - Main container
- `Form` - Form wrapper with validation
- `Input` - Email and password fields
- `Button` - Submit button
- `Label` - Field labels
- `Checkbox` - Remember me option
- `Link` - Navigation links

**Customization:**

```typescript
// Extend the login-02 block with role selection
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

// Add role selection before the form
<RadioGroup defaultValue="subscriber">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="creator" id="creator" />
    <Label htmlFor="creator">Creator Account</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="subscriber" id="subscriber" />
    <Label htmlFor="subscriber">Subscriber Account</Label>
  </div>
</RadioGroup>
```

#### Registration Page

**Components Used:**

- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- `Form` with `react-hook-form` integration
- `Input` - Email, password, name fields
- `RadioGroup` - Role selection
- `Button` - Submit and social login buttons
- `Alert` - Error messages

### 2. Creator Dashboard (dashboard-01 block)

#### Main Dashboard

**Location:** `app/(creator)/dashboard/page.tsx`
**Base Block:** `dashboard-01`
**Components Used:**

- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` - Navigation between views
- `Card` - Metric cards and content containers
- `Table` - Recent activity and content lists
- `Avatar` - User profiles
- `Badge` - Status indicators
- `Button` - Actions
- `DropdownMenu` - More actions menu

**Key Modifications:**

```typescript
// Metric Cards Component
export function MetricCard({ title, value, change, icon }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {change} from last month
        </p>
      </CardContent>
    </Card>
  );
}
```

#### Revenue Dashboard

**Components Used:**

- `Card` - Container for charts and stats
- `Progress` - Revenue goal progress
- `Table` - Transaction history
- `Badge` - Payment status
- Charts (via Recharts, styled to match shadcn)

### 3. Content Management

#### Content Import Forms

**Components Used:**

- `Card` - Form containers
- `Input` - URL inputs
- `Textarea` - Bulk URL input
- `Select` - Source type selection
- `Button` - Add/remove/import actions
- `Progress` - Import progress indicator
- `Toast` - Success/error notifications

```typescript
// URL Import Component
<Card>
  <CardHeader>
    <CardTitle>Import Content</CardTitle>
    <CardDescription>Add content from various sources</CardDescription>
  </CardHeader>
  <CardContent>
    <Tabs defaultValue="url">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="url">URL</TabsTrigger>
        <TabsTrigger value="rss">RSS Feed</TabsTrigger>
        <TabsTrigger value="social">Social Media</TabsTrigger>
      </TabsList>
      <TabsContent value="url">
        <div className="space-y-2">
          <Input placeholder="https://example.com/article" />
          <Button className="w-full">Import URL</Button>
        </div>
      </TabsContent>
      {/* Other tab contents */}
    </Tabs>
  </CardContent>
</Card>
```

#### Feed Creation

**Components Used:**

- `Form` - Main form wrapper
- `Input` - Feed name
- `Textarea` - Feed description
- `Select` - Category selection
- `RadioGroup` - Publishing frequency
- `Dialog` - Preview modal
- `Button` - Save/publish actions

### 4. Subscriber Interface

#### Feed Discovery

**Components Used:**

- `Card` - Feed cards
- `Avatar` - Creator avatars
- `Badge` - Feed categories
- `Button` - Subscribe buttons
- `ToggleGroup` - View switcher (grid/list)
- `Sheet` - Feed preview drawer
- `Skeleton` - Loading states

```typescript
// Feed Card Component
<Card className="overflow-hidden">
  <CardHeader>
    <div className="flex items-start justify-between">
      <Avatar>
        <AvatarImage src={creator.avatar} />
        <AvatarFallback>{creator.initials}</AvatarFallback>
      </Avatar>
      <Badge>{feed.category}</Badge>
    </div>
    <CardTitle>{feed.name}</CardTitle>
    <CardDescription>{feed.description}</CardDescription>
  </CardHeader>
  <CardFooter className="flex justify-between">
    <span className="text-sm text-muted-foreground">
      {feed.subscriberCount} subscribers
    </span>
    <Button size="sm">Subscribe</Button>
  </CardFooter>
</Card>
```

#### Content Portal

**Components Used:**

- `Card` - Content cards
- `Tabs` - Filter tabs (All/Unread/Saved)
- `Button` - Action buttons
- `DropdownMenu` - More options
- `Dialog` - Full content view
- `Toggle` - Save/unsave toggle

### 5. Common Patterns

#### Forms with Validation

```typescript
// Using shadcn Form with react-hook-form and zod
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { /* ... */ }
})

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="fieldName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Label</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

#### Loading States

```typescript
// Skeleton components for loading
<Card>
  <CardHeader>
    <Skeleton className="h-4 w-[250px]" />
    <Skeleton className="h-4 w-[200px]" />
  </CardHeader>
  <CardContent>
    <Skeleton className="h-[200px] w-full" />
  </CardContent>
</Card>
```

#### Modal Dialogs

```typescript
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description</DialogDescription>
    </DialogHeader>
    {/* Dialog content */}
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### Data Tables

```typescript
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column 1</TableHead>
      <TableHead>Column 2</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map((item) => (
      <TableRow key={item.id}>
        <TableCell>{item.field1}</TableCell>
        <TableCell>{item.field2}</TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

## Theme Customization

### Color Scheme

```css
/* app/globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    /* Add custom colors for SmartNews */
    --creator: 142 76% 36%;
    --subscriber: 217 91% 60%;
  }
}
```

### Custom Variants

```typescript
// Extend button variants for role-specific styles
const buttonVariants = cva("...", {
  variants: {
    variant: {
      creator: "bg-[hsl(var(--creator))] text-white hover:bg-[hsl(var(--creator))]/90",
      subscriber: "bg-[hsl(var(--subscriber))] text-white hover:bg-[hsl(var(--subscriber))]/90",
    },
  },
});
```

## Best Practices

### 1. Component Composition

- Build complex components from shadcn primitives
- Keep custom styling minimal and consistent
- Use CSS variables for theming

### 2. Accessibility

- All shadcn components include ARIA attributes
- Maintain keyboard navigation support
- Test with screen readers

### 3. Performance

- Use dynamic imports for heavy components
- Implement skeleton loaders for all data fetching
- Optimize images with Next.js Image component

### 4. Responsive Design

- shadcn components are mobile-first
- Use responsive variants: `sm:`, `md:`, `lg:`
- Test on various screen sizes

## Component Checklist

### Essential Components for MVP

- [x] Authentication (login-02 block)
- [x] Dashboard layout (dashboard-01 block)
- [x] Forms with validation
- [x] Cards for content display
- [x] Tables for data lists
- [x] Modals and sheets
- [x] Navigation components
- [x] Loading skeletons
- [x] Toast notifications
- [x] Responsive design utilities

### Phase 2 Components

- [ ] Command palette for search
- [ ] Calendar for scheduling
- [ ] Charts for advanced analytics
- [ ] Carousel for content preview
- [ ] Pagination for large lists
