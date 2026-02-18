'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import apiClient from '@/lib/api-client'
import { User } from '@/types'

export default function TenantsPage() {
  const [tenants, setTenants] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    try {
      const data = await apiClient.getTenants()
      setTenants(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load tenants')
      setTenants([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTenants = Array.isArray(tenants) ? tenants.filter((tenant) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      tenant.firstName.toLowerCase().includes(searchLower) ||
      tenant.lastName.toLowerCase().includes(searchLower) ||
      tenant.email.toLowerCase().includes(searchLower)
    )
  }) : []

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tenants</h2>
            <p className="text-gray-600">Manage tenant information</p>
          </div>
          <Link
            href="/dashboard/tenants/new"
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            👤 Add Tenant
          </Link>
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

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-4">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Tenants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
                <p className="mt-4 text-gray-600">Loading tenants...</p>
              </div>
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No tenants found</p>
            </div>
          ) : (
            filteredTenants.map((tenant) => (
              <div
                key={tenant.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">👤</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {tenant.firstName} {tenant.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">{tenant.role}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>📧</span>
                    <span className="truncate">{tenant.email}</span>
                  </div>
                  {tenant.contactNumber && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <span>📱</span>
                      <span>{tenant.contactNumber}</span>
                    </div>
                  )}
                  {tenant.address && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <span>📍</span>
                      <span className="truncate">{tenant.address}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t flex gap-2">
                  <Link
                    href={`/dashboard/tenants/${tenant.id}`}
                    className="flex-1 px-3 py-2 text-center text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    View Details
                  </Link>
                  <Link
                    href={`/dashboard/contracts?tenantId=${tenant.id}`}
                    className="flex-1 px-3 py-2 text-center text-sm border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition"
                  >
                    Contracts
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {!isLoading && filteredTenants.length > 0 && (
          <div className="text-sm text-gray-600">
            Showing {filteredTenants.length} of {tenants.length} tenants
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
