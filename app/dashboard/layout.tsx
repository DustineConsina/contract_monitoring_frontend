'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Contracts', href: '/dashboard/contracts', icon: '📄' },
    { name: 'Payments', href: '/dashboard/payments', icon: '💰' },
    { name: 'Tenants', href: '/dashboard/tenants', icon: '👥' },
    { name: 'Rental Spaces', href: '/dashboard/spaces', icon: '🏢' },
    { name: 'Messages', href: '/dashboard/messages', icon: '💬' },
    { name: 'Reports', href: '/dashboard/reports', icon: '📈' },
    { name: 'Notifications', href: '/dashboard/notifications', icon: '🔔' },
  ]

  if (user?.role === 'ADMIN' || user?.role === 'STAFF') {
    navigation.push({ name: 'Audit Logs', href: '/dashboard/audit-logs', icon: '📋' })
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-blue-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 bg-blue-950 px-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-blue-900 text-xl font-bold">P</span>
              </div>
              <div className="text-sm">
                <div className="font-bold">PFDA</div>
                <div className="text-xs text-blue-200">Contract System</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-800 border-l-4 border-white font-medium'
                      : 'hover:bg-blue-800 border-l-4 border-transparent'
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Info */}
          <div className="border-t border-blue-800 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center">
                <span className="text-lg">👤</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-blue-200 truncate">{user?.role}</div>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="w-full px-4 py-2 text-sm bg-blue-800 hover:bg-blue-700 rounded transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm h-16 flex items-center px-4 lg:px-6">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden mr-4 text-gray-600 hover:text-gray-900"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900">
              PFDA Contract Monitoring System
            </h1>
            <p className="text-xs text-gray-500">Bulan, Sorsogon Fish Port</p>
          </div>
          <div className="text-sm text-gray-600">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  )
}
