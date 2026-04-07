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
    const agentId = request.nextUrl.searchParams.get('agentId');
    if (!agentId) {
      return NextResponse.json({ error: 'Missing agentId' }, { status: 400 });
    }

    if (!supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'Missing SUPABASE_SERVICE_ROLE_KEY in server environment' },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('deliveries')
      .select(`
        *,
        orders (
          *,
          order_items (
            *,
            products (*)
          )
        )
      `)
      .eq('agent_id', agentId)
      .in('status', ['assigned', 'in_progress'])
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const normalized = (data || []).map((delivery: any) => ({
      ...delivery,
      order: delivery.orders ?? delivery.order,
    }));

    return NextResponse.json({ data: normalized });
  } catch (error: any) {
    console.error('Agent deliveries API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
