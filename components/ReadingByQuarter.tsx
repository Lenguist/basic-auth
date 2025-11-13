'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabaseBrowserClient'

type Props = { userId: string }

function weekLabel(d: Date) {
  return d.toLocaleString('default', { month: 'short', day: 'numeric' })
}

export default function ReadingByQuarter({ userId }: Props) {
  const [counts, setCounts] = useState<number[]>([])
  const [labels, setLabels] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    let channel: any = null
    let pollId: number | null = null

    const fetchData = async () => {
      setLoading(true)
      const now = new Date()

      // compute last 12 weeks ending this week; weeks start on Monday
      const mondayOffset = (d: Date) => {
        // getMonday: convert Sun=0..Sat=6 to Monday-based start
        const day = d.getDay()
        // JS: Sunday=0, Monday=1, ... Saturday=6
        const diff = (day === 0) ? -6 : 1 - day
        return diff
      }

      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const currentWeekMonday = new Date(today)
      currentWeekMonday.setDate(today.getDate() + mondayOffset(today))
      currentWeekMonday.setHours(0, 0, 0, 0)

      // start 11 weeks before current week (so total 12 weeks)
      const start = new Date(currentWeekMonday)
      start.setDate(start.getDate() - 7 * 11)

      // build exactly 12 weeks starting at `start`
      const weeks: Date[] = []
      for (let i = 0; i < 12; i++) {
        const w = new Date(start)
        w.setDate(start.getDate() + i * 7)
        weeks.push(w)
      }

      // fetch library additions (user_papers) between start and now
      const res = await supabaseBrowser
        .from('user_papers')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', start.toISOString())
        .lte('created_at', now.toISOString())
        .order('created_at', { ascending: true })
        .limit(5000)

      const rows = (res.error || !res.data) ? [] : (res.data as any[])

      const bins = weeks.map(() => 0)
      const labs = weeks.map((w) => weekLabel(w))

      for (const p of rows) {
        const d = new Date(p.created_at)
        for (let i = 0; i < weeks.length; i++) {
          const weekStart = weeks[i]
          const next = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 7)
          if (d >= weekStart && d < next) {
            bins[i] = (bins[i] ?? 0) + 1
            break
          }
        }
      }

      setCounts(bins)
      setLabels(labs)
      setLoading(false)
      setLastUpdated(new Date())

      // setup realtime subscription to refresh when user_papers change for this user
      try {
        channel = supabaseBrowser
          .channel(`user_papers_user_${userId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'user_papers', filter: `user_id=eq.${userId}` }, () => {
            // refetch on any insert/update/delete for this user's library
            fetchData()
          })
          .subscribe()

        // if channel subscribe returns and we have a poll running, stop polling
        if (pollId) {
          clearInterval(pollId)
          pollId = null
        }
      } catch (e) {
        // fallback to polling every 10s if realtime subscription fails
        // eslint-disable-next-line no-console
        console.warn('realtime subscribe failed, falling back to polling', e)
        pollId = window.setInterval(() => fetchData(), 10000)
      }
    }
    if (userId) fetchData()

    return () => {
      if (channel && typeof channel.unsubscribe === 'function') {
        try { channel.unsubscribe() } catch (e) {}
      }
      try { (supabaseBrowser as any).removeChannel?.(channel) } catch (e) {}
      if (pollId) {
        try { clearInterval(pollId) } catch (e) {}
      }
    }
  }, [userId])

  const maxCount = useMemo(() => Math.max(0, ...counts), [counts])
  const scaleMax = Math.max(1, maxCount)

  if (loading) return <div className="text-sm text-gray-500">Loading chart…</div>

  return (
    <div className="mt-4">
      <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Last quarter in papers:</h3>
      <div className="w-full">
        <div className="flex gap-4">
          {/* Y axis */}
          <div className="w-12 flex flex-col items-end text-xs text-gray-600 dark:text-gray-400">
            <div className="mb-1">{maxCount}</div>
            <div className="flex-1 flex items-center">{Math.ceil(maxCount / 2)}</div>
            <div className="mt-1">0</div>
          </div>

          {/* chart bars */}
          <div className="flex-1">
            <div className="flex items-end gap-2 h-28 py-2">
              {counts.map((c, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end">
                  <div
                    className="bg-orange-500 rounded-md w-3/4 mx-auto"
                    style={{ height: `${(c / scaleMax) * 100}%`, minHeight: 6 }}
                    title={`${labels[i]}: ${c}`}
                  />
                  <div className="mt-2 text-[10px] text-gray-600 dark:text-gray-400 h-6 overflow-hidden text-center leading-tight">
                    <span className="block whitespace-nowrap truncate">{labels[i]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

