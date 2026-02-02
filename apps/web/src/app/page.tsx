export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <h1 className="text-6xl font-bold">🧠</h1>
          <div>
            <h1 className="text-4xl font-bold">CoBrain</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Your AI thinking partner
            </p>
          </div>
        </div>

        <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-8 bg-white/50 dark:bg-black/50 backdrop-blur">
          <p className="text-center text-lg mb-4">
            Open-source second brain with local AI
          </p>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li>🆓 Free forever with local AI</li>
            <li>🔒 Privacy-first - your data stays local</li>
            <li>🧠 Zero structure - AI auto-organizes</li>
            <li>💬 Conversational queries</li>
            <li>🔗 Auto-linking knowledge graph</li>
          </ul>
        </div>

        <div className="flex gap-4">
          <a
            href="https://github.com/cobrain-ai/cobrain"
            className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-semibold hover:opacity-80 transition"
            target="_blank"
            rel="noopener noreferrer"
          >
            ⭐ Star on GitHub
          </a>
          <a
            href="#"
            className="px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            Get Started →
          </a>
        </div>

        <p className="text-sm text-gray-500 mt-8">
          Status: 🚧 In Development • Built in Public
        </p>
      </div>
    </main>
  )
}
