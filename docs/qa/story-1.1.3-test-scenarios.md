# Test Scenarios: Story 1.1.3 - Frontend Unified SSO Integration

**Story Status:** Approved ✅
**Created:** 2025-10-16
**QA Focus:** Unified OAuth endpoint integration
**Backward Compatibility:** Story 1.1.2 functionality must remain intact

---

## Overview

This story refactors the Google OAuth implementation to use unified backend SSO endpoints instead of the previous three-endpoint pattern. All existing functionality from Story 1.1.2 must continue working without changes to user experience.

### What Changed from Story 1.1.2

| Component                | Story 1.1.2 (Previous)                                                              | Story 1.1.3 (Current)                                               |
| ------------------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **Backend Endpoints**    | 3 endpoints: `/auth/google/register`, `/auth/google/login`, `/auth/google/callback` | 2 unified endpoints: `/auth/sso/authenticate`, `/auth/sso/callback` |
| **Auth Service Methods** | Separate `googleRegister()` and `googleLogin()` methods                             | Unified `googleSSO()` method (old methods may delegate)             |
| **Decision Logic**       | Frontend decides register vs. login                                                 | Backend decides based on email lookup                               |
| **Response Format**      | Standard OAuth response                                                             | Response includes `is_new_user` flag                                |
| **User Experience**      | ✅ Unchanged                                                                        | ✅ Unchanged (no visible differences)                               |

---

## Test Environment Setup

### Prerequisites

- [ ] Backend unified SSO endpoints deployed and accessible
- [ ] Test Google OAuth credentials configured
- [ ] Test user accounts available (both creator and subscriber)
- [ ] Fresh browser with cleared cookies/session storage
- [ ] Access to both testing and production environments

### Test Data Requirements

| User Type             | Email                                  | Status             | Purpose                             |
| --------------------- | -------------------------------------- | ------------------ | ----------------------------------- |
| Creator (Existing)    | creator-test@example.com               | Already registered | Test login flow with existing user  |
| Subscriber (Existing) | subscriber-test@example.com            | Already registered | Test login flow with existing user  |
| Creator (New)         | new-creator-{timestamp}@example.com    | Not registered     | Test registration flow for new user |
| Subscriber (New)      | new-subscriber-{timestamp}@example.com | Not registered     | Test registration flow for new user |

---

## Critical Test Scenarios

### Scenario 1: New User Registration - Creator (AC: 1, 2, 3, 4, 5)

**Test Case ID:** TS-1.1.3-001
**Priority:** P0 (Critical)

**Preconditions:**

- User email does not exist in database
- Navigate to `/register/creator`

**Test Steps:**

1. Click "Sign up with Google" button
2. Complete Google OAuth flow (authenticate with test Google account)
3. Google redirects back to callback page

**Expected Results:**

- ✅ Button triggers POST to `/auth/sso/authenticate?user_type=creator`
- ✅ Backend returns `redirect_url` pointing to Google OAuth
- ✅ User is redirected to Google for authentication
- ✅ After authentication, Google redirects to `/auth/google/callback?code=...&state=...`
- ✅ Callback page calls GET `/auth/sso/callback?code=...&state=...`
- ✅ Backend creates new creator account
- ✅ Response includes `is_new_user: true`
- ✅ `justSignedUp` flag set in sessionStorage
- ✅ User redirected to `/dashboard`
- ✅ Dashboard shows welcome message for first-time users
- ✅ User logged in successfully (auth state populated)

**How to Verify:**

- Check Network tab: `/auth/sso/authenticate` called with `user_type=creator`
- Check Network tab: `/auth/sso/callback` response has `is_new_user: true`
- Check sessionStorage: `justSignedUp` key exists with value `'true'`
- Check dashboard: Welcome message displayed

---

### Scenario 2: New User Registration - Subscriber (AC: 1, 2, 3, 4, 5)

**Test Case ID:** TS-1.1.3-002
**Priority:** P0 (Critical)

**Preconditions:**

- User email does not exist in database
- Navigate to `/register/subscriber`

**Test Steps:**

1. Click "Sign up with Google" button
2. Complete Google OAuth flow
3. Google redirects back to callback page

**Expected Results:**

- ✅ Button triggers POST to `/auth/sso/authenticate?user_type=subscriber`
- ✅ Backend creates new subscriber account
- ✅ Response includes `is_new_user: true`
- ✅ `justSignedUp` flag set in sessionStorage
- ✅ User redirected to `/dashboard`
- ✅ Dashboard shows welcome message
- ✅ User logged in with `user_type: 'subscriber'`

---

### Scenario 3: Existing User Login - Creator (AC: 1, 2, 3, 4, 5)

**Test Case ID:** TS-1.1.3-003
**Priority:** P0 (Critical)

**Preconditions:**

- User email already exists in database as creator
- Navigate to `/login/creator`

**Test Steps:**

1. Click "Sign in with Google" button
2. Complete Google OAuth flow with existing creator account
3. Google redirects back to callback page

**Expected Results:**

- ✅ Button triggers POST to `/auth/sso/authenticate` (no user_type needed for login)
- ✅ Backend returns `redirect_url` pointing to Google OAuth
- ✅ After authentication, callback receives code and state
- ✅ Callback page calls GET `/auth/sso/callback?code=...&state=...`
- ✅ Backend finds existing user, performs login
- ✅ Response includes `is_new_user: false`
- ✅ `justSignedUp` flag NOT set in sessionStorage
- ✅ User redirected to `/dashboard`
- ✅ Dashboard does NOT show welcome message (returning user)
- ✅ User logged in successfully with existing account data

**How to Verify:**

- Check Network tab: `/auth/sso/callback` response has `is_new_user: false`
- Check sessionStorage: `justSignedUp` key does NOT exist
- Check dashboard: No welcome message displayed

---

### Scenario 4: Existing User Login - Subscriber (AC: 1, 2, 3, 4, 5)

**Test Case ID:** TS-1.1.3-004
**Priority:** P0 (Critical)

**Preconditions:**

- User email already exists in database as subscriber
- Navigate to `/login/subscriber`

**Test Steps:**

1. Click "Sign in with Google" button
2. Complete Google OAuth flow with existing subscriber account
3. Google redirects back to callback page

**Expected Results:**

- ✅ Backend finds existing user, performs login
- ✅ Response includes `is_new_user: false`
- ✅ `justSignedUp` flag NOT set
- ✅ User redirected to `/dashboard`
- ✅ No welcome message shown
- ✅ User logged in with `user_type: 'subscriber'`

---

### Scenario 5: Error Handling - Invalid State Parameter (AC: 4, 8)

**Test Case ID:** TS-1.1.3-005
**Priority:** P1 (High)

**Preconditions:**

- Manually construct callback URL with invalid or missing state

**Test Steps:**

1. Navigate to `/auth/google/callback?code=test123&state=invalid`
2. Observe error handling

**Expected Results:**

- ✅ Backend returns 400 error (invalid state)
- ✅ Frontend displays error message to user
- ✅ Auto-redirect feature guides user to appropriate page
- ✅ No authentication occurs
- ✅ User remains logged out

**How to Verify:**

- Check Network tab: `/auth/sso/callback` returns 400 status
- Check UI: Error message displayed
- Check auth state: User not authenticated

---

### Scenario 6: Error Handling - Missing Code Parameter (AC: 4)

**Test Case ID:** TS-1.1.3-006
**Priority:** P1 (High)

**Preconditions:**

- Manually navigate to callback without code parameter

**Test Steps:**

1. Navigate to `/auth/google/callback?state=valid_state` (no code)
2. Observe error handling

**Expected Results:**

- ✅ Frontend detects missing code parameter
- ✅ Error message displayed
- ✅ User not authenticated
- ✅ Redirect to appropriate error or login page

---

### Scenario 7: Network Error Handling (AC: 4)

**Test Case ID:** TS-1.1.3-007
**Priority:** P1 (High)

**Preconditions:**

- Simulate network failure or backend unavailable

**Test Steps:**

1. Click "Sign up with Google" button
2. Simulate network error (throttle network or disconnect)
3. Observe error handling

**Expected Results:**

- ✅ Loading state shown during API call
- ✅ Error message displayed on network failure
- ✅ User can retry action
- ✅ No partial authentication state

---

### Scenario 8: Affiliate Hash Tracking (AC: 1, 2)

**Test Case ID:** TS-1.1.3-008
**Priority:** P2 (Medium)

**Preconditions:**

- Navigate to `/register/creator?affiliate_hash=ABC123`

**Test Steps:**

1. Click "Sign up with Google" button with affiliate hash in URL
2. Complete OAuth flow
3. Verify affiliate hash tracked

**Expected Results:**

- ✅ `affiliate_hash=ABC123` included in POST to `/auth/sso/authenticate`
- ✅ Backend receives and stores affiliate hash
- ✅ User account created with affiliate tracking
- ✅ OAuth flow completes successfully

**How to Verify:**

- Check Network tab: `/auth/sso/authenticate?user_type=creator&affiliate_hash=ABC123`
- Check backend: Affiliate hash stored with user account

---

## Security Testing

### Scenario 9: State Parameter CSRF Protection (AC: 8)

**Test Case ID:** TS-1.1.3-009
**Priority:** P0 (Critical - Security)

**Preconditions:**

- Understanding of state parameter mechanism

**Test Steps:**

1. Initiate OAuth flow, capture state parameter
2. Attempt to reuse state parameter in different session
3. Attempt to modify state parameter
4. Observe backend validation

**Expected Results:**

- ✅ State parameter generated by backend, included in redirect_url
- ✅ State parameter sent unmodified to callback
- ✅ Backend validates state parameter
- ✅ Modified state rejected with 400 error
- ✅ Reused state rejected (if applicable)
- ✅ CSRF attack prevented

---

### Scenario 10: Token Storage Security (AC: 8)

**Test Case ID:** TS-1.1.3-010
**Priority:** P0 (Critical - Security)

**Preconditions:**

- Complete OAuth flow successfully

**Test Steps:**

1. Login via Google OAuth
2. Inspect browser storage (localStorage, sessionStorage, cookies)
3. Inspect JavaScript console (check if tokens accessible)

**Expected Results:**

- ✅ Access tokens stored in httpOnly cookies (backend responsibility)
- ✅ Tokens NOT accessible via JavaScript
- ✅ Tokens NOT in localStorage or sessionStorage
- ✅ Only `justSignedUp` flag in sessionStorage (not a security risk)
- ✅ No token exposure in Network tab responses (except backend)

---

### Scenario 11: Email Verification Requirement (AC: 8)

**Test Case ID:** TS-1.1.3-011
**Priority:** P1 (High - Security)

**Preconditions:**

- Google account with unverified email (if possible to test)

**Test Steps:**

1. Attempt to authenticate with unverified Google email
2. Observe backend response

**Expected Results:**

- ✅ Backend enforces `verified_email=true` from Google
- ✅ Unverified emails rejected
- ✅ Error message displayed to user

---

## Backward Compatibility Testing

### Scenario 12: All 43+ OAuth Tests Pass (AC: 6)

**Test Case ID:** TS-1.1.3-012
**Priority:** P0 (Critical)

**Preconditions:**

- Development environment with Jest configured

**Test Steps:**

1. Run full OAuth test suite: `npm test -- auth`
2. Review test results

**Expected Results:**

- ✅ All 43+ OAuth tests from Story 1.1.2 pass
- ✅ New tests for unified endpoint added
- ✅ Zero test failures
- ✅ Zero test regressions

**How to Verify:**

- Check test output: "Tests: 43+ passed"
- Review test coverage report
- Verify new unified endpoint tests included

---

### Scenario 13: Build and Lint Validation (AC: 6, 7)

**Test Case ID:** TS-1.1.3-013
**Priority:** P0 (Critical)

**Preconditions:**

- Development environment ready

**Test Steps:**

1. Run `npm run build`
2. Run `npm run lint`
3. Review output

**Expected Results:**

- ✅ Build succeeds with 0 TypeScript errors
- ✅ Lint succeeds with 0 errors
- ✅ No warnings for new code
- ✅ Production build optimized

---

## Regression Testing

### Scenario 14: Email/Password Login Still Works (Regression)

**Test Case ID:** TS-1.1.3-014
**Priority:** P0 (Critical - Regression)

**Preconditions:**

- Existing user with email/password credentials

**Test Steps:**

1. Navigate to `/login/creator`
2. Enter email and password
3. Submit login form

**Expected Results:**

- ✅ Email/password login works normally
- ✅ No impact from OAuth changes
- ✅ User logged in successfully

---

### Scenario 15: All Four Auth Pages Render Correctly (AC: 5)

**Test Case ID:** TS-1.1.3-015
**Priority:** P1 (High)

**Preconditions:**

- Fresh browser session

**Test Steps:**

1. Visit `/login/creator` → verify page renders
2. Visit `/login/subscriber` → verify page renders
3. Visit `/register/creator` → verify page renders
4. Visit `/register/subscriber` → verify page renders

**Expected Results:**

- ✅ All 4 pages render without errors
- ✅ Google OAuth button visible on all pages
- ✅ Form elements displayed correctly
- ✅ Cross-links between pages work
- ✅ No console errors

---

## Performance Testing

### Scenario 16: OAuth Flow Performance

**Test Case ID:** TS-1.1.3-016
**Priority:** P2 (Medium)

**Preconditions:**

- Normal network conditions

**Test Steps:**

1. Measure time from clicking "Sign up with Google" to dashboard load
2. Compare with Story 1.1.2 baseline (if available)

**Expected Results:**

- ✅ OAuth flow completes in reasonable time (< 5 seconds typical)
- ✅ No performance degradation from Story 1.1.2
- ✅ Loading states provide good UX during wait

---

## Edge Cases & Boundary Testing

### Scenario 17: User Tries to Register with Existing Email

**Test Case ID:** TS-1.1.3-017
**Priority:** P1 (High)

**Preconditions:**

- User email already exists in database

**Test Steps:**

1. Navigate to `/register/creator`
2. Click "Sign up with Google" with existing email
3. Complete OAuth flow

**Expected Results:**

- ✅ Backend detects existing email
- ✅ Response includes `is_new_user: false` (login occurred, not registration)
- ✅ User logged in to existing account
- ✅ No duplicate account created
- ✅ No welcome message shown (existing user)

---

### Scenario 18: User Tries to Login with Non-Existent Email

**Test Case ID:** TS-1.1.3-018
**Priority:** P1 (High)

**Preconditions:**

- User email does NOT exist in database

**Test Steps:**

1. Navigate to `/login/creator`
2. Click "Sign in with Google" with new email
3. Complete OAuth flow

**Expected Results:**

- ✅ Backend detects new email
- ✅ Response includes `is_new_user: true` (registration occurred)
- ✅ New account created (even though user clicked "login")
- ✅ Welcome message shown (new user)
- ✅ User can access dashboard

**Rationale:** Backend unified endpoint automatically registers new users even from login flow

---

## QA Sign-Off Checklist

### Functional Requirements

- [ ] New user registration works on `/register/creator` (TS-1.1.3-001)
- [ ] New user registration works on `/register/subscriber` (TS-1.1.3-002)
- [ ] Existing user login works on `/login/creator` (TS-1.1.3-003)
- [ ] Existing user login works on `/login/subscriber` (TS-1.1.3-004)
- [ ] `is_new_user` flag handled correctly in both scenarios
- [ ] `justSignedUp` flag set only for new users
- [ ] Welcome message shown only for new users
- [ ] All 4 auth pages render correctly (TS-1.1.3-015)

### Error Handling

- [ ] Invalid state parameter handled (TS-1.1.3-005)
- [ ] Missing code parameter handled (TS-1.1.3-006)
- [ ] Network errors handled gracefully (TS-1.1.3-007)
- [ ] Error messages clear and actionable
- [ ] Auto-redirect works on errors

### Security

- [ ] State parameter CSRF protection verified (TS-1.1.3-009)
- [ ] Tokens in httpOnly cookies, not accessible via JS (TS-1.1.3-010)
- [ ] Email verification enforced (TS-1.1.3-011)
- [ ] No token exposure in client-side code
- [ ] OAuth state validation working

### Testing & Quality

- [ ] All 43+ OAuth tests passing (TS-1.1.3-012)
- [ ] Build succeeds with 0 errors (TS-1.1.3-013)
- [ ] Lint succeeds with 0 errors (TS-1.1.3-013)
- [ ] No regressions in email/password login (TS-1.1.3-014)
- [ ] Test coverage maintained or improved

### Edge Cases

- [ ] Affiliate hash tracking works (TS-1.1.3-008)
- [ ] Register with existing email creates no duplicates (TS-1.1.3-017)
- [ ] Login with new email auto-registers user (TS-1.1.3-018)
- [ ] Performance acceptable (TS-1.1.3-016)

### Documentation

- [ ] Implementation notes reviewed
- [ ] Known issues documented (if any)
- [ ] QA results section completed in story

---

## Known Issues / Edge Cases

_To be populated during QA testing_

---

## QA Notes

_To be populated by QA Agent during testing_

### Test Execution Date: \***\*\_\_\*\***

### QA Agent: \***\*\_\_\*\***

### Environment Tested:

- [ ] Development (https://localhost:8000)
- [ ] Production (https://localhost:8000)

### Overall Assessment:

- [ ] PASS - Story ready for production
- [ ] PASS WITH NOTES - Minor issues documented
- [ ] FAIL - Critical issues found, requires fixes

### Critical Issues Found:

_None or list issues_

### Minor Issues Found:

_None or list issues_

### Recommendations:

_Any recommendations for future improvements_
