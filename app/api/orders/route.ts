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

export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get('orderId');
    const userId = request.nextUrl.searchParams.get('userId');

    if (!supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY in server environment' }, { status: 500 });
    }

    let query = supabaseAdmin.from('orders').select(`
      *,
      deliveries (*),
      order_items (*, products (*))
    `);

    if (orderId) {
      query = query.eq('id', orderId);
    } else if (userId) {
      query = query.eq('user_id', userId);
    } else {
      return NextResponse.json({ error: 'Missing orderId or userId' }, { status: 400 });
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const normalized = (data || []).map((order: any) => ({
      ...order,
      delivery: order.deliveries?.[0] ?? null,
    }));

    return NextResponse.json({ data: normalized });
  } catch (error: any) {
    console.error('Orders API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
