'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import apiClient from '@/lib/api-client'
import { Contract } from '@/types'

export default function NewPaymentPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const [formData, setFormData] = useState({
    contractId: '',
    amount: '',
    dueDate: '',
    paidDate: '',
    paymentMethod: 'CASH',
    notes: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch contracts
      const contractsDataResp = await apiClient.getContracts()
      let contractsArray = contractsDataResp.data?.data || contractsDataResp.data || contractsDataResp
      
      // Fetch payments
      const paymentsDataResp = await apiClient.getPayments()
      const paymentsArray = paymentsDataResp.data?.data || paymentsDataResp.data || paymentsDataResp

      // Get contract IDs that already have payments
      const contractsWithPayments = new Set(
        (Array.isArray(paymentsArray) ? paymentsArray : [])
          .map((p: any) => p.contract_id)
          .filter(Boolean)
      )

      // Filter contracts: exclude those with payments  
      const availableContracts = (Array.isArray(contractsArray) ? contractsArray : []).filter(
        (c: any) => !contractsWithPayments.has(c.id)
      )

      console.log('Available contracts:', availableContracts)
      setContracts(availableContracts)
    } catch (err: any) {
      console.error('Error loading contracts:', err)
      alert(err.message || 'Failed to load contracts')
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Get the selected contract to extract tenant_id
      const selectedContract = contracts.find((c) => c.id && parseInt(c.id) === parseInt(formData.contractId))
      
      if (!selectedContract) {
        alert('Please select a valid contract')
        setIsLoading(false)
        return
      }

      // Map form data to backend expected format with proper snake_case field naming
      const paymentData: any = {
        contract_id: parseInt(formData.contractId),
        tenant_id: selectedContract.tenant?.id || selectedContract.tenant_id,
        amount_due: parseFloat(formData.amount),
        due_date: formData.dueDate,
        payment_method: formData.paymentMethod,
        remarks: formData.notes,
      }

      // Only add payment_date if provided
      if (formData.paidDate) {
        paymentData.payment_date = formData.paidDate
      }

      console.log('Submitting payment:', paymentData)
      await apiClient.createPayment(paymentData)
      router.push('/dashboard/payments')
    } catch (err: any) {
      alert(err.message || 'Failed to record payment')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleContractChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const contractId = e.target.value
    
    // Auto-fill amount from contract
    const selectedContract = contracts.find((c) => c.id && c.id.toString() === contractId)
    
    if (selectedContract) {
      // Get monthly rental directly from contract (the source of truth)
      let monthlyRent = selectedContract.monthly_rental || 
                        selectedContract.monthlyRent || 
                        0
      
      // Ensure it's a number
      monthlyRent = parseFloat(String(monthlyRent || 0))
      
      const amountString = monthlyRent > 0 ? monthlyRent.toFixed(2) : '0.00'
      
      console.log('Selected contract:', selectedContract)
      console.log('Monthly rent to fill:', monthlyRent, 'String:', amountString)
      
      setFormData({
        ...formData,
        contractId,
        amount: amountString,
      })
    } else {
      // If no contract selected, clear the form
      setFormData({
        ...formData,
        contractId,
        amount: '',
      })
    }
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Record Payment</h2>
            <p className="text-gray-600">Record a new payment for a contract</p>
          </div>
          <Link
            href="/dashboard/payments"
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            ← Back
          </Link>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          {loadingData ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
              <p className="mt-4 text-gray-600">Loading form data...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contract Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contract <span className="text-red-500">*</span>
                </label>
                <select
                  name="contractId"
                  value={formData.contractId}
                  onChange={handleContractChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Select a contract</option>
                  {contracts.map((contract) => (
                    <option key={contract.id} value={contract.id}>
                      {contract.contractNumber || contract.contract_number} -{' '}
                      {contract.tenant?.user?.name || contract.tenant?.contact_person || contract.tenant?.business_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (₱) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="amount"
                    value={formData.amount ? `₱${parseFloat(formData.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                    readOnly
                    disabled
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-blue-50 text-gray-800 cursor-not-allowed outline-none font-semibold text-lg text-center"
                    placeholder="Select contract to see amount"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Amount is fixed to the contract's monthly rental. Select a contract above to auto-fill.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CHECK">Check</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="GCASH">GCash</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paid Date (leave empty if not paid yet)
                  </label>
                  <input
                    type="date"
                    name="paidDate"
                    value={formData.paidDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  placeholder="Payment notes or remarks..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Link
                  href="/dashboard/payments"
                  title="Cancel"
                  className="px-4 py-2 flex items-center justify-center border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isLoading}
                  title="Record Payment"
                  className="px-4 py-2 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '⏳ Saving...' : 'Record'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
