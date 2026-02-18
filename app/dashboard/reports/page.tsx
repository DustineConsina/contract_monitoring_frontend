'use client'

import { useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import apiClient from '@/lib/api-client'

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string>('')
  const [reportData, setReportData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  })

  const reports = [
    { id: 'active-contracts', name: 'Active Contracts Report', icon: '📄' },
    { id: 'expired-contracts', name: 'Expired Contracts Report', icon: '⏰' },
    { id: 'delinquent-contracts', name: 'Delinquent Contracts Report', icon: '⚠️' },
    { id: 'payment-history', name: 'Payment History Report', icon: '💰' },
    { id: 'revenue-summary', name: 'Revenue Summary', icon: '📊' },
    { id: 'occupancy-rate', name: 'Space Occupancy Report', icon: '🏢' },
  ]

  const generateReport = async (reportId: string) => {
    setIsLoading(true)
    setSelectedReport(reportId)
    try {
      let data
      switch (reportId) {
        case 'active-contracts':
          data = await apiClient.getActiveContracts()
          break
        case 'expired-contracts':
          data = await apiClient.getExpiredContracts()
          break
        case 'delinquent-contracts':
          data = await apiClient.getDelinquentContracts()
          break
        case 'payment-history':
          data = await apiClient.getPaymentHistory(dateRange)
          break
        default:
          data = []
      }
      setReportData(data)
    } catch (err) {
      console.error('Failed to generate report:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const exportReport = (format: 'pdf' | 'excel') => {
    console.log(`Exporting report as ${format}`)
    // In a real implementation, this would call the backend to generate and download the file
    alert(`Export as ${format.toUpperCase()} functionality will be implemented in the backend`)
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
          <p className="text-gray-600">Generate and export system reports</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Available Reports</h3>
              <div className="space-y-2">
                {reports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => generateReport(report.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition ${
                      selectedReport === report.id
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{report.icon}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {report.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Date Range Filter */}
              {selectedReport === 'payment-history' && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium text-gray-900 mb-3">Date Range</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) =>
                          setDateRange({ ...dateRange, startDate: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">End Date</label>
                      <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) =>
                          setDateRange({ ...dateRange, endDate: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <button
                      onClick={() => generateReport('payment-history')}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                    >
                      Apply Filter
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Report Display */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              {!selectedReport ? (
                <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-lg font-medium">Select a report to generate</p>
                  <p className="text-sm mt-2">Choose from the available reports on the left</p>
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
                    <p className="mt-4 text-gray-600">Generating report...</p>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  {/* Report Header */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {reports.find((r) => r.id === selectedReport)?.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Generated on {new Date().toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => exportReport('pdf')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                      >
                        📄 PDF
                      </button>
                      <button
                        onClick={() => exportReport('excel')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                      >
                        📊 Excel
                      </button>
                    </div>
                  </div>

                  {/* Report Content */}
                  <div className="space-y-4">
                    {reportData && Array.isArray(reportData) ? (
                      reportData.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b-2">
                              <tr>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                  Contract #
                                </th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                  Tenant
                                </th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                  Space
                                </th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                  Amount
                                </th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {reportData.map((item: any, index: number) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-4 py-3">{item.contractNumber}</td>
                                  <td className="px-4 py-3">
                                    {item.tenant?.firstName} {item.tenant?.lastName}
                                  </td>
                                  <td className="px-4 py-3">
                                    {item.rentalSpace?.spaceNumber}
                                  </td>
                                  <td className="px-4 py-3">
                                    ₱{item.monthlyRent?.toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                      {item.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm text-gray-600">
                              Total Records: {reportData.length}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          No data available for this report
                        </div>
                      )
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        Report data format not supported
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
