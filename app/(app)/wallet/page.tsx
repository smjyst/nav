import WalletClient from './WalletClient'

export const metadata = { title: 'Wallet Analyzer — NAV' }

export default function WalletPage() {
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Wallet Analyzer</h1>
        <p className="text-sm text-[#6b7280]">
          Analyse any Ethereum wallet. See what they hold, when they bought, and get hold or sell guidance.
        </p>
      </div>
      <WalletClient />
    </div>
  )
}
