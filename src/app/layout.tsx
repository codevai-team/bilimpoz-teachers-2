import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { AuthProviderWrapper } from '@/components/providers/AuthProviderWrapper'
import I18nProvider from '@/components/providers/I18nProvider'

export const metadata: Metadata = {
  title: 'Bilimpoz Teacher',
  description: 'Сервис для преподавателей Bilimpoz',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased">
        <I18nProvider>
          <AuthProviderWrapper>
            {children}
          </AuthProviderWrapper>
        </I18nProvider>
      </body>
    </html>
  )
}

