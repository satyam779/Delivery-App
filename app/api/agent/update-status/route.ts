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
    const { deliveryId, status } = await request.json();

    if (!deliveryId || !status) {
      return NextResponse.json({ error: 'Missing deliveryId or status' }, { status: 400 });
    }

    if (!supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'Missing SUPABASE_SERVICE_ROLE_KEY in server environment' },
        { status: 500 }
      );
    }

    const { error: deliveryError } = await supabaseAdmin
      .from('deliveries')
      .update({ status })
      .eq('id', deliveryId);

    if (deliveryError) {
      throw deliveryError;
    }

    if (status === 'completed') {
      const { error: orderError } = await supabaseAdmin
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', (await supabaseAdmin.from('deliveries').select('order_id').eq('id', deliveryId).single()).data?.order_id);

      if (orderError) {
        throw orderError;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Agent update status API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
