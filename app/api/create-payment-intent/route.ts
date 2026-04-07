import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    detectSessionInUrl: false,
    autoRefreshToken: false,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { items, deliveryAddress, deliveryLat, deliveryLng, totalAmount, userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'Missing SUPABASE_SERVICE_ROLE_KEY on server. Add it to .env.local.' },
        { status: 500 }
      );
    }

    const orderInsert: any = {
      user_id: userId,
      total_amount: totalAmount,
      delivery_address: deliveryAddress,
      status: 'pending',
    };

    if (typeof deliveryLat === 'number') {
      orderInsert.delivery_lat = deliveryLat;
    }
    if (typeof deliveryLng === 'number') {
      orderInsert.delivery_lng = deliveryLng;
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert(orderInsert)
      .select()
      .single();

    if (orderError) throw orderError;

    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      price: item.product.price,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return NextResponse.json({
      orderId: order.id,
      status: 'success',
    });
  } catch (error: any) {
    console.error('Payment processing failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
