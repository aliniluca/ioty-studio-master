# AWeber Integration Setup Guide

This guide explains how to set up AWeber integration for newsletter subscriptions and user registration.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# AWeber Configuration
AWEBER_ACCESS_TOKEN=your_aweber_access_token_here
AWEBER_ACCOUNT_ID=your_aweber_account_id_here
AWEBER_LIST_ID=your_aweber_list_id_here

# Newsletter Provider Toggle
NEWSLETTER_USE_AWEBER=true
```

## Getting AWeber Credentials

### 1. Access Token
1. Log in to your AWeber account
2. Go to "My Account" → "API Access"
3. Create a new application or use an existing one
4. Copy the access token

### 2. Account ID
1. In your AWeber dashboard, look at the URL
2. The account ID is the number in the URL (e.g., `https://www.aweber.com/users/123456/`)
3. Copy the number (123456 in this example)

### 3. List ID
1. Go to "Subscribers" → "Lists"
2. Click on the list you want to use
3. Look at the URL - the list ID is the number at the end
4. Copy the list ID

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
