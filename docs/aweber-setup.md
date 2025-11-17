# AWeber Integration Setup Guide

This guide explains how to set up and use the AWeber email marketing integration in your application.

## Overview

The AWeber integration allows you to automatically subscribe users to your email lists when they:
- Sign up with email/password
- Sign up/login with Google
- Subscribe via the newsletter form

## Architecture

### Components

1. **Token Management** (`lib/aweber-token-storage.ts`)
   - Stores OAuth tokens securely in Firestore
   - Manages token expiration
   - Handles token refresh

2. **Token Refresh** (`lib/aweber-token-refresh.ts`)
   - Automatically refreshes expired tokens
   - Ensures uninterrupted API access

3. **Server API** (`lib/aweber-server.ts`)
   - Handles AWeber API calls
   - Subscribes users to lists
   - Manages custom fields and tags

4. **OAuth Routes**
   - `/api/auth/aweber` - Initiates OAuth flow
   - `/api/auth/aweber/callback` - Handles OAuth callback
   - `/api/auth/aweber/reauth` - Forces re-authentication

5. **Subscription Routes**
   - `/api/aweber/register-user` - Subscribe new registrations
   - `/api/aweber/subscribe-google-user` - Subscribe Google sign-ins
   - `/api/subscribe` - General newsletter subscription

## Setup Instructions

### 1. Create AWeber Application

1. Go to [AWeber Labs](https://labs.aweber.com/)
2. Sign in to your AWeber account
3. Click "Create New App"
4. Fill in the application details:
   - **App Name**: Your app name
   - **App Description**: Brief description
   - **OAuth Redirect URI**: `https://yourdomain.com/api/auth/aweber/callback`

5. Save your **Client ID** and **Client Secret**

### 2. Get Your List IDs

1. Log into your AWeber account
2. Go to "Manage Lists"
3. For each list you want to use:
   - Click on the list name
   - Look at the URL - it will contain the list ID
   - Example: `https://www.aweber.com/users/autoresponder/manage?id=123456` (ID: 123456)

### 3. Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# AWeber Configuration
AWEBER_CLIENT_ID=your_client_id_here
AWEBER_CLIENT_SECRET=your_client_secret_here
AWEBER_REDIRECT_URI=https://yourdomain.com/api/auth/aweber/callback

# AWeber List IDs
AWEBER_BUYER_LIST_ID=your_buyer_list_id
AWEBER_SELLER_LIST_ID=your_seller_list_id

# Optional: Toggle AWeber on/off (defaults to 'true')
NEWSLETTER_USE_AWEBER=true

# Firebase Admin SDK (required for token storage)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...}'

# App URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 4. Set Up Firebase Admin SDK

The AWeber integration uses Firebase Admin SDK to store tokens in Firestore.

**Option 1: Full Service Account (Recommended)**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. Download the JSON file
6. Copy the entire JSON content and set it as `FIREBASE_SERVICE_ACCOUNT_KEY` (as a single-line string)

Example:
```bash
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk@your-project.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'
```

**Option 2: Individual Environment Variables**

If you prefer not to use a single JSON string, you can set individual values:

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
```

**Option 3: Minimal (Project ID Only)**

For basic functionality, you can use just the project ID (already set in your client config):

```bash
# This is already set in your .env.local
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

Note: Options 2 and 3 may have limited functionality. Option 1 is recommended for production.

### 5. Complete OAuth Flow

Once your environment variables are configured:

1. Visit `https://yourdomain.com/api/auth/aweber` in your browser
2. Authorize the application with your AWeber account
3. You'll be redirected back with `?aweber_auth=success`
4. Tokens are now stored in Firestore and will auto-refresh

## Usage

### Automatic Subscription

Users are automatically subscribed to AWeber lists when they:

**Sign Up (Email/Password)**
- Subscribed to the list based on `userType` (defaults to buyer list)
- Tags: `['registration', 'buyer']` or `['registration', 'seller']`
- Custom fields include signup method, user ID, and date

**Sign Up/Login (Google)**
- Subscribed to buyer list
- Tags: `['google-signin', 'buyer']`
- Custom fields include login method, user ID, and date

**Newsletter Subscription**
- Users can manually subscribe via newsletter form
- Subscribed to the appropriate list based on user type

### Manual Subscription

You can also manually subscribe users via API:

```javascript
const response = await fetch('/api/aweber/register-user', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    name: 'John Doe',
    userType: 'buyer', // or 'seller'
    customFields: {
      source: 'custom_source',
      utm_campaign: 'spring_2024'
    }
  })
})

const result = await response.json()
console.log(result.success ? 'Subscribed!' : result.error)
```

## Token Management

### Automatic Refresh

Tokens are automatically refreshed when they expire. The system:
- Checks token expiration before each API call
- Refreshes tokens with a 5-minute buffer
- Stores new tokens in Firestore

### Manual Re-authentication

If you need to manually re-authenticate:

**Via API:**
```bash
# Refresh tokens
curl -X POST https://yourdomain.com/api/auth/aweber/reauth \
  -H "Content-Type: application/json" \
  -d '{"action": "refresh"}'

# Revoke tokens and require new OAuth
curl -X POST https://yourdomain.com/api/auth/aweber/reauth \
  -H "Content-Type: application/json" \
  -d '{"action": "revoke"}'
```

**Via Browser:**
Visit `https://yourdomain.com/api/auth/aweber/reauth` to start fresh OAuth flow

## Customization

### Custom Fields

AWeber supports custom fields for storing additional subscriber data. You can add custom fields when subscribing:

```javascript
customFields: {
  'signup_method': 'google',
  'user_type': 'buyer',
  'user_id': 'firebase_uid_123',
  'signup_date': '2024-01-15T10:30:00Z',
  'utm_source': 'facebook',
  'utm_campaign': 'spring_sale'
}
```

### Tags

Tags help organize and segment your subscribers:

```javascript
tags: ['registration', 'buyer', 'premium', 'early-adopter']
```

### Different Lists for User Types

The integration supports separate lists for buyers and sellers:
- Set `AWEBER_BUYER_LIST_ID` for buyer list
- Set `AWEBER_SELLER_LIST_ID` for seller list
- Specify `userType` when subscribing

## Fallback to SMTP

If AWeber is not configured or disabled, the system falls back to SMTP email:

```bash
# Disable AWeber
NEWSLETTER_USE_AWEBER=false

# Configure SMTP
GW_SMTP_HOST=smtp.gmail.com
GW_SMTP_PORT=465
GW_SMTP_USER=your-email@gmail.com
GW_SMTP_PASS=your-app-password
GW_FROM_EMAIL=noreply@yourdomain.com
```

## Troubleshooting

### Common Issues

**"No AWeber tokens found"**
- Complete the OAuth flow at `/api/auth/aweber`
- Check Firebase Admin SDK is configured correctly

**"AWeber list not configured"**
- Verify `AWEBER_BUYER_LIST_ID` and/or `AWEBER_SELLER_LIST_ID` are set
- Ensure list IDs are correct

**"Failed to refresh token"**
- Try re-authenticating at `/api/auth/aweber/reauth`
- Verify `AWEBER_CLIENT_SECRET` is correct

**"Invalid Firebase service account credentials"**
- Check `FIREBASE_SERVICE_ACCOUNT_KEY` is valid JSON
- Ensure the service account has Firestore permissions

### Debug Mode

Enable debug logging by checking the server console:
- Token refresh logs
- API call logs
- Error details

## Security Notes

1. **Never commit credentials** - Keep `.env.local` in `.gitignore`
2. **Token security** - Tokens are stored server-side in Firestore
3. **HTTPS required** - OAuth requires HTTPS in production
4. **Service account** - Protect your Firebase service account key

## API Reference

### Subscribe to List

**Endpoint:** `POST /api/aweber/register-user`

**Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "userType": "buyer",
  "customFields": {
    "source": "website"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully subscribed to newsletter"
}
```

### Get Lists

**Endpoint:** Use `getAWeberLists()` from `lib/aweber-server.ts`

```javascript
import { getAWeberLists } from '@/lib/aweber-server'

const result = await getAWeberLists()
if (result.success) {
  console.log(result.data) // Array of lists
}
```

## Support

For AWeber API documentation, visit:
- [AWeber API Docs](https://api.aweber.com/)
- [AWeber OAuth 2.0 Guide](https://api.aweber.com/#tag/OAuth)

For integration issues, check:
- Server logs for detailed error messages
- Firestore console for token data
- AWeber account for list configuration
