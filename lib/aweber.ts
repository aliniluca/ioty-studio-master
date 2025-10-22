/**
 * AWeber Client-Side API Integration Utility
 * Handles newsletter subscriptions and user registration on the client
 */

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

class AWeberAPI {
  private accessToken: string;
  private accountId: string;
  private listId: string;
  private baseUrl: string;

  constructor() {
    // Use environment variables for client-side usage
    this.accessToken = process.env.AWEBER_ACCESS_TOKEN || '';
    this.accountId = process.env.AWEBER_ACCOUNT_ID || '';
    this.listId = process.env.AWEBER_LIST_ID || '';
    this.baseUrl = 'https://api.aweber.com/1.0';
    
    if (!this.accessToken || !this.accountId || !this.listId) {
      console.warn('AWeber configuration missing. Please set AWEBER_ACCESS_TOKEN, AWEBER_ACCOUNT_ID, and AWEBER_LIST_ID environment variables.');
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

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

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

  /**
   * Get subscriber information
   */
  async getSubscriber(email: string): Promise<AWeberResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'AWeber not configured'
      };
    }

    try {
      const url = `${this.baseUrl}/accounts/${this.accountId}/lists/${this.listId}/subscribers`;
      const params = new URLSearchParams({ 'ws.op': 'find', 'email': email });
      
      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: 'Subscriber found',
          subscriberId: data.entries?.[0]?.id
        };
      } else {
        return {
          success: false,
          message: 'Subscriber not found'
        };
      }
    } catch (error: any) {
      console.error('AWeber get subscriber error:', error);
      return {
        success: false,
        message: error.message || 'Failed to get subscriber'
      };
    }
  }

  /**
   * Update subscriber information
   */
  async updateSubscriber(email: string, updates: Partial<AWeberSubscriber>): Promise<AWeberResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'AWeber not configured'
      };
    }

    try {
      // First, get the subscriber
      const subscriberResult = await this.getSubscriber(email);
      if (!subscriberResult.success || !subscriberResult.subscriberId) {
        return {
          success: false,
          message: 'Subscriber not found'
        };
      }

      const url = `${this.baseUrl}/accounts/${this.accountId}/lists/${this.listId}/subscribers/${subscriberResult.subscriberId}`;
      
      const payload: any = {};
      if (updates.name) payload.name = updates.name;
      if (updates.customFields) payload.custom_fields = updates.customFields;
      if (updates.tags) payload.tags = updates.tags;

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        return {
          success: true,
          message: 'Subscriber updated successfully'
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.error?.message || `AWeber API error: ${response.status}`
        };
      }
    } catch (error: any) {
      console.error('AWeber update subscriber error:', error);
      return {
        success: false,
        message: error.message || 'Failed to update subscriber'
      };
    }
  }
}

// Export a singleton instance
export const aweberAPI = new AWeberAPI();

// Export helper functions for easier usage
export const subscribeToNewsletter = (subscriber: AWeberSubscriber) => 
  aweberAPI.subscribeToNewsletter(subscriber);

export const subscribeNewUser = (subscriber: AWeberSubscriber) => 
  aweberAPI.subscribeNewUser(subscriber);

export const subscribeGoogleUser = (subscriber: AWeberSubscriber) => 
  aweberAPI.subscribeGoogleUser(subscriber);

export const getSubscriber = (email: string) => 
  aweberAPI.getSubscriber(email);

export const updateSubscriber = (email: string, updates: Partial<AWeberSubscriber>) => 
  aweberAPI.updateSubscriber(email, updates);
