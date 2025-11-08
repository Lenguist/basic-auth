/* Dev seeding script: creates demo users, profiles, follows, papers, and user_papers.
   Usage:
     SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-dev.js
   NOTE: Use only against your DEV Supabase project.
*/
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const demoUsers = [
  { email: 'alice@example.dev', username: 'alice' },
  { email: 'bob@example.dev', username: 'bob' },
  { email: 'charlie@example.dev', username: 'charlie' },
  { email: 'david@example.dev', username: 'david' },
  { email: 'elaine@example.dev', username: 'elaine' },
]

const samplePapers = [
  { openalex_id: 'W2741809807', title: 'Attention Is All You Need', authors_json: ['Ashish Vaswani', 'Noam Shazeer'], year: 2017, url: 'https://arxiv.org/abs/1706.03762', source: 'arXiv' },
  { openalex_id: 'W1999700147', title: 'ImageNet Classification with Deep Convolutional Neural Networks', authors_json: ['Alex Krizhevsky', 'Ilya Sutskever'], year: 2012, url: 'https://dl.acm.org/doi/10.1145/3065386', source: 'ACM' },
  { openalex_id: 'W3044976299', title: 'BERT: Pre-training of Deep Bidirectional Transformers', authors_json: ['Jacob Devlin'], year: 2018, url: 'https://arxiv.org/abs/1810.04805', source: 'arXiv' },
  { openalex_id: 'W4281986121', title: 'GPT-3: Language Models are Few-Shot Learners', authors_json: ['Tom B. Brown'], year: 2020, url: 'https://arxiv.org/abs/2005.14165', source: 'arXiv' },
  { openalex_id: 'W2149351940', title: 'ResNet: Deep Residual Learning for Image Recognition', authors_json: ['Kaiming He'], year: 2015, url: 'https://arxiv.org/abs/1512.03385', source: 'arXiv' },
]

async function getOrCreateUser(email) {
  // try list and find
  const all = await admin.auth.admin.listUsers()
  const found = all?.data?.users?.find((u) => u.email === email)
  if (found) return found
  // create
  const created = await admin.auth.admin.createUser({ email, email_confirm: true })
  if (created.error && created.error.status !== 422) {
    throw created.error
  }
  if (created.data?.user) return created.data.user
  // re-list as fallback
  const relisted = await admin.auth.admin.listUsers()
  return relisted?.data?.users?.find((u) => u.email === email)
}

async function seed() {
  console.log('Seeding demo users...')
  const users = {}
  for (const u of demoUsers) {
    const user = await getOrCreateUser(u.email)
    if (!user) throw new Error('Failed to get/create user: ' + u.email)
    users[u.username] = user
  }

  console.log('Upserting profiles...')
  const profiles = Object.entries(users).map(([username, user]) => ({
    id: user.id,
    username,
    display_name: username.charAt(0).toUpperCase() + username.slice(1),
    bio: `Hello, I'm ${username}.`,
    avatar_url: null,
  }))
  const profRes = await admin.from('profiles').upsert(profiles, { onConflict: 'id' })
  if (profRes.error) throw profRes.error

  console.log('Creating follows...')
  const follows = [
    // alice follows bob and charlie
    { follower_id: users.alice.id, following_id: users.bob.id },
    { follower_id: users.alice.id, following_id: users.charlie.id },
    // bob follows alice
    { follower_id: users.bob.id, following_id: users.alice.id },
    // charlie follows david and elaine
    { follower_id: users.charlie.id, following_id: users.david.id },
    { follower_id: users.charlie.id, following_id: users.elaine.id },
  ]
  for (const f of follows) {
    const r = await admin.from('follows').insert([f])
    if (r.error && r.error.code !== '23505') throw r.error
  }

  console.log('Upserting sample papers...')
  const paperRes = await admin.from('papers').upsert(samplePapers, { onConflict: 'openalex_id' })
  if (paperRes.error) throw paperRes.error

  console.log('Assigning papers to users...')
  function pick(n) {
    const arr = [...samplePapers]
    const out = []
    while (n-- && arr.length) {
      const idx = Math.floor(Math.random() * arr.length)
      out.push(arr.splice(idx, 1)[0])
    }
    return out
  }

  const userPapers = []
  for (const username of Object.keys(users)) {
    const picks = pick(3)
    for (let i = 0; i < picks.length; i++) {
      const st = i === 0 ? 'to_read' : i === 1 ? 'reading' : 'read'
      userPapers.push({
        user_id: users[username].id,
        openalex_id: picks[i].openalex_id,
        status: st,
      })
    }
  }
  for (const up of userPapers) {
    const r = await admin.from('user_papers').insert([up])
    if (r.error && r.error.code !== '23505') throw r.error
  }

  console.log('Inserting posts for activity feed...')
  const posts = []
  for (const up of userPapers) {
    posts.push({ user_id: up.user_id, type: 'added_to_library', openalex_id: up.openalex_id })
    posts.push({ user_id: up.user_id, type: 'status_changed', openalex_id: up.openalex_id, status: up.status })
  }
  const postRes = await admin.from('posts').insert(posts)
  if (postRes.error) throw postRes.error

  console.log('Seed complete.')
}

seed().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})


