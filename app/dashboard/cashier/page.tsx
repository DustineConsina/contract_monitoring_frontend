'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import apiClient from '@/lib/api-client'
import { PFDALogo } from '@/components/PFDALogo'

interface CollectiblePayment {
  id: number
  paymentNumber: string
  contractNumber: string
  tenant: string
  amountDue: number
  interest: number
  total: number
  balance: number
  dueDate: string
  status: string
  daysOverdue: number
}

interface TodaysCollection {
  date: string
  total_collected: string
  payment_count: number
}

interface PaymentTrend {
  month: string
  paid: number
  pending: number
  overdue: number
  total: number
}

export default function CashierDashboard() {
  const [todaysData, setTodaysData] = useState<TodaysCollection | null>(null)
  const [collectibles, setCollectibles] = useState<CollectiblePayment[]>([])
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all')
  const [selectedPayment, setSelectedPayment] = useState<CollectiblePayment | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordData, setRecordData] = useState({
    amount: '',
    method: 'cash',
    remarks: '',
  })
  const [recordingMessage, setRecordingMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [paymentTrends, setPaymentTrends] = useState<PaymentTrend[]>([])
  const [trendMonth, setTrendMonth] = useState('')
  const [loading, setLoading] = useState(true)

  // Helper to safely parse and format dates
  const formatDate = (dateInput: any): string => {
    try {
      let date: Date | null = null
      
      // Handle string dates (ISO format, timestamp strings, etc)
      if (typeof dateInput === 'string') {
        // Try parsing ISO format or other standard formats
        date = new Date(dateInput)
      } else if (typeof dateInput === 'number') {
        // Timestamp
        date = new Date(dateInput)
      } else if (dateInput instanceof Date) {
        date = dateInput
      }
      
      if (!date || isNaN(date.getTime())) {
        return 'Invalid date'
      }
      
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    } catch (e) {
      console.warn('Error formatting date:', dateInput, e)
      return 'Invalid date'
    }
  }

  const getMonthFromDate = (dateInput: any): string => {
    try {
      let date: Date | null = null
      
      if (typeof dateInput === 'string') {
        date = new Date(dateInput)
      } else if (typeof dateInput === 'number') {
        date = new Date(dateInput)
      } else if (dateInput instanceof Date) {
        date = dateInput
      }
      
      if (!date || isNaN(date.getTime())) {
        return 'Unknown'
      }
      
      return date.toLocaleString('en-US', { year: 'numeric', month: 'short' })
    } catch (e) {
      console.warn('Error getting month from date:', dateInput, e)
      return 'Unknown'
    }
  }

  useEffect(() => {
    loadCashierData()
    loadPaymentTrends()
  }, [filterStatus])

  const loadPaymentTrends = async () => {
    try {
      // Get payment reports from the last 6 months
      const response = await apiClient.get('/reports/payments?status=all')
      let payments = []
      
      // Handle nested response structure: { success, data: { payments: [...], summary: {...} } }
      if (response.data?.data?.payments && Array.isArray(response.data.data.payments)) {
        payments = response.data.data.payments
      } else if (response.data?.payments && Array.isArray(response.data.payments)) {
        payments = response.data.payments
      } else if (Array.isArray(response.data?.data)) {
        payments = response.data.data
      } else if (Array.isArray(response.data)) {
        payments = response.data
      }
      
      if (!Array.isArray(payments) || payments.length === 0) {
        console.warn('No payment data available:', { response, payments })
        setPaymentTrends([])
        return
      }
      
      // Group payments by month
      const monthlyData: Record<string, { paid: number; pending: number; overdue: number; total: number }> = {}
      
      payments.forEach((payment: any) => {
        // Get the month key using the safe helper - use camelCase field names
        const monthKey = getMonthFromDate(payment.dueDate || payment.due_date || payment.createdAt || payment.created_at)
        
        if (!monthKey || monthKey === 'Unknown') {
          console.warn('Could not extract month from payment:', payment)
          return
        }
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { paid: 0, pending: 0, overdue: 0, total: 0 }
        }
        
        const amount = parseFloat(payment.totalAmount || payment.total_amount || payment.amount || payment.total || 0)
        monthlyData[monthKey].total += amount
        
        const status = (payment.status || '').toLowerCase()
        if (status === 'paid') {
          monthlyData[monthKey].paid += amount
        } else if (status === 'overdue') {
          monthlyData[monthKey].overdue += amount
        } else {
          monthlyData[monthKey].pending += amount
        }
      })
      
      // Sort by month and convert to array
      const trends = Object.entries(monthlyData)
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .slice(-6)
        .map(([month, data]) => ({
          month,
          ...data
        }))
      
      console.log('Payment trends loaded:', trends)
      setPaymentTrends(trends)
      if (trends.length > 0 && !trendMonth) {
        setTrendMonth(trends[trends.length - 1].month)
      }
    } catch (error) {
      console.error('Error loading payment trends:', error)
      setPaymentTrends([])
    }
  }

  const loadCashierData = async () => {
    try {
      setLoading(true)
      const [todaysRes, collectiblesRes] = await Promise.all([
        apiClient.get('/cashier/todays-collection'),
        apiClient.get(`/cashier/collectibles?status=${filterStatus}`),
      ])

      setTodaysData(todaysRes.data)
      // Map backend response to ensure camelCase field names
      const payments = collectiblesRes.data.payments || []
      const mappedPayments = payments.map((p: any) => ({
        id: p.id,
        paymentNumber: p.paymentNumber || p.payment_number,
        contractNumber: p.contractNumber || p.contract_number,
        tenant: p.tenant,
        amountDue: parseFloat(String(p.amountDue || p.amount_due || 0)),
        interest: parseFloat(String(p.interest || 0)),
        total: parseFloat(String(p.total || 0)),
        balance: parseFloat(String(p.balance || 0)),
        dueDate: p.dueDate || p.due_date,
        status: p.status,
        daysOverdue: p.daysOverdue || p.days_overdue || 0,
      }))
      setCollectibles(mappedPayments)
    } catch (error) {
      console.error('Error loading cashier data:', error)
      setCollectibles([])
    } finally {
      setLoading(false)
    }
  }

  const handleRecordPayment = async () => {
    if (!selectedPayment || !recordData.amount) {
      setRecordingMessage({ type: 'error', message: 'Please enter amount' })
      return
    }

    try {
      setIsRecording(true)
      await apiClient.post(`/cashier/payments/${selectedPayment.id}/record`, {
        amount: parseFloat(recordData.amount),
        payment_method: recordData.method,
        remarks: recordData.remarks,
      })

      setRecordingMessage({ type: 'success', message: '✓ Payment recorded successfully!' })
      
      // Wait 2 seconds before closing to show success message
      setTimeout(() => {
        setSelectedPayment(null)
        setRecordData({ amount: '', method: 'cash', remarks: '' })
        setRecordingMessage(null)
        // Reload data after closing modal
        setTimeout(() => loadCashierData(), 100)
      }, 2000)
    } catch (error: any) {
      setRecordingMessage({ type: 'error', message: error.response?.data?.message || 'Failed to record payment' })
      setIsRecording(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      partial: 'bg-orange-100 text-orange-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getUrgencyColor = (status: string, daysOverdue: number) => {
    if (status !== 'overdue') return 'bg-white'
    if (daysOverdue > 30) return 'bg-red-50 border-l-4 border-red-600'
    if (daysOverdue > 7) return 'bg-orange-50 border-l-4 border-orange-600'
    return 'bg-yellow-50 border-l-4 border-yellow-600'
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20"><PFDALogo /></div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cashier Dashboard</h1>
              <p className="text-gray-600">Record payments and track daily collection</p>
            </div>
          </div>
        </div>

        {/* Today's Collection Card */}
        <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <p className="text-sm opacity-90 mb-1">Today's Collection</p>
          <p className="text-4xl font-bold">
            ₱{todaysData?.total_collected || '0.00'}
          </p>
          <p className="mt-2 text-sm">{todaysData?.payment_count || 0} payments recorded</p>
        </div>

        {/* Recording Modal */}
        {selectedPayment && (
          <>
            <div 
              className="fixed inset-0 backdrop-blur-sm z-40" 
              onClick={(e) => {
                // Only close if not recording and click is directly on backdrop
                if (!isRecording && e.target === e.currentTarget) {
                  setSelectedPayment(null)
                  setRecordData({ amount: '', method: 'cash', remarks: '' })
                  setRecordingMessage(null)
                }
              }}
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
                <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Record Payment</h2>
                  <button
                    onClick={() => {
                      if (!isRecording) {
                        setSelectedPayment(null)
                        setRecordData({ amount: '', method: 'cash', remarks: '' })
                        setRecordingMessage(null)
                      }
                    }}
                    disabled={isRecording}
                    className="text-gray-500 hover:text-gray-700 text-2xl disabled:opacity-50"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); handleRecordPayment(); }} className="p-6 space-y-4">
                  {/* Success/Error Message */}
                  {recordingMessage && (
                    <div className={`p-4 rounded-lg text-sm font-bold ${
                      recordingMessage.type === 'success' 
                        ? 'bg-green-100 text-green-800 border-2 border-green-500' 
                        : 'bg-red-100 text-red-800 border-2 border-red-500'
                    }`}>
                      {recordingMessage.message}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-sm text-gray-600">Tenant</p>
                      <p className="font-bold text-lg">{selectedPayment.tenant}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-sm text-gray-600">Contract</p>
                      <p className="font-bold text-lg">{selectedPayment.contractNumber}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Current Balance</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ₱{parseFloat(String(selectedPayment.balance || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount to Collect (₱)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      max={selectedPayment.balance}
                      value={recordData.amount}
                      onChange={(e) =>
                        setRecordData({ ...recordData, amount: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Enter amount"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum: ₱{parseFloat(String(selectedPayment.balance || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                    <select
                      value={recordData.method}
                      onChange={(e) =>
                        setRecordData({ ...recordData, method: e.target.value })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="cash">Cash</option>
                      <option value="check">Check</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                    <textarea
                      value={recordData.remarks}
                      onChange={(e) =>
                        setRecordData({ ...recordData, remarks: e.target.value })
                      }
                      rows={2}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Optional notes"
                    />
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <button
                      type="submit"
                      disabled={isRecording || !recordData.amount}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                    >
                      {isRecording ? '⏳ Recording...' : '✓ Record Payment'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isRecording) {
                          setSelectedPayment(null)
                          setRecordData({ amount: '', method: 'cash', remarks: '' })
                          setRecordingMessage(null)
                        }
                      }}
                      disabled={isRecording}
                      className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}

        {/* Payment Trends Chart */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Payment Trends (Last 6 Months)</h2>
          
          {paymentTrends.length > 0 && (
            <div className="space-y-6">
              {/* Month selector */}
              <div className="max-w-xs">
                <label className="block text-sm font-medium mb-2 text-gray-700">Filter by Month</label>
                <select
                  value={trendMonth}
                  onChange={(e) => setTrendMonth(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500"
                >
                  {paymentTrends.map((trend) => (
                    <option key={trend.month} value={trend.month}>
                      {trend.month}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chart */}
              <div className="bg-gradient-to-b from-blue-50 to-gray-50 rounded-lg p-6 overflow-x-auto">
                {paymentTrends.length > 0 ? (
                  <div>
                    <div className="flex items-end justify-between gap-4 min-h-96 pb-6">
                      {paymentTrends.map((trend) => {
                        const maxAmount = Math.max(...paymentTrends.map(t => t.total)) || 1000
                        const paidPercent = maxAmount > 0 ? (trend.paid / maxAmount) * 100 : 0
                        const pendingPercent = maxAmount > 0 ? (trend.pending / maxAmount) * 100 : 0
                        const overduePercent = maxAmount > 0 ? (trend.overdue / maxAmount) * 100 : 0
                        
                        return (
                          <div key={trend.month} className="flex flex-col items-center gap-3 flex-shrink-0" style={{ width: 80 }}>
                            <div className="w-full rounded-t-lg bg-white border-2 border-gray-300 overflow-hidden h-80 flex flex-col-reverse shadow-md">
                              {paidPercent > 0 && (
                                <div
                                  className="bg-gradient-to-t from-green-500 to-green-400 w-full transition-all hover:from-green-600 hover:to-green-500"
                                  style={{ height: `${paidPercent}%`, minHeight: paidPercent > 0 ? '4px' : '0' }}
                                  title={`Paid: ₱${trend.paid.toLocaleString()}`}
                                />
                              )}
                              {pendingPercent > 0 && (
                                <div
                                  className="bg-gradient-to-t from-yellow-500 to-yellow-400 w-full transition-all hover:from-yellow-600 hover:to-yellow-500"
                                  style={{ height: `${pendingPercent}%`, minHeight: pendingPercent > 0 ? '4px' : '0' }}
                                  title={`Pending: ₱${trend.pending.toLocaleString()}`}
                                />
                              )}
                              {overduePercent > 0 && (
                                <div
                                  className="bg-gradient-to-t from-red-500 to-red-400 w-full transition-all hover:from-red-600 hover:to-red-500"
                                  style={{ height: `${overduePercent}%`, minHeight: overduePercent > 0 ? '4px' : '0' }}
                                  title={`Overdue: ₱${trend.overdue.toLocaleString()}`}
                                />
                              )}
                            </div>
                            <p className="text-xs font-bold text-gray-800 text-center whitespace-nowrap">{trend.month}</p>
                            <p className="text-xs text-gray-600 font-semibold">₱{(trend.total / 1000).toFixed(1)}k</p>
                          </div>
                        )
                      })}
                    </div>

                    {/* Legend */}
                    <div className="mt-6 flex flex-wrap gap-6 justify-center pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-b from-green-500 to-green-400 rounded shadow"></div>
                        <span className="text-sm font-medium text-gray-700">Paid</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-b from-yellow-500 to-yellow-400 rounded shadow"></div>
                        <span className="text-sm font-medium text-gray-700">Pending</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-b from-red-500 to-red-400 rounded shadow"></div>
                        <span className="text-sm font-medium text-gray-700">Overdue</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No payment data available
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {paymentTrends.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Payment Trends (Last 6 Months)</h2>
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-lg">No payment data available yet</p>
              <p className="text-gray-400 text-sm mt-2">Payment trends will appear once payments are recorded</p>
            </div>
          </div>
        )}

        {/* Filter & Payments to Collect */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">
              {filterStatus === 'paid' ? 'Paid Payments' : 'Payments to Collect'}
            </h2>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-4 py-2 rounded-lg ${
                  filterStatus === 'pending'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilterStatus('overdue')}
                className={`px-4 py-2 rounded-lg ${
                  filterStatus === 'overdue'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Overdue
              </button>
              <button
                onClick={() => setFilterStatus('paid')}
                className={`px-4 py-2 rounded-lg ${
                  filterStatus === 'paid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Paid
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gray-400 border-r-transparent" />
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          ) : collectibles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No payments to collect
            </div>
          ) : (
            <div className="space-y-3">
              {collectibles.map((payment) => (
                <div
                  key={payment.id}
                  onClick={() => payment.status !== 'paid' && setSelectedPayment(payment)}
                  className={`p-4 rounded-lg ${
                    payment.status === 'paid'
                      ? 'bg-gray-50 cursor-default'
                      : 'cursor-pointer hover:shadow-md'
                  } transition ${getUrgencyColor(
                    payment.status,
                    payment.daysOverdue
                  )}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-bold text-lg">{payment.tenant}</p>
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(
                            payment.status
                          )}`}
                        >
                          {payment.status.toUpperCase()}
                        </span>
                        {payment.daysOverdue > 0 && (
                          <span className="px-2 py-1 rounded text-xs font-bold bg-red-600 text-white">
                            {payment.daysOverdue} DAYS OVERDUE
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {payment.contractNumber} • Due: {formatDate(payment.dueDate)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Amount: ₱{parseFloat(String(payment.amountDue || 0)).toLocaleString()} + Interest: ₱
                        {parseFloat(String(payment.interest || 0)).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {payment.status === 'paid' ? 'Amount Paid' : 'Balance Due'}
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          payment.status === 'paid' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        ₱{parseFloat(String(payment.balance || 0)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
