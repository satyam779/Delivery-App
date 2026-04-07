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
    const { deliveryId, lat, lng } = await request.json();

    if (!deliveryId || typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: 'Missing deliveryId, lat, or lng' }, { status: 400 });
    }

    if (!supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'Missing SUPABASE_SERVICE_ROLE_KEY in server environment' },
        { status: 500 }
      );
    }

    const { error } = await supabaseAdmin
      .from('deliveries')
      .update({ current_lat: lat, current_lng: lng, updated_at: new Date().toISOString() })
      .eq('id', deliveryId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Agent update location API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
