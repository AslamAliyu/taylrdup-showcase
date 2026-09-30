import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-2xl font-bold font-display text-text-primary mb-2">Not part of this demo</h1>
      <p className="text-text-secondary mb-6 max-w-md">
        This showcase includes the profile builder and the resume dashboard. Sign-in, payments and history
        exist in the full app but are left out here.
      </p>
      <div className="flex gap-3">
        <Link href="/onboarding" className="btn-primary">Profile builder</Link>
        <Link href="/dashboard" className="btn-ghost">Dashboard</Link>
      </div>
    </div>
  )
}
