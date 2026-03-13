'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import apiClient from '@/lib/api-client'
import { Notification } from '@/types'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const data = await apiClient.getNotifications()
      setNotifications(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications')
      setNotifications([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredNotifications = Array.isArray(notifications) ? notifications.filter((notif) => {
    if (filter === 'all') return true
    return notif.type === filter.toUpperCase().replace(/-/g, '_')
  }) : []

  const getNotificationIcon = (type: string) => {
    const icons = {
      PAYMENT_DUE: '💰',
      PAYMENT_OVERDUE: '⚠️',
      CONTRACT_RENEWAL: '📝',
      CONTRACT_EXPIRING: '⏰',
    }
    return icons[type as keyof typeof icons] || '📬'
  }

  const getNotificationColor = (type: string) => {
    const colors = {
      PAYMENT_DUE: 'bg-yellow-50 border-yellow-200',
      PAYMENT_OVERDUE: 'bg-red-50 border-red-200',
      CONTRACT_RENEWAL: 'bg-blue-50 border-blue-200',
      CONTRACT_EXPIRING: 'bg-orange-50 border-orange-200',
    }
    return colors[type as keyof typeof colors] || 'bg-gray-50 border-gray-200'
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
                className="bg-white rounded-lg shadow hover:shadow-lg p-6 border-l-4 border-blue-600 transition-all"
              >
                {/* Header with type and status */}
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-bold text-blue-600 flex-1">
                    {notification.subject}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ml-2 ${
                      notification.status === 'SENT'
                        ? 'bg-green-100 text-green-800'
                        : notification.status === 'FAILED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {notification.status}
                  </span>
                </div>

                {/* Message */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-700">
                    {notification.message}
                  </p>
                </div>

                {/* Contract & Date */}
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Contract</div>
                    <div className="text-sm font-medium text-gray-900">
                      {notification.contract?.contractNumber || 'N/A'}
                    </div>
                  </div>
                  {notification.sentDate && (
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Sent</div>
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(notification.sentDate).toLocaleString()}
                      </div>
                    </div>
                  )}
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
            📧 Automated Email Notifications
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              • <strong>Payment Due:</strong> Sent 7 days before payment due date
            </p>
            <p>
              • <strong>Payment Overdue:</strong> Sent when payment is delayed
            </p>
            <p>
              • <strong>Contract Expiring:</strong> Sent 30 days before contract expiration
            </p>
            <p>
              • <strong>Contract Renewal:</strong> Reminders for contract renewal process
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
