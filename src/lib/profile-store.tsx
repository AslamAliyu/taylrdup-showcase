'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { saveProfile, loadProfile } from './auth'

// ── Types ──────────────────────────────────────────────────────

export interface Education {
  university: string
  college: string
  degree: string
  graduation_date: string
  gpa: number | null
  relevant_coursework: string[]
}

export interface Skills {
  programming_languages: string[]
  frameworks_libraries: string[]
  tools_platforms: string[]
  concepts: string[]
}

export interface Bullet {
  text: string
  what: string
  how: string
  result: string
  has_metric: boolean
}

export interface Internship {
  company: string
  title: string
  location: string
  start_date: string
  end_date: string
  tech_stack: string[]
  bullets: Bullet[]
}

export interface Project {
  title: string
  role: string
  start_date: string
  end_date: string
  tech_stack: string[]
  bullets: Bullet[]
  raw_description: string
}

export interface Extracurricular {
  organization: string
  role: string
  start_date: string
  end_date: string
  description: string
  bullets: Bullet[]
  custom_label?: string
}

export interface UserInfo {
  full_name: string
  phone: string
  email: string
  location: string
  linkedin: string
  github: string
}

export interface TemplatePreference {
  template_id: string   // backend template_id: standard | technical | healthcare | science | first_year | student_athlete
  variant: 'A' | 'B'   // which of the two options within the group
  display_name: string  // "Harvard Classic" — shown in the UI
}

export interface MasterProfile {
  user_info: UserInfo
  education: Education[]
  skills: Skills
  internships: Internship[]
  projects: Project[]
  extracurriculars: Extracurricular[]
  custom_section_labels: string[]
  template_preference?: TemplatePreference
}

// ── Default empty profile ──────────────────────────────────────

const emptyProfile: MasterProfile = {
  user_info: {
    full_name: '',
    phone: '',
    email: '',
    location: '',
    linkedin: '',
    github: '',
  },
  education: [],
  skills: {
    programming_languages: [],
    frameworks_libraries: [],
    tools_platforms: [],
    concepts: [],
  },
  internships: [],
  projects: [],
  extracurriculars: [],
  custom_section_labels: [],
}

// ── Profile normalizer ─────────────────────────────────────────
// Merges a raw (possibly partial/legacy) profile with emptyProfile defaults.
// Prevents crashes when a saved profile is missing fields added after initial save.
function normalizeProfile(raw: Partial<MasterProfile>): MasterProfile {
  return {
    ...emptyProfile,
    ...raw,
    user_info: { ...emptyProfile.user_info, ...(raw.user_info ?? {}) },
    skills: { ...emptyProfile.skills, ...(raw.skills ?? {}) },
    education: raw.education ?? [],
    internships: raw.internships ?? [],
    projects: raw.projects ?? [],
    extracurriculars: raw.extracurriculars ?? [],
    custom_section_labels: raw.custom_section_labels ?? [],
  }
}

// ── Context ────────────────────────────────────────────────────

interface ProfileContextType {
  profile: MasterProfile
  updateUserInfo: (info: UserInfo) => void
  addEducation: (edu: Education) => void
  setEducation: (edu: Education) => void
  removeEducation: (index: number) => void
  updateSkills: (skills: Skills) => void
  addInternship: (intern: Internship) => void
  removeInternship: (index: number) => void
  addProject: (project: Project) => void
  removeProject: (index: number) => void
  addExtracurricular: (extra: Extracurricular) => void
  removeExtracurricular: (index: number) => void
  updateExtracurricular: (index: number, extra: Extracurricular) => void
  clearExperienceSections: () => void
  setCustomSectionLabels: (labels: string[]) => void
  setTemplatePreference: (pref: TemplatePreference) => void
  isComplete: () => boolean
  completionPercentage: () => number
  resetProfile: () => void
}

const ProfileContext = createContext<ProfileContextType | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<MasterProfile>(emptyProfile)
  // Track whether we've finished loading from localStorage.
  // The save effect must NOT run until load is complete — otherwise the
  // initial emptyProfile state would overwrite saved data in localStorage.
  const [hydrated, setHydrated] = useState(false)

  // Load from Supabase (preferred) or fall back to localStorage on mount
  useEffect(() => {
    async function loadInitialProfile() {
      // Try Supabase first (works when logged in)
      const remote = await loadProfile()
      if (remote) {
        const parsed = normalizeProfile(remote as Partial<MasterProfile>)
        setProfile(parsed)
        // Keep localStorage in sync too
        localStorage.setItem('taylrdup_profile', JSON.stringify(parsed))
        setHydrated(true)
        return
      }

      // Fall back to localStorage (works before login / offline)
      const saved = localStorage.getItem('taylrdup_profile')
      if (saved) {
        try {
          setProfile(normalizeProfile(JSON.parse(saved)))
        } catch {
          // corrupt data — remove and start fresh
          localStorage.removeItem('taylrdup_profile')
        }
      }
      setHydrated(true)
    }
    loadInitialProfile()
  }, [])

  // Save to localStorage AND Supabase on every change (after hydration)
  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem('taylrdup_profile', JSON.stringify(profile))
    // Fire-and-forget Supabase sync — silently ignores errors (user might not be logged in yet)
    saveProfile(profile).catch(() => {})
  }, [profile, hydrated])

  const updateUserInfo = (info: UserInfo) => {
    setProfile(prev => ({ ...prev, user_info: info }))
  }

  const addEducation = (edu: Education) => {
    setProfile(prev => ({
      ...prev,
      education: [...prev.education.filter(e => e.degree !== edu.degree), edu],
    }))
  }

  const setEducation = (edu: Education) => {
    setProfile(prev => ({ ...prev, education: [edu] }))
  }

  const removeEducation = (index: number) => {
    setProfile(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }))
  }

  const updateSkills = (skills: Skills) => {
    setProfile(prev => ({ ...prev, skills }))
  }

  const addInternship = (intern: Internship) => {
    setProfile(prev => ({
      ...prev,
      internships: [...prev.internships.filter(i => i.company !== intern.company), intern],
    }))
  }

  const removeInternship = (index: number) => {
    setProfile(prev => ({
      ...prev,
      internships: prev.internships.filter((_, i) => i !== index),
    }))
  }

  const addProject = (project: Project) => {
    setProfile(prev => ({
      ...prev,
      projects: [...prev.projects.filter(p => p.title !== project.title), project],
    }))
  }

  const removeProject = (index: number) => {
    setProfile(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index),
    }))
  }

  const addExtracurricular = (extra: Extracurricular) => {
    setProfile(prev => ({
      ...prev,
      extracurriculars: [...prev.extracurriculars, extra],
    }))
  }

  const removeExtracurricular = (index: number) => {
    setProfile(prev => ({
      ...prev,
      extracurriculars: prev.extracurriculars.filter((_, i) => i !== index),
    }))
  }

  const updateExtracurricular = (index: number, extra: Extracurricular) => {
    setProfile(prev => ({
      ...prev,
      extracurriculars: prev.extracurriculars.map((e, i) => (i === index ? extra : e)),
    }))
  }

  const clearExperienceSections = () => {
    setProfile(prev => ({
      ...prev,
      internships: [],
      projects: [],
      extracurriculars: [],
    }))
  }

  const setCustomSectionLabels = (labels: string[]) => {
    setProfile(prev => ({ ...prev, custom_section_labels: labels }))
  }

  const setTemplatePreference = (pref: TemplatePreference) => {
    setProfile(prev => ({ ...prev, template_preference: pref }))
  }

  const isComplete = () => {
    // Skills are optional for generation — contact + education + one experience is enough
    return (
      profile.user_info.full_name !== '' &&
      profile.user_info.email !== '' &&
      profile.education.length > 0 &&
      (profile.internships.length > 0 || profile.projects.length > 0)
    )
  }

  const completionPercentage = () => {
    let score = 0
    const total = 5
    if (profile.user_info.full_name && profile.user_info.email) score++
    if (profile.education.length > 0) score++
    // Count skills across ALL buckets — user doesn't need to auto-categorize
    const allSkills = [
      ...profile.skills.programming_languages,
      ...profile.skills.frameworks_libraries,
      ...profile.skills.tools_platforms,
    ]
    if (allSkills.length > 0) score++
    if (profile.internships.length > 0) score++
    if (profile.projects.length > 0) score++
    return Math.round((score / total) * 100)
  }

  const resetProfile = () => {
    setProfile(emptyProfile)
    localStorage.removeItem('taylrdup_profile')
  }

  return (
    <ProfileContext.Provider
      value={{
        profile,
        updateUserInfo,
        addEducation,
        setEducation,
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
        setTemplatePreference,
        isComplete,
        completionPercentage,
        resetProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}
