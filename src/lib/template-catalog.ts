/**
 * TaylrdUp Template Catalog
 *
 * User-facing template definitions derived from analysis of 27 real resume
 * templates from Harvard, Yale, MIT, Brown, UT Austin, and Binghamton career
 * centres.
 *
 * Each "group" covers a broad field and offers exactly TWO named options so
 * users have choice without being overwhelmed. The auto-suggest logic picks
 * the best group based on the user's degree and total experience count.
 */

// ── Types ──────────────────────────────────────────────────────

export type TemplateId =
  | 'standard'
  | 'standard_leadership'
  | 'technical'
  | 'healthcare'
  | 'science'
  | 'science_research'
  | 'first_year'
  | 'student_athlete'

/** A single pickable template option (one of the two per group) */
export interface TemplateOption {
  id: TemplateId
  name: string        // "Harvard Classic"
  source: string      // "Harvard OCS · Yale Career"
  tagline: string     // One-line description
  sections: string[]  // Human-readable section order (shown in picker card)
  badge?: string      // "Most popular", "Best for CS" etc.
  variant: 'A' | 'B'
}

/** A field group — one row in the picker grid */
export interface TemplateGroup {
  id: string
  field: string         // "Business & General"
  emoji: string
  description: string   // Shown under field name
  /** Returns true if this group should be auto-suggested for this profile */
  suggest_if: (degree: string, entryCount: number) => boolean
  options: [TemplateOption, TemplateOption]
}

/** Specialty templates shown in a secondary section (some coming soon) */
export interface SpecialtyTemplate {
  id: TemplateId | 'federal' | 'graduate'
  name: string
  source: string
  tagline: string
  sections: string[]
  coming_soon?: boolean
  suggest_if?: (degree: string) => boolean
}

// ── Main Template Groups ───────────────────────────────────────

export const TEMPLATE_GROUPS: TemplateGroup[] = [
  // ── Business & General ──────────────────────────────────────
  {
    id: 'business',
    field: 'Business & General',
    emoji: '💼',
    description: 'Business, marketing, communications, social sciences, arts, government',
    suggest_if: (degree) => {
      const d = degree.toLowerCase()
      return (
        d.includes('business') || d.includes('marketing') || d.includes('management') ||
        d.includes('finance') || d.includes('accounting') || d.includes('communications') ||
        d.includes('arts') || d.includes('social') || d.includes('history') ||
        d.includes('political') || d.includes('english') || d.includes('psychology') ||
        d.includes('human development') || d.includes('education') || d.includes('economics')
      )
    },
    options: [
      {
        id: 'standard',
        name: 'Harvard Classic',
        source: 'Harvard OCS · Yale Career Development',
        tagline: 'Clean, traditional layout trusted by career centers everywhere.',
        sections: ['Education', 'Skills & Languages', 'Professional Experience', 'Projects', 'Affiliations & Leadership'],
        badge: 'Most popular',
        variant: 'A',
      },
      {
        id: 'standard_leadership',
        name: 'Leadership First',
        source: 'Binghamton Career Development (JS Format)',
        tagline: 'Leads with campus leadership and activities before work experience.',
        sections: ['Education', 'Leadership Experience', 'Work & Volunteer Experience', 'Projects', 'Skills'],
        variant: 'B',
      },
    ],
  },

  // ── Tech & Engineering ───────────────────────────────────────
  {
    id: 'tech',
    field: 'Tech & Engineering',
    emoji: '⚙️',
    description: 'CS, software engineering, data science, cybersecurity, hardware, IT',
    suggest_if: (degree) => {
      const d = degree.toLowerCase()
      return (
        d.includes('computer') || d.includes('software') || d.includes('data science') ||
        d.includes('information technology') || d.includes('cybersecurity') ||
        d.includes('electrical engineering') || d.includes('computer engineering') ||
        d.includes('robotics') || d.includes('machine learning') || d.includes('it ')
      )
    },
    options: [
      {
        id: 'technical',
        name: 'Yale Technical',
        source: 'Yale OCS · UT Austin Cockrell Engineering',
        tagline: 'Technical skills front-and-center, projects and work experience prominent.',
        sections: ['Education', 'Technical Skills', 'Work Experience', 'Projects', 'Projects & Leadership'],
        badge: 'Best for CS & SWE',
        variant: 'A',
      },
      {
        id: 'technical',
        name: 'MIT Stack',
        source: 'MIT Career Advising',
        tagline: 'Same technical structure with expanded projects and contributions section.',
        sections: ['Education', 'Technical Skills', 'Work Experience', 'Projects & Leadership'],
        variant: 'B',
      },
    ],
  },

  // ── Healthcare & Nursing ─────────────────────────────────────
  {
    id: 'healthcare',
    field: 'Healthcare & Nursing',
    emoji: '🩺',
    description: 'Nursing, pre-med, clinical work, patient care, public health, health admin',
    suggest_if: (degree) => {
      const d = degree.toLowerCase()
      return (
        d.includes('nursing') || d.includes('clinical') || d.includes('health') ||
        d.includes('pre-med') || d.includes('premed') || d.includes('medicine') ||
        d.includes('patient') || d.includes('pharmacy') || d.includes('dental') ||
        d.includes('physical therapy') || d.includes('occupational therapy') ||
        d.includes('public health') || d.includes('healthcare')
      )
    },
    options: [
      {
        id: 'healthcare',
        name: 'Binghamton Healthcare',
        source: 'Binghamton Decker School of Nursing',
        tagline: 'Clinical sections first. The standard format for nursing and health students.',
        sections: ['Education', 'Clinical Experience', 'Healthcare Experience', 'Supporting Experience', 'Skills'],
        badge: 'Best for nursing',
        variant: 'A',
      },
      {
        id: 'healthcare',
        name: 'Health Professional',
        source: 'Binghamton Healthcare Sciences',
        tagline: 'Healthcare and research experience with skills at the bottom.',
        sections: ['Education', 'Healthcare Experience', 'Research Experience', 'Supporting Experience', 'Skills'],
        variant: 'B',
      },
    ],
  },

  // ── Science & Research ───────────────────────────────────────
  {
    id: 'science',
    field: 'Science & Research',
    emoji: '🔬',
    description: 'Biology, chemistry, environmental science, lab research, agriculture, geology',
    suggest_if: (degree) => {
      const d = degree.toLowerCase()
      return (
        d.includes('biology') || d.includes('chemistry') || d.includes('biochem') ||
        d.includes('environmental') || d.includes('ecology') || d.includes('geology') ||
        d.includes('agriculture') || d.includes('physics') || d.includes('neuroscience') ||
        d.includes('natural science') || d.includes('science') || d.includes('botany') ||
        d.includes('microbiology') || d.includes('genetics')
      )
    },
    options: [
      {
        id: 'science',
        name: 'Binghamton Science',
        source: 'Binghamton Harpur College of Arts & Sciences',
        tagline: 'Lab skills section with sub-labels. Research experience first.',
        sections: ['Education', 'Skills (Lab Format)', 'Research Experience', 'Class Projects', 'Leadership & Activities'],
        badge: 'Best for lab & field research',
        variant: 'A',
      },
      {
        id: 'science_research',
        name: 'Research Focus',
        source: 'Brown STEM · MIT Biology',
        tagline: 'Research experience leads before skills — best for heavy lab backgrounds.',
        sections: ['Education', 'Research Experience', 'Skills (Lab Format)', 'Class Projects', 'Activities'],
        variant: 'B',
      },
    ],
  },

  // ── First Year & New Student ─────────────────────────────────
  {
    id: 'first_year',
    field: 'First Year & New Student',
    emoji: '🎓',
    description: 'First or second year students, thin profiles, fewer than 4 experiences',
    suggest_if: (_degree, entryCount) => entryCount < 4,
    options: [
      {
        id: 'first_year',
        name: 'MIT First Year',
        source: 'MIT Career Advising & Professional Development',
        tagline: 'Activities and extracurriculars carry equal weight to experience.',
        sections: ['Education', 'Experience', 'Activities & Extracurriculars', 'Skills & Interests'],
        badge: 'Recommended for < 4 entries',
        variant: 'A',
      },
      {
        id: 'first_year',
        name: 'Binghamton Starter',
        source: 'Binghamton First & Sophomore Year Program',
        tagline: 'Volunteer work and awards elevated to stand out with limited experience.',
        sections: ['Education', 'Work Experience', 'Volunteer Experience', 'Awards & Honors', 'Skills'],
        variant: 'B',
      },
    ],
  },
]

// ── Specialty Templates ────────────────────────────────────────
// Shown in a secondary section. Some are coming soon.

export const SPECIALTY_TEMPLATES: SpecialtyTemplate[] = [
  {
    id: 'student_athlete',
    name: 'Student Athlete',
    source: 'Binghamton Athletics · NCAA',
    tagline: 'Dedicated athletic experience section. Leadership comes before work history.',
    sections: ['Education', 'Leadership Experience', 'Work & Volunteer', 'Athletic Experience', 'Skills & Languages'],
    suggest_if: () => false,
  },
  {
    id: 'federal',
    name: 'Federal Government',
    source: 'USAJOBS Format',
    tagline: 'Experience first, hours/week listed, training and certifications sections.',
    sections: ['Professional Work Experience', 'Education', 'Skills', 'Training', 'Volunteer & Community Service', 'Certifications'],
    coming_soon: true,
  },
  {
    id: 'graduate',
    name: 'Graduate / Academic CV',
    source: 'Binghamton Graduate School · Harpur College',
    tagline: 'Publications, presentations, teaching experience. For Master\'s and PhD students.',
    sections: ['Education', 'Teaching Experience', 'Research Experience', 'Publications', 'Presentations', 'University Service'],
    coming_soon: true,
  },
]

// ── Auto-suggest Logic ─────────────────────────────────────────

/**
 * Returns the group ID that best matches the user's profile.
 * Priority:
 *   1. First-year if entry count < 4 (regardless of degree)
 *   2. Degree keyword matching against each group
 *   3. Fallback: 'business' (the most universal)
 */
export function suggestGroupId(degree: string, entryCount: number): string {
  if (entryCount < 4) return 'first_year'
  for (const group of TEMPLATE_GROUPS) {
    if (group.id === 'first_year') continue  // already checked above
    if (group.suggest_if(degree, entryCount)) return group.id
  }
  return 'business'
}

/**
 * Returns the recommended TemplateOption for a given degree + entry count.
 * Always returns variant A (the primary recommendation).
 */
export function suggestTemplate(degree: string, entryCount: number): TemplateOption {
  const groupId = suggestGroupId(degree, entryCount)
  const group = TEMPLATE_GROUPS.find(g => g.id === groupId) ?? TEMPLATE_GROUPS[0]
  return group.options[0]
}

/**
 * Returns the full TemplateGroup for a given group ID.
 */
export function getGroup(groupId: string): TemplateGroup | undefined {
  return TEMPLATE_GROUPS.find(g => g.id === groupId)
}
