import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('aweber_access_token')?.value
    const accountId = cookieStore.get('aweber_account_id')?.value
    const refreshToken = cookieStore.get('aweber_refresh_token')?.value

    if (!accessToken || !accountId) {
      return NextResponse.json({
        error: 'No tokens available',
        hasAccessToken: !!accessToken,
        hasAccountId: !!accountId,
        hasRefreshToken: !!refreshToken
      }, { status: 400 })
    }

    // Test the current token
    console.log('Testing AWeber token...', {
      accountId,
      tokenPreview: accessToken.substring(0, 10) + '...'
    });

    const testResponse = await fetch(`https://api.aweber.com/1.0/accounts/${accountId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const responseData = {
      status: testResponse.status,
      statusText: testResponse.statusText,
      hasAccessToken: !!accessToken,
      hasAccountId: !!accountId,
      hasRefreshToken: !!refreshToken,
      tokenPreview: accessToken.substring(0, 10) + '...'
    };

    if (testResponse.ok) {
      const data = await testResponse.json();
      return NextResponse.json({
        success: true,
        message: 'Token is valid',
        ...responseData,
        accountData: {
          id: data.id,
          name: data.name
        }
      });
    } else {
      const errorText = await testResponse.text().catch(() => 'Unknown error');
      return NextResponse.json({
        success: false,
        message: 'Token is invalid',
        error: errorText,
        ...responseData
      }, { status: testResponse.status });
    }

  } catch (error: any) {
    console.error('Token test error:', error);
    return NextResponse.json({
      error: 'Failed to test token',
      message: error.message
    }, { status: 500 });
  }
}
