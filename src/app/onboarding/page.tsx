'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  useProfile,
  type UserInfo,
  type Education,
} from '@/lib/profile-store'
import {
  parseProject,
  parseInternship,
  categorizeSkills,
  extractTextFromFile,
  importResume,
  type InternshipInput,
  type ProjectInput,
  type ResumeImportResult,
} from '@/lib/api'
import {
  User,
  GraduationCap,
  Wrench,
  Briefcase,
  Code2,
  Users,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  Circle,
  Upload,
  X,
  Edit2,
  Paperclip,
} from 'lucide-react'

// ── Sparkles icon (inline — avoids lucide version issues) ──────
function Sparkles({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
    </svg>
  )
}

// ── Section header with completion indicator ───────────────────
function SectionHeader({
  icon,
  title,
  complete,
}: {
  icon: React.ReactNode
  title: string
  complete: boolean
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="text-accent">{icon}</span>
      <h2 className="text-xl font-semibold font-display text-text-primary">{title}</h2>
      <div className="ml-auto">
        {complete ? (
          <CheckCircle2 size={20} className="text-accent" />
        ) : (
          <Circle size={20} className="text-surface-400" />
        )}
      </div>
    </div>
  )
}

// ── Main form (must be inside ProfileProvider) ─────────────────
function ProfileForm() {
  const {
    profile,
    updateUserInfo,
    addEducation,
    removeEducation,
    updateSkills,
    addInternship,
    removeInternship,
    addProject,
    removeProject,
    addExtracurricular,
    removeExtracurricular,
    updateExtracurricular,
    clearExperienceSections,
    setCustomSectionLabels,
    completionPercentage,
  } = useProfile()

  // ── Resume import ─────────────────────────────────────────────
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState('')
  const [importResult, setImportResult] = useState<ResumeImportResult | null>(null)
  const [importApplied, setImportApplied] = useState(false)
  // Replace mode: clear existing internships/projects/extracurriculars before applying.
  // Default ON when the profile already has entries (re-import case).
  const [importReplace, setImportReplace] = useState(false)

  const handleImportResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportLoading(true)
    setImportError('')
    setImportResult(null)
    try {
      const result = await importResume(file)
      setImportResult(result)
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse resume')
    } finally {
      setImportLoading(false)
      e.target.value = ''
    }
  }

  const applyImport = () => {
    if (!importResult) return

    // In replace mode, wipe existing internships/projects/extracurriculars first
    // so re-importing a fresh resume doesn't create duplicates.
    if (importReplace) {
      clearExperienceSections()
    }

    const u = importResult.user_info
    const newInfo: UserInfo = {
      full_name: u.full_name || info.full_name,
      email: u.email || info.email,
      phone: u.phone || info.phone,
      location: u.location || info.location,
      linkedin: u.linkedin || info.linkedin,
      github: u.github || info.github,
    }
    updateUserInfo(newInfo)
    setInfoState(newInfo)

    // Education
    importResult.education.forEach(edu => {
      addEducation({
        university: edu.university || '',
        college: edu.college || '',
        degree: edu.degree || '',
        graduation_date: edu.graduation_date || '',
        gpa: edu.gpa ?? null,
        relevant_coursework: edu.relevant_coursework || [],
      })
    })

    // Skills — merge into tags (don't overwrite if user already has some)
    const newTags = importResult.raw_skills || []
    if (newTags.length > 0) {
      setSkillTags(prev => {
        const merged = [...prev]
        newTags.forEach(s => { if (!merged.includes(s)) merged.push(s) })
        return merged
      })
    }

    // Internships — import with existing bullets as what_worked_on
    importResult.internships.forEach(intern => {
      addInternship({
        company: intern.company || '',
        title: intern.title || '',
        location: intern.location || '',
        start_date: intern.start_date || '',
        end_date: intern.end_date || '',
        tech_stack: intern.tech_stack || [],
        bullets: (intern.existing_bullets || []).map(b => ({
          text: b,
          what: '',
          how: '',
          result: '',
          has_metric: false,
        })),
      })
    })

    // Projects — import with existing bullets
    importResult.projects.forEach(proj => {
      addProject({
        title: proj.title || '',
        role: proj.role || 'Team Member',
        start_date: proj.start_date || '',
        end_date: proj.end_date || '',
        tech_stack: proj.tech_stack || [],
        bullets: (proj.existing_bullets || []).map(b => ({
          text: b,
          what: '',
          how: '',
          result: '',
          has_metric: false,
        })),
        raw_description: (proj.existing_bullets || []).join('\n'),
      })
    })

    // Extracurriculars
    importResult.extracurriculars.forEach(extra => {
      addExtracurricular({
        organization: extra.organization || '',
        role: extra.role || '',
        start_date: extra.start_date || '',
        end_date: extra.end_date || '',
        description: extra.description || '',
        bullets: [],
      })
    })

    setImportApplied(true)
    setImportResult(null)
  }

  // ── Contact: local state, save on blur ───────────────────────
  const [info, setInfoState] = useState<UserInfo>(profile.user_info)
  const saveInfo = (updated: UserInfo) => updateUserInfo(updated)

  // ── Education: add/remove card pattern (supports multiple) ───
  const emptyEduForm = (): Education => ({
    university: '',
    college: '',
    degree: '',
    graduation_date: '',
    gpa: null,
    relevant_coursework: [],
  })
  const [showEduForm, setShowEduForm] = useState(profile.education.length === 0)
  const [eduForm, setEduForm] = useState<Education>(emptyEduForm())
  const [courseworkInput, setCourseworkInput] = useState('')

  const handleAddEducation = () => {
    addEducation({
      ...eduForm,
      relevant_coursework: courseworkInput
        .split(/[\n,]+/)
        .map(s => s.trim())
        .filter(Boolean),
    })
    setEduForm(emptyEduForm())
    setCourseworkInput('')
    setShowEduForm(false)
  }

  const handleEditEdu = (deg: typeof profile.education[0], i: number) => {
    removeEducation(i)
    setEduForm({ ...deg })
    setCourseworkInput(deg.relevant_coursework.join('\n'))
    setShowEduForm(true)
  }

  // ── Skills ───────────────────────────────────────────────────
  const [skillInput, setSkillInput] = useState('')
  const [skillTags, setSkillTags] = useState<string[]>([
    ...profile.skills.programming_languages,
    ...profile.skills.frameworks_libraries,
    ...profile.skills.tools_platforms,
  ])
  const [skillsLoading, setSkillsLoading] = useState(false)
  const [skillsError, setSkillsError] = useState('')
  const [skillsCategorized, setSkillsCategorized] = useState(
    profile.skills.programming_languages.length > 0 ? profile.skills : null
  )

  // Sync skill tags → profile immediately so the profile is never empty
  // even if the user skips "Auto-categorize".  Categorized skills will
  // overwrite this on demand via handleCategorize.
  useEffect(() => {
    if (skillsCategorized) return // already categorized — don't overwrite
    updateSkills({
      programming_languages: [],
      frameworks_libraries: [],
      tools_platforms: skillTags,
      concepts: [],
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillTags])

  const addSkillTag = (value: string) => {
    const clean = value.trim()
    if (clean && !skillTags.includes(clean)) {
      setSkillTags(prev => [...prev, clean])
      setSkillsCategorized(null)
    }
    setSkillInput('')
  }

  const removeSkillTag = (tag: string) => {
    setSkillTags(prev => prev.filter(t => t !== tag))
    setSkillsCategorized(null)
  }

  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addSkillTag(skillInput)
    }
    if (e.key === 'Backspace' && skillInput === '' && skillTags.length > 0) {
      removeSkillTag(skillTags[skillTags.length - 1])
    }
  }

  const handleCategorize = async () => {
    if (skillTags.length === 0) return
    setSkillsLoading(true)
    setSkillsError('')
    try {
      const result = await categorizeSkills(skillTags)
      const categorized = { ...result, concepts: [] }
      setSkillsCategorized(categorized)
      updateSkills(categorized)
    } catch (e: any) {
      setSkillsError(e.message || 'Failed to categorize')
    } finally {
      setSkillsLoading(false)
    }
  }

  // ── Work Experience & Internships ────────────────────────────
  const emptyInternForm = (): InternshipInput => ({
    company: '',
    title: '',
    location: '',
    start_date: '',
    end_date: '',
    what_worked_on: '',
    tools_used: '',
    result: '',
  })
  const [showInternForm, setShowInternForm] = useState(false)
  const [internForm, setInternForm] = useState<InternshipInput>(emptyInternForm())
  const [internLoading, setInternLoading] = useState(false)
  const [internError, setInternError] = useState('')
  const [internUploading, setInternUploading] = useState(false)
  const [internUploadedFile, setInternUploadedFile] = useState<string | null>(null)
  const [internExtractedText, setInternExtractedText] = useState<string | null>(null)
  const [showInternExtracted, setShowInternExtracted] = useState(false)

  const handleInternFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setInternUploading(true)
    setInternError('')
    try {
      const result = await extractTextFromFile(file)
      setInternUploadedFile(file.name)
      setInternExtractedText(result.text) // store separately — don't dump into textarea
    } catch (e: any) {
      setInternError(e.message || 'Failed to extract file')
    } finally {
      setInternUploading(false)
      e.target.value = ''
    }
  }

  const handleEditInternship = (intern: typeof profile.internships[0], i: number) => {
    removeInternship(i)
    setInternForm({
      company: intern.company,
      title: intern.title,
      location: intern.location,
      start_date: intern.start_date,
      end_date: intern.end_date,
      what_worked_on: intern.bullets.map(b => b.text).join('\n'),
      tools_used: intern.tech_stack.join(', '),
      result: '',
    })
    setInternUploadedFile(null)
    setShowInternForm(true)
    setTimeout(() => document.getElementById('intern-section')?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const handleParseInternship = async () => {
    setInternLoading(true)
    setInternError('')
    try {
      // Combine typed text + extracted file text before sending to AI
      const combinedWhatWorkedOn = internExtractedText
        ? (internForm.what_worked_on
            ? internForm.what_worked_on + '\n\n' + internExtractedText
            : internExtractedText)
        : internForm.what_worked_on
      const parsed = await parseInternship({ ...internForm, what_worked_on: combinedWhatWorkedOn })
      addInternship({
        company: parsed.company,
        title: parsed.title,
        location: parsed.location,
        start_date: parsed.start_date,
        end_date: parsed.end_date,
        tech_stack: parsed.tech_stack,
        bullets: parsed.bullets,
      })
      setInternForm(emptyInternForm())
      setInternUploadedFile(null)
      setInternExtractedText(null)
      setShowInternExtracted(false)
      setShowInternForm(false)
    } catch (e: any) {
      setInternError(e.message || 'Failed to parse internship')
    } finally {
      setInternLoading(false)
    }
  }

  // ── Projects ─────────────────────────────────────────────────
  const emptyProjectForm = (): ProjectInput => ({
    title: '',
    description: '',
    role: 'Solo Developer',
    start_date: '',
    end_date: '',
  })
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [projectForm, setProjectForm] = useState<ProjectInput>(emptyProjectForm())
  const [projectLoading, setProjectLoading] = useState(false)
  const [projectUploading, setProjectUploading] = useState(false)
  const [projectError, setProjectError] = useState('')
  const [projectUploadedFile, setProjectUploadedFile] = useState<string | null>(null)
  const [projectExtractedText, setProjectExtractedText] = useState<string | null>(null)
  const [showProjectExtracted, setShowProjectExtracted] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setProjectUploading(true)
    setProjectError('')
    try {
      const result = await extractTextFromFile(file)
      setProjectUploadedFile(file.name)
      setProjectExtractedText(result.text) // store separately — don't dump into textarea
    } catch (e: any) {
      setProjectError(e.message || 'Failed to extract file')
    } finally {
      setProjectUploading(false)
      e.target.value = ''
    }
  }

  const handleEditProject = (proj: typeof profile.projects[0], i: number) => {
    removeProject(i)
    setProjectForm({
      title: proj.title,
      role: proj.role,
      start_date: proj.start_date,
      end_date: proj.end_date,
      description: proj.raw_description,
    })
    setProjectUploadedFile(null)
    setProjectExtractedText(null)
    setShowProjectExtracted(false)
    setShowProjectForm(true)
    setTimeout(() => document.getElementById('project-section')?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const handleParseProject = async () => {
    setProjectLoading(true)
    setProjectError('')
    try {
      // Combine typed description + extracted file text before sending to AI
      const combinedDescription = projectExtractedText
        ? (projectForm.description
            ? projectForm.description + '\n\n' + projectExtractedText
            : projectExtractedText)
        : projectForm.description
      const parsed = await parseProject({ ...projectForm, description: combinedDescription })
      addProject({
        title: parsed.title,
        role: parsed.role,
        start_date: parsed.start_date,
        end_date: parsed.end_date,
        tech_stack: parsed.tech_stack,
        bullets: parsed.bullets,
        raw_description: combinedDescription,
      })
      setProjectForm(emptyProjectForm())
      setProjectUploadedFile(null)
      setProjectExtractedText(null)
      setShowProjectExtracted(false)
      setShowProjectForm(false)
    } catch (e: any) {
      setProjectError(e.message || 'Failed to parse project')
    } finally {
      setProjectLoading(false)
    }
  }

  // ── Extracurriculars ─────────────────────────────────────────
  const emptyExtraForm = () => ({
    organization: '',
    role: '',
    start_date: '',
    end_date: '',
    description: '',
    custom_label: undefined as string | undefined,
  })
  const [showExtraForm, setShowExtraForm] = useState(false)
  const [extraForm, setExtraForm] = useState(emptyExtraForm())
  const [customSectionInput, setCustomSectionInput] = useState('')

  const handleAddCustomSection = () => {
    if (customSectionInput.trim() && !profile.custom_section_labels.includes(customSectionInput.trim())) {
      const updated = [...profile.custom_section_labels, customSectionInput.trim()]
      setCustomSectionLabels(updated)
      setCustomSectionInput('')
    }
  }

  const handleRemoveCustomSection = (label: string) => {
    const updated = profile.custom_section_labels.filter(l => l !== label)
    setCustomSectionLabels(updated)
    // Clear custom_label from any extracurriculars that were using it
    profile.extracurriculars.forEach((extra, i) => {
      if (extra.custom_label === label) {
        updateExtracurricular(i, { ...extra, custom_label: undefined })
      }
    })
  }

  const handleAddExtra = () => {
    addExtracurricular({ ...extraForm, bullets: [] })
    setExtraForm(emptyExtraForm())
    setShowExtraForm(false)
  }

  const handleEditExtra = (extra: typeof profile.extracurriculars[0], i: number) => {
    removeExtracurricular(i)
    setExtraForm({
      organization: extra.organization,
      role: extra.role,
      start_date: extra.start_date,
      end_date: extra.end_date,
      description: extra.description,
      custom_label: extra.custom_label,
    })
    setShowExtraForm(true)
  }

  // ── Completion logic ─────────────────────────────────────────
  const contactComplete = !!(info.full_name && info.email)
  const eduComplete = profile.education.length > 0
  const skillsComplete = skillTags.length > 0
  const internComplete = profile.internships.length > 0
  const projectComplete = profile.projects.length > 0
  const extraComplete = profile.extracurriculars.length > 0
  const experienceOrProjectCount = profile.internships.length + profile.projects.length
  const minimumProfileReady = eduComplete && (internComplete || projectComplete)
  const canGenerate = contactComplete && eduComplete && (internComplete || projectComplete)
  const pct = completionPercentage()
  const nextSuggestion = !contactComplete
    ? {
        title: 'Finish your contact details',
        body: 'Add your name and email so every generated resume is ready to send the moment you download it.',
      }
    : !eduComplete
    ? {
        title: 'Add your education',
        body: 'Education gives the resume an academic anchor and helps the AI frame you correctly for internships and entry-level roles.',
      }
    : !minimumProfileReady
    ? {
        title: 'Add one project or internship',
        body: 'One strong entry is enough to start tailoring. Begin with the most relevant thing you have — even if it is a class or personal project.',
      }
    : !skillsComplete
    ? {
        title: 'Add a few skills next',
        body: 'Skills help TaylrdUp mirror the job description more precisely and strengthen ATS keyword coverage.',
      }
    : !extraComplete
    ? {
        title: 'Optional next: leadership or activities',
        body: 'If you want to strengthen teamwork, initiative, or service signals, add extracurriculars or leadership experience next.',
      }
    : {
        title: 'You are in strong shape',
        body: 'You can generate now. Add more projects or leadership later anytime you want even stronger future tailoring.',
      }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-28">
      {/* Page header */}
      <div className="max-w-2xl mx-auto px-4 pt-12 mb-8">
        <h1 className="text-3xl font-bold font-display text-text-primary mb-2">
          Build your profile
        </h1>
        <p className="text-text-secondary mb-3">
          Start by uploading your resume below. We'll pre-fill everything we can. Then scroll through
          each section to review, edit, and most importantly, <span className="text-text-primary font-medium">add any projects your resume doesn't mention.</span>
        </p>
        <p className="text-sm text-text-muted">
          Most candidates have done 2–3× more relevant work than their resume shows. Side projects, class projects,
          hackathons. All of it counts. Add it here and TaylrdUp will highlight whichever projects are the best fit for each job.
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 space-y-6">
        <div className="card border-surface-300/80 bg-surface-100/50">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-text-primary">Profile progress</p>
              <p className="text-sm text-text-secondary mt-1">
                {pct}% complete
              </p>
            </div>
            <div className={`text-xs font-semibold px-3 py-1 rounded-full border ${
              minimumProfileReady
                ? 'bg-accent/10 border-accent/30 text-accent'
                : 'bg-surface-200 border-surface-300 text-text-muted'
            }`}>
              {minimumProfileReady ? 'Minimum profile ready' : 'Add education + one project or role'}
            </div>
          </div>

          <div className="w-full h-2 bg-surface-300 rounded-full overflow-hidden mt-4">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            {[
              { label: 'Contact', done: contactComplete },
              { label: 'Education', done: eduComplete },
              { label: 'Experience', done: minimumProfileReady },
              { label: 'Skills', done: skillsComplete },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                  item.done
                    ? 'border-accent/30 bg-accent/10 text-accent'
                    : 'border-surface-300 bg-surface-200 text-text-muted'
                }`}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {minimumProfileReady && (
          <div className="card border-accent/40 bg-accent/5">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-accent shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-text-primary">You can generate now!</p>
                <p className="text-sm text-text-secondary mt-1">
                  Education plus one project or internship is enough to start tailoring.
                  {contactComplete
                    ? ' Even one project is enough — our AI maximizes what you have.'
                    : ' Add your name and email next so the finished resume header is ready to go.'}
                </p>
                {experienceOrProjectCount <= 1 && (
                  <p className="text-xs text-accent/80 mt-2">
                    Even one project is enough — our AI maximizes what you have.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="card border-surface-300/70 bg-surface-100/40">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-2">What to add next</p>
          <p className="text-sm font-semibold text-text-primary">{nextSuggestion.title}</p>
          <p className="text-sm text-text-secondary mt-1">{nextSuggestion.body}</p>
        </div>

        {/* ── 0. Import existing resume ─────────────────────── */}
        {!importApplied ? (
          <div className="card border-accent/40 bg-accent/5">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-accent mt-0.5"><Upload size={18} /></span>
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  Step 1: Upload your current resume
                </h2>
                <p className="text-sm text-text-secondary mt-0.5">
                  We'll extract your contact info, education, work history, and skills automatically.
                  Takes 10 seconds. You can edit or add to anything after.
                </p>
              </div>
            </div>

            {importResult ? (
              // Preview + confirm
              <div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
                  <p className="text-sm font-medium text-amber-400 mb-1">
                    ⚠️ Review before applying
                  </p>
                  <ul className="space-y-1">
                    {importResult.warnings.map((w, i) => (
                      <li key={i} className="text-xs text-amber-300/80">{w}</li>
                    ))}
                  </ul>
                </div>
                <div className="text-sm text-text-secondary mb-4 space-y-1">
                  <p>Found: <span className="text-text-primary font-medium">{importResult.user_info.full_name || '(no name)'}</span></p>
                  <p>{importResult.education.length} degree{importResult.education.length !== 1 ? 's' : ''}, {importResult.internships.length} role{importResult.internships.length !== 1 ? 's' : ''}, {importResult.projects.length} project{importResult.projects.length !== 1 ? 's' : ''}, {importResult.extracurriculars?.length ?? 0} extracurricular{(importResult.extracurriculars?.length ?? 0) !== 1 ? 's' : ''}, {importResult.raw_skills.length} skills</p>
                </div>
                {/* Replace toggle — show when profile already has experience entries */}
                {(profile.internships.length > 0 || profile.projects.length > 0 || profile.extracurriculars.length > 0) && (
                  <label className="flex items-center gap-2 mb-4 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={importReplace}
                      onChange={e => setImportReplace(e.target.checked)}
                      className="w-4 h-4 accent-accent"
                    />
                    <span className="text-sm text-text-secondary">
                      <span className="text-text-primary font-medium">Replace existing entries</span>
                      {' '}— clears current roles, projects, and extracurriculars before importing.
                      Use this when re-importing to restore original resume content.
                    </span>
                  </label>
                )}
                <div className="flex gap-3">
                  <button
                    className="btn-ghost"
                    onClick={() => setImportResult(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-primary flex-1"
                    onClick={applyImport}
                  >
                    {importReplace ? 'Replace & apply' : 'Apply to profile'}
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-3 p-4 border border-dashed border-accent/40 rounded-lg cursor-pointer hover:border-accent hover:bg-accent/5 transition-all">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleImportResume}
                  className="hidden"
                  disabled={importLoading}
                />
                {importLoading ? (
                  <>
                    <Loader2 size={18} className="text-accent animate-spin" />
                    <span className="text-sm text-accent">Parsing your resume...</span>
                  </>
                ) : (
                  <>
                    <Upload size={18} className="text-text-muted" />
                    <span className="text-sm text-text-secondary">
                      Upload PDF, DOCX, or TXT resume
                    </span>
                  </>
                )}
              </label>
            )}

            {importError && (
              <p className="text-red-400 text-sm mt-3">{importError}</p>
            )}
          </div>
        ) : (
          // Imported — show success + project nudge banner
          <div className="space-y-3">
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 size={18} className="text-accent shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-text-primary mb-0.5">
                  Resume imported. Now review and add what's missing.
                </p>
                <p className="text-sm text-text-secondary">
                  Your contact info, education, and work history are pre-filled below. Check that everything looks right.
                </p>
              </div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <p className="text-sm font-semibold text-amber-400 mb-1.5">
                ⚡ Don't skip the Projects section
              </p>
              <p className="text-sm text-amber-300/80">
                Most candidates have built more than their resume shows. Side projects, class projects,
                hackathon builds, personal tools. Your resume probably only mentions a fraction of what you've actually done.
                Scroll down and add the ones that didn't make the cut. TaylrdUp will pick the most relevant ones for each job automatically.
              </p>
            </div>
          </div>
        )}

        {/* ── 1. Contact Info ──────────────────────────────── */}
        <div className="card">
          <SectionHeader
            icon={<User size={18} />}
            title="Contact Information"
            complete={contactComplete}
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              className="input-field col-span-2"
              placeholder="Full name *"
              name="name"
              autoComplete="name"
              value={info.full_name}
              onChange={e => setInfoState({ ...info, full_name: e.target.value })}
              onBlur={() => saveInfo(info)}
            />
            <input
              className="input-field"
              placeholder="Email *"
              type="email"
              name="email"
              autoComplete="email"
              value={info.email}
              onChange={e => setInfoState({ ...info, email: e.target.value })}
              onBlur={() => saveInfo(info)}
            />
            <input
              className="input-field"
              placeholder="Phone"
              name="tel"
              autoComplete="tel"
              value={info.phone}
              onChange={e => setInfoState({ ...info, phone: e.target.value })}
              onBlur={() => saveInfo(info)}
            />
            <input
              className="input-field"
              placeholder="Location (e.g. New York, NY)"
              name="city"
              autoComplete="address-level2"
              value={info.location}
              onChange={e => setInfoState({ ...info, location: e.target.value })}
              onBlur={() => saveInfo(info)}
            />
            <input
              className="input-field"
              placeholder="LinkedIn (e.g. linkedin.com/in/you)"
              name="linkedin"
              autoComplete="url"
              value={info.linkedin}
              onChange={e => setInfoState({ ...info, linkedin: e.target.value })}
              onBlur={() => saveInfo(info)}
            />
            <input
              className="input-field col-span-2"
              placeholder="GitHub (e.g. github.com/you)"
              name="github"
              value={info.github}
              onChange={e => setInfoState({ ...info, github: e.target.value })}
              onBlur={() => saveInfo(info)}
            />
          </div>
        </div>

        {/* ── 2. Education ─────────────────────────────────── */}
        <div className="card">
          <SectionHeader
            icon={<GraduationCap size={18} />}
            title="Education"
            complete={eduComplete}
          />
          <p className="text-text-secondary text-sm mb-6">
            Add each degree separately. Dual degrees, grad school, and certifications all count.
          </p>

          {/* Saved degrees */}
          {profile.education.map((deg, i) => (
            <div key={i} className="bg-surface-200 border border-surface-400 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-text-primary">{deg.university}</p>
                  <p className="text-sm text-text-secondary">{deg.degree} · {deg.graduation_date}</p>
                  {deg.college && <p className="text-xs text-text-muted mt-0.5">{deg.college}</p>}
                  {deg.gpa && <p className="text-xs text-text-muted mt-0.5">GPA: {deg.gpa}</p>}
                  {deg.relevant_coursework.length > 0 && (
                    <p className="text-xs text-text-muted mt-1">
                      {deg.relevant_coursework.slice(0, 4).join(', ')}
                      {deg.relevant_coursework.length > 4 ? ` +${deg.relevant_coursework.length - 4} more` : ''}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditEdu(deg, i)}
                    className="text-text-muted hover:text-accent transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => removeEducation(i)}
                    className="text-text-muted hover:text-red-400 transition-colors"
                    title="Remove"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add degree form */}
          {showEduForm ? (
            <div className="bg-surface-200 border border-surface-400 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  className="input-field col-span-2"
                  placeholder="University *"
                  value={eduForm.university}
                  onChange={e => setEduForm({ ...eduForm, university: e.target.value })}
                />
                <input
                  className="input-field col-span-2"
                  placeholder="College / School (for example: College of Engineering)"
                  value={eduForm.college}
                  onChange={e => setEduForm({ ...eduForm, college: e.target.value })}
                />
                <input
                  className="input-field"
                  placeholder="Degree * (for example: B.S. in Computer Science)"
                  value={eduForm.degree}
                  onChange={e => setEduForm({ ...eduForm, degree: e.target.value })}
                />
                <input
                  className="input-field"
                  placeholder="Graduation (for example: May 2025)"
                  value={eduForm.graduation_date}
                  onChange={e => setEduForm({ ...eduForm, graduation_date: e.target.value })}
                />
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider block mb-1.5">
                    GPA <span className="normal-case">(optional)</span>
                  </label>
                  <input
                    className="input-field"
                    placeholder="for example: 3.65"
                    type="number"
                    step="0.01"
                    value={eduForm.gpa || ''}
                    onChange={e =>
                      setEduForm({ ...eduForm, gpa: e.target.value ? parseFloat(e.target.value) : null })
                    }
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-text-muted uppercase tracking-wider block mb-1.5">
                    Relevant Coursework <span className="normal-case">(optional)</span>
                  </label>
                  <textarea
                    className="textarea-field min-h-[100px]"
                    placeholder={`List your courses however you like, one per line or separated by commas.\n\nFor example:\nData Structures and Algorithms\nOperating Systems\nDatabase Systems\nMachine Learning\n\nTip: look up your university's course catalog online for the exact course names.`}
                    value={courseworkInput}
                    onChange={e => setCourseworkInput(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                {profile.education.length > 0 && (
                  <button className="btn-ghost" onClick={() => setShowEduForm(false)}>Cancel</button>
                )}
                <button
                  className="btn-primary flex-1"
                  onClick={handleAddEducation}
                  disabled={!(eduForm.university && eduForm.degree && eduForm.graduation_date)}
                >
                  Save degree
                </button>
              </div>
            </div>
          ) : (
            <button
              className="btn-secondary w-full flex items-center justify-center gap-2"
              onClick={() => setShowEduForm(true)}
            >
              <Plus size={16} /> Add degree
            </button>
          )}
        </div>

        {/* ── 3. Skills ─────────────────────────────────────── */}
        <div className="card">
          <SectionHeader
            icon={<Wrench size={18} />}
            title="Technical Skills"
            complete={skillsComplete}
          />
          <p className="text-text-secondary text-sm mb-4">
            Type a skill and hit Enter. Add everything: languages, frameworks, tools, platforms.
          </p>

          {/* Tag input */}
          <div
            className="input-field flex flex-wrap gap-2 min-h-[52px] cursor-text mb-2"
            onClick={() => document.getElementById('skill-input')?.focus()}
          >
            {skillTags.map(tag => (
              <span key={tag} className="badge-accent flex items-center gap-1">
                {tag}
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); removeSkillTag(tag) }}
                  className="hover:text-accent-bright"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <input
              id="skill-input"
              className="bg-transparent outline-none text-text-primary placeholder-text-muted flex-1 min-w-[120px]"
              placeholder={skillTags.length === 0 ? 'Python, React, Docker, SQL...' : 'Add more...'}
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={handleSkillKeyDown}
            />
          </div>
          <p className="text-text-muted text-xs mb-4">
            {skillTags.length} skill{skillTags.length !== 1 ? 's' : ''} added
          </p>

          {!skillsCategorized && skillTags.length > 0 && (
            <button
              className="btn-secondary w-full flex items-center justify-center gap-2 mb-4"
              onClick={handleCategorize}
              disabled={skillsLoading}
            >
              {skillsLoading ? (
                <><Loader2 size={16} className="animate-spin" /> Categorizing...</>
              ) : (
                <><Sparkles size={16} /> Auto-categorize with AI</>
              )}
            </button>
          )}

          {skillsError && <p className="text-red-400 text-sm mb-3">{skillsError}</p>}

          {skillsCategorized && (
            <div className="space-y-3 pt-1">
              <p className="text-accent text-sm font-medium flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Skills categorized into resume sections
              </p>
              {skillsCategorized.programming_languages.length > 0 && (
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Languages</p>
                  <p className="text-text-primary text-sm">
                    {skillsCategorized.programming_languages.join(', ')}
                  </p>
                </div>
              )}
              {skillsCategorized.frameworks_libraries.length > 0 && (
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                    Frameworks &amp; Libraries
                  </p>
                  <p className="text-text-primary text-sm">
                    {skillsCategorized.frameworks_libraries.join(', ')}
                  </p>
                </div>
              )}
              {skillsCategorized.tools_platforms.length > 0 && (
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                    Tools &amp; Platforms
                  </p>
                  <p className="text-text-primary text-sm">
                    {skillsCategorized.tools_platforms.join(', ')}
                  </p>
                </div>
              )}
              <button
                className="btn-ghost text-xs mt-1 px-0"
                onClick={() => setSkillsCategorized(null)}
              >
                Re-categorize
              </button>
            </div>
          )}
        </div>

        {/* ── 4. Internships ───────────────────────────────── */}
        <div id="intern-section" className="card">
          <SectionHeader
            icon={<Briefcase size={18} />}
            title="Work Experience &amp; Internships"
            complete={internComplete}
          />
          <p className="text-text-secondary text-sm mb-6">
            Internships, part-time jobs, co-ops, research positions. Anything professional counts.
            Answer 3 questions per role and AI generates polished bullets.
          </p>

          {/* Saved internships */}
          {profile.internships.map((intern, i) => (
            <div
              key={`${intern.company}-${i}`}
              className="bg-surface-200 border border-surface-400 rounded-lg p-4 mb-4"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-text-primary">{intern.company}</p>
                  <p className="text-sm text-text-secondary">
                    {intern.title} · {intern.start_date} – {intern.end_date}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditInternship(intern, i)}
                    className="text-text-muted hover:text-accent transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => removeInternship(i)}
                    className="text-text-muted hover:text-red-400 transition-colors"
                    title="Remove"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 mb-3">
                {intern.bullets.map((b, j) => (
                  <div key={j} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-accent mt-0.5 shrink-0" />
                    <p className="text-sm text-text-secondary">{b.text}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {intern.tech_stack.map(tool => (
                  <span key={tool} className="badge-accent">{tool}</span>
                ))}
              </div>
            </div>
          ))}

          {/* Add internship form */}
          {showInternForm ? (
            <div className="bg-surface-200 border border-surface-400 rounded-lg p-4 mb-2">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <input
                  className="input-field"
                  placeholder="Company name *"
                  value={internForm.company}
                  onChange={e => setInternForm({ ...internForm, company: e.target.value })}
                />
                <input
                  className="input-field"
                  placeholder="Your title *"
                  value={internForm.title}
                  onChange={e => setInternForm({ ...internForm, title: e.target.value })}
                />
                <input
                  className="input-field"
                  placeholder="Location (e.g. New York, NY)"
                  value={internForm.location}
                  onChange={e => setInternForm({ ...internForm, location: e.target.value })}
                />
                <div className="flex gap-2">
                  <input
                    className="input-field flex-1"
                    placeholder="Start (e.g. May 2023)"
                    value={internForm.start_date}
                    onChange={e => setInternForm({ ...internForm, start_date: e.target.value })}
                  />
                  <input
                    className="input-field flex-1"
                    placeholder="End (e.g. Aug 2023)"
                    value={internForm.end_date}
                    onChange={e => setInternForm({ ...internForm, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider block mb-1.5">
                    What did you work on? *
                  </label>
                  {/* File upload — offer letter, project doc, performance review */}
                  {internUploadedFile ? (
                    <div className="mb-2">
                      <div className="flex items-center gap-2 p-3 bg-accent/10 border border-accent/30 rounded-lg">
                        <Paperclip size={14} className="text-accent shrink-0" />
                        <span className="text-sm text-accent flex-1 truncate">{internUploadedFile} uploaded</span>
                        <button
                          type="button"
                          onClick={() => setShowInternExtracted(v => !v)}
                          className="text-xs text-accent underline hover:text-accent-bright"
                        >
                          {showInternExtracted ? 'Hide text' : 'View extracted text'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setInternUploadedFile(null); setInternExtractedText(null); setShowInternExtracted(false) }}
                          className="text-text-muted hover:text-red-400 ml-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      {showInternExtracted && internExtractedText && (
                        <div className="mt-2 p-3 bg-surface-200 border border-surface-300 rounded-lg max-h-40 overflow-y-auto">
                          <p className="text-xs text-text-muted whitespace-pre-wrap">{internExtractedText}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <label className="flex flex-col gap-2 p-3 mb-2 border border-dashed border-surface-400 rounded-lg cursor-pointer hover:border-accent hover:bg-accent/5 transition-all">
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={handleInternFileUpload}
                        className="hidden"
                        disabled={internUploading}
                      />
                      {internUploading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 size={16} className="text-accent animate-spin" />
                          <span className="text-sm text-accent">Processing file...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Upload size={16} className="text-text-muted" />
                          <span className="text-sm text-text-secondary">Upload a doc to auto-fill (offer letter, job description, performance review)</span>
                        </div>
                      )}
                      <p className="text-xs text-text-muted text-center">
                        🔒 Files are never stored. Deleted immediately after text is extracted.
                      </p>
                    </label>
                  )}
                  <textarea
                    className="textarea-field"
                    placeholder="Describe what you built, fixed, improved, or delivered. Mention specific systems, features, or data you touched."
                    value={internForm.what_worked_on}
                    onChange={e => setInternForm({ ...internForm, what_worked_on: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider block mb-1.5">
                    What tools or languages did you use? *
                  </label>
                  <textarea
                    className="textarea-field min-h-[80px]"
                    placeholder="Python, SQL, React, AWS, Docker. List everything relevant."
                    value={internForm.tools_used}
                    onChange={e => setInternForm({ ...internForm, tools_used: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider block mb-1.5">
                    What was the result or impact?
                  </label>
                  <textarea
                    className="textarea-field min-h-[80px]"
                    placeholder="Include numbers if you can: 66% faster queries, zero downtime, 50+ users served..."
                    value={internForm.result}
                    onChange={e => setInternForm({ ...internForm, result: e.target.value })}
                  />
                </div>
              </div>

              {internError && <p className="text-red-400 text-sm mb-3">{internError}</p>}

              <div className="flex gap-3">
                <button
                  className="btn-ghost"
                  onClick={() => { setShowInternForm(false); setInternError('') }}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  onClick={handleParseInternship}
                  disabled={
                    !(internForm.company && internForm.title && internForm.what_worked_on && internForm.tools_used) ||
                    internLoading
                  }
                >
                  {internLoading ? (
                    <><Loader2 size={16} className="animate-spin" /> Generating bullets...</>
                  ) : (
                    <><Sparkles size={16} /> Generate resume bullets</>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <button
              className="btn-secondary w-full flex items-center justify-center gap-2"
              onClick={() => setShowInternForm(true)}
            >
              <Plus size={16} /> Add role
            </button>
          )}
        </div>

        {/* ── 5. Projects ──────────────────────────────────── */}
        <div id="project-section" className="card">
          <SectionHeader
            icon={<Code2 size={18} />}
            title="Projects"
            complete={projectComplete}
          />
          <p className="text-text-secondary text-sm mb-6">
            Class projects, hackathons, personal builds all count. AI extracts your tech stack
            and generates polished bullets.
          </p>

          {/* Saved projects */}
          {profile.projects.map((proj, i) => (
            <div
              key={`${proj.title}-${i}`}
              className="bg-surface-200 border border-surface-400 rounded-lg p-4 mb-4"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-text-primary">{proj.title}</p>
                    {proj.raw_description.length > 200 && (
                      <span title="File was uploaded">
                        <Paperclip size={12} className="text-text-muted" />
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary">
                    {proj.role} · {proj.start_date} – {proj.end_date}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditProject(proj, i)}
                    className="text-text-muted hover:text-accent transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => removeProject(i)}
                    className="text-text-muted hover:text-red-400 transition-colors"
                    title="Remove"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 mb-3">
                {proj.bullets.map((b, j) => (
                  <div key={j} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-accent mt-0.5 shrink-0" />
                    <p className="text-sm text-text-secondary">{b.text}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {proj.tech_stack.map(tool => (
                  <span key={tool} className="badge-accent">{tool}</span>
                ))}
              </div>
            </div>
          ))}

          {/* Add project form */}
          {showProjectForm ? (
            <div className="bg-surface-200 border border-surface-400 rounded-lg p-4 mb-2">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <input
                  className="input-field col-span-2"
                  placeholder="Project title *"
                  value={projectForm.title}
                  onChange={e => setProjectForm({ ...projectForm, title: e.target.value })}
                />
                <div>
                  <input
                    className="input-field"
                    list="role-suggestions"
                    placeholder="Your role (type or pick one)"
                    value={projectForm.role}
                    onChange={e => setProjectForm({ ...projectForm, role: e.target.value })}
                  />
                  <datalist id="role-suggestions">
                    <option value="Solo Developer" />
                    <option value="Team Lead" />
                    <option value="Software Lead" />
                    <option value="Team Member" />
                    <option value="Research Lead" />
                    <option value="Research Assistant" />
                    <option value="Product Manager" />
                    <option value="Data Analyst" />
                    <option value="Design Lead" />
                    <option value="Project Manager" />
                    <option value="Co-Founder" />
                  </datalist>
                </div>
                <div className="flex gap-2">
                  <input
                    className="input-field flex-1"
                    placeholder="Start date"
                    value={projectForm.start_date}
                    onChange={e => setProjectForm({ ...projectForm, start_date: e.target.value })}
                  />
                  <input
                    className="input-field flex-1"
                    placeholder="End / Present"
                    value={projectForm.end_date}
                    onChange={e => setProjectForm({ ...projectForm, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="text-xs text-text-muted uppercase tracking-wider block mb-1.5">
                  Describe your project *
                </label>

                {/* File upload zone */}
                {projectUploadedFile ? (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 p-3 bg-accent/10 border border-accent/30 rounded-lg">
                      <Paperclip size={14} className="text-accent shrink-0" />
                      <span className="text-sm text-accent flex-1 truncate">{projectUploadedFile} uploaded</span>
                      <button
                        type="button"
                        onClick={() => setShowProjectExtracted(v => !v)}
                        className="text-xs text-accent underline hover:text-accent-bright"
                      >
                        {showProjectExtracted ? 'Hide text' : 'View extracted text'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setProjectUploadedFile(null); setProjectExtractedText(null); setShowProjectExtracted(false) }}
                        className="text-text-muted hover:text-red-400 ml-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    {showProjectExtracted && projectExtractedText && (
                      <div className="mt-2 p-3 bg-surface-200 border border-surface-300 rounded-lg max-h-40 overflow-y-auto">
                        <p className="text-xs text-text-muted whitespace-pre-wrap">{projectExtractedText}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <label className="flex flex-col gap-2 p-4 mb-3 border border-dashed border-surface-400 rounded-lg cursor-pointer hover:border-accent hover:bg-accent/5 transition-all">
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={projectUploading}
                    />
                    {projectUploading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 size={16} className="text-accent animate-spin" />
                        <span className="text-sm text-accent">Processing file...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Upload size={16} className="text-text-muted" />
                        <span className="text-sm text-text-secondary">
                          Upload PDF, DOCX, or TXT: project report, README, or presentation
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-text-muted text-center">
                      🔒 Files are never stored. Deleted immediately after text is extracted.
                    </p>
                  </label>
                )}

                <textarea
                  className="textarea-field min-h-[140px]"
                  placeholder="What you built, what tools and frameworks, how it works, what the outcome was. Paste from a README or report. More detail means better bullets."
                  value={projectForm.description}
                  onChange={e => setProjectForm({ ...projectForm, description: e.target.value })}
                />
                {projectForm.description.length > 0 && (
                  <p className="text-text-muted text-xs mt-1">
                    {projectForm.description.length} characters
                  </p>
                )}
              </div>

              {projectError && <p className="text-red-400 text-sm mb-3">{projectError}</p>}

              <div className="flex gap-3">
                <button
                  className="btn-ghost"
                  onClick={() => { setShowProjectForm(false); setProjectError('') }}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  onClick={handleParseProject}
                  disabled={!(projectForm.title && projectForm.description) || projectLoading}
                >
                  {projectLoading ? (
                    <><Loader2 size={16} className="animate-spin" /> Extracting &amp; generating...</>
                  ) : (
                    'Generate resume bullets'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <button
              className="btn-secondary w-full flex items-center justify-center gap-2"
              onClick={() => setShowProjectForm(true)}
            >
              <Plus size={16} /> Add project
            </button>
          )}
        </div>

        {/* ── 6. Extracurriculars ───────────────────────────── */}
        <div className="card">
          <SectionHeader
            icon={<Users size={18} />}
            title="Extracurriculars &amp; Leadership"
            complete={extraComplete}
          />
          <p className="text-text-secondary text-sm mb-6">
            Optional: clubs, student government, volunteer work, fraternities. Shows the soft
            skills recruiters look for.
          </p>

          {/* Custom section labels */}
          <div className="mb-6 pb-6 border-b border-surface-300">
            <label className="block text-sm font-medium text-text-primary mb-3">
              Custom section names (optional)
            </label>
            <p className="text-xs text-text-secondary mb-3">
              Group your activities under custom labels like "Clinical Research Experience", "Publications", or "International Leadership"
            </p>

            {/* Display existing custom sections */}
            {profile.custom_section_labels.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.custom_section_labels.map(label => (
                  <div
                    key={label}
                    className="inline-flex items-center gap-2 bg-accent/10 text-accent px-3 py-1.5 rounded-full text-sm border border-accent/30"
                  >
                    <span>{label}</span>
                    <button
                      onClick={() => handleRemoveCustomSection(label)}
                      className="hover:opacity-70 transition-opacity"
                      title="Remove section"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input to add new custom section */}
            <div className="flex gap-2">
              <input
                className="input-field flex-1"
                placeholder="e.g. Clinical Research Experience"
                value={customSectionInput}
                onChange={e => setCustomSectionInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddCustomSection()
                  }
                }}
              />
              <button
                className="btn-secondary"
                onClick={handleAddCustomSection}
                disabled={!customSectionInput.trim()}
              >
                Add
              </button>
            </div>
          </div>

          {/* Saved extracurriculars */}
          {profile.extracurriculars.map((extra, i) => (
            <div
              key={`${extra.organization}-${i}`}
              className="bg-surface-200 border border-surface-400 rounded-lg p-4 mb-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 mr-4">
                  <p className="font-semibold text-text-primary">{extra.organization}</p>
                  <p className="text-sm text-text-secondary">
                    {extra.role} · {extra.start_date} – {extra.end_date}
                  </p>
                  <p className="text-sm text-text-muted mt-1 line-clamp-2">{extra.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleEditExtra(extra, i)}
                    className="text-text-muted hover:text-accent transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => removeExtracurricular(i)}
                    className="text-text-muted hover:text-red-400 transition-colors"
                    title="Remove"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add extracurricular form */}
          {showExtraForm ? (
            <div className="bg-surface-200 border border-surface-400 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <input
                  className="input-field"
                  placeholder="Organization *"
                  value={extraForm.organization}
                  onChange={e => setExtraForm({ ...extraForm, organization: e.target.value })}
                />
                <input
                  className="input-field"
                  placeholder="Your role * (e.g. President, Member)"
                  value={extraForm.role}
                  onChange={e => setExtraForm({ ...extraForm, role: e.target.value })}
                />
                <input
                  className="input-field"
                  placeholder="Start date"
                  value={extraForm.start_date}
                  onChange={e => setExtraForm({ ...extraForm, start_date: e.target.value })}
                />
                <input
                  className="input-field"
                  placeholder="End date (or Present)"
                  value={extraForm.end_date}
                  onChange={e => setExtraForm({ ...extraForm, end_date: e.target.value })}
                />
              </div>
              <textarea
                className="textarea-field mb-4"
                placeholder="What did you do? Events organized, budgets managed, people mentored, initiatives started..."
                value={extraForm.description}
                onChange={e => setExtraForm({ ...extraForm, description: e.target.value })}
              />

              {/* Custom section selector */}
              {profile.custom_section_labels.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Section (optional)
                  </label>
                  <select
                    className="input-field"
                    value={extraForm.custom_label || ''}
                    onChange={e => setExtraForm({ ...extraForm, custom_label: e.target.value || undefined })}
                  >
                    <option value="">Default: Leadership & Activities</option>
                    {profile.custom_section_labels.map(label => (
                      <option key={label} value={label}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3">
                <button className="btn-ghost" onClick={() => setShowExtraForm(false)}>
                  Cancel
                </button>
                <button
                  className="btn-primary flex-1"
                  onClick={handleAddExtra}
                  disabled={!(extraForm.organization && extraForm.role && extraForm.description)}
                >
                  Add to profile
                </button>
              </div>
            </div>
          ) : (
            <button
              className="btn-secondary w-full flex items-center justify-center gap-2"
              onClick={() => setShowExtraForm(true)}
            >
              <Plus size={16} /> Add extracurricular
            </button>
          )}
        </div>

      </div>{/* end sections */}

      {/* ── Sticky bottom bar ─────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface-100/95 backdrop-blur-sm border-t border-surface-300 px-4 py-3 z-50">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-text-muted font-medium">
                Profile {pct}% complete
              </span>
              {!canGenerate && (
                <span className="text-xs text-text-muted hidden sm:block">
                  Need: name, email, education + 1 project or internship
                </span>
              )}
            </div>
            <div className="w-full h-1 bg-surface-300 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          {canGenerate ? (
            <Link
              href="/dashboard"
              className="btn-primary whitespace-nowrap"
            >
              Generate Resume →
            </Link>
          ) : (
            <button className="btn-primary whitespace-nowrap opacity-40 cursor-not-allowed" disabled>
              Generate Resume →
            </button>
          )}
        </div>
      </div>

    </div>
  )
}

// ── Page export ────────────────────────────────────────────────
// ProfileProvider lives in layout.tsx — no need to wrap here
export default function OnboardingPage() {
  return <ProfileForm />
}
