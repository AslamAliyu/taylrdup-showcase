'use client'

/**
 * BulletEditor — 3-Layer Resume Editing
 *
 * Layer 1 — Free text edit: click any bullet to edit inline.
 *   Cost: $0. No API call. Just re-renders LaTeX on "Rebuild PDF".
 *
 * Layer 2 — AI bullet rewrite: click ✦ on a bullet for an AI-improved version.
 *   Cost: ~$0.002. Small Claude call. User can accept or dismiss the suggestion.
 *
 * Layer 3 — AI section regenerate: click "Regenerate" in the section header.
 *   Cost: ~$0.005. Rewrites all bullets in a section against the current JD.
 *   User can accept or discard the whole section.
 */

import { useState, useRef, useEffect } from 'react'
import { ChevronRight, Pencil, Check, X, RefreshCw, Loader2, Undo2, Sparkles, RotateCcw } from 'lucide-react'
import { rewriteBullet, regenerateSection } from '@/lib/api'

interface Section {
  identifier: string
  title_override?: string
  type?: string
  bullets: string[]
}

interface BulletEditorProps {
  sections: Section[]
  jobDescription: string      // needed for Layer 2 + 3 context
  onSectionsChange: (sections: Section[]) => void
  onRebuild: (sections: Section[]) => Promise<void>
  isRebuilding: boolean
}

export default function BulletEditor({
  sections,
  jobDescription,
  onSectionsChange,
  onRebuild,
  isRebuilding,
}: BulletEditorProps) {
  // Layer 1: which bullet is being text-edited
  const [editing, setEditing] = useState<{ s: number; b: number } | null>(null)
  const [draft, setDraft] = useState('')

  // Layer 2: per-bullet rewrite state
  // { s, b } → loading | suggestion string
  const [rewriteLoading, setRewriteLoading] = useState<Record<string, boolean>>({})
  const [rewriteSuggestion, setRewriteSuggestion] = useState<Record<string, string>>({})

  // Layer 3: per-section regenerate state
  const [regenLoading, setRegenLoading] = useState<Record<number, boolean>>({})
  const [regenSuggestion, setRegenSuggestion] = useState<Record<number, string[]>>({})

  // Original sections (for dirty check + restore)
  const [original] = useState<Section[]>(() =>
    sections.map(sec => ({ ...sec, bullets: [...sec.bullets] }))
  )

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [draft])

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
      const len = textareaRef.current.value.length
      textareaRef.current.setSelectionRange(len, len)
    }
  }, [editing])

  // ── Layer 1 handlers ──────────────────────────────────────────

  const startEdit = (s: number, b: number) => {
    setEditing({ s, b })
    setDraft(sections[s].bullets[b])
  }

  const commitEdit = () => {
    if (!editing) return
    const { s, b } = editing
    const trimmed = draft.trim()
    if (!trimmed) { cancelEdit(); return }
    const updated = sections.map((sec, si) => ({
      ...sec,
      bullets: sec.bullets.map((bullet, bi) => si === s && bi === b ? trimmed : bullet),
    }))
    onSectionsChange(updated)
    setEditing(null)
    setDraft('')
  }

  const cancelEdit = () => { setEditing(null); setDraft('') }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit() }
    if (e.key === 'Escape') cancelEdit()
  }

  const restoreOriginal = () => {
    onSectionsChange(original.map(sec => ({ ...sec, bullets: [...sec.bullets] })))
    setEditing(null)
    setRewriteSuggestion({})
    setRegenSuggestion({})
  }

  // ── Layer 2 handlers ──────────────────────────────────────────

  const handleRewriteBullet = async (s: number, b: number) => {
    const key = `${s}-${b}`
    setRewriteLoading(prev => ({ ...prev, [key]: true }))
    try {
      const result = await rewriteBullet(
        sections[s].bullets[b],
        jobDescription,
        sections[s].identifier,
      )
      setRewriteSuggestion(prev => ({ ...prev, [key]: result.rewritten }))
    } catch {
      // silently fail — user still has manual edit
    } finally {
      setRewriteLoading(prev => ({ ...prev, [key]: false }))
    }
  }

  const acceptRewrite = (s: number, b: number) => {
    const key = `${s}-${b}`
    const suggestion = rewriteSuggestion[key]
    if (!suggestion) return
    const updated = sections.map((sec, si) => ({
      ...sec,
      bullets: sec.bullets.map((bullet, bi) => si === s && bi === b ? suggestion : bullet),
    }))
    onSectionsChange(updated)
    setRewriteSuggestion(prev => { const n = { ...prev }; delete n[key]; return n })
  }

  const dismissRewrite = (s: number, b: number) => {
    const key = `${s}-${b}`
    setRewriteSuggestion(prev => { const n = { ...prev }; delete n[key]; return n })
  }

  // ── Layer 3 handlers ──────────────────────────────────────────

  const handleRegenSection = async (si: number) => {
    setRegenLoading(prev => ({ ...prev, [si]: true }))
    try {
      const sec = sections[si]
      const result = await regenerateSection(
        sec.identifier,
        sec.type || 'internship',
        jobDescription,
        sec.bullets,
        '',
        sec.bullets.length,
      )
      setRegenSuggestion(prev => ({ ...prev, [si]: result.bullets }))
    } catch {
      // silently fail
    } finally {
      setRegenLoading(prev => ({ ...prev, [si]: false }))
    }
  }

  const acceptRegen = (si: number) => {
    const suggestion = regenSuggestion[si]
    if (!suggestion) return
    const updated = sections.map((sec, i) =>
      i === si ? { ...sec, bullets: suggestion } : sec
    )
    onSectionsChange(updated)
    setRegenSuggestion(prev => { const n = { ...prev }; delete n[si]; return n })
  }

  const dismissRegen = (si: number) => {
    setRegenSuggestion(prev => { const n = { ...prev }; delete n[si]; return n })
  }

  // ── Dirty check ───────────────────────────────────────────────

  const isBulletDirty = (s: number, b: number) =>
    sections[s]?.bullets[b] !== original[s]?.bullets[b]

  const isDirty = sections.some((sec, si) =>
    sec.bullets.some((bullet, bi) => bullet !== original[si]?.bullets[bi])
  )

  return (
    <div className="space-y-4">
      {sections.map((section, si) => {
        const hasSuggestion = !!regenSuggestion[si]

        return (
          <div key={si} className="card">
            {/* Section header */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-text-muted uppercase tracking-wider">
                {section.identifier}
                {section.title_override && ` · ${section.title_override}`}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-text-muted italic hidden sm:block">Click to edit</p>
                {/* Layer 3: Regenerate section button */}
                {!hasSuggestion && (
                  <button
                    onClick={() => handleRegenSection(si)}
                    disabled={regenLoading[si]}
                    className="flex items-center gap-1 text-xs text-text-muted hover:text-accent px-2 py-1 rounded-lg hover:bg-surface-200 transition-colors disabled:opacity-50"
                    title="Regenerate all bullets with AI"
                  >
                    {regenLoading[si] ? (
                      <><Loader2 size={11} className="animate-spin" /> Regenerating...</>
                    ) : (
                      <><RotateCcw size={11} /> Regenerate</>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Layer 3 suggestion banner */}
            {hasSuggestion && (
              <div className="mb-3 p-3 rounded-xl bg-accent/5 border border-accent/20">
                <p className="text-xs font-medium text-accent mb-2 flex items-center gap-1.5">
                  <Sparkles size={11} /> AI rewrote this section — preview below
                </p>
                <div className="space-y-1.5 mb-3">
                  {regenSuggestion[si].map((bullet, bi) => (
                    <div key={bi} className="flex items-start gap-2">
                      <ChevronRight size={12} className="text-accent mt-1 shrink-0" />
                      <p className="text-sm text-text-secondary">{bullet}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => acceptRegen(si)}
                    className="flex items-center gap-1.5 text-xs font-medium text-white bg-accent hover:bg-accent/90 px-3 py-1.5 rounded-lg"
                  >
                    <Check size={11} /> Use these bullets
                  </button>
                  <button
                    onClick={() => dismissRegen(si)}
                    className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary px-2 py-1.5 rounded-lg hover:bg-surface-200"
                  >
                    <X size={11} /> Keep original
                  </button>
                </div>
              </div>
            )}

            {/* Bullets list */}
            {!hasSuggestion && (
              <div className="space-y-2">
                {section.bullets.map((bullet, bi) => {
                  const isEditing = editing?.s === si && editing?.b === bi
                  const dirty = isBulletDirty(si, bi)
                  const key = `${si}-${bi}`
                  const suggestion = rewriteSuggestion[key]
                  const isRewriting = rewriteLoading[key]

                  return (
                    <div key={bi} className="group">
                      {/* Layer 2 suggestion */}
                      {suggestion && !isEditing && (
                        <div className="mb-1 p-2 rounded-lg bg-accent/5 border border-accent/20">
                          <p className="text-xs text-accent mb-1 flex items-center gap-1">
                            <Sparkles size={10} /> AI suggestion
                          </p>
                          <p className="text-sm text-text-secondary mb-2">{suggestion}</p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => acceptRewrite(si, bi)}
                              className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent/80"
                            >
                              <Check size={10} /> Accept
                            </button>
                            <button
                              onClick={() => dismissRewrite(si, bi)}
                              className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary"
                            >
                              <X size={10} /> Dismiss
                            </button>
                          </div>
                        </div>
                      )}

                      {isEditing ? (
                        /* Layer 1: text edit mode */
                        <div className="flex items-start gap-2">
                          <ChevronRight size={12} className="text-accent mt-2.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <textarea
                              ref={textareaRef}
                              className="w-full bg-surface-200 border border-accent/50 rounded-md px-2 py-1.5 text-sm text-text-primary resize-none focus:outline-none focus:border-accent leading-snug"
                              value={draft}
                              onChange={e => setDraft(e.target.value)}
                              onKeyDown={handleKeyDown}
                              rows={1}
                            />
                            <div className="flex items-center gap-2 mt-1">
                              <button onClick={commitEdit} className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-medium">
                                <Check size={11} /> Save
                              </button>
                              <button onClick={cancelEdit} className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary">
                                <X size={11} /> Cancel
                              </button>
                              <span className="text-xs text-text-muted ml-auto">Enter · Esc</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Display mode — shows Layer 2 rewrite button on hover */
                        <div className="flex items-start gap-2">
                          <ChevronRight
                            size={12}
                            className={`mt-1 shrink-0 ${dirty ? 'text-amber-400' : 'text-accent'}`}
                          />
                          <p
                            className={`text-sm flex-1 min-w-0 cursor-pointer rounded px-1 py-0.5 hover:bg-surface-200 transition-colors ${dirty ? 'text-amber-300' : 'text-text-secondary'}`}
                            onClick={() => startEdit(si, bi)}
                          >
                            {bullet}
                            {dirty && <span className="ml-1.5 text-xs text-amber-400/70">(edited)</span>}
                          </p>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            {/* Layer 2: AI rewrite button */}
                            <button
                              onClick={() => handleRewriteBullet(si, bi)}
                              disabled={isRewriting || !!suggestion}
                              className="flex items-center gap-0.5 text-xs text-text-muted hover:text-accent px-1.5 py-0.5 rounded hover:bg-surface-200 disabled:opacity-40"
                              title="AI rewrite this bullet"
                            >
                              {isRewriting ? (
                                <Loader2 size={10} className="animate-spin" />
                              ) : (
                                <Sparkles size={10} />
                              )}
                            </button>
                            {/* Layer 1: text edit button */}
                            <button
                              onClick={() => startEdit(si, bi)}
                              className="text-text-muted hover:text-text-primary px-1 py-0.5 rounded hover:bg-surface-200"
                              title="Edit manually"
                            >
                              <Pencil size={10} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Dirty state action bar */}
      {isDirty && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 animate-slide-up">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-amber-400">You have unsaved edits</p>
            <p className="text-xs text-amber-300/70 mt-0.5">Rebuild the PDF to apply changes. No AI call — just LaTeX.</p>
          </div>
          <button
            onClick={restoreOriginal}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary px-2 py-1.5 rounded-lg hover:bg-surface-200 transition-colors shrink-0"
          >
            <Undo2 size={12} /> Restore
          </button>
          <button
            onClick={() => onRebuild(sections)}
            disabled={isRebuilding}
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-accent hover:bg-accent/90 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
          >
            {isRebuilding ? (
              <><Loader2 size={12} className="animate-spin" /> Rebuilding...</>
            ) : (
              <><RefreshCw size={12} /> Rebuild PDF</>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
