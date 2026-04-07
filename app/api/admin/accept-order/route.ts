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
    const { orderId, agentId } = await request.json();

    if (!orderId || !agentId) {
      return NextResponse.json({ error: 'Missing orderId or agentId' }, { status: 400 });
    }

    if (!supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY in server environment' }, { status: 500 });
    }

    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .update({ status: 'accepted' })
      .eq('id', orderId);

    if (orderError) {
      throw orderError;
    }

    const { error: deliveryError } = await supabaseAdmin
      .from('deliveries')
      .insert({
        order_id: orderId,
        agent_id: agentId,
        status: 'assigned',
      });

    if (deliveryError) {
      throw deliveryError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin accept order API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
