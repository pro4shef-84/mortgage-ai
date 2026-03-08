import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Shield, Clock, CheckCircle2, FileText, Zap, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'MortgageAI — Stop Chasing Documents. Start Closing Loans.',
  description:
    'AI-powered mortgage processing assistant that automates document collection, validation, and review.',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-slate-900 font-black text-sm">M</span>
            </div>
            <span className="font-bold text-xl text-slate-900">MortgageAI</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</a>
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <Link href="/auth/login" className="hover:text-slate-900 transition-colors">Sign in</Link>
          </nav>
          <Link href="/auth/login" className="bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors">
            Get Started
          </Link>
        </div>
      </header>

      <main>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
            <Zap className="w-3.5 h-3.5" />
            Now with Claude AI document intelligence
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight mb-6 leading-tight">
            Stop chasing documents.<br />
            <span className="text-amber-500">Start closing loans.</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            MortgageAI automates document collection, AI-validates every file, and keeps your borrowers on track — so you can review ready loans, not chase paperwork.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/login" className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg shadow-amber-200">
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#how-it-works" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium px-6 py-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
              See how it works
            </a>
          </div>
        </section>

        <section className="bg-slate-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              { stat: '10+ hrs', label: 'saved per loan on document chasing' },
              { stat: '85%', label: 'of documents validated automatically' },
              { stat: '3x', label: 'faster borrower document turnaround' },
            ].map(({ stat, label }) => (
              <div key={stat}>
                <div className="text-4xl font-black text-amber-400 mb-2">{stat}</div>
                <p className="text-slate-300 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">How it works</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Three simple steps from loan creation to a review-ready file.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: <Users className="w-6 h-6 text-amber-500" />, title: 'Create the loan', description: 'Enter borrower info and loan type. MortgageAI auto-generates the document checklist and sends a secure portal link to your borrower.' },
              { step: '02', icon: <FileText className="w-6 h-6 text-amber-500" />, title: 'Borrower uploads', description: 'Borrowers use a mobile-friendly portal to upload documents. AI validates each file instantly and reminds them automatically if anything is missing.' },
              { step: '03', icon: <CheckCircle2 className="w-6 h-6 text-amber-500" />, title: 'Officer reviews', description: 'When all documents pass, you get an AI-generated summary with all issues surfaced. You review, decide, and mark the file ready.' },
            ].map(({ step, icon, title, description }) => (
              <div key={step} className="relative bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                <div className="text-6xl font-black text-slate-100 absolute top-4 right-6 select-none">{step}</div>
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4">{icon}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="bg-white border-y border-slate-200 py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Built for real mortgage workflows</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: <Zap className="w-5 h-5 text-amber-500" />, title: 'AI Document Intelligence', desc: 'Claude AI classifies every document and extracts key fields automatically.' },
                { icon: <Shield className="w-5 h-5 text-amber-500" />, title: 'Deterministic Validation', desc: 'Business rules check dates, YTD income, page counts — zero AI guesswork on compliance.' },
                { icon: <Clock className="w-5 h-5 text-amber-500" />, title: 'Auto-Reminders', desc: 'Borrowers get smart reminders until they upload. You get notified if they go silent.' },
                { icon: <CheckCircle2 className="w-5 h-5 text-amber-500" />, title: 'Human-in-the-Loop', desc: 'Suspicious docs and low-confidence classifications always escalate to a human officer.' },
                { icon: <Users className="w-5 h-5 text-amber-500" />, title: 'Borrower-First Portal', desc: 'Mobile-optimized portal with simple language and camera upload. No account needed.' },
                { icon: <FileText className="w-5 h-5 text-amber-500" />, title: 'Full Audit Trail', desc: 'Every document state change, AI decision, and officer action is logged with timestamps.' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="p-6 rounded-xl border border-slate-100 hover:border-amber-200 transition-colors">
                  <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center mb-4">{icon}</div>
                  <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                  <p className="text-sm text-slate-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
          <div className="bg-slate-900 rounded-3xl p-8 sm:p-16 text-white text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Shield className="w-5 h-5 text-amber-400" />
              <span className="text-amber-400 text-sm font-semibold uppercase tracking-wider">Bank-level security</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">Your borrowers&apos; data is protected</h2>
            <p className="text-slate-300 max-w-xl mx-auto mb-8">
              Documents are encrypted at rest and in transit. Borrowers access their portal via unique tokens. No shared credentials, RESPA-compliant workflow.
            </p>
            <Link href="/auth/login" className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-8 py-4 rounded-xl text-lg transition-colors">
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between text-sm text-slate-500">
          <span>© 2026 MortgageAI. All rights reserved.</span>
          <span>Built with AI. Reviewed by humans.</span>
        </div>
      </footer>
    </div>
  )
}
