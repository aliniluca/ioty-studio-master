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

    // Test the exact subscription endpoint that's failing
    const testEmail = 'test@example.com';
    const listId = '6920977';
    const url = `https://api.aweber.com/1.0/accounts/${accountId}/lists/${listId}/subscribers`;
    
    const payload = {
      email: testEmail,
      name: 'Test User',
      custom_fields: {},
      tags: ['test-subscription']
    };

    console.log('Testing AWeber subscription POST:', {
      url,
      accountId,
      listId,
      payload,
      tokenPreview: accessToken.substring(0, 10) + '...'
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    
    console.log('AWeber subscription POST response:', {
      status: response.status,
      statusText: response.statusText,
      hasContent: !!responseText,
      contentLength: responseText.length,
      contentPreview: responseText.substring(0, 500),
      headers: Object.fromEntries(response.headers.entries())
    });

    let parsedData = null;
    try {
      if (responseText.trim()) {
        parsedData = JSON.parse(responseText);
      }
    } catch (parseError: any) {
      console.error('Failed to parse response JSON:', parseError.message);
    }

    return NextResponse.json({
      success: response.ok,
      message: response.ok ? 'Subscription test successful' : 'Subscription test failed',
      status: response.status,
      statusText: response.statusText,
      hasContent: !!responseText,
      contentLength: responseText.length,
      contentPreview: responseText.substring(0, 500),
      parsedData,
      url,
      accountId,
      listId,
      headers: Object.fromEntries(response.headers.entries())
    });

  } catch (error: any) {
    console.error('AWeber subscription test error:', error)
    return NextResponse.json({
      error: 'Failed to test AWeber subscription',
      message: error.message
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
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

    // Test the exact subscription endpoint that's failing
    const testEmail = 'test@example.com';
    const listId = '6920977';
    const url = `https://api.aweber.com/1.0/accounts/${accountId}/lists/${listId}/subscribers`;
    
    const payload = {
      email: testEmail,
      name: 'Test User',
      custom_fields: {},
      tags: ['test-subscription']
    };

    console.log('Testing AWeber subscription POST:', {
      url,
      accountId,
      listId,
      payload,
      tokenPreview: accessToken.substring(0, 10) + '...'
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    
    console.log('AWeber subscription POST response:', {
      status: response.status,
      statusText: response.statusText,
      hasContent: !!responseText,
      contentLength: responseText.length,
      contentPreview: responseText.substring(0, 500),
      headers: Object.fromEntries(response.headers.entries())
    });

    let parsedData = null;
    try {
      if (responseText.trim()) {
        parsedData = JSON.parse(responseText);
      }
    } catch (parseError: any) {
      console.error('Failed to parse response JSON:', parseError.message);
    }

    return NextResponse.json({
      success: response.ok,
      message: response.ok ? 'Subscription test successful' : 'Subscription test failed',
      status: response.status,
      statusText: response.statusText,
      hasContent: !!responseText,
      contentLength: responseText.length,
      contentPreview: responseText.substring(0, 500),
      parsedData,
      url,
      accountId,
      listId,
      headers: Object.fromEntries(response.headers.entries())
    });

  } catch (error: any) {
    console.error('AWeber subscription test error:', error)
    return NextResponse.json({
      error: 'Failed to test AWeber subscription',
      message: error.message
    }, { status: 500 })
  }
}
