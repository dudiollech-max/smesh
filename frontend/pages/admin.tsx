import { useState } from 'react'
import Head from 'next/head'

declare global {
  interface Window { ethereum?: any }
}

const SMESH_ADDRESS = '0xDA31b578841d6d4417Dba55EFbdbF068e101a67a'
const REGISTRY_V2 = '0x55684533a539eC77099A13ceD3C0B8665Cd0302b'
const ECOSYSTEM_WALLET = '0x280d5A5C052AD64C4f72f58f694C33beD29E175E'
const APPROVE_AMOUNT = '300000000000000000000000000' // 300M SMESH in wei

const SMESH_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
]

export default function AdminPage() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'approving' | 'done' | 'error'>('idle')
  const [txHash, setTxHash] = useState('')
  const [allowance, setAllowance] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [connectedAddress, setConnectedAddress] = useState('')

  async function loadEthers() {
    const { ethers } = await import('ethers')
    return ethers
  }

  async function connectAndCheck() {
    setStatus('checking')
    setError('')
    try {
      const ethers = await loadEthers()
      if (!window.ethereum) throw new Error('MetaMask not found')

      await window.ethereum.request({ method: 'eth_requestAccounts' })

      // Switch to Base
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x2105' }],
        })
      } catch (e: any) {
        if (e.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x2105',
              chainName: 'Base',
              rpcUrls: ['https://mainnet.base.org'],
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              blockExplorerUrls: ['https://basescan.org'],
            }],
          })
        }
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      setConnectedAddress(address)

      const token = new ethers.Contract(SMESH_ADDRESS, SMESH_ABI, provider)
      const current = await token.allowance(ECOSYSTEM_WALLET, REGISTRY_V2)
      const formatted = ethers.formatUnits(current, 18)
      setAllowance(parseFloat(formatted).toLocaleString())
      setStatus('idle')
    } catch (e: any) {
      setError(e.message || 'Failed to connect')
      setStatus('error')
    }
  }

  async function approveEcosystem() {
    setStatus('approving')
    setError('')
    try {
      const ethers = await loadEthers()
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const address = await signer.getAddress()

      if (address.toLowerCase() !== ECOSYSTEM_WALLET.toLowerCase()) {
        throw new Error(`Wrong wallet connected. Please connect the ecosystem wallet:\n${ECOSYSTEM_WALLET}`)
      }

      const token = new ethers.Contract(SMESH_ADDRESS, SMESH_ABI, signer)
      const tx = await token.approve(REGISTRY_V2, APPROVE_AMOUNT)
      setTxHash(tx.hash)
      await tx.wait()
      setStatus('done')

      // Re-check allowance
      const current = await token.allowance(ECOSYSTEM_WALLET, REGISTRY_V2)
      setAllowance(parseFloat(ethers.formatUnits(current, 18)).toLocaleString())
    } catch (e: any) {
      setError(e.message || 'Transaction failed')
      setStatus('error')
    }
  }

  return (
    <>
      <Head><title>Smesh Admin</title></Head>
      <div style={{
        minHeight: '100vh', background: '#000', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-body, sans-serif)', padding: '24px'
      }}>
        <div style={{ maxWidth: 520, width: '100%' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.2em', fontSize: 20, marginBottom: 8 }}>
            S M E S H
          </h1>
          <p style={{ color: '#666', fontSize: 12, letterSpacing: '0.3em', marginBottom: 40 }}>
            ADMIN — ECOSYSTEM WALLET APPROVAL
          </p>

          {/* Info box */}
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: 8, padding: 24, marginBottom: 24 }}>
            <p style={{ color: '#888', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
              The ecosystem wallet must approve the AgentRegistry contract to automatically
              send <strong style={{ color: '#fff' }}>1,000 SMESH</strong> rewards to agents on enrollment.
            </p>
            <div style={{ fontSize: 12, color: '#555' }}>
              <div style={{ marginBottom: 8 }}>Ecosystem wallet: <span style={{ color: '#888', fontFamily: 'monospace' }}>0x280d...175E</span></div>
              <div style={{ marginBottom: 8 }}>Registry v2: <span style={{ color: '#888', fontFamily: 'monospace' }}>0x5568...02b</span></div>
              <div>Approval amount: <span style={{ color: '#888' }}>300,000,000 SMESH</span></div>
            </div>
          </div>

          {/* Allowance status */}
          {allowance !== null && (
            <div style={{
              background: parseInt(allowance.replace(/,/g, '')) > 0 ? '#0a1a0a' : '#1a0a0a',
              border: `1px solid ${parseInt(allowance.replace(/,/g, '')) > 0 ? '#1a3a1a' : '#3a1a1a'}`,
              borderRadius: 8, padding: 16, marginBottom: 24, fontSize: 13
            }}>
              Current allowance: <strong style={{ color: '#fff' }}>{allowance} SMESH</strong>
              {parseInt(allowance.replace(/,/g, '')) > 0
                ? <span style={{ color: '#aaa', marginLeft: 8 }}>✅ Approved</span>
                : <span style={{ color: '#888', marginLeft: 8 }}>⚠️ Not yet approved</span>
              }
            </div>
          )}

          {/* Connected wallet */}
          {connectedAddress && (
            <div style={{ fontSize: 12, color: '#555', marginBottom: 16 }}>
              Connected: <span style={{ color: '#888', fontFamily: 'monospace' }}>
                {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
              </span>
              {connectedAddress.toLowerCase() !== ECOSYSTEM_WALLET.toLowerCase() && (
                <span style={{ color: '#666', marginLeft: 8 }}>⚠️ Switch to ecosystem wallet</span>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ background: '#1a0a0a', border: '1px solid #3a1a1a', borderRadius: 8, padding: 16, marginBottom: 24, fontSize: 13, color: '#ff6666', whiteSpace: 'pre-wrap' }}>
              {error}
            </div>
          )}

          {/* Buttons */}
          {!connectedAddress ? (
            <button onClick={connectAndCheck} disabled={status === 'checking'}
              style={{
                width: '100%', padding: '14px', background: '#fff', color: '#000',
                border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 600,
                letterSpacing: '0.1em', cursor: 'pointer', opacity: status === 'checking' ? 0.6 : 1
              }}>
              {status === 'checking' ? 'CONNECTING...' : 'CONNECT ECOSYSTEM WALLET'}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={connectAndCheck}
                style={{
                  padding: '12px', background: 'transparent', color: '#888',
                  border: '1px solid #333', borderRadius: 4, fontSize: 13, cursor: 'pointer'
                }}>
                REFRESH ALLOWANCE
              </button>
              <button onClick={approveEcosystem}
                disabled={status === 'approving' || status === 'done'}
                style={{
                  padding: '14px', background: status === 'done' ? '#1a3a1a' : '#fff',
                  color: status === 'done' ? '#aaa' : '#000',
                  border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 600,
                  letterSpacing: '0.1em', cursor: status === 'approving' ? 'wait' : 'pointer',
                  opacity: status === 'approving' ? 0.6 : 1
                }}>
                {status === 'approving' ? 'APPROVING — CONFIRM IN METAMASK...' :
                 status === 'done' ? '✅ APPROVED SUCCESSFULLY' :
                 'APPROVE ECOSYSTEM WALLET'}
              </button>
            </div>
          )}

          {/* Success */}
          {txHash && (
            <div style={{ marginTop: 24, padding: 16, background: '#0a1a0a', border: '1px solid #1a3a1a', borderRadius: 8, fontSize: 13 }}>
              <div style={{ color: '#aaa', marginBottom: 8 }}>Transaction confirmed ✅</div>
              <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                style={{ color: '#888', fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all' }}>
                {txHash}
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
