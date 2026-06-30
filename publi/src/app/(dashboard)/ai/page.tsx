'use client'

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react'
import Image from 'next/image'
import { Send, Plus, Trash2, MessageSquare, AlertCircle, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/use-app-store'
import ImageGenerator from '@/components/dashboard/ai/ImageGenerator'
import { ALL_NETWORKS, NETWORK_META } from '@/lib/networks'
import { PlanUpgradeGuard } from '@/components/dashboard/PlanUpgradeGuard'

interface Message {
  role: 'user' | 'assistant'
  content: string
  id: string
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  network?: string
}

const SUGGESTIONS = [
  'Generame ideas para 3 posts de Instagram esta semana',
  'Escribime un copy para anunciar un producto nuevo',
  '¿Qué hashtags uso para llegar a más gente?',
  '¿Cuál es el mejor horario para publicar?',
  'Dame una idea de imagen para que la genere la IA para anunciar el lanzamiento de nuestra app',
  'Reescribí este texto con tono más dinámico: [tu texto]',
]

const INITIAL_MESSAGE_CONTENT =
  '¡Hola! Soy Copi, tu asistente de publi. Puedo ayudarte con ideas de contenido, copy para Instagram, hashtags, horarios de publicación y estrategia. ¿Con qué empezamos?'

const STORAGE_KEY = 'publi_ai_chat_sessions'

export default function AiPage() {
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId)
  const clients = useAppStore((s) => s.clients)
  const userProfile = useAppStore((s) => s.userProfile)
  const activeClient = clients.find((c) => c.id === activeWorkspaceId) ?? clients[0] ?? null

  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'images'>('chat')
  const [selectedNetwork, setSelectedNetwork] = useState<string>('general')

  if (userProfile?.plan === 'free') {
    return (
      <PlanUpgradeGuard
        featureName="Copi IA y el Generador de imágenes"
      />
    )
  }

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load sessions from localStorage on client side
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as ChatSession[]
        setSessions(parsed)
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id)
        }
      }
    } catch (e) {
      console.error('Failed to load chat sessions:', e)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Sync sessions to localStorage
  const saveSessions = useCallback((newSessions: ChatSession[]) => {
    setSessions(newSessions)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions))
    } catch (e) {
      console.error('Failed to save chat sessions:', e)
    }
  }, [])

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null
  const messages = activeSession ? activeSession.messages : []

  // Count user messages to check the 10 messages limit
  const userMessagesCount = messages.filter((m) => m.role === 'user').length
  const isLimitReached = userMessagesCount >= 10

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`
    }
  }, [input])

  // Load selected network when active session changes
  useEffect(() => {
    const session = sessions.find((s) => s.id === activeSessionId)
    if (session) {
      setSelectedNetwork(session.network ?? 'general')
    }
  }, [activeSessionId, sessions])

  const createNewSession = useCallback(() => {
    const newSessionId = `session-${Date.now()}`
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'Nueva conversación',
      messages: [],
      createdAt: Date.now(),
      network: 'general',
    }
    const updated = [newSession, ...sessions]
    saveSessions(updated)
    setActiveSessionId(newSessionId)
    setInput('')
    setSelectedNetwork('general')
  }, [sessions, saveSessions])

  const handleNetworkChange = (net: string) => {
    setSelectedNetwork(net)
    if (activeSessionId) {
      const updated = sessions.map((s) => {
        if (s.id === activeSessionId) {
          return { ...s, network: net }
        }
        return s
      })
      saveSessions(updated)
    }
  }

  const deleteSession = useCallback(
    (sessionId: string, e: React.MouseEvent) => {
      e.stopPropagation()
      const updated = sessions.filter((s) => s.id !== sessionId)
      saveSessions(updated)
      
      if (activeSessionId === sessionId) {
        if (updated.length > 0) {
          setActiveSessionId(updated[0].id)
        } else {
          setActiveSessionId(null)
        }
      }
    },
    [sessions, activeSessionId, saveSessions],
  )

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading || isLimitReached || !activeSessionId) return

      const userMsg: Message = {
        role: 'user',
        content: trimmed,
        id: `user-${Date.now()}`,
      }

      // Update current session messages
      const updatedMessages = [...messages, userMsg]
      
      // Update session title on the first user message
      let newTitle = activeSession?.title || 'Conversación'
      if (userMessagesCount === 0) {
        newTitle = trimmed.length > 30 ? `${trimmed.slice(0, 30)}...` : trimmed
      }

      const updatedSessions = sessions.map((s) => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            title: newTitle,
            messages: updatedMessages,
          }
        }
        return s
      })

      saveSessions(updatedSessions)
      setInput('')
      setIsLoading(true)

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            clientId: activeWorkspaceId,
            history: messages.map(({ role, content }) => ({ role, content })),
            network: selectedNetwork,
          }),
        })

        if (!res.ok) throw new Error('fetch failed')

        const data = await res.json()
        const assistantMsg: Message = {
          role: 'assistant',
          content: data.reply ?? data.content ?? 'No obtuve una respuesta.',
          id: `assistant-${Date.now()}`,
        }

        const finalSessions = updatedSessions.map((s) => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: [...updatedMessages, assistantMsg],
            }
          }
          return s
        })
        saveSessions(finalSessions)
      } catch {
        const errorMsg: Message = {
          role: 'assistant',
          content: 'Hubo un error al conectarme. Intentá de nuevo.',
          id: `error-${Date.now()}`,
        }
        const finalSessions = updatedSessions.map((s) => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: [...updatedMessages, errorMsg],
            }
          }
          return s
        })
        saveSessions(finalSessions)
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, isLimitReached, activeSessionId, activeSession, messages, sessions, saveSessions, userMessagesCount, activeWorkspaceId, selectedNetwork],
  )

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (isLoading || isLimitReached) return
    setInput(suggestion)
    sendMessage(suggestion)
  }

  // Create an initial session if none exists and page loaded
  useEffect(() => {
    if (isLoaded && sessions.length === 0) {
      createNewSession()
    }
  }, [isLoaded, sessions.length, createNewSession])

  const canSend = input.trim().length > 0 && !isLoading && !isLimitReached

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-7rem)] bg-white rounded-xl border border-gray-100">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0095b6] animate-bounce [animation-delay:0ms]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#0095b6] animate-bounce [animation-delay:150ms]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#0095b6] animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Tabs para conmutar entre Chat e Imágenes */}
      <div className="flex border-b border-gray-100/80 bg-slate-50/50 backdrop-blur-md shrink-0 px-6 py-3">
        <div className="flex rounded-xl bg-gray-100/80 p-1 ring-1 ring-black/5 backdrop-blur-xs">
          <button
            onClick={() => setActiveTab('chat')}
            className={cn(
              'px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 flex items-center gap-2',
              activeTab === 'chat'
                ? 'bg-white text-gray-800 shadow-xs'
                : 'text-gray-500 hover:text-gray-850'
            )}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chat con Copi
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={cn(
              'px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 flex items-center gap-2',
              activeTab === 'images'
                ? 'bg-white text-gray-800 shadow-xs'
                : 'text-gray-500 hover:text-gray-855'
            )}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Generador de Imágenes
          </button>
        </div>
      </div>

      <div className="flex-grow min-h-0 flex">
        {activeTab === 'chat' ? (
          <>
            {/* Sidebar de Chats */}
            <div className="w-64 shrink-0 border-r border-gray-100 bg-slate-50/40 backdrop-blur-xs flex flex-col h-full">
              <div className="p-4 border-b border-gray-100/80">
                <button
                  onClick={createNewSession}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-[#00b4d8] text-white rounded-xl py-2.5 px-4 text-xs font-bold transition-all duration-200 hover:scale-[1.01] hover:opacity-95 shadow-[0_4px_12px_rgba(0,149,182,0.2)] active:scale-[0.99]"
                >
                  <Plus className="w-4 h-4" />
                  Nueva conversación
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {sessions.map((session) => {
                  const isActive = session.id === activeSessionId
                  return (
                    <div
                      key={session.id}
                      onClick={() => {
                        setActiveSessionId(session.id)
                        setInput('')
                      }}
                      className={cn(
                        'group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs transition-all relative font-semibold border border-transparent',
                        isActive
                          ? 'bg-white text-gray-900 shadow-sm border-gray-100/50 pl-4 border-l-primary border-l-2'
                          : 'text-gray-500 hover:bg-slate-100/55 hover:text-gray-800',
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-6">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        <span className="truncate">{session.title}</span>
                      </div>
                      <button
                        onClick={(e) => deleteSession(session.id, e)}
                        className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-opacity"
                        title="Eliminar conversación"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })}
                {sessions.length === 0 && (
                  <div className="text-center py-8 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    No hay chats guardados
                  </div>
                )}
              </div>
            </div>

            {/* Área del Chat */}
            <div className="flex-1 flex flex-col h-full bg-white relative">
              <div className="px-6 py-4 border-b border-gray-100 shrink-0 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Image
                      src="/images/copi_notebook.png"
                      alt="Copi"
                      width={40}
                      height={40}
                      className="rounded-full ring-2 ring-primary/20"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 leading-tight">Copi</h2>
                    <p className="text-[10px] font-semibold text-gray-400">
                      {userMessagesCount} / 10 mensajes usados
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-slate-100/60 border border-gray-150/40 rounded-xl p-0.5 shrink-0">
                  <button
                    onClick={() => handleNetworkChange('general')}
                    className={cn(
                      'px-3 py-1 text-[10px] rounded-lg transition-all font-bold uppercase tracking-wider',
                      selectedNetwork === 'general'
                        ? 'bg-white text-primary shadow-xs'
                        : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    General
                  </button>
                  {ALL_NETWORKS.map((net) => {
                    const meta = NETWORK_META[net]
                    const isSelected = selectedNetwork === net
                    return (
                      <button
                        key={net}
                        onClick={() => handleNetworkChange(net)}
                        className={cn(
                          'p-1 rounded-lg transition-all flex items-center justify-center h-5 w-5',
                          isSelected
                            ? 'bg-white shadow-xs ring-1 ring-black/5'
                            : 'opacity-50 hover:opacity-85'
                        )}
                        title={`Trabajando en: ${meta.label}`}
                      >
                        <img src={meta.iconColor} alt={meta.label} className="w-3.5 h-3.5" />
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col min-h-0">
                {messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center max-w-lg mx-auto px-6 py-10 my-auto">
                    <Image
                      src="/images/copi_saludando.png"
                      alt="Copi saludando"
                      width={220}
                      height={220}
                      className="mb-6 object-contain hover:scale-105 transition-transform duration-300"
                    />
                    <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-[#00b4d8] bg-clip-text text-transparent mb-3">¡Hola, soy Copi!</h2>
                    <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                      Tu asistente de contenido para publi. Puedo ayudarte a generar ideas de posts,
                      escribir copy para Instagram, sugerir hashtags, recomendar horarios de
                      publicación y pensar tu estrategia de contenido. Todo desde un solo lugar.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 flex-1">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          'flex items-start gap-3',
                          msg.role === 'user' ? 'justify-end' : 'justify-start',
                        )}
                      >
                        {msg.role === 'assistant' && (
                          <div className="relative mt-0.5 shrink-0">
                            <Image
                              src="/images/copi_notebook.png"
                              alt="Copi"
                              width={36}
                              height={36}
                              className="rounded-full ring-2 ring-primary/10"
                            />
                          </div>
                        )}
                        <div
                          className={cn(
                            'max-w-[75%] px-4 py-2.5 text-xs leading-relaxed whitespace-pre-wrap shadow-xs',
                            msg.role === 'user'
                              ? 'rounded-2xl rounded-br-md text-white font-semibold bg-gradient-to-r from-primary to-[#00b4d8]'
                              : 'rounded-2xl rounded-bl-md border border-gray-100 text-gray-700 bg-white font-medium',
                          )}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex items-start gap-3 justify-start">
                        <div className="relative mt-0.5 shrink-0">
                          <Image
                            src="/images/copi_notebook.png"
                            alt="Copi"
                            width={36}
                            height={36}
                            className="rounded-full ring-2 ring-primary/10"
                          />
                        </div>
                        <div className="rounded-2xl rounded-bl-md border border-gray-100 bg-white px-4 py-3 flex items-center gap-1.5 shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:0ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:300ms]" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Sugerencias en chat vacío */}
              {messages.length === 0 && !isLoading && (
                <div className="px-6 pb-4 bg-white max-w-3xl mx-auto w-full shrink-0">
                  <div className="grid grid-cols-2 gap-2.5">
                    {SUGGESTIONS.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestionClick(s)}
                        className="text-left text-xs font-semibold leading-snug px-4 py-3 rounded-xl border border-gray-150/70 text-gray-600 bg-white transition-all duration-200 hover:border-primary hover:-translate-y-[1px] hover:shadow-xs hover:text-gray-900 cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Zona inferior: Entrada o bloqueo de límite */}
              <div className="border-t border-gray-100 bg-white px-5 py-4 shrink-0">
                {isLimitReached ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-amber-50/50 border border-amber-200/60 rounded-2xl max-w-3xl mx-auto">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                          Límite de mensajes alcanzado
                        </h4>
                        <p className="text-[11px] font-medium text-amber-700/90 mt-0.5">
                          Has enviado 10 mensajes en esta conversación. Para cuidar el uso del asistente, iniciá un nuevo chat.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={createNewSession}
                      className="shrink-0 bg-gradient-to-r from-primary to-[#00b4d8] text-white hover:opacity-95 shadow-sm font-bold text-xs px-4 py-2 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                    >
                      Nuevo chat
                    </button>
                  </div>
                ) : (
                  <div className="flex items-end gap-3 max-w-3xl mx-auto w-full border border-gray-250 bg-white rounded-2xl p-1.5 shadow-xs focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Preguntale algo a Copi..."
                      rows={1}
                      className="flex-1 resize-none bg-transparent px-3 py-2 text-xs font-semibold text-gray-800 placeholder:text-gray-400 outline-none"
                      style={{ maxHeight: '128px' }}
                    />
                    <button
                      onClick={() => sendMessage(input)}
                      disabled={!canSend}
                      className={cn(
                        'shrink-0 w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-205',
                        canSend
                          ? 'bg-gradient-to-r from-primary to-[#00b4d8] text-white hover:opacity-95 shadow-[0_2px_8px_rgba(0,149,182,0.25)] hover:scale-105 active:scale-95 cursor-pointer'
                          : 'bg-gray-100 text-gray-300 cursor-not-allowed opacity-60',
                      )}
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <ImageGenerator clientId={activeWorkspaceId} />
        )}
      </div>
    </div>
  )
}