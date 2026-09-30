'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { signOut } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import {
  Zap, FileText, Target, Clock, Check,
  ArrowRight, Sparkles, Upload, BarChart3, LogIn, LogOut, History, Settings
} from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const [scrollY, setScrollY] = useState(0)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null)
    })
  }, [])

  const handleSignOut = async () => {
    await signOut()
    setUserEmail(null)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#06060b] text-[#f0f0f5] overflow-x-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{
            background: 'radial-gradient(circle, #00e5cc 0%, transparent 70%)',
            transform: `translateY(${scrollY * 0.1}px)`,
          }}
        />
        <div
          className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] rounded-full opacity-[0.03]"
          style={{
            background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)',
            transform: `translateY(${scrollY * -0.05}px)`,
          }}
        />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5">
        <a href="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-[#00e5cc] rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-[#06060b]" />
          </div>
          <span className="text-lg font-bold tracking-tight" style={{ fontFamily: '"DM Sans", system-ui' }}>
            TaylrdUp
          </span>
        </a>
        <div className="flex items-center gap-3 md:gap-6">
          <a href="/about" className="text-sm text-[#8888a0] hover:text-[#f0f0f5] transition-colors hidden sm:block">About</a>
          <a href="/resources" className="text-sm text-[#8888a0] hover:text-[#f0f0f5] transition-colors hidden sm:block">Resources</a>
          <a href="/faq" className="text-sm text-[#8888a0] hover:text-[#f0f0f5] transition-colors hidden sm:block">FAQ</a>
          <button
            onClick={() => router.push('/pricing')}
            className="text-sm text-[#8888a0] hover:text-[#f0f0f5] transition-colors"
          >
            Pricing
          </button>
          {userEmail ? (
            <>
              <span className="text-sm text-[#8888a0] hidden md:block">{userEmail}</span>
              <button
                onClick={() => router.push('/onboarding')}
                className="px-4 py-2 text-sm font-semibold bg-[#00e5cc] text-[#06060b] rounded-lg hover:bg-[#33ffeb] transition-all inline-flex items-center gap-2"
              >
                <Settings size={14} />
                My Profile
              </button>
              <button
                onClick={() => router.push('/history')}
                className="px-4 py-2 text-sm font-semibold border border-[#00e5cc]/40 text-[#00e5cc] rounded-lg hover:border-[#00e5cc] hover:text-[#33ffeb] transition-all inline-flex items-center gap-2"
              >
                <History size={14} />
                History
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-semibold border border-[#2d2d3a] text-[#f0f0f5] rounded-lg hover:border-[#00e5cc] hover:text-[#00e5cc] transition-all inline-flex items-center gap-2"
              >
                <LogOut size={14} />
                Log out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 text-sm font-semibold border border-[#2d2d3a] text-[#f0f0f5] rounded-lg hover:border-[#00e5cc] hover:text-[#00e5cc] transition-all hidden sm:inline-flex items-center gap-2"
              >
                <LogIn size={14} />
                Sign in
              </button>
              <button
                onClick={() => router.push('/login')}
                className="px-5 py-2 text-sm font-semibold bg-[#00e5cc] text-[#06060b] rounded-lg hover:bg-[#33ffeb] transition-all active:scale-[0.97]"
              >
                Get started
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-28 text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#00e5cc]/20 bg-[#00e5cc]/5 mb-8"
          style={{ animation: 'fadeIn 0.6s ease-out' }}
        >
          <Sparkles size={13} className="text-[#00e5cc]" />
          <span className="text-xs font-medium text-[#00e5cc]">Built for students and recent grads</span>
        </div>

        <h1
          className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-6"
          style={{ fontFamily: '"DM Sans", system-ui', animation: 'slideUp 0.5s ease-out' }}
        >
          Stop sending the{' '}
          <span className="relative">
            <span className="text-[#00e5cc]">same resume</span>
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 8C50 2 150 2 298 8" stroke="#00e5cc" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
            </svg>
          </span>
          {' '}to every job
        </h1>

        <p
          className="text-lg md:text-xl text-[#8888a0] max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ animation: 'slideUp 0.5s ease-out 0.1s both' }}
        >
          Paste a job description. Get a resume tailored to match, with bullets rewritten
          to hit every keyword, formatted in a clean PDF, ready in 30 seconds.
        </p>

        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          style={{ animation: 'slideUp 0.5s ease-out 0.2s both' }}
        >
          {userEmail ? (
            <button
              onClick={() => router.push('/dashboard')}
              className="group flex items-center gap-2 px-8 py-4 bg-[#00e5cc] text-[#06060b] font-bold rounded-xl text-lg hover:bg-[#33ffeb] transition-all active:scale-[0.97] shadow-[0_0_30px_rgba(0,229,204,0.2)]"
            >
              Go to dashboard
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <>
              <button
                onClick={() => router.push('/login')}
                className="group flex items-center gap-2 px-8 py-4 bg-[#00e5cc] text-[#06060b] font-bold rounded-xl text-lg hover:bg-[#33ffeb] transition-all active:scale-[0.97] shadow-[0_0_30px_rgba(0,229,204,0.2)]"
              >
                Create free account
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => router.push('/pricing')}
                className="text-sm text-[#8888a0] hover:text-[#f0f0f5] transition-colors underline underline-offset-4"
              >
                View pricing first
              </button>
            </>
          )}
        </div>
        {!userEmail && (
          <p className="text-sm text-[#55556a] mt-4">5 free resumes included. Upgrade any time.</p>
        )}

        <div
          className="mt-16 flex items-center justify-center gap-8 text-[#55556a] text-sm"
          style={{ animation: 'fadeIn 0.6s ease-out 0.4s both' }}
        >
          <span className="flex items-center gap-1.5"><FileText size={14} /> Resumes generated</span>
          <span className="w-px h-4 bg-[#22222e]" />
          <span className="flex items-center gap-1.5"><Target size={14} /> ATS-optimized</span>
          <span className="w-px h-4 bg-[#22222e]" />
          <span className="flex items-center gap-1.5"><Clock size={14} /> 30 second delivery</span>
        </div>
      </section>

      {/* Before / After */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-28">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-[#2d2d3a] bg-[#0e0e14] p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500/40" />
            <p className="text-xs font-semibold text-red-400/70 uppercase tracking-wider mb-4">Your generic resume</p>
            <div className="space-y-3 text-sm text-[#55556a]">
              <div className="flex items-start gap-2"><span className="text-red-400/50 mt-0.5">•</span><span>Responsible for building data pipelines and working on database optimization tasks</span></div>
              <div className="flex items-start gap-2"><span className="text-red-400/50 mt-0.5">•</span><span>Helped with the frontend development and various backend improvements</span></div>
              <div className="flex items-start gap-2"><span className="text-red-400/50 mt-0.5">•</span><span>Worked on machine learning models and assisted with deployment</span></div>
            </div>
            <p className="mt-6 text-xs text-[#55556a] italic">Same bullets sent to every application</p>
          </div>

          <div className="rounded-2xl border border-[#00e5cc]/20 bg-[#0e0e14] p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#00e5cc]/60" />
            <p className="text-xs font-semibold text-[#00e5cc]/70 uppercase tracking-wider mb-4">TaylrdUp tailored resume</p>
            <div className="space-y-3 text-sm text-[#c0c0d0]">
              <div className="flex items-start gap-2"><span className="text-[#00e5cc] mt-0.5">•</span><span>Built data pipelines in Python and SQL that migrated production data with zero downtime</span></div>
              <div className="flex items-start gap-2"><span className="text-[#00e5cc] mt-0.5">•</span><span>Developed REST APIs in FastAPI processing real-time transcription requests with ML models</span></div>
              <div className="flex items-start gap-2"><span className="text-[#00e5cc] mt-0.5">•</span><span>Trained TensorFlow CNNs achieving 95% detection accuracy on edge hardware systems</span></div>
            </div>
            <p className="mt-6 text-xs text-[#00e5cc]/50 italic">Every bullet matched to the job description</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-28">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ fontFamily: '"DM Sans", system-ui' }}>
          Three steps. One tailored resume.
        </h2>
        <p className="text-center text-[#8888a0] mb-16 max-w-xl mx-auto">
          Build your profile once, then generate a custom-tailored resume for every job you apply to.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: <Upload size={22} />, step: '01', title: 'Add your background', desc: 'Upload project reports, answer 3 questions per internship, list your skills. AI extracts and structures everything automatically.' },
            { icon: <FileText size={22} />, step: '02', title: 'Paste a job description', desc: 'Drop in any JD. We analyze it for keywords, themes, and requirements, then tailor every bullet to match.' },
            { icon: <Target size={22} />, step: '03', title: 'Download your PDF', desc: 'Get a clean, ATS-optimized resume with a fit assessment showing exactly how strong your match is.' },
          ].map((item, i) => (
            <div key={i} className="relative group">
              <div className="text-[60px] font-black text-[#13131a] absolute -top-6 -left-2 select-none group-hover:text-[#1a1a24] transition-colors">{item.step}</div>
              <div className="relative pt-10">
                <div className="w-11 h-11 rounded-xl bg-[#13131a] border border-[#22222e] flex items-center justify-center text-[#00e5cc] mb-4 group-hover:border-[#00e5cc]/30 group-hover:shadow-[0_0_20px_rgba(0,229,204,0.1)] transition-all">{item.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-[#8888a0] leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why different */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-28">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16" style={{ fontFamily: '"DM Sans", system-ui' }}>
          Built for people with <span className="text-[#00e5cc]">projects, not decades</span>
        </h2>
        <div className="grid md:grid-cols-2 gap-5">
          {[
            { icon: <Sparkles size={18} />, title: 'Projects get the spotlight', desc: 'Most resume tools treat projects as an afterthought. We give them the same weight as work experience. For students, that is the experience.' },
            { icon: <Target size={18} />, title: 'JD keyword matching', desc: 'Every bullet uses the exact phrasing from the job description. Not synonyms, not paraphrases. The actual keywords ATS systems scan for.' },
            { icon: <BarChart3 size={18} />, title: 'Fit assessment included', desc: 'Before you apply, see if you are a Strong Fit, Stretch, or Skip. Gaps are listed so you know exactly what to prepare for.' },
            { icon: <Zap size={18} />, title: 'PDF in 30 seconds', desc: 'Clean LaTeX-compiled PDF that looks sharp on screen and prints perfectly. No weird formatting, no template artifacts.' },
          ].map((item, i) => (
            <div key={i} className="rounded-2xl border border-[#22222e] bg-[#0a0a0f] p-6 hover:border-[#2d2d3a] transition-colors">
              <div className="w-9 h-9 rounded-lg bg-[#00e5cc]/10 flex items-center justify-center text-[#00e5cc] mb-4">{item.icon}</div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-[#8888a0] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 max-w-4xl mx-auto px-6 pb-28">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ fontFamily: '"DM Sans", system-ui' }}>Simple pricing</h2>
        <p className="text-center text-[#8888a0] mb-16">Start with 5 free resumes, then choose the option that matches your search.</p>

        <div className="grid md:grid-cols-3 gap-5">
          {/* Free */}
          <div className="rounded-2xl border border-[#22222e] bg-[#0e0e14] p-7">
            <p className="text-sm font-medium text-[#8888a0] mb-1">Free</p>
            <div className="flex items-baseline gap-1 mb-1"><span className="text-4xl font-bold">$0</span></div>
            <p className="text-sm text-[#55556a] mb-6">Best for trying TaylrdUp</p>
            <ul className="space-y-3 mb-8">
              {['5 tailored resumes', 'Full profile builder', 'AI-powered intake', 'PDF download'].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-[#c0c0d0]"><Check size={15} className="text-[#00e5cc] shrink-0" />{f}</li>
              ))}
            </ul>
            <button
              onClick={() => router.push(userEmail ? '/dashboard' : '/login')}
              className="w-full py-3 rounded-lg border border-[#2d2d3a] text-sm font-semibold text-[#f0f0f5] hover:border-[#00e5cc] hover:text-[#00e5cc] transition-all"
            >
              {userEmail ? 'Go to dashboard' : 'Get started'}
            </button>
          </div>

          {/* Base plan */}
          <div className="rounded-2xl border border-[#00e5cc]/30 bg-[#0e0e14] p-7 relative shadow-[0_0_40px_rgba(0,229,204,0.06)]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#00e5cc] text-[#06060b] text-xs font-bold">BEST VALUE</div>
            <p className="text-sm font-medium text-[#00e5cc] mb-1">Base Plan</p>
            <div className="flex items-baseline gap-1 mb-1"><span className="text-4xl font-bold">$9.99</span><span className="text-sm text-[#8888a0]">/mo</span></div>
            <p className="text-sm text-[#55556a] mb-6">100 resumes every month</p>
            <ul className="space-y-3 mb-8">
              {['100 tailored resumes per month', 'Full profile builder', 'AI-powered intake', 'PDF download', 'Best for active recruiting', 'No surprise overages'].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-[#c0c0d0]"><Check size={15} className="text-[#00e5cc] shrink-0" />{f}</li>
              ))}
            </ul>
            <button onClick={() => router.push('/pricing')} className="w-full py-3 rounded-lg bg-[#00e5cc] text-sm font-bold text-[#06060b] hover:bg-[#33ffeb] transition-all active:scale-[0.97]">Choose Base Plan</button>
          </div>

          {/* Credit pack */}
          <div className="rounded-2xl border border-[#22222e] bg-[#0e0e14] p-7">
            <p className="text-sm font-medium text-[#8888a0] mb-1">Credit Pack</p>
            <div className="flex items-baseline gap-1 mb-1"><span className="text-4xl font-bold">$4.99</span></div>
            <p className="text-sm text-[#55556a] mb-6">50 extra resumes, one time</p>
            <ul className="space-y-3 mb-8">
              {['50 additional resumes', 'One-time purchase', 'No subscription required', 'Works with any existing plan', 'Great for interview bursts'].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-[#c0c0d0]"><Check size={15} className="text-[#00e5cc] shrink-0" />{f}</li>
              ))}
            </ul>
            <button onClick={() => router.push('/pricing')} className="w-full py-3 rounded-lg border border-[#2d2d3a] text-sm font-semibold text-[#f0f0f5] hover:border-[#00e5cc] hover:text-[#00e5cc] transition-all">Buy credit pack</button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 pb-28 text-center">
        <div className="rounded-2xl border border-[#22222e] bg-[#0e0e14] p-12">
          <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: '"DM Sans", system-ui' }}>
            Your next application deserves<br />a tailored resume
          </h2>
          <p className="text-[#8888a0] mb-8 max-w-md mx-auto">
            {userEmail
              ? 'Jump back in and tailor the next version of your resume in seconds.'
              : 'Create your account, build your profile once, and use your 5 free resumes where they matter most.'}
          </p>
          <button
            onClick={() => router.push(userEmail ? '/dashboard' : '/login')}
            className="group inline-flex items-center gap-2 px-8 py-4 bg-[#00e5cc] text-[#06060b] font-bold rounded-xl text-lg hover:bg-[#33ffeb] transition-all active:scale-[0.97]"
          >
            {userEmail ? 'Go to dashboard' : 'Get started free'}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#13131a] px-6 py-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#00e5cc] rounded flex items-center justify-center"><Zap size={12} className="text-[#06060b]" /></div>
            <span className="text-sm font-semibold">TaylrdUp</span>
          </div>
          <p className="text-xs text-[#55556a]">Built for students who deserve better than generic templates.</p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
