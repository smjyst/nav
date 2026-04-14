import { cachedFetch, CACHE_KEYS, TTL } from '@/lib/redis/client'

const BASE = 'https://api.etherscan.io/api'

async function ethFetch<T>(params: Record<string, string>): Promise<T> {
  const query = new URLSearchParams({
    ...params,
    apikey: process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken',
  })
  const res = await fetch(`${BASE}?${query}`)
  if (!res.ok) throw new Error(`Etherscan error: ${res.status}`)
  const json = await res.json()
  if (json.status === '0' && json.message !== 'No transactions found') {
    throw new Error(`Etherscan: ${json.message} — ${json.result}`)
  }
  return json.result as T
}

// Validate ETH address format
export function isValidEthAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export interface EthTransaction {
  blockNumber: string
  timeStamp: string
  hash: string
  from: string
  to: string
  value: string
  tokenName?: string
  tokenSymbol?: string
  tokenDecimal?: string
  contractAddress?: string
  gasUsed: string
  gasPrice: string
}

export interface TokenBalance {
  contractAddress: string
  tokenName: string
  tokenSymbol: string
  tokenDecimal: string
  value: string
}

// Get ETH balance
export async function getEthBalance(address: string): Promise<string> {
  return ethFetch<string>({ module: 'account', action: 'balance', address, tag: 'latest' })
}

// Get ERC-20 token holdings
export async function getTokenBalances(address: string): Promise<TokenBalance[]> {
  return cachedFetch(
    CACHE_KEYS.wallet(address, 'ethereum'),
    TTL.WALLET,
    () => ethFetch<TokenBalance[]>({
      module: 'account',
      action: 'tokentx',
      address,
      startblock: '0',
      endblock: '99999999',
      sort: 'desc',
      offset: '50',
      page: '1',
    })
  )
}

// Get normal ETH transactions (last 100)
export async function getTransactions(address: string): Promise<EthTransaction[]> {
  return ethFetch<EthTransaction[]>({
    module: 'account',
    action: 'txlist',
    address,
    startblock: '0',
    endblock: '99999999',
    sort: 'asc',
    offset: '100',
    page: '1',
  })
}

// Get contract source code verification status
export async function getContractInfo(contractAddress: string): Promise<{ isVerified: boolean; contractName: string }> {
  return cachedFetch(
    CACHE_KEYS.contract(contractAddress, 'ethereum'),
    TTL.CONTRACT,
    async () => {
      const result = await ethFetch<Array<{ SourceCode: string; ContractName: string; CompilerVersion: string }>>({
        module: 'contract',
        action: 'getsourcecode',
        address: contractAddress,
      })
      if (!result || result.length === 0) return { isVerified: false, contractName: '' }
      return {
        isVerified: result[0].SourceCode !== '',
        contractName: result[0].ContractName,
      }
    }
  )
}

// Get token holder count (from token tracker)
export async function getTokenHolderCount(contractAddress: string): Promise<number> {
  try {
    const result = await ethFetch<string>({
      module: 'token',
      action: 'tokenholdercount',
      contractaddress: contractAddress,
    })
    return parseInt(result, 10) || 0
  } catch {
    return 0
  }
}
