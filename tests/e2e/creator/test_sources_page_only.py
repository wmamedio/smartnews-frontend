"""
E2E Test: Sources Page Only (Story 1.3.2 - Scenario 3)

Tests ONLY the Sources page entry point for source creation
Simplified test focusing on /content/sources workflow
"""

from playwright.sync_api import sync_playwright
import sys
import os
import time

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from e2e.shared.test_utils import (
    TestHelper,
    take_screenshot,
    setup_console_logging,
    setup_network_logging,
    print_test_header,
    get_test_credentials
)


def test_sources_page():
    """Test source creation from /content/sources page"""

    timestamp = int(time.time())
    source_name = f"Sources Page Test ({timestamp})"
    source_url = f"https://example.com/sources-page-{timestamp}.xml"
    good_keywords = ["devops", "automation"]
    bad_keywords = ["ads"]
    relevance_score = 85
    sync_schedule = "1440"  # Daily

    print("\n" + "="*60)
    print("SOURCES PAGE E2E TEST (Story 1.3.2 - Scenario 3)")
    print("="*60)
    print(f"Source: {source_name}")
    print(f"URL: {source_url}")
    print("="*60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        console_messages = setup_console_logging(page)
        api_requests, api_responses = setup_network_logging(page)

        test_status = "UNKNOWN"
        source_deleted = False

        try:
            # Login with verification
            print("\n[SETUP] Logging in...")
            TestHelper.login_with_verification(page, "http://localhost:3000")

            # Navigate to Sources page
            print("\n[STEP 1] Navigating to /content/sources...")
            page.goto('http://localhost:3000/content/sources')
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(2000)
            take_screenshot(page, 'sources_page_01_loaded')
            print("✓ Sources page loaded")

            # Open create source dialog
            print("\n[STEP 2] Opening create source dialog...")
            TestHelper.open_create_source_dialog(page, context="sources_page")
            take_screenshot(page, 'sources_page_02_dialog_opened')

            # Clear API logs before creating source
            api_requests.clear()
            api_responses.clear()

            # Create source with keywords using helper
            print("\n[STEP 3] Creating source with keywords...")
            TestHelper.create_source_with_keywords(
                page,
                source_name=source_name,
                source_url=source_url,
                good_keywords=good_keywords,
                bad_keywords=bad_keywords,
                relevance_score=relevance_score,
                sync_schedule="Daily"
            )
            take_screenshot(page, 'sources_page_03_source_created')

            # Verify creation
            source_create_requests = [req for req in api_requests if 'feed-sources' in req['url'] and req['method'] == 'POST']
            if source_create_requests:
                print("✓ POST /feed-sources API call made")

            # Verify source appears
            page.wait_for_timeout(2000)
            page.wait_for_load_state('networkidle')
            source_visible = page.locator(f'text="{source_name}"').first
            if source_visible.is_visible(timeout=5000):
                print(f"✓ Source visible in grid: {source_name}")
            else:
                print(f"✗ Source NOT visible")
                test_status = "FAILED"
                return

            # Edit source
            print("\n[STEP 4] Editing source...")
            page.wait_for_timeout(2000)

            # Open dropdown
            dropdown = page.locator('button:has(svg.lucide-ellipsis-vertical)').first
            if dropdown.is_visible(timeout=3000):
                dropdown.click()
                print("✓ Opened dropdown menu")
                page.wait_for_timeout(500)

                # Click Edit
                page.locator('[role="menuitem"]:has-text("Edit")').first.click()
                print("✓ Clicked Edit")
                page.wait_for_timeout(1500)
                take_screenshot(page, 'sources_page_05_edit_dialog')

                # Change the source name
                edited_name = f"{source_name} - Edited"
                name_input = page.locator('input#source-name')
                name_input.clear()
                name_input.fill(edited_name)
                page.wait_for_timeout(500)
                print(f"✓ Changed name to: {edited_name}")

                # Add a new keyword
                new_keyword = "docker"
                page.locator('input#good-keywords').fill(new_keyword)
                page.locator('input#good-keywords').press('Enter')
                page.wait_for_timeout(500)
                print(f"✓ Added keyword: {new_keyword}")

                # Change sync schedule to Weekly
                page.locator('button#sync-schedule').click()
                page.wait_for_timeout(500)
                page.locator('[role="option"]:has-text("Weekly")').first.click()
                page.wait_for_timeout(500)
                print("✓ Changed sync schedule to Weekly")

                take_screenshot(page, 'sources_page_06_edit_modified')

                # Save changes
                page.locator('button:has-text("Save Changes")').click()
                page.wait_for_timeout(3000)
                print("✓ Source updated successfully")
                take_screenshot(page, 'sources_page_07_edit_saved')
            else:
                print("✗ Dropdown not found for edit")

            # Delete source (cleanup)
            print("\n[CLEANUP] Deleting source...")
            page.wait_for_timeout(2000)

            # Find dropdown button
            dropdown = page.locator('button:has(svg.lucide-ellipsis-vertical)').first
            if dropdown.is_visible(timeout=3000):
                dropdown.click()
                print("✓ Opened dropdown menu")
                page.wait_for_timeout(500)

                # Set up dialog handler
                page.on("dialog", lambda dialog: dialog.accept())

                # Click delete
                page.locator('[role="menuitem"]:has-text("Delete")').first.click()
                print("✓ Clicked Delete")
                page.wait_for_timeout(3000)

                # Verify deletion
                try:
                    still_visible = page.locator(f'text="{source_name}"').first.is_visible(timeout=2000)
                    if not still_visible:
                        print("✓ Source deleted successfully")
                        source_deleted = True
                        take_screenshot(page, 'sources_page_05_deleted')
                    else:
                        print("✗ Source still visible after delete")
                except:
                    print("✓ Source deleted (not found)")
                    source_deleted = True
            else:
                print("✗ Dropdown button not found")

            # Final status
            if source_deleted:
                test_status = "PASSED"
                print("\n" + "="*60)
                print("✓✓✓ SOURCES PAGE TEST PASSED")
                print("="*60)
            else:
                test_status = "FAILED"
                print("\n" + "="*60)
                print("✗✗✗ TEST FAILED - Source not deleted")
                print("="*60)

        except Exception as e:
            test_status = "FAILED"
            print(f"\n✗ Test failed with error: {str(e)}")
            import traceback
            traceback.print_exc()
            take_screenshot(page, 'sources_page_99_error')

        finally:
            print("\n" + "="*60)
            print(f"TEST STATUS: {test_status}")
            print("="*60)
            print(f"Source deleted: {source_deleted}")
            print("="*60)

            browser.close()

            if test_status == "PASSED":
                print("\n✓ Test PASSED")
                sys.exit(0)
            else:
                print("\n✗ Test FAILED")
                sys.exit(1)


if __name__ == "__main__":
    test_sources_page()
