'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import apiClient from '@/lib/api-client'
import { User, Contract } from '@/types'

export default function TenantDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = parseInt(params.id as string)

  const [tenant, setTenant] = useState<User | null>(null)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTenantData()
  }, [tenantId])

  const fetchTenantData = async () => {
    try {
      console.log('Fetching tenant with ID:', tenantId)
      const response = await apiClient.getTenant(tenantId.toString())
      
      console.log('Full API Response:', response)
      
      // API returns {success, data} structure - extract the actual tenant data
      const tenantData = response.data || response
      
      console.log('Extracted Tenant Data:', tenantData)
      console.log('Tenant ID from data:', tenantData.id)
      console.log('All keys in tenantData:', Object.keys(tenantData))
      console.log('Contracts from tenant:', tenantData.contracts)
      console.log('Number of contracts:', tenantData.contracts?.length || 0)
      
      if (!tenantData || !tenantData.id) {
        setError('Failed to load tenant data - invalid response structure')
        setIsLoading(false)
        return
      }
      
      // Map API response fields to frontend expected format
      const fullName = tenantData.contact_person || tenantData.business_name || ''
      const nameParts = fullName.trim().split(' ')
      const firstName = nameParts.slice(0, -1).join(' ') || nameParts[0]
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''
      
      const mappedTenant = {
        id: tenantData.id,
        firstName: firstName,
        lastName: lastName,
        email: tenantData.user?.email || '',
        contactNumber: tenantData.contact_number || tenantData.user?.phone || '',
        address: tenantData.business_address || tenantData.user?.address || '',
        role: tenantData.user?.role || 'TENANT',
        createdAt: tenantData.created_at,
        // Include original fields too
        contact_person: tenantData.contact_person,
        business_name: tenantData.business_name,
        business_type: tenantData.business_type,
        business_address: tenantData.business_address,
        tin: tenantData.tin,
        tenant_code: tenantData.tenant_code,
        status: tenantData.status,
      }
      
      setTenant(mappedTenant)
      
      // Use contracts from tenant data (they're loaded via relationship in backend)
      const contractsList = Array.isArray(tenantData.contracts) ? tenantData.contracts : []
      console.log('Setting contracts list:', contractsList)
      setContracts(contractsList)
      
      setError(null)
    } catch (err: any) {
      console.error('Error fetching tenant data:', err)
      setError(err.message || 'Failed to load tenant data')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-800',
      EXPIRED: 'bg-yellow-100 text-yellow-800',
      TERMINATED: 'bg-red-100 text-red-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
            <p className="mt-4 text-gray-600">Loading tenant details...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !tenant) {
    return (
      <ProtectedRoute>
        <div className="space-y-6">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <p className="text-sm text-red-700">{error || 'Tenant not found'}</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/tenants')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Tenants
          </button>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {tenant.firstName} {tenant.lastName}
            </h2>
            <p className="text-gray-600">Tenant Details</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/dashboard/tenants')}
              title="Back to Tenants"
              className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              🔙
            </button>
            <Link
              href={`/dashboard/tenants/${tenantId}/edit`}
              title="Edit Tenant"
              className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              ✏️
            </Link>
          </div>
        </div>

        {/* Tenant Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Full Name
              </label>
              <p className="text-gray-900">
                {tenant.firstName} {tenant.lastName}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Email Address
              </label>
              <p className="text-gray-900">{tenant.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Phone Number
              </label>
              <p className="text-gray-900">{tenant.contactNumber || 'N/A'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Role
              </label>
              <p className="text-gray-900">{tenant.role}</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Address
              </label>
              <p className="text-gray-900">{tenant.address || 'N/A'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Member Since
              </label>
              <p className="text-gray-900">
                {new Date(tenant.createdAt || '').toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Business Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Business Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Business Name
              </label>
              <p className="text-gray-900">{(tenant as any).business_name || 'N/A'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Tenant Code
              </label>
              <p className="text-gray-900 font-mono">{(tenant as any).tenant_code || 'N/A'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Tax Identification Number (TIN)
              </label>
              <p className="text-gray-900 font-mono">{(tenant as any).tin || 'Not Provided'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Business Type
              </label>
              <p className="text-gray-900 capitalize">{(tenant as any).business_type ? (tenant as any).business_type.replace('_', ' ') : 'Not Specified'}</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Business Address
              </label>
              <p className="text-gray-900">{(tenant as any).business_address || 'Not Provided'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Status
              </label>
              <p className="text-gray-900 capitalize">{(tenant as any).status || 'Active'}</p>
            </div>
          </div>
        </div>

        {/* Contracts Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Contracts</h3>
              <Link
                href="/dashboard/contracts/new"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                + New Contract
              </Link>
            </div>
          </div>

          {contracts.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No contracts found for this tenant
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contract #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rental Space
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monthly Rent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contracts.map((contract: any) => (
                    <tr key={contract.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/dashboard/contracts/${contract.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {contract.contract_number || contract.contractNumber || 'N/A'}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {contract.rentalSpace?.space_code || contract.rentalSpace?.spaceNumber || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(contract.start_date || contract.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(contract.end_date || contract.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ₱{(contract.monthly_rental || contract.monthlyRent || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                            contract.status
                          )}`}
                        >
                          {contract.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/dashboard/contracts/${contract.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-sm font-medium text-gray-500 mb-2">
              Total Contracts
            </h4>
            <p className="text-3xl font-bold text-gray-900">{contracts.length}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-sm font-medium text-gray-500 mb-2">
              Active Contracts
            </h4>
            <p className="text-3xl font-bold text-green-600">
              {contracts.filter((c) => (c.status || '').toUpperCase() === 'ACTIVE').length}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-sm font-medium text-gray-500 mb-2">
              Total Monthly Rent
            </h4>
            <p className="text-3xl font-bold text-blue-600">
              ₱
              {contracts
                .filter((c) => (c.status || '').toUpperCase() === 'ACTIVE')
                .reduce((sum, c) => {
                  const rent = c.monthlyRent || c.monthly_rental || c.monthly_rent || 0
                  return sum + (typeof rent === 'string' ? parseFloat(rent) : rent)
                }, 0)
                .toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
