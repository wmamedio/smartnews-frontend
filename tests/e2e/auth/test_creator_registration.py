"""
E2E Test: Creator Registration

Tests: Create a test creator account for E2E testing

User Flow:
1. Navigate to creator registration page
2. Fill registration form (firstName, lastName, email, password, confirmPassword)
3. Accept terms and conditions
4. Submit form
5. Verify successful registration

Success Criteria:
- Creator account created successfully
- Can be used for subsequent E2E tests
"""

from playwright.sync_api import sync_playwright
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from e2e.shared.test_utils import (
    take_screenshot,
    setup_console_logging,
    setup_network_logging,
    print_test_header,
    print_test_summary,
    get_test_credentials
)


def test_create_creator_account():
    """Create a test creator account"""

    # Get credentials from environment
    test_email, test_password = get_test_credentials()
    test_first_name = "Test"
    test_last_name = "Creator"

    print_test_header(
        "CREATE TEST CREATOR ACCOUNT",
        test_email=test_email,
        test_password=test_password
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

        try:
            # Step 1: Navigate to creator registration page
            print("\nStep 1: Navigating to creator registration page...")
            page.goto('http://localhost:3000/register/creator')
            page.wait_for_load_state('networkidle')
            take_screenshot(page, 'creator_registration_step1_loaded')
            print("✓ Registration page loaded successfully")

            # Verify page title
            heading = page.locator('h1:has-text("Create a Creator Account"), h1:has-text("Creator")')
            if heading.is_visible():
                print("✓ Correct registration page confirmed")
            else:
                print("⚠️  Warning: Page heading not found")

            # Step 2: Fill form fields
            print("\nStep 2: Filling in First Name...")
            page.locator('input#firstName').fill(test_first_name)
            print(f"✓ First Name filled: {test_first_name}")

            print("\nStep 3: Filling in Last Name...")
            page.locator('input#lastName').fill(test_last_name)
            print(f"✓ Last Name filled: {test_last_name}")

            print("\nStep 4: Filling in Email...")
            page.locator('input#email').fill(test_email)
            print(f"✓ Email filled: {test_email}")

            print("\nStep 5: Filling in Password...")
            page.locator('input#password').fill(test_password)
            print(f"✓ Password filled: {test_password}")

            # Wait for password strength indicator
            page.wait_for_timeout(500)
            take_screenshot(page, 'creator_registration_step2_password_strength')

            # Check password strength
            strength_indicator = page.locator('text=/Password Strength:/i')
            if strength_indicator.is_visible():
                print("✓ Password strength indicator displayed")

            # Step 6: Fill confirm password
            print("\nStep 6: Filling in Confirm Password...")
            page.locator('input#confirmPassword').fill(test_password)
            print(f"✓ Confirm Password filled: {test_password}")

            # Step 7: Accept Terms
            print("\nStep 7: Accepting terms and conditions...")
            terms_checkbox = page.locator('button#terms')  # Shadcn checkbox is a button
            terms_checkbox.click()
            page.wait_for_timeout(300)
            print("✓ Terms checkbox checked")

            # Take screenshot before submission
            take_screenshot(page, 'creator_registration_step3_form_filled')
            print("✓ Screenshot taken: Form filled and ready")

            # Step 8: Submit the form
            print("\nStep 8: Submitting registration form...")
            submit_button = page.locator('button[type="submit"]:has-text("Create Creator Account"), button[type="submit"]:has-text("Create Account")')
            submit_button.click()
            print("✓ Form submitted")

            # Wait for response (either success redirect or error)
            page.wait_for_timeout(3000)

            # Step 9: Check for errors
            print("\nStep 9: Checking for response...")
            error_alert = page.locator('[role="alert"]')

            if error_alert.is_visible():
                error_text = error_alert.text_content()

                # Check if account already exists
                if 'already exists' in error_text.lower() or 'already registered' in error_text.lower():
                    print(f"\n✓ Account already exists: {test_email}")
                    print("This is OK - account is ready for testing")
                    test_status = "PASSED - Account exists"
                else:
                    print(f"\n✗ REGISTRATION ERROR: {error_text}")
                    take_screenshot(page, 'creator_registration_step4_error')
                    test_status = "FAILED - Error displayed"
            else:
                print("✓ No error alert visible")

            # Check current URL
            current_url = page.url
            print(f"\nCurrent URL: {current_url}")

            if '/dashboard' in current_url or '/feeds' in current_url:
                print("✓✓✓ SUCCESS! Creator account registered and logged in")
                take_screenshot(page, 'creator_registration_step5_success')
                test_status = "PASSED - Account created successfully"
            elif current_url == 'http://localhost:3000/register/creator':
                if test_status != "PASSED - Account exists":
                    print("⚠️  Still on registration page")
                    take_screenshot(page, 'creator_registration_step5_still_on_page')
                    if test_status == "UNKNOWN":
                        test_status = "FAILED - No redirect"
            else:
                print(f"? Redirected to: {current_url}")
                take_screenshot(page, 'creator_registration_step5_unexpected')
                if test_status == "UNKNOWN":
                    test_status = "UNKNOWN - Unexpected redirect"

        except Exception as e:
            print(f"\n✗ TEST FAILED WITH EXCEPTION: {str(e)}")
            take_screenshot(page, 'creator_registration_error_exception')
            test_status = "FAILED - Exception occurred"
            import traceback
            traceback.print_exc()

        finally:
            print_test_summary(
                test_status,
                test_email=test_email,
                final_url=page.url
            )
            browser.close()


if __name__ == "__main__":
    test_create_creator_account()
