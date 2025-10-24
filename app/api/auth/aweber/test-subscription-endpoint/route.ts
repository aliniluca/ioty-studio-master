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

    // Test the subscription endpoint specifically
    const listId = process.env.AWEBER_SELLER_LIST_ID || process.env.AWEBER_LIST_ID
    if (!listId) {
      return NextResponse.json({
        error: 'No list ID configured',
        envVars: {
          AWEBER_SELLER_LIST_ID: !!process.env.AWEBER_SELLER_LIST_ID,
          AWEBER_LIST_ID: !!process.env.AWEBER_LIST_ID
        }
      }, { status: 400 })
    }

    const url = `https://api.aweber.com/1.0/accounts/${accountId}/lists/${listId}/subscribers`
    
    console.log('Testing subscription endpoint:', {
      url,
      accountId,
      listId,
      tokenPreview: accessToken.substring(0, 10) + '...'
    });

    // Test with a simple GET request first to see if the endpoint is accessible
    const testResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const responseData = {
      status: testResponse.status,
      statusText: testResponse.statusText,
      url,
      accountId,
      listId,
      tokenPreview: accessToken.substring(0, 10) + '...'
    };

    if (testResponse.ok) {
      const data = await testResponse.json();
      return NextResponse.json({
        success: true,
        message: 'Subscription endpoint is accessible',
        ...responseData,
        subscriberCount: data.total_size || 0
      });
    } else {
      const errorText = await testResponse.text().catch(() => 'Unknown error');
      return NextResponse.json({
        success: false,
        message: 'Subscription endpoint test failed',
        error: errorText,
        ...responseData
      }, { status: testResponse.status });
    }

  } catch (error: any) {
    console.error('Subscription endpoint test error:', error);
    return NextResponse.json({
      error: 'Failed to test subscription endpoint',
      message: error.message
    }, { status: 500 });
  }
}
