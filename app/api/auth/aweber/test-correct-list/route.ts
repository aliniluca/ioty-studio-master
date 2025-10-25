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

    // Test with the correct list ID (6920977 instead of awlist6920977)
    const correctListId = '6920977'
    const url = `https://api.aweber.com/1.0/accounts/${accountId}/lists/${correctListId}/subscribers`
    
    console.log('Testing subscription with correct list ID:', {
      url,
      accountId,
      listId: correctListId,
      tokenPreview: accessToken.substring(0, 10) + '...'
    });

    // Test with a simple GET request first
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
      listId: correctListId,
      tokenPreview: accessToken.substring(0, 10) + '...'
    };

    if (testResponse.ok) {
      const data = await testResponse.json();
      return NextResponse.json({
        success: true,
        message: 'Correct list ID works!',
        ...responseData,
        subscriberCount: data.total_size || 0
      });
    } else {
      const errorText = await testResponse.text().catch(() => 'Unknown error');
      return NextResponse.json({
        success: false,
        message: 'Correct list ID test failed',
        error: errorText,
        ...responseData
      }, { status: testResponse.status });
    }

  } catch (error: any) {
    console.error('Correct list test error:', error)
    return NextResponse.json({
      error: 'Failed to test correct list',
      message: error.message
    }, { status: 500 })
  }
}

