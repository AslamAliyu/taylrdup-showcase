'use client'

import { useState, useEffect, useRef } from 'react'
import { useProfile } from '@/lib/profile-store'
import { generateResume, type GenerateResponse } from '@/lib/api'
import { signOut, loadResumeHistory, type ResumeHistoryItem } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import {
  FileText, Zap, AlertTriangle, CheckCircle2, Download,
  Loader2, ChevronDown, Settings, RotateCcw, LogOut,
  History, Clock, Pencil, TrendingUp, LayoutTemplate, CreditCard,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import TemplatePicker from '@/components/TemplatePicker'
import BulletEditor from '@/components/BulletEditor'
import { suggestTemplate, type TemplateId } from '@/lib/template-catalog'
import { rebuildResume, getUserCredits, createCheckoutSession } from '@/lib/api'

function DashboardContent() {
  const { profile, isComplete, completionPercentage, setTemplatePreference } = useProfile()
  const router = useRouter()
  const downloadRef = useRef<HTMLButtonElement>(null)
  const previousCreditsRef = useRef<number | null>(null)

  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [resumeHistory, setResumeHistory] = useState<ResumeHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null)
  const [creditsTotal, setCreditsTotal] = useState<number | null>(null)
  const [accountPlan, setAccountPlan] = useState<string | null>(null)
  const [periodEnd, setPeriodEnd] = useState<string | null>(null)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [showCreditFlash, setShowCreditFlash] = useState(false)
  const [showCreditDrop, setShowCreditDrop] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<'base' | 'pack' | null>(null)
  const [showFitDetails, setShowFitDetails] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null)
      if (user?.id) {
        setUserId(user.id)
        getUserCredits(user.id)
          .then(c => {
            setCreditsRemaining(c.credits_remaining)
            setCreditsTotal(c.credits_total)
            setAccountPlan(c.plan ?? null)
            setPeriodEnd(c.period_end ?? null)
          })
          .catch(() => {}) // non-fatal
      }
    })
    loadResumeHistory(3).then(h => {
      setResumeHistory(h)
      setHistoryLoading(false)
    })
  }, [])

  useEffect(() => {
    if (creditsRemaining === null) return

    if (previousCreditsRef.current !== null && creditsRemaining < previousCreditsRef.current) {
      setShowCreditFlash(true)
      setShowCreditDrop(true)

      const flashTimer = window.setTimeout(() => setShowCreditFlash(false), 900)
      const dropTimer = window.setTimeout(() => setShowCreditDrop(false), 1200)

      previousCreditsRef.current = creditsRemaining

      return () => {
        window.clearTimeout(flashTimer)
        window.clearTimeout(dropTimer)
      }
    }

    previousCreditsRef.current = creditsRemaining
  }, [creditsRemaining])

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    const syncOpenState = () => setShowFitDetails(media.matches)

    syncOpenState()

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', syncOpenState)
      return () => media.removeEventListener('change', syncOpenState)
    }

    media.addListener(syncOpenState)
    return () => media.removeListener(syncOpenState)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const handleCheckout = async (plan: 'base' | 'pack') => {
    if (!userId) {
      router.push('/login')
      return
    }

    const priceId = plan === 'base'
      ? process.env.NEXT_PUBLIC_STRIPE_BASE_PRICE_ID
      : process.env.NEXT_PUBLIC_STRIPE_PACK_PRICE_ID

    if (!priceId) {
      setError('Checkout is unavailable right now. Please try again in a moment.')
      return
    }

    setCheckoutLoading(plan)
    setError('')

    try {
      const { url } = await createCheckoutSession(priceId, userId)
      window.location.href = url
    } catch {
      setError('Checkout is unavailable right now. Please try again in a moment.')
      setCheckoutLoading(null)
    }
  }

  // ── Form state ──────────────────────────────────────────────
  const [jd, setJd] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)

  // Whether the JD/role fields have been edited since last generation.
  // Generate button is locked when a result exists and nothing has changed.
  const [jdEdited, setJdEdited] = useState(true)
  // Whether the JD input panel is expanded (collapsed after generation)
  const [jdExpanded, setJdExpanded] = useState(true)

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const [error, setError] = useState('')

  // ── Bullet editor state ──────────────────────────────────────
  // editedSections mirrors result.sections but allows in-place edits.
  // Reset each time a new result comes in.
  const [editedSections, setEditedSections] = useState<any[]>([])
  const [isRebuilding, setIsRebuilding] = useState(false)
  const [rebuildError, setRebuildError] = useState('')
  // Track the current pdf_path (may change after a rebuild)
  const [currentPdfPath, setCurrentPdfPath] = useState('')
  const shouldShowUpgradeBanner = creditsRemaining === 0 || showUpgradePrompt
  const isLowCredit = creditsRemaining !== null && creditsRemaining > 0 && creditsRemaining < 10
  const creditLabel = creditsRemaining === 1 ? 'resume' : 'resumes'
  const resolvedPlan = accountPlan === 'base' || creditsTotal === 100 ? 'base' : 'free'
  const planLabel = resolvedPlan === 'base' ? 'Base Plan' : 'Free Plan'
  const shouldSuggestBuyMore = resolvedPlan === 'base' && creditsRemaining !== null && creditsRemaining < 20
  const periodEndDate = periodEnd ? new Date(periodEnd) : null
  const resetLabel = resolvedPlan === 'base' && periodEndDate && !Number.isNaN(periodEndDate.getTime())
    ? `Resets ${periodEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
    : null

  // ── Active template ──────────────────────────────────────────
  // Use the user's saved preference, or auto-suggest one from their profile
  const primaryDegree = profile.education[0]?.degree ?? ''
  const totalEntries =
    profile.internships.length + profile.projects.length + profile.extracurriculars.length

  const activeTemplate = profile.template_preference
    ? {
        id: profile.template_preference.template_id as TemplateId,
        variant: profile.template_preference.variant,
        name: profile.template_preference.display_name,
      }
    : (() => {
        const s = suggestTemplate(primaryDegree, totalEntries)
        return { id: s.id, variant: s.variant, name: s.name }
      })()

  const handleJdChange = (val: string) => { setJd(val); setJdEdited(true) }
  const handleCompanyChange = (val: string) => { setCompanyName(val); setJdEdited(true) }
  const handleRoleChange = (val: string) => { setRoleTitle(val); setJdEdited(true) }

  const handleGenerate = async () => {
    if (!jd.trim()) return

    if (isLowCredit) {
      const confirmed = window.confirm(
        `Are you sure you want to generate? You only have ${creditsRemaining} ${creditLabel} left.`
      )
      if (!confirmed) return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const apiProfile = {
        user_id: 'local-dev',
        user_info: profile.user_info,
        education: profile.education,
        skills: profile.skills,
        internships: profile.internships.map(i => ({
          ...i,
          raw_input: {
            company: i.company,
            title: i.title,
            location: i.location,
            start_date: i.start_date,
            end_date: i.end_date,
            what_worked_on: '',
            tools_used: i.tech_stack.join(', '),
            result: '',
          }
        })),
        projects: profile.projects,
        extracurriculars: profile.extracurriculars,
      }

      const res = await generateResume({
        profile: apiProfile,
        job_description: jd,
        company_name: companyName || 'Company',
        role_title: roleTitle || 'Role',
        additional_notes: additionalNotes.trim() || undefined,
        template_preference: activeTemplate.id,
        user_id: userId ?? undefined,
        user_email: userEmail ?? undefined,
      })

      // Update credits display from response
      if (res.credits_remaining !== null && res.credits_remaining !== undefined) {
        setCreditsRemaining(res.credits_remaining)
      }
      if (res.credits_total !== null && res.credits_total !== undefined) {
        setCreditsTotal(res.credits_total)
      }

      setResult(res)
      setEditedSections(res.sections.map((s: any) => ({ ...s, bullets: [...s.bullets] })))
      setCurrentPdfPath(res.pdf_path)
      setRebuildError('')
      setJdEdited(false)   // lock generate button
      setJdExpanded(false) // collapse JD panel

      // Scroll to download button after a short delay for animation
      setTimeout(() => {
        downloadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)

      // Refresh history — backend already saved to generations table
      loadResumeHistory(3).then(setResumeHistory)

    } catch (e: any) {
      if (e.status === 402) {
        setShowUpgradePrompt(true)
      } else {
        setError(e.message || 'Generation failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setEditedSections([])
    setCurrentPdfPath('')
    setRebuildError('')
    setJd('')
    setCompanyName('')
    setRoleTitle('')
    setAdditionalNotes('')
    setShowNotes(false)
    setJdEdited(true)
    setJdExpanded(true)
  }

  const handleRebuild = async (sections: any[]) => {
    if (!result) return
    setIsRebuilding(true)
    setRebuildError('')
    try {
      const apiProfile = {
        user_id: 'local-dev',
        user_info: profile.user_info,
        education: profile.education,
        skills: profile.skills,
        internships: profile.internships.map(i => ({
          ...i,
          raw_input: {
            company: i.company,
            title: i.title,
            location: i.location,
            start_date: i.start_date,
            end_date: i.end_date,
            what_worked_on: '',
            tools_used: i.tech_stack.join(', '),
            result: '',
          }
        })),
        projects: profile.projects,
        extracurriculars: profile.extracurriculars,
      }

      const rebuilt = await rebuildResume({
        profile: apiProfile,
        sections,
        skills: result.skills,
        template_id: activeTemplate.id,
        company_name: companyName || result.job_meta?.company_name || 'Company',
        role_title: roleTitle || result.job_meta?.role_title || 'Role',
      })

      setCurrentPdfPath(rebuilt.pdf_path)
      setEditedSections(sections)

      // Scroll to download button
      setTimeout(() => {
        downloadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 200)
    } catch (e: any) {
      setRebuildError(e.message || 'Rebuild failed')
    } finally {
      setIsRebuilding(false)
    }
  }

  if (!isComplete()) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-surface-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText size={28} className="text-text-muted" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Complete your profile first</h2>
          <p className="text-text-secondary mb-6">
            You need to add your education, skills, and at least one project or internship before generating resumes.
          </p>
          <p className="text-sm text-text-muted mb-6">Profile is {completionPercentage()}% complete</p>
          <button className="btn-primary" onClick={() => router.push('/onboarding')}>
            Continue setup
          </button>
        </div>
      </div>
    )
  }

  const scoreDelta = result ? result.fit_score - (result.raw_fit_score ?? 0) : 0
  const keywordData = result as (GenerateResponse & { matched_keywords?: string[]; jd_keywords?: string[] }) | null
  const matchedKeywordCount = Array.isArray(keywordData?.matched_keywords) ? keywordData.matched_keywords.length : null
  const totalKeywordCount = Array.isArray(keywordData?.jd_keywords) ? keywordData.jd_keywords.length : null
  const keywordMatchLabel = matchedKeywordCount !== null && totalKeywordCount !== null
    ? `${matchedKeywordCount} of ${totalKeywordCount} keywords`
    : null
  const topGaps = result?.gaps?.slice(0, 5) ?? []
  const coachingNotes = result?.coaching?.slice(0, 3) ?? []

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div className="border-b border-surface-300 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold font-display text-accent cursor-pointer hover:opacity-80 transition-opacity" onClick={() => router.push('/')}>TaylrdUp</h1>
          <span className="text-text-muted text-sm">Dashboard</span>
        </div>
        <div className="flex items-center gap-3">
          {userEmail && (
            <span className="text-xs text-text-muted hidden sm:block">{userEmail}</span>
          )}
          <button
            className="btn-ghost flex items-center gap-1.5 text-sm"
            onClick={() => router.push('/history')}
          >
            <History size={14} /> History
          </button>
          <button
            className="btn-ghost flex items-center gap-1.5 text-sm"
            onClick={() => router.push('/onboarding')}
          >
            <Settings size={14} /> Edit profile
          </button>
          <button
            className="btn-ghost flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
            onClick={handleSignOut}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Profile summary strip */}
        <div className="card mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-text-primary">{profile.user_info.full_name}</p>
            <p className="text-sm text-text-secondary">
              {profile.internships.length} internship{profile.internships.length !== 1 ? 's' : ''} · {profile.projects.length} project{profile.projects.length !== 1 ? 's' : ''} · {[...profile.skills.programming_languages, ...profile.skills.frameworks_libraries, ...profile.skills.tools_platforms].length} skills
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* Credits pill */}
            {creditsRemaining !== null && (
              <div className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                creditsRemaining === 0
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                  : creditsRemaining <= 3
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-accent/15 text-accent border border-accent/20'
              } ${
                showCreditFlash ? 'scale-105 shadow-[0_0_20px_rgba(0,229,204,0.18)]' : ''
              }`}>
                <CreditCard size={11} />
                {creditsRemaining} {creditLabel} left
                {showCreditDrop && (
                  <span className="absolute -top-5 right-0 text-[11px] font-semibold text-amber-300 animate-pulse">
                    -1
                  </span>
                )}
              </div>
            )}
            <button
              onClick={() => router.push('/onboarding')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-300 text-xs font-medium text-text-secondary hover:border-accent hover:text-accent transition-all"
            >
              <Pencil size={11} />
              Edit Profile
            </button>
          </div>
        </div>

        {creditsRemaining !== null && creditsTotal !== null && (
          <div className="card mb-6 border-surface-300/80 bg-surface-100/50">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Account / Plan</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    resolvedPlan === 'base'
                      ? 'bg-accent/10 border-accent/30 text-accent'
                      : 'bg-surface-200 border-surface-300 text-text-secondary'
                  }`}>
                    {planLabel}
                  </span>
                  {resetLabel && (
                    <span className="text-xs text-text-muted px-2.5 py-1 rounded-full border border-surface-300 bg-surface-200">
                      {resetLabel}
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-primary mt-3">
                  {creditsRemaining} of {creditsTotal} {creditsTotal === 1 ? 'resume remaining' : 'resumes remaining'}
                </p>
                <p className="text-sm text-text-secondary mt-1">
                  {resolvedPlan === 'base'
                    ? 'Your monthly credits refresh automatically every 30 days.'
                    : 'Free accounts include 5 lifetime resumes. Upgrade when you want more volume.'}
                </p>
                {creditsRemaining !== null && creditsRemaining < 3 && creditsRemaining > 0 && (
                  <p className="text-xs text-amber-300 mt-2">
                    Running low — consider upgrading so you don't lose momentum
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {resolvedPlan === 'free' ? (
                  <button
                    className="btn-primary text-sm py-2 px-4 inline-flex items-center gap-2 disabled:opacity-60"
                    onClick={() => handleCheckout('base')}
                    disabled={checkoutLoading !== null}
                  >
                    {checkoutLoading === 'base' ? (
                      <><Loader2 size={14} className="animate-spin" /> Starting checkout...</>
                    ) : (
                      'Upgrade to Base'
                    )}
                  </button>
                ) : shouldSuggestBuyMore ? (
                  <button
                    className="btn-primary text-sm py-2 px-4 inline-flex items-center gap-2 disabled:opacity-60"
                    onClick={() => handleCheckout('pack')}
                    disabled={checkoutLoading !== null}
                  >
                    {checkoutLoading === 'pack' ? (
                      <><Loader2 size={14} className="animate-spin" /> Starting checkout...</>
                    ) : (
                      'Buy 50 more'
                    )}
                  </button>
                ) : (
                  <button
                    className="btn-ghost text-sm"
                    onClick={() => router.push('/pricing')}
                  >
                    View pricing
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* No-credits upgrade prompt */}
        {shouldShowUpgradeBanner && (
          <div className="card mb-6 border-amber-500/40 bg-amber-500/5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3">
                <CreditCard size={18} className="text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-amber-400 mb-1">You're out of credits. Get more to keep tailoring.</p>
                  <p className="text-sm text-text-secondary">
                    Get 100 resumes/month for $9.99, or add 50 resumes for $4.99 to keep generating.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  className="btn-primary text-sm py-2 px-4 shrink-0 inline-flex items-center gap-2 disabled:opacity-60"
                  onClick={() => handleCheckout('base')}
                  disabled={checkoutLoading !== null}
                >
                  {checkoutLoading === 'base' ? (
                    <><Loader2 size={14} className="animate-spin" /> Starting checkout...</>
                  ) : (
                    'Get 100 resumes/month for $9.99'
                  )}
                </button>
                <button
                  className="btn-ghost text-sm py-2 px-4 shrink-0 inline-flex items-center gap-2 disabled:opacity-60"
                  onClick={() => handleCheckout('pack')}
                  disabled={checkoutLoading !== null}
                >
                  {checkoutLoading === 'pack' ? (
                    <><Loader2 size={14} className="animate-spin" /> Starting checkout...</>
                  ) : (
                    'Or add 50 resumes for $4.99'
                  )}
                </button>
                <button
                  className="text-xs text-text-muted hover:text-text-primary underline underline-offset-4"
                  onClick={() => router.push('/pricing')}
                >
                  Compare plans
                </button>
              </div>
            </div>
          </div>
        )}

        {isLowCredit && !shouldShowUpgradeBanner && (
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-300">Low credit warning</p>
                <p className="text-sm text-amber-200/80">
                  You have only {creditsRemaining} {creditLabel} left. We’ll ask for confirmation before the next generation.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Template selector strip */}
        <div className="card mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-accent/15 rounded-lg flex items-center justify-center shrink-0">
              <LayoutTemplate size={15} className="text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">
                {activeTemplate.name}
                {!profile.template_preference && (
                  <span className="ml-2 text-xs font-normal text-text-muted">(auto-selected)</span>
                )}
              </p>
              <p className="text-xs text-text-muted">Resume template</p>
            </div>
          </div>
          <button
            className="btn-ghost flex items-center gap-1.5 text-sm shrink-0"
            onClick={() => setShowTemplatePicker(true)}
          >
            <Pencil size={13} /> Change
          </button>
        </div>

        {/* Template picker modal */}
        {showTemplatePicker && (
          <TemplatePicker
            currentTemplateId={activeTemplate.id}
            currentVariant={activeTemplate.variant}
            degree={primaryDegree}
            entryCount={totalEntries}
            onSelect={(templateId, variant, name) => {
              setTemplatePreference({ template_id: templateId, variant, display_name: name })
              setShowTemplatePicker(false)
            }}
            onClose={() => setShowTemplatePicker(false)}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: JD input */}
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Zap size={18} className="text-accent" />
              Generate a tailored resume
            </h2>

            {/* Collapsed JD summary (shown after generation) */}
            {!jdExpanded && result && (
              <div className="card mb-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {result.job_meta?.role_title || roleTitle || 'Role'}{' '}
                    <span className="text-text-muted font-normal">at</span>{' '}
                    {result.job_meta?.company_name || companyName || 'Company'}
                    {result.job_meta?.confidence === 'low' && (
                      <span className="text-text-muted text-xs ml-1">(Best guess)</span>
                    )}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5 truncate">
                    {jd.split(/\s+/).filter(Boolean).length} words pasted
                  </p>
                </div>
                <button
                  className="btn-ghost flex items-center gap-1.5 text-sm shrink-0"
                  onClick={() => { setJdExpanded(true); setJdEdited(true) }}
                >
                  <Pencil size={13} /> Edit
                </button>
              </div>
            )}

            {/* Full JD input (expanded) */}
            {jdExpanded && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="input-field"
                    placeholder="Company name"
                    value={companyName}
                    onChange={e => handleCompanyChange(e.target.value)}
                  />
                  <input
                    className="input-field"
                    placeholder="Role title"
                    value={roleTitle}
                    onChange={e => handleRoleChange(e.target.value)}
                  />
                </div>

                <textarea
                  className="textarea-field min-h-[300px] font-mono text-sm"
                  placeholder="Paste the full job description here..."
                  value={jd}
                  onChange={e => handleJdChange(e.target.value)}
                />

                <p className="text-xs text-text-muted">
                  Tip: If the job description already includes the job title and company name, you don't need to fill those fields in separately.
                </p>

                <p className="text-text-muted text-xs">
                  {jd.length > 0 ? `${jd.split(/\s+/).filter(Boolean).length} words` : 'Paste the full JD for best results'}
                </p>

                {/* Optional additional notes */}
                <div>
                  <button
                    type="button"
                    className="text-xs text-accent hover:underline flex items-center gap-1"
                    onClick={() => setShowNotes(v => !v)}
                  >
                    {showNotes ? '− Hide' : '+ Add'} additional notes <span className="text-text-muted">(optional)</span>
                  </button>
                  {showNotes && (
                    <div className="mt-2">
                      <textarea
                        className="textarea-field text-sm min-h-[100px]"
                        placeholder={`Anything the AI should know before writing your resume.\n\nExamples:\n• "I led the frontend on the SmartBudget project, not just the API"\n• "I have a strong interest in healthcare technology specifically"\n• "Skip my summer job, it is not relevant to this role"`}
                        value={additionalNotes}
                        onChange={e => setAdditionalNotes(e.target.value)}
                      />
                      <p className="text-text-muted text-xs mt-1">
                        These notes are private and only used for this generation.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 space-y-2">
              {/* Profile completeness warning — thin profile alert */}
              {(() => {
                const totalEntries = profile.internships.length + profile.projects.length + profile.extracurriculars.length
                if (totalEntries < 3 && !result) {
                  return (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <AlertTriangle size={15} className="text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-amber-400">Thin profile detected</p>
                        <p className="text-xs text-amber-300/70 mt-0.5">
                          Your profile has {totalEntries} experience {totalEntries === 1 ? 'entry' : 'entries'}. Adding projects or extracurriculars will significantly improve your resume.{' '}
                          <a href="/onboarding" className="underline hover:text-amber-300">Add more in Profile →</a>
                        </p>
                      </div>
                    </div>
                  )
                }
                return null
              })()}

              <button
                className="btn-primary w-full flex items-center justify-center gap-2 py-4 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={handleGenerate}
                disabled={loading || !jd.trim() || (!jdEdited && result !== null)}
              >
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" /> Tailoring your resume...</>
                ) : (
                  <><Zap size={18} /> Generate tailored resume</>
                )}
              </button>

              {/* Hint when button is locked */}
              {result && !jdEdited && !loading && (
                <p className="text-center text-xs text-text-muted">
                  Edit the job description to generate another resume
                </p>
              )}

              {error && (
                <div className="card border-red-500/30 bg-red-500/5">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Results */}
          <div>
            {loading && (
              <div className="card flex flex-col items-center justify-center py-16">
                <Loader2 size={32} className="text-accent animate-spin mb-4" />
                <p className="text-text-secondary text-sm">Analyzing job description...</p>
                <p className="text-text-muted text-xs mt-1">This takes 15-30 seconds</p>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-4 animate-slide-up">
                {/* Fit assessment */}
                <div className="card border-surface-300/90 bg-surface-100/50">
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setShowFitDetails(prev => !prev)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Why This Resume Fits</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            result.fit_level === 'Strong Fit'
                              ? 'bg-fit-strong/10 text-fit-strong border-fit-strong/20'
                              : result.fit_level === 'Stretch'
                              ? 'bg-fit-stretch/10 text-fit-stretch border-fit-stretch/20'
                              : 'bg-fit-skip/10 text-fit-skip border-fit-skip/20'
                          }`}>
                            {result.fit_level}
                          </span>
                          {result.fit_reason && (
                            <p className="text-sm text-text-secondary">
                              {result.fit_reason}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {result.fit_score > 0 && (
                          <div className="text-right">
                            <p className="text-xs text-text-muted uppercase tracking-wider">Fit score</p>
                            <p className={`text-2xl font-bold tabular-nums ${
                              result.fit_score >= 85 ? 'text-fit-strong' :
                              result.fit_score >= 60 ? 'text-fit-stretch' :
                              'text-fit-skip'
                            }`}>
                              {result.fit_score}
                              <span className="text-sm font-normal text-text-muted">/100</span>
                            </p>
                          </div>
                        )}
                        <ChevronDown
                          size={18}
                          className={`text-text-muted transition-transform ${showFitDetails ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </div>
                  </button>

                  {showFitDetails && (
                    <div className="border-t border-surface-300 pt-4 mt-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {result.fit_score > 0 && (
                          <div className="rounded-xl border border-surface-300 bg-surface-200/60 p-4">
                            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Fit score</p>
                            <p className="text-2xl font-bold text-text-primary tabular-nums">
                              {result.fit_score}
                              <span className="text-sm font-normal text-text-muted">/100</span>
                            </p>
                          </div>
                        )}

                        {keywordMatchLabel ? (
                          <div className="rounded-xl border border-surface-300 bg-surface-200/60 p-4">
                            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Matched keywords</p>
                            <p className="text-2xl font-bold text-text-primary">{keywordMatchLabel}</p>
                          </div>
                        ) : scoreDelta > 0 ? (
                          <div className="rounded-xl border border-surface-300 bg-surface-200/60 p-4">
                            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Tailoring gain</p>
                            <p className="text-2xl font-bold text-fit-strong inline-flex items-center gap-1">
                              <TrendingUp size={18} />
                              +{scoreDelta}
                            </p>
                            <p className="text-xs text-text-muted mt-1">Improvement over your raw profile score</p>
                          </div>
                        ) : null}
                      </div>

                      {topGaps.length > 0 && (
                        <div>
                          <p className="text-xs text-text-muted mb-2 uppercase tracking-wider">Top gaps to watch</p>
                          <div className="flex flex-wrap gap-1.5">
                            {topGaps.map((gap) => (
                              <span key={gap} className="badge-warm">{gap}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {coachingNotes.length > 0 && (
                        <div>
                          <p className="text-xs text-text-muted mb-2 uppercase tracking-wider">Coaching notes</p>
                          <div className="space-y-2">
                            {coachingNotes.map((tip, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <span className="text-accent text-xs mt-0.5 shrink-0">→</span>
                                <p className="text-sm text-text-secondary">{tip}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Skills preview */}
                {result.skills && (
                  <div className="card">
                    <p className="text-xs text-text-muted mb-2 uppercase tracking-wider">Tailored Concepts Line</p>
                    <p className="text-sm text-accent">{result.skills.concepts?.join(' · ')}</p>
                  </div>
                )}

                {/* Editable bullets */}
                {editedSections.length > 0 && (
                  <BulletEditor
                    sections={editedSections}
                    jobDescription={jd}
                    onSectionsChange={setEditedSections}
                    onRebuild={handleRebuild}
                    isRebuilding={isRebuilding}
                  />
                )}

                {rebuildError && (
                  <div className="card border-red-500/30 bg-red-500/5">
                    <p className="text-red-400 text-sm">{rebuildError}</p>
                  </div>
                )}

                {/* Download — ref attached for auto-scroll */}
                <button
                  ref={downloadRef}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-4"
                  onClick={() => {
                    // Demo: the real app compiles a PDF on the server. Here we open a sample preview image.
                    window.open(currentPdfPath || result.pdf_path, '_blank')
                  }}
                >
                  <Download size={18} /> Download PDF
                </button>

                {creditsRemaining !== null && (
                  <div className="card border-surface-300/80 bg-surface-100/40">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          {creditsRemaining > 0
                            ? `${creditsRemaining} ${creditLabel} remaining`
                            : 'You are out of credits'}
                        </p>
                        <p className="text-sm text-text-secondary">
                          Upgrade your plan or add a pack now so your next tailored resume is ready when you are.
                        </p>
                      </div>
                      <button
                        className="btn-primary text-sm py-2 px-4"
                        onClick={() => router.push('/pricing')}
                      >
                        See pricing
                      </button>
                    </div>
                  </div>
                )}

                {result.rewrite_passes > 0 && (
                  <p className="text-center text-xs text-text-muted">
                    {result.rewrite_passes} bullet{result.rewrite_passes !== 1 ? 's' : ''} shortened to fit one line
                  </p>
                )}

                {/* Reset */}
                <button
                  className="btn-ghost w-full flex items-center justify-center gap-2 text-sm"
                  onClick={handleReset}
                >
                  <RotateCcw size={14} /> Generate another
                </button>
              </div>
            )}

            {!result && !loading && (
              <div className="card flex flex-col items-center justify-center py-16 text-center">
                <FileText size={32} className="text-text-muted mb-4" />
                <p className="text-text-secondary text-sm">Paste a job description to get started</p>
                <p className="text-text-muted text-xs mt-1">
                  Your resume will be tailored to match the JD keywords,<br />
                  with bullets rewritten to show you are a direct fit
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Resume history */}
        <div className="mt-10">
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <History size={18} className="text-accent" />
              Recent resumes
            </h2>
            <button
              className="btn-ghost text-sm"
              onClick={() => router.push('/history')}
            >
              View all history
            </button>
          </div>

          {historyLoading ? (
            <div className="flex items-center gap-2 text-text-muted text-sm py-4">
              <Loader2 size={16} className="animate-spin" /> Loading history...
            </div>
          ) : resumeHistory.length === 0 ? (
            <div className="card text-center py-10">
              <Clock size={28} className="text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary text-sm">No resumes generated yet.</p>
              <p className="text-text-muted text-xs mt-1">Your resume history will appear here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {resumeHistory.map((item) => (
                <div key={item.id} className="card flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-text-primary text-sm truncate">
                      {item.role || 'Resume'}{' '}
                      {item.company && (
                        <>
                          <span className="text-text-muted font-normal">at</span>{' '}
                          {item.company}
                        </>
                      )}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {new Date(item.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {item.fit_level && (
                      <span className={`text-sm font-semibold ${
                        item.fit_level.toLowerCase().includes('strong') ? 'text-fit-strong' :
                        item.fit_level.toLowerCase().includes('stretch') ? 'text-fit-stretch' :
                        'text-fit-skip'
                      }`}>
                        {item.fit_level}
                      </span>
                    )}
                    {item.resume_name && (
                      <button
                        className="btn-ghost text-xs flex items-center gap-1 py-1 px-2"
                        onClick={() => {
                          // Demo: open a sample preview instead of downloading from the server
                          window.open(`/previews/${item.resume_name || 'standard'}.png`, '_blank')
                        }}
                      >
                        <Download size={12} /> Download
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return <DashboardContent />
}
