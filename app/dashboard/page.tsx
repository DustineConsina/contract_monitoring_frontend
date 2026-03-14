'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import apiClient from '@/lib/api-client'
import { PFDALogo } from '@/components/PFDALogo'
import { DashboardStats } from '@/types'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    // Redirect cashiers to their dedicated dashboard
    if (user?.role && user.role.toUpperCase() === 'CASHIER') {
      router.push('/dashboard/cashier')
      return
    }

    fetchDashboardStats()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardStats, 30000)
    return () => clearInterval(interval)
  }, [user, router])

  const fetchDashboardStats = async () => {
    try {
      setIsRefreshing(true)
      const data = await apiClient.getDashboardStats()
      setStats(data)
      setLastUpdated(new Date())
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard statistics')
      console.error('Dashboard stats error:', err)
    } finally {
      setIsRefreshing(false)
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent" />
            <p className="mt-4 text-slate-600 font-medium">Loading dashboard...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="border-b border-slate-100 pb-8">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <PFDALogo />
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard Overview</h1>
                <p className="text-slate-600 text-base font-medium">Welcome to the PFDA Contract Monitoring System</p>
                {lastUpdated && (
                  <p className="text-xs text-slate-500 mt-2 font-medium">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={fetchDashboardStats}
              disabled={isRefreshing}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2 whitespace-nowrap"
              title="Refresh dashboard data"
            >
              {isRefreshing ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent" />
                  Refreshing...
                </>
              ) : (
                <>
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-3 justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div>
                <p className="text-sm font-medium text-red-900">{error}</p>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 font-bold text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* Stats Cards - Professional Slate/Indigo Theme */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Contracts"
            value={stats?.totalContracts || 0}
            link="/dashboard/contracts"
          />
          <StatsCard
            title="Active Contracts"
            value={stats?.activeContracts || 0}
            link="/dashboard/contracts?status=active"
          />
          <StatsCard
            title="Expired Contracts"
            value={stats?.expiredContracts || 0}
            link="/dashboard/contracts?status=expired"
          />
          <StatsCard
            title="Delinquent Contracts"
            value={stats?.delinquentContracts || 0}
            link="/dashboard/contracts?status=delinquent"
          />
        </div>

        {/* Revenue & Spaces */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatsCard
            title="Total Revenue"
            value={`₱${(stats?.totalRevenue || 0).toLocaleString()}`}
          />
          <StatsCard
            title="Pending Payments"
            value={stats?.pendingPayments || 0}
            link="/dashboard/payments?status=pending"
          />
          <StatsCard
            title="Available Spaces"
            value={`${stats?.availableSpaces || 0} / ${stats?.totalRentalSpaces || 0}`}
            link="/dashboard/spaces"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contract Status Distribution */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Contract Status Distribution</h3>
            {stats && (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Active', value: stats.activeContracts, color: '#475569' },
                      { name: 'Expired', value: stats.expiredContracts, color: '#94a3b8' },
                      { name: 'Delinquent', value: stats.delinquentContracts, color: '#cbd5e1' },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#4f46e5" />
                    <Cell fill="#818cf8" />
                    <Cell fill="#c7d2fe" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Revenue Overview */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Financial Overview</h3>
            {stats && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">₱{(stats.totalRevenue || 0).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Pending Payments</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stats.pendingPayments}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Available Spaces</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stats.availableSpaces} / {stats.totalRentalSpaces}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Payments */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-indigo-900">Recent Payments</h3>
              <Link
                href="/dashboard/payments"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                View All →
              </Link>
            </div>
            {stats?.recentPayments && stats.recentPayments.length > 0 ? (
              <div className="space-y-3">
                {stats.recentPayments.slice(0, 5).map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between py-3 border-b border-indigo-200 last:border-0 hover:bg-indigo-100 px-2 rounded transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-sm text-indigo-900">
                        {payment.paymentFor}
                      </div>
                      <div className="text-xs text-indigo-600 mt-1">
                        {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-indigo-700">
                      ₱{(payment.totalAmount ?? 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-indigo-600 text-center py-8 font-medium">
                No recent payments
              </p>
            )}
          </div>

          {/* Expiring Contracts */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-indigo-900">
                Expiring Soon
              </h3>
              <Link
                href="/dashboard/contracts"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                View All →
              </Link>
            </div>
            {stats?.expiringContracts && stats.expiringContracts.length > 0 ? (
              <div className="space-y-3">
                {stats.expiringContracts.slice(0, 5).map((contract) => (
                  <div
                    key={contract.id}
                    className="flex items-center justify-between py-3 border-b border-indigo-200 last:border-0 hover:bg-indigo-100 px-2 rounded transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-sm text-indigo-900">
                        {contract.contractNumber}
                      </div>
                      <div className="text-xs text-indigo-600">
                        {contract.rentalSpace?.spaceNumber}
                      </div>
                    </div>
                    <div className="text-xs font-medium text-indigo-700">
                      Expires: {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-indigo-600 text-center py-8 font-medium">
                No expiring contracts
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-bold text-slate-900 mb-6">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionButton
              href="/dashboard/contracts/new"
              label="New Contract"
            />
            <QuickActionButton
              href="/dashboard/payments/new"
              label="Record Payment"
            />
            <QuickActionButton
              href="/dashboard/tenants/new"
              label="Add Tenant"
            />
            <QuickActionButton
              href="/dashboard/reports"
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
  link,
}: {
  title: string
  value: string | number
  link?: string
}) {
  const content = (
    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200 shadow-sm p-6 hover:shadow-lg transition-all hover:scale-102 duration-200">
      <div>
        <p className="text-sm font-semibold text-indigo-600 mb-2">{title}</p>
        <p className="text-4xl font-bold text-indigo-900">{value}</p>
      </div>
    </div>
  )

  if (link) {
    return (
      <Link href={link} className="block">
        {content}
      </Link>
    )
  }

  return content
}

function QuickActionButton({
  href,
  label,
}: {
  href: string
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center p-6 border border-indigo-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-100 bg-white transition-all duration-200 hover:shadow-md"
    >
      <span className="text-sm font-semibold text-indigo-700 text-center">
        {label}
      </span>
    </Link>
  )
}
