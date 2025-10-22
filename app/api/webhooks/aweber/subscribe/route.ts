import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const webhookData = await req.json()
    console.log('AWeber subscribe webhook:', webhookData)

    // Handle subscription-related events
    switch (webhookData.event) {
      case 'subscriber.added':
        await handleNewSubscription(webhookData)
        break
      
      case 'subscriber.subscribed':
        await handleSubscriptionConfirmed(webhookData)
        break
      
      case 'subscriber.unsubscribed':
        await handleUnsubscription(webhookData)
        break
      
      default:
        console.log('Unhandled subscribe webhook event:', webhookData.event)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Subscribe webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleNewSubscription(data: any) {
  const subscriber = data.subscriber
  const list = data.list
  
  console.log('New subscription from website:', {
    email: subscriber?.email,
    name: subscriber?.name,
    listName: list?.name,
    source: 'website',
    timestamp: new Date().toISOString()
  })
  
  // You can add custom logic here:
  // - Send welcome email
  // - Update analytics
  // - Notify admin
  // - Add to CRM
}

async function handleSubscriptionConfirmed(data: any) {
  const subscriber = data.subscriber
  const list = data.list
  
  console.log('Subscription confirmed:', {
    email: subscriber?.email,
    name: subscriber?.name,
    listName: list?.name,
    confirmedAt: subscriber?.subscribed_at
  })
  
  // You can add custom logic here:
  // - Send confirmation email
  // - Update user status in your database
  // - Trigger welcome sequence
}

async function handleUnsubscription(data: any) {
  const subscriber = data.subscriber
  const list = data.list
  
  console.log('User unsubscribed:', {
    email: subscriber?.email,
    name: subscriber?.name,
    listName: list?.name,
    unsubscribedAt: subscriber?.unsubscribed_at
  })
  
  // You can add custom logic here:
  // - Update user status in your database
  // - Send feedback survey
  // - Update analytics
}
