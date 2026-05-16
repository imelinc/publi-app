'use client'

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react'
import Image from 'next/image'
import { Send } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
  id: string
}

const SUGGESTIONS = [
  'Generame ideas para 3 posts de Instagram esta semana',
  'Escribime un copy para anunciar un producto nuevo',
  '¿Qué hashtags uso para llegar a más gente?',
  '¿Cuál es el mejor horario para publicar?',
  'Dame una estrategia de contenido para el mes',
  'Reescribí este texto con tono más dinámico: [tu texto]',
]

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content:
    '¡Hola! Soy Copi, tu asistente de publi. Puedo ayudarte con ideas de contenido, copy para Instagram, hashtags, horarios de publicación y estrategia. ¿Con qué empezamos?',
  id: 'initial',
}

export default function AiPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [started, setStarted] = useState(false)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading) return

      const userMsg: Message = {
        role: 'user',
        content: trimmed,
        id: `user-${Date.now()}`,
      }

      const updatedHistory = [...messages, userMsg]
      setMessages(updatedHistory)
      setInput('')
      setIsLoading(true)

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            clientId: null,
            history: updatedHistory.map(({ role, content }) => ({ role, content })),
          }),
        })

        if (!res.ok) throw new Error('fetch failed')

        const data = await res.json()
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.reply ?? data.content ?? 'No obtuve una respuesta.',
            id: `assistant-${Date.now()}`,
          },
        ])
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Hubo un error al conectarme. Intentá de nuevo.',
            id: `error-${Date.now()}`,
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, messages],
  )

  const handleStart = () => {
    setStarted(true)
    setMessages([INITIAL_MESSAGE])
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (isLoading) return
    setInput(suggestion)
    sendMessage(suggestion)
  }

  const canSend = input.trim().length > 0 && !isLoading

  if (!started) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-7rem)] bg-[#f5f0e8]">
        <div className="flex flex-col items-center gap-8 max-w-lg text-center px-6">
          <Image
            src="/images/copi_saludando.png"
            alt="Copi saludando"
            width={240}
            height={240}
          />
          <h1 className="text-4xl font-bold text-[#0095b6]">Hola, soy Copi</h1>
          <p className="text-base text-gray-600 leading-relaxed">
            Tu asistente de contenido para publi. Puedo ayudarte a generar ideas de posts,
            escribir copy para Instagram, sugerir hashtags, recomendar horarios de
            publicación y pensar tu estrategia de contenido. Todo desde un solo lugar.
          </p>
          <button
            onClick={handleStart}
            className="bg-[#0095b6] text-white rounded-lg px-10 py-4 text-lg font-semibold transition-opacity hover:opacity-90"
          >
            Empezar a chatear
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] bg-white rounded-xl border border-gray-100">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Image src="/images/copi_notebook.png" alt="Copi" width={48} height={48} className="rounded-full" />
          <h1 className="text-lg font-semibold text-gray-900">Copi</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
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
                width={40}
                height={40}
                className="rounded-full shrink-0 mt-1"
              />
            )}
            <div
              className={cn(
                'max-w-[75%] px-5 py-3 text-[15px] leading-relaxed whitespace-pre-wrap',
                msg.role === 'user'
                  ? 'rounded-2xl rounded-br-md text-white'
                  : 'rounded-2xl rounded-bl-md border border-gray-100 text-gray-700 bg-white',
              )}
              style={
                msg.role === 'user' ? { backgroundColor: '#0095b6' } : undefined
              }
            >
              {msg.content}
            </div>
          </div>
        ))}

        {messages.length === 1 && !isLoading && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(s)}
                className="text-left text-sm leading-snug px-4 py-3 rounded-lg border border-gray-200 text-gray-600 transition-colors hover:border-[#0095b6] hover:bg-[#cceef5] hover:text-gray-900"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="flex items-start gap-3 justify-start">
            <Image
              src="/images/copi_notebook.png"
              alt="Copi"
              width={40}
              height={40}
              className="rounded-full shrink-0 mt-1"
            />
            <div className="rounded-2xl rounded-bl-md border border-gray-100 bg-white px-5 py-4 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-100 bg-white px-5 py-4">
        <div className="flex items-end gap-3">
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
      </div>
    </div>
  )
}