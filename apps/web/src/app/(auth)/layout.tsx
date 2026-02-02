import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-4xl">🧠</span>
            <span className="text-2xl font-bold">CoBrain</span>
          </Link>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Your AI thinking partner
          </p>
        </div>

        {children}

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-gray-500">
          By continuing, you agree to our{' '}
          <a href="/terms" className="text-blue-600 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  )
}
