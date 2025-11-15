'use client'

import React, { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

interface TeacherLayoutProps {
  children: React.ReactNode
}

const TeacherLayout: React.FC<TeacherLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const handleSidebarClose = () => {
    setIsSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="p-4 pb-0">
        <Header onMenuToggle={handleMenuToggle} />
      </div>

      {/* Main Container with Sidebar and Content */}
      <div className="flex h-[calc(100vh-5rem)] p-4 pt-0 gap-4">
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-[#151515] rounded-2xl p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default TeacherLayout
