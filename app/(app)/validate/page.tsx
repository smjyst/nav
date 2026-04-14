import ValidateClient from './ValidateClient'

export const metadata = { title: 'Validate — NAV' }

export default function ValidatePage() {
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">NAV Validate</h1>
        <p className="text-sm text-[#6b7280]">
          Paste a token name or contract address before you buy. NAV checks for risks, scams, and entry timing.
        </p>
      </div>
      <ValidateClient />
    </div>
  )
}
