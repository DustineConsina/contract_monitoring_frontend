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

  // Different navigation based on user role
  let navigation = []
  
  if (user?.role && user.role.toUpperCase() === 'CASHIER') {
    // Cashier-specific navigation
    navigation = [
      { name: 'Collection Dashboard', href: '/dashboard/cashier' },
      { name: 'Payments', href: '/dashboard/payments' },
      { name: 'Messages', href: '/dashboard/messages' },
      { name: 'Notifications', href: '/dashboard/notifications' },
    ]
  } else if (user?.role && (user.role.toUpperCase() === 'ADMIN' || user.role.toUpperCase() === 'STAFF')) {
    // Admin/Staff navigation
    navigation = [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Contracts', href: '/dashboard/contracts' },
      { name: 'Payments', href: '/dashboard/payments' },
      { name: 'Tenants', href: '/dashboard/tenants' },
      { name: 'Rental Spaces', href: '/dashboard/spaces' },
      { name: 'Messages', href: '/dashboard/messages' },
      { name: 'Reports', href: '/dashboard/reports' },
      { name: 'Notifications', href: '/dashboard/notifications' },
      { name: 'Audit Logs', href: '/dashboard/audit-logs' },
    ]
  } else {
    // Tenant navigation
    navigation = [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'My Contracts', href: '/dashboard/contracts' },
      { name: 'Payments', href: '/dashboard/payments' },
      { name: 'Messages', href: '/dashboard/messages' },
      { name: 'Notifications', href: '/dashboard/notifications' },
    ]
  }

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-20 px-4 border-b border-gray-700/50">
            <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                <span className="text-white text-xl font-bold">P</span>
              </div>
              <div className="text-sm">
                <div className="font-bold text-base">PFDA</div>
                <div className="text-xs text-gray-400">Contracts</div>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-8 px-3">
            <div className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                    }`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <span className="font-medium">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* User Info */}
          <div className="border-t border-gray-700/50 p-4 bg-gray-800/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm shadow-md">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-gray-400 truncate capitalize">{user?.role}</div>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="w-full px-4 py-2 text-sm font-medium bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-100 h-16 flex items-center px-4 lg:px-8 shadow-sm">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden mr-4 text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-colors"
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
            <h1 className="text-lg font-bold text-gray-900">
              PFDA Contract Monitoring System
            </h1>
            <p className="text-xs text-gray-500 font-medium">Bulan, Sorsogon Fish Port</p>
          </div>
          <div className="text-sm font-semibold text-gray-700 bg-gray-50 px-4 py-2 rounded-lg">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50">{children}</main>
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
