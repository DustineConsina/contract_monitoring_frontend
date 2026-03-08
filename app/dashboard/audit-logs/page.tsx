'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import apiClient from '@/lib/api-client'

interface AuditLog {
  id: number
  user_id: number
  action: string
  model_type: string
  model_id: number | null
  description: string
  old_values: any
  new_values: any
  ip_address: string | null
  created_at: string
  user?: {
    id: number
    name: string
    email: string
    role: string
  }
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterAction, setFilterAction] = useState('all')
  const [filterEntity, setFilterEntity] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    // Initial load
    const initialFetch = async () => {
      try {
        setIsLoading(true)
        const response = await apiClient.getAuditLogs()
        
        // Log response structure for debugging
        console.log('🔍 Audit Logs Response:', response)
        
        // Try multiple possible response structures
        let logsData = []
        if (response.data) {
          if (Array.isArray(response.data)) {
            logsData = response.data
          } else if (response.data.data) {
            logsData = Array.isArray(response.data.data) ? response.data.data : (response.data.data.audit_logs || [])
          } else if (response.data.audit_logs) {
            logsData = response.data.audit_logs
          }
        } else if (Array.isArray(response)) {
          logsData = response
        }
        
        console.log('✅ Parsed Audit Logs:', logsData)
        setLogs(Array.isArray(logsData) ? logsData : [])
        setError(null)
      } catch (err: any) {
        console.error('❌ Audit Logs Error:', err)
        setError(err.message || 'Failed to load audit logs')
        setLogs([])
      } finally {
        setIsLoading(false)
      }
    }
    
    initialFetch()
  }, [])

  const fetchLogs = async () => {
    try {
      setIsRefreshing(true)
      const response = await apiClient.getAuditLogs()
      const logsData = response.data?.data?.audit_logs || response.data?.audit_logs || []
      setLogs(Array.isArray(logsData) ? logsData : [])
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs')
      setLogs([])
    } finally {
      setIsRefreshing(false)
    }
  }

  const filteredLogs = (Array.isArray(logs) ? logs : [])
    .filter((log) => {
      const matchesAction = filterAction === 'all' || log.action.toLowerCase() === filterAction.toLowerCase()
      const matchesEntity = filterEntity === 'all' || log.model_type === filterEntity
      const matchesSearch =
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase())
      return matchesAction && matchesEntity && matchesSearch
    })
    .sort((a, b) => {
      const aTime = new Date(a.created_at).getTime()
      const bTime = new Date(b.created_at).getTime()
      return sortOrder === 'desc' ? bTime - aTime : aTime - bTime
    })

  // Get unique actions and entity types for filters
  const uniqueActions = Array.from(new Set(logs.map((log) => log.action).filter(Boolean)))
  const uniqueEntities = Array.from(new Set(logs.map((log) => log.model_type).filter(Boolean)))

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      create: 'bg-green-100 text-green-800',
      update: 'bg-blue-100 text-blue-800',
      delete: 'bg-red-100 text-red-800',
      view: 'bg-gray-100 text-gray-800',
      system: 'bg-purple-100 text-purple-800',
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
      VIEW: 'bg-gray-100 text-gray-800',
      SYSTEM: 'bg-purple-100 text-purple-800',
    }
    return colors[action] || 'bg-gray-100 text-gray-800'
  }

  const getEntityBadge = (entity: string) => {
    const colors: Record<string, string> = {
      Contract: 'bg-indigo-100 text-indigo-800',
      Payment: 'bg-green-100 text-green-800',
      Tenant: 'bg-orange-100 text-orange-800',
      RentalSpace: 'bg-cyan-100 text-cyan-800',
      User: 'bg-violet-100 text-violet-800',
      Report: 'bg-yellow-100 text-yellow-800',
    }
    return colors[entity] || 'bg-gray-100 text-gray-800'
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Audit Trails</h2>
            <p className="text-gray-600">Track all system changes and user actions</p>
          </div>
          <button
            onClick={fetchLogs}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRefreshing ? '⏳ Refreshing...' : '🔄 Refresh'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by description, user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Action Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="all">All Actions</option>
                {uniqueActions.map((action, idx) => (
                  <option key={`action-${idx}-${action}`} value={action}>
                    {action.charAt(0).toUpperCase() + action.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Entity Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Entity Type</label>
              <select
                value={filterEntity}
                onChange={(e) => setFilterEntity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="all">All Types</option>
                {uniqueEntities.map((entity, idx) => (
                  <option key={`entity-${idx}-${entity}`} value={entity}>
                    {entity}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredLogs.length}</span> of{' '}
            <span className="font-semibold">{logs.length}</span> audit logs
          </p>
        </div>

        {/* Audit Logs Table */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">Loading audit logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No audit logs found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex flex-col">
                          <span className="font-medium">{new Date(log.created_at).toLocaleDateString()}</span>
                          <span className="text-xs text-gray-500">{new Date(log.created_at).toLocaleTimeString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{log.user?.name || 'Unknown'}</span>
                          <span className="text-xs text-gray-500">{log.user?.email || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionBadge(log.action)}`}>
                          {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEntityBadge(log.model_type)}`}>
                          {log.model_type || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <p className="break-words max-w-md">{log.description}</p>
                        {log.old_values && Object.keys(log.old_values).length > 0 && (
                          <details className="mt-2 text-xs text-gray-500 cursor-pointer">
                            <summary className="font-semibold hover:text-gray-700">View changes</summary>
                            <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200 space-y-2">
                              {Object.entries(log.old_values)
                                .filter(([key, oldValue]: [string, any]) => {
                                  // Only show fields that actually changed
                                  const newValue = log.new_values?.[key]
                                  return String(oldValue) !== String(newValue)
                                })
                                .map(([key, oldValue]: [string, any]) => {
                                  const newValue = log.new_values?.[key]
                                  const displayOld = oldValue === null ? '(empty)' : String(oldValue)
                                  const displayNew = newValue === null ? '(empty)' : String(newValue)
                                  
                                  return (
                                    <div key={key} className="py-1 border-b border-gray-200 last:border-0">
                                      <div className="font-medium text-gray-700 capitalize mb-1">{key.replace(/_/g, ' ')}</div>
                                      <div className="ml-2 flex gap-4 text-xs">
                                        <div className="text-red-600"><span className="font-semibold">Before:</span> {displayOld}</div>
                                        <div className="text-green-600"><span className="font-semibold">After:</span> {displayNew}</div>
                                      </div>
                                    </div>
                                  )
                                })}
                            </div>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
