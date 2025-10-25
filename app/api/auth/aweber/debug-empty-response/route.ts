import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('aweber_access_token')?.value
    const accountId = cookieStore.get('aweber_account_id')?.value

    if (!accessToken || !accountId) {
      return NextResponse.json({
        error: 'No tokens available',
        hasAccessToken: !!accessToken,
        hasAccountId: !!accountId
      }, { status: 400 })
    }

    // Test different endpoints to see which ones return empty responses
    const testEndpoints = [
      {
        name: 'Account Info',
        url: `https://api.aweber.com/1.0/accounts/${accountId}`,
        method: 'GET'
      },
      {
        name: 'Lists',
        url: `https://api.aweber.com/1.0/accounts/${accountId}/lists`,
        method: 'GET'
      },
      {
        name: 'Test List Subscribers (GET)',
        url: `https://api.aweber.com/1.0/accounts/${accountId}/lists/6920977/subscribers`,
        method: 'GET'
      }
    ];

    const results = [];

    for (const endpoint of testEndpoints) {
      try {
        console.log(`Testing ${endpoint.name}:`, endpoint.url);
        
        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        const responseText = await response.text();
        
        const result = {
          name: endpoint.name,
          url: endpoint.url,
          method: endpoint.method,
          status: response.status,
          statusText: response.statusText,
          hasContent: !!responseText,
          contentLength: responseText.length,
          contentPreview: responseText.substring(0, 200),
          headers: Object.fromEntries(response.headers.entries()),
          isOk: response.ok
        };

        results.push(result);
        console.log(`${endpoint.name} result:`, result);

      } catch (error: any) {
        results.push({
          name: endpoint.name,
          url: endpoint.url,
          method: endpoint.method,
          error: error.message,
          isOk: false
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'AWeber API diagnostic completed',
      accountId,
      tokenPreview: accessToken.substring(0, 10) + '...',
      results
    });

  } catch (error: any) {
    console.error('AWeber diagnostic error:', error)
    return NextResponse.json({
      error: 'Failed to run AWeber diagnostic',
      message: error.message
    }, { status: 500 })
  }
}
