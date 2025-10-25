import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('aweber_access_token')?.value
    const accountId = cookieStore.get('aweber_account_id')?.value
    const refreshToken = cookieStore.get('aweber_refresh_token')?.value

    // Check environment variables
    const envConfig = {
      hasClientId: !!process.env.AWEBER_CLIENT_ID,
      hasClientSecret: !!process.env.AWEBER_CLIENT_SECRET,
      hasSellerListId: !!process.env.AWEBER_SELLER_LIST_ID,
      hasBuyerListId: !!process.env.AWEBER_BUYER_LIST_ID,
      hasListId: !!process.env.AWEBER_LIST_ID,
      sellerListId: process.env.AWEBER_SELLER_LIST_ID,
      buyerListId: process.env.AWEBER_BUYER_LIST_ID,
      listId: process.env.AWEBER_LIST_ID,
      useAweber: process.env.NEWSLETTER_USE_AWEBER
    };

    // Check cookies
    const cookieConfig = {
      hasAccessToken: !!accessToken,
      hasAccountId: !!accountId,
      hasRefreshToken: !!refreshToken,
      accessTokenPreview: accessToken ? accessToken.substring(0, 10) + '...' : 'none',
      accountId,
      refreshTokenPreview: refreshToken ? refreshToken.substring(0, 10) + '...' : 'none'
    };

    // Test token validity with a simple API call
    let tokenTest = null;
    if (accessToken && accountId) {
      try {
        const testResponse = await fetch(`https://api.aweber.com/1.0/accounts/${accountId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        const testResponseText = await testResponse.text();
        
        tokenTest = {
          status: testResponse.status,
          statusText: testResponse.statusText,
          hasContent: !!testResponseText,
          contentLength: testResponseText.length,
          contentPreview: testResponseText.substring(0, 200),
          isOk: testResponse.ok
        };
      } catch (error: any) {
        tokenTest = {
          error: error.message,
          isOk: false
        };
      }
    }

    return NextResponse.json({
      success: true,
      message: 'AWeber configuration check completed',
      environment: envConfig,
      cookies: cookieConfig,
      tokenTest
    });

  } catch (error: any) {
    console.error('AWeber config check error:', error)
    return NextResponse.json({
      error: 'Failed to check AWeber configuration',
      message: error.message
    }, { status: 500 })
  }
}
