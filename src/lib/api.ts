/**
 * TaylrdUp API client — SHOWCASE VERSION.
 *
 * The real app talks to a private FastAPI backend (AI parsing, resume
 * generation, LaTeX/PDF compilation, payments). None of that is included here.
 * Every function below keeps the real signature and response type but returns
 * canned sample data after a short delay, so the UI behaves as it does in
 * production: loading states, errors, and all.
 */

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export interface ProjectInput {
  title: string
  description: string
  role?: string
  start_date?: string
  end_date?: string
}

export interface InternshipInput {
  company: string
  title: string
  location: string
  start_date: string
  end_date: string
  what_worked_on: string
  tools_used: string
  result: string
}

export interface ParsedBullet {
  text: string
  what: string
  how: string
  result: string
  has_metric: boolean
}

export interface ParsedProject {
  title: string
  role: string
  start_date: string
  end_date: string
  tech_stack: string[]
  bullets: ParsedBullet[]
  raw_description: string
}

export interface ParsedInternship {
  company: string
  title: string
  location: string
  start_date: string
  end_date: string
  tech_stack: string[]
  bullets: ParsedBullet[]
}

export interface CategorizedSkills {
  programming_languages: string[]
  frameworks_libraries: string[]
  tools_platforms: string[]
}

export interface ExtractedText {
  filename: string
  text: string
  character_count: number
  word_count: number
}

export interface ResumeImportUserInfo {
  full_name: string
  email: string
  phone: string
  location: string
  linkedin: string
  github: string
}

export interface ResumeImportEducation {
  university: string
  college: string
  degree: string
  graduation_date: string
  gpa: number | null
  relevant_coursework: string[]
}

export interface ResumeImportInternship {
  company: string
  title: string
  location: string
  start_date: string
  end_date: string
  existing_bullets: string[]
  tech_stack: string[]
}

export interface ResumeImportProject {
  title: string
  role: string
  start_date: string
  end_date: string
  existing_bullets: string[]
  tech_stack: string[]
}

export interface ResumeImportExtracurricular {
  organization: string
  role: string
  start_date: string
  end_date: string
  description: string
}

export interface ResumeImportResult {
  user_info: ResumeImportUserInfo
  education: ResumeImportEducation[]
  raw_skills: string[]
  internships: ResumeImportInternship[]
  projects: ResumeImportProject[]
  extracurriculars: ResumeImportExtracurricular[]
  warnings: string[]
}

export interface GenerateRequest {
  profile: any  // MasterProfile — complex nested type
  job_description: string
  company_name: string
  role_title: string
  additional_notes?: string
  /** User-chosen template id — overrides AI-selected template when set */
  template_preference?: string
  /** Supabase user ID for credit deduction. Omit in dev/no-auth mode. */
  user_id?: string
  /** User email for post-generation confirmation email. */
  user_email?: string
}

export interface GenerateResponse {
  fit_level: string
  fit_score: number        // tailored score (after keyword optimisation)
  raw_fit_score: number    // raw score (before tailoring — baseline)
  fit_reason: string
  gaps: string[]
  coaching: string[]
  job_meta: {
    company_name: string
    role_title: string
    confidence: 'high' | 'medium' | 'low'
  }
  validation_warnings: string[]
  rewrite_passes: number
  latex_source: string
  pdf_path: string
  resume_id?: string
  sections: any[]
  skills: any
  credits_remaining: number | null
  credits_total: number | null
}

export interface RebuildRequest {
  profile: any        // MasterProfile
  sections: any[]     // edited sections
  skills: any         // tailored skills block
  template_id: string
  company_name?: string
  role_title?: string
}

export interface RebuildResponse {
  pdf_path: string
  latex_source: string
}

// ── Sample data helpers ────────────────────────────────────────

function sampleBullet(text: string): ParsedBullet {
  return { text, what: '', how: '', result: '', has_metric: /\d/.test(text) }
}

const SAMPLE_BULLETS = [
  'Built a responsive React and TypeScript interface used by 200+ students, cutting task completion time by 30%',
  'Designed REST endpoints and typed client helpers so the UI and API shared a single source of truth for data shapes',
  'Collaborated with 3 teammates through code review and weekly demos to ship features on a two-week cadence',
]

// ── Intake ─────────────────────────────────────────────────────

export async function parseProject(project: ProjectInput): Promise<ParsedProject> {
  await wait(900)
  return {
    title: project.title,
    role: project.role || 'Developer',
    start_date: project.start_date || '',
    end_date: project.end_date || '',
    tech_stack: ['React', 'TypeScript', 'Tailwind CSS'],
    bullets: SAMPLE_BULLETS.map(sampleBullet),
    raw_description: project.description,
  }
}

export async function parseInternship(internship: InternshipInput): Promise<ParsedInternship> {
  await wait(900)
  return {
    company: internship.company,
    title: internship.title,
    location: internship.location,
    start_date: internship.start_date,
    end_date: internship.end_date,
    tech_stack: internship.tools_used.split(',').map(s => s.trim()).filter(Boolean),
    bullets: SAMPLE_BULLETS.map(sampleBullet),
  }
}

export async function categorizeSkills(rawSkills: string[]): Promise<CategorizedSkills> {
  await wait(500)
  const langs = ['python', 'javascript', 'typescript', 'java', 'sql', 'c', 'c++', 'go', 'rust']
  const frameworks = ['react', 'next.js', 'node.js', 'fastapi', 'django', 'tailwind', 'tailwindcss', 'vue', 'express']
  const out: CategorizedSkills = { programming_languages: [], frameworks_libraries: [], tools_platforms: [] }
  for (const s of rawSkills) {
    const k = s.toLowerCase()
    if (langs.includes(k)) out.programming_languages.push(s)
    else if (frameworks.includes(k)) out.frameworks_libraries.push(s)
    else out.tools_platforms.push(s)
  }
  return out
}

export async function extractTextFromFile(file: File): Promise<ExtractedText> {
  await wait(700)
  const text = 'Sample project report text extracted from the uploaded file.'
  return { filename: file.name, text, character_count: text.length, word_count: text.split(' ').length }
}

// ── Resume import (returns a fictional sample profile) ─────────

export async function importResume(_file: File): Promise<ResumeImportResult> {
  await wait(1200)
  return {
    user_info: {
      full_name: 'Jordan Lee',
      email: 'jordan.lee@university.edu',
      phone: '(212) 555-0147',
      location: 'New York, NY',
      linkedin: 'linkedin.com/in/jordanlee',
      github: '',
    },
    education: [{
      university: 'State University of New York',
      college: '',
      degree: 'Bachelor of Science in Computer Science',
      graduation_date: 'May 2025',
      gpa: 3.7,
      relevant_coursework: ['Data Structures', 'Algorithms', 'Database Systems'],
    }],
    raw_skills: ['Python', 'TypeScript', 'React', 'SQL', 'Git', 'Figma'],
    internships: [{
      company: 'Apex Technologies',
      title: 'Software Engineering Intern',
      location: 'New York, NY',
      start_date: 'June 2024',
      end_date: 'August 2024',
      existing_bullets: [
        'Developed RESTful APIs serving 50,000+ daily requests with 99.9% uptime',
        'Optimized PostgreSQL queries reducing average response time by 40%',
      ],
      tech_stack: ['Python', 'PostgreSQL'],
    }],
    projects: [{
      title: 'SmartBudget App',
      role: 'Full-Stack Developer',
      start_date: 'September 2023',
      end_date: 'December 2023',
      existing_bullets: ['Engineered an expense tracking application using React and Node.js'],
      tech_stack: ['React', 'Node.js'],
    }],
    extracurriculars: [{
      organization: 'CS Honor Society',
      role: 'Vice President',
      start_date: 'August 2023',
      end_date: 'Present',
      description: 'Led a chapter of 45 members and organized technical workshops.',
    }],
    warnings: [],
  }
}

// ── Generation ─────────────────────────────────────────────────

let demoCredits = 5

export async function createCheckoutSession(_priceId: string, _userId: string): Promise<{ url: string }> {
  throw new ApiError('Payments are disabled in this demo.', 400)
}

export async function triggerSignupEmail(_email: string): Promise<{ status: string }> {
  return { status: 'skipped (demo)' }
}

export async function triggerProfileCompleteEmail(_email: string): Promise<{ status: string }> {
  return { status: 'skipped (demo)' }
}

export async function getUserCredits(_userId: string): Promise<{
  credits_remaining: number
  credits_total: number
  plan: string
  period_end?: string
}> {
  await wait(200)
  return { credits_remaining: demoCredits, credits_total: 5, plan: 'free' }
}

export async function generateResume(req: GenerateRequest): Promise<GenerateResponse> {
  await wait(2500)
  if (demoCredits <= 0) throw new ApiError('You have used all demo credits. Refresh the page to reset.', 402)
  demoCredits -= 1

  const p = req.profile ?? {}
  const toSection = (identifier: string, type: string, bullets: { text: string }[] | undefined, fallback?: string) => ({
    identifier,
    type,
    bullets: bullets?.length ? bullets.map(b => b.text).slice(0, 3) : fallback ? [fallback] : SAMPLE_BULLETS,
  })
  const sections = [
    ...(p.internships ?? []).map((i: any) => toSection(i.company, 'internship', i.bullets)),
    ...(p.projects ?? []).map((pr: any) => toSection(pr.title, 'project', pr.bullets)),
    ...(p.extracurriculars ?? []).map((e: any) => toSection(e.organization, 'extracurricular', e.bullets, e.description)),
  ]

  const company = req.company_name && req.company_name !== 'Company' ? req.company_name : ''
  const role = req.role_title && req.role_title !== 'Role' ? req.role_title : ''

  return {
    fit_level: 'Strong Fit',
    fit_score: 86,
    raw_fit_score: 71,
    fit_reason: 'Sample assessment: your projects line up well with the front-end requirements in this posting.',
    gaps: ['No production experience with the testing library mentioned in the posting'],
    coaching: [
      'Lead with the project that uses the same framework as the job description.',
      'Quantify the impact of your UI work (users, load time, completion rate).',
    ],
    job_meta: {
      company_name: company || 'Northwind',
      role_title: role || 'Frontend Engineer Intern',
      confidence: company ? 'high' : 'medium',
    },
    validation_warnings: [],
    rewrite_passes: 0,
    latex_source: '',
    pdf_path: `/previews/${req.template_preference || 'standard'}.png`,
    resume_id: undefined,
    sections,
    skills: p.skills ?? {},
    credits_remaining: demoCredits,
    credits_total: 5,
  }
}

// ── Layer 2: Per-bullet AI rewrite ─────────────────────────────

export async function rewriteBullet(
  bullet: string,
  _jobDescription: string,
  _identifier: string = '',
): Promise<{ original: string; rewritten: string }> {
  await wait(800)
  return { original: bullet, rewritten: `${bullet.replace(/\.$/, '')}, aligning the work with the role's core requirements` }
}

// ── Layer 3: Per-section regenerate ────────────────────────────

export async function regenerateSection(
  identifier: string,
  _sectionType: string,
  _jobDescription: string,
  _existingBullets: string[],
  _profileContext: string = '',
  bulletCount: number = 3,
): Promise<{ identifier: string; bullets: string[] }> {
  await wait(1200)
  return { identifier, bullets: SAMPLE_BULLETS.slice(0, bulletCount) }
}

// ── Rebuild ────────────────────────────────────────────────────

export async function rebuildResume(req: RebuildRequest): Promise<RebuildResponse> {
  await wait(800)
  return { pdf_path: `/previews/${req.template_id || 'standard'}.png`, latex_source: '' }
}

export async function healthCheck(): Promise<{ status: string }> {
  return { status: 'demo' }
}
