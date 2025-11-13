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
      {/* Fixed Container with Header and Content */}
      <div className="fixed inset-0 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 pb-0 flex-shrink-0">
          <Header onMenuToggle={handleMenuToggle} />
        </div>

        {/* Main Container with Sidebar and Content */}
        <div className="flex-1 flex overflow-hidden pt-4 gap-4">
          {/* Sidebar */}
          <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

export default TeacherLayout
