'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Icons } from '@/components/ui/Icons'
import Button from '@/components/ui/Button'
import { useTranslation } from '@/hooks/useTranslation'

interface ChatMessage {
  id: string
  text: string
  companion: 'student' | 'teacher'
  timestamp: string
}

interface ChatModalProps {
  isOpen: boolean
  onClose: () => void
  discussionName: string
  studentName: string
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
}

const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  discussionName,
  studentName,
  messages,
  onSendMessage
}) => {
  const { t, ready } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const getText = (key: string, fallback: string) => {
    if (!mounted || !ready) return fallback
    return t(key)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
      textareaRef.current?.focus()
    }
  }, [isOpen, messages])

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim())
      setNewMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#151515] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">{discussionName}</h2>
            <p className="text-sm text-gray-400">{getText('discussions.chat.chatWith', 'Чат с')} {studentName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
          >
            <Icons.X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Сообщения */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 modal-content">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Icons.MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-400">{getText('discussions.chat.noMessages', 'Пока нет сообщений')}</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.companion === 'teacher' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    message.companion === 'teacher'
                      ? 'bg-white text-black'
                      : 'bg-[#242424] text-white'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-2 ${
                    message.companion === 'teacher' ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Поле ввода */}
        <div className="p-6 border-t border-gray-700">
          <div className="flex gap-3">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={getText('discussions.chat.enterMessage', 'Введите сообщение...')}
              rows={3}
              className="flex-1 px-4 py-3 bg-[#242424] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
            />
            <Button
              variant="primary"
              onClick={handleSend}
              disabled={!newMessage.trim()}
              className="self-end"
            >
              <Icons.Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {getText('discussions.chat.sendHint', 'Нажмите Enter для отправки, Shift+Enter для новой строки')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ChatModal






