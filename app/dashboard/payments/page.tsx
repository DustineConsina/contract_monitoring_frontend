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
      const response = await apiClient.getPayments()
      // Handle paginated response from backend
      const paymentsData = response.data?.data || response.data || response
      setPayments(Array.isArray(paymentsData) ? paymentsData : [])
    } catch (err: any) {
      alert(err.message || 'Failed to load payments')
      setPayments([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPayments = Array.isArray(payments) ? payments.filter((payment) => {
    const contractNumber = payment.contract?.contract_number || payment.contract?.contractNumber || ''
    const matchesSearch = contractNumber.toLowerCase().includes(searchTerm.toLowerCase())
    // Handle both uppercase and lowercase status from backend
    const paymentStatus = (payment.status || '').toLowerCase()
    const filterStatus = statusFilter.toLowerCase()
    const matchesStatus = statusFilter === 'all' || paymentStatus === filterStatus
    
    // Filter by month
    let matchesMonth = true
    if (monthFilter) {
      const dueDate = new Date(payment.due_date || payment.dueDate || '')
      const [year, month] = monthFilter.split('-')
      matchesMonth = dueDate.getFullYear() === parseInt(year) && (dueDate.getMonth() + 1) === parseInt(month)
    }
    
    return matchesSearch && matchesStatus && matchesMonth
  }).sort((a, b) => {
    let aValue: any, bValue: any

    switch (sortColumn) {
      case 'contract':
        aValue = a.contract?.contract_number || a.contract?.contractNumber || ''
        bValue = b.contract?.contract_number || b.contract?.contractNumber || ''
        break
      case 'due_date':
        aValue = new Date(a.due_date || a.dueDate || '').getTime()
        bValue = new Date(b.due_date || b.dueDate || '').getTime()
        break
      case 'amount':
        aValue = parseFloat(String(a.amount_due || a.amount || 0))
        bValue = parseFloat(String(b.amount_due || b.amount || 0))
        break
      case 'total':
        aValue = parseFloat(String(a.total_amount || a.totalAmount || 0))
        bValue = parseFloat(String(b.total_amount || b.totalAmount || 0))
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
    .reduce((sum, p) => sum + parseFloat(String(p.amount_paid || p.amountPaid || 0)), 0)

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
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <input
                type="text"
                placeholder="Search by contract number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
                <option value="partial">Partial</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-400 border-r-transparent" />
                <p className="mt-4 text-gray-600">Loading payments...</p>
              </div>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No payments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th 
                      onClick={() => handleSort('contract')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    >
                      Contract #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contract Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment For
                    </th>
                    <th 
                      onClick={() => handleSort('due_date')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    >
                      Due Date
                    </th>
                    <th 
                      onClick={() => handleSort('amount')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    >
                      Amount Due
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Interest (3%)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Total Balance
                    </th>
                    <th 
                      onClick={() => handleSort('status')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    >
                      Payment Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => {
                    const contractStatus = payment.contract?.status || 'N/A';
                    const contractStatusColors = {
                      active: 'bg-green-100 text-green-800',
                      terminated: 'bg-red-100 text-red-800',
                      expired: 'bg-orange-100 text-orange-800',
                      pending: 'bg-blue-100 text-blue-800'
                    };
                    return (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payment.contract?.contract_number || payment.contract?.contractNumber || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${contractStatusColors[contractStatus as keyof typeof contractStatusColors] || 'bg-gray-100 text-gray-800'}`}>
                          {contractStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {payment.billing_period_start && payment.billing_period_end
                          ? `${new Date(payment.billing_period_start).toLocaleDateString()} - ${new Date(payment.billing_period_end).toLocaleDateString()}`
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(payment.due_date || payment.dueDate || '').toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₱{parseFloat(String(payment.amount_due || payment.amount || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        <span className="text-red-600">
                          ₱{(parseFloat(String(payment.amount_due || payment.amount || 0)) * 0.03).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        <span className={parseFloat(String(payment.balance || 0)) > 0 ? 'text-red-600' : 'text-green-600'}>
                          ₱{parseFloat(String(payment.balance || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                            payment.status || ''
                          )}`}
                        >
                          {payment.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => router.push(`/dashboard/payments/${payment.id}`)}
                            title="View Payment"
                            className="px-3 py-1 rounded text-sm flex items-center justify-center gap-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 transition-colors"
                          >
                            View
                          </button>
                          {canRecordPayments && (
                            <button 
                              onClick={() => router.push(`/dashboard/payments/${payment.id}?edit=true`)}
                              disabled={payment.balance === 0 || parseFloat(String(payment.balance || 0)) === 0 || contractStatus === 'terminated'}
                              title={contractStatus === 'terminated' ? "Cannot edit payments for terminated contracts" : payment.balance === 0 || parseFloat(String(payment.balance || 0)) === 0 ? "This payment is already paid" : "Edit this payment"}
                              className={`px-3 py-1 rounded text-sm flex items-center justify-center gap-1 transition-colors ${ contractStatus === 'terminated' || payment.balance === 0 || parseFloat(String(payment.balance || 0)) === 0 ? 'text-gray-400 bg-gray-50 cursor-not-allowed' : 'text-green-600 hover:text-green-900 hover:bg-green-50'}`}
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
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
