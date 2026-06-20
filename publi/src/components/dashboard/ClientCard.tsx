'use client'

import { useEffect, useState } from 'react'
import { MoreVertical, Crown, Calendar, Sparkles } from 'lucide-react'
import type { Client } from '@/types'
import { NETWORK_META } from '@/lib/networks'

interface ClientCardProps {
  client: Client
  onEdit: (client: Client) => void
  onDelete: (id: string) => void
  onViewWorkspace: (client: Client) => void
  onManageNetworks: (client: Client) => void
}

export function ClientCard({
  client,
  onEdit,
  onDelete,
  onViewWorkspace,
  onManageNetworks,
}: ClientCardProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const isPro = client.plan === 'pro'

  useEffect(() => {
    if (!dropdownOpen) return
    const handleClick = () => setDropdownOpen(false)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [dropdownOpen])

  return (
    <div className="group bg-white rounded-3xl border border-gray-100 p-6 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[340px] relative overflow-hidden">
      {/* Subtle top brand line overlay on hover */}
      <div 
        className="absolute top-0 inset-x-0 h-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ backgroundColor: client.color }}
      />

      {/* Header section */}
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex gap-3.5 items-center">
            {/* Elegant Colored Avatar */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg relative overflow-hidden transition-transform duration-300"
              style={{ 
                backgroundColor: client.color,
                boxShadow: `0 8px 20px -6px ${client.color}77`
              }}
            >
              <div className="absolute inset-0 bg-black/5 opacity-10" />
              {client.initials}
            </div>

            <div className="flex flex-col space-y-1">
              <span className="font-bold text-gray-900 text-lg leading-snug group-hover:text-[#0095b6] transition-colors duration-200">
                {client.name}
              </span>
              
              {/* Premium Plan Badge */}
              <div className="flex">
                {isPro ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-500 to-[#ffb703] text-white shadow-xs border border-amber-400/20">
                    <Crown className="w-3 h-3" />
                    PRO
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#cceef5]/70 text-[#0095b6] border border-[#0095b6]/10">
                    FREE
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setDropdownOpen(!dropdownOpen)
              }}
              className="p-1.5 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-100 transition-all text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {dropdownOpen && (
              <div className="absolute z-10 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 right-0 top-9 w-40 animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  onClick={() => {
                    setDropdownOpen(false)
                    onEdit(client)
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Editar cliente
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false)
                    onManageNetworks(client)
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Gestionar redes
                </button>
                <div className="border-t border-gray-50 my-1.5" />
                <button
                  onClick={() => {
                    setDropdownOpen(false)
                    onDelete(client.id)
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors"
                >
                  Eliminar cliente
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Client Description */}
        {client.description ? (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed font-medium">
            {client.description}
          </p>
        ) : (
          <p className="text-xs text-gray-400 italic leading-relaxed font-medium">
            Sin descripción agregada.
          </p>
        )}
      </div>

      {/* Middle & Stats section */}
      <div className="space-y-4 mt-4">
        {/* Connected Networks */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Redes vinculadas
          </span>
          <div className="flex gap-1.5 flex-wrap min-h-[26px]">
            {client.connectedNetworks.length > 0 ? (
              client.connectedNetworks.map((network) => {
                const meta = NETWORK_META[network]
                return (
                  <div
                    key={network}
                    className="flex items-center gap-1 bg-[#fcfbfa] border border-gray-100 rounded-full pl-1.5 pr-2.5 py-0.5 text-[10px] font-semibold text-gray-600 shadow-3xs"
                    title={meta.label}
                  >
                    <img src={meta.icon} alt={meta.label} width={14} height={14} className="object-contain size-3.5" />
                    {meta.label}
                  </div>
                )
              })
            ) : (
              <span className="text-xs text-gray-400 italic font-medium">Ninguna red conectada</span>
            )}
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-3 gap-1 bg-[#fcfbfa] border border-gray-100 rounded-2xl p-3">
          <div className="text-center">
            <div className="text-sm font-bold text-gray-800">{client.stats.scheduled}</div>
            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Programadas</div>
          </div>
          <div className="text-center border-x border-gray-100/80">
            <div className="text-sm font-bold text-gray-800">{client.stats.drafts}</div>
            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Borradores</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-gray-800">{client.stats.published}</div>
            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Publicadas</div>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={() => onViewWorkspace(client)}
        className="mt-5 w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-white border-2 border-[#0095b6] text-[#0095b6] font-bold text-xs uppercase tracking-wider transition-all hover:bg-[#0095b6] hover:text-white hover:shadow-md active:translate-y-0 shadow-2xs cursor-pointer"
      >
        Ingresar al Workspace
      </button>
    </div>
  )
}
