export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-900">
      <main className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-12 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="mb-4 text-4xl font-semibold text-gray-900 dark:text-white">
          Basic Auth Demo
        </h1>
        <p className="mb-8 max-w-md text-center text-gray-600 dark:text-gray-400">
          Welcome! This is a minimal Next.js + Tailwind setup.  
          Soon you’ll add authentication (Supabase, NextAuth, or custom).
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <button className="rounded-lg bg-black px-6 py-3 text-white transition hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200">
            Sign In
          </button>
          <button className="rounded-lg border border-gray-300 px-6 py-3 text-gray-800 transition hover:bg-gray-100 dark:border-gray-600 dark:text-white dark:hover:bg-zinc-800">
            Sign Up
          </button>
        </div>
      </main>
    </div>
  );
}
