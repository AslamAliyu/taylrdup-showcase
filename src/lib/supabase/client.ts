/**
 * Demo stub. The real app uses Supabase Auth here.
 * In this showcase there is no backend, so every visitor is a local demo user.
 */
const DEMO_USER = { id: 'demo-user', email: 'demo@example.com' }

export function createClient() {
  return {
    auth: {
      getUser: async () => ({ data: { user: DEMO_USER } }),
      getSession: async () => ({ data: { session: { user: DEMO_USER } } }),
      signOut: async () => ({ error: null }),
    },
  }
}
