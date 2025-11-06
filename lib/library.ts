'use client'

import { supabaseBrowser } from '@/lib/supabaseBrowserClient'

export type NormalizedPaper = {
  openalex_id: string
  title: string
  authors: string[]
  year?: number | null
  url?: string | null
  source?: string | null
}

export async function addPaperToLibrary(paper: NormalizedPaper) {
  const { data: sessionData } = await supabaseBrowser.auth.getSession()
  const session = sessionData.session
  if (!session) throw new Error('Not authenticated')

  const upsertRes = await supabaseBrowser
    .from('papers')
    .upsert(
      [
        {
          openalex_id: paper.openalex_id,
          title: paper.title,
          authors_json: paper.authors,
          year: paper.year ?? null,
          url: paper.url ?? null,
          source: paper.source ?? 'openalex',
        },
      ],
      { onConflict: 'openalex_id' }
    )
  if (upsertRes.error) throw upsertRes.error

  const linkRes = await supabaseBrowser.from('user_papers').insert([
    {
      user_id: session.user.id,
      openalex_id: paper.openalex_id,
    },
  ])

  if (linkRes.error && (linkRes.error as any).code !== '23505') {
    throw linkRes.error
  }

  return { ok: true }
}


