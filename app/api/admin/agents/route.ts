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

export async function GET() {
  try {
    if (!supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY in server environment' }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 100 });
    if (error) {
      throw error;
    }

    const agents = (data?.users || [])
      .filter((user: any) => user.user_metadata?.role === 'agent')
      .map((user: any) => ({
        id: user.id,
        email: user.email ?? 'unknown',
        role: 'agent' as const,
      }));

    return NextResponse.json({ data: agents });
  } catch (error: any) {
    console.error('Admin agents API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
