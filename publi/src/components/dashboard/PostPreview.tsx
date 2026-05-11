'use client'

import { Heart, MessageCircle, Send, Eye } from 'lucide-react'
import type { SocialNetwork, Workspace } from '@/lib/mock-data'

interface PostPreviewProps {
  description: string
  imageUrl: string | null
  workspace: Workspace | null
  networks: SocialNetwork[]
  activeNetwork: SocialNetwork | null
  onNetworkSelect: (network: SocialNetwork) => void
}

const NETWORK_ICONS: Record<SocialNetwork, string> = {
  instagram: '/icons/instagram-color.svg',
  facebook: '/icons/facebook-color.svg',
  tiktok: '/icons/tiktok-color.svg',
  linkedin: '/icons/linkedin-color.svg',
  twitter: '/icons/twitter-color.svg',
  youtube: '/icons/yt-color.svg',
  threads: '/icons/threads-color.svg',
}

const NETWORK_NAMES: Record<SocialNetwork, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  twitter: 'X',
  youtube: 'YouTube',
  threads: 'Threads',
}

export function PostPreview({
  description,
  imageUrl,
  workspace,
  networks,
  activeNetwork,
  onNetworkSelect,
}: PostPreviewProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <p className="text-sm font-medium text-gray-700 mb-2">Vista previa en:</p>
      {networks.length > 0 ? (
        <div className="flex gap-2 flex-wrap mb-4">
          {networks.map((network) => (
            <button
              key={network}
              type="button"
              onClick={() => onNetworkSelect(network)}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs cursor-pointer transition-colors ${
                activeNetwork === network
                  ? 'bg-[#cceef5] border-[#0095b6] text-[#0095b6]'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={NETWORK_ICONS[network]}
                alt={NETWORK_NAMES[network]}
                width={16}
                height={16}
                className="size-4 object-contain"
              />
              {NETWORK_NAMES[network]}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 mb-4">Seleccioná al menos una red para ver el preview</p>
      )}

      {activeNetwork === 'instagram' && networks.includes('instagram') && (
        <div className="w-64 mx-auto border-2 border-gray-800 rounded-3xl overflow-hidden bg-white">
          <div className="flex items-center gap-2 p-3 border-b border-gray-100">
            <div
              className="size-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: workspace?.color ?? '#999' }}
            >
              {workspace?.initials ?? 'CM'}
            </div>
            <div>
              <p className="text-xs font-semibold">{workspace?.name ?? 'Tu cuenta'}</p>
              <p className="text-[10px] text-gray-400">· Ahora</p>
            </div>
            <span className="ml-auto text-gray-400 text-lg leading-none">···</span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl || '/images/restaurant.jpg'}
            alt="Post preview"
            className="w-full h-48 object-cover"
          />
          <div className="flex gap-3 p-3 text-gray-700">
            <Heart className="size-5" />
            <MessageCircle className="size-5" />
            <Send className="size-5" />
          </div>
          <p className="text-xs px-3 pb-3 pt-0 line-clamp-3 leading-relaxed">
            {description || 'Escribí el copy de tu publicación...'}
          </p>
        </div>
      )}

      {activeNetwork === 'tiktok' && networks.includes('tiktok') && (
        <div className="w-48 mx-auto bg-black rounded-2xl overflow-hidden text-white relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl || '/images/restaurant.jpg'}
            alt="Post preview"
            className="w-full h-64 object-cover opacity-90"
          />
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80">
            <p className="text-sm font-semibold">
              @{(workspace?.name ?? 'cuenta').toLowerCase().replace(/\s+/g, '')}
            </p>
            <p className="text-xs opacity-80 line-clamp-2">
              {description || 'Escribí el copy de tu publicación...'}
            </p>
          </div>
        </div>
      )}

      {(activeNetwork === 'facebook' || activeNetwork === 'linkedin' || activeNetwork === 'twitter' || activeNetwork === 'youtube' || activeNetwork === 'threads') && activeNetwork !== null && (
        <div className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Post preview"
              className="w-full h-40 object-cover"
            />
          )}
          <div className="p-3">
            <div className="flex items-center gap-1.5">
              <div
                className="size-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
                style={{ backgroundColor: workspace?.color ?? '#999' }}
              >
                {workspace?.initials ?? 'CM'}
              </div>
              <span className="font-semibold text-sm">{workspace?.name ?? 'Tu cuenta'}</span>
              <span className="text-gray-400 text-xs">· Ahora</span>
            </div>
            <p className="text-sm text-gray-700 line-clamp-3 mt-1">
              {description || 'Escribí el copy de tu publicación...'}
            </p>
          </div>
        </div>
      )}

      {(networks.length === 0 || activeNetwork === null) && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Eye className="size-12 text-gray-200" />
          <p className="text-sm text-gray-400 mt-2">Tu publicación aparecerá aquí</p>
        </div>
      )}
    </div>
  )
}