# SmartNews E2E Tests

This directory contains End-to-End (E2E) tests for the SmartNews application using Playwright.

---

## 🚨 E2E Testing - MANDATORY for ALL UI Features

**CRITICAL**: Every user-facing feature MUST have End-to-End tests before story completion.

### Core Requirements

- **Test Location**: `tests/e2e/{auth|creator|subscriber}/test_{feature}.py`
- **Shared Utilities**: Use `tests/e2e/shared/test_utils.py` (TestHelper methods)
- **Package.json Entry**: `"test:e2e:{feature-name}": "python tests/e2e/{category}/test_{feature}.py"`
- **Pass 2x Consecutively**: Tests must pass twice in a row before story approval
- **CRUD Pattern**: Use 2-scenario pattern (Scenario 1: Empty list, Scenario 2: Populated list, Cleanup)

### Agent Responsibilities

**Dev Agent**:

- Cannot mark story "Ready for Review" without E2E test
- Use `*task create-e2e-test` to create tests following BMad method
- Must verify tests pass 2x before handoff to QA

**QA Agent**:

- **MUST independently execute and verify all E2E tests** before approving any feature
- **Never rely solely on test results from other agents** - always run tests yourself
- MUST FAIL story if E2E test is missing, broken, or flaky
- Verify test follows quality standards (TestHelper methods, explicit assertions, proper exit codes)

### Quality Standards

All tests MUST use **TestHelper methods** to prevent false positives:

- ✅ `TestHelper.login_with_verification()` - Never assume login succeeded
- ✅ `TestHelper.safe_click()` - Verify clicks succeed
- ✅ `TestHelper.verify_element_visible()` - Explicit visibility checks
- ✅ `TestHelper.verify_no_errors()` - Console error detection
- ✅ Proper exit codes: `sys.exit(0)` success, `sys.exit(1)` failure

### Resources

- **Full Testing Strategy**: `docs/architecture/testing-strategy.md`
- **E2E Test Improvements Guide**: `docs/e2e-test-improvements-guide.md` ⭐ **READ THIS FIRST!**
- **E2E Testing Checklist**: `.bmad-core/checklists/e2e-testing-checklist.md`
- **Test Creation Task**: `.bmad-core/tasks/create-e2e-test.md`

**Run Tests**: `npm run test:e2e:{feature-name}` (requires `npm run dev` running)

---

## ⚡ Quick Reference - New Test Standards (2025)

**CRITICAL CHANGES**: E2E tests now use **TestHelper methods** to prevent false positives!

### ✅ New Pattern (Explicit Verification)

```python
from e2e.shared.test_utils import TestHelper

# Login with verification
TestHelper.login_with_verification(page, "http://localhost:3000")

# Click with verification
TestHelper.safe_click(page, "#button", "Button name")

# Verify operations succeeded
TestHelper.verify_element_visible(page, "#result", "Result element")
TestHelper.verify_no_errors(page, console_messages, "after action")
```

### ❌ Old Pattern (No Verification - Causes False Positives)

```python
# DON'T DO THIS - test passes even if operations fail!
page.click("#button")
page.wait_for_timeout(2000)
print("✓ Success")  # ← No actual verification!
```

**📖 Must Read**: `docs/e2e-test-improvements-guide.md` before writing tests!

---

## ⚠️ Test Consolidation (2025-10-22)

**IMPORTANT**: Feed CRUD tests have been consolidated following QA recommendations from Story 1.3.3.

### What Changed

**Deleted Files** (Replaced by `test_feed_crud.py`):

- ❌ `test_feed_creation.py` - Only tested creation (1 feed per run)
- ❌ `test_feed_edit.py` - Only tested editing
- ❌ `test_feed_delete.py` - Only tested deletion

**New Consolidated Test**:

- ✅ `test_feed_crud.py` - Complete CRUD lifecycle with 2-scenario pattern
  - Scenario 1: Create/Edit first feed (empty list)
  - Scenario 2: Create/Edit second feed (populated list)
  - Delete both feeds + cleanup all sources
  - Tests both NEW and EXISTING user experiences
  - Verifies empty state restored at end

### Migration Guide

**Old Commands** (Removed from package.json):

```bash
npm run test:e2e:feed-creation  # ❌ REMOVED
npm run test:e2e:feed-edit      # ❌ REMOVED
npm run test:e2e:feed-delete    # ❌ REMOVED
```

**New Command** (Use this instead):

```bash
npm run test:e2e:feed-crud      # ✅ Tests complete CRUD lifecycle
```

### Why Consolidate?

**QA Recommendation**: Story 1.3.3 identified that separate tests didn't follow BMad's CRUD 2-scenario pattern.

**Benefits**:

- ✅ Tests both empty and populated list experiences
- ✅ Verifies data consistency across Create → View → Edit flow
- ✅ Validates immediate UI updates on deletion
- ✅ Proper cleanup (restores empty state)
- ✅ More realistic user journey (complete lifecycle)
- ✅ Easier maintenance (one file vs three)

---

## Directory Structure

```
tests/
├── e2e/
│   ├── auth/                    # Authentication flow tests
│   │   ├── test_subscriber_registration.py
│   │   ├── test_creator_registration.py
│   │   └── test_login.py
│   ├── creator/                 # Creator feature tests
│   │   ├── test_feed_crud.py        # CONSOLIDATED: Create/Edit/Delete feeds (2-scenario pattern)
│   │   ├── test_source_filtering.py
│   │   └── test_sources_page_only.py
│   ├── subscriber/              # Subscriber feature tests
│   │   ├── test_feed_discovery.py
│   │   └── test_subscription_management.py
│   └── shared/                  # Shared test utilities
│       └── test_utils.py        # Common helpers
└── screenshots/                 # Visual verification artifacts
    └── {feature}_*.png
```

---

## Quick Start

### Prerequisites

```bash
# 1. Install Python dependencies
pip install playwright
playwright install chromium

# 2. Ensure dev server is running
npm run dev
```

### Running Tests

```bash
# Run specific test
npm run test:e2e:subscriber-register

# Or run directly with Python
python tests/e2e/auth/test_subscriber_registration.py
```

---

## Creating New Tests

### Step 1: Identify Test Category

- **Authentication** → `tests/e2e/auth/`
- **Creator features** → `tests/e2e/creator/`
- **Subscriber features** → `tests/e2e/subscriber/`

### Step 2: Use BMad Task (Recommended)

```bash
# Activate dev agent
/dev

# Execute create-e2e-test task
*task create-e2e-test

# Follow interactive prompts
```

### Step 3: Manual Creation (Modern Template with TestHelper)

```python
"""
E2E Test: {Feature Name}

Tests: {What this tests}

User Flow:
1. {Step 1}
2. {Step 2}
...

Success Criteria:
- All operations verified with explicit assertions
- No false positives (test fails when feature breaks)
- Proper exit codes (0=success, 1=failure)
"""

from playwright.sync_api import sync_playwright
import sys
import os
import traceback

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from e2e.shared.test_utils import (
    TestHelper,
    generate_unique_email,
    take_screenshot,
    setup_console_logging,
    setup_network_logging,
    print_test_header,
    print_test_summary,
    verify_element_removed
)

def test_{feature_name}():
    """Test description with comprehensive verification"""

    # Generate unique test data
    test_data = generate_unique_email('prefix')

    print_test_header("TEST NAME", test_data=test_data)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # headless=True for CI
        page = browser.new_page()

        # Set up logging
        console_messages = setup_console_logging(page)
        api_requests, api_responses = setup_network_logging(page)

        try:
            # Login with full verification (MANDATORY)
            TestHelper.login_with_verification(page, "http://localhost:3000")

            # Navigate to feature page
            page.goto('http://localhost:3000/your-page')
            page.wait_for_load_state('networkidle')
            take_screenshot(page, 'step1_page_loaded')

            # Example: Click button with verification
            TestHelper.safe_click(page, "#action-button", "Action button")

            # Example: Verify element appeared
            TestHelper.verify_element_visible(page, "#result", "Result element")

            # Example: Wait for API call
            response = TestHelper.wait_for_api_call(page, "/api/data", [200, 201])

            # Example: Verify no errors
            TestHelper.verify_no_errors(page, console_messages, "after operation")

            print("\n✅✅✅ ALL TESTS PASSED")
            test_status = "PASSED"
            return 0  # Success

        except AssertionError as e:
            print(f"\n❌❌❌ TEST FAILED: {str(e)}")
            take_screenshot(page, f"failure-{int(time.time())}")
            traceback.print_exc()
            test_status = "FAILED"
            return 1  # Failure

        except Exception as e:
            print(f"\n❌❌❌ TEST CRASHED: {str(e)}")
            take_screenshot(page, f"crash-{int(time.time())}")
            traceback.print_exc()
            test_status = "FAILED"
            return 1  # Failure

        finally:
            print_test_summary(test_status, test_data=test_data)
            browser.close()

if __name__ == "__main__":
    exit_code = test_{feature_name}()
    sys.exit(exit_code)
```

**Key Improvements**:

- ✅ Uses `TestHelper` for all operations (prevents false positives)
- ✅ Proper exit codes (0=success, 1=failure)
- ✅ Explicit assertions at every step
- ✅ Automatic screenshots on failure
- ✅ Clear success/failure reporting

### Step 4: Add to package.json

```json
"scripts": {
  "test:e2e:{feature-name}": "python tests/e2e/{category}/test_{feature}.py"
}
```

---

## Shared Utilities

Import from `e2e.shared.test_utils`:

### TestHelper Class (Recommended - Prevents False Positives)

**CRITICAL**: Always use `TestHelper` methods instead of raw Playwright commands to prevent false positives!

```python
from e2e.shared.test_utils import TestHelper

# Login with full verification (MANDATORY)
TestHelper.login_with_verification(page, "http://localhost:3000")

# Click with verification
TestHelper.safe_click(page, "#button", "Button description")

# Verify element visibility
TestHelper.verify_element_visible(page, "#element", "Element description")
TestHelper.verify_element_not_visible(page, "#hidden", "Hidden element")

# Verify URL changes
TestHelper.verify_url_contains(page, "/feeds")
TestHelper.verify_url_not_contains(page, "/create")

# Verify text content
TestHelper.verify_text_content(page, "#message", "Success")

# Verify no errors
TestHelper.verify_no_errors(page, console_messages, "after save")

# Wait for API calls
response = TestHelper.wait_for_api_call(page, "/api/feeds", [200, 201])
```

### Specialized Helpers (Componentized Workflows)

```python
# Open create source dialog (adapts to context)
TestHelper.open_create_source_dialog(page, context="wizard")  # or "sources_page"

# Create source with full configuration
TestHelper.create_source_with_keywords(
    page,
    source_name="My Source",
    source_url="https://example.com/rss.xml",
    good_keywords=["AI", "tech"],
    bad_keywords=["spam"],
    relevance_score=85,
    sync_schedule="Daily"
)
```

### Data Generation

- `generate_unique_email(prefix)` - Unique email per run
- `generate_unique_username(prefix)` - Unique username
- `get_test_credentials()` - Get test account credentials from env

### Screenshots

- `take_screenshot(page, name, path='tests/screenshots')` - Capture screenshot (auto-captured on TestHelper failures)

### Logging

- `setup_console_logging(page)` - Capture browser console
- `setup_network_logging(page)` - Monitor API calls

### Legacy Helpers (Prefer TestHelper methods)

- `fill_form_field(page, field_id, value, step_number, field_name)` - Fill with logging
- `check_for_errors(page, console_messages)` - Find errors
- `print_test_header(test_name, **kwargs)` - Formatted header
- `print_test_summary(status, **kwargs)` - Formatted summary
- `print_api_calls(requests, responses)` - API details

### Verification Helpers

- `verify_element_removed(page, selector, description)` - Strong deletion verification
- `verify_api_call_succeeded(api_responses, url_pattern, expected_status)` - API verification

---

## Best Practices

### ⚠️ CRITICAL: Preventing False Positives

**MANDATORY**: Read `docs/e2e-test-improvements-guide.md` before writing tests!

**The Golden Rule**: If something can fail, it MUST be explicitly verified. Never assume success.

```python
# ❌ BAD - Implicit success (test passes even if action fails)
page.click("#delete-button")
page.wait_for_timeout(2000)
print("✓ Deleted")  # No verification!

# ✅ GOOD - Explicit verification with assertions
TestHelper.safe_click(page, "#delete-button", "Delete button")
verify_element_removed(page, f"#feed-{feed_id}", "Deleted feed")
TestHelper.verify_no_errors(page, console_messages, "after deletion")
```

### ✅ DO

- **Use TestHelper methods**: ALWAYS use `TestHelper.safe_click()`, `TestHelper.verify_*()` instead of raw Playwright
- **Verify login**: Use `TestHelper.login_with_verification()` - never assume login succeeded
- **Explicit assertions**: Every action must have verification (element visible, API succeeded, etc.)
- **Proper exit codes**: `sys.exit(0)` for success, `sys.exit(1)` for failure
- **API verification**: Use `TestHelper.wait_for_api_call()` or `verify_api_call_succeeded()`
- **Component reuse**: Use specialized helpers like `create_source_with_keywords()` when available
- **Generate unique data**: Use `generate_unique_email()` for each test
- **Use semantic selectors**: `input#email`, `button[type="submit"]`, `text="Success"`
- **Wait properly**: `page.wait_for_load_state('networkidle')`
- **Take screenshots**: Auto-captured by TestHelper, or use `take_screenshot()` manually
- **Monitor APIs**: Track request/response for validation
- **Test happy + sad paths**: Success scenarios AND error handling
- **Clear logging**: Print progress at each step
- **Verify CRUD data consistency**:
  - CREATE → VIEW/EDIT: Confirm all created data appears exactly the same when viewing/editing
  - DELETE → LIST: Verify item is immediately removed from the list after deletion
  - Use `verify_element_removed()` for strong deletion checks

### ❌ DON'T

- **Use raw Playwright commands**: `page.click()`, `is_visible()` without verification → use TestHelper instead
- **Skip login verification**: Never trust that login worked without checking
- **Assume operations succeeded**: Always verify with assertions
- **Return exit code 0 on failure**: Test failures must return exit code 1
- **Hardcode test data**: `email = 'test@test.com'` (fails on 2nd run)
- **Use CSS classes**: `.btn-primary-xyz` (brittle, changes often)
- **Arbitrary waits**: `wait_for_timeout(5000)` (slow, unreliable) - use `wait_for_load_state()` or API waits
- **Skip screenshots**: Debugging without visuals is painful (TestHelper auto-captures on failure)
- **Test in isolation**: Share utilities, avoid duplication
- **Ignore errors**: Always check console/API for issues
- **Duplicate code**: If you're doing the same thing in multiple tests, create a helper

---

## CRUD Testing Best Practices

### Critical Requirements for CRUD Operations

**MANDATORY**: CRUD features MUST use a **2-SCENARIO TEST PATTERN** that tests both empty-list and populated-list experiences:

**Why 2 Scenarios?**

- **Scenario 1**: Tests NEW user experience (empty list, "no items" UI)
- **Scenario 2**: Tests EXISTING user experience (populated list with items)
- **Goal**: Verify creation works from both states, list starts and ends empty

**Pattern Overview:**

1. **Scenario 1**: Create FIRST item (empty list) → View → Edit
2. **Scenario 2**: Create SECOND item (populated list) → View → Edit → DELETE second item
3. **Cleanup**: DELETE first item (and all remaining) to restore empty state

#### Scenario 1: NEW USER - First Item from Empty List

**Purpose**: Verify users can create their very first item when list is empty

```python
print("\n=== SCENARIO 1: Create First Item (Empty List) ===")

# Verify empty state UI
page.goto('http://localhost:3000/items')
page.wait_for_load_state('networkidle')
assert page.locator('text="No items yet"').is_visible()
take_screenshot(page, '01_empty_state')

# CREATE first item
first_item_data = {
    'title': f'First Test Item {timestamp}',
    'description': 'NEW user - Special chars: éàü & <>',
    'category': 'Technology'
}

page.click('button:has-text("Create")')
# Fill form with first_item_data...
page.click('button[type="submit"]')
page.wait_for_load_state('networkidle')

first_item_id = extract_id_from_url(page.url)

# VIEW/EDIT first item - Verify exact data match
page.goto(f'http://localhost:3000/items/{first_item_id}/edit')
assert page.locator('#title').input_value() == first_item_data['title']
assert page.locator('#description').input_value() == first_item_data['description']
# ... verify all fields ...

# Edit first item
first_item_data['title'] = f'EDITED {first_item_data["title"]}'
page.locator('#title').fill(first_item_data['title'])
page.click('button[type="submit"]')

print("✓ Scenario 1 Complete: NEW user can create from empty list")
```

#### Scenario 2: EXISTING USER - Second Item in Populated List

**Purpose**: Verify users can create additional items when list already has items

```python
print("\n=== SCENARIO 2: Create Second Item (Populated List) ===")

# Verify populated state (shows first item)
page.goto('http://localhost:3000/items')
page.wait_for_load_state('networkidle')
assert page.locator('.item-row').count() == 1
take_screenshot(page, '03_populated_list')

# CREATE second item
second_item_data = {
    'title': f'Second Test Item {timestamp}',
    'description': 'EXISTING user - More items',
    'category': 'Business'
}

page.click('button:has-text("Create")')
# Fill form with second_item_data...
page.click('button[type="submit"]')
page.wait_for_load_state('networkidle')

second_item_id = extract_id_from_url(page.url)

# Verify list shows 2 items
page.goto('http://localhost:3000/items')
assert page.locator('.item-row').count() == 2
take_screenshot(page, '04_two_items')

# VIEW/EDIT second item - Verify data
page.goto(f'http://localhost:3000/items/{second_item_id}/edit')
assert page.locator('#title').input_value() == second_item_data['title']
# ... verify all fields ...

# Edit second item
second_item_data['title'] = f'EDITED {second_item_data["title"]}'
page.locator('#title').fill(second_item_data['title'])
page.click('button[type="submit"]')

print("✓ Scenario 2 Complete: EXISTING user can create in populated list")
```

#### DELETE Verification + Cleanup

**Purpose**: Verify deletion removes items immediately, restore empty state

```python
print("\n=== DELETE: Remove Second Item ===")

page.goto('http://localhost:3000/items')
assert page.locator('.item-row').count() == 2

# Delete second item
page.locator(f'.item-row:has-text("{second_item_data["title"]}") button[data-testid="delete"]').click()
page.click('button:has-text("Confirm")')
page.wait_for_load_state('networkidle')

# Verify immediate removal
assert page.locator('.item-row').count() == 1
assert page.locator(f'text="{second_item_data["title"]}"').count() == 0
assert page.locator(f'text="{first_item_data["title"]}"').is_visible()

print("✓ Second item deleted")

# CLEANUP: Delete first item
print("\n=== CLEANUP: Remove First Item ===")

page.locator(f'.item-row:has-text("{first_item_data["title"]}") button[data-testid="delete"]').click()
page.click('button:has-text("Confirm")')
page.wait_for_load_state('networkidle')

# Verify empty state restored
assert page.locator('.item-row').count() == 0
assert page.locator('text="No items yet"').is_visible()
take_screenshot(page, '06_empty_state_restored')

print("✓ Cleanup complete: List returned to empty state")
```

**Common Pitfalls to Avoid**:

- ❌ Testing only one scenario (empty OR populated, not both)
- ❌ Not verifying empty state UI initially
- ❌ Not verifying populated state UI for second creation
- ❌ Not cleaning up (list not empty at end)
- ❌ Not testing special characters in text fields
- ❌ Not checking that DELETE updates the UI immediately
- ❌ Not testing all form fields, only some of them

---

## Troubleshooting

### Test Won't Start

**Problem**: `Connection refused` or `Page not found`
**Solution**: Ensure dev server is running: `npm run dev`

### Test Fails Intermittently

**Problem**: Flaky test, sometimes passes, sometimes fails
**Solution**:

- Replace `wait_for_timeout` with `wait_for_load_state('networkidle')`
- Use stable selectors (IDs, roles, not CSS classes)
- Add proper waits for API responses

### API Call Fails

**Problem**: Test fails on API request
**Solution**:

- Check `.env.local` has correct `NEXT_PUBLIC_API_URL`
- Verify backend is running (if local API)
- Review network logs in test output

### Screenshots Not Saved

**Problem**: No screenshot files created
**Solution**:

- Ensure `tests/screenshots/` exists: `mkdir -p tests/screenshots`
- Check write permissions
- Verify screenshot path in `take_screenshot()` call

---

## Test Requirements

### Mandatory for ALL UI Features

- [ ] E2E test exists in correct location
- [ ] Uses shared utilities
- [ ] Generates unique test data
- [ ] Happy path implemented
- [ ] At least one sad path tested
- [ ] Screenshots captured
- [ ] API monitoring included
- [ ] Added to package.json
- [ ] **Passes 2x consecutively**
- [ ] **CRUD tests use 2-scenario pattern** (Scenario 1: Empty list + Scenario 2: Populated list + Cleanup)
- [ ] Documented in story

### Quality Gates

**Dev Agent**:

- Cannot mark story "Ready for Review" without E2E test
- E2E test must pass 2x consecutively before handoff

**QA Agent**:

- **MUST independently execute and verify all E2E tests** before approving any feature
- **Never rely solely on test results from other agents** - always run tests yourself
- Must FAIL story if E2E test missing, broken, or flaky
- Verify test quality: TestHelper usage, explicit assertions, proper exit codes

---

## Resources

### 📖 Essential Reading (MANDATORY)

- **E2E Test Improvements Guide**: `docs/e2e-test-improvements-guide.md` ⭐ **READ THIS FIRST!**
  - Prevents false positives with explicit verification
  - TestHelper methods and best practices
  - Before/after examples showing common pitfalls

### 📚 Additional Documentation

- **Testing Strategy**: `docs/architecture/testing-strategy.md`
- **E2E Testing Checklist**: `.bmad-core/checklists/e2e-testing-checklist.md`
- **E2E Test Creation Task**: `.bmad-core/tasks/create-e2e-test.md`
- **Story DoD**: `.bmad-core/checklists/story-dod-checklist.md` (Section 4)
- **Test Utils Source**: `tests/e2e/shared/test_utils.py` - All helper methods

---

## CI/CD Integration

_Coming Soon_: E2E tests will run automatically on:

- Pull request creation
- Before merge to main
- Scheduled nightly runs

---

## Questions?

- Check testing strategy: `docs/architecture/testing-strategy.md`
- Use BMad task: `*task create-e2e-test` (with dev agent)
- Execute checklist: `*execute-checklist e2e-testing-checklist` (with QA agent)
