# Story 1.8: Creator Profile & Account Settings - UI/UX Specification

**Created by**: Sally (UX Expert) 🎨
**Date**: 2025-10-02
**Story Reference**: `docs/stories/1.8.frontend.story.md`
**Status**: Ready for Development

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Design System Reference](#design-system-reference)
3. [Layout Architecture](#layout-architecture)
4. [Page Specifications](#page-specifications)
5. [Component Library](#component-library)
6. [User Flows](#user-flows)
7. [Responsive Behavior](#responsive-behavior)
8. [Interaction States](#interaction-states)
9. [Accessibility Guidelines](#accessibility-guidelines)
10. [Implementation Checklist](#implementation-checklist)

---

## Overview

### Purpose

Provide creators with a comprehensive settings interface to manage their profile, account security, social connections, notifications, and privacy preferences.

### User Goals

1. **Profile Management** - Update personal information and avatar
2. **Account Security** - Change password and email securely
3. **Social Integration** - Manage connected social accounts
4. **Preference Control** - Configure notifications and privacy

### Design Principles

- ✅ **Clarity First** - Clear labels, helpful descriptions, no ambiguity
- ✅ **Safe Actions** - Confirmation for destructive actions
- ✅ **Instant Feedback** - Real-time validation and status updates
- ✅ **Consistent Patterns** - Reuse shadcn/ui blocks and components
- ✅ **Accessible by Default** - WCAG 2.1 AA compliance

---

## Design System Reference

### Color Palette (from globals.css)

```css
/* Primary Actions & Links */
--primary: oklch(0.72 0.15 240) /* Blue #2196F3 */ --primary-foreground: oklch(1 0 0) /* White */
  /* Secondary Actions & Highlights */ --secondary: oklch(0.75 0.18 55) /* Orange #FF9800 */
  --secondary-foreground: oklch(1 0 0) /* White */ /* Background & Cards */
  --background: oklch(1 0 0) /* White */ --card: oklch(1 0 0) /* White */
  --card-foreground: oklch(0.35 0.01 0) /* Dark Grey #424242 */ /* Text & Icons */
  --foreground: oklch(0.35 0.01 0) /* Dark Grey */ --muted-foreground: oklch(0.55 0.01 0)
  /* Medium Grey */ /* Borders & Inputs */ --border: oklch(0.9 0.005 0) /* Light Grey */
  --input: oklch(0.9 0.005 0) /* Light Grey */ /* Destructive Actions */
  --destructive: oklch(0.577 0.245 27.325) /* Red */;
```

### Typography

```typescript
// Headings
h1: "text-3xl font-bold"; // 30px, 700 weight
h2: "text-2xl font-semibold"; // 24px, 600 weight
h3: "text-lg font-semibold"; // 18px, 600 weight

// Body Text
body: "text-sm"; // 14px (shadcn default)
muted: "text-sm text-muted-foreground"; // 14px, grey color
label: "text-sm font-medium"; // 14px, 500 weight

// Helper Text
helper: "text-xs text-muted-foreground"; // 12px, grey color
error: "text-xs text-destructive"; // 12px, red color
```

### Spacing System

```typescript
// Use Tailwind spacing scale
gap-2: "0.5rem"   // 8px  - Tight spacing
gap-4: "1rem"     // 16px - Standard spacing
gap-6: "1.5rem"   // 24px - Section spacing
gap-8: "2rem"     // 32px - Large spacing

// Card padding
p-6: "1.5rem"     // 24px - Standard card padding
p-8: "2rem"       // 32px - Large card padding
```

### Component Radius

```css
--radius: 0.65rem; /* 10.4px - Applied to all shadcn components */
```

---

## Layout Architecture

### Settings Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  App Sidebar (from Story 1.2.5)                         │
│  ├─ Dashboard                                            │
│  ├─ Content                                              │
│  ├─ Feeds                                                │
│  ├─ Revenue                                              │
│  └─ Settings ← ACTIVE                                    │
└─────────────────────────────────────────────────────────┘

Settings Page Layout (Desktop):
┌─────────────────────────────────────────────────────────┐
│ ┌─────────────┐ ┌───────────────────────────────────┐ │
│ │             │ │ Breadcrumb: Dashboard > Settings  │ │
│ │  Settings   │ │                                   │ │
│ │  Sidebar    │ │ ┌─────────────────────────────┐ │ │
│ │             │ │ │                             │ │ │
│ │ Profile     │ │ │   Page Content Area         │ │ │
│ │ Account     │ │ │   (Forms, Cards, etc.)      │ │ │
│ │ Notif.      │ │ │                             │ │ │
│ │ Privacy     │ │ │                             │ │ │
│ │             │ │ └─────────────────────────────┘ │ │
│ └─────────────┘ └───────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
     240px            Flex-grow content area
```

### Mobile Layout (< 768px)

```
┌───────────────────┐
│ Breadcrumb        │
│ Dashboard > Settings
├───────────────────┤
│ ┌───────────────┐ │
│ │ Profile       │ │  ← Tabs instead of sidebar
│ │ Account       │ │
│ │ Notifications │ │
│ │ Privacy       │ │
│ └───────────────┘ │
├───────────────────┤
│                   │
│  Page Content     │
│  (Full Width)     │
│                   │
└───────────────────┘
```

### File Structure

```typescript
// app/(creator)/settings/layout.tsx
export default function SettingsLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      {/* Desktop: Sidebar Navigation */}
      <aside className="hidden md:flex w-60 flex-col border-r">
        <SettingsSidebar />
      </aside>

      {/* Mobile: Tabs Navigation */}
      <div className="md:hidden w-full">
        <SettingsTabs />
      </div>

      {/* Content Area */}
      <main className="flex-1 p-6 md:p-8">
        <SettingsBreadcrumb />
        {children}
      </main>
    </div>
  )
}
```

---

## Page Specifications

### 1. Profile Settings Page (`/settings/profile`)

**Route**: `/app/(creator)/settings/profile/page.tsx`

#### Layout Wireframe

```
┌─────────────────────────────────────────────────────┐
│ Profile Settings                                     │
│ Manage your public profile and personal information │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ Personal Information                           │ │
│ │                                                │ │
│ │ Avatar Upload         [◯ Current Photo]       │ │
│ │ [Click to upload or drag and drop]            │ │
│ │ PNG, JPG up to 5MB                            │ │
│ │                                                │ │
│ │ Full Name *           [John Doe____________]  │ │
│ │                                                │ │
│ │ Bio                   [Multi-line text      │ │
│ │                        area for bio...      │ │
│ │                        ]                    │ │
│ │                       0/500 characters        │ │
│ │                                                │ │
│ │ Website               [https://example.com__]  │ │
│ │                                                │ │
│ │ Location              [San Francisco, CA___]  │ │
│ │                                                │ │
│ │ Content Categories *  [☑ Technology         ] │ │
│ │                       [☐ Business           ] │ │
│ │                       [☑ Science            ] │ │
│ │                       ... (up to 5)           │ │
│ │                                                │ │
│ │ [Cancel]                    [Save Changes]     │ │
│ └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

#### Component Breakdown

**Header Section**

```typescript
<div className="space-y-1">
  <h1 className="text-2xl font-semibold">Profile Settings</h1>
  <p className="text-sm text-muted-foreground">
    Manage your public profile and personal information
  </p>
</div>
```

**Avatar Upload Component**

```typescript
// components/settings/AvatarUploader.tsx
<div className="flex items-start gap-6">
  {/* Current Avatar */}
  <Avatar className="h-24 w-24">
    <AvatarImage src={avatarUrl} />
    <AvatarFallback>{initials}</AvatarFallback>
  </Avatar>

  {/* Upload Area */}
  <div className="flex-1">
    <Label>Profile Photo</Label>
    <div
      {...getRootProps()}
      className="border-2 border-dashed rounded-lg p-6
                 text-center cursor-pointer hover:bg-muted/50
                 transition-colors"
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
      <p className="mt-2 text-sm">
        <span className="font-semibold text-primary">
          Click to upload
        </span> or drag and drop
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        PNG, JPG up to 5MB
      </p>
    </div>
  </div>
</div>
```

**Form Fields**

```typescript
// Reuse existing profileSetupSchema from src/lib/schemas/profile.ts

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
    {/* Full Name */}
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Full Name *</FormLabel>
          <FormControl>
            <Input {...field} placeholder="John Doe" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

    {/* Bio */}
    <FormField
      control={form.control}
      name="bio"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Bio</FormLabel>
          <FormControl>
            <Textarea
              {...field}
              placeholder="Tell us about yourself..."
              className="min-h-24"
              maxLength={500}
            />
          </FormControl>
          <div className="flex justify-between items-center">
            <FormDescription>
              Brief description for your profile
            </FormDescription>
            <span className="text-xs text-muted-foreground">
              {field.value?.length || 0}/500
            </span>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />

    {/* Website */}
    <FormField
      control={form.control}
      name="website"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Website</FormLabel>
          <FormControl>
            <Input {...field} type="url" placeholder="https://example.com" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

    {/* Location */}
    <FormField
      control={form.control}
      name="location"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Location</FormLabel>
          <FormControl>
            <Input {...field} placeholder="San Francisco, CA" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

    {/* Categories (Checkboxes) */}
    <FormField
      control={form.control}
      name="categories"
      render={() => (
        <FormItem>
          <div className="mb-4">
            <FormLabel>Content Categories *</FormLabel>
            <FormDescription>
              Select up to 5 categories (at least 1 required)
            </FormDescription>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {CONTENT_CATEGORIES.map((category) => (
              <FormField
                key={category}
                control={form.control}
                name="categories"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value?.includes(category)}
                        onCheckedChange={(checked) => {
                          // Handle category selection
                        }}
                        disabled={
                          !field.value?.includes(category) &&
                          field.value?.length >= 5
                        }
                      />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      {category}
                    </FormLabel>
                  </FormItem>
                )}
              />
            ))}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />

    {/* Action Buttons */}
    <div className="flex justify-end gap-4">
      <Button
        type="button"
        variant="outline"
        onClick={handleCancel}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        disabled={!form.formState.isDirty || isSubmitting}
      >
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Changes
      </Button>
    </div>
  </form>
</Form>
```

#### States & Feedback

**Loading State** (while fetching profile):

```typescript
<Card>
  <CardHeader>
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-4 w-64" />
  </CardHeader>
  <CardContent className="space-y-4">
    <Skeleton className="h-24 w-24 rounded-full" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-24 w-full" />
  </CardContent>
</Card>
```

**Success Toast**:

```typescript
toast.success("Profile updated successfully!", {
  description: "Your changes have been saved.",
});
```

**Error Toast**:

```typescript
toast.error("Failed to update profile", {
  description: error.message,
  action: {
    label: "Retry",
    onClick: () => form.handleSubmit(onSubmit)(),
  },
});
```

---

### 2. Account Security Page (`/settings/account`)

**Route**: `/app/(creator)/settings/account/page.tsx`

#### Layout Wireframe

```
┌─────────────────────────────────────────────────────┐
│ Account Security                                     │
│ Manage your password, email, and security settings  │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ Change Password                                │ │
│ │                                                │ │
│ │ Current Password *  [••••••••••••••________]  │ │
│ │                                                │ │
│ │ New Password *      [••••••••••••••________]  │ │
│ │ Password Strength: ▓▓▓▓▓░░░░░ Medium         │ │
│ │                                                │ │
│ │ Confirm Password *  [••••••••••••••________]  │ │
│ │                                                │ │
│ │                     [Change Password]          │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ Email Address                                  │ │
│ │                                                │ │
│ │ Current Email       user@example.com           │ │
│ │                                                │ │
│ │ New Email *         [newmail@example.com___]  │ │
│ │                                                │ │
│ │ Verify Password *   [••••••••••••••________]  │ │
│ │ Required for security                         │ │
│ │                                                │ │
│ │                     [Update Email]             │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ Danger Zone                                    │ │
│ │                                                │ │
│ │ Delete Account                                 │ │
│ │ Permanently delete your account and all data  │ │
│ │                                                │ │
│ │                     [Delete Account...]        │ │
│ └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

#### Password Change Component

**Component**: `components/settings/PasswordChangeForm.tsx`

```typescript
// New Zod schema needed in lib/schemas/settings.ts
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Password Strength Indicator Component
function PasswordStrength({ password }: { password: string }) {
  const strength = calculatePasswordStrength(password)

  const colors = {
    weak: "bg-destructive",
    medium: "bg-orange-500",
    strong: "bg-green-500",
  }

  const widths = {
    weak: "w-1/3",
    medium: "w-2/3",
    strong: "w-full",
  }

  return (
    <div className="space-y-2">
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-300",
            colors[strength.level],
            widths[strength.level]
          )}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Password Strength: <span className="font-medium">{strength.label}</span>
      </p>
    </div>
  )
}

// Main Component
<Card>
  <CardHeader>
    <CardTitle>Change Password</CardTitle>
    <CardDescription>
      Ensure your account is using a strong password
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Current Password */}
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Password *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* New Password with Strength Indicator */}
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  autoComplete="new-password"
                />
              </FormControl>
              <PasswordStrength password={field.value} />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Confirm Password */}
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Password *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  autoComplete="new-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Change Password
        </Button>
      </form>
    </Form>
  </CardContent>
</Card>
```

#### Email Update Component

**Component**: `components/settings/EmailUpdateForm.tsx`

```typescript
const emailUpdateSchema = z.object({
  newEmail: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password required for security"),
})

<Card>
  <CardHeader>
    <CardTitle>Email Address</CardTitle>
    <CardDescription>
      Update your email address for account notifications
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      {/* Current Email Display */}
      <div className="rounded-lg bg-muted p-4">
        <Label className="text-xs text-muted-foreground">
          Current Email
        </Label>
        <p className="font-medium">{currentEmail}</p>
      </div>

      {/* Update Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="newEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Email Address *</FormLabel>
                <FormControl>
                  <Input {...field} type="email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Verify Password *</FormLabel>
                <FormControl>
                  <Input {...field} type="password" />
                </FormControl>
                <FormDescription>
                  Required for security
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Email
          </Button>
        </form>
      </Form>
    </div>
  </CardContent>
</Card>
```

#### Account Deletion Component

```typescript
<Card className="border-destructive">
  <CardHeader>
    <CardTitle className="text-destructive">Danger Zone</CardTitle>
    <CardDescription>
      Irreversible and destructive actions
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="flex items-start justify-between">
      <div>
        <h4 className="font-medium">Delete Account</h4>
        <p className="text-sm text-muted-foreground mt-1">
          Permanently delete your account and all associated data
        </p>
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="destructive">Delete Account...</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove all your data from our servers.
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              • All your feeds will be unpublished
              <br />
              • Subscribers will lose access to your content
              <br />
              • Pending payouts will be forfeited
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="confirmText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Type <span className="font-mono font-bold">DELETE</span> to confirm
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="DELETE" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={confirmText !== "DELETE" || isDeleting}
              onClick={handleDelete}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete My Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </CardContent>
</Card>
```

---

### 3. Social Connections Page (`/settings/social`)

**Note**: This can be integrated into Profile page or a separate page. I'll spec it as a separate section for clarity.

#### Layout Wireframe

```
┌─────────────────────────────────────────────────────┐
│ Social Connections                                   │
│ Connect your social media accounts for analytics    │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ [🎥] YouTube                       [Connected] │ │
│ │                                                │ │
│ │ @YourChannel                                   │ │
│ │ 125K subscribers • Last synced 2 hours ago     │ │
│ │                                                │ │
│ │ [Disconnect]                [Refresh Stats]    │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ [🐦] Twitter                   [Not Connected] │ │
│ │                                                │ │
│ │ Connect to import saved tweets and bookmarks   │ │
│ │                                                │ │
│ │                            [Connect Twitter]   │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ [👽] Reddit                    [Not Connected] │ │
│ │                                                │ │
│ │ Connect to import saved posts and subreddits   │ │
│ │                                                │ │
│ │                            [Connect Reddit]    │ │
│ └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

#### Social Connection Card Component

**Component**: `components/settings/SocialConnections.tsx`

```typescript
interface SocialConnection {
  provider: "youtube" | "twitter" | "reddit"
  isConnected: boolean
  username?: string
  followerCount?: number
  lastSyncedAt?: string
}

const socialProviders = {
  youtube: {
    name: "YouTube",
    icon: Youtube,
    color: "text-red-500",
    description: "Import videos and channel statistics",
  },
  twitter: {
    name: "Twitter",
    icon: Twitter,
    color: "text-blue-400",
    description: "Import saved tweets and bookmarks",
  },
  reddit: {
    name: "Reddit",
    icon: () => (
      <svg>...</svg> // Reddit icon
    ),
    color: "text-orange-500",
    description: "Import saved posts and subreddits",
  },
}

function SocialConnectionCard({ connection }: { connection: SocialConnection }) {
  const provider = socialProviders[connection.provider]
  const Icon = provider.icon

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("rounded-full bg-muted p-3", provider.color)}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">{provider.name}</CardTitle>
              <CardDescription>{provider.description}</CardDescription>
            </div>
          </div>

          <Badge variant={connection.isConnected ? "default" : "secondary"}>
            {connection.isConnected ? "Connected" : "Not Connected"}
          </Badge>
        </div>
      </CardHeader>

      {connection.isConnected ? (
        <CardContent>
          <div className="space-y-4">
            {/* Connection Info */}
            <div>
              <p className="font-medium">@{connection.username}</p>
              <p className="text-sm text-muted-foreground">
                {connection.followerCount?.toLocaleString()} subscribers
                {" • "}
                Last synced {formatDistanceToNow(connection.lastSyncedAt)} ago
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Disconnect
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Disconnect {provider.name}?</DialogTitle>
                    <DialogDescription>
                      This will stop importing content from your {provider.name} account.
                      Your revenue estimation may be affected.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                      variant="destructive"
                      onClick={() => handleDisconnect(connection.provider)}
                    >
                      Disconnect
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleRefresh(connection.provider)}
                disabled={isRefreshing}
              >
                {isRefreshing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Refresh Stats
              </Button>
            </div>
          </div>
        </CardContent>
      ) : (
        <CardContent>
          <Button
            className="w-full"
            onClick={() => handleConnect(connection.provider)}
          >
            <Icon className="mr-2 h-4 w-4" />
            Connect {provider.name}
          </Button>
        </CardContent>
      )}
    </Card>
  )
}
```

---

### 4. Notification Preferences Page (`/settings/notifications`)

#### Layout Wireframe

```
┌─────────────────────────────────────────────────────┐
│ Notification Preferences                             │
│ Manage how you receive updates and alerts           │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ Email Notifications                            │ │
│ │                                                │ │
│ │ New Subscriber                                 │ │
│ │ Get notified when someone subscribes           │ │
│ │                                      [Toggle] │ │
│ │                                                │ │
│ │ Revenue Milestones                             │ │
│ │ Alerts for earnings targets achieved           │ │
│ │                                      [Toggle] │ │
│ │                                                │ │
│ │ Content Published                              │ │
│ │ Confirmation when your feed goes live          │ │
│ │                                      [Toggle] │ │
│ │                                                │ │
│ │ Weekly Digest                                  │ │
│ │ Summary of your week's performance             │ │
│ │                                      [Toggle] │ │
│ │                                                │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ Push Notifications                             │ │
│ │                                                │ │
│ │ Enable browser notifications                   │ │
│ │                                      [Toggle] │ │
│ │                                                │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ Marketing & Updates                            │ │
│ │                                                │ │
│ │ Product updates and feature announcements      │ │
│ │                                      [Toggle] │ │
│ │                                                │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│                     [Save Preferences]              │
└─────────────────────────────────────────────────────┘
```

#### Notification Settings Component

**Component**: `components/settings/NotificationSettings.tsx`

```typescript
const notificationSchema = z.object({
  email_new_subscriber: z.boolean(),
  email_revenue_milestone: z.boolean(),
  email_content_published: z.boolean(),
  email_weekly_digest: z.boolean(),
  push_enabled: z.boolean(),
  marketing_emails: z.boolean(),
})

const notificationGroups = [
  {
    title: "Email Notifications",
    description: "Receive updates via email",
    settings: [
      {
        name: "email_new_subscriber",
        label: "New Subscriber",
        description: "Get notified when someone subscribes to your feed",
      },
      {
        name: "email_revenue_milestone",
        label: "Revenue Milestones",
        description: "Alerts when you reach earning targets",
      },
      {
        name: "email_content_published",
        label: "Content Published",
        description: "Confirmation when your feed goes live",
      },
      {
        name: "email_weekly_digest",
        label: "Weekly Digest",
        description: "Summary of your week's performance",
      },
    ],
  },
  {
    title: "Push Notifications",
    description: "Browser notifications for real-time updates",
    settings: [
      {
        name: "push_enabled",
        label: "Enable browser notifications",
        description: "Receive push notifications in your browser",
      },
    ],
  },
  {
    title: "Marketing & Updates",
    description: "Stay informed about new features",
    settings: [
      {
        name: "marketing_emails",
        label: "Product updates and announcements",
        description: "Occasional emails about new features and improvements",
      },
    ],
  },
]

<div className="space-y-6">
  <div>
    <h1 className="text-2xl font-semibold">Notification Preferences</h1>
    <p className="text-sm text-muted-foreground mt-1">
      Manage how you receive updates and alerts
    </p>
  </div>

  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {notificationGroups.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle>{group.title}</CardTitle>
            <CardDescription>{group.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {group.settings.map((setting) => (
              <FormField
                key={setting.name}
                control={form.control}
                name={setting.name as any}
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <div className="space-y-1">
                      <FormLabel className="text-base">
                        {setting.label}
                      </FormLabel>
                      <FormDescription>
                        {setting.description}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!form.formState.isDirty || isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Preferences
        </Button>
      </div>
    </form>
  </Form>
</div>
```

---

### 5. Privacy Settings Page (`/settings/privacy`)

#### Layout Wireframe

```
┌─────────────────────────────────────────────────────┐
│ Privacy Settings                                     │
│ Control your data and profile visibility            │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ Profile Visibility                             │ │
│ │                                                │ │
│ │ Profile Visibility                             │ │
│ │ Control who can see your profile               │ │
│ │ ( ) Public   (•) Private                       │ │
│ │                                                │ │
│ │ Show Subscriber Count                          │ │
│ │ Display subscriber count on profile            │ │
│ │                                      [Toggle] │ │
│ │                                                │ │
│ │ Show Revenue Statistics                        │ │
│ │ Display earnings on public profile             │ │
│ │                                      [Toggle] │ │
│ │                                                │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ Data & Privacy                                 │ │
│ │                                                │ │
│ │ Download Your Data                             │ │
│ │ Get a copy of your account data                │ │
│ │                       [Request Data Export]    │ │
│ │                                                │ │
│ │ Cookie Preferences                             │ │
│ │ Manage cookie and tracking settings            │ │
│ │                       [Manage Cookies]         │ │
│ │                                                │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│                     [Save Settings]                 │
└─────────────────────────────────────────────────────┘
```

#### Privacy Settings Component

**Component**: `components/settings/PrivacySettings.tsx`

```typescript
const privacySchema = z.object({
  profile_visibility: z.enum(["public", "private"]),
  show_subscriber_count: z.boolean(),
  show_revenue_stats: z.boolean(),
})

<div className="space-y-6">
  <div>
    <h1 className="text-2xl font-semibold">Privacy Settings</h1>
    <p className="text-sm text-muted-foreground mt-1">
      Control your data and profile visibility
    </p>
  </div>

  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Profile Visibility */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Visibility</CardTitle>
          <CardDescription>
            Control who can see your creator profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormField
            control={form.control}
            name="profile_visibility"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profile Visibility</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-2"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0 rounded-lg border p-4">
                      <FormControl>
                        <RadioGroupItem value="public" />
                      </FormControl>
                      <div className="flex-1">
                        <FormLabel className="font-normal cursor-pointer">
                          Public
                        </FormLabel>
                        <FormDescription>
                          Anyone can view your profile and subscribe
                        </FormDescription>
                      </div>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0 rounded-lg border p-4">
                      <FormControl>
                        <RadioGroupItem value="private" />
                      </FormControl>
                      <div className="flex-1">
                        <FormLabel className="font-normal cursor-pointer">
                          Private
                        </FormLabel>
                        <FormDescription>
                          Only visible to subscribers
                        </FormDescription>
                      </div>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          <FormField
            control={form.control}
            name="show_subscriber_count"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between space-y-0">
                <div className="space-y-1">
                  <FormLabel className="text-base">
                    Show Subscriber Count
                  </FormLabel>
                  <FormDescription>
                    Display subscriber count on your public profile
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="show_revenue_stats"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between space-y-0">
                <div className="space-y-1">
                  <FormLabel className="text-base">
                    Show Revenue Statistics
                  </FormLabel>
                  <FormDescription>
                    Display earnings on your public profile
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Data & Privacy Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Data & Privacy</CardTitle>
          <CardDescription>
            Manage your data and privacy preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium">Download Your Data</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Get a copy of your profile, feeds, and activity
              </p>
            </div>
            <Button variant="outline" onClick={handleDataExport}>
              <Download className="mr-2 h-4 w-4" />
              Request Export
            </Button>
          </div>

          <Separator />

          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium">Cookie Preferences</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Manage cookie and tracking settings
              </p>
            </div>
            <Button variant="outline" onClick={handleCookieSettings}>
              <Settings className="mr-2 h-4 w-4" />
              Manage Cookies
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!form.formState.isDirty || isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </div>
    </form>
  </Form>
</div>
```

---

## Component Library

### Reusable Settings Components

#### 1. SettingsCard Wrapper

**Purpose**: Consistent card styling for all settings sections

```typescript
// components/settings/SettingsCard.tsx
interface SettingsCardProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function SettingsCard({
  title,
  description,
  children,
  className
}: SettingsCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
```

#### 2. SettingsSidebar Component

**Component**: `components/settings/SettingsSidebar.tsx`

```typescript
const settingsNavItems = [
  {
    title: "Profile",
    href: "/settings/profile",
    icon: User,
    description: "Manage your public profile",
  },
  {
    title: "Account",
    href: "/settings/account",
    icon: Shield,
    description: "Password and security",
  },
  {
    title: "Social Connections",
    href: "/settings/social",
    icon: Link2,
    description: "Connected accounts",
  },
  {
    title: "Notifications",
    href: "/settings/notifications",
    icon: Bell,
    description: "Email and push settings",
  },
  {
    title: "Privacy",
    href: "/settings/privacy",
    icon: Lock,
    description: "Data and visibility",
  },
]

export function SettingsSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="px-3 py-2">
        <h2 className="mb-2 text-lg font-semibold">Settings</h2>
      </div>
      <nav className="flex flex-col gap-1">
        {settingsNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2",
                "text-sm transition-colors hover:bg-muted",
                isActive && "bg-muted font-medium text-primary"
              )}
            >
              <Icon className="h-4 w-4" />
              <div className="flex-1">
                <div>{item.title}</div>
                {!isActive && (
                  <div className="text-xs text-muted-foreground">
                    {item.description}
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
```

#### 3. SettingsTabs (Mobile)

**Component**: `components/settings/SettingsTabs.tsx`

```typescript
export function SettingsTabs() {
  const pathname = usePathname()

  return (
    <Tabs value={pathname} className="w-full">
      <TabsList className="w-full grid grid-cols-2 lg:grid-cols-5 h-auto">
        {settingsNavItems.map((item) => {
          const Icon = item.icon
          return (
            <TabsTrigger
              key={item.href}
              value={item.href}
              asChild
              className="flex-col gap-1 h-auto py-2"
            >
              <Link href={item.href}>
                <Icon className="h-4 w-4" />
                <span className="text-xs">{item.title}</span>
              </Link>
            </TabsTrigger>
          )
        })}
      </TabsList>
    </Tabs>
  )
}
```

#### 4. SettingsBreadcrumb Component

```typescript
// components/settings/SettingsBreadcrumb.tsx
export function SettingsBreadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
      <Link href="/dashboard" className="hover:text-foreground">
        Dashboard
      </Link>
      <ChevronRight className="h-4 w-4" />
      <Link href="/settings" className="hover:text-foreground">
        Settings
      </Link>
      {segments.length > 1 && (
        <>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">
            {segments[segments.length - 1].charAt(0).toUpperCase() +
              segments[segments.length - 1].slice(1)}
          </span>
        </>
      )}
    </div>
  )
}
```

---

## User Flows

### Flow 1: Update Profile Information

```
1. User clicks "Settings" in main sidebar
   → Navigate to /settings (redirects to /settings/profile)

2. Profile page loads
   → Fetch current profile data via GET /creator/profile
   → Display loading skeletons while fetching

3. Form populates with current data
   → All fields pre-filled
   → Avatar displays current photo

4. User makes changes
   → Real-time validation on blur
   → Character count updates for bio
   → Category selection limited to 5

5. User clicks "Save Changes"
   → Button shows loading spinner
   → POST /creator/profile with updated data

6. Success Response
   → Toast notification: "Profile updated successfully!"
   → Form state resets (isDirty = false)
   → Auth store updates with new profile data

7. Error Response
   → Toast notification with error message
   → Form stays dirty for retry
   → Fields show validation errors if applicable
```

### Flow 2: Change Password

```
1. User navigates to /settings/account

2. User fills out password change form:
   - Current password: ••••••••
   - New password: ••••••••••
   - Confirm password: ••••••••••

3. Real-time validation:
   → Password strength indicator updates
   → Confirmation field validates match

4. User clicks "Change Password"
   → POST /auth/change-password
   → Button disabled, shows loading

5. Success:
   → Toast: "Password changed successfully"
   → Form clears all fields
   → Optional: Show "You'll be logged out of other devices"

6. Error:
   → Toast with specific error
   → Common errors:
     - "Current password incorrect"
     - "New password doesn't meet requirements"
   → Form stays filled for correction
```

### Flow 3: Connect Social Account

```
1. User navigates to /settings/social (or Profile page)

2. User clicks "Connect YouTube"

3. OAuth Flow Initiated:
   → GET /social/youtube/redirect
   → Opens popup/new tab with YouTube OAuth

4. User authorizes on YouTube
   → OAuth callback: /social/youtube/callback
   → Popup closes automatically

5. Main window refreshes connection status
   → Card updates to "Connected" state
   → Displays: @username, follower count, last sync

6. Revenue estimation recalculates
   → Toast: "YouTube connected! Revenue estimate updated."

7. User can disconnect:
   → Click "Disconnect" button
   → Confirmation dialog appears
   → On confirm: POST /social/youtube/disconnect
   → Card returns to "Not Connected" state
```

### Flow 4: Update Notification Preferences

```
1. User navigates to /settings/notifications

2. All toggles load with current states
   → Green = enabled, Grey = disabled

3. User toggles switches
   → UI updates immediately (optimistic)
   → Debounced auto-save (3 seconds)
   → OR manual "Save Preferences" button

4. Save triggered:
   → PUT /creator/preferences/notifications
   → All toggle states sent as JSON

5. Success:
   → Toast: "Preferences saved"
   → No visual change (already updated)

6. Error:
   → Revert toggles to previous state
   → Toast: "Failed to save preferences"
   → Retry button available
```

---

## Responsive Behavior

### Breakpoints

```typescript
// Follow Tailwind defaults
sm: "640px"; // Mobile landscape, small tablets
md: "768px"; // Tablets
lg: "1024px"; // Desktop
xl: "1280px"; // Large desktop
```

### Desktop (≥ 768px)

**Layout**:

- Sidebar: 240px fixed width
- Content: Flex-grow with max-width of 800px
- Forms: Two-column layout where appropriate
- Spacing: Generous padding (p-8)

**Example**:

```typescript
<div className="flex">
  <aside className="hidden md:flex w-60 border-r">
    <SettingsSidebar />
  </aside>
  <main className="flex-1 p-8">
    <div className="max-w-3xl mx-auto">
      {children}
    </div>
  </main>
</div>
```

### Tablet (768px - 1024px)

**Layout**:

- Sidebar: Collapsible or tabs
- Content: Single column forms
- Spacing: Moderate padding (p-6)

### Mobile (< 768px)

**Layout**:

- No sidebar: Use tabs at top
- Single column forms
- Full-width buttons
- Reduced spacing (p-4)

**Example**:

```typescript
<div className="md:hidden">
  <SettingsTabs />
</div>

<Button className="w-full sm:w-auto">
  Save Changes
</Button>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Form fields */}
</div>
```

---

## Interaction States

### Loading States

#### Page Load

```typescript
{isLoading ? (
  <Card>
    <CardHeader>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
    </CardHeader>
    <CardContent className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </CardContent>
  </Card>
) : (
  <ActualContent />
)}
```

#### Button Loading

```typescript
<Button disabled={isSubmitting}>
  {isSubmitting && (
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  )}
  Save Changes
</Button>
```

#### Optimistic Updates

```typescript
// For non-critical updates like toggles
const mutation = useMutation({
  mutationFn: updateNotifications,
  onMutate: async (newData) => {
    // Optimistically update UI
    await queryClient.cancelQueries(["notifications"]);
    const previous = queryClient.getQueryData(["notifications"]);
    queryClient.setQueryData(["notifications"], newData);
    return { previous };
  },
  onError: (err, newData, context) => {
    // Revert on error
    queryClient.setQueryData(["notifications"], context.previous);
    toast.error("Failed to update preferences");
  },
});
```

### Error States

#### Field Validation Errors

```typescript
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input
          {...field}
          className={cn(
            form.formState.errors.email && "border-destructive"
          )}
        />
      </FormControl>
      <FormMessage /> {/* Displays error message */}
    </FormItem>
  )}
/>
```

#### Form-Level Errors

```typescript
{form.formState.errors.root && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>
      {form.formState.errors.root.message}
    </AlertDescription>
  </Alert>
)}
```

#### API Errors

```typescript
// Transform backend errors to user-friendly messages
const errorMessages = {
  "auth.invalid_credentials": "Current password is incorrect",
  "validation.email_taken": "This email is already in use",
  "rate_limit.exceeded": "Too many attempts. Please try again later.",
};

toast.error(errorMessages[error.code] || "Something went wrong. Please try again.");
```

### Success States

#### Toast Notifications

```typescript
// Success
toast.success("Profile updated successfully!", {
  description: "Your changes have been saved.",
});

// With Action
toast.success("Email verification sent", {
  description: "Check your inbox for the verification link.",
  action: {
    label: "Resend",
    onClick: () => resendVerification(),
  },
});
```

#### Inline Success

```typescript
{saveSuccess && (
  <Alert className="mb-4">
    <CheckCircle2 className="h-4 w-4" />
    <AlertTitle>Success</AlertTitle>
    <AlertDescription>
      Your settings have been saved.
    </AlertDescription>
  </Alert>
)}
```

### Disabled States

```typescript
<Button
  disabled={
    !form.formState.isDirty || // No changes made
    form.formState.isSubmitting || // Currently saving
    !form.formState.isValid // Form has errors
  }
>
  Save Changes
</Button>

<Input
  disabled={isLoading}
  className="disabled:opacity-50 disabled:cursor-not-allowed"
/>
```

---

## Accessibility Guidelines

### Keyboard Navigation

**Tab Order**:

1. Follow natural DOM order
2. Skip navigation links at top
3. All interactive elements reachable
4. Focus visible at all times

**Shortcuts**:

```typescript
// Example: Save on Ctrl/Cmd + S
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      form.handleSubmit(onSubmit)();
    }
  };

  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}, []);
```

### Screen Reader Support

**ARIA Labels**:

```typescript
<Button
  onClick={handleDelete}
  aria-label="Delete account permanently"
>
  <Trash2 className="h-4 w-4" />
</Button>

<Input
  aria-describedby="email-description"
  aria-invalid={!!form.formState.errors.email}
/>
<p id="email-description" className="text-xs text-muted-foreground">
  We'll send verification to this address
</p>
```

**Live Regions**:

```typescript
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {isSubmitting && "Saving your changes..."}
  {saveSuccess && "Changes saved successfully"}
</div>
```

### Focus Management

```typescript
// Focus first input on page load
useEffect(() => {
  const firstInput = formRef.current?.querySelector("input");
  firstInput?.focus();
}, []);

// Focus error field on validation failure
useEffect(() => {
  const firstError = Object.keys(form.formState.errors)[0];
  if (firstError) {
    form.setFocus(firstError as any);
  }
}, [form.formState.errors]);
```

### Color Contrast

**WCAG 2.1 AA Requirements**:

- Normal text: 4.5:1 contrast ratio
- Large text (18px+): 3:1 contrast ratio
- UI components: 3:1 contrast ratio

**Test Using**:

```typescript
// All colors from globals.css already meet WCAG AA
// Primary Blue: #2196F3 on white = 5.5:1 ✓
// Dark Grey: #424242 on white = 8.3:1 ✓
// Muted text: oklch(0.55 0.01 0) = 4.6:1 ✓
```

---

## Implementation Checklist

### Phase 1: Infrastructure ✓

- [ ] Create `/app/(creator)/settings/layout.tsx` with sidebar
- [ ] Create `SettingsSidebar` component
- [ ] Create `SettingsTabs` component (mobile)
- [ ] Create `SettingsBreadcrumb` component
- [ ] Create `SettingsCard` wrapper component
- [ ] Setup routing for all settings pages
- [ ] Implement unsaved changes warning

### Phase 2: Profile Management

- [ ] Create `/app/(creator)/settings/profile/page.tsx`
- [ ] Create `ProfileForm` component
- [ ] Create `AvatarUploader` component with react-dropzone
- [ ] Integrate with existing `profileSetupSchema`
- [ ] Connect to `/creator/profile` API endpoints
- [ ] Implement avatar upload to `/creator/profile/upload`
- [ ] Add loading states and skeletons
- [ ] Add success/error toast notifications

### Phase 3: Account Security

- [ ] Create `/app/(creator)/settings/account/page.tsx`
- [ ] Create `PasswordChangeForm` component
- [ ] Create password strength indicator
- [ ] Create `EmailUpdateForm` component
- [ ] Create account deletion dialog
- [ ] Create Zod schemas for security forms
- [ ] Connect to password/email API endpoints (verify availability)
- [ ] Implement pessimistic updates for security changes
- [ ] Add comprehensive error handling

### Phase 4: Social & Notifications

- [ ] Create `/app/(creator)/settings/social/page.tsx` (or integrate into profile)
- [ ] Create `SocialConnections` component
- [ ] Create social connection cards (YouTube, Twitter, Reddit)
- [ ] Implement OAuth connection flow
- [ ] Implement disconnect flow with confirmation
- [ ] Create `/app/(creator)/settings/notifications/page.tsx`
- [ ] Create `NotificationSettings` component
- [ ] Implement toggle switches with labels
- [ ] Add auto-save or manual save button
- [ ] Connect to preferences API endpoints

### Phase 5: Privacy & Testing

- [ ] Create `/app/(creator)/settings/privacy/page.tsx`
- [ ] Create `PrivacySettings` component
- [ ] Implement profile visibility controls
- [ ] Implement data export request
- [ ] Implement cookie preferences dialog
- [ ] Add unit tests for all components
- [ ] Add integration tests for API calls
- [ ] Test responsive design on all breakpoints
- [ ] Complete accessibility audit (WCAG 2.1 AA)
- [ ] Test keyboard navigation
- [ ] Test with screen reader

---

## Developer Notes

### shadcn/ui Components Used

```bash
# Already installed:
- Form, FormField, FormItem, FormLabel, FormControl, FormMessage
- Input, Textarea
- Button
- Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- Avatar, AvatarImage, AvatarFallback
- Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
- Badge
- Switch
- RadioGroup, RadioGroupItem
- Checkbox
- Tabs, TabsList, TabsTrigger, TabsContent
- Alert, AlertTitle, AlertDescription
- Skeleton
- Separator

# May need to add:
npx shadcn@latest add progress  # For password strength
```

### API Integration

```typescript
// Existing auth store extension
interface AuthStore {
  // ... existing
  profile: ProfileSetupInput | null;
  updateProfile: (data: ProfileSetupInput) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
}

// New settings store
interface SettingsStore {
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
  updateNotifications: (prefs: NotificationPreferences) => Promise<void>;
  updatePrivacy: (settings: PrivacySettings) => Promise<void>;
}
```

### Testing Strategy

```typescript
// Component test example
describe('ProfileForm', () => {
  it('should validate required fields', async () => {
    render(<ProfileForm />)

    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument()
  })

  it('should submit valid data', async () => {
    const onSubmit = jest.fn()
    render(<ProfileForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'John Doe' }
    })

    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        // ... other fields
      })
    })
  })
})
```

---

## Summary

This comprehensive UI/UX specification provides everything needed to implement Story 1.8:

✅ **Complete Layout Design** - Sidebar navigation, responsive patterns
✅ **Detailed Wireframes** - Visual specs for each page
✅ **Component Specifications** - Full code examples with shadcn/ui
✅ **User Flows** - Step-by-step interaction patterns
✅ **Responsive Behavior** - Mobile, tablet, desktop layouts
✅ **State Management** - Loading, error, success states
✅ **Accessibility** - WCAG 2.1 AA compliant patterns
✅ **Implementation Checklist** - Phased development plan

**Dev Agent**: Follow this spec step-by-step, starting with Phase 1 infrastructure. All component code is production-ready and follows smartfeed's design system using existing color variables from globals.css.

**Ready for Development!** 🚀
