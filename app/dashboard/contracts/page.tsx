'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import apiClient from '@/lib/api-client'
import { Contract } from '@/types'

export default function ContractsPage() {
  const searchParams = useSearchParams()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [activatingId, setActivatingId] = useState<number | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchContracts()
  }, [statusFilter])

  const fetchContracts = async () => {
    try {
      const params: any = {}
      if (statusFilter !== 'all') {
        params.status = statusFilter.toLowerCase()
      }
      const response = await apiClient.getContracts(params)
      
      // The API returns: { success: true, data: { data: [...], pagination_info } }
      // OR for direct responses: { success: true, data: [...] }
      // OR just: [...]
      
      let contractList: any[] = []
      
      // Check if response has data property
      if (response && response.data) {
        // If data is an array, use it
        if (Array.isArray(response.data)) {
          contractList = response.data
        }
        // If data has a data property (paginated), extract it
        else if (response.data.data && Array.isArray(response.data.data)) {
          contractList = response.data.data
        }
      }
      // If response is directly an array
      else if (Array.isArray(response)) {
        contractList = response
      }
      
      console.log('Fetched contracts:', contractList)
      console.log('First contract sample:', contractList[0])
      
      setContracts(contractList)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load contracts')
      setContracts([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredContracts = Array.isArray(contracts) ? contracts.filter((contract) => {
    const searchLower = searchTerm.toLowerCase()
    const tenantName = (contract.tenant?.contact_person || '').toLowerCase()
    const spaceName = (contract.rentalSpace?.space_code || contract.rentalSpace?.name || '').toLowerCase()
    return (
      (contract.contractNumber || '').toLowerCase().includes(searchLower) ||
      tenantName.includes(searchLower) ||
      spaceName.includes(searchLower)
    )
  }) : []

  const getStatusBadge = (status: string) => {
    const colors = {
      ACTIVE: 'bg-emerald-100 text-emerald-800',
      EXPIRED: 'bg-amber-100 text-amber-800',
      TERMINATED: 'bg-rose-100 text-rose-800',
      RENEWED: 'bg-indigo-100 text-indigo-800',
      PENDING: 'bg-blue-100 text-blue-800',
    }
    return colors[status as keyof typeof colors] || 'bg-slate-100 text-slate-800'
  }

  const handleActivateContract = async (contractId: number, contractNumber: string) => {
    if (!contractId) {
      setError('Contract ID is missing')
      return
    }
    
    setActivatingId(contractId)
    try {
      const token = localStorage.getItem('auth_token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
      
      const activateUrl = `${apiUrl}/contracts/${contractId}/activate`
      console.log('Activating contract:', { contractId, contractNumber, url: activateUrl })
      
      // Use the dedicated activate endpoint
      const response = await fetch(activateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      // First, get the raw text to see what we're actually getting
      const responseText = await response.text()
      console.log('Raw response:', responseText)
      console.log('Status:', response.status)

      let jsonData
      try {
        jsonData = JSON.parse(responseText)
      } catch (parseError) {
        console.error('Failed to parse JSON:', parseError)
        // If response is ok but JSON parse fails, still consider it success
        if (response.ok) {
          setContracts(contracts.map(c => c.id && c.id.toString() === contractId.toString() ? { ...c, status: 'active' } : c))
          setSuccessMessage(`✅ Contract ${contractNumber} activated!`)
          setTimeout(() => setSuccessMessage(null), 3000)
          setActivatingId(null)
          return
        }
        throw new Error(`Server returned invalid response: ${responseText}`)
      }

      if (!response.ok) {
        throw new Error(jsonData.message || jsonData.error || 'Failed to activate contract')
      }

      // Update local state
      setContracts(contracts.map(c => c.id && c.id.toString() === contractId.toString() ? { ...c, status: 'active' } : c))
      setSuccessMessage(`✅ Contract ${contractNumber} activated!`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      console.error('Activate error:', err)
      setError(err.message || 'Failed to activate contract')
      setTimeout(() => setError(null), 5000)
    } finally {
      setActivatingId(null)
    }
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Contracts</h1>
            <p className="text-slate-600 text-base mt-1">Manage rental contracts and agreements</p>
          </div>
          <Link
            href="/dashboard/contracts/new"
            title="New Contract"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all"
          >
            + New Contract
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-3">
            <div className="flex-shrink-0 text-red-500 font-bold text-xl">!</div>
            <div>
              <p className="text-sm font-medium text-red-900">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex items-start gap-3">
            <div className="flex-shrink-0 text-green-600 font-bold text-xl">✓</div>
            <div>
              <p className="text-sm font-medium text-green-900">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <input
                type="text"
                placeholder="Search by contract number, tenant, or space..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition shadow-sm"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition shadow-sm"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="terminated">Terminated</option>
                <option value="renewed">Renewed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contracts Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent" />
                <p className="mt-4 text-slate-600 font-medium">Loading contracts...</p>
              </div>
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 font-medium">No contracts found</p>
              <Link
                href="/dashboard/contracts/new"
                className="inline-block mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Create your first contract →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Contract #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Rental Space
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Monthly Rent
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {filteredContracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        <Link
                          href={`/dashboard/contracts/${contract.id}`}
                          className="text-indigo-600 hover:text-indigo-700 hover:underline"
                        >
                          {contract.contractNumber || contract.contract_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                        {contract.tenant?.contact_person || contract.tenant?.firstName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {(() => {
                          const rs = contract.rentalSpace || contract.rental_space
                          return (
                            <>
                              {rs?.space_code || rs?.spaceCode || 'N/A'}
                              {rs && (
                                <div className="text-xs text-slate-500 mt-1">
                                  {rs?.space_type || rs?.type?.name || 'N/A'}
                                </div>
                              )}
                            </>
                          )
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {contract.startDate || contract.start_date ? new Date(contract.startDate || contract.start_date || '').toLocaleDateString() : 'N/A'} −{' '}
                        {contract.endDate || contract.end_date ? new Date(contract.endDate || contract.end_date || '').toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                        ₱{(contract.monthlyRent || contract.monthly_rental || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${getStatusBadge(
                            (contract.status || 'PENDING').toUpperCase()
                          )}`}
                        >
                          {(contract.status || 'PENDING').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 flex">
                        <Link
                          href={`/dashboard/contracts/${contract.id}`}
                          title="View Contract"
                          className="px-3 py-1 rounded text-sm flex items-center justify-center gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
                        >
                          View
                        </Link>
                        <Link
                          href={`/dashboard/contracts/${contract.id}/qr`}
                          title="View QR Code"
                          className="px-3 py-1 rounded text-sm flex items-center justify-center gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                        >
                          QR
                        </Link>
                        {(contract.status?.toLowerCase() === 'pending' || !['active', 'expired', 'terminated'].includes(contract.status?.toLowerCase() || '')) && (
                          <button
                            onClick={() => handleActivateContract(parseInt(contract.id || '0'), contract.contract_number || contract.contractNumber || `Contract ${contract.id}`)}
                            disabled={activatingId === parseInt(contract.id || '0')}
                            title="Activate Contract"
                            className="px-3 py-1 rounded text-sm flex items-center justify-center gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        {!isLoading && filteredContracts.length > 0 && (
          <div className="text-sm font-medium text-slate-600">
            Showing <span className="text-slate-900 font-bold">{filteredContracts.length}</span> of <span className="text-slate-900 font-bold">{contracts.length}</span> contracts
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
