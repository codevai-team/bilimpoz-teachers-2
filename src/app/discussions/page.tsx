'use client'

import React, { useState, useEffect } from 'react'
import TeacherLayout from '@/components/teacher/TeacherLayout'
import StatCard from '@/components/teacher/StatCard'
import DiscussionCard from '@/components/teacher/DiscussionCard'
import ChatModal from '@/components/teacher/ChatModal'
import { Icons } from '@/components/ui/Icons'
import { useTranslation } from '@/hooks/useTranslation'

// Моковые данные
const mockDiscussions = [
  {
    id: '1',
    name: 'Урок 5: Квадратные уравнения',
    student: 'Айжан Мамбетова',
    messageCount: 12,
    lastMessage: 'Спасибо за объяснение! Теперь понятно как решать через дискриминант.',
    lastMessageTime: '2024-11-12T15:30:00Z',
    status: 'active' as const,
    unreadCount: 2,
  },
  {
    id: '2',
    name: 'Урок 3: Производные функций',
    student: 'Бекжан Токтогулов',
    messageCount: 8,
    lastMessage: 'Можете еще раз объяснить правило произведения?',
    lastMessageTime: '2024-11-12T10:15:00Z',
    status: 'active' as const,
    unreadCount: 1,
  },
  {
    id: '3',
    name: 'Урок 1: Основы алгебры',
    student: 'Гульнара Асанова',
    messageCount: 15,
    lastMessage: 'Все понятно, спасибо за урок!',
    lastMessageTime: '2024-11-10T14:20:00Z',
    status: 'closed' as const,
  },
]

const mockMessages = [
  {
    id: '1',
    text: 'Здравствуйте! У меня вопрос по квадратным уравнениям.',
    companion: 'student' as const,
    timestamp: '2024-11-12T14:00:00Z',
  },
  {
    id: '2',
    text: 'Здравствуйте! Конечно, задавайте вопрос.',
    companion: 'teacher' as const,
    timestamp: '2024-11-12T14:05:00Z',
  },
  {
    id: '3',
    text: 'Как решить уравнение x² + 5x + 6 = 0? Не понимаю как найти корни.',
    companion: 'student' as const,
    timestamp: '2024-11-12T14:10:00Z',
  },
  {
    id: '4',
    text: 'Это уравнение можно решить несколькими способами. Попробуем через разложение на множители. Нужно найти два числа, которые в произведении дают 6, а в сумме 5.',
    companion: 'teacher' as const,
    timestamp: '2024-11-12T14:15:00Z',
  },
  {
    id: '5',
    text: 'Это числа 2 и 3! Значит (x + 2)(x + 3) = 0?',
    companion: 'student' as const,
    timestamp: '2024-11-12T14:20:00Z',
  },
  {
    id: '6',
    text: 'Совершенно верно! Теперь каждый множитель приравниваем к нулю: x + 2 = 0 или x + 3 = 0. Отсюда x = -2 или x = -3.',
    companion: 'teacher' as const,
    timestamp: '2024-11-12T14:25:00Z',
  },
]

export default function DiscussionsPage() {
  const { t, ready } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const [discussions, setDiscussions] = useState(mockDiscussions)
  const [selectedDiscussion, setSelectedDiscussion] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState(mockMessages)
  const [isChatOpen, setIsChatOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const getText = (key: string, fallback: string) => {
    if (!mounted || !ready) return fallback
    return t(key)
  }

  // Статистика
  const stats = {
    total: discussions.length,
    active: discussions.filter(d => d.status === 'active').length,
    closed: discussions.filter(d => d.status === 'closed').length,
    unread: discussions.reduce((sum, d) => sum + (d.unreadCount || 0), 0),
  }

  const handleOpenChat = (discussionId: string) => {
    setSelectedDiscussion(discussionId)
    setIsChatOpen(true)
    
    // Сбрасываем счетчик непрочитанных сообщений
    setDiscussions(prev =>
      prev.map(d =>
        d.id === discussionId
          ? { ...d, unreadCount: 0 }
          : d
      )
    )
  }

  const handleCloseChat = () => {
    setIsChatOpen(false)
    setSelectedDiscussion(null)
  }

  const handleSendMessage = (message: string) => {
    const newMessage = {
      id: Date.now().toString(),
      text: message,
      companion: 'teacher' as const,
      timestamp: new Date().toISOString(),
    }
    
    setChatMessages(prev => [...prev, newMessage])
    
    // Обновляем последнее сообщение в обсуждении
    setDiscussions(prev =>
      prev.map(d =>
        d.id === selectedDiscussion
          ? {
              ...d,
              lastMessage: message,
              lastMessageTime: new Date().toISOString(),
              messageCount: d.messageCount + 1,
            }
          : d
      )
    )
  }

  const handleCloseDiscussion = (discussionId: string) => {
    setDiscussions(prev =>
      prev.map(d =>
        d.id === discussionId
          ? { ...d, status: 'closed' as const }
          : d
      )
    )
  }

  const handleSummarize = (discussionId: string) => {
    console.log('Суммировать обсуждение:', discussionId)
    // Здесь можно реализовать AI суммаризацию
  }

  const selectedDiscussionData = discussions.find(d => d.id === selectedDiscussion)

  if (!mounted || !ready) {
    return (
      <TeacherLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Обсуждения</h1>
            <p className="text-gray-400">Загрузка...</p>
          </div>
        </div>
      </TeacherLayout>
    )
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Заголовок страницы */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {t('discussions.title')}
          </h1>
          <p className="text-gray-400">
            {t('discussions.description')}
          </p>
        </div>

        {/* Статистические карточки */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title={t('discussions.stats.total')}
            value={stats.total}
            icon={Icons.MessageCircle}
          />
          <StatCard
            title={t('discussions.stats.active')}
            value={stats.active}
            icon={Icons.Activity}
          />
          <StatCard
            title={t('discussions.stats.closed')}
            value={stats.closed}
            icon={Icons.CheckCircle}
          />
          <StatCard
            title={t('discussions.stats.unread')}
            value={stats.unread}
            icon={Icons.Bell}
            onClick={() => console.log('Показать непрочитанные')}
          />
        </div>

        {/* Фильтры */}
        <div className="bg-[#151515] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">{t('discussions.filters.title')}</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button className="px-4 py-2 rounded-xl text-sm font-medium bg-[#363636] text-white border border-white">
              {t('discussions.filters.all')}
            </button>
            <button className="px-4 py-2 rounded-xl text-sm font-medium bg-[#242424] text-gray-400 border border-gray-700/50 hover:text-white hover:bg-[#363636] transition-all">
              {t('discussions.filters.active')}
            </button>
            <button className="px-4 py-2 rounded-xl text-sm font-medium bg-[#242424] text-gray-400 border border-gray-700/50 hover:text-white hover:bg-[#363636] transition-all">
              {t('discussions.filters.closed')}
            </button>
            <button className="px-4 py-2 rounded-xl text-sm font-medium bg-[#242424] text-gray-400 border border-gray-700/50 hover:text-white hover:bg-[#363636] transition-all">
              {t('discussions.filters.withUnread')}
            </button>
          </div>
        </div>

        {/* Список обсуждений */}
        <div className="space-y-4">
          {discussions.length === 0 ? (
            <div className="bg-[#151515] rounded-2xl p-12 text-center">
              <Icons.MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                {t('discussions.empty.title')}
              </h3>
              <p className="text-gray-400">
                {t('discussions.empty.description')}
              </p>
            </div>
          ) : (
            discussions.map((discussion) => (
              <DiscussionCard
                key={discussion.id}
                discussion={discussion}
                onOpenChat={handleOpenChat}
                onCloseDiscussion={handleCloseDiscussion}
                onSummarize={handleSummarize}
              />
            ))
          )}
        </div>

        {/* Модальное окно чата */}
        <ChatModal
          isOpen={isChatOpen}
          onClose={handleCloseChat}
          discussionName={selectedDiscussionData?.name || ''}
          studentName={selectedDiscussionData?.student || ''}
          messages={chatMessages}
          onSendMessage={handleSendMessage}
        />
      </div>
    </TeacherLayout>
  )
}






