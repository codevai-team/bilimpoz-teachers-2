'use client'

import React from 'react'
import { Icons } from '@/components/ui/Icons'
import Button from '@/components/ui/Button'

interface Discussion {
  id: string
  name: string
  student: string
  messageCount: number
  lastMessage: string
  lastMessageTime: string
  status: 'active' | 'closed'
  unreadCount?: number
}

interface DiscussionCardProps {
  discussion: Discussion
  onOpenChat: (discussionId: string) => void
  onCloseDiscussion: (discussionId: string) => void
  onSummarize: (discussionId: string) => void
}

const DiscussionCard: React.FC<DiscussionCardProps> = ({
  discussion,
  onOpenChat,
  onCloseDiscussion,
  onSummarize
}) => {
  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Только что'
    } else if (diffInHours < 24) {
      return `${diffInHours} ч назад`
    } else {
      return date.toLocaleDateString('ru-RU')
    }
  }

  return (
    <div className="bg-[#151515] rounded-2xl p-6 hover:bg-[#1a1a1a] transition-colors">
      {/* Заголовок */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-white">{discussion.name}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              discussion.status === 'active' 
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
            }`}>
              {discussion.status === 'active' ? 'Активное' : 'Закрытое'}
            </span>
            {discussion.unreadCount && discussion.unreadCount > 0 && (
              <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-medium">
                {discussion.unreadCount}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
            <Icons.User className="h-4 w-4" />
            <span>Ученик: {discussion.student}</span>
            <span>•</span>
            <Icons.MessageCircle className="h-4 w-4" />
            <span>{discussion.messageCount} сообщений</span>
          </div>
        </div>
      </div>

      {/* Последнее сообщение */}
      <div className="mb-4 p-3 bg-[#242424] rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">Последнее сообщение</span>
          <span className="text-xs text-gray-400">{formatTime(discussion.lastMessageTime)}</span>
        </div>
        <p className="text-sm text-gray-300 line-clamp-2">
          {discussion.lastMessage}
        </p>
      </div>

      {/* Действия */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="primary"
          size="sm"
          onClick={() => onOpenChat(discussion.id)}
        >
          <Icons.MessageCircle className="h-4 w-4 mr-2" />
          Открыть чат
        </Button>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onSummarize(discussion.id)}
        >
          <Icons.FileText className="h-4 w-4 mr-2" />
          Суммировать
        </Button>

        {discussion.status === 'active' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCloseDiscussion(discussion.id)}
          >
            <Icons.X className="h-4 w-4 mr-2" />
            Закрыть
          </Button>
        )}
      </div>
    </div>
  )
}

export default DiscussionCard



