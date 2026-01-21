# Creator User Stories & Implementation Guide

## Epic: Creator Journey

### Story 1: Creator Registration & Dashboard Access

#### 1.1 Role Selection & Immediate Access

**As a** new user
**I want to** register as a creator and immediately access content curation tools
**So that** I can start building my content library without friction

**Implementation:**

- Registration page with role selector (Creator/Subscriber)
- Use shadcn RadioGroup component for selection
- Store role in user profile

**API:** `POST /auth/register` with `role: 'creator'`

**UI Components:**

```typescript
// app/(auth)/register/page.tsx
<Card>
  <CardHeader>
    <CardTitle>Join SmartNews</CardTitle>
    <CardDescription>Choose how you want to use SmartNews</CardDescription>
  </CardHeader>
  <CardContent>
    <RadioGroup value={role} onValueChange={setRole}>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="creator" id="creator" />
        <Label htmlFor="creator">
          <div>
            <div className="font-semibold">Creator</div>
            <div className="text-sm text-muted-foreground">
              Curate content and earn revenue
            </div>
          </div>
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="subscriber" id="subscriber" />
        <Label htmlFor="subscriber">
          <div>
            <div className="font-semibold">Subscriber</div>
            <div className="text-sm text-muted-foreground">
              Discover and consume content
            </div>
          </div>
        </Label>
      </div>
    </RadioGroup>
  </CardContent>
</Card>
```

#### 1.2 Social Media Integration (Optional)

**As a** creator
**I want to** optionally connect my social media accounts from my profile settings
**So that** I can unlock revenue estimation features when I'm ready

**Note:** This is an optional feature accessible from the dashboard or settings page, not part of registration flow.

**Implementation:**

- OAuth flow for YouTube, Twitter, Reddit
- Display connected accounts with follower counts
- Allow disconnect/reconnect functionality

**API:** `POST /social/connect/{platform}`, `GET /social/stats`

**UI Flow:**

```typescript
// components/creator/social-connect.tsx
export function SocialConnect() {
  const platforms = ['youtube', 'twitter', 'reddit'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect Your Accounts</CardTitle>
        <CardDescription>
          Link at least one social media account to continue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {platforms.map(platform => (
          <div key={platform} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <SocialIcon platform={platform} />
              <div>
                <p className="font-medium capitalize">{platform}</p>
                {connected[platform] && (
                  <p className="text-sm text-muted-foreground">
                    {formatNumber(followers[platform])} followers
                  </p>
                )}
              </div>
            </div>
            <Button
              variant={connected[platform] ? "outline" : "default"}
              onClick={() => handleConnect(platform)}
            >
              {connected[platform] ? 'Disconnect' : 'Connect'}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

#### 1.3 Revenue Estimation (Conditional)

**As a** creator who has connected social accounts
**I want to** see my estimated monthly earnings in my dashboard
**So that** I understand the earning potential

**Note:** Revenue estimation displays only when social accounts are connected. Otherwise, dashboard shows a prompt: "Connect your social networks to estimate your revenue potential."

**Implementation:**

- Real-time calculation based on connected accounts
- Visual breakdown by platform
- Confidence indicators

**API:** `GET /creator/revenue/estimate`

**UI Components:**

```typescript
// components/creator/revenue-estimator.tsx
export function RevenueEstimator() {
  const { data: estimate } = useRevenueEstimate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estimated Monthly Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          ${estimate.total}/month
        </div>
        <Progress value={estimate.confidence} className="mt-4" />
        <p className="text-sm text-muted-foreground mt-2">
          {estimate.confidence}% confidence based on your audience
        </p>

        <Separator className="my-4" />

        <div className="space-y-2">
          {estimate.breakdown.map(item => (
            <div key={item.platform} className="flex justify-between">
              <span className="text-sm">{item.platform}</span>
              <span className="text-sm font-medium">${item.amount}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 1.4 Profile Completion (Optional)

**As a** creator
**I want to** complete my creator profile at any time from my dashboard or settings
**So that** subscribers can learn about me when I'm ready to publish

**Implementation:**

- Accessible from dashboard banner or settings page
- Single-page or multi-step form (user choice)
- Profile photo upload
- Bio and content categories selection
- Can be skipped and completed later

**API:** `POST /creator/profile/upload` (multipart form data)

**UI Components:**

- Use shadcn Form with react-hook-form
- Avatar upload with preview
- Multi-select for categories using shadcn MultiSelect

### Story 2: Content Curation & Import

#### 2.1 Manual URL Addition

**As a** creator
**I want to** manually add content URLs
**So that** I can curate specific content

**Implementation:**

- URL input with validation
- Batch URL addition support
- Metadata extraction and preview

**API:** `POST /feed-sources`, `POST /feed-items`

**UI Components:**

```typescript
// components/creator/content-add-url.tsx
export function AddUrlForm() {
  const [urls, setUrls] = useState<string[]>(['']);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Content URLs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {urls.map((url, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => updateUrl(index, e.target.value)}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeUrl(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          className="mt-2"
          onClick={addUrlField}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add another URL
        </Button>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit}>Import URLs</Button>
      </CardFooter>
    </Card>
  );
}
```

#### 2.2 RSS Feed Import

**As a** creator
**I want to** import RSS feeds
**So that** I can automatically curate content from my favorite sources

**Implementation:**

- RSS URL validation
- Feed preview before import
- Automatic feed updates

**API:** `POST /feed-sources` with `source_type: 'rss'`

#### 2.3 Social Bookmarks Import

**As a** creator
**I want to** import my saved content from social platforms
**So that** I can leverage my existing curation

**Implementation:**

- OAuth connections for import
- Progress indicator for large imports
- Duplicate detection

**API:** `POST /social/import/{platform}`

### Story 3: Feed Management

#### 3.1 Create Feed

**As a** creator
**I want to** create named feeds with descriptions
**So that** subscribers know what content to expect

**Implementation:**

- Feed creation wizard
- Category selection
- Publishing schedule setup

**API:** `POST /feeds`

**UI Components:**

```typescript
// components/creator/feed-create-form.tsx
export function CreateFeedForm() {
  const form = useForm<FeedFormData>({
    resolver: zodResolver(feedSchema),
    defaultValues: {
      name: '',
      description: '',
      category_ids: [],
      schedule: 'daily',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Feed Name</FormLabel>
              <FormControl>
                <Input placeholder="Tech Insights" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Daily curated tech news and insights..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category_ids"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categories</FormLabel>
              <FormControl>
                <MultiSelect
                  options={categories}
                  selected={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Create Feed</Button>
      </form>
    </Form>
  );
}
```

#### 3.2 Content Selection

**As a** creator
**I want to** select which content goes into each feed
**So that** I can maintain feed quality and relevance

**Implementation:**

- Drag-and-drop content organization
- Bulk selection tools
- Content preview

**API:** `POST /feed-items`, `PUT /feed-items/{id}`

#### 3.3 Schedule Publishing

**As a** creator
**I want to** schedule when my feeds are published
**So that** subscribers receive content at optimal times

**Implementation:**

- Calendar view for scheduling
- Time zone handling
- Recurring schedule patterns

### Story 4: Creator Dashboard

#### 4.1 Analytics Overview

**As a** creator
**I want to** see my key metrics at a glance
**So that** I can track my performance

**Implementation:**

- Use shadcn dashboard-01 block as base
- Real-time data updates
- Responsive grid layout

**API:** `GET /creator/analytics`

**UI Components:**

```typescript
// app/(creator)/dashboard/page.tsx
export default function CreatorDashboard() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <DateRangePicker />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Subscribers"
              value="2,453"
              change="+12.5%"
              icon={<Users />}
            />
            <MetricCard
              title="Monthly Revenue"
              value="$4,231"
              change="+8.2%"
              icon={<DollarSign />}
            />
            <MetricCard
              title="Content Items"
              value="1,259"
              change="+23"
              icon={<FileText />}
            />
            <MetricCard
              title="Engagement Rate"
              value="68.5%"
              change="+2.1%"
              icon={<TrendingUp />}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Subscriber Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <RevenueChart />
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentActivity />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

#### 4.2 Revenue Tracking

**As a** creator
**I want to** track my revenue in detail
**So that** I understand my earnings

**Implementation:**

- Revenue breakdown by source
- Payout history
- Projected earnings

**API:** `GET /creator/revenue`, `GET /creator/payouts`

#### 4.3 Subscriber Management

**As a** creator
**I want to** see and manage my subscribers
**So that** I can understand my audience

**Implementation:**

- Subscriber list with search/filter
- Growth trends
- Engagement metrics

**API:** `GET /creator/subscribers`

### Story 5: Content Performance

#### 5.1 Content Analytics

**As a** creator
**I want to** see how my content performs
**So that** I can improve my curation

**Implementation:**

- Click-through rates
- Engagement metrics
- Top performing content

**API:** `GET /feed-items/analytics`

**UI Components:**

```typescript
// components/creator/content-performance.tsx
export function ContentPerformance() {
  const { data: analytics } = useContentAnalytics();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Performance</CardTitle>
        <CardDescription>
          Track how your curated content resonates with subscribers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Content</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Clicks</TableHead>
              <TableHead>CTR</TableHead>
              <TableHead>Rating</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analytics.items.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.title}
                </TableCell>
                <TableCell>{item.views}</TableCell>
                <TableCell>{item.clicks}</TableCell>
                <TableCell>{item.ctr}%</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-1" />
                    {item.rating}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

## Implementation Checklist

### Phase 1: Authentication & Onboarding

- [ ] Registration with role selection
- [ ] Login page using shadcn login-02
- [ ] Social media OAuth integration
- [ ] Revenue estimation calculator
- [ ] Profile creation and editing

### Phase 2: Content Management

- [ ] Manual URL addition
- [ ] RSS feed import
- [ ] Social bookmarks import
- [ ] Content list view
- [ ] Content preview

### Phase 3: Feed Creation

- [ ] Feed creation form
- [ ] Content selection for feeds
- [ ] Publishing schedule
- [ ] Feed preview
- [ ] Feed management

### Phase 4: Dashboard & Analytics

- [ ] Dashboard layout (shadcn dashboard-01)
- [ ] Metrics cards
- [ ] Revenue charts
- [ ] Subscriber analytics
- [ ] Content performance

### Phase 5: Revenue Features

- [ ] Revenue dashboard
- [ ] Payout history
- [ ] Revenue projections
- [ ] Transaction details
