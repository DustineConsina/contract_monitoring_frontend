'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import apiClient from '@/lib/api-client'
import { User, RentalSpace } from '@/types'

export default function EditContractPage() {
  const params = useParams()
  const router = useRouter()
  const contractId = parseInt(params.id as string)

  const [formData, setFormData] = useState({
    tenantId: '',
    rentalSpaceId: '',
    startDate: '',
    endDate: '',
    monthlyRent: '',
    securityDeposit: '',
    terms: '',
    status: 'ACTIVE',
  })

  const [tenants, setTenants] = useState<User[]>([])
  const [spaces, setSpaces] = useState<RentalSpace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [contractId])

  const fetchData = async () => {
    try {
      // Fetch contract data
      const contractResponse = await apiClient.getContract(contractId.toString())
      const contract = contractResponse.data || contractResponse
      
      setFormData({
        tenantId: contract.tenant_id?.toString() || contract.tenant?.id?.toString() || '',
        rentalSpaceId: contract.rental_space_id?.toString() || contract.rentalSpace?.id?.toString() || '',
        startDate: contract.start_date ? new Date(contract.start_date).toISOString().split('T')[0] : '',
        endDate: contract.end_date ? new Date(contract.end_date).toISOString().split('T')[0] : '',
        monthlyRent: contract.monthly_rental?.toString() || contract.monthlyRent?.toString() || '',
        securityDeposit: contract.deposit_amount?.toString() || contract.securityDeposit?.toString() || '',
        terms: contract.terms_conditions || contract.terms || '',
        status: contract.status || 'active',
      })

      // Fetch tenants and spaces for dropdowns
      const tenantsResponse = await apiClient.getTenants()
      const spacesResponse = await apiClient.getRentalSpaces()
      
      // Handle paginated responses from Laravel
      let tenantsArray = Array.isArray(tenantsResponse) 
        ? tenantsResponse 
        : (tenantsResponse.data?.data || tenantsResponse.data || [])
      
      let spacesArray = Array.isArray(spacesResponse) 
        ? spacesResponse 
        : (spacesResponse.data?.data || spacesResponse.data || [])

      setTenants(tenantsArray)
      setSpaces(spacesArray)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load contract data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await apiClient.updateContract(contractId.toString(), {
        tenantId: parseInt(formData.tenantId),
        rentalSpaceId: parseInt(formData.rentalSpaceId),
        startDate: formData.startDate,
        durationMonths: 1, // This will be calculated from start/end date on backend
        monthlyRent: parseFloat(formData.monthlyRent),
        securityDeposit: parseFloat(formData.securityDeposit),
        terms: formData.terms,
        status: formData.status,
      })

      router.push(`/dashboard/contracts/${contractId}`)
    } catch (err: any) {
      setError(err.message || 'Failed to update contract')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
            <p className="mt-4 text-gray-600">Loading contract...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Edit Contract</h2>
          <p className="text-gray-600">Update contract details</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Tenant Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tenant <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.tenantId}
              onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Select tenant</option>
              {tenants.map((tenant: any) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.business_name || `${tenant.firstName} ${tenant.lastName}`} - {tenant.contact_person || tenant.email}
                </option>
              ))}
            </select>
          </div>

          {/* Rental Space Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rental Space <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.rentalSpaceId}
              onChange={(e) => setFormData({ ...formData, rentalSpaceId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-border-transparent outline-none"
            >
              <option value="">Select rental space</option>
              {spaces
                .filter((space: any) => space.status === 'available' || parseInt(formData.rentalSpaceId) === space.id)
                .map((space: any) => (
                  <option key={space.id} value={space.id}>
                    {space.space_code || space.spaceNumber} - {space.name || space.location} ({space.size_sqm || space.squareMeters} sqm)
                  </option>
                ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Financial Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Rent (₱) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.monthlyRent}
                onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Security Deposit (₱) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.securityDeposit}
                onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Contract Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </div>

          {/* Terms and Conditions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Terms and Conditions
            </label>
            <textarea
              rows={6}
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              placeholder="Enter contract terms and conditions..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/contracts/${contractId}`)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  )
}
