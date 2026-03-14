'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import apiClient from '@/lib/api-client'
import { Notification } from '@/types'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await apiClient.getNotifications()
      // Extract the data array from paginated response
      const notificationsData = response.data?.data || response.data || []
      setNotifications(Array.isArray(notificationsData) ? notificationsData : [])
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications')
      setNotifications([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'all') return true
    // Convert filter value to match notification type format
    const filterType = filter.toUpperCase().replace(/-/g, '_')
    return notif.type === filterType
  })

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      'PAYMENT_DUE': '💰',
      'PAYMENT_OVERDUE': '⚠️',
      'CONTRACT_RENEWAL': '📝',
      'CONTRACT_EXPIRING': '⏰',
      'contract_renewal': '📝',
      'contract_activated': '✅',
      'contract_terminated': '❌',
    }
    return icons[type] || '📬'
  }

  const getNotificationColor = (type: string) => {
    const colors: Record<string, string> = {
      'PAYMENT_DUE': 'bg-yellow-50 border-yellow-200',
      'PAYMENT_OVERDUE': 'bg-red-50 border-red-200',
      'CONTRACT_RENEWAL': 'bg-blue-50 border-blue-200',
      'CONTRACT_EXPIRING': 'bg-orange-50 border-orange-200',
      'contract_renewal': 'bg-blue-50 border-blue-200',
      'contract_activated': 'bg-green-50 border-green-200',
      'contract_terminated': 'bg-red-50 border-red-200',
    }
    return colors[type] || 'bg-gray-50 border-gray-200'
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          <p className="text-gray-600">System notifications and reminders</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="bg-white rounded-lg shadow p-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="all">All Notifications</option>
            <option value="payment-due">Payment Due</option>
            <option value="payment-overdue">Payment Overdue</option>
            <option value="contract-renewal">Contract Renewal</option>
            <option value="contract-expiring">Contract Expiring</option>
          </select>
        </div>

        {/* Notifications Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
              <p className="mt-4 text-gray-600">Loading notifications...</p>
            </div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No notifications</p>
            <p className="text-gray-400 text-sm mt-2">You're all caught up!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow hover:shadow-lg p-6 border-l-4 transition-all ${getNotificationColor(notification.type)}`}
              >
                {/* Header with type and status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                    <h3 className="text-lg font-bold text-gray-900">
                      {notification.title}
                    </h3>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ml-2 ${
                      notification.isRead
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {notification.isRead ? 'Read' : 'New'}
                  </span>
                </div>

                {/* Message */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {notification.message}
                  </p>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs text-gray-600">
                  {notification.data?.contractNumber && (
                    <div>
                      <span className="font-semibold">Contract:</span> {notification.data.contractNumber}
                    </div>
                  )}
                  {notification.data?.tenantName && (
                    <div>
                      <span className="font-semibold">Tenant:</span> {notification.data.tenantName}
                    </div>
                  )}
                  {notification.data?.expiryDate && (
                    <div>
                      <span className="font-semibold">Expires:</span> {new Date(notification.data.expiryDate).toLocaleDateString()}
                    </div>
                  )}
                  <div>
                    <span className="font-semibold">Type:</span> {notification.type.replace(/_/g, ' ')}
                  </div>
                  <div className="pt-2 text-gray-500">
                    {new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && filteredNotifications.length > 0 && (
          <div className="text-sm text-gray-600">
            Showing {filteredNotifications.length} of {notifications.length} notifications
          </div>
        )}

        {/* Notification Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">
            📧 System Notifications
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              • <strong>Contract Renewal:</strong> Alerts when contracts are expiring soon
            </p>
            <p>
              • <strong>Payment Due:</strong> Reminders for upcoming payments
            </p>
            <p>
              • <strong>Payment Overdue:</strong> Alerts for overdue payments
            </p>
            <p>
              • <strong>Contract Status:</strong> Updates on contract activation/termination
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
