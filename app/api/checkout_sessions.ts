import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Use Stripe test secret key from environment variable
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51N...', {
  apiVersion: '2023-10-16',
});

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json();
    // Map cart items to Stripe line items
    const line_items = (items || []).map((item: any) => ({
      price_data: {
        currency: 'ron',
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100), // Stripe expects amount in cents
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:9002'}/cart?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:9002'}/cart?canceled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// To use your own Stripe keys, set STRIPE_SECRET_KEY and NEXT_PUBLIC_DOMAIN in your .env.local file. 