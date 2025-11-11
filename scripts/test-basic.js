/* Basic integration test: user signup -> user_joined event exists; delete user -> event gone.
   Usage:
     SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/test-basic.js
*/
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function retry(fn, { tries = 10, delayMs = 200, description = 'operation' } = {}) {
  let lastErr
  for (let i = 0; i < tries; i++) {
    try {
      return await fn()
    } catch (e) {
      lastErr = e
      await wait(delayMs)
    }
  }
  throw new Error(`Failed after retries (${description}): ${lastErr?.message || lastErr}`)
}

async function main() {
  const unique = Date.now()
  const email = `bob.test+${unique}@example.dev`
  console.log('Creating auth user:', email)
  const createRes = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  })
  if (createRes.error) {
    console.error('Create user error:', createRes.error)
    process.exit(1)
  }
  const user = createRes.data.user
  if (!user) {
    console.error('Create user returned no user')
    process.exit(1)
  }

  try {
    console.log('Upserting profile row to trigger user_joined event...')
    const prof = await admin.from('profiles').upsert([{ id: user.id, username: null }], { onConflict: 'id' })
    if (prof.error) throw prof.error

    console.log('Checking for user_joined event...')
    const checkEvent = async () => {
      const { data, error } = await admin
        .from('posts')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', 'user_joined')
        .limit(1)
      if (error) throw error
      if (!data || data.length === 0) throw new Error('user_joined not found yet')
      return data[0]
    }
    await retry(checkEvent, { tries: 10, delayMs: 150, description: 'find user_joined' })
    console.log('user_joined event exists ✓')

    console.log('Deleting user...')
    const del = await admin.auth.admin.deleteUser(user.id)
    if (del.error) throw del.error

    console.log('Verifying events are gone...')
    const { data: after, error: afterErr } = await admin.from('posts').select('id').eq('user_id', user.id)
    if (afterErr) throw afterErr
    if ((after?.length ?? 0) !== 0) {
      console.error('Expected 0 events after delete, found:', after?.length)
      process.exit(1)
    }
    console.log('Events removed with user deletion ✓')
    console.log('BASIC TEST PASS')
    process.exit(0)
  } catch (e) {
    console.error('BASIC TEST FAIL:', e)
    // Attempt cleanup
    try {
      await admin.auth.admin.deleteUser(user.id)
    } catch {}
    process.exit(1)
  }
}

main()


