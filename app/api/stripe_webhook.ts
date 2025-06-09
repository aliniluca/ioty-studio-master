import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51N...', {
  apiVersion: '2023-10-16',
});

// Stripe webhook secret (set in .env.local)
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_...';

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const rawBody = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, endpointSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    // You can expand this with more details as needed
    try {
      // Save order
      const orderRef = await addDoc(collection(db, 'orders'), {
        stripeSessionId: session.id,
        customer_email: session.customer_details?.email,
        amount_total: session.amount_total,
        currency: session.currency,
        payment_status: session.payment_status,
        created: new Date(),
        // Add more fields as needed (e.g., line items, userId, etc.)
      });

      // --- Notification logic ---
      // Assume session.metadata contains sellerId and product info
      // (You may need to adjust this based on your Stripe Checkout setup)
      if (session.metadata && session.metadata.sellerId && session.metadata.productName) {
        const sellerId = session.metadata.sellerId;
        const productName = session.metadata.productName;
        const notifId = uuidv4();
        await setDoc(doc(db, 'users', sellerId, 'notifications', notifId), {
          id: notifId,
          type: 'order',
          title: 'Ai primit o comandă nouă!',
          body: `O comandă pentru "${productName}" a fost plasată. Verifică detaliile în panoul tău de vânzător.`,
          createdAt: new Date().toISOString(),
          read: false,
          orderId: orderRef.id,
        });
      }
      // --- End notification logic ---
    } catch (e) {
      return NextResponse.json({ error: 'Failed to create order in Firestore.' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

// Set STRIPE_WEBHOOK_SECRET in your .env.local file. You can get this from the Stripe dashboard when you set up the webhook endpoint. 