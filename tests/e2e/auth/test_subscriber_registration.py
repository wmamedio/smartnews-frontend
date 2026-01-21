"""
E2E Test: Subscriber Registration

Tests: Complete subscriber registration flow with email/password authentication

User Flow:
1. Navigate to subscriber registration page
2. Fill registration form (firstName, lastName, email, password, confirmPassword)
3. Accept terms and conditions
4. Submit form
5. Verify successful registration and redirect to subscriber portal

Success Criteria:
- All form fields accept valid input
- Password strength indicator displays
- Form submission succeeds
- API calls to /auth/register and /auth/login return 200
- User redirected to /subscriber/portal
"""

from playwright.sync_api import sync_playwright
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from e2e.shared.test_utils import (
    generate_unique_email,
    take_screenshot,
    setup_console_logging,
    setup_network_logging,
    print_test_header,
    print_test_summary,
    print_api_calls,
    check_for_errors,
    fill_form_field
)


def test_subscriber_registration():
    """Test subscriber registration with email/password"""

    # Generate unique test data
    test_email = generate_unique_email('subscriber')
    test_password = "TestPass123!@#"
    test_first_name = "Test"
    test_last_name = "Subscriber"

    print_test_header(
        "SUBSCRIBER REGISTRATION TEST",
        test_email=test_email,
        test_password=test_password
    )

    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Set up logging
        console_messages = setup_console_logging(page)
        api_requests, api_responses = setup_network_logging(page)

        test_status = "UNKNOWN"

        try:
            # Step 1: Navigate to registration page
            print("Step 1: Navigating to subscriber registration page...")
            page.goto('http://localhost:3000/register/subscriber')
            page.wait_for_load_state('networkidle')
            take_screenshot(page, 'subscriber_registration_step1_loaded')
            print("✓ Registration page loaded successfully")

            # Verify page title
            heading = page.locator('h1:has-text("Create a Subscriber Account")')
            if heading.is_visible():
                print("✓ Correct registration page confirmed")
            else:
                print("✗ Warning: Page heading not found")

            # Step 2-5: Fill form fields
            fill_form_field(page, 'firstName', test_first_name, 2, 'First Name')
            fill_form_field(page, 'lastName', test_last_name, 3, 'Last Name')
            fill_form_field(page, 'email', test_email, 4, 'Email')
            fill_form_field(page, 'password', test_password, 5, 'Password')

            # Wait for password strength indicator
            page.wait_for_timeout(500)
            take_screenshot(page, 'subscriber_registration_step2_password_strength')

            # Check password strength
            strength_indicator = page.locator('text=/Password Strength:/i')
            if strength_indicator.is_visible():
                print("✓ Password strength indicator displayed")

            # Step 6: Fill confirm password
            fill_form_field(page, 'confirmPassword', test_password, 6, 'Confirm Password')

            # Step 7: Accept Terms
            print("\nStep 7: Accepting terms and conditions...")
            terms_checkbox = page.locator('button#terms')  # Shadcn checkbox is a button
            terms_checkbox.click()
            page.wait_for_timeout(300)
            print("✓ Terms checkbox checked")

            # Take screenshot before submission
            take_screenshot(page, 'subscriber_registration_step3_form_filled')
            print("✓ Screenshot taken: Form filled and ready")

            # Step 8: Submit the form
            print("\nStep 8: Submitting registration form...")
            submit_button = page.locator('button[type="submit"]:has-text("Create Subscriber Account")')
            submit_button.click()
            print("✓ Form submitted")

            # Wait for response (either success redirect or error)
            page.wait_for_timeout(3000)

            # Step 9: Check for errors
            print("\nStep 9: Checking for response...")
            error_alert = page.locator('[role="alert"]')

            if error_alert.is_visible():
                error_text = error_alert.text_content()
                print(f"\n✗ REGISTRATION ERROR: {error_text}")
                take_screenshot(page, 'subscriber_registration_step4_error')
                test_status = "FAILED - Error displayed"
            else:
                print("✓ No error alert visible")

            # Check current URL
            current_url = page.url
            print(f"\nCurrent URL: {current_url}")

            if '/subscriber/portal' in current_url:
                print("✓✓✓ SUCCESS! User registered and redirected to subscriber portal")
                take_screenshot(page, 'subscriber_registration_step5_success_portal')
                test_status = "PASSED - Successful registration"
            elif current_url == 'http://localhost:3000/register/subscriber':
                print("⚠️  Still on registration page")
                take_screenshot(page, 'subscriber_registration_step5_still_on_page')
                test_status = "FAILED - No redirect"
            else:
                print(f"? Redirected to: {current_url}")
                take_screenshot(page, 'subscriber_registration_step5_unexpected')
                test_status = "UNKNOWN - Unexpected redirect"

            # Step 10: Check for validation errors
            print("\nStep 10: Checking for validation errors...")
            errors = check_for_errors(page, console_messages)
            if errors:
                print(f"Found {len(errors)} error(s):")
                for error in errors:
                    print(f"  - {error}")
                if test_status == "PASSED - Successful registration":
                    test_status = "PASSED WITH WARNINGS"
            else:
                print("✓ No validation errors found")

            # Print API calls
            print_api_calls(api_requests, api_responses)

            # Print console errors if any
            error_logs = [msg for msg in console_messages if 'error' in msg.lower()]
            if error_logs:
                print(f"\n{'='*60}")
                print("BROWSER CONSOLE ERRORS:")
                print(f"{'='*60}")
                for msg in error_logs:
                    print(msg)

        except Exception as e:
            print(f"\n✗ TEST FAILED WITH EXCEPTION: {str(e)}")
            take_screenshot(page, 'subscriber_registration_error_exception')
            test_status = "FAILED - Exception occurred"
            raise

        finally:
            print_test_summary(
                test_status,
                test_email=test_email,
                test_password=test_password,
                final_url=page.url
            )
            browser.close()


if __name__ == "__main__":
    test_subscriber_registration()
