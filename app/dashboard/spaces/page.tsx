'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import apiClient from '@/lib/api-client'
import { RentalSpace, RentalSpaceType } from '@/types'

export default function RentalSpacesPage() {
  const [spaces, setSpaces] = useState<RentalSpace[]>([])
  const [spaceTypes, setSpaceTypes] = useState<RentalSpaceType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    fetchData()
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchData()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      setIsRefreshing(true)
      const spacesData = await apiClient.getRentalSpaces()
      // Handle paginated response from API - extract actual array from nested structure
      const spacesArray = spacesData.data?.data || spacesData.data || []
      setSpaces(spacesArray)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load rental spaces')
      setSpaces([])
      setSpaceTypes([])
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const filteredSpaces = Array.isArray(spaces) ? spaces.filter((space: any) => {
    const matchesType = selectedType === 'all' || space.space_type === selectedType
    const spaceStatus = String(space.status || '').toUpperCase()
    const matchesStatus = statusFilter === 'all' || spaceStatus === statusFilter.toUpperCase()
    return matchesType && matchesStatus
  }) : []

  const getStatusBadge = (status: string) => {
    const statusKey = String(status || '').toUpperCase()
    const colors = {
      AVAILABLE: 'bg-green-100 text-green-800',
      OCCUPIED: 'bg-blue-100 text-blue-800',
      MAINTENANCE: 'bg-orange-100 text-orange-800',
    }
    return colors[statusKey as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    const statusKey = String(status || '').toUpperCase()
    const icons = {
      AVAILABLE: '✅',
      OCCUPIED: '🔒',
      MAINTENANCE: '🔧',
    }
    return icons[statusKey as keyof typeof icons] || '❓'
  }

  const stats = {
    total: spaces.length,
    available: Array.isArray(spaces) ? spaces.filter((s: any) => String(s.status || '').toUpperCase() === 'AVAILABLE').length : 0,
    occupied: Array.isArray(spaces) ? spaces.filter((s: any) => String(s.status || '').toUpperCase() === 'OCCUPIED').length : 0,
    maintenance: Array.isArray(spaces) ? spaces.filter((s: any) => String(s.status || '').toUpperCase() === 'MAINTENANCE').length : 0,
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Rental Spaces</h2>
            <p className="text-gray-600">Manage rental spaces and availability</p>
          </div>
          <button
            onClick={() => fetchData()}
            disabled={isRefreshing}
            title="Refresh Spaces"
            className="px-4 py-2 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isRefreshing ? '⏳' : '🔄'} Refresh
          </button>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-500 rounded-lg shadow-lg p-6 text-white">
            <p className="text-sm opacity-90 mb-1">Total Spaces</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-green-500 rounded-lg shadow-lg p-6 text-white">
            <p className="text-sm opacity-90 mb-1">Available</p>
            <p className="text-3xl font-bold">{stats.available}</p>
          </div>
          <div className="bg-purple-500 rounded-lg shadow-lg p-6 text-white">
            <p className="text-sm opacity-90 mb-1">Occupied</p>
            <p className="text-3xl font-bold">{stats.occupied}</p>
          </div>
          <div className="bg-orange-500 rounded-lg shadow-lg p-6 text-white">
            <p className="text-sm opacity-90 mb-1">Maintenance</p>
            <p className="text-3xl font-bold">{stats.maintenance}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Space Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="all">All Types</option>
                {Array.from(new Set(spaces.map((s: any) => s.space_type))).map((type: any) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
        </div>

        {/* Spaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
                <p className="mt-4 text-gray-600">Loading spaces...</p>
              </div>
            </div>
          ) : filteredSpaces.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No rental spaces found</p>
            </div>
          ) : (
            filteredSpaces.map((space: any) => (
              <div
                key={space.id}
                className={`bg-white rounded-lg shadow hover:shadow-lg transition p-4 border-2 ${
                  String(space.status || '').toUpperCase() === 'AVAILABLE'
                    ? 'border-green-200'
                    : String(space.status || '').toUpperCase() === 'OCCUPIED'
                    ? 'border-blue-200'
                    : 'border-orange-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{space.space_code}</h3>
                  <span className="text-2xl">{getStatusIcon(space.status)}</span>
                </div>
                <div className="space-y-2 text-sm mb-4">
                  <div className="text-gray-600">{space.space_type}</div>
                  <div className="text-gray-600">
                    📏 {space.size_sqm} m²
                  </div>
                  {space.name && (
                    <div className="text-gray-600 text-xs">
                      📍 {space.name}
                    </div>
                  )}
                  {space.base_rental_rate && (
                    <div className="text-gray-900 font-medium">
                      ₱{Number(space.base_rental_rate).toLocaleString()}/month
                    </div>
                  )}
                </div>
                <div>
                  <span
                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                      space.status
                    )}`}
                  >
                    {String(space.status || '').toUpperCase()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {!isLoading && filteredSpaces.length > 0 && (
          <div className="text-sm text-gray-600">
            Showing {filteredSpaces.length} of {spaces.length} spaces
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
