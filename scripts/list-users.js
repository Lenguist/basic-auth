/* Dev utility: lists all users in the Supabase project (email, id, created, last sign-in).
   Usage:
     SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/list-users.js
   NOTE: Service Role key is required. Use only on DEV. */
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function listAllUsers() {
  const perPage = 100
  let page = 1
  const all = []

  // Paginate until no more users are returned
  // listUsers supports { page, perPage } in supabase-js v2
  // Fallback: single call if pagination not supported
  while (true) {
    const res = await admin.auth.admin.listUsers({ page, perPage }).catch(() => null)
    if (!res || res.error) {
      // Try non-paginated call as fallback
      const single = await admin.auth.admin.listUsers()
      if (single?.error) {
        throw single.error
      }
      const users = single?.data?.users ?? []
      all.push(...users)
      break
    }
    const users = res?.data?.users ?? []
    if (users.length === 0) break
    all.push(...users)
    if (users.length < perPage) break
    page += 1
  }

  return all
}

async function main() {
  const users = await listAllUsers()
  if (!users.length) {
    console.log('No users found.')
    return
  }
  const rows = users.map((u) => ({
    email: u.email,
    id: u.id,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
  }))
  console.table(rows)
  console.log(`Total users: ${rows.length}`)
}

main().catch((e) => {
  console.error('Failed to list users:', e)
  process.exit(1)
})


