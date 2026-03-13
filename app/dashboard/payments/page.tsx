'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import apiClient from '@/lib/api-client'
import { Payment } from '@/types'

export default function PaymentsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('')
  const [sortColumn, setSortColumn] = useState('due_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Only cashiers can record and edit payments
  const canRecordPayments = user?.role && user.role.toUpperCase() === 'CASHIER'

  useEffect(() => {
    fetchPayments()
  }, [])



  const fetchPayments = async () => {
    try {
      // Fetch both payments and contracts for amount calculations
      const [paymentsResp, contractsResp] = await Promise.all([
        apiClient.getPayments(),
        apiClient.getContracts(),
      ])
      
      console.log('Payments API Response:', paymentsResp)
      console.log('Contracts API Response:', contractsResp)
      
      // Extract and map contracts by ID
      let contractsArray = []
      if (contractsResp.data?.data && Array.isArray(contractsResp.data.data)) {
        contractsArray = contractsResp.data.data
      } else if (Array.isArray(contractsResp.data)) {
        contractsArray = contractsResp.data
      } else if (Array.isArray(contractsResp)) {
        contractsArray = contractsResp
      }
      
      const contractMap = new Map(contractsArray.map((c: any) => [c.id, c]))
      
      // Extract payments
      let paymentsData = []
      if (paymentsResp.data?.data && Array.isArray(paymentsResp.data.data)) {
        paymentsData = paymentsResp.data.data
      } else if (Array.isArray(paymentsResp.data)) {
        paymentsData = paymentsResp.data
      } else if (Array.isArray(paymentsResp)) {
        paymentsData = paymentsResp
      }
      
      console.log('Extracted payments array:', paymentsData.length)
      
      // Map payments with proper amount calculations using contract fallback
      const mappedPayments = paymentsData.map((p: any) => {
        // Get the contract to use for fallback amounts
        const contract = p.contract || contractMap.get(p.contract_id)
        
        // Get amount_due - use payment value, fallback to contract's monthly_rental
        let amountDue = parseFloat(p.amountDue || p.amount_due || 0)
        if (amountDue === 0 && contract) {
          amountDue = parseFloat(contract.monthly_rental || contract.monthlyRental || 0)
        }
        
        // Calculate interest (3%) if not in database
        let interestAmount = parseFloat(p.interestAmount || p.interest_amount || 0)
        if (interestAmount === 0 && amountDue > 0) {
          interestAmount = amountDue * 0.03
        }
        
        // Calculate total if not in database
        let totalAmount = parseFloat(p.totalAmount || p.total_amount || 0)
        if (totalAmount === 0) {
          totalAmount = amountDue + interestAmount
        }
        
        const amountPaid = parseFloat(p.amountPaid || p.amount_paid || 0)
        
        return {
          ...p,
          // Ensure numeric fields are numbers
          amountDue,
          interestAmount,
          totalAmount,
          amountPaid,
          // Calculate remaining balance
          balance: totalAmount - amountPaid,
          dueDate: p.dueDate || p.due_date,
          billingPeriodStart: p.billingPeriodStart || p.billing_period_start,
          billingPeriodEnd: p.billingPeriodEnd || p.billing_period_end,
          // Map status field from both formats
          status: p.status || p.payment_status || 'pending',
          // Map payment number
          paymentNumber: p.paymentNumber || p.payment_number,
        }
      })
      
      setPayments(mappedPayments)
      console.log('Payments loaded:', mappedPayments.length)
    } catch (err: any) {
      console.error('Error loading payments:', err)
      alert(err.message || 'Failed to load payments')
      setPayments([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPayments = Array.isArray(payments) ? payments.filter((payment) => {
    // Get contract number from payment object (may be nested)
    const contractNumber = payment.contract?.contractNumber || payment.contract?.contract_number || ''
    const matchesSearch = contractNumber.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Handle both uppercase and lowercase status from backend
    const paymentStatus = (payment.status || '').toLowerCase()
    const filterStatus = statusFilter.toLowerCase()
    const matchesStatus = statusFilter === 'all' || paymentStatus === filterStatus
    
    // Filter by month
    let matchesMonth = true
    if (monthFilter) {
      const dueDate = new Date(payment.dueDate || payment.due_date || '')
      const [year, month] = monthFilter.split('-')
      matchesMonth = dueDate.getFullYear() === parseInt(year) && (dueDate.getMonth() + 1) === parseInt(month)
    }
    
    return matchesSearch && matchesStatus && matchesMonth
  }).sort((a, b) => {
    let aValue: any, bValue: any

    switch (sortColumn) {
      case 'contract':
        aValue = a.contract?.contractNumber || a.contract?.contract_number || ''
        bValue = b.contract?.contractNumber || b.contract?.contract_number || ''
        break
      case 'due_date':
        aValue = new Date(a.dueDate || a.due_date || '').getTime()
        bValue = new Date(b.dueDate || b.due_date || '').getTime()
        break
      case 'amount':
        aValue = parseFloat(String(a.amountDue || 0))
        bValue = parseFloat(String(b.amountDue || 0))
        break
      case 'total':
        aValue = parseFloat(String(a.totalAmount || 0))
        bValue = parseFloat(String(b.totalAmount || 0))
        break
      case 'status':
        aValue = a.status || ''
        bValue = b.status || ''
        break
      default:
        return 0
    }

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
    return 0
  }) : []

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new column and reset to ascending
      setSortColumn(column)
      setSortOrder('asc')
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

  const totalPaid = filteredPayments
    .filter((p) => (p.status || '').toLowerCase() === 'paid')
    .reduce((sum, p) => sum + parseFloat(String(p.amountPaid || 0)), 0)

  const totalPending = filteredPayments
    .filter((p) => {
      const status = (p.status || '').toLowerCase()
      return status === 'pending' || status === 'overdue'
    })
    .reduce((sum, p) => sum + parseFloat(String(p.balance || 0)), 0)

  const totalPaymentCount = filteredPayments.length

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Payments</h2>
            <p className="text-gray-600">Monitor and record rental payments</p>
          </div>
          <div className="flex gap-2">
            {canRecordPayments && (
              <Link
                href="/dashboard/payments/new"
                title="Record Payment"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                + Record Payment
              </Link>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg shadow-lg p-6 text-white">
            <p className="text-sm opacity-90 mb-1">Total Paid</p>
            <p className="text-3xl font-bold">₱{totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg shadow-lg p-6 text-white">
            <p className="text-sm opacity-90 mb-1">Total Pending</p>
            <p className="text-3xl font-bold">₱{totalPending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <p className="text-sm opacity-90 mb-1">Total Payments</p>
            <p className="text-3xl font-bold">{totalPaymentCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white rounded-lg shadow p-6 border border-gray-100">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by contract number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Period</label>
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="partial">Partial</option>
            </select>
          </div>
        </div>

        {/* Payments Grid */}
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-400 border-r-transparent" />
                <p className="mt-4 text-gray-600">Loading payments...</p>
              </div>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200">
              <p className="text-gray-500">No payments found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPayments.map((payment) => {
                const contractStatus = payment.contract?.status || 'N/A';
                const contractStatusColors = {
                  active: 'bg-green-100 text-green-800',
                  terminated: 'bg-red-100 text-red-800',
                  expired: 'bg-orange-100 text-orange-800',
                  pending: 'bg-blue-100 text-blue-800'
                };
                const balanceAmount = parseFloat(String(payment.balance || 0));
                const isOverdue = payment.dueDate && new Date(payment.dueDate) < new Date();

                return (
                  <div key={payment.id} className={`bg-white rounded-lg shadow hover:shadow-lg p-6 border-l-4 transition-all ${isOverdue && balanceAmount > 0 ? 'border-red-600' : 'border-blue-600'}`}>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-bold text-blue-600">
                        {payment.contract?.contractNumber || payment.contract?.contract_number || 'N/A'}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(payment.status || '')}`}>
                        {payment.status || 'pending'}
                      </span>
                    </div>

                    {/* Contract Status */}
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <div className="text-xs text-gray-600 mb-2">Contract Status</div>
                      <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${contractStatusColors[contractStatus as keyof typeof contractStatusColors] || 'bg-gray-100 text-gray-800'}`}>
                        {contractStatus.toUpperCase()}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                      <div>
                        <div className="text-xs text-gray-600">Billing Period</div>
                        <div className="text-sm font-medium text-gray-900">
                          {payment.billingPeriodStart && payment.billingPeriodEnd
                            ? `${new Date(payment.billingPeriodStart).toLocaleDateString()} - ${new Date(payment.billingPeriodEnd).toLocaleDateString()}`
                            : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Due Date</div>
                        <div className={`text-sm font-medium ${isOverdue && balanceAmount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                          {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : 'N/A'}
                          {isOverdue && balanceAmount > 0 && <span className="text-xs text-red-600 ml-2">(OVERDUE)</span>}
                        </div>
                      </div>
                    </div>

                    {/* Amount Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
                      <div>
                        <div className="text-xs text-gray-600">Amount Due</div>
                        <div className="text-sm font-bold text-gray-900">
                          ₱{parseFloat(String(payment.amountDue || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Interest (3%)</div>
                        <div className="text-sm font-bold text-red-600">
                          ₱{parseFloat(String(payment.interestAmount || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>

                    {/* Total Balance */}
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <div className="text-xs text-gray-600">Total Balance</div>
                      <div className={`text-lg font-bold ${balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₱{balanceAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4">
                      <button 
                        onClick={() => router.push(`/dashboard/payments/${payment.id}`)}
                        title="View Payment Details"
                        className="flex-1 px-4 py-2 rounded text-sm font-medium text-blue-600 hover:text-blue-900 hover:bg-blue-50 transition-colors border border-blue-200"
                      >
                        View
                      </button>
                      {canRecordPayments && (
                        <button 
                          onClick={() => router.push(`/dashboard/payments/${payment.id}?edit=true`)}
                          disabled={balanceAmount === 0 || contractStatus === 'terminated'}
                          title={contractStatus === 'terminated' ? "Cannot edit payments for terminated contracts" : balanceAmount === 0 ? "This payment is already paid" : "Edit this payment"}
                          className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors border ${balanceAmount === 0 || contractStatus === 'terminated' ? 'text-gray-400 bg-gray-50 cursor-not-allowed border-gray-200' : 'text-green-600 hover:text-green-900 hover:bg-green-50 border-green-200'}`}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {!isLoading && filteredPayments.length > 0 && (
          <div className="text-sm text-gray-600">
            Showing {filteredPayments.length} of {payments.length} payments
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
