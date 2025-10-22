import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const headersList = headers()
    const signature = headersList.get('x-aweber-signature')
    const timestamp = headersList.get('x-aweber-timestamp')
    
    // Get the raw body for signature verification
    const body = await req.text()
    
    // Verify webhook signature (optional but recommended for security)
    if (process.env.AWEBER_WEBHOOK_SECRET && signature && timestamp) {
      const isValid = await verifyWebhookSignature(body, signature, timestamp)
      if (!isValid) {
        console.error('Invalid webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const webhookData = JSON.parse(body)
    console.log('AWeber webhook received:', webhookData)

    // Handle different webhook events
    switch (webhookData.event) {
      case 'subscriber.added':
        await handleSubscriberAdded(webhookData)
        break
      
      case 'subscriber.subscribed':
        await handleSubscriberSubscribed(webhookData)
        break
      
      case 'subscriber.unsubscribed':
        await handleSubscriberUnsubscribed(webhookData)
        break
      
      default:
        console.log('Unhandled webhook event:', webhookData.event)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('AWeber webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleSubscriberAdded(data: any) {
  console.log('New subscriber added:', {
    email: data.subscriber?.email,
    name: data.subscriber?.name,
    listId: data.list?.id,
    listName: data.list?.name,
    addedAt: data.subscriber?.added_at
  })
  
  // Here you can:
  // - Send welcome email
  // - Update your database
  // - Send notification to admin
  // - Trigger other integrations
}

async function handleSubscriberSubscribed(data: any) {
  console.log('Subscriber confirmed subscription:', {
    email: data.subscriber?.email,
    name: data.subscriber?.name,
    listId: data.list?.id,
    listName: data.list?.name,
    subscribedAt: data.subscriber?.subscribed_at
  })
  
  // Here you can:
  // - Send confirmation email
  // - Update subscriber status in your database
  // - Add to specific segments
  // - Trigger welcome sequence
}

async function handleSubscriberUnsubscribed(data: any) {
  console.log('Subscriber unsubscribed:', {
    email: data.subscriber?.email,
    name: data.subscriber?.name,
    listId: data.list?.id,
    listName: data.list?.name,
    unsubscribedAt: data.subscriber?.unsubscribed_at
  })
  
  // Here you can:
  // - Update subscriber status in your database
  // - Send feedback survey
  // - Remove from other lists
  // - Update analytics
}

async function verifyWebhookSignature(body: string, signature: string, timestamp: string): Promise<boolean> {
  // AWeber webhook signature verification
  // This is a simplified version - you should implement proper HMAC verification
  const crypto = await import('crypto')
  const secret = process.env.AWEBER_WEBHOOK_SECRET
  
  if (!secret) return true // Skip verification if no secret is set
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(timestamp + body)
    .digest('hex')
  
  return signature === expectedSignature
}

// Handle GET requests for webhook verification (if needed)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const challenge = searchParams.get('challenge')
  
  if (challenge) {
    // AWeber might send a challenge for webhook verification
    return new NextResponse(challenge)
  }
  
  return NextResponse.json({ message: 'AWeber webhook endpoint' })
}
