import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

const invalidUrlPlaceholders = [
  'your_supabase_project_url',
  'your-project.supabase.co',
]

const invalidAnonKeyPatterns = [
  'your_supabase_anon_key',
  'pk_test_',
  'pk_live_',
  'sk_test_',
  'sk_live_',
]

const isSupabaseUrlValid =
  !!supabaseUrl && /^https?:\/\//.test(supabaseUrl) && !invalidUrlPlaceholders.some((placeholder) => supabaseUrl.includes(placeholder))
const isSupabaseKeyValid =
  !!supabaseAnonKey && !invalidAnonKeyPatterns.some((pattern) => supabaseAnonKey.includes(pattern))

export const isSupabaseConfigured = isSupabaseUrlValid && isSupabaseKeyValid

function createFallbackSupabaseClient() {
  const chain: any = {
    select() {
      return this
    },
    order() {
      return this
    },
    eq() {
      return this
    },
    in() {
      return this
    },
    update() {
      return this
    },
    then(onfulfilled: any, onrejected: any) {
      return Promise.resolve({ data: [], error: null }).then(onfulfilled, onrejected)
    },
    catch(onrejected: any) {
      return Promise.resolve({ data: [], error: null }).catch(onrejected)
    },
  }

  return {
    from: () => chain,
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: (_callback: any) => ({
        data: { subscription: { unsubscribe: () => {} } },
        error: null,
      }),
      signInWithPassword: async () => ({ data: null, error: null }),
      signUp: async () => ({ data: null, error: null }),
      signOut: async () => ({ error: null }),
      admin: {
        listUsers: async () => ({ data: { users: [] }, error: null }),
      },
    },
  }
}

if (!isSupabaseConfigured) {
  if (typeof console !== 'undefined' && process.env.NODE_ENV === 'development') {
    // Silently use fallback in development
  }
}

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (createFallbackSupabaseClient() as unknown as SupabaseClient)
