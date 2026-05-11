'use client'

import { useEffect, useState } from 'react'
import { MoreVertical } from 'lucide-react'
import type { Workspace, Post, SocialNetwork } from '@/lib/mock-data'

const NETWORK_META: Record<SocialNetwork, { icon: string; label: string }> = {
  instagram: { icon: '/icons/instagram.svg', label: 'Instagram' },
  facebook: { icon: '/icons/facebook.svg', label: 'Facebook' },
  tiktok: { icon: '/icons/tiktok.svg', label: 'TikTok' },
  linkedin: { icon: '/icons/linkedin.svg', label: 'LinkedIn' },
  twitter: { icon: '/icons/twitter.svg', label: 'X' },
  youtube: { icon: '/icons/youtube.svg', label: 'YouTube' },
  threads: { icon: '/icons/theads.svg', label: 'Threads' },
}

interface ClientCardProps {
  workspace: Workspace
  posts: Post[]
  onEdit: (workspace: Workspace) => void
  onDelete: (id: string) => void
}

export function ClientCard({ workspace, posts, onEdit, onDelete }: ClientCardProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    if (!dropdownOpen) return
    const handleClick = () => setDropdownOpen(false)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [dropdownOpen])

  const scheduled = posts.filter((p) => p.status === 'scheduled').length
  const drafts = posts.filter((p) => p.status === 'draft').length
  const published = posts.filter((p) => p.status === 'published').length

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start">
        <div className="flex gap-3 items-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm"
            style={{ backgroundColor: workspace.color }}
          >
            {workspace.initials}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900">{workspace.name}</span>
            {workspace.plan === 'pro' ? (
              <span className="bg-[#cceef5] text-[#0095b6] text-xs px-2 py-0.5 rounded-full font-medium w-fit">
                Pro
              </span>
            ) : (
              <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full font-medium w-fit">
                Free
              </span>
            )}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setDropdownOpen(!dropdownOpen)
            }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <MoreVertical className="w-[18px] h-[18px] text-gray-400" />
          </button>
          {dropdownOpen && (
            <div className="absolute z-10 bg-white border border-gray-100 rounded-lg shadow-lg py-1 right-0 top-8 w-36">
              <button
                onClick={() => {
                  setDropdownOpen(false)
                  onEdit(workspace)
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Editar
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false)
                  onDelete(workspace.id)
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-red-500 hover:bg-gray-50"
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
          Redes conectadas
        </span>
        <div className="flex gap-2 flex-wrap mt-1">
          {workspace.networks.map((network) => {
            const meta = NETWORK_META[network]
            return (
              <div
                key={network}
                className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1 text-xs text-gray-600"
              >
                <img src={meta.icon} alt={meta.label} width={16} height={16} />
                {meta.label}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex gap-4 mt-4 pt-4 border-t border-gray-50">
        <div>
          <div className="font-semibold text-gray-900 text-sm">{scheduled}</div>
          <div className="text-xs text-gray-400">programadas</div>
        </div>
        <div>
          <div className="font-semibold text-gray-900 text-sm">{drafts}</div>
          <div className="text-xs text-gray-400">borrador</div>
        </div>
        <div>
          <div className="font-semibold text-gray-900 text-sm">{published}</div>
          <div className="text-xs text-gray-400">publicadas</div>
        </div>
      </div>

      <button className="mt-4 w-full border border-[#0095b6] text-[#0095b6] rounded-lg py-2 text-sm font-medium hover:bg-[#cceef5] transition-colors">
        Ver workspace
      </button>
    </div>
  )
}