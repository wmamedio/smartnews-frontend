"""
Shared utilities for E2E tests with robust verification
"""
import time
import random
import string
import os
import sys
import traceback
from pathlib import Path
from playwright.sync_api import Page, expect, Response

def load_env_file(env_file: str = ".env.local") -> dict:
    """Load environment variables from .env.local file"""
    env_vars = {}
    project_root = Path(__file__).parent.parent.parent.parent
    env_path = project_root / env_file

    if env_path.exists():
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip()

    return env_vars

def get_test_credentials(with_content: bool = False) -> tuple:
    """
    Get test creator credentials from environment variables.

    Args:
        with_content: If True, returns credentials for account WITH content (feeds, sources, library items).
                     If False (default), returns credentials for EMPTY account (clean state testing).

    Returns:
        tuple: (email, password)

    Usage:
        # For empty state testing (CRUD, new user flows)
        email, password = get_test_credentials()

        # For content-rich testing (filters, preview, library)
        email, password = get_test_credentials(with_content=True)
    """
    # Load from .env.local
    env_vars = load_env_file()

    if with_content:
        # Account WITH content - for testing filters, library, preview, etc.
        email = os.getenv('TEST_CREATOR_WITH_CONTENT_EMAIL') or env_vars.get('TEST_CREATOR_WITH_CONTENT_EMAIL', 'creator_with_content@test.com')
        password = os.getenv('TEST_CREATOR_WITH_CONTENT_PASSWORD') or env_vars.get('TEST_CREATOR_WITH_CONTENT_PASSWORD', 'TestPass123!')
    else:
        # Empty account - for CRUD testing, new user flows
        email = os.getenv('TEST_CREATOR_EMAIL') or env_vars.get('TEST_CREATOR_EMAIL', 'creator@test.com')
        password = os.getenv('TEST_CREATOR_PASSWORD') or env_vars.get('TEST_CREATOR_PASSWORD', 'TestPass123!')

    return email, password

def generate_unique_email(prefix: str = "test") -> str:
    """Generate a unique test email with timestamp and random string"""
    timestamp = int(time.time())
    random_str = ''.join(random.choices(string.ascii_lowercase, k=4))
    return f"{prefix}.{timestamp}.{random_str}@smartfeed-test.com"

def generate_unique_username(prefix: str = "user") -> str:
    """Generate a unique username"""
    timestamp = int(time.time())
    random_str = ''.join(random.choices(string.ascii_lowercase, k=4))
    return f"{prefix}_{timestamp}_{random_str}"

def take_screenshot(page: Page, name: str, path: str = "tests/screenshots") -> str:
    """Take a screenshot and return the path"""
    try:
        # Ensure directory exists
        Path(path).mkdir(parents=True, exist_ok=True)
        screenshot_path = f"{path}/{name}.png"
        page.screenshot(path=screenshot_path, full_page=True)
        print(f"📸 Screenshot saved: {screenshot_path}")
        return screenshot_path
    except Exception as e:
        print(f"⚠️  Failed to take screenshot: {str(e)}")
        return ""

def wait_for_api_response(page: Page, url_pattern: str, timeout: int = 10000):
    """Wait for an API response matching the URL pattern"""
    with page.expect_response(lambda response: url_pattern in response.url, timeout=timeout) as response_info:
        return response_info.value

def setup_console_logging(page: Page) -> list:
    """Set up console logging and return the messages list"""
    console_messages = []
    page.on("console", lambda msg: console_messages.append(f"[{msg.type}] {msg.text}"))
    return console_messages

def setup_network_logging(page: Page) -> tuple:
    """Set up network request/response logging"""
    api_requests = []
    api_responses = []

    def log_request(request):
        if 'api.smartnews.example' in request.url or '/api/' in request.url:
            api_requests.append({
                'url': request.url,
                'method': request.method,
            })

    def log_response(response):
        if 'api.smartnews.example' in response.url or '/api/' in response.url:
            api_responses.append({
                'url': response.url,
                'status': response.status,
                'statusText': response.status_text,
                'response_object': response,  # Store the Response object for .json() access
            })

    page.on("request", log_request)
    page.on("response", log_response)

    return api_requests, api_responses

def print_test_header(test_name: str, **kwargs):
    """Print a formatted test header"""
    print(f"\n{'='*60}")
    print(f"TEST: {test_name}")
    print(f"{'='*60}")
    for key, value in kwargs.items():
        print(f"{key}: {value}")
    print(f"{'='*60}\n")

def print_test_summary(status: str, **kwargs):
    """Print a formatted test summary"""
    print(f"\n{'='*60}")
    print(f"TEST SUMMARY")
    print(f"{'='*60}")
    print(f"Status: {status}")
    for key, value in kwargs.items():
        print(f"{key}: {value}")
    print(f"{'='*60}\n")

def print_api_calls(requests: list, responses: list):
    """Print formatted API call information"""
    if requests or responses:
        print(f"\n{'='*60}")
        print("API CALLS:")
        print(f"{'='*60}")
        print(f"Requests made: {len(requests)}")
        for req in requests:
            print(f"  → {req['method']} {req['url']}")
        print(f"\nResponses received: {len(responses)}")
        for resp in responses:
            print(f"  ← {resp['status']} {resp['statusText']} - {resp['url']}")

def check_for_errors(page: Page, console_messages: list) -> list:
    """Check for visible errors on page and in console"""
    errors = []

    # Check for visible error alerts (may be multiple)
    error_alerts = page.locator('[role="alert"]').all()
    for alert in error_alerts:
        try:
            if alert.is_visible() and 'error' in alert.text_content().lower():
                content = alert.text_content().strip()
                if content:  # Only add if not empty
                    errors.append(f"Error alert: {content}")
        except:
            # Skip if alert is not accessible or has been removed
            pass

    # Check for validation errors
    error_messages = page.locator('.text-destructive').all()
    for error in error_messages:
        if error.is_visible():
            content = error.text_content().strip()
            # Only add if not empty and not just a required field indicator
            if content and content != "*":
                errors.append(f"Validation error: {content}")

    # Check console for errors (filter out common non-critical errors)
    console_errors = []
    ignored_patterns = ['favicon.ico', 'sourcemap', '_next/static', '404 (Not Found)']
    for msg in console_messages:
        if 'error' in msg.lower():
            # Skip ignored patterns (common non-critical errors)
            if not any(pattern in msg for pattern in ignored_patterns):
                console_errors.append(msg)
    errors.extend(console_errors)

    return errors

def fill_form_field(page: Page, field_id: str, value: str, step_number: int, field_name: str):
    """Fill a form field with logging"""
    print(f"\nStep {step_number}: Filling in {field_name}...")
    page.locator(f'input#{field_id}').fill(value)
    print(f"✓ {field_name} filled: {value}")


# ============================================================================
# ENHANCED VERIFICATION HELPERS - Prevent False Positives
# ============================================================================

class TestHelper:
    """Enhanced test helper with robust verification methods"""

    @staticmethod
    def safe_click(page: Page, selector: str, description: str = "", timeout: int = 5000) -> bool:
        """
        Click with comprehensive verification
        Returns: True if successful, raises AssertionError if failed
        """
        try:
            locator = page.locator(selector)

            # Verify element exists and is visible
            expect(locator).to_be_visible(timeout=timeout)

            # Verify element is enabled
            expect(locator).to_be_enabled(timeout=timeout)

            # Click the element
            locator.click(timeout=timeout)

            print(f"✓ Clicked: {description or selector}")
            return True

        except Exception as e:
            timestamp = int(time.time())
            screenshot_path = f"tests/screenshots/failure-click-{timestamp}.png"
            take_screenshot(page, f"failure-click-{timestamp}")
            raise AssertionError(f"Failed to click '{description or selector}': {str(e)}")

    @staticmethod
    def verify_element_visible(page: Page, selector: str, description: str = "", timeout: int = 5000):
        """Verify element is visible with explicit assertion"""
        try:
            locator = page.locator(selector)
            expect(locator).to_be_visible(timeout=timeout)
            print(f"✓ Element visible: {description or selector}")
        except Exception as e:
            take_screenshot(page, f"failure-element-not-visible-{int(time.time())}")
            raise AssertionError(f"Element not visible '{description or selector}': {str(e)}")

    @staticmethod
    def verify_element_not_visible(page: Page, selector: str, description: str = "", timeout: int = 5000):
        """Verify element is NOT visible with explicit assertion"""
        try:
            locator = page.locator(selector)
            expect(locator).not_to_be_visible(timeout=timeout)
            print(f"✓ Element not visible: {description or selector}")
        except Exception as e:
            take_screenshot(page, f"failure-element-still-visible-{int(time.time())}")
            raise AssertionError(f"Element still visible '{description or selector}': {str(e)}")

    @staticmethod
    def verify_text_content(page: Page, selector: str, expected_text: str, description: str = ""):
        """Verify element contains expected text"""
        try:
            locator = page.locator(selector)
            expect(locator).to_contain_text(expected_text, timeout=5000)
            print(f"✓ Text verified: {description or selector} contains '{expected_text}'")
        except Exception as e:
            take_screenshot(page, f"failure-text-mismatch-{int(time.time())}")
            raise AssertionError(f"Text mismatch in '{description or selector}': {str(e)}")

    @staticmethod
    def verify_url_contains(page: Page, expected_fragment: str, timeout: int = 5000):
        """Verify URL contains expected fragment"""
        try:
            page.wait_for_url(f"**/*{expected_fragment}*", timeout=timeout)
            print(f"✓ URL verified: contains '{expected_fragment}'")
        except Exception as e:
            current_url = page.url
            take_screenshot(page, f"failure-url-mismatch-{int(time.time())}")
            raise AssertionError(f"URL mismatch: expected '{expected_fragment}' in '{current_url}': {str(e)}")

    @staticmethod
    def verify_url_not_contains(page: Page, forbidden_fragment: str):
        """Verify URL does NOT contain fragment"""
        current_url = page.url
        if forbidden_fragment in current_url:
            take_screenshot(page, f"failure-url-still-contains-{int(time.time())}")
            raise AssertionError(f"URL still contains '{forbidden_fragment}': {current_url}")
        print(f"✓ URL verified: does not contain '{forbidden_fragment}'")

    @staticmethod
    def wait_for_api_call(page: Page, url_pattern: str, expected_status: list = [200, 201], timeout: int = 10000) -> Response:
        """
        Wait for specific API call and verify status code
        Returns: Response object if successful
        Raises: AssertionError if API call fails or times out
        """
        try:
            with page.expect_response(
                lambda response: url_pattern in response.url and response.status in expected_status,
                timeout=timeout
            ) as response_info:
                response = response_info.value
                print(f"✓ API call succeeded: {response.status} - {response.url}")
                return response
        except Exception as e:
            take_screenshot(page, f"failure-api-timeout-{int(time.time())}")
            raise AssertionError(f"API call failed or timed out for pattern '{url_pattern}': {str(e)}")

    @staticmethod
    def login_with_verification(page: Page, base_url: str = "http://localhost:3000", with_content: bool = False) -> bool:
        """
        Robust login with full verification at each step

        Args:
            page: Playwright page object
            base_url: Base URL of the app (default: http://localhost:3000)
            with_content: If True, use account WITH content (feeds, sources, library items).
                         If False (default), use EMPTY account for clean state testing.

        Returns: True if successful
        Raises: AssertionError if login fails
        """
        try:
            test_email, test_password = get_test_credentials(with_content=with_content)
            print(f"\n🔐 Logging in with: {test_email}")

            # Navigate to login page
            page.goto(f"{base_url}/login/creator")
            page.wait_for_load_state("networkidle")

            # Verify login page loaded
            expect(page.locator('input#email')).to_be_visible(timeout=10000)
            print("✓ Login page loaded")

            # Wait for React hydration
            page.wait_for_timeout(2000)

            # Fill credentials
            page.locator('input#email').fill(test_email)
            page.wait_for_timeout(500)
            page.locator('input#password').fill(test_password)
            page.wait_for_timeout(500)

            # Submit form and wait for navigation
            with page.expect_navigation(wait_until="networkidle", timeout=15000):
                page.locator('button[type="submit"]').click()

            # Verify login succeeded - multiple checks
            page.wait_for_timeout(2000)
            current_url = page.url

            # Check we're NOT still on login page
            if "/login" in current_url:
                take_screenshot(page, "login-failed-still-on-page")
                raise AssertionError("Login failed - still on login page")

            # Check we're on dashboard or feeds
            if "/dashboard" not in current_url and "/feeds" not in current_url:
                take_screenshot(page, "login-failed-unexpected-url")
                raise AssertionError(f"Login failed - unexpected URL: {current_url}")

            print(f"✓✓✓ Login successful - redirected to: {current_url}")
            return True

        except Exception as e:
            take_screenshot(page, f"login-failure-{int(time.time())}")
            raise AssertionError(f"Login failed: {str(e)}")

    @staticmethod
    def verify_no_errors(page: Page, console_messages: list, description: str = ""):
        """
        Verify no errors are present on page or console
        Raises: AssertionError if errors found
        """
        errors = check_for_errors(page, console_messages)
        if errors:
            error_list = "\n  - ".join(errors)
            take_screenshot(page, f"errors-found-{int(time.time())}")
            raise AssertionError(f"Errors found{' in ' + description if description else ''}:\n  - {error_list}")
        print(f"✓ No errors found{' in ' + description if description else ''}")

    @staticmethod
    def open_create_source_dialog(page: Page, context: str = "wizard") -> bool:
        """
        Open the Create Source dialog from either Feed Wizard or Sources Page

        Args:
            page: Playwright page object
            context: "wizard" or "sources_page"

        Returns:
            True if successful, raises AssertionError if failed
        """
        try:
            if context == "wizard":
                # Feed Wizard: Click "New Source" button
                # Wait longer in wizard context (page might still be settling after navigation)
                page.wait_for_timeout(1000)

                # CRITICAL: Wait for any existing dialog backdrop to disappear before clicking
                # This prevents "element intercepts pointer events" errors
                backdrop = page.locator('div[data-state="open"].fixed.inset-0.z-50')
                try:
                    if backdrop.is_visible(timeout=1000):
                        print("  ⏳ Waiting for previous dialog backdrop to close...")
                        backdrop.wait_for(state='hidden', timeout=5000)
                        page.wait_for_timeout(500)  # Extra wait for animation
                        print("  ✓ Dialog backdrop closed")
                except:
                    # No backdrop found or already closed - this is fine
                    pass

                new_source_button = page.locator('button:has-text("New Source")')

                # Explicit wait for button to be visible (up to 10 seconds in wizard)
                if not new_source_button.is_visible(timeout=10000):
                    raise AssertionError("New Source button not visible after 10 seconds")

                TestHelper.safe_click(page, 'button:has-text("New Source")', "New Source button")
            else:
                # Sources Page: Check for empty state or "Add Source" button
                try:
                    empty_state = page.locator('text="No feed sources yet"')
                    if empty_state.is_visible(timeout=2000):
                        TestHelper.safe_click(page, 'button:has-text("Create Your First Source")', "Create First Source button")
                    else:
                        TestHelper.safe_click(page, 'button:has-text("Add Source")', "Add Source button")
                except:
                    TestHelper.safe_click(page, 'button:has-text("Add Source")', "Add Source button")

            page.wait_for_timeout(1000)
            TestHelper.verify_element_visible(page, '[role="dialog"]', "Create Source dialog")
            print("✓ Create Source dialog opened")
            return True

        except Exception as e:
            take_screenshot(page, f"open-dialog-failed-{int(time.time())}")
            raise AssertionError(f"Failed to open Create Source dialog: {str(e)}")

    @staticmethod
    def create_source_with_keywords(
        page: Page,
        source_name: str,
        source_url: str,
        good_keywords: list = None,
        bad_keywords: list = None,
        relevance_score: int = 70,
        sync_schedule: str = "Daily"
    ) -> bool:
        """
        Create a source with keywords and sync schedule

        Args:
            page: Playwright page object
            source_name: Name for the source
            source_url: RSS/Atom feed URL
            good_keywords: List of include keywords (optional)
            bad_keywords: List of exclude keywords (optional)
            relevance_score: Minimum relevance score (default: 70)
            sync_schedule: "Immediate", "Daily", "Weekly", or "Monthly"

        Returns:
            True if successful, raises AssertionError if failed
        """
        try:
            print(f"  Creating source: {source_name}")

            # STEP 1: Fill basic fields (name, URL)
            TestHelper.verify_element_visible(page, 'input#source-name', "Source name field")
            page.locator('input#source-name').fill(source_name)
            page.locator('input#source-url').fill(source_url)

            # Click "Next: Keywords" button to advance to Step 2
            print(f"  Advancing to Step 2 (Keywords)...")
            next_button = page.locator('button:has-text("Next: Keywords")')
            TestHelper.safe_click(page, 'button:has-text("Next: Keywords")', "Next: Keywords button")

            # Wait for URL validation to complete and Step 2 to load
            # The validation API call can take 6-8 seconds (QA recommendation from Story 1.3.6)
            page.wait_for_timeout(8000)

            # Verify Step 2 loaded by checking for keywords field with extended timeout
            keywords_field = page.locator('input#good-keywords')
            try:
                keywords_field.wait_for(state='visible', timeout=10000)
                print(f"  ✓ Step 2 (Keywords) loaded")
            except:
                raise AssertionError("Keywords field (Step 2) did not appear after clicking Next")

            # STEP 2: Add good keywords
            if good_keywords:
                print(f"  Adding good keywords: {good_keywords}")
                for keyword in good_keywords:
                    page.locator('input#good-keywords').fill(keyword)
                    page.locator('input#good-keywords').press('Enter')
                    page.wait_for_timeout(300)

            # Add bad keywords
            if bad_keywords:
                print(f"  Adding bad keywords: {bad_keywords}")
                for keyword in bad_keywords:
                    page.locator('input#bad-keywords').fill(keyword)
                    page.locator('input#bad-keywords').press('Enter')
                    page.wait_for_timeout(300)

            # Set relevance score using slider (keyboard navigation - most reliable for dialogs)
            print(f"  Setting relevance score: {relevance_score}")
            slider = page.locator('#min-score')

            # Wait for slider to be stable in the DOM (important for dialogs with animations)
            try:
                slider.wait_for(state='attached', timeout=5000)
                page.wait_for_timeout(500)  # Extra wait for dialog animation to complete

                # Verify slider is visible before interacting
                if not slider.is_visible(timeout=2000):
                    print(f"  ⚠️  Slider not visible, attempting to scroll...")
                    # Try to scroll the container instead of the slider itself
                    dialog_content = page.locator('[role="dialog"]').first
                    if dialog_content.is_visible():
                        dialog_content.evaluate('el => el.scrollTop = el.scrollHeight')
                        page.wait_for_timeout(300)

                # Use keyboard navigation (most reliable for modal dialogs)
                slider.focus()
                slider.press('Home')  # Go to 0
                page.wait_for_timeout(200)
                steps = relevance_score // 5  # Assuming step=5
                for _ in range(steps):
                    slider.press('ArrowRight')
                    page.wait_for_timeout(30)
                print(f"  ✓ Slider set to: {relevance_score}%")
            except Exception as slider_error:
                print(f"  ⚠️  Slider interaction failed: {str(slider_error)}")
                print(f"  Continuing without setting relevance score (will use default)")

            # NOTE: Sync schedule was removed from CreateSourceDialog in Story 1.3.2
            # Sources now sync automatically based on backend configuration
            if sync_schedule:
                print(f"  ℹ️  Sync schedule '{sync_schedule}' ignored (removed from UI)")
                print(f"  ℹ️  Sources now use automatic sync from backend")

            # Submit the form
            print("  Submitting source creation...")
            TestHelper.safe_click(page, 'button:has-text("Create Source")', "Create Source button")
            page.wait_for_timeout(3000)

            print(f"✓ Source created: {source_name}")
            return True

        except Exception as e:
            take_screenshot(page, f"create-source-failed-{int(time.time())}")
            raise AssertionError(f"Failed to create source '{source_name}': {str(e)}")


class TestRunner:
    """Test runner with proper exit codes and error handling"""

    @staticmethod
    def run_test(test_func, test_name: str) -> int:
        """
        Run a test function and return proper exit code
        Returns: 0 for success, 1 for failure
        """
        try:
            print_test_header(test_name)
            test_func()
            print(f"\n✅✅✅ TEST PASSED: {test_name}")
            return 0
        except AssertionError as e:
            print(f"\n❌❌❌ TEST FAILED: {test_name}")
            print(f"Reason: {str(e)}")
            traceback.print_exc()
            return 1
        except Exception as e:
            print(f"\n❌❌❌ TEST CRASHED: {test_name}")
            print(f"Unexpected error: {str(e)}")
            traceback.print_exc()
            return 1

    @staticmethod
    def run_with_retry(func, max_attempts: int = 3, delay: int = 1):
        """
        Retry flaky operations with exponential backoff
        Returns: Result of func if successful
        Raises: Last exception if all attempts fail
        """
        last_exception = None
        for attempt in range(max_attempts):
            try:
                return func()
            except Exception as e:
                last_exception = e
                if attempt < max_attempts - 1:
                    wait_time = delay * (2 ** attempt)
                    print(f"⚠️  Attempt {attempt + 1} failed, retrying in {wait_time}s...")
                    time.sleep(wait_time)
        raise last_exception


# ============================================================================
# API VERIFICATION HELPERS
# ============================================================================

def verify_api_call_succeeded(api_responses: list, url_pattern: str, expected_status: list = [200, 201, 204]) -> bool:
    """
    Verify that an API call matching the pattern succeeded
    Raises: AssertionError if API call not found or failed
    """
    matching_calls = [
        resp for resp in api_responses
        if url_pattern in resp['url'] and resp['status'] in expected_status
    ]

    if not matching_calls:
        failed_calls = [resp for resp in api_responses if url_pattern in resp['url']]
        if failed_calls:
            error_msg = f"API call to '{url_pattern}' failed with status {failed_calls[0]['status']}"
        else:
            error_msg = f"No API call found matching pattern '{url_pattern}'"
        raise AssertionError(error_msg)

    print(f"✓ API verified: {matching_calls[0]['status']} - {url_pattern}")
    return True


def verify_element_removed(page: Page, selector: str, description: str = "", timeout: int = 5000):
    """
    Verify element was removed from DOM
    More robust than just checking visibility
    """
    try:
        # First check if it's not visible
        expect(page.locator(selector)).not_to_be_visible(timeout=timeout)

        # Then verify count is 0 (truly removed from DOM)
        expect(page.locator(selector)).to_have_count(0)

        print(f"✓ Element removed: {description or selector}")
    except Exception as e:
        take_screenshot(page, f"failure-element-not-removed-{int(time.time())}")
        raise AssertionError(f"Element not removed '{description or selector}': {str(e)}")
