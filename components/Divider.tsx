export default function Divider({ label = 'or' }: { label?: string }) {
  return (
    <div className="my-4 flex items-center gap-3">
      <div className="h-px flex-1 bg-gray-200 dark:bg-zinc-800" />
      <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</span>
      <div className="h-px flex-1 bg-gray-200 dark:bg-zinc-800" />
    </div>
  )
}


