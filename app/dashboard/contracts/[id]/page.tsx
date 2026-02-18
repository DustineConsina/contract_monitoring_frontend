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

  useEffect(() => {
    fetchContract()
  }, [contractId])

  const fetchContract = async () => {
    try {
      const data = await apiClient.getContract(contractId)
      setContract(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load contract')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTerminate = async () => {
    if (!confirm('Are you sure you want to terminate this contract?')) return

    try {
      await apiClient.deleteContract(contractId)
      router.push('/dashboard/contracts')
    } catch (err: any) {
      setError(err.message || 'Failed to terminate contract')
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
    const colors = {
      ACTIVE: 'bg-green-100 text-green-800',
      EXPIRED: 'bg-orange-100 text-orange-800',
      TERMINATED: 'bg-red-100 text-red-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
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
          <div className="flex gap-2">
            <Link
              href="/dashboard/contracts"
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              ← Back
            </Link>
            <Link
              href={`/dashboard/contracts/${contractId}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              ✏️ Edit
            </Link>
            <Link
              href={`/dashboard/contracts/${contractId}/qr`}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              📱 View QR
            </Link>
            <button
              onClick={handleTerminate}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              ❌ Terminate
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
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusBadge(contract.status)}`}>
                  {contract.status}
                </span>
                <div className="text-sm text-gray-600">
                  Created on {new Date(contract.createdAt).toLocaleDateString()}
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
                      {contract.tenant?.firstName} {contract.tenant?.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{contract.tenant?.email}</p>
                  </div>
                </div>
                {contract.tenant?.contactNumber && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Phone:</span> {contract.tenant.contactNumber}
                  </div>
                )}
                {contract.tenant?.address && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Address:</span> {contract.tenant.address}
                  </div>
                )}
              </div>
            </div>

            {/* Rental Space Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rental Space</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Space Number:</span>
                  <span className="font-medium">{contract.rentalSpace?.spaceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{contract.rentalSpace?.type?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-medium">{contract.rentalSpace?.squareMeters} sqm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium">{contract.rentalSpace?.location}</span>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            {contract.terms && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms and Conditions</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{contract.terms}</p>
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
                    {new Date(contract.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">End Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(contract.endDate).toLocaleDateString()}
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
                  <p className="text-2xl font-bold text-blue-600">
                    ₱{contract.monthlyRent.toLocaleString()}
                  </p>
                </div>
                {contract.securityDeposit > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Security Deposit</p>
                    <p className="font-medium text-gray-900">
                      ₱{contract.securityDeposit.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
