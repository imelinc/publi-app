'use client'

import {
  Heart,
  MessageCircle,
  Send,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Share2,
  Repeat,
  BarChart2,
  Play,
  Bookmark,
  Globe,
  MoreHorizontal,
  Music,
} from 'lucide-react'
import type { Network, Client } from '@/types'
import { NETWORK_META } from '@/lib/networks'

interface PostPreviewProps {
  description: string
  imageUrl: string | null
  client: Client | null
  networks: Network[]
  activeNetwork: Network | null
  onNetworkSelect: (network: Network) => void
}

export function PostPreview({
  description,
  imageUrl,
  client,
  networks,
  activeNetwork,
  onNetworkSelect,
}: PostPreviewProps) {
  const clientName = client?.name ?? 'Tu cuenta'
  const clientInitials = client?.initials ?? 'CM'
  const clientColor = client?.color ?? '#999999'
  const clientUsername = clientName.toLowerCase().replace(/\s+/g, '')

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
                src={NETWORK_META[network].iconColor}
                alt={NETWORK_META[network].label}
                width={16}
                height={16}
                className="size-4 object-contain"
              />
              {NETWORK_META[network].label}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 mb-4">Seleccioná al menos una red para ver el preview</p>
      )}

      {/* ────────────────── INSTAGRAM PREVIEW ────────────────── */}
      {activeNetwork === 'instagram' && networks.includes('instagram') && (
        <div className="w-72 mx-auto border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
          <div className="flex items-center gap-2 p-3 border-b border-gray-50">
            <div
              className="size-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
              style={{ backgroundColor: clientColor }}
            >
              {clientInitials}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-900">{clientName}</p>
              <p className="text-[10px] text-gray-400">· Ahora</p>
            </div>
            <MoreHorizontal className="ml-auto text-gray-400 size-4 cursor-pointer" />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl || '/images/restaurant.jpg'}
            alt="Post preview"
            className="w-full h-64 object-cover bg-gray-50"
          />
          <div className="flex gap-4 p-3 text-gray-700">
            <Heart className="size-5 hover:text-red-500 cursor-pointer transition" />
            <MessageCircle className="size-5 hover:text-gray-900 cursor-pointer transition" />
            <Send className="size-5 hover:text-gray-900 cursor-pointer transition" />
          </div>
          <div className="px-3 pb-3">
            <p className="text-xs text-gray-900 leading-relaxed break-words whitespace-pre-wrap">
              <span className="font-semibold mr-1.5">{clientUsername}</span>
              {description || 'Escribí el copy de tu publicación...'}
            </p>
          </div>
        </div>
      )}

      {/* ────────────────── FACEBOOK PREVIEW ────────────────── */}
      {activeNetwork === 'facebook' && networks.includes('facebook') && (
        <div className="w-80 mx-auto border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <div className="flex items-center gap-2 p-3 pb-2">
            <div
              className="size-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ backgroundColor: clientColor }}
            >
              {clientInitials}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 hover:underline cursor-pointer">{clientName}</p>
              <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                <span>Ahora</span>
                <span>·</span>
                <Globe className="size-3" />
              </div>
            </div>
            <MoreHorizontal className="ml-auto text-gray-400 size-4 cursor-pointer" />
          </div>
          
          <div className="px-3 pb-2.5">
            <p className="text-xs text-gray-900 leading-relaxed break-words whitespace-pre-wrap">
              {description || 'Escribí el copy de tu publicación...'}
            </p>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl || '/images/restaurant.jpg'}
            alt="Post preview"
            className="w-full h-48 object-cover bg-gray-50"
          />

          <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span>👍 15</span>
            <div className="flex gap-2">
              <span>0 comentarios</span>
              <span>·</span>
              <span>0 veces compartido</span>
            </div>
          </div>

          <div className="flex justify-around p-1 text-gray-600">
            <button className="flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-semibold hover:bg-gray-50 rounded-lg cursor-pointer flex-1 transition">
              <ThumbsUp className="size-4" />
              <span>Me gusta</span>
            </button>
            <button className="flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-semibold hover:bg-gray-50 rounded-lg cursor-pointer flex-1 transition">
              <MessageSquare className="size-4" />
              <span>Comentar</span>
            </button>
            <button className="flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-semibold hover:bg-gray-50 rounded-lg cursor-pointer flex-1 transition">
              <Share2 className="size-4" />
              <span>Compartir</span>
            </button>
          </div>
        </div>
      )}

      {/* ────────────────── TIKTOK PREVIEW ────────────────── */}
      {activeNetwork === 'tiktok' && networks.includes('tiktok') && (
        <div className="w-64 mx-auto border-4 border-gray-900 rounded-[2.5rem] overflow-hidden bg-black text-white relative aspect-[9/16] shadow-md">
          {/* Media background */}
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt="Post preview"
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-950 flex flex-col items-center justify-center text-center p-4">
              <span className="text-[10px] text-gray-550 uppercase tracking-widest font-semibold mb-2">Vista previa</span>
              <p className="text-xs text-gray-400 px-8 max-w-[180px] mx-auto">Sube una imagen para ver el fondo de tu TikTok</p>
            </div>
          )}

          {/* Right Floating Sidebar */}
          <div className="absolute right-5 bottom-16 flex flex-col items-center gap-3 z-10">
            <div className="relative">
              <div
                className="size-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                style={{ backgroundColor: clientColor }}
              >
                {clientInitials}
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#ff0050] text-[8px] font-bold text-white size-3 rounded-full flex items-center justify-center">
                +
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="bg-black/30 p-1.5 rounded-full backdrop-blur-sm cursor-pointer">
                <Heart className="size-5.5 text-white fill-white/10 hover:fill-red-500 hover:text-red-500 transition" />
              </div>
              <span className="text-[9px] font-semibold mt-0.5">4.2K</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="bg-black/30 p-1.5 rounded-full backdrop-blur-sm cursor-pointer">
                <MessageCircle className="size-5.5 text-white fill-white/10 hover:fill-white transition" />
              </div>
              <span className="text-[9px] font-semibold mt-0.5">112</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="bg-black/30 p-1.5 rounded-full backdrop-blur-sm cursor-pointer">
                <Bookmark className="size-5.5 text-white fill-white/10 hover:fill-yellow-500 hover:text-yellow-500 transition" />
              </div>
              <span className="text-[9px] font-semibold mt-0.5">86</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="bg-black/30 p-1.5 rounded-full backdrop-blur-sm cursor-pointer">
                <Share2 className="size-5.5 text-white fill-white/10 hover:fill-white transition" />
              </div>
              <span className="text-[9px] font-semibold mt-0.5">32</span>
            </div>

            <div className="size-6 rounded-full border-4 border-gray-800 bg-gray-950 animate-spin flex items-center justify-center mt-1">
              <div className="size-2 rounded-full bg-red-500" />
            </div>
          </div>

          {/* Bottom Left Info Overlay */}
          <div className="absolute left-5 right-18 bottom-5 z-10 text-left bg-black/45 backdrop-blur-xs p-2 rounded-lg border border-white/5">
            <p className="text-xs font-bold text-white hover:underline cursor-pointer">@{clientUsername}</p>
            <p className="text-[11px] text-gray-100 mt-1 line-clamp-3 leading-relaxed">
              {description || 'Escribí el copy de tu publicación...'}
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-350 mt-1.5 overflow-hidden whitespace-nowrap">
              <Music className="size-3 flex-shrink-0 animate-pulse" />
              <span className="animate-marquee block truncate">Sonido original - @{clientUsername}</span>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── X (TWITTER) PREVIEW ────────────────── */}
      {activeNetwork === 'x' && networks.includes('x') && (
        <div className="w-80 mx-auto border border-gray-200 rounded-xl p-3 bg-white shadow-sm text-left">
          <div className="flex gap-2">
            {/* Avatar column */}
            <div
              className="size-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ backgroundColor: clientColor }}
            >
              {clientInitials}
            </div>

            {/* Content column */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 truncate">
                  <span className="text-xs font-bold text-gray-900 hover:underline cursor-pointer truncate">
                    {clientName}
                  </span>
                  <span className="text-[10px] text-gray-500 truncate">@{clientUsername}</span>
                  <span className="text-[10px] text-gray-400">· 1m</span>
                </div>
                <MoreHorizontal className="text-gray-400 size-4 flex-shrink-0 cursor-pointer" />
              </div>

              <p className="text-xs text-gray-900 mt-1 leading-relaxed break-words whitespace-pre-wrap">
                {description || 'Escribí el copy de tu publicación...'}
              </p>

              {imageUrl && (
                <div className="mt-2 rounded-xl overflow-hidden border border-gray-150">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Post preview"
                    className="w-full h-44 object-cover bg-gray-50"
                  />
                </div>
              )}

              <div className="flex justify-between items-center text-gray-500 mt-3 pt-1 max-w-[240px]">
                <button className="flex items-center gap-1 hover:text-sky-500 transition group cursor-pointer">
                  <MessageCircle className="size-4 group-hover:bg-sky-50 p-0.5 rounded-full" />
                  <span className="text-[10px]">0</span>
                </button>
                <button className="flex items-center gap-1 hover:text-green-500 transition group cursor-pointer">
                  <Repeat className="size-4 group-hover:bg-green-50 p-0.5 rounded-full" />
                  <span className="text-[10px]">0</span>
                </button>
                <button className="flex items-center gap-1 hover:text-pink-500 transition group cursor-pointer">
                  <Heart className="size-4 group-hover:bg-pink-50 p-0.5 rounded-full" />
                  <span className="text-[10px]">0</span>
                </button>
                <button className="flex items-center gap-1 hover:text-sky-500 transition group cursor-pointer">
                  <BarChart2 className="size-4 group-hover:bg-sky-50 p-0.5 rounded-full" />
                  <span className="text-[10px]">25</span>
                </button>
                <button className="flex items-center gap-1 hover:text-sky-500 transition group cursor-pointer">
                  <Send className="size-4 group-hover:bg-sky-50 p-0.5 rounded-full" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── LINKEDIN PREVIEW ────────────────── */}
      {activeNetwork === 'linkedin' && networks.includes('linkedin') && (
        <div className="w-80 mx-auto border border-gray-200 rounded-xl bg-white shadow-sm text-left">
          <div className="flex items-start gap-2 p-3 pb-2">
            <div
              className="size-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ backgroundColor: clientColor }}
            >
              {clientInitials}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 hover:underline cursor-pointer">{clientName}</p>
              <p className="text-[9px] text-gray-500 truncate max-w-[180px]">CM Freelance & Management</p>
              <div className="flex items-center gap-1 text-[9px] text-gray-400 mt-0.5">
                <span>Ahora</span>
                <span>·</span>
                <Globe className="size-2.5" />
              </div>
            </div>
            <MoreHorizontal className="ml-auto text-gray-400 size-4 cursor-pointer" />
          </div>

          <div className="px-3 pb-2.5">
            <p className="text-xs text-gray-900 leading-relaxed break-words whitespace-pre-wrap">
              {description || 'Escribí el copy de tu publicación...'}
            </p>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl || '/images/restaurant.jpg'}
            alt="Post preview"
            className="w-full h-48 object-cover bg-gray-50"
          />

          <div className="px-3 py-1.5 border-b border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
            <span>👍 8 · 0 comentarios</span>
          </div>

          <div className="flex justify-around py-2 border-t border-gray-100 text-gray-500 bg-gray-50/50">
            <button className="flex items-center justify-center p-2 hover:bg-gray-100 hover:text-gray-700 rounded-full cursor-pointer transition flex-1 text-gray-500" title="Recomendar">
              <ThumbsUp className="size-4" />
            </button>
            <button className="flex items-center justify-center p-2 hover:bg-gray-100 hover:text-gray-700 rounded-full cursor-pointer transition flex-1 text-gray-500" title="Comentar">
              <MessageSquare className="size-4" />
            </button>
            <button className="flex items-center justify-center p-2 hover:bg-gray-100 hover:text-gray-700 rounded-full cursor-pointer transition flex-1 text-gray-500" title="Compartir">
              <Share2 className="size-4" />
            </button>
            <button className="flex items-center justify-center p-2 hover:bg-gray-100 hover:text-gray-700 rounded-full cursor-pointer transition flex-1 text-gray-500" title="Enviar">
              <Send className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* ────────────────── YOUTUBE PREVIEW ────────────────── */}
      {activeNetwork === 'youtube' && networks.includes('youtube') && (
        <div className="w-80 mx-auto border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm text-left">
          {/* Video Container with Play button overlay */}
          <div className="relative w-full h-44 bg-black flex items-center justify-center group overflow-hidden">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt="Post preview"
                className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition duration-300"
              />
            ) : (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <span className="text-[10px] text-gray-500">Thumbnail del video</span>
              </div>
            )}
            <div className="absolute size-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:bg-red-600 transition cursor-pointer">
              <Play className="size-5 fill-white ml-0.5" />
            </div>
            {/* Time badge */}
            <div className="absolute bottom-2 right-2 bg-black/80 px-1 py-0.5 rounded text-[10px] text-white font-semibold">
              2:35
            </div>
          </div>

          <div className="p-3">
            <div className="flex gap-2">
              <div
                className="size-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
                style={{ backgroundColor: clientColor }}
              >
                {clientInitials}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-gray-900 line-clamp-2 leading-tight">
                  {description.slice(0, 80) || 'Título de tu video...'}
                </h4>
                <div className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                  <p>{clientName}</p>
                  <p>1 visualización · hace un momento</p>
                </div>
              </div>
              <MoreHorizontal className="text-gray-400 size-4 flex-shrink-0 cursor-pointer" />
            </div>

            <div className="flex items-center justify-between border-t border-gray-50 mt-3 pt-2 text-[10px] text-gray-600">
              <div className="flex items-center gap-0.5 bg-gray-100 rounded-full px-2 py-1">
                <button className="flex items-center gap-1 hover:text-black cursor-pointer">
                  <ThumbsUp className="size-3.5" />
                  <span>0</span>
                </button>
                <div className="w-[1px] h-3 bg-gray-300 mx-1" />
                <button className="flex items-center gap-1 hover:text-black cursor-pointer">
                  <ThumbsDown className="size-3.5" />
                </button>
              </div>
              
              <button className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 transition rounded-full px-2.5 py-1 cursor-pointer">
                <Share2 className="size-3.5" />
                <span>Compartir</span>
              </button>

              <button className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 transition rounded-full px-2.5 py-1 cursor-pointer">
                <Repeat className="size-3.5" />
                <span>Remix</span>
              </button>
            </div>
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
