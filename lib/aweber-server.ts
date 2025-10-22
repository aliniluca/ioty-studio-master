/**
 * AWeber Server-Side API Integration Utility
 * Handles newsletter subscriptions and user registration on the server
 */

import { cookies } from 'next/headers'

export interface AWeberSubscriber {
  email: string;
  name?: string;
  customFields?: Record<string, string>;
  tags?: string[];
  listId?: string;
}

export interface AWeberResponse {
  success: boolean;
  message?: string;
  subscriberId?: string;
}

class AWeberServerAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = 'https://api.aweber.com/1.0';
  }

  private async getTokens() {
    // Try to get tokens from cookies first (OAuth flow)
    try {
      const cookieStore = cookies()
      const accessToken = cookieStore.get('aweber_access_token')?.value || process.env.AWEBER_ACCESS_TOKEN || '';
      const accountId = cookieStore.get('aweber_account_id')?.value || process.env.AWEBER_ACCOUNT_ID || '';
      
      console.log('AWeber tokens from cookies:', {
        hasAccessToken: !!accessToken,
        hasAccountId: !!accountId,
        tokenPreview: accessToken ? accessToken.substring(0, 20) + '...' : 'none'
      });
      
      return { accessToken, accountId };
    } catch (error) {
      console.error('Error reading AWeber cookies:', error);
      // Fallback to environment variables if cookies are not available
      return {
        accessToken: process.env.AWEBER_ACCESS_TOKEN || '',
        accountId: process.env.AWEBER_ACCOUNT_ID || ''
      };
    }
  }

  /**
   * Subscribe a user to the newsletter
   */
  async subscribeToNewsletter(subscriber: AWeberSubscriber): Promise<AWeberResponse> {
    try {
      // Get tokens dynamically
      const { accessToken, accountId } = await this.getTokens();
      
      if (!accessToken || !accountId) {
        return {
          success: false,
          message: 'AWeber OAuth not completed. Please complete OAuth flow first by visiting /api/auth/aweber?action=connect'
        };
      }

      // Use custom listId if provided, otherwise use default
      const targetListId = subscriber.listId || process.env.AWEBER_SELLER_LIST_ID || process.env.AWEBER_LIST_ID;
      
      if (!targetListId) {
        return {
          success: false,
          message: 'AWeber list ID not configured'
        };
      }
      
      const url = `${this.baseUrl}/accounts/${accountId}/lists/${targetListId}/subscribers`;
      
      const payload = {
        email: subscriber.email,
        name: subscriber.name || '',
        custom_fields: subscriber.customFields || {},
        tags: subscriber.tags || []
      };

      console.log('Subscribing to AWeber:', { 
        email: subscriber.email, 
        listId: targetListId, 
        accountId,
        tokenPreview: accessToken.substring(0, 20) + '...'
      });

      let response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('AWeber API response:', response.status, response.statusText);

      // If 401 Unauthorized, try to refresh the token
      if (response.status === 401) {
        console.log('Access token expired, attempting to refresh...')
        const { refreshAWeberToken } = await import('./aweber-token-refresh')
        const refreshResult = await refreshAWeberToken()
        
        if (refreshResult.access_token) {
          // Retry with new token
          response = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${refreshResult.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
          });
        } else {
          return {
            success: false,
            message: `Token refresh failed: ${refreshResult.error}`
          };
        }
      }

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: 'Successfully subscribed to newsletter',
          subscriberId: data.entries?.[0]?.id
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('AWeber API error details:', errorData);
        return {
          success: false,
          message: errorData.error?.message || `AWeber API error: ${response.status}`
        };
      }
    } catch (error: any) {
      console.error('AWeber subscription error:', error);
      return {
        success: false,
        message: error.message || 'Failed to subscribe to newsletter'
      };
    }
  }

  /**
   * Subscribe a user during registration
   */
  async subscribeNewUser(subscriber: AWeberSubscriber): Promise<AWeberResponse> {
    // Add registration-specific tags
    const subscriberWithTags = {
      ...subscriber,
      tags: [...(subscriber.tags || []), 'new-user', 'registration']
    };

    return this.subscribeToNewsletter(subscriberWithTags);
  }

  /**
   * Subscribe a user during Google sign-in
   */
  async subscribeGoogleUser(subscriber: AWeberSubscriber): Promise<AWeberResponse> {
    // Add Google sign-in specific tags
    const subscriberWithTags = {
      ...subscriber,
      tags: [...(subscriber.tags || []), 'google-signin', 'social-auth']
    };

    return this.subscribeToNewsletter(subscriberWithTags);
  }

}

// Export helper functions for server-side usage
export const subscribeToNewsletterServer = (subscriber: AWeberSubscriber) => {
  const api = new AWeberServerAPI();
  return api.subscribeToNewsletter(subscriber);
};

export const subscribeNewUserServer = (subscriber: AWeberSubscriber) => {
  const api = new AWeberServerAPI();
  return api.subscribeNewUser(subscriber);
};

export const subscribeGoogleUserServer = (subscriber: AWeberSubscriber) => {
  const api = new AWeberServerAPI();
  return api.subscribeGoogleUser(subscriber);
};
