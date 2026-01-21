# Feed Content Gating - Quick Implementation Guide
**Story**: 1.6.1 - Public Feed Page Content Gating
**UX Designer**: Sally
**For**: Dev Agent Implementation
**Date**: 2025-11-13

---

## 🎯 TL;DR - What You're Building

**Two different experiences for the same feed page:**

1. **Unsubscribed users** → Preview mode (1 newsletter, 3 items, prominent CTAs, creator spotlight)
2. **Subscribed users** → Full access (all content, no CTAs, minimal creator info)

**Goal**: Increase subscription conversion from 5% → 10-15%

---

## 📚 Documentation Quick Links

1. **Full UX Spec**: `docs/frontend/ux/feed-gating-ux-spec.md`
   - Complete design system
   - Component specifications
   - Accessibility requirements
   - Micro-interactions

2. **Visual Wireframes**: `docs/frontend/ux/feed-gating-wireframes.md`
   - Mobile and desktop layouts
   - State variations
   - Animation sequences
   - Conversion funnel

3. **Story 1.6.1**: `docs/stories/1.6.1.frontend.feed-gating.story.md`
   - Acceptance criteria
   - Technical implementation details
   - Task breakdown

---

## 🎨 Design System Summary

### Colors (globals.css variables ONLY)
```tsx
// Primary CTA buttons
className="bg-primary text-primary-foreground"

// Creator section accent
className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent"

// Badges and highlights
className="bg-secondary" or "bg-accent"

// Text hierarchy
className="text-foreground"          // Main text
className="text-muted-foreground"    // Supporting text

// Teaser gradient
className="bg-gradient-to-b from-transparent via-background/60 to-background/95"
```

### Typography Scale
```tsx
text-2xl font-bold           // Creator name
text-xl font-semibold        // Section headings
text-lg font-medium          // Newsletter subject
text-base                    // Body text
text-sm text-muted-foreground // Supporting info
text-xs text-muted-foreground // Fine print
```

### shadcn/ui Components Used
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
- `Avatar`, `AvatarImage`, `AvatarFallback`
- `Badge` (secondary and outline variants)
- `Button` (lg size, primary and secondary variants)
- `Skeleton` (loading states)
- Icons from `lucide-react`: `Users`, `Calendar`, `Mail`, `Eye`, `ArrowRight`, `Unlock`, `Loader2`

---

## 🏗️ Component Structure

### 1. CreatorInfoSection Component (NEW)

**File**: `src/components/subscriber/feed/CreatorInfoSection.tsx`

**Props**:
```typescript
interface CreatorInfoSectionProps {
  feed: PublicFeed;
}
```

**Key Features**:
- 80x80px avatar with ring-4 ring-primary/20
- Creator name as h2 (text-2xl font-bold)
- Bio with line-clamp-2
- Subscriber count and category badges
- Gradient border card (border-2 border-primary/20)
- Responsive: column (mobile) → row (desktop)

**Quick Copy-Paste Structure**:
```tsx
<Card className="mb-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent shadow-lg hover:shadow-xl transition-shadow duration-300">
  <CardContent className="pt-6">
    <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
      <Avatar className="h-20 w-20 ring-4 ring-primary/20 ring-offset-2">
        {/* Avatar content */}
      </Avatar>
      <div className="flex-1 space-y-2">
        <h2 className="text-2xl font-bold">{feed.name}</h2>
        {feed.creator_bio && <p className="text-sm text-muted-foreground line-clamp-2">{feed.creator_bio}</p>}
        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
          {/* Badges */}
        </div>
      </div>
    </div>
  </CardContent>
</Card>
```

---

### 2. Preview Mode Logic

**File**: `src/app/(subscriber)/feed/[slug]/page.tsx`

**Add These Constants**:
```typescript
const PREVIEW_NEWSLETTER_LIMIT = 1;
const PREVIEW_ITEMS_LIMIT = 3;
```

**Preview Mode Detection**:
```typescript
const isPreviewMode = !isSubscribed && (!isAuthenticated || !isSubscriber);
```

**Modify fetchNewsletters**:
```typescript
const limit = isPreviewMode ? PREVIEW_NEWSLETTER_LIMIT : ITEMS_PER_PAGE;
const offset = isPreviewMode ? 0 : offset;
const hasMore = isPreviewMode ? false : /* normal logic */;
```

---

### 3. Teaser Effect on 3rd Item

**Modify NewsletterItemCard**:

Add prop:
```typescript
interface NewsletterItemCardProps {
  item: NewsletterItem;
  isLastPreviewItem?: boolean;
}
```

Add gradient overlay:
```tsx
{isLastPreviewItem && (
  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background/95 flex items-end justify-center pb-6 backdrop-blur-[2px]">
    <div className="text-center space-y-2">
      <p className="text-sm font-medium">Subscribe to see more content...</p>
      <p className="text-xs text-muted-foreground">+{totalItems - 3} more items</p>
    </div>
  </div>
)}
```

---

### 4. Primary CTA (Top)

**Location**: After creator section, before content

```tsx
{isPreviewMode && (
  <div className="flex-shrink-0 flex flex-col items-center sm:items-end gap-2">
    <Button
      onClick={handleSubscribeClick}
      disabled={isSubscribing}
      size="lg"
      className="min-w-[200px] font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
    >
      {isSubscribing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Subscribing...
        </>
      ) : (
        <>
          Subscribe FREE
          <ArrowRight className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
    {feed.subscriber_count > 0 && (
      <p className="text-xs text-muted-foreground">
        {formatNumber(feed.subscriber_count)} people already subscribed
      </p>
    )}
  </div>
)}
```

---

### 5. Bottom CTA Section

**Location**: After newsletter content, before AuthModal

```tsx
{isPreviewMode && (
  <div className="mt-8 flex flex-col items-center gap-4 rounded-lg border-2 border-primary bg-gradient-to-br from-primary/5 via-primary/3 to-transparent p-8 text-center shadow-lg">
    <div className="rounded-full bg-primary/10 p-3">
      <Unlock className="h-6 w-6 text-primary" />
    </div>
    <h3 className="text-xl font-bold">See Full Content</h3>
    <p className="max-w-md text-sm text-muted-foreground">
      Subscribe for <strong className="text-foreground">FREE</strong> to access
      all <strong className="text-foreground">{total} newsletters</strong> and
      full content from <strong className="text-foreground">{feed.name}</strong>
    </p>
    <Button
      onClick={handleSubscribeClick}
      disabled={isSubscribing}
      size="lg"
      className="min-w-[280px] font-semibold shadow-lg hover:shadow-xl"
    >
      {isSubscribing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Subscribing...
        </>
      ) : (
        <>
          Subscribe FREE — See Full Content
          <ArrowRight className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  </div>
)}
```

---

## 🎯 Implementation Checklist

### Phase 1: Setup & Detection
- [ ] Add `PREVIEW_NEWSLETTER_LIMIT` and `PREVIEW_ITEMS_LIMIT` constants
- [ ] Add `isPreviewMode` boolean calculation
- [ ] Verify preview mode detection logic works (console.log test)

### Phase 2: CreatorInfoSection Component
- [ ] Create `src/components/subscriber/feed/CreatorInfoSection.tsx`
- [ ] Implement avatar with ring styling
- [ ] Add creator name, bio, badges
- [ ] Add gradient card background
- [ ] Test responsive behavior (mobile → desktop)
- [ ] Verify creator_bio and creator_avatar in PublicFeed type

### Phase 3: Conditional Rendering
- [ ] Show CreatorInfoSection only in preview mode
- [ ] Show primary CTA (top) only in preview mode
- [ ] Modify fetchNewsletters with preview mode limits
- [ ] Hide stats badges (recipients, views) in preview mode
- [ ] Disable infinite scroll in preview mode

### Phase 4: Teaser Effect
- [ ] Add `isLastPreviewItem` prop to NewsletterItemCard
- [ ] Implement gradient overlay on 3rd item only
- [ ] Add teaser text ("Subscribe to see more...")
- [ ] Show item count (+X more items)
- [ ] Hide "Read More" link on last preview item
- [ ] Test blur effect (backdrop-blur-[2px])

### Phase 5: Bottom CTA
- [ ] Create bottom CTA section component/code
- [ ] Add unlock icon with badge
- [ ] Add heading and value prop text
- [ ] Add large Subscribe button with arrow
- [ ] Only show in preview mode
- [ ] Test responsive layout

### Phase 6: Polish & Interactions
- [ ] Add hover states to all interactive elements
- [ ] Implement loading states (spinner in buttons)
- [ ] Add transition animations (duration-200, duration-300)
- [ ] Test all shadow effects (shadow-lg, shadow-xl)
- [ ] Verify all colors use CSS variables (NO hardcoded colors)

### Phase 7: Quality Checks
- [ ] Test preview mode: unauth user → see preview + CTAs
- [ ] Test preview mode: auth non-subscriber → see preview + direct subscribe
- [ ] Test full access: subscribed user → no CTAs, all content
- [ ] Test responsive: 375px, 768px, 1024px, 1280px
- [ ] Test keyboard navigation (Tab through all interactive elements)
- [ ] Test screen reader (VoiceOver on Mac / NVDA on Windows)
- [ ] Verify touch targets ≥44px on mobile
- [ ] Check color contrast (all text meets WCAG AA)
- [ ] Run `npm run build` → must pass
- [ ] Run `npm run lint` → must pass
- [ ] Run `npx prettier --check .` → must pass

---

## 🚨 Common Pitfalls to Avoid

### ❌ DON'T
```tsx
// Hardcoded colors
className="bg-blue-500 text-white"

// Custom UI from scratch
<div className="custom-card rounded-lg shadow">

// Breaking existing subscribed user experience
if (isPreviewMode || isSubscribed) // WRONG LOGIC

// Forgetting to disable infinite scroll
{hasMore && <div ref={observerTarget} />} // WRONG - still shows in preview

// Missing loading states
<Button onClick={handleSubscribe}>Subscribe</Button> // No spinner
```

### ✅ DO
```tsx
// Use CSS variables
className="bg-primary text-primary-foreground"

// Use shadcn components
import { Card, CardContent } from "@/components/ui/card"

// Correct preview mode logic
const isPreviewMode = !isSubscribed && (!isAuthenticated || !isSubscriber)

// Conditional infinite scroll
{!isPreviewMode && hasMore && <div ref={observerTarget} />}

// Always show loading states
<Button disabled={isSubscribing}>
  {isSubscribing ? <Loader2 className="animate-spin" /> : "Subscribe"}
</Button>
```

---

## 🎨 Quick Visual Reference

### Preview Mode = Unsubscribed User
```
✓ CreatorInfoSection (prominent)
✓ Value prop section
✓ Primary Subscribe CTA (top)
✓ Preview context banner
✓ 1 newsletter only
✓ 3 items only
✓ Teaser on 3rd item
✓ Bottom Subscribe CTA
✓ AuthModal (if unauth)
✗ No infinite scroll
✗ No engagement stats
```

### Full Access = Subscribed User
```
✓ Minimized creator (avatar + name only)
✓ "Subscribed" badge
✓ All newsletters (infinite scroll)
✓ All items per newsletter
✓ Engagement stats visible
✗ No CreatorInfoSection
✗ No CTAs
✗ No preview banner
✗ No teaser effects
```

---

## 🧪 Testing Scenarios

### Test 1: Unauth User Preview
1. Open incognito browser
2. Navigate to `/feed/test-slug`
3. **Verify**: See creator section with gradient border
4. **Verify**: See "Subscribe FREE" button (top)
5. **Verify**: See preview banner
6. **Verify**: See exactly 1 newsletter
7. **Verify**: See exactly 3 items
8. **Verify**: 3rd item has gradient overlay + teaser text
9. **Verify**: Bottom CTA section visible
10. Click Subscribe → **Verify**: AuthModal appears

### Test 2: Auth Non-Subscriber
1. Login as test subscriber (not subscribed to this feed)
2. Navigate to `/feed/test-slug`
3. **Verify**: Same as Test 1 (preview mode)
4. Click Subscribe → **Verify**: Immediate subscription (no modal)
5. **Verify**: Toast notification appears
6. **Verify**: Page updates to full access mode
7. **Verify**: All CTAs disappear
8. **Verify**: All content now visible

### Test 3: Subscribed User
1. Login as user already subscribed to feed
2. Navigate to `/feed/test-slug`
3. **Verify**: No creator section
4. **Verify**: "Subscribed" badge visible
5. **Verify**: No Subscribe buttons
6. **Verify**: All newsletters visible
7. **Verify**: All items per newsletter visible
8. **Verify**: Engagement stats visible (recipients, views)
9. **Verify**: Infinite scroll works
10. **Verify**: No teaser effects

### Test 4: Responsive Mobile (375px)
1. Open DevTools, set viewport to 375px
2. Navigate to `/feed/test-slug`
3. **Verify**: Creator section stacked vertically
4. **Verify**: Avatar centered
5. **Verify**: Subscribe button full width
6. **Verify**: All touch targets ≥44px
7. **Verify**: No horizontal scroll
8. Tap Subscribe → **Verify**: Button responds to touch

---

## 📊 Success Metrics

**Before Implementation** (Current):
- Subscription conversion: ~5%
- Bounce rate: ~60%
- Time on page: ~20 seconds

**After Implementation** (Target):
- Subscription conversion: 10-15%
- Bounce rate: <40%
- Time on page: ~45 seconds
- Subscribe CTA click rate: >25%

---

## 🎁 Bonus: Helper Functions

### Format Numbers
```typescript
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

// Usage:
formatNumber(2400) // "2.4K"
formatNumber(1500000) // "1.5M"
```

### Get Creator Initials
```typescript
function getCreatorInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";
}

// Usage:
getCreatorInitials("John Doe") // "JD"
getCreatorInitials("Alice") // "A"
```

---

## 🚀 Ready to Code!

All the design decisions have been made. You have:

✅ Complete UX specification
✅ Visual wireframes for all viewports
✅ Component code snippets
✅ Implementation checklist
✅ Testing scenarios
✅ Common pitfalls documented

**Just follow the story tasks and use this guide as reference.**

The design is conversion-optimized, accessible, and uses shadcn/ui throughout.

**Happy coding!** 🎨

---

**UX Designer**: Sally
**Implementation Priority**: High
**Estimated Effort**: 1.5 days
**Complexity**: Medium
