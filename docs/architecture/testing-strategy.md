# Testing Strategy

## Overview

smartfeed employs a comprehensive testing strategy with **mandatory End-to-End (E2E) testing** for all user-facing features using Playwright. This document outlines our testing approach, requirements, and best practices.

---

## Testing Pyramid

Our testing strategy follows the testing pyramid principle:

```
        /\
       /E2E\      E2E Tests (Few, Critical Paths)
      /______\    - Test complete user journeys
     /        \   - Real browser, API, database
    /  Integr  \  Integration Tests (Some, Key Interactions)
   /____________\ - Component interactions
  /              \ - API + State + Database
 /   Unit Tests   \ Unit Tests (Many, Fast, Focused)
/__________________\ - Individual functions/components
                     - Isolated, mocked dependencies
```

###Testing Layers

**1. Unit Tests** (80% of tests)

- Test individual functions, methods, components
- Fast execution (milliseconds)
- Mocked dependencies
- High coverage of business logic

**2. Integration Tests** (15% of tests)

- Test component interactions
- API + State + Database integration
- Medium execution speed (seconds)
- Verify data flow between layers

**3. E2E Tests** (5% of tests - **MANDATORY for UI**)

- Test complete user flows
- Real browser automation with Playwright
- Slow execution (minutes)
- **Critical**: Required for all user-facing features

---

## E2E Testing with Playwright

### Mandatory Requirement

**CRITICAL**: **ALL user-facing features MUST have E2E tests**

- **Dev Agent**: Creates E2E test during story implementation
- **QA Agent**: Verifies E2E test exists and passes **2x consecutively** before approval
- **Definition of Done**: Story cannot be marked "Done" without passing E2E tests

### Test Organization

```
tests/
├── e2e/
│   ├── auth/                    # Authentication tests
│   │   ├── test_subscriber_registration.py
│   │   ├── test_creator_registration.py
│   │   ├── test_login.py
│   │   └── test_password_reset.py
│   ├── creator/                 # Creator feature tests
│   │   ├── test_feed_creation.py
│   │   ├── test_feed_import.py
│   │   └── test_content_curation.py
│   ├── subscriber/              # Subscriber feature tests
│   │   ├── test_feed_discovery.py
│   │   └── test_subscription_management.py
│   └── shared/                  # Shared utilities
│       └── test_utils.py        # Common test helpers
└── screenshots/                 # Visual verification
    └── {feature}_*.png
```

### Test Naming Convention

- **Format**: `test_{feature}_{flow}.py`
- **Examples**:
  - `test_subscriber_registration.py`
  - `test_feed_import.py`
  - `test_creator_login.py`

### npm Script Integration

All E2E tests are integrated into `package.json`:

```json
"scripts": {
  "test:e2e:subscriber-register": "python tests/e2e/auth/test_subscriber_registration.py",
  "test:e2e:feed-import": "python tests/e2e/creator/test_feed_import.py"
}
```

**Run tests**: `npm run test:e2e:{feature-name}`

---

## E2E Test Requirements

### Test Structure

Every E2E test must include:

1. **Unique Test Data Generation**

   ```python
   from e2e.shared.test_utils import generate_unique_email
   test_email = generate_unique_email('subscriber')
   ```

2. **Clear Step-by-Step Logging**

   ```python
   print("Step 1: Navigating to registration page...")
   print("✓ Page loaded successfully")
   ```

3. **Screenshot Capture**

   ```python
   from e2e.shared.test_utils import take_screenshot
   take_screenshot(page, 'registration_step1_loaded')
   ```

4. **API Monitoring**

   ```python
   from e2e.shared.test_utils import setup_network_logging
   api_requests, api_responses = setup_network_logging(page)
   ```

5. **Error Checking**
   ```python
   from e2e.shared.test_utils import check_for_errors
   errors = check_for_errors(page, console_messages)
   ```

### Test Coverage

**Happy Path** (Primary success scenario)

- User completes flow successfully
- All required fields filled correctly
- Expected outcome achieved (redirect, success message, etc.)

**Sad Path** (Error scenarios)

- Invalid input validation
- Missing required fields
- Duplicate data handling
- API failure responses
- Network timeout scenarios

### Test Stability

**CRITICAL**: Tests must pass **2 times consecutively** before approval

- No flakiness or intermittent failures
- Consistent execution across runs
- Proper waits (networkidle, not arbitrary timeouts)
- Stable selectors (IDs, roles, text - not CSS classes)

---

## Development Workflow

### Dev Agent Responsibilities

1. **Implement Feature Code**
2. **Create E2E Test** (use `*task create-e2e-test`)
   - Generate unique test data
   - Implement happy path
   - Add error handling tests
   - Capture screenshots
   - Monitor API calls
3. **Add to package.json**
4. **Run Test 2x** - Verify stability
5. **Document in Story**
   - Add test file to File List
   - Add test results to Testing section
6. **Execute E2E Testing Checklist** (`*execute-checklist e2e-testing-checklist`)

### QA Agent Responsibilities

1. **Verify E2E Test Exists** - Check correct location
2. **Run Test Command** - Execute `npm run test:e2e:{feature-name}`
3. **Verify 2x Pass Rate** - Ensure stability
4. **Review Test Code**
   - Uses shared utilities
   - Happy path tested
   - Sad path tested
   - Screenshots captured
   - API monitoring included
5. **Execute E2E Testing Checklist**
6. **FAIL Story** if:
   - No E2E test for UI feature
   - Test doesn't run
   - Test fails or is flaky
   - Coverage incomplete

---

## Test Utilities

### Shared Utilities (`tests/e2e/shared/test_utils.py`)

**Data Generation:**

- `generate_unique_email(prefix)` - Unique email per test run
- `generate_unique_username(prefix)` - Unique username

**Screenshots:**

- `take_screenshot(page, name)` - Capture and save screenshot

**Logging:**

- `setup_console_logging(page)` - Capture browser console
- `setup_network_logging(page)` - Monitor API requests/responses

**Validation:**

- `check_for_errors(page, console_messages)` - Find visible errors

**Helpers:**

- `fill_form_field(page, field_id, value, step_number, field_name)` - Fill with logging
- `print_test_header(test_name, **kwargs)` - Formatted header
- `print_test_summary(status, **kwargs)` - Formatted summary
- `print_api_calls(requests, responses)` - API call details

---

## Best Practices

### 1. Test Independence

- Each test generates its own unique data
- Tests don't depend on other tests
- Clean state before each run

### 2. Semantic Selectors

✅ **Good**:

```python
page.locator('input#email')
page.locator('button[type="submit"]')
page.locator('text="Success"')
```

❌ **Bad**:

```python
page.locator('.css-class-xyz')  # Brittle, changes with styling
```

### 3. Proper Waits

✅ **Good**:

```python
page.wait_for_load_state('networkidle')
page.wait_for_url('**/expected/path')
```

❌ **Bad**:

```python
page.wait_for_timeout(5000)  # Arbitrary wait, slow and unreliable
```

### 4. Error Handling

```python
try:
    # Test implementation
    test_status = "PASSED"
except Exception as e:
    print(f"Test failed: {str(e)}")
    take_screenshot(page, 'error_screenshot')
    test_status = "FAILED"
    raise
finally:
    print_test_summary(test_status, ...)
    browser.close()
```

---

## Common Test Patterns

### Authentication Flow

```python
1. Navigate to auth page
2. Generate unique email/password
3. Fill form fields
4. Submit form
5. Verify redirect to protected page
6. Capture success screenshot
```

### CRUD Operations

**CRITICAL**: CRUD tests MUST test BOTH empty-list and populated-list scenarios in a **2-SCENARIO PATTERN**:

**Why 2 Scenarios?**

- **Scenario 1** tests NEW users (empty list, "no items" UI)
- **Scenario 2** tests EXISTING users (populated list)
- **Goal**: List starts empty and ends empty after cleanup

**Pattern Overview:**

1. **Scenario 1**: Create FIRST item (empty list) → View → Edit
2. **Scenario 2**: Create SECOND item (populated list) → View → Edit → DELETE second item
3. **Cleanup**: DELETE first item (and all remaining items)

```python
# ========================================
# 2-SCENARIO CRUD TEST PATTERN
# ========================================
# Tests both NEW user (empty list) and EXISTING user (populated list) experiences

def test_{feature}_crud():
    """Complete CRUD test: 2 scenarios covering empty and populated list states"""

    # ========================================
    # SCENARIO 1: NEW USER - First Item Creation (Empty List)
    # ========================================
    print("\n=== SCENARIO 1: Create First Item (Empty List) ===")

    1. Navigate to feature page (should show "no items" UI)
    2. Verify empty state UI displayed
    3. Click "Create" button from empty state
    4. Generate and store unique test data for first item
       first_item_data = {
           'title': f'First Test Item {timestamp}',
           'description': 'NEW user - Special chars: éàü & <>',
           'category': 'Technology'
       }
    5. Fill all form fields with first_item_data
    6. Submit form
    7. Verify success message/notification
    8. Verify item appears in list (list now has 1 item)
    9. **CRITICAL**: Save first_item_id for later phases

    # VIEW/EDIT First Item
    10. Navigate to view/edit first item (using first_item_id)
    11. **CRITICAL**: Verify ALL fields match first_item_data exactly
        - Text inputs: page.locator('#title').input_value() == first_item_data['title']
        - Textareas: page.locator('#description').input_value() == first_item_data['description']
        - Selects: page.locator('#category').input_value() == first_item_data['category']
        - Test special characters display correctly
    12. Take screenshot showing correct data
    13. Make an edit: first_item_data['title'] = f'EDITED {first_item_data["title"]}'
    14. Save changes and verify they persisted

    print("✓ Scenario 1 Complete: NEW user can create first item from empty list")

    # ========================================
    # SCENARIO 2: EXISTING USER - Second Item Creation (Populated List)
    # ========================================
    print("\n=== SCENARIO 2: Create Second Item (Populated List) ===")

    15. Navigate back to feature page (list now shows 1 item)
    16. Verify list shows first item (populated state)
    17. Click "Create" button from populated list
    18. Generate and store unique test data for second item
        second_item_data = {
            'title': f'Second Test Item {timestamp}',
            'description': 'EXISTING user - More data',
            'category': 'Business'
        }
    19. Fill all form fields with second_item_data
    20. Submit form
    21. Verify success message
    22. Verify both items appear in list (list now has 2 items)
    23. **CRITICAL**: Save second_item_id for deletion phase

    # VIEW/EDIT Second Item
    24. Navigate to view/edit second item (using second_item_id)
    25. **CRITICAL**: Verify ALL fields match second_item_data exactly
    26. Take screenshot showing correct data
    27. Make an edit: second_item_data['title'] = f'EDITED {second_item_data["title"]}'
    28. Save changes and verify they persisted

    print("✓ Scenario 2 Complete: EXISTING user can create item in populated list")

    # ========================================
    # DELETE Second Item - Verify immediate UI update
    # ========================================
    print("\n=== DELETE: Remove Second Item ===")

    29. Navigate to list view (should show 2 items)
    30. Count items: items_before = page.locator('.item-row').count()
    31. assert items_before == 2, "Should have 2 items before deletion"
    32. Click delete on second item
    33. Confirm deletion (if dialog exists)
    34. **CRITICAL**: Verify immediate removal
        - items_after = page.locator('.item-row').count()
        - assert items_after == 1, "Should have 1 item after deleting second"
        - assert page.locator(f'text="{second_item_data["title"]}"').count() == 0
    35. Verify first item still visible in list
    36. Verify no ghost elements

    print("✓ Second item deleted successfully")

    # ========================================
    # CLEANUP: DELETE First Item (and any remaining items)
    # ========================================
    print("\n=== CLEANUP: Remove First Item and Reset to Empty ===")

    37. Verify list shows 1 item (first item only)
    38. Click delete on first item
    39. Confirm deletion
    40. **CRITICAL**: Verify list returns to empty state
        - items_after_cleanup = page.locator('.item-row').count()
        - assert items_after_cleanup == 0, "List should be empty after cleanup"
        - Verify "no items" empty state UI shown
    41. Take screenshot showing empty state restored

    print("✓ Cleanup complete: List returned to empty state")
    print("\n✓✓✓ COMPLETE 2-SCENARIO CRUD TEST PASSED")
```

**Example 2-Scenario CRUD Implementation**:

```python
def test_feed_crud():
    """Complete 2-scenario CRUD test: Empty list + Populated list"""

    timestamp = int(time.time())
    first_feed_id = None
    second_feed_id = None

    # =================================================================
    # SCENARIO 1: NEW USER - Create First Feed from Empty List
    # =================================================================
    print("\n=== SCENARIO 1: Create First Feed (Empty List) ===")

    page.goto('http://localhost:3000/feeds')
    page.wait_for_load_state('networkidle')

    # Verify empty state
    assert page.locator('text="No feeds yet"').is_visible(), \
        "Empty state should be visible"
    take_screenshot(page, '01_empty_state')

    # Create first feed
    page.click('button:has-text("Create Feed")')
    first_feed_data = {
        'title': f'First Feed {timestamp}',
        'description': 'NEW user - Special: café, naïve, Zürich & <test>',
        'url': 'https://example.com/feed1.xml',
        'category': 'Technology',
        'is_public': True
    }

    page.locator('#title').fill(first_feed_data['title'])
    page.locator('#description').fill(first_feed_data['description'])
    page.locator('#url').fill(first_feed_data['url'])
    page.locator('#category').select_option(first_feed_data['category'])
    if first_feed_data['is_public']:
        page.locator('#is_public').check()

    page.click('button[type="submit"]')
    page.wait_for_load_state('networkidle')

    # Extract first feed ID
    first_feed_id = extract_id_from_url(page.url)
    print(f"✓ Created first feed with ID {first_feed_id}")

    # VIEW/EDIT First Feed - Verify data
    page.goto(f'http://localhost:3000/feeds/{first_feed_id}/edit')
    page.wait_for_load_state('networkidle')

    assert page.locator('#title').input_value() == first_feed_data['title']
    assert page.locator('#description').input_value() == first_feed_data['description']
    assert page.locator('#url').input_value() == first_feed_data['url']
    assert page.locator('#category').input_value() == first_feed_data['category']
    assert page.locator('#is_public').is_checked() == first_feed_data['is_public']
    take_screenshot(page, '02_first_feed_verified')

    # Edit first feed
    first_feed_data['title'] = f'EDITED {first_feed_data["title"]}'
    page.locator('#title').fill(first_feed_data['title'])
    page.click('button[type="submit"]')
    page.wait_for_load_state('networkidle')

    print("✓ Scenario 1 Complete: NEW user created first feed from empty list")

    # =================================================================
    # SCENARIO 2: EXISTING USER - Create Second Feed in Populated List
    # =================================================================
    print("\n=== SCENARIO 2: Create Second Feed (Populated List) ===")

    page.goto('http://localhost:3000/feeds')
    page.wait_for_load_state('networkidle')

    # Verify list shows first feed (populated state)
    assert page.locator('.feed-item').count() == 1, "Should show 1 feed"
    assert page.locator(f'text="{first_feed_data["title"]}"').is_visible()
    take_screenshot(page, '03_populated_list_one_item')

    # Create second feed
    page.click('button:has-text("Create Feed")')
    second_feed_data = {
        'title': f'Second Feed {timestamp}',
        'description': 'EXISTING user - More feeds',
        'url': 'https://example.com/feed2.xml',
        'category': 'Business',
        'is_public': False
    }

    page.locator('#title').fill(second_feed_data['title'])
    page.locator('#description').fill(second_feed_data['description'])
    page.locator('#url').fill(second_feed_data['url'])
    page.locator('#category').select_option(second_feed_data['category'])
    page.click('button[type="submit"]')
    page.wait_for_load_state('networkidle')

    second_feed_id = extract_id_from_url(page.url)
    print(f"✓ Created second feed with ID {second_feed_id}")

    # Verify list now shows 2 feeds
    page.goto('http://localhost:3000/feeds')
    page.wait_for_load_state('networkidle')
    assert page.locator('.feed-item').count() == 2, "Should show 2 feeds"
    take_screenshot(page, '04_populated_list_two_items')

    # VIEW/EDIT Second Feed - Verify data
    page.goto(f'http://localhost:3000/feeds/{second_feed_id}/edit')
    page.wait_for_load_state('networkidle')

    assert page.locator('#title').input_value() == second_feed_data['title']
    assert page.locator('#description').input_value() == second_feed_data['description']
    assert page.locator('#url').input_value() == second_feed_data['url']

    # Edit second feed
    second_feed_data['title'] = f'EDITED {second_feed_data["title"]}'
    page.locator('#title').fill(second_feed_data['title'])
    page.click('button[type="submit"]')
    page.wait_for_load_state('networkidle')

    print("✓ Scenario 2 Complete: EXISTING user created second feed in populated list")

    # =================================================================
    # DELETE Second Feed
    # =================================================================
    print("\n=== DELETE: Remove Second Feed ===")

    page.goto('http://localhost:3000/feeds')
    page.wait_for_load_state('networkidle')

    assert page.locator('.feed-item').count() == 2, "Should have 2 feeds"

    # Delete second feed
    page.locator(f'.feed-item:has-text("{second_feed_data["title"]}") button[data-testid="delete"]').click()
    page.click('button:has-text("Confirm")')
    page.wait_for_load_state('networkidle')

    # Verify only first feed remains
    assert page.locator('.feed-item').count() == 1, "Should have 1 feed after deletion"
    assert page.locator(f'text="{second_feed_data["title"]}"').count() == 0
    assert page.locator(f'text="{first_feed_data["title"]}"').is_visible()
    take_screenshot(page, '05_after_second_feed_deleted')

    print("✓ Second feed deleted successfully")

    # =================================================================
    # CLEANUP: Delete First Feed - Return to Empty State
    # =================================================================
    print("\n=== CLEANUP: Remove First Feed ===")

    page.locator(f'.feed-item:has-text("{first_feed_data["title"]}") button[data-testid="delete"]').click()
    page.click('button:has-text("Confirm")')
    page.wait_for_load_state('networkidle')

    # Verify empty state restored
    assert page.locator('.feed-item').count() == 0, "List should be empty"
    assert page.locator('text="No feeds yet"').is_visible(), \
        "Empty state should be visible again"
    take_screenshot(page, '06_empty_state_restored')

    print("✓ Cleanup complete: List returned to empty state")
    print("\n✓✓✓ COMPLETE 2-SCENARIO CRUD TEST PASSED")
```

### Import/Upload Flow

```python
1. Navigate to import page
2. Enter URL or select file
3. Trigger import action
4. Wait for processing (networkidle)
5. Verify success/error state
6. Check imported items display
```

---

## Prerequisites

### Environment Setup

**Required**:

- Python 3.x installed
- Playwright installed: `pip install playwright && playwright install chromium`
- Dev server running on `localhost:3000`

**Before Running Tests**:

```bash
# 1. Ensure dev server is running
npm run dev

# 2. In another terminal, run test
npm run test:e2e:{feature-name}
```

### CI/CD Integration

_Future Enhancement_: E2E tests will be integrated into CI/CD pipeline

- Run on pull requests
- Block merge if tests fail
- Parallel execution for speed
- Screenshot artifacts on failure

---

## Troubleshooting

### Test Fails to Start

- **Check**: Is dev server running? (`lsof -i :3000`)
- **Check**: Are Python/Playwright installed?
- **Check**: Is test file path correct in package.json?

### Test Fails Intermittently

- **Issue**: Flaky test (timing issues)
- **Fix**: Replace arbitrary timeouts with proper waits
- **Fix**: Use more stable selectors (IDs vs classes)
- **Fix**: Wait for networkidle before actions

### Test Fails on API Call

- **Check**: API endpoint correct in `.env.local`?
- **Check**: Backend service running?
- **Check**: Network logs show request/response details

### Screenshots Not Saving

- **Check**: `tests/screenshots/` folder exists
- **Check**: Write permissions on folder
- **Fix**: Create folder: `mkdir -p tests/screenshots`

---

## Quality Gates

### Dev Agent Cannot Mark Story "Ready for Review" Until:

- [ ] E2E test file created (if UI feature)
- [ ] Test uses shared utilities
- [ ] Happy path tested and passing
- [ ] Sad path tested
- [ ] Test passes 2x consecutively
- [ ] Screenshots captured
- [ ] Added to package.json
- [ ] Story documented

### QA Agent Must FAIL Story If:

- [ ] No E2E test for UI feature
- [ ] Test doesn't run successfully
- [ ] Test fails either of 2 consecutive runs
- [ ] Test code quality insufficient
- [ ] Coverage incomplete (no sad path)
- [ ] Not added to package.json
- [ ] Not documented in story

---

## Success Metrics

**Test Stability**: 95%+ pass rate on first run
**Coverage**: 100% of UI features have E2E tests
**Execution Time**: < 2 minutes per test average
**Maintenance**: Tests updated within same PR as feature

---

## Resources

- **E2E Testing Checklist**: `.bmad-core/checklists/e2e-testing-checklist.md`
- **E2E Test Creation Task**: `.bmad-core/tasks/create-e2e-test.md`
- **Shared Test Utilities**: `tests/e2e/shared/test_utils.py`
- **Story DoD Checklist**: `.bmad-core/checklists/story-dod-checklist.md` (Section 4: E2E Testing)

---

## Summary

**E2E testing is not optional** - it's a core requirement for quality delivery in the smartfeed project. Every user-facing feature must have comprehensive E2E tests that prove real users can successfully complete critical workflows.

**Dev agents create tests. QA agents verify tests. Users benefit from reliable software.**
