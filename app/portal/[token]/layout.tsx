import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Document Portal — MortgageAI',
  description: 'Securely submit your mortgage documents',
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center">
            <span className="text-slate-900 font-black text-xs">M</span>
          </div>
          <span className="font-bold text-slate-900">MortgageAI</span>
          <span className="text-slate-400 text-sm ml-2">Secure Document Portal</span>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-8">{children}</main>
      <footer className="text-center py-6 text-xs text-slate-400">
        <span>🔒 Your documents are encrypted and secure</span>
      </footer>
    </div>
  )
}
