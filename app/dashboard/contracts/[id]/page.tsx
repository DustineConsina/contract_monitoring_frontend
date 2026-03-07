'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import apiClient from '@/lib/api-client'
import { Contract } from '@/types'

export default function ContractDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const contractId = params.id as string
  const [contract, setContract] = useState<Contract | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTerminateModal, setShowTerminateModal] = useState(false)
  const [isTerminating, setIsTerminating] = useState(false)
  const [terminationReason, setTerminationReason] = useState('')
  const [showRenewModal, setShowRenewModal] = useState(false)
  const [isRenewing, setIsRenewing] = useState(false)
  const [renewalDuration, setRenewalDuration] = useState('12')
  const [renewalRent, setRenewalRent] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    fetchContract()
  }, [contractId])

  const fetchContract = async () => {
    try {
      const response = await apiClient.getContract(contractId)
      // API returns {success, data} structure - extract the actual contract data
      const contractData = response.data || response
      
      console.log('🔍 Contract API Response:', contractData)
      console.log('📊 Tenant data:', contractData.tenant)
      console.log('💰 Payments data:', contractData.payments)
      
      // Map numeric fields to numbers for proper formatting
      const mappedContract = {
        ...contractData,
        monthlyRent: parseFloat(contractData.monthlyRent || 0),
        securityDeposit: parseFloat(contractData.securityDeposit || 0),
        interestRate: parseFloat(contractData.interestRate || 0),
      }
      
      console.log('✅ Mapped contract:', mappedContract)
      
      setContract(mappedContract)
    } catch (err: any) {
      console.error('❌ Error loading contract:', err)
      alert(err.message || 'Failed to load contract')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTerminate = async () => {
    if (!terminationReason.trim()) {
      alert('Please provide a reason for termination')
      return
    }
    setIsTerminating(true)
    try {
      await apiClient.terminateContract(contractId, terminationReason)
      setShowTerminateModal(false)
      setTerminationReason('')
      router.push('/dashboard/contracts')
    } catch (err: any) {
      alert(err.message || 'Failed to terminate contract')
      setIsTerminating(false)
    }
  }

  const handleRenew = async () => {
    if (!renewalDuration || parseInt(renewalDuration) < 1) {
      alert('Please specify a valid duration (minimum 1 month)')
      return
    }
    setIsRenewing(true)
    try {
      const renewalData: any = {
        duration_months: parseInt(renewalDuration),
      }
      if (renewalRent && parseFloat(renewalRent) > 0) {
        renewalData.monthlyRent = parseFloat(renewalRent)
      }
      await apiClient.renewContract(contractId, renewalData)
      setShowRenewModal(false)
      setRenewalDuration('12')
      setRenewalRent('')
      router.push('/dashboard/contracts')
    } catch (err: any) {
      alert(err.message || 'Failed to renew contract')
      setIsRenewing(false)
    }
  }

  const handleDownloadLease = async () => {
    if (!contract) return
    
    setIsDownloading(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.4:8000/api'
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${apiUrl}/contracts/${contract.id}/lease`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Response status:', response.status)
        console.error('Response body:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `lease-${contract.contractNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error('Download error:', err)
      alert(`Failed to download lease PDF: ${err.message}`)
    } finally {
      setIsDownloading(false)
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

  if (error || !contract) {
    return (
      <ProtectedRoute>
        <div className="space-y-6">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <p className="text-sm text-red-700">{error || 'Contract not found'}</p>
          </div>
          <Link
            href="/dashboard/contracts"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ← Back to Contracts
          </Link>
        </div>
      </ProtectedRoute>
    )
  }

  const getStatusBadge = (status: string) => {
    const upperStatus = status?.toUpperCase() || 'PENDING'
    const colors = {
      ACTIVE: 'bg-green-100 text-green-800',
      EXPIRED: 'bg-orange-100 text-orange-800',
      TERMINATED: 'bg-red-100 text-red-800',
      PENDING: 'bg-blue-100 text-blue-800',
    }
    return colors[upperStatus as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Contract Details</h2>
            <p className="text-gray-600">{contract.contractNumber}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link
              href="/dashboard/contracts"
              className="px-4 py-2 inline-flex items-center justify-center gap-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              ← Back
            </Link>
            <Link
              href={`/dashboard/contracts/${contractId}/edit`}
              className="px-4 py-2 inline-flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Edit
            </Link>
            <Link
              href={`/dashboard/contracts/${contractId}/qr`}
              className="px-4 py-2 inline-flex items-center justify-center gap-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              View QR
            </Link>
            <button
              onClick={handleDownloadLease}
              disabled={isDownloading}
              className="px-4 py-2 inline-flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
            >
              {isDownloading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Downloading...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  Download Lease
                </>
              )}
            </button>
            {contract.status?.toLowerCase() === 'active' && (
              <button
                onClick={() => setShowRenewModal(true)}
                className="px-4 py-2 inline-flex items-center justify-center gap-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
              >
                Renew
              </button>
            )}
            <button
              onClick={() => setShowTerminateModal(true)}
              className="px-4 py-2 inline-flex items-center justify-center gap-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
            >
              Terminate
            </button>
          </div>
        </div>

        {/* Contract Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contract Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Status</h3>
              <div className="flex items-center gap-4">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusBadge(contract.status?.toUpperCase() || 'PENDING')}`}>
                  {contract.status?.toUpperCase() || 'PENDING'}
                </span>
                <div className="text-sm text-gray-600">
                  Created on {contract.createdAt ? new Date(contract.createdAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>

            {/* Tenant Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tenant Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">👤</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {contract.tenant?.user?.name || contract.tenant?.contact_person || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">{contract.tenant?.user?.email || 'N/A'}</p>
                  </div>
                </div>
                {(contract.tenant?.user?.phone || contract.tenant?.contactNumber) && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Phone:</span> {contract.tenant?.user?.phone || contract.tenant?.contactNumber}
                  </div>
                )}
                {(contract.tenant?.user?.address || contract.tenant?.address) && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Address:</span> {contract.tenant?.user?.address || contract.tenant?.address}
                  </div>
                )}
              </div>
            </div>

            {/* DEBUG: Show tenant data structure */}
            {contract.tenant && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-4">🔍 DEBUG: Tenant Data Available</h3>
                <pre className="text-xs bg-white p-4 rounded overflow-auto max-h-60">
                  {JSON.stringify(contract.tenant, null, 2)}
                </pre>
              </div>
            )}

            {/* Business Details */}
            {contract.tenant && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Details</h3>
                <div className="space-y-3">
                  {contract.tenant.businessName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Business Name:</span>
                      <span className="font-medium">{contract.tenant.businessName}</span>
                    </div>
                  )}
                  {contract.tenant.businessType && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Business Type:</span>
                      <span className="font-medium">{contract.tenant.businessType}</span>
                    </div>
                  )}
                  {contract.tenant.tin && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">TIN:</span>
                      <span className="font-medium">{contract.tenant.tin}</span>
                    </div>
                  )}
                  {contract.tenant.businessAddress && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Business Address:</span>
                      <span className="font-medium">{contract.tenant.businessAddress}</span>
                    </div>
                  )}
                  {contract.tenant.contactNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contact Number:</span>
                      <span className="font-medium">{contract.tenant.contactNumber}</span>
                    </div>
                  )}
                  {!contract.tenant.businessName && !contract.tenant.businessType && !contract.tenant.tin && !contract.tenant.businessAddress && (
                    <p className="text-gray-500 text-sm">No business details available</p>
                  )}
                </div>
              </div>
            )}

            {/* Rental Space Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rental Space</h3>
              {contract.rentalSpace && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Space Code:</span>
                    <span className="font-medium">{contract.rentalSpace.spaceNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Space Name:</span>
                    <span className="font-medium">{contract.rentalSpace.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{contract.rentalSpace.type?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-medium">{contract.rentalSpace.squareMeters || 'N/A'} sqm</span>
                  </div>
                </div>
              )}
            </div>

            {/* Terms and Conditions */}
            {contract.terms && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms and Conditions</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{contract.terms}</p>
              </div>
            )}

            {/* DEBUG: Show payments data structure */}
            {contract.payments && (
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">💰 DEBUG: Payments Data (Count: {contract.payments.length})</h3>
                <pre className="text-xs bg-white p-4 rounded overflow-auto max-h-60">
                  {JSON.stringify(contract.payments, null, 2)}
                </pre>
              </div>
            )}

            {/* Payment Schedule */}
            {contract.payments && contract.payments.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Schedule</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Payment #</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Billing Period</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Due Date</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Amount Due</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Interest (3%)</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Total Amount</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Amount Paid</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contract.payments.map((payment: any) => (
                        <tr key={payment.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{payment.paymentNumber || 'N/A'}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {payment.billingPeriodStart 
                              ? new Date(payment.billingPeriodStart).toLocaleDateString()
                              : 'N/A'
                            }
                            {' - '}
                            {payment.billingPeriodEnd 
                              ? new Date(payment.billingPeriodEnd).toLocaleDateString()
                              : 'N/A'
                            }
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {payment.dueDate 
                              ? new Date(payment.dueDate).toLocaleDateString()
                              : 'N/A'
                            }
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            ₱{(parseFloat(payment.amountDue) || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-red-600">
                            ₱{(parseFloat(payment.interestAmount) || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-blue-600">
                            ₱{(parseFloat(payment.totalAmount) || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-green-600">
                            ₱{(parseFloat(payment.amountPaid) || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              (payment.status || '').toLowerCase() === 'paid' 
                                ? 'bg-green-100 text-green-800'
                                : (payment.status || '').toLowerCase() === 'overdue'
                                ? 'bg-red-100 text-red-800'
                                : (payment.status || '').toLowerCase() === 'partial'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {(payment.status || 'pending').toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contract Period */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Period</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Start Date</p>
                  <p className="font-medium text-gray-900">
                    {contract.startDate ? new Date(contract.startDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">End Date</p>
                  <p className="font-medium text-gray-900">
                    {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Monthly Rent</p>
                  <p className="text-xl font-bold text-blue-600">
                    ₱{(contract.monthlyRent || 0).toLocaleString()}
                  </p>
                </div>
                <div className="border-t pt-3">
                  <p className="text-sm text-gray-600">Interest (3%)</p>
                  <p className="text-lg font-semibold text-red-600">
                    ₱{((contract.monthlyRent || 0) * 0.03).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </p>
                </div>
                <div className="border-t pt-3 bg-blue-50 -mx-6 -mb-6 px-6 py-3 rounded-b-lg">
                  <p className="text-sm font-semibold text-gray-700">Total Monthly Charge</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ₱{((contract.monthlyRent || 0) * 1.03).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </p>
                </div>
                {(contract.securityDeposit ?? 0) > 0 && (
                  <div className="pt-2">
                    <p className="text-sm text-gray-600">Security Deposit</p>
                    <p className="font-medium text-gray-900">
                      ₱{(contract.securityDeposit || 0).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terminate Contract Modal */}
      {showTerminateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Terminate Contract?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to terminate contract <span className="font-semibold">{contract?.contractNumber}</span>? This action cannot be undone.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Termination Reason</label>
              <textarea
                value={terminationReason}
                onChange={(e) => setTerminationReason(e.target.value)}
                disabled={isTerminating}
                placeholder="Enter the reason for termination..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTerminateModal(false)
                  setTerminationReason('')
                }}
                disabled={isTerminating}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleTerminate}
                disabled={isTerminating || !terminationReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isTerminating ? 'Terminating...' : 'Terminate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Renew Contract Modal */}
      {showRenewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Renew Contract?</h3>
            <p className="text-gray-600 mb-6">
              Renew contract <span className="font-semibold">{contract?.contractNumber}</span> for {contract?.tenant?.firstName}.
            </p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (Months) *</label>
                <select
                  value={renewalDuration}
                  onChange={(e) => setRenewalDuration(e.target.value)}
                  disabled={isRenewing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="1">1 Month</option>
                  <option value="3">3 Months</option>
                  <option value="6">6 Months</option>
                  <option value="12">1 Year</option>
                  <option value="24">2 Years</option>
                  <option value="36">3 Years</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Monthly Rent (Optional)</label>
                <div className="flex items-center">
                  <span className="text-gray-700 mr-2">₱</span>
                  <input
                    type="number"
                    value={renewalRent}
                    onChange={(e) => setRenewalRent(e.target.value)}
                    disabled={isRenewing}
                    placeholder={`${contract?.monthlyRent || 0}`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    min="0"
                    step="0.01"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Leave empty to keep current rate: ₱{(contract?.monthlyRent || 0).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRenewModal(false)
                  setRenewalDuration('12')
                  setRenewalRent('')
                }}
                disabled={isRenewing}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRenew}
                disabled={isRenewing}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isRenewing ? 'Renewing...' : 'Renew'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  )
}
