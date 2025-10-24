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

    console.log('Testing AWeber lists access...', {
      accountId,
      tokenPreview: accessToken.substring(0, 10) + '...'
    });

    // Test getting lists for the account
    const listsResponse = await fetch(`https://api.aweber.com/1.0/accounts/${accountId}/lists`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const responseData = {
      status: listsResponse.status,
      statusText: listsResponse.statusText,
      accountId,
      tokenPreview: accessToken.substring(0, 10) + '...'
    };

    if (listsResponse.ok) {
      const data = await listsResponse.json();
      return NextResponse.json({
        success: true,
        message: 'Lists accessible',
        ...responseData,
        lists: data.entries?.map((list: any) => ({
          id: list.id,
          name: list.name,
          totalSize: list.total_size
        })) || [],
        totalLists: data.total_size || 0
      });
    } else {
      const errorText = await listsResponse.text().catch(() => 'Unknown error');
      return NextResponse.json({
        success: false,
        message: 'Lists not accessible',
        error: errorText,
        ...responseData
      }, { status: listsResponse.status });
    }

  } catch (error: any) {
    console.error('Lists test error:', error)
    return NextResponse.json({
      error: 'Failed to test lists access',
      message: error.message
    }, { status: 500 })
  }
}
