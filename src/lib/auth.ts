/**
 * Demo stub. The real app persists the profile and resume history in Supabase.
 * In this showcase the profile lives in localStorage (handled by profile-store)
 * and history is sample data.
 */
export interface ResumeHistoryItem {
  id: string
  company: string
  role: string
  fit_level: string | null
  resume_name: string | null
  created_at: string
}

export async function getUser() {
  return { id: 'demo-user', email: 'demo@example.com' }
}

export async function signOut() {}

export async function saveProfile(_profileData: object) {}

export async function loadProfile(): Promise<object | null> {
  return null
}

export async function saveResumeRecord(_record: {
  company_name: string
  role_title: string
  fit_level: string
  fit_score: number
  pdf_filename: string
}) {}

export async function loadResumeHistory(_limit: number = 20): Promise<ResumeHistoryItem[]> {
  return [
    { id: 'demo-1', company: 'Northwind', role: 'Frontend Engineering Intern', fit_level: 'Strong', resume_name: 'standard', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 'demo-2', company: 'Contoso', role: 'Software Engineer I', fit_level: 'Good', resume_name: 'technical', created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
  ]
}
