'use client'

import { useEffect, useState } from 'react'

interface User {
  id: string
  name: string
  login: string
  role: string
  status: string
  telegram_id: string | null
  created_at: string
}

export default function DebugUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/debug/users')
      const data = await response.json()
      
      if (response.ok) {
        setUsers(data.users)
      } else {
        setError(data.error || 'Ошибка загрузки пользователей')
      }
    } catch (err) {
      setError('Ошибка сети')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-white">Загрузка...</div>
  if (error) return <div className="p-8 text-red-400">Ошибка: {error}</div>

  return (
    <div className="p-8 bg-[#0b0b0b] min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">Пользователи в системе</h1>
      
      <div className="bg-[#151515] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#1a1a1a]">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Имя</th>
              <th className="px-4 py-3 text-left">Логин</th>
              <th className="px-4 py-3 text-left">Роль</th>
              <th className="px-4 py-3 text-left">Статус</th>
              <th className="px-4 py-3 text-left">Telegram ID</th>
              <th className="px-4 py-3 text-left">Создан</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-gray-700">
                <td className="px-4 py-3 font-mono text-sm">{user.id.slice(0, 8)}...</td>
                <td className="px-4 py-3">{user.name}</td>
                <td className="px-4 py-3 font-mono">{user.login}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                    user.role === 'teacher' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    user.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    user.status === 'registered' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-sm">
                  {user.telegram_id || 'Не указан'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">
                  {new Date(user.created_at).toLocaleDateString('ru-RU')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {users.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          Пользователи не найдены
        </div>
      )}
    </div>
  )
}


