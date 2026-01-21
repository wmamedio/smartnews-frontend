# Subscriber User Stories & Implementation Guide

## Epic: Subscriber Journey

### Story 1: Subscriber Registration & Onboarding

#### 1.1 Role Selection

**As a** new user
**I want to** select that I'm a subscriber during registration
**So that** I can access content feeds

**Implementation:**

- Same registration page as creators with role selector
- Simplified onboarding for subscribers
- Direct to feed discovery after registration

**API:** `POST /auth/register` with `role: 'subscriber'`

#### 1.2 Interest Selection

**As a** new subscriber
**I want to** select my interests during onboarding
**So that** I receive relevant feed recommendations

**Implementation:**

- Interest category selection screen
- Multi-select with visual cards
- Skip option available

**API:** `POST /subscriber/profile` with `interests` array

**UI Components:**

```typescript
// components/subscriber/interest-selector.tsx
export function InterestSelector() {
  const [selected, setSelected] = useState<string[]>([]);

  const categories = [
    { id: 'tech', name: 'Technology', icon: <Laptop />, color: 'bg-blue-500' },
    { id: 'business', name: 'Business', icon: <Briefcase />, color: 'bg-green-500' },
    { id: 'health', name: 'Health', icon: <Heart />, color: 'bg-red-500' },
    { id: 'science', name: 'Science', icon: <Beaker />, color: 'bg-purple-500' },
    // ... more categories
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>What are you interested in?</CardTitle>
        <CardDescription>
          Select topics to personalize your feed recommendations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => toggleCategory(category.id)}
              className={cn(
                "relative p-6 rounded-lg border-2 transition-all",
                selected.includes(category.id)
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-primary/50"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center mb-3",
                category.color, "bg-opacity-20"
              )}>
                {category.icon}
              </div>
              <p className="font-medium">{category.name}</p>
              {selected.includes(category.id) && (
                <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-primary" />
              )}
            </button>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={handleSkip}>Skip for now</Button>
        <Button onClick={handleContinue}>Continue</Button>
      </CardFooter>
    </Card>
  );
}
```

### Story 2: Feed Discovery

#### 2.1 Browse Feeds

**As a** subscriber
**I want to** browse available feeds
**So that** I can find content I'm interested in

**Implementation:**

- Grid/list view toggle
- Category filters
- Search functionality
- Infinite scroll or pagination

**API:** `GET /feeds` with query parameters for filtering

**UI Components:**

```typescript
// app/(subscriber)/discover/page.tsx
export default function DiscoverPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [category, setCategory] = useState<string>('all');
  const { data: feeds, isLoading } = useFeeds({ category });

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Discover Feeds</h1>
        <div className="flex items-center gap-2">
          <ToggleGroup type="single" value={view} onValueChange={setView}>
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <Grid3x3 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="flex gap-6">
        <aside className="w-64 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <CategoryFilter
                selected={category}
                onChange={setCategory}
              />
            </CardContent>
          </Card>
        </aside>

        <main className="flex-1">
          {isLoading ? (
            <FeedGridSkeleton />
          ) : view === 'grid' ? (
            <FeedGrid feeds={feeds} />
          ) : (
            <FeedList feeds={feeds} />
          )}
        </main>
      </div>
    </div>
  );
}
```

#### 2.2 Feed Preview

**As a** subscriber
**I want to** preview feed content before subscribing
**So that** I can ensure it matches my interests

**Implementation:**

- Modal or drawer with feed details
- Sample content items
- Creator information
- Subscribe button

**API:** `GET /feeds/{id}`, `GET /feed-items?feed_id={id}&limit=5`

**UI Components:**

```typescript
// components/subscriber/feed-preview.tsx
export function FeedPreview({ feedId }: { feedId: string }) {
  const { data: feed } = useFeed(feedId);
  const { data: items } = useFeedItems(feedId, { limit: 5 });

  return (
    <Sheet>
      <SheetContent className="w-[600px]">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={feed.creator.avatar} />
                <AvatarFallback>{feed.creator.initials}</AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle>{feed.name}</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  by {feed.creator.name}
                </p>
              </div>
            </div>
            <SubscribeButton feedId={feedId} />
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div>
            <h3 className="font-semibold mb-2">About this feed</h3>
            <p className="text-sm text-muted-foreground">{feed.description}</p>
          </div>

          <div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{feed.subscriberCount} subscribers</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{feed.schedule}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-3">Recent Content</h3>
            <div className="space-y-3">
              {items.map(item => (
                <ContentPreviewCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

#### 2.3 Creator Profiles

**As a** subscriber
**I want to** view creator profiles
**So that** I can learn more about content curators

**Implementation:**

- Creator profile page
- List of creator's feeds
- Creator stats and bio

**API:** `GET /creators/{id}`, `GET /feeds?creator_id={id}`

### Story 3: Subscription Management

#### 3.1 Subscribe to Feeds

**As a** subscriber
**I want to** subscribe to feeds I'm interested in
**So that** I receive their content

**Implementation:**

- One-click subscription
- Attribution tracking for creators
- Subscription confirmation

**API:** `POST /subscriptions` with `feed_id` and optional `referral_code`

**UI Components:**

```typescript
// components/subscriber/subscribe-button.tsx
export function SubscribeButton({ feedId }: { feedId: string }) {
  const { mutate: subscribe, isLoading } = useSubscribe();
  const { data: subscription } = useSubscription(feedId);

  if (subscription) {
    return (
      <Button variant="outline" onClick={() => unsubscribe(feedId)}>
        <Check className="h-4 w-4 mr-2" />
        Subscribed
      </Button>
    );
  }

  return (
    <Button onClick={() => subscribe(feedId)} disabled={isLoading}>
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Plus className="h-4 w-4 mr-2" />
      )}
      Subscribe
    </Button>
  );
}
```

#### 3.2 Manage Subscriptions

**As a** subscriber
**I want to** manage my feed subscriptions
**So that** I can control what content I receive

**Implementation:**

- List of active subscriptions
- Unsubscribe functionality
- Delivery preferences per feed

**API:** `GET /subscriptions`, `DELETE /subscriptions/{id}`, `PUT /subscriptions/{id}`

**UI Components:**

```typescript
// app/(subscriber)/subscriptions/page.tsx
export default function SubscriptionsPage() {
  const { data: subscriptions } = useSubscriptions();

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">My Subscriptions</h1>

      <div className="grid gap-4">
        {subscriptions.map(sub => (
          <Card key={sub.id}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={sub.feed.creator.avatar} />
                  <AvatarFallback>{sub.feed.creator.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{sub.feed.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    by {sub.feed.creator.name} • {sub.feed.schedule}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <DeliveryPreferences subscriptionId={sub.id} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnsubscribe(sub.id)}
                >
                  Unsubscribe
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

#### 3.3 Delivery Preferences

**As a** subscriber
**I want to** set how I receive content
**So that** I consume content in my preferred way

**Implementation:**

- Email delivery toggle
- Delivery frequency settings
- Time zone preferences

**API:** `PUT /subscriptions/{id}/preferences`

### Story 4: Content Consumption

#### 4.1 Web Portal

**As a** subscriber
**I want to** read content in a web portal
**So that** I can consume content online

**Implementation:**

- Clean reading interface
- Mark as read functionality
- Save for later feature

**API:** `GET /feed-items`, `POST /content-views`

**UI Components:**

```typescript
// app/(subscriber)/portal/page.tsx
export default function ContentPortal() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'saved'>('all');
  const { data: items, isLoading } = usePortalContent({ filter });

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Your Content Feed</h1>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="saved">Saved</TabsTrigger>
            </TabsList>
          </Tabs>
        </header>

        <div className="space-y-6">
          {items.map(item => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

#### 4.2 Content Card

**As a** subscriber
**I want to** interact with individual content items
**So that** I can engage with content effectively

**Implementation:**

- Content preview with expand option
- Rating system
- Share functionality
- Mark as read

**UI Components:**

```typescript
// components/subscriber/content-card.tsx
export function ContentCard({ item }: { item: ContentItem }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [rating, setRating] = useState(item.userRating || 0);

  return (
    <Card className={cn("transition-all", item.isRead && "opacity-75")}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {item.title}
              </a>
            </CardTitle>
            <CardDescription className="mt-1">
              From {item.feed.name} • {formatDate(item.publishedAt)}
            </CardDescription>
          </div>
          <SaveButton itemId={item.id} saved={item.isSaved} />
        </div>
      </CardHeader>

      <CardContent>
        <p className={cn(
          "text-sm text-muted-foreground",
          !isExpanded && "line-clamp-3"
        )}>
          {item.description}
        </p>
        {item.description.length > 150 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 p-0 h-auto"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </Button>
        )}

        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="mt-4 rounded-lg w-full object-cover max-h-64"
          />
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <RatingStars
            value={rating}
            onChange={(value) => handleRate(item.id, value)}
          />
          <Button variant="ghost" size="sm" asChild>
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Visit
            </a>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <ShareButton item={item} />
          {!item.isRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAsRead(item.id)}
            >
              Mark as read
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
```

#### 4.3 Email Delivery

**As a** subscriber
**I want to** receive content via email
**So that** I can read content in my inbox

**Implementation:**

- Email template design
- Unsubscribe links
- Click tracking

**Note:** This is handled backend-side, but frontend manages preferences

### Story 5: Personalization

#### 5.1 Add Personal Sources

**As a** subscriber
**I want to** add my own content sources
**So that** I can personalize my feeds

**Implementation:**

- Add personal RSS feeds
- Import bookmarks
- Custom URL additions

**API:** `POST /subscriber/sources`

**UI Components:**

```typescript
// components/subscriber/personal-sources.tsx
export function PersonalSources() {
  const { data: sources } = usePersonalSources();
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Personal Sources</CardTitle>
        <Button size="sm" onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Source
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sources.map(source => (
            <div key={source.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Rss className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{source.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeSource(source.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>

      <AddSourceModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </Card>
  );
}
```

#### 5.2 Content Rating

**As a** subscriber
**I want to** rate content items
**So that** the system learns my preferences

**Implementation:**

- 5-star rating system
- Quick thumbs up/down option
- Preference learning feedback

**API:** `POST /feed-items/{id}/rate`

#### 5.3 Preference Settings

**As a** subscriber
**I want to** manage my content preferences
**So that** I receive more relevant content

**Implementation:**

- Interest categories management
- Content type preferences
- Frequency settings

**API:** `PUT /subscriber/profile`

### Story 6: Search & Filter

#### 6.1 Search Content

**As a** subscriber
**I want to** search through my content
**So that** I can find specific items

**Implementation:**

- Full-text search
- Filter by feed
- Date range filters

**API:** `GET /feed-items?search={query}`

**UI Components:**

```typescript
// components/subscriber/content-search.tsx
export function ContentSearch() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<ContentFilters>({});
  const { data: results, isLoading } = useContentSearch(query, filters);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search content..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <FilterMenu filters={filters} onChange={setFilters} />
      </div>

      {isLoading ? (
        <SearchResultsSkeleton />
      ) : (
        <SearchResults results={results} />
      )}
    </div>
  );
}
```

## Implementation Checklist

### Phase 1: Registration & Onboarding

- [ ] Role selection during registration
- [ ] Interest selection for subscribers
- [ ] Profile creation

### Phase 2: Feed Discovery

- [ ] Feed browsing interface
- [ ] Category filters
- [ ] Feed preview modal
- [ ] Creator profiles

### Phase 3: Subscription Management

- [ ] Subscribe/unsubscribe functionality
- [ ] Subscription list
- [ ] Delivery preferences

### Phase 4: Content Portal

- [ ] Web reading interface
- [ ] Content cards
- [ ] Mark as read
- [ ] Save for later
- [ ] Content rating

### Phase 5: Personalization

- [ ] Personal source management
- [ ] Preference settings
- [ ] Content filtering

### Phase 6: Search & Discovery

- [ ] Content search
- [ ] Advanced filters
- [ ] Search results display
