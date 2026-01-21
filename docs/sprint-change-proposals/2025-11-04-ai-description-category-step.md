# Sprint Change Proposal
## Feed Creation Flow - AI-Powered Description & Category Step

**Date**: 2025-11-04
**Proposal ID**: SCP-2025-11-04-001
**Status**: ✅ APPROVED
**Approved By**: Weverson (Product Owner)
**Created By**: Bob (Scrum Master)

---

## Executive Summary

**Change Type**: UX Enhancement + AI Integration
**Scope**: Feed Creation & Edit Wizards
**Effort**: 15-17 hours
**Risk Level**: Low
**MVP Impact**: None (enhancement only)

Move description and category fields from Step 1 to final step (Step 5) of the feed creation wizard, leveraging new AI backend capability (`GET /feeds/{feed_id}/suggestions`) to auto-generate these fields based on feed name and selected sources. **Optimized with prefetching** - API called on Step 4 entry so suggestions are ready by Step 5.

---

## 1. Issue Summary

**Current Problem**: Description and category fields are collected too early in the feed creation wizard (Step 1), forcing creators to think abstractly about their feed before they've selected content sources or seen what their feed will contain.

**New Backend Capability**: `GET /feeds/{feed_id}/suggestions` endpoint generates AI-powered description (max 500 chars) and 1-3 category suggestions based on feed name and sources.

**Proposed Solution**:
1. Remove description/category from Step 1 (collect name only)
2. Auto-save draft feed after Step 3 (content selection)
3. **Prefetch AI suggestions on Step 4 entry** (while user configures schedule)
4. Display pre-loaded AI suggestions in Step 5 (zero wait time!)
5. Allow user to approve/modify before final save

---

## 2. Epic Impact Assessment

### Affected Stories

**Story 1.3 - Feed Creation** (Status: ✅ Done)
- **Impact**: Enhancement to existing functionality
- **Changes**: Wizard step reordering, new API integration with prefetching
- **Action**: Update story documentation and acceptance criteria

**Story 1.3.1 - Feed Edit/Delete** (Status: ✅ Done)
- **Impact**: Edit wizard inherits same steps as creation
- **Changes**: Ensure consistency across CRUD operations
- **Action**: Update edit wizard flow documentation

### Future Epics
- **Impact**: None - change is localized to feed creation/edit

---

## 3. Optimized Wizard Flow (Zero Wait Time!)

### Current Flow (5 steps)

1. **Step 1: Basic Info** - Name, **Description**, **Category**
2. **Step 2: Source Selection** - Choose content sources
3. **Step 3: Filter Configuration** - Keywords, PG-13
4. **Step 4: Publishing Settings** - Schedule, auto-send
5. **Step 5: Review & Publish** - Final review

### Proposed New Flow (5 steps, reordered with prefetching)

1. **Step 1: Basic Info** - Name **ONLY** ✅
   - Remove: Description field
   - Remove: Category dropdown
   - Keep: Feed name (required)

2. **Step 2: Source Selection** - Choose content sources ✅
   - No changes to this step

3. **Step 3: Content Preview & Selection** ✅
   - No changes to this step
   - **After completion**: Auto-save draft feed via `POST /feeds/`
   - Store returned `feed_id` in wizard state

4. **Step 4: Publishing Settings** ✅
   - **⚡ ON ENTRY**: Immediately prefetch `GET /feeds/{feed_id}/suggestions` in background
   - User configures schedule/auto-send while API loads
   - React Query caches the response
   - **By the time user clicks "Next"**, suggestions are ready!

5. **Step 5: AI-Powered Description & Review** ✅ **NEW/ENHANCED**
   - **Display pre-loaded AI suggestions** (data already cached - no spinner!)
   - Show AI-generated description (editable textarea)
   - Show 1-3 AI-suggested categories (selectable dropdown)
   - User can edit/override AI suggestions
   - Final review of all feed settings
   - **FINAL API CALL**: `PUT /feeds/{feed_id}` with approved description + category

---

## 4. API Integration Details

### New Endpoint: `GET /feeds/{feed_id}/suggestions`

**Purpose**: Generate AI-powered description and category suggestions

**Timing**:
- **Called**: On Step 4 entry (prefetch in background)
- **Used**: On Step 5 display (data already cached)
- **Result**: Zero perceived wait time for user

**Authentication**: Requires Bearer token (creator must own the feed)

**Request Example**:
```bash
GET https://localhost:8000/feeds/19/suggestions
Authorization: Bearer {token}
```

**Response Example**:
```json
{
  "description": "A curated collection of the latest technology news focusing on AI innovations and startup ecosystem developments.",
  "suggested_categories": [
    "Technology",
    "Business",
    "Innovation"
  ]
}
```

**Error Handling**:
- **404**: Feed not found → Display error message, allow manual input
- **401**: Unauthorized → Trigger re-authentication
- **500**: Server error → Fallback to manual description/category input
- **Network timeout**: Show error, allow manual input

**Prefetch Strategy**: Use React Query `prefetchQuery` to load data in background on Step 4 entry. By the time user completes Step 4 and navigates to Step 5, data is ready.

---

## 5. Component Changes

### Files to Modify

#### 1. `/components/feeds/wizard/BasicInfoStep.tsx`
**Changes**:
- ❌ **REMOVE**: Description textarea field
- ❌ **REMOVE**: Category dropdown/select
- ✅ **KEEP**: Name input field (required)
- 🔄 **UPDATE**: Form validation - only name required for Step 1

**Estimated Effort**: 1 hour

---

#### 2. `/components/feeds/wizard/PublishSettingsStep.tsx`

**NEW: Prefetch Logic on Component Mount**:
```typescript
import { useQueryClient } from '@tanstack/react-query';
import { getFeedSuggestions } from '@/lib/api/feeds';

export function PublishSettingsStep() {
  const queryClient = useQueryClient();
  const { feedId } = useFeedBuilderStore();

  useEffect(() => {
    // Prefetch AI suggestions when Step 4 loads
    if (feedId) {
      queryClient.prefetchQuery({
        queryKey: ['feed-suggestions', feedId],
        queryFn: () => getFeedSuggestions(feedId),
        // Cache for 5 minutes
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [feedId, queryClient]);

  // ... rest of component (schedule configuration UI)
}
```

**Estimated Effort**: 1 hour

---

#### 3. `/components/feeds/wizard/ReviewStep.tsx` → **RENAME** to `AIDescriptionReviewStep.tsx`

**New Component with Pre-loaded Data**:
```tsx
export function AIDescriptionReviewStep() {
  const { feedId, feed, setFeed } = useFeedBuilderStore();

  // Data is already cached from Step 4 prefetch - no loading spinner needed!
  const { data: suggestions, isLoading, isError } = useQuery({
    queryKey: ['feed-suggestions', feedId],
    queryFn: () => getFeedSuggestions(feedId),
    enabled: !!feedId,
    // Data should already be in cache from prefetch
  });

  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (suggestions && !description) {
      // Auto-populate with AI suggestions
      setDescription(suggestions.description);
      setCategory(suggestions.suggested_categories[0] || '');
    }
  }, [suggestions]);

  return (
    <div className="space-y-6">
      {/* AI Suggestions Section */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Generated Suggestions</CardTitle>
          <CardDescription>
            Based on your feed name and sources. You can edit before publishing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && <Skeleton className="h-20" />}

          {isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to generate AI suggestions. Please enter manually.
              </AlertDescription>
            </Alert>
          )}

          {!isLoading && !isError && (
            <>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder="Describe your feed..."
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {description.length}/500 characters
                </p>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {suggestions?.suggested_categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Existing review sections */}
      {/* ... feed summary, sources, filters, schedule ... */}
    </div>
  );
}
```

**Estimated Effort**: 3 hours

---

#### 4. `/lib/stores/feed-builder-store.ts`

**Changes**:
- ✅ **ADD**: `feedId: number | null` to store state
- ✅ **ADD**: `setFeedId(id: number)` action
- 🔄 **UPDATE**: Remove `description` from initial `feed` object
- 🔄 **UPDATE**: Remove `category` from initial `feed` object

**New State Structure**:
```typescript
interface FeedBuilderStore {
  feedId: number | null; // NEW - stored after Step 3
  feed: Partial<Feed>; // description/category removed from initial state
  selectedSourceIds: number[];
  filters: FeedFilters;

  setFeedId: (id: number) => void; // NEW
  // ... existing actions
}
```

**Estimated Effort**: 1 hour

---

#### 5. `/lib/api/feeds.ts` or `/lib/api/services/feeds.service.ts`

**New API Function**:
```typescript
/**
 * Get AI-powered description and category suggestions for a feed
 * @param feedId - The feed ID
 * @returns AI-generated suggestions
 */
export async function getFeedSuggestions(
  feedId: number
): Promise<{
  description: string;
  suggested_categories: string[];
}> {
  const { data } = await apiClient.get(`/feeds/${feedId}/suggestions`);
  return data;
}
```

**Estimated Effort**: 30 minutes

---

#### 6. `/app/(creator)/feeds/create/page.tsx`

**Changes**:
- **After Step 3 completion**: Call `POST /feeds/` to create draft
- **Store feed ID**: Save returned `feed_id` in wizard state
- **Step 4 entry**: Prefetch handled in PublishSettingsStep component
- **Step 5 logic**: Display pre-loaded suggestions
- **Error handling**: Fallback to manual input if API fails

**New Logic Flow**:
```typescript
const handleStepThreeComplete = async () => {
  try {
    // Create draft feed with name + sources
    const draftFeed = await createFeed({
      name: feed.name,
      feed_source_ids: selectedSourceIds,
      status: "draft"
    });

    // Store feed ID for AI suggestions
    setFeedId(draftFeed.id);

    // Navigate to Step 4 (prefetch will happen automatically)
    goToNextStep();
  } catch (error) {
    toast.error("Failed to save draft");
  }
};
```

**Estimated Effort**: 2 hours

---

### Total Frontend Implementation: 8.5 hours

---

## 6. Story Updates

### Story 1.3 - Feed Creation

**File**: `docs/stories/1.3.frontend.feed-creation.story.md`

**Section**: Acceptance Criteria #1 (Feed Creation Wizard)

**Change**:
```markdown
1. **Feed Creation Wizard** ✅
   - Step 1: Basic information (name only) ← UPDATED
   - Step 2: Source selection (RSS, YouTube, social media)
   - Step 3: Content preview and selection ← UPDATED
   - Step 4: Publishing settings (AI suggestions prefetch in background) ← UPDATED
   - Step 5: AI-powered description & category + review (pre-loaded, zero wait!) ← NEW
   - Draft saving functionality (auto-save after Step 3) ← UPDATED
```

**New Subsection**: Add AI Suggestions Integration section
```markdown
### AI Suggestions Integration (Optimized with Prefetching)

**Endpoint**: `GET /feeds/{feed_id}/suggestions`

**Timing**:
- Prefetched on Step 4 entry (background)
- Displayed on Step 5 (zero wait time)

**Features**:
- AI-generated description (max 500 characters)
- 1-3 category suggestions from Google AdSense Categories
- User can edit suggestions before publishing
- Fallback to manual input if API fails
- **Zero perceived wait time** via React Query prefetching
```

---

### Story 1.3.1 - Feed Edit/Delete

**File**: `docs/stories/1.3.1.frontend.feed-edit-delete.story.md`

**Section**: Acceptance Criteria #2 (Edit Wizard Workflow)

**Change**:
```markdown
2. **Edit Wizard Workflow** ✅
   - Reuses same 5 wizard steps as creation
   - Step 1: Basic Info (name only) ← UPDATED
   - Step 2: Source Selection
   - Step 3: Content Preview ← UPDATED
   - Step 4: Publishing Settings (AI prefetch if re-generating) ← UPDATED
   - Step 5: AI-Powered Description & Review ← UPDATED
   - NOTE: For existing feeds, description and category are pre-populated from database
   - NOTE: User can optionally re-generate AI suggestions on edit
```

---

## 7. Testing & Validation

### E2E Test Updates Required

**File**: `tests/e2e/creator/test_feed_creation.py`

**Changes**:
1. Update Step 1 assertions (no description/category fields)
2. Add draft save verification after Step 3
3. Verify feed ID stored in wizard state
4. Step 4: Verify AI suggestions API called in background
5. Step 5: Verify AI suggestions displayed without loading spinner
6. Test editing AI suggestions
7. Test final save with approved suggestions

**File**: `tests/e2e/creator/test_feed_edit.py`

**Changes**:
1. Update wizard step assertions to match new flow
2. Verify existing description/category pre-populated in Step 5

**Estimated Effort**: 3 hours (test updates + 2x execution)

---

## 8. Implementation Plan

### Phase 1: Documentation Updates (2 hours)
- [ ] Update Story 1.3 wizard flow and acceptance criteria
- [ ] Update Story 1.3.1 edit wizard documentation
- [ ] Document prefetching optimization
- [ ] Document new API endpoint

### Phase 2: Backend Verification (30 min)
- [ ] Verify `/feeds/{feed_id}/suggestions` endpoint operational
- [ ] Test with test account and real feed data
- [ ] Verify response format matches documentation
- [ ] Measure API response time (for prefetch timing validation)

### Phase 3: Frontend Implementation (8.5 hours)
- [ ] Remove description/category from BasicInfoStep (1 hour)
- [ ] Add draft save logic after Step 3 (2 hours)
- [ ] Add AI suggestions API client function (30 min)
- [ ] Add prefetch logic to PublishSettingsStep (1 hour)
- [ ] Create/update AIDescriptionReviewStep component (3 hours)
- [ ] Update feed builder store with feedId (1 hour)

### Phase 4: Edit Wizard Consistency (1 hour)
- [ ] Ensure edit wizard uses same components
- [ ] Verify pre-population works for existing feeds

### Phase 5: Testing & Validation (3 hours)
- [ ] Update E2E tests (creation + edit)
- [ ] Run E2E tests 2x consecutively
- [ ] Manual testing checklist
- [ ] Verify prefetch timing (no loading spinner on Step 5)
- [ ] `npm run build` validation
- [ ] `npm run lint` validation

### Phase 6: Code Review & Deployment (1 hour)
- [ ] Code review by QA agent
- [ ] Address any feedback
- [ ] Mark stories as updated
- [ ] Merge to main branch

---

**Total Estimated Effort**: 16 hours

---

## 9. Risk Assessment & Mitigation

| Risk | Severity | Probability | Mitigation |
|------|----------|-------------|-----------|
| AI suggestions endpoint fails | Medium | Low | Fallback to manual input (current behavior) |
| AI generates poor/irrelevant suggestions | Low | Medium | User can edit before saving |
| Prefetch timing issues (API too slow) | Low | Low | User sees loading state on Step 5 if prefetch not complete |
| Draft save conflicts with wizard state | Medium | Low | Proper state management + error handling |
| Edit wizard data pre-population breaks | Medium | Low | Thorough testing + preserve existing logic |
| E2E tests fail after changes | High | Medium | Update tests immediately, run 2x before approval |
| React Query cache issues | Low | Low | Proper cache configuration + staleTime settings |

---

## 10. Success Criteria

### Implementation Complete When:
- [x] User approval obtained ✅
- [ ] Description/category removed from Step 1
- [ ] Draft save functional after Step 3 with feed ID storage
- [ ] Prefetch implemented in Step 4 (PublishSettingsStep)
- [ ] AI suggestions endpoint integrated in Step 5
- [ ] Zero loading spinner on Step 5 (data pre-loaded)
- [ ] User can view and edit AI suggestions
- [ ] Final save updates feed with approved data
- [ ] Edit wizard matches creation wizard
- [ ] E2E tests updated and passing 2x consecutively
- [ ] `npm run build` passes (0 errors)
- [ ] `npm run lint` passes (0 warnings)
- [ ] All documentation updated (stories + UX spec)
- [ ] Manual testing checklist complete
- [ ] QA review passed

---

## 11. Performance Optimization Benefits

### Prefetching Advantages:

✅ **Zero Perceived Wait Time**
- User works on Step 4 while API loads
- By the time they reach Step 5, data is ready
- No loading spinner = smoother UX

✅ **React Query Caching**
- Automatic cache management
- Stale-while-revalidate pattern
- Retry logic built-in

✅ **Fallback Strategy**
- If prefetch fails, show loading state on Step 5
- Graceful degradation to manual input if API fails completely

✅ **Industry Best Practice**
- Matches patterns used by Netflix, Spotify, etc.
- "Load the next page while user reads current page"

---

## 12. Agent Handoff

### Next Steps

1. **✅ PO Approval**: OBTAINED (Weverson approved 2025-11-04)

2. **SM Agent (Bob)** → Create new implementation story:
   - Story: "1.3.6 - AI-Powered Description & Category Generation (Prefetched)"
   - Parent: Story 1.3 (Feed Creation)
   - Type: Enhancement
   - Priority: Medium
   - Include all implementation details from this proposal

3. **Dev Agent (James)** → Implement changes:
   - Follow implementation plan phases 1-6
   - Use this proposal as detailed specification
   - Update stories/docs as changes are made
   - Run tests after each phase

4. **QA Agent (Quinn)** → Validate implementation:
   - Review all code changes
   - Execute E2E tests 2x
   - Validate prefetch timing (no spinner on Step 5)
   - Validate against success criteria
   - Approve for production

---

## 13. Appendix

### Related Documents

- Story 1.3: `docs/stories/1.3.frontend.feed-creation.story.md`
- Story 1.3.1: `docs/stories/1.3.1.frontend.feed-edit-delete.story.md`
- UX Spec: `docs/frontend/ux/story-1.3-feed-creation-ui-spec.md`
- E2E Tests: `tests/e2e/creator/test_feed_creation.py`

### API Documentation

- Backend Swagger: https://localhost:8000/docs
- Endpoint: `GET /feeds/{feed_id}/suggestions`

### Change History

- 2025-11-04: Proposal created and approved with prefetching optimization

---

**End of Sprint Change Proposal**
