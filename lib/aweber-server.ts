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
  private accessToken: string;
  private accountId: string;
  private listId: string;
  private baseUrl: string;

  constructor() {
    // Try to get tokens from cookies first (OAuth flow)
    try {
      const cookieStore = cookies()
      this.accessToken = cookieStore.get('aweber_access_token')?.value || process.env.AWEBER_ACCESS_TOKEN || '';
      this.accountId = cookieStore.get('aweber_account_id')?.value || process.env.AWEBER_ACCOUNT_ID || '';
    } catch (error) {
      // Fallback to environment variables if cookies are not available
      this.accessToken = process.env.AWEBER_ACCESS_TOKEN || '';
      this.accountId = process.env.AWEBER_ACCOUNT_ID || '';
    }
    
    this.listId = process.env.AWEBER_SELLER_LIST_ID || process.env.AWEBER_LIST_ID || '';
    this.baseUrl = 'https://api.aweber.com/1.0';
    
    if (!this.accessToken || !this.accountId) {
      console.warn('AWeber configuration missing. Please set up OAuth or set AWEBER_ACCESS_TOKEN and AWEBER_ACCOUNT_ID environment variables.');
    }
    
    if (!this.listId) {
      console.warn('AWeber list ID missing. Please set AWEBER_SELLER_LIST_ID, AWEBER_BUYER_LIST_ID, or AWEBER_LIST_ID environment variables.');
    }
  }

  /**
   * Subscribe a user to the newsletter
   */
  async subscribeToNewsletter(subscriber: AWeberSubscriber): Promise<AWeberResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'AWeber not configured'
      };
    }

    try {
      // Use custom listId if provided, otherwise use default
      const targetListId = subscriber.listId || this.listId;
      const url = `${this.baseUrl}/accounts/${this.accountId}/lists/${targetListId}/subscribers`;
      
      const payload = {
        email: subscriber.email,
        name: subscriber.name || '',
        custom_fields: subscriber.customFields || {},
        tags: subscriber.tags || []
      };

      let response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

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

  /**
   * Check if AWeber is properly configured
   */
  private isConfigured(): boolean {
    return !!(this.accessToken && this.accountId && this.listId);
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
