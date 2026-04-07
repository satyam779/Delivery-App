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
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    if (!supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY in server environment' }, { status: 500 });
    }

    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId);

    if (orderError) {
      throw orderError;
    }

    const { error: deliveryError } = await supabaseAdmin
      .from('deliveries')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('order_id', orderId);

    if (deliveryError) {
      throw deliveryError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin cancel order API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
