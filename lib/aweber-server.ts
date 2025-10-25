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

  /**
   * Check if AWeber OAuth is properly configured
   */
  private async isOAuthConfigured(): Promise<boolean> {
    const { accessToken, accountId } = await this.getTokens();
    return !!(accessToken && accountId);
  }

  /**
   * Clear OAuth tokens from cookies
   */
  private async clearOAuthTokens(): Promise<void> {
    try {
      const cookieStore = await cookies()
      cookieStore.delete('aweber_access_token')
      cookieStore.delete('aweber_account_id')
      cookieStore.delete('aweber_refresh_token')
      console.log('AWeber OAuth tokens cleared')
    } catch (error) {
      console.error('Error clearing OAuth tokens:', error)
    }
  }

  /**
   * Get a valid access token, with optional validation
   */
  private async getValidAccessToken(validateToken: boolean = true): Promise<{ accessToken: string; accountId: string } | null> {
    const { accessToken, accountId } = await this.getTokens();
    
    if (!accessToken || !accountId) {
      console.log('No tokens available');
      return null;
    }

    // Skip validation if requested (for debugging)
    if (!validateToken) {
      console.log('Skipping token validation, using tokens directly');
      return { accessToken, accountId };
    }

    // Test the token by making a simple API call
    try {
      console.log('Testing AWeber access token validity...', {
        accountId,
        tokenPreview: accessToken.substring(0, 10) + '...'
      });
      
      const testResponse = await fetch(`${this.baseUrl}/accounts/${accountId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Token validation response:', {
        status: testResponse.status,
        statusText: testResponse.statusText
      });

      if (testResponse.status === 401) {
        console.log('Access token is invalid, attempting refresh...');
        const { refreshAWeberToken } = await import('./aweber-token-refresh');
        const refreshResult = await refreshAWeberToken();
        
        if (refreshResult.access_token) {
          console.log('Token refresh successful');
          return { accessToken: refreshResult.access_token, accountId };
        } else {
          console.error('Token refresh failed:', refreshResult.error);
          // Clear invalid tokens
          await this.clearOAuthTokens();
          return null;
        }
      }

      if (!testResponse.ok) {
        console.error('Token validation failed with status:', testResponse.status);
        const errorText = await testResponse.text().catch(() => 'Unknown error');
        console.error('Error response:', errorText);
        return null;
      }

      // Check if response has content before parsing JSON
      const responseText = await testResponse.text();
      if (!responseText.trim()) {
        console.error('Token validation returned empty response');
        return null;
      }

      try {
        JSON.parse(responseText);
      } catch (parseError: any) {
        console.error('Token validation returned invalid JSON:', {
          responseText: responseText.substring(0, 200),
          parseError: parseError.message
        });
        return null;
      }

      console.log('Token validation successful');
      return { accessToken, accountId };
    } catch (error) {
      console.error('Error validating access token:', error);
      return null;
    }
  }

  private async getTokens() {
    // Try to get tokens from cookies first (OAuth flow)
    try {
      const cookieStore = await cookies()
      const accessToken = cookieStore.get('aweber_access_token')?.value || process.env.AWEBER_ACCESS_TOKEN || '';
      const accountId = cookieStore.get('aweber_account_id')?.value || process.env.AWEBER_ACCOUNT_ID || '';
      
      console.log('Reading AWeber tokens from cookies:', {
        hasAccessToken: !!accessToken,
        hasAccountId: !!accountId,
        tokenPreview: accessToken ? accessToken.substring(0, 20) + '...' : 'none',
        accountId,
        cookieKeys: cookieStore.getAll().map(c => c.name),
        envFallback: {
          hasEnvAccessToken: !!process.env.AWEBER_ACCESS_TOKEN,
          hasEnvAccountId: !!process.env.AWEBER_ACCOUNT_ID
        }
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
      // Get tokens directly without validation (since validation is failing)
      const { accessToken, accountId } = await this.getTokens();
      
      if (!accessToken || !accountId) {
        console.error('AWeber OAuth not completed');
        return {
          success: false,
          message: 'AWeber OAuth not completed. Please complete OAuth flow first by visiting /api/auth/aweber?action=connect'
        };
      }

      // Use custom listId if provided, otherwise use default
      let targetListId = subscriber.listId || process.env.AWEBER_SELLER_LIST_ID || process.env.AWEBER_LIST_ID;
      
      // Fix list ID format - remove 'awlist' prefix if present
      if (targetListId && targetListId.startsWith('awlist')) {
        targetListId = targetListId.replace('awlist', '');
        console.log('Fixed list ID format:', {
          original: subscriber.listId || process.env.AWEBER_SELLER_LIST_ID || process.env.AWEBER_LIST_ID,
          fixed: targetListId
        });
      }
      
      console.log('List ID configuration:', {
        subscriberListId: subscriber.listId,
        envSellerListId: process.env.AWEBER_SELLER_LIST_ID,
        envListId: process.env.AWEBER_LIST_ID,
        finalListId: targetListId
      });
      
      if (!targetListId) {
        console.error('No AWeber list ID configured');
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
        tokenPreview: accessToken.substring(0, 20) + '...',
        url,
        payload
      });

      let response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      // If 401, try to refresh the token and retry
      if (response.status === 401) {
        console.log('Token expired, attempting refresh...');
        const { refreshAWeberToken } = await import('./aweber-token-refresh');
        const refreshResult = await refreshAWeberToken();
        
        if (refreshResult.access_token) {
          console.log('Token refreshed successfully, retrying subscription...');
          response = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${refreshResult.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
          });
        } else {
          console.error('Token refresh failed:', refreshResult.error);
        }
      }

      console.log('AWeber API response:', {
        status: response.status,
        statusText: response.statusText,
        url,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        // Check if response has content before parsing JSON
        const responseText = await response.text();
        console.log('AWeber API response content:', {
          hasContent: !!responseText,
          contentLength: responseText.length,
          contentPreview: responseText.substring(0, 100),
          status: response.status,
          statusText: response.statusText
        });
        
        // Handle successful responses (201 Created) that might be empty
        if (!responseText.trim()) {
          if (response.status === 201) {
            console.log('AWeber API returned empty response for 201 Created - this is normal');
            return {
              success: true,
              message: 'Successfully subscribed to newsletter (Created)'
            };
          } else {
            console.error('AWeber API returned empty response:', {
              status: response.status,
              statusText: response.statusText,
              url,
              headers: Object.fromEntries(response.headers.entries()),
              accountId,
              listId: targetListId
            });
            return {
              success: false,
              message: `AWeber API returned empty response (Status: ${response.status})`
            };
          }
        }
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError: any) {
          console.error('AWeber API returned invalid JSON:', {
            responseText: responseText.substring(0, 200),
            parseError: parseError.message
          });
          return {
            success: false,
            message: 'AWeber API returned invalid JSON response'
          };
        }
        
        return {
          success: true,
          message: 'Successfully subscribed to newsletter',
          subscriberId: data.entries?.[0]?.id
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('AWeber API error details:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          url,
          accountId,
          listId: targetListId,
          tokenPreview: accessToken.substring(0, 10) + '...'
        });
        
        // Handle specific error cases
        if (response.status === 401) {
          console.error('401 Error - Token might be invalid for this specific endpoint:', {
            url,
            accountId,
            listId: targetListId,
            errorData
          });
          return {
            success: false,
            message: `AWeber authentication failed. Please re-authorize your AWeber connection. (Status: ${response.status}, URL: ${url})`
          };
        } else if (response.status === 400) {
          return {
            success: false,
            message: errorData.error?.message || 'Invalid subscription data provided to AWeber.'
          };
        } else {
          return {
            success: false,
            message: errorData.error?.message || `AWeber API error: ${response.status} - ${response.statusText}`
          };
        }
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
