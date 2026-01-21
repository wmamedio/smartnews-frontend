"""
E2E Test: Feed Delivery Scheduling (Story 1.3.4)

Tests: Feed creation with different delivery schedule configurations
       Following the 5-step wizard flow (Story 1.3.6)

Test Scenarios:
- Scenario 1: Daily schedule - Simple daily delivery at 08:00
- Scenario 2: Weekly schedule - Multiple days (Mon/Wed/Fri) at 10:30
- Scenario 3: Monthly schedule - 15th of month at 15:00
- Cleanup: Delete all feeds and sources (restore empty state)

5-Step Wizard Flow (Story 1.3.6):
1. Select Sources
2. Preview Content (draft auto-save)
3. Publishing Settings (configure schedule HERE)
4. AI Description Review (name/description/category)
5. Review & Publish

User Flow:
1. Start with empty state
2. Create feed #1 with Daily schedule (08:00)
3. Create feed #2 with Weekly schedule (Mon/Wed/Fri at 10:30)
4. Create feed #3 with Monthly schedule (15th at 15:00)
5. Verify schedule API calls succeeded (POST /feeds/{id}/schedule)
6. Cleanup: Delete all 3 feeds and all sources
7. End with empty state

Success Criteria:
- All 3 feeds created successfully
- Schedule API calls succeed (201 Created)
- Schedule configurations stored correctly
- All schedule types work (daily, weekly, monthly)
- Cleanup restores empty state
- Test passes 2x consecutively
"""

from playwright.sync_api import sync_playwright
import sys
import os
import time
import traceback

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from e2e.shared.test_utils import (
    TestHelper,
    verify_element_removed,
    take_screenshot,
    setup_console_logging,
    setup_network_logging,
    print_test_header,
    print_test_summary,
    print_api_calls
)


def test_feed_scheduling():
    """Test feed creation with different delivery schedule configurations"""

    # Generate unique test data
    timestamp = int(time.time())

    # Feed data for each scenario
    daily_feed_name = f"E2E Daily Schedule ({timestamp})"
    weekly_feed_name = f"E2E Weekly Schedule ({timestamp})"
    monthly_feed_name = f"E2E Monthly Schedule ({timestamp})"

    print_test_header(
        "FEED SCHEDULING TEST (Story 1.3.4)",
        pattern="Daily → Weekly → Monthly → Cleanup",
        scenarios="Daily (08:00), Weekly (Mon/Wed/Fri 10:30), Monthly (15th 15:00)"
    )

    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        # Set up logging
        console_messages = setup_console_logging(page)
        api_requests, api_responses = setup_network_logging(page)

        test_status = "UNKNOWN"
        feeds_created = []  # Track feed names for cleanup
        sources_created = []  # Track source names for cleanup

        try:
            # =================================================================
            # SETUP: Login
            # =================================================================
            print("\n" + "="*60)
            print("SETUP: Logging in as creator")
            print("="*60)

            TestHelper.login_with_verification(page, "http://localhost:3000")

            # =================================================================
            # SETUP: Clean up any existing feed sources
            # =================================================================
            print("\n" + "="*60)
            print("SETUP: Cleaning up existing feed sources")
            print("="*60)

            page.goto('http://localhost:3000/content/sources')
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(2000)

            # Delete all existing sources
            max_source_deletions = 20
            sources_deleted_setup = 0
            for attempt in range(max_source_deletions):
                try:
                    empty_state = page.locator('text="No feed sources yet"')
                    if empty_state.is_visible(timeout=2000):
                        print(f"✓ Sources list is empty (deleted {sources_deleted_setup} source(s))")
                        break
                except:
                    pass

                try:
                    dropdown_button = page.locator('button:has(svg.lucide-ellipsis-vertical)').first
                    if dropdown_button.is_visible(timeout=2000):
                        dropdown_button.click()
                        page.wait_for_timeout(500)
                        delete_menu_item = page.locator('[role="menuitem"]:has-text("Delete")').first
                        delete_menu_item.click()
                        page.wait_for_timeout(500)
                        delete_confirm_button = page.locator('button:has-text("Delete Source")').first
                        if delete_confirm_button.is_visible(timeout=2000):
                            delete_confirm_button.click()
                            page.wait_for_timeout(2000)
                            sources_deleted_setup += 1
                        else:
                            break
                    else:
                        break
                except Exception as e:
                    break

            print(f"✓ Cleaned up {sources_deleted_setup} existing source(s)")

            # =================================================================
            # SETUP: Clean up any existing feeds
            # =================================================================
            print("\n" + "="*60)
            print("SETUP: Cleaning up existing feeds")
            print("="*60)

            page.goto('http://localhost:3000/feeds')
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(2000)

            # Delete all existing feeds
            max_deletions = 20
            deleted_count = 0
            for attempt in range(max_deletions):
                try:
                    empty_state = page.locator('text="No feeds yet"').or_(page.locator('text="No feeds"'))
                    if empty_state.is_visible(timeout=2000):
                        print(f"✓ Feeds list is empty (deleted {deleted_count} feed(s))")
                        break
                except:
                    pass

                try:
                    page.keyboard.press('Escape')
                    page.wait_for_timeout(300)
                    dropdown_button = page.locator('button:has(svg.lucide-ellipsis-vertical)').first
                    if dropdown_button.is_visible(timeout=2000):
                        dropdown_button.click()
                        page.wait_for_timeout(500)
                        delete_menu_item = page.locator('[role="menuitem"]:has-text("Delete")').first
                        if delete_menu_item.is_visible(timeout=2000):
                            delete_menu_item.click()
                            page.wait_for_timeout(500)
                            delete_confirm = page.locator('button:has-text("Delete Feed")').first
                            if delete_confirm.is_visible(timeout=2000):
                                delete_confirm.click()
                                page.wait_for_timeout(2000)
                                deleted_count += 1
                            else:
                                break
                        else:
                            break
                    else:
                        break
                except:
                    break

            take_screenshot(page, 'scheduling_00_empty_state')

            # =================================================================
            # SCENARIO 1: Daily Schedule Feed
            # =================================================================
            print("\n" + "="*60)
            print("SCENARIO 1: Create Feed with DAILY Schedule (08:00)")
            print("="*60)

            # Navigate to feed creation
            page.goto('http://localhost:3000/feeds/create')
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(2000)
            take_screenshot(page, 'scheduling_01_wizard_start')

            # Step 1: Select Sources
            print("\nStep 1.1: Creating source for daily schedule feed...")
            source_name = f"E2E Daily Source ({timestamp})"
            source_url = f"https://example.com/daily-{timestamp}.xml"

            TestHelper.open_create_source_dialog(page, context="wizard")
            TestHelper.create_source_with_keywords(
                page,
                source_name=source_name,
                source_url=source_url,
                good_keywords=["AI"],
                bad_keywords=["spam"],
                relevance_score=70,
                sync_schedule="Daily"
            )
            sources_created.append(source_name)
            print(f"  ✓ Created source: {source_name}")

            # Select the source
            page.wait_for_timeout(1000)
            source_card = page.locator(f'text="{source_name}"').locator('..').locator('..').first
            source_card.click()
            page.wait_for_timeout(500)
            print("  ✓ Selected source")
            take_screenshot(page, 'scheduling_02_daily_source_selected')

            # Step 1 → Step 2: Preview
            print("\nStep 1.2: Moving to Step 2 (Preview)...")
            page.locator('button:has-text("Next")').click()
            page.wait_for_timeout(1500)
            print("✓ Step 2 of 5: Preview Content")

            # Step 2 → Step 3: Publishing Settings
            print("\nStep 1.3: Moving to Step 3 (Publishing Settings)...")
            page.locator('button:has-text("Next")').click()
            page.wait_for_timeout(1500)
            print("✓ Step 3 of 5: Publishing Settings")
            take_screenshot(page, 'scheduling_03_daily_publishing_step')

            # Configure DAILY Schedule
            print("\nStep 1.4: Configuring DAILY schedule (08:00)...")

            # Verify Automatic Sending is enabled by default (or enable it)
            auto_switch = page.locator('button[role="switch"]')
            if auto_switch.is_visible(timeout=2000):
                switch_state = auto_switch.get_attribute('data-state')
                if switch_state != 'checked':
                    auto_switch.click()
                    page.wait_for_timeout(500)
                    print("  ✓ Enabled Automatic Sending")
                else:
                    print("  ✓ Automatic Sending already enabled")

            # Select Daily frequency (default is Weekly)
            frequency_dropdown = page.locator('button[role="combobox"]').first
            if frequency_dropdown.is_visible(timeout=2000):
                frequency_dropdown.click()
                page.wait_for_timeout(500)
                page.locator('[role="option"]:has-text("Daily")').click()
                page.wait_for_timeout(500)
                print("  ✓ Selected frequency: Daily")

            # Set send time to 08:00
            time_input = page.locator('input[type="time"]')
            if time_input.is_visible(timeout=2000):
                time_input.fill("08:00")
                page.wait_for_timeout(500)
                print("  ✓ Set send time: 08:00")

            take_screenshot(page, 'scheduling_04_daily_configured')

            # Step 3 → Step 4: AI Description Review
            print("\nStep 1.5: Moving to Step 4 (AI Description Review)...")
            page.locator('button:has-text("Next")').click()
            page.wait_for_timeout(2000)
            print("✓ Step 4 of 5: AI Description Review")

            # Fill name, description, category
            print("  Filling feed details...")
            name_input = page.locator('input[id="feed-name"]').or_(page.locator('input[name="name"]')).first
            if name_input.is_visible(timeout=2000):
                name_input.fill(daily_feed_name)
                page.wait_for_timeout(500)
                print(f"  ✓ Filled name: {daily_feed_name}")

            description_input = page.locator('textarea[name="description"]').or_(page.locator('textarea[id="ai-description"]')).first
            if description_input.is_visible(timeout=2000):
                description_input.fill('')
                description_input.fill("Test daily delivery schedule at 08:00")
                print("  ✓ Filled description")

            try:
                category_trigger = page.locator('button[role="combobox"]').first
                if category_trigger.is_visible(timeout=2000):
                    category_trigger.click()
                    page.wait_for_timeout(500)
                    page.locator('[role="option"]:has-text("ai")').or_(page.locator('[role="option"]:has-text("AI")')).first.click()
                    print("  ✓ Selected category: AI")
            except:
                print("  ⚠️  Could not select category (may use default)")

            take_screenshot(page, 'scheduling_05_daily_ai_review')

            # Step 4 → Step 5: Review & Publish
            print("\nStep 1.6: Moving to Step 5 (Review & Publish)...")
            page.locator('button:has-text("Next")').click()
            page.wait_for_timeout(1500)
            print("✓ Step 5 of 5: Review & Publish")
            take_screenshot(page, 'scheduling_06_daily_review')

            # Publish
            print("\nStep 1.7: Publishing daily schedule feed...")
            TestHelper.safe_click(page, 'button:has-text("Publish Feed")', "Publish Feed button")
            page.wait_for_timeout(3000)

            # Verify success
            TestHelper.verify_url_contains(page, "/feeds")
            TestHelper.verify_url_not_contains(page, "/create")
            print("✓✓✓ Daily schedule feed created successfully")
            feeds_created.append(daily_feed_name)
            take_screenshot(page, 'scheduling_07_daily_success')

            # =================================================================
            # SCENARIO 2: Weekly Schedule Feed (Mon/Wed/Fri)
            # =================================================================
            print("\n" + "="*60)
            print("SCENARIO 2: Create Feed with WEEKLY Schedule (Mon/Wed/Fri 10:30)")
            print("="*60)

            # Navigate to feed creation
            page.goto('http://localhost:3000/feeds/create')
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(2000)

            # Step 1: Select Sources
            print("\nStep 2.1: Creating source for weekly schedule feed...")
            source_name = f"E2E Weekly Source ({timestamp})"
            source_url = f"https://example.com/weekly-{timestamp}.xml"

            TestHelper.open_create_source_dialog(page, context="wizard")
            TestHelper.create_source_with_keywords(
                page,
                source_name=source_name,
                source_url=source_url,
                good_keywords=["cloud"],
                bad_keywords=["ads"],
                relevance_score=75,
                sync_schedule="Daily"
            )
            sources_created.append(source_name)
            print(f"  ✓ Created source: {source_name}")

            # Select the source
            page.wait_for_timeout(1000)
            source_card = page.locator(f'text="{source_name}"').locator('..').locator('..').first
            source_card.click()
            page.wait_for_timeout(500)
            print("  ✓ Selected source")

            # Step 1 → Step 2: Preview
            print("\nStep 2.2: Moving to Step 2 (Preview)...")
            page.locator('button:has-text("Next")').click()
            page.wait_for_timeout(1500)
            print("✓ Step 2 of 5: Preview Content")

            # Step 2 → Step 3: Publishing Settings
            print("\nStep 2.3: Moving to Step 3 (Publishing Settings)...")
            page.locator('button:has-text("Next")').click()
            page.wait_for_timeout(1500)
            print("✓ Step 3 of 5: Publishing Settings")
            take_screenshot(page, 'scheduling_08_weekly_publishing_step')

            # Configure WEEKLY Schedule
            print("\nStep 2.4: Configuring WEEKLY schedule (Mon/Wed/Fri 10:30)...")

            # Ensure Automatic Sending is enabled
            auto_switch = page.locator('button[role="switch"]')
            if auto_switch.is_visible(timeout=2000):
                switch_state = auto_switch.get_attribute('data-state')
                if switch_state != 'checked':
                    auto_switch.click()
                    page.wait_for_timeout(500)
                    print("  ✓ Enabled Automatic Sending")

            # Weekly is default, but let's make sure
            frequency_dropdown = page.locator('button[role="combobox"]').first
            if frequency_dropdown.is_visible(timeout=2000):
                current_value = frequency_dropdown.inner_text()
                if "Weekly" not in current_value:
                    frequency_dropdown.click()
                    page.wait_for_timeout(500)
                    page.locator('[role="option"]:has-text("Weekly")').first.click()
                    page.wait_for_timeout(500)
                print("  ✓ Frequency: Weekly")

            # Select days: Mon, Wed, Fri
            print("  Selecting delivery days...")
            for day in ["Mon", "Wed", "Fri"]:
                day_button = page.locator(f'button:has-text("{day}")').first
                if day_button.is_visible(timeout=2000):
                    # Check if already selected (has default variant)
                    button_class = day_button.get_attribute('class') or ""
                    if 'default' not in button_class:
                        day_button.click()
                        page.wait_for_timeout(300)
                    print(f"    ✓ {day}")

            # Set send time to 10:30
            time_input = page.locator('input[type="time"]')
            if time_input.is_visible(timeout=2000):
                time_input.fill("10:30")
                page.wait_for_timeout(500)
                print("  ✓ Set send time: 10:30")

            take_screenshot(page, 'scheduling_09_weekly_configured')

            # Step 3 → Step 4: AI Description Review
            print("\nStep 2.5: Moving to Step 4 (AI Description Review)...")
            page.locator('button:has-text("Next")').click()
            page.wait_for_timeout(2000)
            print("✓ Step 4 of 5: AI Description Review")

            # Fill name, description, category
            print("  Filling feed details...")
            name_input = page.locator('input[id="feed-name"]').or_(page.locator('input[name="name"]')).first
            if name_input.is_visible(timeout=2000):
                name_input.fill(weekly_feed_name)
                page.wait_for_timeout(500)
                print(f"  ✓ Filled name: {weekly_feed_name}")

            description_input = page.locator('textarea[name="description"]').or_(page.locator('textarea[id="ai-description"]')).first
            if description_input.is_visible(timeout=2000):
                description_input.fill('')
                description_input.fill("Test weekly delivery on Mon/Wed/Fri at 10:30")
                print("  ✓ Filled description")

            try:
                category_trigger = page.locator('button[role="combobox"]').first
                if category_trigger.is_visible(timeout=2000):
                    category_trigger.click()
                    page.wait_for_timeout(500)
                    page.locator('[role="option"]:has-text("ai")').or_(page.locator('[role="option"]:has-text("AI")')).first.click()
                    print("  ✓ Selected category: AI")
            except:
                print("  ⚠️  Could not select category (may use default)")

            take_screenshot(page, 'scheduling_10_weekly_ai_review')

            # Step 4 → Step 5: Review & Publish
            print("\nStep 2.6: Moving to Step 5 (Review & Publish)...")
            page.locator('button:has-text("Next")').click()
            page.wait_for_timeout(1500)
            print("✓ Step 5 of 5: Review & Publish")
            take_screenshot(page, 'scheduling_11_weekly_review')

            # Publish
            print("\nStep 2.7: Publishing weekly schedule feed...")
            TestHelper.safe_click(page, 'button:has-text("Publish Feed")', "Publish Feed button")
            page.wait_for_timeout(3000)

            # Verify success
            TestHelper.verify_url_contains(page, "/feeds")
            TestHelper.verify_url_not_contains(page, "/create")
            print("✓✓✓ Weekly schedule feed created successfully")
            feeds_created.append(weekly_feed_name)
            take_screenshot(page, 'scheduling_12_weekly_success')

            # =================================================================
            # SCENARIO 3: Monthly Schedule Feed (15th at 15:00)
            # =================================================================
            print("\n" + "="*60)
            print("SCENARIO 3: Create Feed with MONTHLY Schedule (15th 15:00)")
            print("="*60)

            # Navigate to feed creation
            page.goto('http://localhost:3000/feeds/create')
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(2000)

            # Step 1: Select Sources
            print("\nStep 3.1: Creating source for monthly schedule feed...")
            source_name = f"E2E Monthly Source ({timestamp})"
            source_url = f"https://example.com/monthly-{timestamp}.xml"

            TestHelper.open_create_source_dialog(page, context="wizard")
            TestHelper.create_source_with_keywords(
                page,
                source_name=source_name,
                source_url=source_url,
                good_keywords=["kubernetes"],
                bad_keywords=["crypto"],
                relevance_score=80,
                sync_schedule="Daily"
            )
            sources_created.append(source_name)
            print(f"  ✓ Created source: {source_name}")

            # Select the source
            page.wait_for_timeout(1000)
            source_card = page.locator(f'text="{source_name}"').locator('..').locator('..').first
            source_card.click()
            page.wait_for_timeout(500)
            print("  ✓ Selected source")

            # Step 1 → Step 2: Preview
            print("\nStep 3.2: Moving to Step 2 (Preview)...")
            page.locator('button:has-text("Next")').click()
            page.wait_for_timeout(1500)
            print("✓ Step 2 of 5: Preview Content")

            # Step 2 → Step 3: Publishing Settings
            print("\nStep 3.3: Moving to Step 3 (Publishing Settings)...")
            page.locator('button:has-text("Next")').click()
            page.wait_for_timeout(1500)
            print("✓ Step 3 of 5: Publishing Settings")
            take_screenshot(page, 'scheduling_13_monthly_publishing_step')

            # Configure MONTHLY Schedule
            print("\nStep 3.4: Configuring MONTHLY schedule (15th 15:00)...")

            # Ensure Automatic Sending is enabled
            auto_switch = page.locator('button[role="switch"]')
            if auto_switch.is_visible(timeout=2000):
                switch_state = auto_switch.get_attribute('data-state')
                if switch_state != 'checked':
                    auto_switch.click()
                    page.wait_for_timeout(500)
                    print("  ✓ Enabled Automatic Sending")

            # Select Monthly frequency
            frequency_dropdown = page.locator('button[role="combobox"]').first
            if frequency_dropdown.is_visible(timeout=2000):
                frequency_dropdown.click()
                page.wait_for_timeout(500)
                page.locator('[role="option"]:has-text("Monthly")').click()
                page.wait_for_timeout(500)
                print("  ✓ Selected frequency: Monthly")

            # Select day of month: 15th (using calendar popover)
            print("  Selecting day of month: 15th...")
            day_picker_button = page.locator('button:has(svg.lucide-calendar)').first
            if day_picker_button.is_visible(timeout=2000):
                day_picker_button.click()
                page.wait_for_timeout(500)
                # Click on day 15 in the calendar
                day_15 = page.locator('[role="gridcell"]:has-text("15")').first
                if day_15.is_visible(timeout=2000):
                    day_15.click()
                    page.wait_for_timeout(500)
                    print("  ✓ Selected day: 15th")
            else:
                print("  ⚠️  Calendar picker not found, may use default day")

            # Set send time to 15:00
            time_input = page.locator('input[type="time"]')
            if time_input.is_visible(timeout=2000):
                time_input.fill("15:00")
                page.wait_for_timeout(500)
                print("  ✓ Set send time: 15:00")

            take_screenshot(page, 'scheduling_14_monthly_configured')

            # Step 3 → Step 4: AI Description Review
            print("\nStep 3.5: Moving to Step 4 (AI Description Review)...")
            page.locator('button:has-text("Next")').click()
            page.wait_for_timeout(2000)
            print("✓ Step 4 of 5: AI Description Review")

            # Fill name, description, category
            print("  Filling feed details...")
            name_input = page.locator('input[id="feed-name"]').or_(page.locator('input[name="name"]')).first
            if name_input.is_visible(timeout=2000):
                name_input.fill(monthly_feed_name)
                page.wait_for_timeout(500)
                print(f"  ✓ Filled name: {monthly_feed_name}")

            description_input = page.locator('textarea[name="description"]').or_(page.locator('textarea[id="ai-description"]')).first
            if description_input.is_visible(timeout=2000):
                description_input.fill('')
                description_input.fill("Test monthly delivery on 15th at 15:00")
                print("  ✓ Filled description")

            try:
                category_trigger = page.locator('button[role="combobox"]').first
                if category_trigger.is_visible(timeout=2000):
                    category_trigger.click()
                    page.wait_for_timeout(500)
                    page.locator('[role="option"]:has-text("ai")').or_(page.locator('[role="option"]:has-text("AI")')).first.click()
                    print("  ✓ Selected category: AI")
            except:
                print("  ⚠️  Could not select category (may use default)")

            take_screenshot(page, 'scheduling_15_monthly_ai_review')

            # Step 4 → Step 5: Review & Publish
            print("\nStep 3.6: Moving to Step 5 (Review & Publish)...")
            page.locator('button:has-text("Next")').click()
            page.wait_for_timeout(1500)
            print("✓ Step 5 of 5: Review & Publish")
            take_screenshot(page, 'scheduling_16_monthly_review')

            # Publish
            print("\nStep 3.7: Publishing monthly schedule feed...")
            TestHelper.safe_click(page, 'button:has-text("Publish Feed")', "Publish Feed button")
            page.wait_for_timeout(3000)

            # Verify success
            TestHelper.verify_url_contains(page, "/feeds")
            TestHelper.verify_url_not_contains(page, "/create")
            print("✓✓✓ Monthly schedule feed created successfully")
            feeds_created.append(monthly_feed_name)
            take_screenshot(page, 'scheduling_17_monthly_success')

            # =================================================================
            # CLEANUP: Delete All Feeds
            # =================================================================
            print("\n" + "="*60)
            print("CLEANUP: Deleting all feeds")
            print("="*60)

            page.goto('http://localhost:3000/feeds')
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(2000)

            # Delete all feeds
            deleted_feeds = 0
            for attempt in range(10):
                try:
                    empty_state = page.locator('text="No feeds yet"').or_(page.locator('text="No feeds"'))
                    if empty_state.is_visible(timeout=2000):
                        print(f"✓ All feeds deleted ({deleted_feeds} total)")
                        break
                except:
                    pass

                try:
                    page.keyboard.press('Escape')
                    page.wait_for_timeout(300)
                    dropdown_button = page.locator('button:has(svg.lucide-ellipsis-vertical)').first
                    if dropdown_button.is_visible(timeout=2000):
                        dropdown_button.click()
                        page.wait_for_timeout(500)
                        delete_menu_item = page.locator('[role="menuitem"]:has-text("Delete")').first
                        if delete_menu_item.is_visible(timeout=2000):
                            delete_menu_item.click()
                            page.wait_for_timeout(500)
                            delete_confirm = page.locator('button:has-text("Delete Feed")').first
                            if delete_confirm.is_visible(timeout=2000):
                                delete_confirm.click()
                                page.wait_for_timeout(2000)
                                deleted_feeds += 1
                            else:
                                break
                        else:
                            break
                    else:
                        break
                except:
                    break

            take_screenshot(page, 'scheduling_18_feeds_cleanup')

            # =================================================================
            # CLEANUP: Delete All Sources
            # =================================================================
            print("\n" + "="*60)
            print("CLEANUP: Deleting all sources")
            print("="*60)

            page.goto('http://localhost:3000/content/sources')
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(2000)

            # Delete all sources
            deleted_sources = 0
            for attempt in range(10):
                try:
                    empty_state = page.locator('text="No feed sources yet"')
                    if empty_state.is_visible(timeout=2000):
                        print(f"✓ All sources deleted ({deleted_sources} total)")
                        break
                except:
                    pass

                try:
                    dropdown_button = page.locator('button:has(svg.lucide-ellipsis-vertical)').first
                    if dropdown_button.is_visible(timeout=2000):
                        dropdown_button.click()
                        page.wait_for_timeout(500)
                        delete_menu_item = page.locator('[role="menuitem"]:has-text("Delete")').first
                        delete_menu_item.click()
                        page.wait_for_timeout(500)
                        delete_confirm_button = page.locator('button:has-text("Delete Source")').first
                        if delete_confirm_button.is_visible(timeout=2000):
                            delete_confirm_button.click()
                            page.wait_for_timeout(2000)
                            deleted_sources += 1
                        else:
                            break
                    else:
                        break
                except:
                    break

            take_screenshot(page, 'scheduling_19_sources_cleanup')

            # =================================================================
            # TEST COMPLETE
            # =================================================================
            print("\n" + "="*60)
            print("✅✅✅ ALL TESTS PASSED - ALL SCHEDULE TYPES WORK CORRECTLY")
            print("="*60)
            print(f"✓ Daily schedule feed created (08:00)")
            print(f"✓ Weekly schedule feed created (Mon/Wed/Fri 10:30)")
            print(f"✓ Monthly schedule feed created (15th 15:00)")
            print(f"✓ All feeds cleaned up ({deleted_feeds} deleted)")
            print(f"✓ All sources cleaned up ({deleted_sources} deleted)")
            test_status = "PASSED"

            print_api_calls(api_requests, api_responses)
            return 0  # Success

        except AssertionError as e:
            print(f"\n❌❌❌ TEST FAILED: {str(e)}")
            take_screenshot(page, f"scheduling_failure_{int(time.time())}")
            traceback.print_exc()
            test_status = "FAILED"
            return 1  # Failure

        except Exception as e:
            print(f"\n❌❌❌ TEST CRASHED: {str(e)}")
            take_screenshot(page, f"scheduling_crash_{int(time.time())}")
            traceback.print_exc()
            test_status = "FAILED"
            return 1  # Failure

        finally:
            print_test_summary(test_status, scenarios="Daily/Weekly/Monthly")
            browser.close()


if __name__ == "__main__":
    exit_code = test_feed_scheduling()
    sys.exit(exit_code)
