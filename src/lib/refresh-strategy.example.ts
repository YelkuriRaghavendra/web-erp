/**
 * Single Refresh Attempt Rule Implementation
 * 
 * This demonstrates how the improved token refresh strategy works:
 * 
 * RULE: Only attempt refresh ONCE per failed request
 * - If refresh succeeds → retry original request
 * - If refresh fails OR retry still gets 401 → logout user
 * 
 * This prevents infinite loops and handles edge cases properly.
 */

// Example Flow Scenarios:

/**
 * ✅ SCENARIO 1: Successful Refresh
 * 
 * 1. User makes API call → 401 (token expired)
 * 2. System attempts refresh → SUCCESS (new token received)
 * 3. Retry original request with new token → 200 OK
 * 4. Return successful response to user
 */

/**
 * ✅ SCENARIO 2: Refresh Fails
 * 
 * 1. User makes API call → 401 (token expired)
 * 2. System attempts refresh → FAIL (refresh token invalid)
 * 3. Logout user immediately (no retry attempted)
 * 4. Redirect to login page
 */

/**
 * ✅ SCENARIO 3: Refresh Succeeds but Retry Still Gets 401
 * 
 * 1. User makes API call → 401 (token expired)
 * 2. System attempts refresh → SUCCESS (new token received)
 * 3. Retry original request with new token → 401 (still unauthorized)
 * 4. Detect this is a retry attempt → NO second refresh
 * 5. Logout user immediately (session truly invalid)
 * 6. Redirect to login page
 */

/**
 * ✅ SCENARIO 4: Login Request Gets 401
 * 
 * 1. User tries to login with wrong credentials → 401
 * 2. System detects this is auth endpoint → NO refresh attempted
 * 3. Return 401 error to show "Invalid credentials"
 * 4. User stays on login page
 */

/**
 * ✅ SCENARIO 5: Concurrent Requests During Refresh
 * 
 * 1. Request A → 401 → starts refresh process
 * 2. Request B → 401 → detects refresh in progress → waits
 * 3. Refresh completes with new token
 * 4. Request B retries with new token → SUCCESS
 * 5. Both requests complete successfully
 */

// Key Implementation Details:

/**
 * 1. Refresh State Tracking
 * - `refreshInProgress` flag prevents concurrent refresh attempts
 * - Only one refresh can happen at a time across all requests
 */

/**
 * 2. Retry Attempt Detection  
 * - `isRetryAttempt` parameter tracks if this is already a retry
 * - If retry fails with 401 → immediate logout (no second refresh)
 */

/**
 * 3. Auth Endpoints Protection
 * - Login/refresh endpoints skip refresh logic entirely
 * - Prevents infinite loops on invalid credentials
 */

/**
 * 4. Error Handling
 * - Network errors → show network error toast
 * - Auth errors → handled by refresh logic or login redirect
 * - Other API errors → show specific error messages
 */

// Usage in Components:

/**
 * // This will automatically handle token refresh if needed
 * const { data, error } = useQuery({
 *   queryKey: ['protected-data'],
 *   queryFn: () => apiClient.get('/protected-endpoint')
 * });
 * 
 * // User doesn't need to handle token refresh manually
 * // The system will either:
 * // - Refresh token and return data
 * // - Logout and redirect to login if session invalid
 */