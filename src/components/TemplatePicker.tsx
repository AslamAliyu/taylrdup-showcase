'use client'

/**
 * TemplatePicker
 *
 * A full-screen modal for choosing a resume template style.
 * Opens from the dashboard before generation.
 *
 * Layout:
 *   - Auto-suggested template card at top (highlighted)
 *   - 5 field groups, each with 2 option cards
 *   - Specialty section (Student Athlete, coming-soon cards)
 *   - Preview modal for each template
 */

import { useState } from 'react'
import { X, Check, ChevronRight, Lock, Sparkles, Eye } from 'lucide-react'
import {
  TEMPLATE_GROUPS,
  SPECIALTY_TEMPLATES,
  suggestGroupId,
  type TemplateOption,
  type TemplateId,
} from '@/lib/template-catalog'

interface TemplatePickerProps {
  /** Currently selected template id */
  currentTemplateId: TemplateId
  /** Currently selected variant (A or B) */
  currentVariant: 'A' | 'B'
  /** User's degree string — used for auto-suggest */
  degree: string
  /** Total experience entry count — used for auto-suggest */
  entryCount: number
  /** Called when user confirms a choice */
  onSelect: (templateId: TemplateId, variant: 'A' | 'B', name: string) => void
  /** Called to close without changing */
  onClose: () => void
}

export default function TemplatePicker({
  currentTemplateId,
  currentVariant,
  degree,
  entryCount,
  onSelect,
  onClose,
}: TemplatePickerProps) {
  const suggestedGroupId = suggestGroupId(degree, entryCount)

  // Track pending selection (not applied until user confirms)
  const [pendingId, setPendingId] = useState<TemplateId>(currentTemplateId)
  const [pendingVariant, setPendingVariant] = useState<'A' | 'B'>(currentVariant)
  const [pendingName, setPendingName] = useState<string>('')

  // Track preview modal state
  const [previewTemplateId, setPreviewTemplateId] = useState<TemplateId | null>(null)

  const isSelected = (opt: TemplateOption) =>
    opt.id === pendingId && opt.variant === pendingVariant

  const handlePick = (opt: TemplateOption) => {
    setPendingId(opt.id)
    setPendingVariant(opt.variant)
    setPendingName(opt.name)
  }

  const handleConfirm = () => {
    onSelect(pendingId, pendingVariant, pendingName)
  }

  const handleShowPreview = (e: React.MouseEvent, templateId: TemplateId) => {
    e.stopPropagation()
    setPreviewTemplateId(templateId)
  }

  const handleClosePreview = () => {
    setPreviewTemplateId(null)
  }

  // Template preview modal
  const PreviewModal = ({ templateId }: { templateId: TemplateId }) => {
    const [imageError, setImageError] = useState(false)

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={handleClosePreview}>
        {/* Modal content */}
        <div className="relative w-full max-w-2xl bg-surface-100 rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {/* Close button */}
          <button
            onClick={handleClosePreview}
            className="absolute top-4 right-4 z-10 bg-surface-100 rounded-lg p-2 hover:bg-surface-200 transition-colors"
            aria-label="Close preview"
          >
            <X size={18} />
          </button>

          {/* Content */}
          <div className="flex items-center justify-center bg-surface-200 p-6 max-h-[80vh] overflow-y-auto">
            {imageError ? (
              <div className="text-center text-text-muted py-12">
                <p className="text-sm">Preview image not available</p>
              </div>
            ) : (
              <img
                src={`/previews/${templateId}.png`}
                alt={`Preview of ${templateId} template`}
                className="max-w-full h-auto"
                onError={() => setImageError(true)}
              />
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4 sm:p-8">
      {/* Panel */}
      <div className="relative w-full max-w-3xl bg-surface-100 rounded-2xl shadow-2xl mb-8">

        {/* Header */}
        <div className="sticky top-0 z-10 bg-surface-100 rounded-t-2xl border-b border-surface-300 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Choose your resume template</h2>
            <p className="text-sm text-text-muted mt-0.5">
              Pick the format that fits your field. You can always change it later.
            </p>
          </div>
          <button
            className="btn-ghost p-2 rounded-lg"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-6 space-y-8">

          {/* Auto-suggest banner */}
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex items-start gap-3">
            <Sparkles size={18} className="text-accent mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-accent">Recommended for you</p>
              <p className="text-xs text-text-secondary mt-0.5">
                Based on your profile{degree ? ` (${degree})` : ''} and{' '}
                {entryCount} experience {entryCount === 1 ? 'entry' : 'entries'}, we suggest the{' '}
                <strong className="text-text-primary">
                  {TEMPLATE_GROUPS.find(g => g.id === suggestedGroupId)?.options[0].name ?? 'Harvard Classic'}
                </strong>{' '}
                template below.
              </p>
            </div>
          </div>

          {/* Template groups */}
          {TEMPLATE_GROUPS.map(group => {
            const isSuggested = group.id === suggestedGroupId
            return (
              <div key={group.id}>
                {/* Group header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{group.emoji}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                      {group.field}
                      {isSuggested && (
                        <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                          Suggested for you
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-text-muted">{group.description}</p>
                  </div>
                </div>

                {/* Two option cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {group.options.map(opt => {
                    const selected = isSelected(opt)
                    return (
                      <button
                        key={`${opt.id}-${opt.variant}`}
                        onClick={() => handlePick(opt)}
                        className={`text-left rounded-xl border p-4 transition-all ${
                          selected
                            ? 'border-accent bg-accent/10 ring-1 ring-accent'
                            : 'border-surface-300 bg-surface-200 hover:border-surface-400 hover:bg-surface-300'
                        }`}
                      >
                        {/* Card top row */}
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-text-primary">
                              {opt.name}
                            </span>
                            {opt.badge && (
                              <span className="text-xs font-medium text-fit-strong bg-fit-strong/10 px-1.5 py-0.5 rounded-full">
                                {opt.badge}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={(e) => handleShowPreview(e, opt.id)}
                              className="p-1.5 hover:bg-surface-300 rounded transition-colors"
                              aria-label="Preview template"
                            >
                              <Eye size={14} className="text-text-muted" />
                            </button>
                            {selected && (
                              <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                <Check size={11} className="text-white" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Source school */}
                        <p className="text-xs text-text-muted mb-2">{opt.source}</p>

                        {/* Tagline */}
                        <p className="text-xs text-text-secondary mb-3">{opt.tagline}</p>

                        {/* Section order preview */}
                        <div className="flex flex-wrap gap-1">
                          {opt.sections.map((sec, i) => (
                            <span key={i} className="flex items-center gap-1">
                              <span className="text-xs bg-surface-100 border border-surface-300 text-text-muted px-1.5 py-0.5 rounded">
                                {sec}
                              </span>
                              {i < opt.sections.length - 1 && (
                                <ChevronRight size={10} className="text-text-muted shrink-0" />
                              )}
                            </span>
                          ))}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Specialty templates */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              Specialty templates
              <span className="text-xs text-text-muted font-normal">For specific situations</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SPECIALTY_TEMPLATES.map(spec => {
                const isActive = !spec.coming_soon && spec.id !== 'federal' && spec.id !== 'graduate'
                const selected = !spec.coming_soon && spec.id === pendingId

                if (spec.coming_soon) {
                  return (
                    <div
                      key={spec.id}
                      className="rounded-xl border border-surface-300 bg-surface-200 p-4 opacity-50 relative"
                    >
                      <div className="absolute top-3 right-3 flex items-center gap-1 text-xs text-text-muted bg-surface-300 px-1.5 py-0.5 rounded-full">
                        <Lock size={10} /> Soon
                      </div>
                      <p className="font-semibold text-sm text-text-primary mb-1">{spec.name}</p>
                      <p className="text-xs text-text-muted mb-2">{spec.source}</p>
                      <p className="text-xs text-text-secondary">{spec.tagline}</p>
                    </div>
                  )
                }

                return (
                  <button
                    key={spec.id}
                    onClick={() => isActive && handlePick({ id: spec.id as TemplateId, name: spec.name, source: spec.source, tagline: spec.tagline, sections: spec.sections, variant: 'A' })}
                    className={`text-left rounded-xl border p-4 transition-all ${
                      selected
                        ? 'border-accent bg-accent/10 ring-1 ring-accent'
                        : 'border-surface-300 bg-surface-200 hover:border-surface-400 hover:bg-surface-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="font-semibold text-sm text-text-primary">{spec.name}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {isActive && ['student_athlete'].includes(spec.id) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleShowPreview(e, spec.id as TemplateId)
                            }}
                            className="p-1.5 hover:bg-surface-300 rounded transition-colors"
                            aria-label="Preview template"
                          >
                            <Eye size={14} className="text-text-muted" />
                          </button>
                        )}
                        {selected && (
                          <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                            <Check size={11} className="text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-text-muted mb-2">{spec.source}</p>
                    <p className="text-xs text-text-secondary">{spec.tagline}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="sticky bottom-0 bg-surface-100 rounded-b-2xl border-t border-surface-300 px-6 py-4 flex items-center justify-between gap-4">
          <p className="text-xs text-text-muted">
            {pendingName
              ? <><strong className="text-text-primary">{pendingName}</strong> selected</>
              : 'No template selected yet'
            }
          </p>
          <div className="flex items-center gap-3">
            <button className="btn-ghost text-sm" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn-primary text-sm px-5 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={handleConfirm}
              disabled={!pendingName}
            >
              Use this template
            </button>
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {previewTemplateId && <PreviewModal templateId={previewTemplateId} />}
    </div>
  )
}
