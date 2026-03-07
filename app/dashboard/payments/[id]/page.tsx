'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import apiClient from '@/lib/api-client'
import { Payment } from '@/types'

export default function PaymentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const paymentId = params.id as string

  const [payment, setPayment] = useState<Payment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(searchParams.get('edit') === 'true')
  const [isUpdating, setIsUpdating] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState({
    amount_to_pay: '',
    payment_method: '',
    remarks: '',
  })

  useEffect(() => {
    fetchPayment()
  }, [paymentId])

  const fetchPayment = async () => {
    try {
      const data = await apiClient.getPayments()
      // Extract payments from paginated response
      const paymentsArray = data.data?.data || data.data || data
      const found = Array.isArray(paymentsArray) ? paymentsArray.find((p: Payment) => p.id && parseInt(p.id) === parseInt(paymentId)) : null
      if (found) {
        // Map the payment to ensure numeric fields are properly set
        const mappedPayment = {
          ...found,
          amountDue: parseFloat(String(found.amountDue || found.amount_due || 0)),
          interestAmount: parseFloat(String(found.interestAmount || found.interest_amount || 0)),
          totalAmount: parseFloat(String(found.totalAmount || found.total_amount || 0)),
          amountPaid: parseFloat(String(found.amountPaid || found.amount_paid || 0)),
          dueDate: found.dueDate || found.due_date,
          billingPeriodStart: found.billingPeriodStart || found.billing_period_start,
          billingPeriodEnd: found.billingPeriodEnd || found.billing_period_end,
          paymentNumber: found.paymentNumber || found.payment_number,
          paymentMethod: found.paymentMethod || found.payment_method,
          referenceNumber: found.referenceNumber || found.reference_number,
        }
        setPayment(mappedPayment)
        // Auto-open edit modal if edit query param is present
        if (searchParams.get('edit') === 'true') {
          setTimeout(() => {
            setEditFormData({
              amount_to_pay: '',
              payment_method: mappedPayment.paymentMethod || mappedPayment.payment_method || '',
              remarks: '',
            })
            setIsEditingModalOpen(true)
          }, 100)
        }
      } else {
        alert('Payment not found')
      }
    } catch (err: any) {
      alert(err.message || 'Failed to load payment')
    } finally {
      setIsLoading(false)
    }
  }

  const openEditModal = () => {
    if (payment) {
      setEditFormData({
        amount_to_pay: '',
        payment_method: payment.payment_method || 'cash',
        remarks: '',
      })
      setIsEditingModalOpen(true)
    }
  }

  const closeEditModal = () => {
    setIsEditingModalOpen(false)
  }

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleUpdatePayment = async () => {
    if (!payment) return
    
    if (!editFormData.amount_to_pay) {
      alert('Please enter an amount to pay')
      return
    }

    const amountToPay = parseFloat(editFormData.amount_to_pay)
    const currentBalance = parseFloat(String(payment.balance || 0))

    // Check if amount exceeds remaining balance
    if (amountToPay > currentBalance) {
      alert(`Amount cannot exceed remaining balance of ₱${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
      return
    }

    setIsUpdating(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
      if (!token) {
        throw new Error('Authentication token not found. Please login again.')
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://contractmonitoringbackend-production.up.railway.app/api'
      const fullUrl = `${apiUrl}/payments/${payment.id}`
      
      console.log('API URL:', fullUrl)
      console.log('Token:', token ? 'Present' : 'Missing')

      const requestBody = {
        amount_to_pay: editFormData.amount_to_pay ? parseFloat(editFormData.amount_to_pay) : 0,
        payment_method: editFormData.payment_method || 'cash',
        remarks: editFormData.remarks,
      }

      console.log('Request body:', requestBody)

      const response = await fetch(fullUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })

      console.log('Response status:', response.status, response.statusText)
      console.log('Response headers:', {
        'content-type': response.headers.get('content-type'),
      })

      const responseText = await response.text()
      console.log('Response text length:', responseText.length)
      console.log('Response text preview:', responseText.substring(0, 500))

      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText)
          console.log('Error data:', errorData)
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
        } catch (parseError) {
          console.log('Could not parse error as JSON')
          throw new Error(`HTTP ${response.status}: ${response.statusText}\n${responseText.substring(0, 500)}`)
        }
      }

      try {
        const result = JSON.parse(responseText)
        console.log('Success response:', result)
        if (result.data) {
          console.log('Updated balance:', result.data.balance)
          setPayment(result.data)
        }
        closeEditModal()
        // Show success message
        const paidAmount = parseFloat(editFormData.amount_to_pay)
        setSuccessMessage(`✅ Payment of ₱${paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} recorded successfully!`)
        // Clear message after 4 seconds
        setTimeout(() => {
          setSuccessMessage(null)
        }, 4000)
      } catch (parseError) {
        console.error('Failed to parse success response:', parseError)
        setPayment(payment) // Keep current state
      }
    } catch (err: any) {
      console.error('Full error object:', err)
      const errorMsg = err.message || 'Failed to record payment'
      alert(errorMsg)
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      partial: 'bg-orange-100 text-orange-800',
      PAID: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      OVERDUE: 'bg-red-100 text-red-800',
      PARTIAL: 'bg-orange-100 text-orange-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
            <p className="text-gray-600">View payment information</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={openEditModal}
              disabled={!!(payment && (payment.balance === 0 || parseFloat(String(payment.balance || 0)) === 0))}
              title={payment && (payment.balance === 0 || parseFloat(String(payment.balance || 0)) === 0) ? "This payment is already paid" : "Record a payment"}
              className={`w-10 h-10 flex items-center justify-center rounded-lg transition ${payment && (payment.balance === 0 || parseFloat(String(payment.balance || 0)) === 0) ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              ✏️
            </button>
            <Link
              href="/dashboard/payments"
              title="Back to Payments"
              className="w-10 h-10 flex items-center justify-center bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              🔙
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
              <p className="mt-4 text-gray-600">Loading payment details...</p>
            </div>
          </div>
        )}

        {/* Payment Details */}
        {!isLoading && payment && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Information */}
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Payment Number</label>
                <p className="text-gray-900 font-mono">{payment.paymentNumber || payment.payment_number}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                <span
                  className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusBadge(
                    payment.status || 'pending'
                  )}`}
                >
                  {(payment.status || 'pending').toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Due Date</label>
                  <p className="text-gray-900">{new Date(payment.dueDate || payment.due_date || '').toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Payment Method</label>
                  <p className="text-gray-900">{(payment.paymentMethod || payment.payment_method || 'N/A').toUpperCase()}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Reference Number</label>
                <p className="text-gray-900">{payment.referenceNumber || payment.reference_number || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Remarks</label>
                <p className="text-gray-900">{payment.remarks || payment.notes || 'N/A'}</p>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-red-700">Balance Remaining</label>
                  <p className="font-bold text-2xl text-red-600">₱{parseFloat(String(payment.balance || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="border-b pb-4">
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-600">Amount Due (Original)</label>
                    <p className="font-semibold text-gray-900">₱{parseFloat(String(payment.amountDue || payment.amount_due || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>

                <div className="border-b pb-4">
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-600">Interest (3%)</label>
                    <p className="font-semibold text-blue-600">₱{parseFloat(String(payment.interestAmount || payment.interest_amount || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>

                <div className="border-b pb-4">
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-600">Total Amount Due</label>
                    <p className="font-semibold text-gray-900">₱{parseFloat(String(payment.totalAmount || payment.total_amount || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>

                <div className="border-b pb-4">
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-600">Amount Paid</label>
                    <p className="font-semibold text-green-600">₱{parseFloat(String(payment.amountPaid || payment.amount_paid || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contract & Tenant Information */}
            <div className="bg-white rounded-lg shadow p-6 space-y-4 lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract & Tenant Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Contract Number</label>
                  <p className="text-gray-900 font-mono">{payment.contract?.contractNumber || payment.contract?.contract_number || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Tenant</label>
                  <p className="text-gray-900">{payment.tenant?.user?.name || payment.tenant?.contactPerson || payment.tenant?.contact_person || payment.tenant?.businessName || payment.tenant?.business_name || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Billing Period</label>
                  <p className="text-gray-900">
                    {(payment.billingPeriodStart || payment.billing_period_start) && (payment.billingPeriodEnd || payment.billing_period_end)
                      ? `${new Date(String(payment.billingPeriodStart || payment.billing_period_start)).toLocaleDateString()} - ${new Date(String(payment.billingPeriodEnd || payment.billing_period_end)).toLocaleDateString()}`
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg shadow-lg max-w-sm">
              {successMessage}
            </div>
          </div>
        )}

        {/* No Payment Found */}
        {!isLoading && !payment && (
          <div className="text-center py-12">
            <p className="text-gray-500">Payment not found</p>
          </div>
        )}

        {/* Edit Payment Modal */}
        {isEditingModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold mb-6 text-gray-900">Record Payment</h3>

              <div className="space-y-4">
                {/* Show Current Balance */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Current Balance</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ₱{payment ? parseFloat(String(payment.balance || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Pay (₱)</label>
                  <input
                    type="number"
                    name="amount_to_pay"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    max={payment ? parseFloat(String(payment.balance || 0)) : undefined}
                    value={editFormData.amount_to_pay}
                    onChange={handleEditFormChange}
                    placeholder="Enter payment amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum: ₱{payment ? parseFloat(String(payment.balance || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} (remaining balance with interest)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    name="payment_method"
                    value={editFormData.payment_method}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks/Notes</label>
                  <textarea
                    name="remarks"
                    value={editFormData.remarks}
                    onChange={handleEditFormChange}
                    rows={3}
                    placeholder="Optional notes about this payment"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-6">
                  <button
                    onClick={handleUpdatePayment}
                    disabled={isUpdating || !editFormData.amount_to_pay}
                    title="Record Payment"
                    className="flex-1 bg-green-600 text-white rounded-lg px-4 py-2 hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center"
                  >
                    {isUpdating ? '⏳' : '💾'}
                  </button>
                  <button
                    onClick={closeEditModal}
                    disabled={isUpdating}
                    title="Cancel"
                    className="flex-1 bg-gray-300 text-gray-800 rounded-lg px-4 py-2 hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
