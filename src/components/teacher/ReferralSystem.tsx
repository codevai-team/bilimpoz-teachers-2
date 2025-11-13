'use client'

import React, { useState } from 'react'
import { Icons } from '@/components/ui/Icons'
import Button from '@/components/ui/Button'

interface ReferralSystemProps {
  referralLink: string
  totalClicks: number
  totalRegistrations: number
  onCopyLink: () => void
  onInviteStudent: () => void
}

const ReferralSystem: React.FC<ReferralSystemProps> = ({
  referralLink,
  totalClicks,
  totalRegistrations,
  onCopyLink,
  onInviteStudent
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      onCopyLink()
      
      // Сбрасываем состояние через 2 секунды
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Ошибка копирования:', err)
    }
  }

  return (
    <div className="bg-[#151515] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Реферальная система
          </h3>
          <p className="text-gray-400">
            Приглашайте новых учеников и получайте бонусы
          </p>
        </div>
        <Button
          variant="primary"
          onClick={onInviteStudent}
        >
          <Icons.Plus className="h-4 w-4 mr-2" />
          Пригласить ученика
        </Button>
      </div>

      {/* Статистика реферальной системы */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#242424] rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Icons.MousePointer className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-medium text-gray-300">Переходы</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalClicks}</p>
        </div>

        <div className="bg-[#242424] rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Icons.UserPlus className="h-5 w-5 text-green-400" />
            <span className="text-sm font-medium text-gray-300">Регистрации</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalRegistrations}</p>
        </div>
      </div>

      {/* Реферальная ссылка */}
      <div className="bg-[#242424] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-white">Ваша реферальная ссылка</h4>
          <div className="flex items-center gap-2">
            <Icons.Link className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400">Поделитесь с учениками</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 bg-[#151515] rounded-lg px-4 py-3 border border-gray-700">
            <p className="text-sm text-gray-300 font-mono break-all">
              {referralLink}
            </p>
          </div>
          
          <Button
            variant={copied ? 'secondary' : 'outline'}
            size="sm"
            onClick={handleCopyLink}
            className="whitespace-nowrap"
          >
            {copied ? (
              <>
                <Icons.CheckCircle className="h-4 w-4 mr-2" />
                Скопировано
              </>
            ) : (
              <>
                <Icons.Copy className="h-4 w-4 mr-2" />
                Копировать
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Способы приглашения */}
      <div className="mt-6">
        <h4 className="font-medium text-white mb-4">Способы приглашения</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button className="flex items-center gap-3 p-3 bg-[#242424] rounded-lg hover:bg-[#363636] transition-colors group">
            <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20">
              <Icons.MessageCircle className="h-5 w-5 text-blue-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">Telegram</p>
              <p className="text-xs text-gray-400">Отправить в чат</p>
            </div>
          </button>

          <button className="flex items-center gap-3 p-3 bg-[#242424] rounded-lg hover:bg-[#363636] transition-colors group">
            <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20">
              <Icons.Phone className="h-5 w-5 text-green-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">WhatsApp</p>
              <p className="text-xs text-gray-400">Поделиться ссылкой</p>
            </div>
          </button>

          <button className="flex items-center gap-3 p-3 bg-[#242424] rounded-lg hover:bg-[#363636] transition-colors group">
            <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20">
              <Icons.Share2 className="h-5 w-5 text-purple-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">Другие</p>
              <p className="text-xs text-gray-400">Социальные сети</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReferralSystem

