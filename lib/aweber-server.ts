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

  private async makeRequest(
    url: string,
    options: RequestInit,
    retry: boolean = true
  ): Promise<Response> {
    let { accessToken, refreshToken, expiresAt } = await this.getTokens();

    if (!accessToken) {
      return new Response('AWeber access token not found', { status: 401 });
    }

    // Proactively refresh token if it's expired or about to expire (within 5 minutes)
    if (refreshToken && this.isTokenExpired(expiresAt)) {
      console.log('Proactively refreshing expired/expiring token before making request');
      const { refreshAWeberToken } = await import('./aweber-token-refresh');
      const refreshResult = await refreshAWeberToken(refreshToken);

      if (refreshResult.access_token) {
        accessToken = refreshResult.access_token;
        console.log('Token refreshed successfully before request');
      } else {
        console.error('Proactive token refresh failed:', refreshResult.error);
        // Continue with existing token - it might still work
      }
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    // If we still get 401 (token refresh failed or token was revoked), try one more time
    if (response.status === 401 && retry && refreshToken) {
      console.log('Received 401 error, attempting token refresh');
      const { refreshAWeberToken } = await import('./aweber-token-refresh');
      const refreshResult = await refreshAWeberToken(refreshToken);

      if (refreshResult.access_token) {
        // Update the access token for the retry
        accessToken = refreshResult.access_token;
        console.log('Token refreshed successfully after 401, retrying request');

        // Retry the request with the new token
        return this.makeRequest(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${accessToken}`,
          },
        }, false); // Don't retry again
      } else {
        console.error('Token refresh failed after 401 error:', refreshResult.error);
        console.error('Clearing tokens - user will need to reauthorize');
        await this.clearOAuthTokens();
      }
    }

    return response;
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
      cookieStore.delete('aweber_token_expires_at')
      cookieStore.delete('aweber_oauth_state')
    } catch (error) {
      console.error('Error clearing OAuth tokens:', error)
    }
  }

  /**
   * Get a valid access token, with optional validation
   */
  private async getValidAccessToken(validateToken: boolean = true): Promise<{ accessToken: string; accountId: string } | null> {
    const { accessToken, accountId, refreshToken } = await this.getTokens();
    
    if (!accessToken || !accountId) {
      return null;
    }

    // Skip validation if requested (for debugging)
    if (!validateToken) {
      return { accessToken, accountId };
    }

    // Test the token by making a simple API call
    try {
      const testResponse = await this.makeRequest(
        `${this.baseUrl}/accounts/${accountId}`,
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!testResponse.ok) {
        if (testResponse.status === 401) {
          console.error('Token is invalid and refresh failed.');
          await this.clearOAuthTokens();
        }
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
      const accessToken = cookieStore.get('aweber_access_token')?.value || '';
      const accountId = cookieStore.get('aweber_account_id')?.value || '';
      const refreshToken = cookieStore.get('aweber_refresh_token')?.value || '';
      const expiresAtStr = cookieStore.get('aweber_token_expires_at')?.value || '';
      const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : 0;

      // Debug logging for troubleshooting cookie issues
      console.log('AWeber getTokens - Cookie check:', {
        hasAccessToken: !!accessToken,
        hasAccountId: !!accountId,
        hasRefreshToken: !!refreshToken,
        hasExpiresAt: !!expiresAt,
        accessTokenPreview: accessToken ? accessToken.substring(0, 10) + '...' : 'MISSING',
        allCookies: Array.from(cookieStore.getAll()).map(c => c.name)
      });

      if (!accessToken || !accountId) {
        console.warn('AWeber tokens missing from cookies - user needs to authorize');
      }

      return { accessToken, accountId, refreshToken, expiresAt };
    } catch (error) {
      console.error('Error reading AWeber cookies:', error);
      // Fallback to environment variables if cookies are not available
      return {
        accessToken: '',
        accountId: '',
        refreshToken: '',
        expiresAt: 0
      };
    }
  }

  /**
   * Check if the access token is expired or about to expire
   * @param expiresAt - Token expiration timestamp in milliseconds
   * @param bufferMinutes - Minutes before expiration to consider token as expired (default: 5)
   * @returns true if token is expired or about to expire
   */
  private isTokenExpired(expiresAt: number, bufferMinutes: number = 5): boolean {
    if (!expiresAt) {
      return false; // If no expiration info, assume token is still valid (for backward compatibility)
    }

    const now = Date.now();
    const bufferMs = bufferMinutes * 60 * 1000;
    const isExpired = now >= (expiresAt - bufferMs);

    if (isExpired) {
      console.log('Token expired or about to expire:', {
        now: new Date(now).toISOString(),
        expiresAt: new Date(expiresAt).toISOString(),
        bufferMinutes
      });
    }

    return isExpired;
  }

  /**
   * Subscribe a user to the newsletter
   */
  async subscribeToNewsletter(subscriber: AWeberSubscriber): Promise<AWeberResponse> {
    try {
      const tokenInfo = await this.getValidAccessToken();
      
      if (!tokenInfo) {
        console.error('AWeber OAuth not completed or token is invalid');
        return {
          success: false,
          message: 'AWeber authorization is missing or invalid. Please authorize the application.'
        };
      }
      const { accessToken, accountId } = tokenInfo;

      // Use custom listId if provided, otherwise use default
      let targetListId = subscriber.listId || process.env.AWEBER_SELLER_LIST_ID || process.env.AWEBER_LIST_ID;
      
      // Fix list ID format - remove 'awlist' prefix if present
      if (targetListId && targetListId.startsWith('awlist')) {
        targetListId = targetListId.replace('awlist', '');
      }
      
      
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

      const response = await this.makeRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        // Check if response has content before parsing JSON
        const responseText = await response.text();
        
        // Handle successful responses (201 Created) that might be empty
        if (!responseText.trim()) {
          if (response.status === 201) {
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
