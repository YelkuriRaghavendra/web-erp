# Google OAuth with Keycloak - Setup Guide

## Overview
This guide documents the complete Google OAuth integration with Keycloak for the Serhafen application.

## Architecture Flow

```
User clicks "Login with Google"
    ↓
Frontend redirects to Keycloak Google OAuth URL
    ↓
User authenticates with Google
    ↓
Keycloak redirects back to Frontend (/auth/callback) with authorization code
    ↓
Frontend sends code to Backend (/v0/auth/google/exchange)
    ↓
Backend exchanges code with Keycloak for tokens
    ↓
Backend returns tokens to Frontend
    ↓
Frontend stores tokens in localStorage (Zustand persist)
    ↓
User is redirected to /dashboard
```

### Frontend Changes

1. **New OAuth Callback Page** (`src/pages/auth-callback.tsx`)
   - Handles the OAuth redirect from Keycloak
   - Extracts authorization code from URL
   - Calls backend to exchange code for tokens
   - Redirects to dashboard on success or login on error

2. **Updated AuthStore** (`src/store/authStore.ts`)
   - Added `loginWithGoogleCallback(code: string)` method
   - Exchanges authorization code for tokens via backend
   - Stores tokens and user info in localStorage (Zustand persist)

3. **Updated Config** (`src/lib/config.ts`)
   - Added `googleExchange: '/v0/auth/google/exchange'` endpoint

4. **Updated App Routes** (`src/App.tsx`)
   - Added `/auth/callback` route for OAuth handling

5. **Updated Environment Variables** (`.env`)
   - Changed `VITE_REDIRECT_URI` from `http://localhost:5999/google/callback` to `http://localhost:3000/auth/callback`

### Backend Changes

1. **Updated Auth Controller** (`src/auth/auth.controller.ts`)
   - Replaced `GET /google/callback` with `POST /google/exchange`
   - New endpoint accepts code in request body instead of query params
   - Returns tokens in standardized format

2. **Updated Environment Variables** (`.env`)
   - Changed `KEYCLOAK_REDIRECT_URI` from `http://localhost:5999/google/callback` to `http://localhost:3000/auth/callback`

## Keycloak Configuration

### IMPORTANT: Update Keycloak Settings

You must update your Keycloak client configuration:

1. **Log into Keycloak Admin Console**
   - Navigate to: `http://localhost:8080/admin`

2. **Select Your Realm**
   - Go to realm: `NewCustomsRealm`

3. **Navigate to Client Settings**
   - Clients → `customs-app`

4. **Update Valid Redirect URIs**
   - Remove: `http://localhost:5999/google/callback`
   - Add: `http://localhost:3000/auth/callback`
   - Add: `http://localhost:3000/*` (for development)

5. **Update Web Origins**
   - Add: `http://localhost:3000`

6. **Save Changes**

### Google Identity Provider Settings in Keycloak

Ensure your Google Identity Provider is configured with:
- **Redirect URI** (in Keycloak): Should automatically update to use the client's redirect URIs
- **Client ID**: Your Google OAuth Client ID
- **Client Secret**: Your Google OAuth Client Secret
- **Default Scopes**: `openid email profile`

## Testing the Flow

### 1. Start Backend
```bash
cd iam-service
npm run start:dev
```

### 2. Start Frontend
```bash
cd serhafen-admincenter
npm run dev
```

### 3. Test Google Login
1. Navigate to `http://localhost:3000/login`
2. Click "Login with Google" button
3. You should be redirected to Google login
4. After successful authentication, you should be redirected back to `http://localhost:3000/auth/callback`
5. The callback page will exchange the code for tokens
6. You should be redirected to `/dashboard` with tokens stored in localStorage

### 4. Verify Token Storage

Open browser DevTools → Application → Local Storage → `http://localhost:3000`:
- Look for key: `auth-storage`
- Should contain: `tokens`, `userInfo`, and `isAuthenticated`

## Troubleshooting

### Error: "Invalid redirect_uri"
- **Cause**: Keycloak redirect URI doesn't match the one in your request
- **Solution**: Double-check Keycloak client settings (Valid Redirect URIs)

### Error: "Authorization code not found"
- **Cause**: No code in callback URL
- **Solution**: Check if OAuth flow completed successfully, inspect URL params

### Error: "Token refresh failed"
- **Cause**: Refresh token expired or invalid
- **Solution**: User needs to login again

### User stuck on callback page
- **Cause**: Backend endpoint not responding or CORS issue
- **Solution**: 
  - Check backend is running on port 5999
  - Check network tab for failed requests
  - Verify CORS settings in backend

### Tokens not persisting
- **Cause**: Zustand persist middleware not configured correctly
- **Solution**: Already configured in authStore with `name: 'auth-storage'`

## Security Considerations

1. **Always use HTTPS in production** - Never use HTTP for OAuth flows in production
2. **Redirect URI validation** - Ensure Keycloak strictly validates redirect URIs
3. **Token storage** - Tokens are stored in localStorage (consider using httpOnly cookies for production)
4. **CORS configuration** - Ensure backend only allows trusted origins
5. **Token expiration** - Access tokens expire (configured via Keycloak), refresh tokens should be used

## Production Checklist

Before deploying to production:

- [ ] Update `VITE_REDIRECT_URI` to production frontend URL
- [ ] Update `KEYCLOAK_REDIRECT_URI` to production frontend URL
- [ ] Update Keycloak client Valid Redirect URIs to production URLs
- [ ] Enable HTTPS for all endpoints
- [ ] Configure proper CORS settings
- [ ] Update Google OAuth credentials for production domain
- [ ] Review token expiration settings in Keycloak
- [ ] Test complete flow in production environment
- [ ] Implement proper error tracking and logging

## Environment Variables Summary

### Frontend (`.env`)
```env
VITE_API_BASE_URL=http://localhost:5999
VITE_KEYCLOAK_BASE_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=NewCustomsRealm
VITE_KEYCLOAK_CLIENT_ID=customs-app
VITE_REDIRECT_URI=http://localhost:3000/auth/callback
```

### Backend (`.env`)
```env
PORT=5999
KEYCLOAK_BASE_URL=http://localhost:8080
KEYCLOAK_REALM=NewCustomsRealm
KEYCLOAK_CLIENT_ID=customs-app
KEYCLOAK_REDIRECT_URI=http://localhost:3000/auth/callback
```

## API Endpoints

### POST /v0/auth/google/exchange
Exchange Google OAuth authorization code for tokens.

**Request Body:**
```json
{
  "code": "4/0AbCdEf..." 
}
```

**Response:**
```json
{
  "success": true,
  "message": "OAuth authentication successful.",
  "data": {
    "accessToken": "eyJhbGciOiJ...",
    "refreshToken": "eyJhbGciOiJ...",
    "type": "Bearer",
    "expiryTimeInMinutes": 60
  }
}
```

## Files Modified

### Frontend
- `src/pages/auth-callback.tsx` (new)
- `src/store/authStore.ts`
- `src/lib/config.ts`
- `src/App.tsx`
- `.env`

### Backend
- `src/auth/auth.controller.ts`
- `.env`

## Next Steps

1. Update Keycloak Valid Redirect URIs (CRITICAL)
2. Restart both frontend and backend applications
3. Test the complete OAuth flow
4. Verify token storage in browser localStorage
5. Test token refresh flow
6. Test logout and re-login

---

**Last Updated:** November 18, 2025
**Version:** 1.0
