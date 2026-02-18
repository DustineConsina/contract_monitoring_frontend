'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import apiClient from '@/lib/api-client'
import { DashboardStats } from '@/types'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const data = await apiClient.getDashboardStats()
      setStats(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard statistics')
      console.error('Dashboard stats error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-600">Welcome to the PFDA Contract Monitoring System</p>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Contracts"
            value={stats?.totalContracts || 0}
            icon="📄"
            color="bg-blue-500"
            link="/dashboard/contracts"
          />
          <StatsCard
            title="Active Contracts"
            value={stats?.activeContracts || 0}
            icon="✅"
            color="bg-green-500"
            link="/dashboard/contracts?status=active"
          />
          <StatsCard
            title="Expired Contracts"
            value={stats?.expiredContracts || 0}
            icon="⏰"
            color="bg-orange-500"
            link="/dashboard/contracts?status=expired"
          />
          <StatsCard
            title="Delinquent Contracts"
            value={stats?.delinquentContracts || 0}
            icon="⚠️"
            color="bg-red-500"
            link="/dashboard/contracts?status=delinquent"
          />
        </div>

        {/* Revenue & Spaces */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatsCard
            title="Total Revenue"
            value={`₱${(stats?.totalRevenue || 0).toLocaleString()}`}
            icon="💰"
            color="bg-purple-500"
          />
          <StatsCard
            title="Pending Payments"
            value={stats?.pendingPayments || 0}
            icon="📋"
            color="bg-yellow-500"
            link="/dashboard/payments?status=pending"
          />
          <StatsCard
            title="Available Spaces"
            value={`${stats?.availableSpaces || 0} / ${
              (stats?.availableSpaces || 0) + (stats?.occupiedSpaces || 0)
            }`}
            icon="🏢"
            color="bg-cyan-500"
            link="/dashboard/spaces"
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Payments */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
              <Link
                href="/dashboard/payments"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View All →
              </Link>
            </div>
            {stats?.recentPayments && stats.recentPayments.length > 0 ? (
              <div className="space-y-3">
                {stats.recentPayments.slice(0, 5).map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <div className="font-medium text-sm text-gray-900">
                        {payment.paymentFor}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-green-600">
                      ₱{payment.totalAmount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                No recent payments
              </p>
            )}
          </div>

          {/* Expiring Contracts */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Expiring Soon
              </h3>
              <Link
                href="/dashboard/contracts"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View All →
              </Link>
            </div>
            {stats?.expiringContracts && stats.expiringContracts.length > 0 ? (
              <div className="space-y-3">
                {stats.expiringContracts.slice(0, 5).map((contract) => (
                  <div
                    key={contract.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <div className="font-medium text-sm text-gray-900">
                        {contract.contractNumber}
                      </div>
                      <div className="text-xs text-gray-500">
                        {contract.rentalSpace?.spaceNumber}
                      </div>
                    </div>
                    <div className="text-xs font-medium text-orange-600">
                      Expires: {new Date(contract.endDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                No expiring contracts
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionButton
              href="/dashboard/contracts/new"
              icon="➕"
              label="New Contract"
            />
            <QuickActionButton
              href="/dashboard/payments/new"
              icon="💵"
              label="Record Payment"
            />
            <QuickActionButton
              href="/dashboard/tenants/new"
              icon="👤"
              label="Add Tenant"
            />
            <QuickActionButton
              href="/dashboard/reports"
              icon="📊"
              label="Generate Report"
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

function StatsCard({
  title,
  value,
  icon,
  color,
  link,
}: {
  title: string
  value: string | number
  icon: string
  color: string
  link?: string
}) {
  const content = (
    <div className={`${color} rounded-lg shadow-lg p-6 text-white`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90 mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="text-4xl opacity-80">{icon}</div>
      </div>
    </div>
  )

  if (link) {
    return (
      <Link href={link} className="block hover:scale-105 transition-transform">
        {content}
      </Link>
    )
  }

  return content
}

function QuickActionButton({
  href,
  icon,
  label,
}: {
  href: string
  icon: string
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
    >
      <span className="text-3xl mb-2">{icon}</span>
      <span className="text-sm font-medium text-gray-700 text-center">
        {label}
      </span>
    </Link>
  )
}
