# AWeber Integration Setup Guide

This guide explains how to set up AWeber integration for newsletter subscriptions and user registration.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# AWeber OAuth Configuration (For OAuth flow)
AWEBER_CLIENT_ID=your_aweber_client_id_here
AWEBER_CLIENT_SECRET=your_aweber_client_secret_here
NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# AWeber Direct API Configuration (For direct API usage)
AWEBER_ACCESS_TOKEN=your_aweber_access_token_here
AWEBER_ACCOUNT_ID=your_aweber_account_id_here

# AWeber Lists (Required for dual list setup)
AWEBER_SELLER_LIST_ID=your_seller_list_id_here
AWEBER_BUYER_LIST_ID=your_buyer_list_id_here

# Newsletter Provider Toggle
NEWSLETTER_USE_AWEBER=true
```

## Getting AWeber Credentials

### Option 1: OAuth Setup (Recommended for Production)

1. **Create AWeber App**
   - Log in to your AWeber account
   - Go to "My Account" → "API Access"
   - Click "Create New App"
   - Fill in the application details:
     - **App Name**: Your app name
     - **OAuth Redirect URL**: `https://yourdomain.com/api/auth/aweber/callback`
   - Copy the **Client ID** and **Client Secret**

2. **Set Environment Variables**
   ```bash
   AWEBER_CLIENT_ID=your_client_id_here
   AWEBER_CLIENT_SECRET=your_client_secret_here
   NEXT_PUBLIC_BASE_URL=https://yourdomain.com
   AWEBER_LIST_ID=your_list_id_here
   ```

### Option 2: Direct API Setup (Alternative)

1. **Access Token**
   - Log in to your AWeber account
   - Go to "My Account" → "API Access"
   - Create a new application or use an existing one
   - Copy the access token

2. **Account ID**
   - In your AWeber dashboard, look at the URL
   - The account ID is the number in the URL (e.g., `https://www.aweber.com/users/123456/`)
   - Copy the number (123456 in this example)

3. **List ID**
   - Go to "Subscribers" → "Lists"
   - Click on the list you want to use
   - Look at the URL - the list ID is the number at the end
   - Copy the list ID

## Features

### Newsletter Subscription
- Direct subscription via the `/subscribe` page
- Automatic subscription during user registration
- Automatic subscription for Google sign-in users

### User Tracking
The integration automatically tracks:
- Signup method (email, Google)
- User ID from Firebase
- Signup/login dates
- Custom fields for analytics

### Tags
Users are automatically tagged based on their signup method:
- `new-user` - for email registrations
- `registration` - for all new registrations
- `google-signin` - for Google sign-in users
- `social-auth` - for social authentication
- `newsletter` - for direct newsletter subscriptions
- `direct-subscription` - for direct newsletter signups

## API Endpoints

### POST /api/subscribe
Subscribes a user to the newsletter using AWeber.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Successfully subscribed to newsletter"
}
```

### Webhook Endpoints

#### POST /api/webhooks/aweber
Main webhook endpoint for all AWeber events.

#### POST /api/webhooks/aweber/subscribe
Specific webhook endpoint for subscription-related events.

**Supported Events:**
- `subscriber.added` - New subscriber added to list
- `subscriber.subscribed` - Subscriber confirmed subscription
- `subscriber.unsubscribed` - Subscriber unsubscribed from list

## Webhook Setup

### 1. Configure AWeber Webhooks

In your AWeber account:

1. Go to "My Account" → "API Access"
2. Click on your app → "Webhooks"
3. Add the following callback URLs to your **Callback URL Allow-list**:

```
https://yourdomain.com/api/webhooks/aweber
https://yourdomain.com/api/webhooks/aweber/subscribe
```

### 2. Enable Webhook Events

Select the following events:
- ✅ `subscriber.added`
- ✅ `subscriber.subscribed` 
- ✅ `subscriber.unsubscribed`

### 3. Environment Variables (Optional)

Add webhook security (recommended for production):

```bash
# Webhook security
AWEBER_WEBHOOK_SECRET=your_webhook_secret_here
```

### 4. Webhook Event Handling

The webhooks will automatically log events and can be extended to:

- Send welcome emails
- Update your database
- Trigger notifications
- Sync with CRM systems
- Update analytics

## Error Handling

The integration includes comprehensive error handling:
- Graceful fallback if AWeber is not configured
- Console logging for debugging
- User-friendly error messages
- Non-blocking subscription attempts (won't break user registration)

## Testing

1. Set up your AWeber credentials
2. Test the newsletter subscription page
3. Test user registration (both email and Google)
4. Check your AWeber dashboard for new subscribers
5. Verify tags and custom fields are properly set

## Troubleshooting

### Common Issues

1. **"AWeber not configured" error**
   - Check that all environment variables are set
   - Verify the credentials are correct

2. **"Failed to subscribe" error**
   - Check AWeber API limits
   - Verify the list ID exists
   - Check network connectivity

3. **Users not appearing in AWeber**
   - Check the console for error messages
   - Verify the access token has proper permissions
   - Ensure the list ID is correct

### Debug Mode

Enable debug logging by checking the browser console for messages starting with:
- "Successfully subscribed user to newsletter"
- "Failed to subscribe user to newsletter"
- "Error subscribing user to newsletter"
