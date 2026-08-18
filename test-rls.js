import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
)

async function test() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: process.env.E2E_OWNER_EMAIL,
    password: process.env.E2E_USER_PASSWORD
  })
  if (authError) {
    console.error("Auth error:", authError)
    return
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', authData.user.id)
    .is('organization_id', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
    
  console.log("Error:", error)
  console.log("Data:", data)
}

test()
