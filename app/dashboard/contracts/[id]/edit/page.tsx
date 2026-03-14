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
      
      // NOTE: apiClient converts ALL response keys from snake_case to camelCase
      // So contract.tenant_id becomes contract.tenantId, etc.
      setFormData({
        tenantId: contract.tenantId?.toString() || contract.tenant?.id?.toString() || '',
        rentalSpaceId: contract.rentalSpaceId?.toString() || contract.rentalSpace?.id?.toString() || '',
        startDate: contract.startDate ? new Date(contract.startDate).toISOString().split('T')[0] : '',
        endDate: contract.endDate ? new Date(contract.endDate).toISOString().split('T')[0] : '',
        monthlyRent: contract.monthlyRental?.toString() || contract.monthlyRent?.toString() || '',
        securityDeposit: contract.depositAmount?.toString() || contract.securityDeposit?.toString() || '',
        terms: contract.termsConditions || contract.terms || '',
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

      console.log('🏢 SPACES LOADED:')
      spacesArray.slice(0, 3).forEach((space: any) => {
        console.log(`  Space ${space.id}:`, {
          spaceCode: space.spaceCode || space.space_code,
          baseRentalRate: space.baseRentalRate,
          base_rental_rate: space.base_rental_rate,
          allRateFields: {
            baseRentalRate: space.baseRentalRate,
            base_rental_rate: space.base_rental_rate,
            rentalAmount: space.rentalAmount,
            rental_amount: space.rental_amount,
          }
        })
      })

      setTenants(tenantsArray)
      setSpaces(spacesArray)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load contract data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    console.log(`🔄 CHANGE EVENT: ${name} = ${value}`)
    
    // Special handling for rental space selection to auto-populate monthly rent
    if (name === 'rentalSpaceId') {
      console.log(`  🔍 Looking for space ID ${value} in ${spaces.length} spaces`)
      const selectedSpace = spaces.find((s: any) => s.id == value)
      
      if (selectedSpace) {
        console.log(`  ✅ Found space:`, {
          id: selectedSpace.id,
          code: selectedSpace.spaceCode || selectedSpace.space_code,
          baseRentalRate: selectedSpace.baseRentalRate,
          base_rental_rate: selectedSpace.base_rental_rate,
        })
        
        let newMonthlyRent = formData.monthlyRent
        const baseRate = selectedSpace.baseRentalRate || selectedSpace.base_rental_rate
        
        if (baseRate) {
          newMonthlyRent = String(baseRate)
          console.log(`  💰 Setting monthly rent to: ${newMonthlyRent} (from baseRate: ${baseRate})`)
        } else {
          console.warn(`  ⚠️ No base rental rate found for space`, {
            baseRentalRate: selectedSpace.baseRentalRate,
            base_rental_rate: selectedSpace.base_rental_rate,
          })
        }
      } else {
        console.warn(`  ❌ Space with ID ${value} not found in spaces list`)
        console.log(`     Available spaces:`, spaces.map((s: any) => ({ id: s.id, code: s.spaceCode || s.space_code })))
      }
      
      setFormData({
        ...formData,
        [name]: value,
        monthlyRent: newMonthlyRent,
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const monthlyRentValue = parseFloat(formData.monthlyRent)
      const securityDepositValue = parseFloat(formData.securityDeposit)
      
      console.log('📤 SUBMITTING UPDATE:')
      console.log(`  Current formData.monthlyRent: "${formData.monthlyRent}" (type: ${typeof formData.monthlyRent})`)
      console.log(`  Parsed monthlyRent: ${monthlyRentValue}`)
      console.log(`  Parsed securityDeposit: ${securityDepositValue}`)
      
      const updatePayload = {
        tenantId: parseInt(formData.tenantId),
        rentalSpaceId: parseInt(formData.rentalSpaceId),
        startDate: formData.startDate,
        endDate: formData.endDate,
        durationMonths: 1,
        monthlyRent: monthlyRentValue,
        securityDeposit: securityDepositValue,
        terms: formData.terms,
        status: formData.status,
      }
      
      console.log(`  Full payload:`, updatePayload)

      await apiClient.updateContract(contractId.toString(), updatePayload)

      console.log('✅ Contract updated successfully')
      alert('✅ Contract updated successfully')
      router.push(`/dashboard/contracts/${contractId}`)
    } catch (err: any) {
      console.error('❌ Error updating contract:', err)
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
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">              {/* DEBUG: Current Form State */}
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs font-mono">
                <div className="text-blue-900">
                  📋 Form State: monthlyRent={formData.monthlyRent}, startDate={formData.startDate}, endDate={formData.endDate}
                </div>
              </div>          {/* Tenant Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tenant <span className="text-red-500">*</span>
            </label>
            <select
              name="tenantId"
              required
              value={formData.tenantId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Select tenant</option>
              {tenants.map((tenant: any) => {
                // Use businessName (converted from business_name by apiClient), fallback to contactPerson
                const tenantName = tenant.businessName || tenant.business_name || tenant.contactPerson || 'Unknown'
                const tenantIdentifier = tenant.contactPerson || tenant.contact_person || tenant.email || 'N/A'
                return (
                  <option key={tenant.id} value={tenant.id}>
                    {tenantName} - {tenantIdentifier}
                  </option>
                )
              })}
            </select>
          </div>

          {/* Rental Space Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rental Space <span className="text-red-500">*</span>
            </label>
            <select
              name="rentalSpaceId"
              required
              value={formData.rentalSpaceId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-border-transparent outline-none"
            >
              <option value="">Select rental space</option>
              {spaces
                .filter((space: any) => {
                  // Show spaces with no active contracts, OR the currently selected space
                  const activeContractCount = space.activeContractsCount || space.active_contracts_count || 0
                  return activeContractCount === 0 || parseInt(formData.rentalSpaceId) === space.id
                })
                .map((space: any) => (
                  <option key={space.id} value={space.id}>
                    {space.space_code || space.spaceCode || space.spaceNumber} - {space.name || space.location} ({space.size_sqm || space.squareMeters} sqm)
                    {(space.base_rental_rate || space.baseRentalRate) && (
                      <> • ₱{(space.base_rental_rate || space.baseRentalRate).toLocaleString()}/month</>
                    )}
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
                name="startDate"
                required
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="endDate"
                required
                value={formData.endDate}
                onChange={handleChange}
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
                name="monthlyRent"
                required
                step="0.01"
                min="0"
                value={formData.monthlyRent}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">💡 Automatically filled from the selected rental space rate</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Security Deposit (₱) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="securityDeposit"
                required
                step="0.01"
                min="0"
                value={formData.securityDeposit}
                onChange={handleChange}
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
              name="status"
              required
              value={formData.status}
              onChange={handleChange}
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
              name="terms"
              rows={6}
              value={formData.terms}
              onChange={handleChange}
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
