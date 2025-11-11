/* Dev reset script: removes demo users and sample papers seeded for development.
   Usage:
     SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/reset-dev.js
   NOTE: Use only against your DEV Supabase project. */
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const demoEmails = [
  'alice@example.dev',
  'bob@example.dev',
  'charlie@example.dev',
  'david@example.dev',
  'elaine@example.dev',
]

const sampleOpenalexIds = [
  'W2741809807', // Attention Is All You Need
  'W1999700147', // AlexNet
  'W3044976299', // BERT
  'W4281986121', // GPT-3
  'W2149351940', // ResNet
]

async function findUserByEmail(email) {
  const res = await admin.auth.admin.listUsers()
  const user = res?.data?.users?.find((u) => u.email === email)
  return user || null
}

async function deleteUsersByEmail(emails) {
  for (const email of emails) {
    const user = await findUserByEmail(email)
    if (!user) {
      console.log(`User not found (skipping): ${email}`)
      continue
    }
    console.log(`Deleting user: ${email} (${user.id})`)
    const del = await admin.auth.admin.deleteUser(user.id)
    if (del?.error) {
      console.error(`Failed to delete user ${email}:`, del.error)
      throw del.error
    }
  }
}

async function deleteSamplePapers(openalexIds) {
  console.log('Deleting sample papers…')
  const res = await admin.from('papers').delete().in('openalex_id', openalexIds)
  if (res.error) {
    console.error('Failed to delete sample papers:', res.error)
    throw res.error
  }
}

async function reset() {
  console.log('Starting dev reset...')
  // Deleting users will cascade to profiles, follows, user_papers, posts
  await deleteUsersByEmail(demoEmails)
  // Remove sample papers (will cascade delete any remaining user_papers referencing them)
  await deleteSamplePapers(sampleOpenalexIds)
  console.log('Dev reset complete.')
}

reset().catch((e) => {
  console.error('Reset failed:', e)
  process.exit(1)
})


