'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import apiClient from '@/lib/api-client'
import { Contract } from '@/types'

function ContractsPageContent() {
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
      
      // Log the numeric fields from the first contract
      if (contractList.length > 0) {
        const first = contractList[0]
        console.log('🔍 FIRST CONTRACT - RAW NUMERIC FIELDS:', {
          monthlyRental: first.monthlyRental,
          depositAmount: first.depositAmount,
          interestRate: first.interestRate,
        })
      }
      
      // Map numeric fields to ensure they're properly parsed
      const mappedContracts = contractList.map((c: any) => {
        const monthlyRentValue = parseFloat(String(c.monthlyRental || 0))
        const securityDepositValue = parseFloat(String(c.depositAmount || 0))
        
        return {
          ...c,
          monthlyRent: monthlyRentValue,
          securityDeposit: securityDepositValue,
          interestRate: parseFloat(String(c.interestRate || 0)),
          startDate: c.startDate || c.start_date,
          endDate: c.endDate || c.end_date,
        }
      })
      
      console.log('✅ First contract AFTER mapping:', mappedContracts[0])
      
      setContracts(mappedContracts)
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
    const tenantName = (contract.tenant?.contactPerson || contract.tenant?.user?.name || '').toLowerCase()
    const spaceName = (contract.rentalSpace?.spaceCode || contract.rentalSpace?.name || '').toLowerCase()
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white rounded-lg shadow p-6 border border-gray-100">
          {/* Search */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by contract number, tenant, or space..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
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

        {/* Contracts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center h-64">
              <div className="text-center">
                <div className="relative w-12 h-12 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-600 animate-spin"></div>
                </div>
                <p className="text-gray-600 font-medium">Loading contracts...</p>
              </div>
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 mb-4">No contracts found</p>
              <Link
                href="/dashboard/contracts/new"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                + Create Contract
              </Link>
            </div>
          ) : (
            filteredContracts.map((contract) => (
              <div
                key={contract.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border-l-4 border-blue-600"
              >
                {/* Header with Contract Number and Status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <Link
                      href={`/dashboard/contracts/${contract.id}`}
                      className="text-lg font-bold text-blue-600 hover:text-blue-700"
                    >
                      {contract.contractNumber || contract.contract_number}
                    </Link>
                    <p className="text-sm text-gray-600">Contract ID: {contract.id}</p>
                  </div>
                  <span
                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                      (contract.status || 'PENDING').toUpperCase()
                    )}`}
                  >
                    {(contract.status || 'PENDING').toUpperCase()}
                  </span>
                </div>

                {/* Tenant and Space Info */}
                <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">TENANT</p>
                    <p className="text-sm font-medium text-gray-900">
                      {contract.tenant?.user?.name || contract.tenant?.contactPerson || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">RENTAL SPACE</p>
                    <p className="text-sm font-medium text-gray-900">
                      {(() => {
                        const rs = contract.rentalSpace || contract.rentalSpace
                        return rs?.spaceCode || rs?.space_code || 'N/A'
                      })()}
                    </p>
                    <p className="text-xs text-gray-600">
                      {(() => {
                        const rs = contract.rentalSpace || contract.rentalSpace
                        return rs?.spaceType || rs?.type?.name || 'N/A'
                      })()}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">RENTAL PERIOD</p>
                    <p className="text-sm font-medium text-gray-900">
                      {contract.startDate ? new Date(contract.startDate || '').toLocaleDateString() : 'N/A'}
                    </p>
                    <p className="text-xs text-gray-600">to {contract.endDate ? new Date(contract.endDate || '').toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">MONTHLY RENT</p>
                    <p className="text-sm font-bold text-gray-900">
                      ₱{(contract.monthlyRent || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <Link
                    href={`/dashboard/contracts/${contract.id}`}
                    className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition flex items-center justify-center gap-1"
                  >
                    View Details
                  </Link>
                  <Link
                    href={`/dashboard/contracts/${contract.id}/qr`}
                    className="flex-1 px-3 py-2 rounded-lg text-sm font-medium border border-green-600 text-green-600 hover:bg-green-50 transition flex items-center justify-center gap-1"
                  >
                    QR Code
                  </Link>
                  {(contract.status?.toLowerCase() === 'pending' || !['active', 'expired', 'terminated'].includes(contract.status?.toLowerCase() || '')) && (
                    <button
                      onClick={() => handleActivateContract(parseInt(contract.id || '0'), contract.contractNumber || `Contract ${contract.id}`)}
                      disabled={activatingId === parseInt(contract.id || '0')}
                      className="flex-1 px-3 py-2 rounded-lg text-sm font-medium border border-amber-600 text-amber-600 hover:bg-amber-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Activate
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        {!isLoading && filteredContracts.length > 0 && (
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredContracts.length}</span> of <span className="font-semibold text-gray-900">{contracts.length}</span> contracts
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}

export default function ContractsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="h-12 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-96 bg-slate-200 rounded-lg animate-pulse" />
      </div>
    }>
      <ContractsPageContent />
    </Suspense>
  )
}
