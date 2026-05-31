'use client'

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react'
import Image from 'next/image'
import { Send, Plus, Trash2, MessageSquare, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/use-app-store'

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
}

const SUGGESTIONS = [
  'Generame ideas para 3 posts de Instagram esta semana',
  'Escribime un copy para anunciar un producto nuevo',
  '¿Qué hashtags uso para llegar a más gente?',
  '¿Cuál es el mejor horario para publicar?',
  'Dame una estrategia de contenido para el mes',
  'Reescribí este texto con tono más dinámico: [tu texto]',
]

const INITIAL_MESSAGE_CONTENT =
  '¡Hola! Soy Copi, tu asistente de publi. Puedo ayudarte con ideas de contenido, copy para Instagram, hashtags, horarios de publicación y estrategia. ¿Con qué empezamos?'

const STORAGE_KEY = 'publi_ai_chat_sessions'

export default function AiPage() {
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId)
  
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

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

  const createNewSession = useCallback(() => {
    const newSessionId = `session-${Date.now()}`
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'Nueva conversación',
      messages: [],
      createdAt: Date.now(),
    }
    const updated = [newSession, ...sessions]
    saveSessions(updated)
    setActiveSessionId(newSessionId)
    setInput('')
  }, [sessions, saveSessions])

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
    [isLoading, isLimitReached, activeSessionId, activeSession, messages, sessions, saveSessions, userMessagesCount, activeWorkspaceId],
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
    <div className="flex h-[calc(100vh-7rem)] bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Sidebar de Chats */}
      <div className="w-64 shrink-0 border-r border-gray-100 bg-[#fbf9f6] flex flex-col h-full">
        <div className="p-4 border-b border-gray-100">
          <button
            onClick={createNewSession}
            className="w-full flex items-center justify-center gap-2 bg-[#0095b6] text-white rounded-lg py-2.5 px-4 text-sm font-semibold transition-opacity hover:opacity-90 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nueva conversación
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
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
                  'group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer text-sm transition-colors relative',
                  isActive
                    ? 'bg-[#cceef5] text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-6">
                  <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                  <span className="truncate">{session.title}</span>
                </div>
                <button
                  onClick={(e) => deleteSession(session.id, e)}
                  className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200/50 text-gray-400 hover:text-red-500 transition-opacity"
                  title="Eliminar conversación"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
          {sessions.length === 0 && (
            <div className="text-center py-8 text-xs text-gray-400">
              No hay chats guardados
            </div>
          )}
        </div>
      </div>

      {/* Área del Chat */}
      <div className="flex-1 flex flex-col h-full bg-white relative">
        <div className="px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <Image
              src="/images/copi_notebook.png"
              alt="Copi"
              width={40}
              height={40}
              className="rounded-full"
            />
            <div>
              <h1 className="text-base font-semibold text-gray-900">Copi</h1>
              <p className="text-xs text-gray-500">
                {userMessagesCount} / 10 mensajes usados en este chat
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col min-h-0">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-lg mx-auto px-6 py-10 my-auto">
              <Image
                src="/images/copi_saludando.png"
                alt="Copi saludando"
                width={260}
                height={260}
                className="mb-6 object-contain"
              />
              <h2 className="text-2xl font-bold text-[#0095b6] mb-3">¡Hola, soy Copi!</h2>
              <p className="text-[15px] text-gray-600 leading-relaxed">
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
                    <Image
                      src="/images/copi_notebook.png"
                      alt="Copi"
                      width={36}
                      height={36}
                      className="rounded-full shrink-0 mt-0.5"
                    />
                  )}
                  <div
                    className={cn(
                      'max-w-[75%] px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap',
                      msg.role === 'user'
                        ? 'rounded-2xl rounded-br-md text-white'
                        : 'rounded-2xl rounded-bl-md border border-gray-100 text-gray-700 bg-white shadow-sm',
                    )}
                    style={
                      msg.role === 'user' ? { backgroundColor: '#0095b6' } : undefined
                    }
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start gap-3 justify-start">
                  <Image
                    src="/images/copi_notebook.png"
                    alt="Copi"
                    width={36}
                    height={36}
                    className="rounded-full shrink-0 mt-0.5"
                  />
                  <div className="rounded-2xl rounded-bl-md border border-gray-100 bg-white px-4 py-3 flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-[#0095b6]/60 animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 rounded-full bg-[#0095b6]/60 animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 rounded-full bg-[#0095b6]/60 animate-bounce [animation-delay:300ms]" />
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
                  className="text-left text-xs leading-snug px-4 py-3 rounded-lg border border-gray-200 text-gray-600 transition-colors hover:border-[#0095b6] hover:bg-[#cceef5] hover:text-gray-900"
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-amber-50 border border-amber-200 rounded-lg max-w-3xl mx-auto">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-900">
                    Límite de mensajes alcanzado
                  </h4>
                  <p className="text-xs text-amber-700">
                    Has enviado 10 mensajes en esta conversación. Para cuidar el uso del asistente, iniciá un nuevo chat.
                  </p>
                </div>
              </div>
              <button
                onClick={createNewSession}
                className="shrink-0 bg-[#0095b6] text-white hover:opacity-90 transition-opacity font-semibold text-xs px-4 py-2 rounded-md shadow-sm"
              >
                Nuevo chat
              </button>
            </div>
          ) : (
            <div className="flex items-end gap-3 max-w-3xl mx-auto w-full">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Preguntale algo a Copi..."
                rows={1}
                className="flex-1 resize-none rounded-lg border border-gray-200 px-4 py-3 text-[15px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#0095b6] focus:ring-1 focus:ring-[#0095b6]/30 transition-colors"
                style={{ maxHeight: '128px' }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!canSend}
                className={cn(
                  'shrink-0 w-11 h-11 flex items-center justify-center rounded-lg transition-colors',
                  canSend
                    ? 'hover:bg-[#cceef5] cursor-pointer'
                    : 'opacity-40 cursor-not-allowed',
                )}
              >
                <Send className="w-5 h-5" style={{ color: '#0095b6' }} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}