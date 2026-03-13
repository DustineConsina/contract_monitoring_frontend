'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import apiClient from '@/lib/api-client'

export default function EditTenantPage() {
  const router = useRouter()
  const params = useParams()
  const tenantId = params.id as string

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    address: '', // Personal address (user table)
    businessName: '',
    businessType: '',
    businessAddress: '', // Business address (tenant table)
    tin: '',
    profilePicture: null as File | null,
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  useEffect(() => {
    fetchTenant()
  }, [tenantId])

  const fetchTenant = async () => {
    try {
      const response = await apiClient.getTenant(tenantId)
      const tenant = response.data || response
      
      console.log('Tenant data loaded:', tenant)
      
      // Split full name into first and last name
      const fullName = tenant.contactPerson || tenant.firstName || ''
      const nameParts = fullName.trim().split(' ')
      const firstName = nameParts.slice(0, -1).join(' ') || nameParts[0]
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''
      
      console.log('Extracted name parts:', { firstName, lastName })
      console.log('User data:', tenant.user)
      
      setFormData({
        firstName: firstName,
        lastName: lastName,
        email: tenant.user?.email || tenant.email || '',
        contactNumber: tenant.contactNumber || tenant.user?.phone || '',
        address: tenant.user?.address || '', // FIX: Use user.address, not business_address
        businessName: tenant.businessName || '',
        businessType: tenant.businessType || '',
        businessAddress: tenant.businessAddress || '', // FIX: Keep business_address separate
        tin: tenant.tin || '',
        profilePicture: null,
      })
      setError(null)
      setDebugInfo(null)
    } catch (err: any) {
      console.error('Error loading tenant:', err)
      setError(err.message || 'Failed to load tenant data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target
    
    // Handle file input separately
    if (e.target instanceof HTMLInputElement && e.target.type === 'file') {
      setFormData((prev) => ({ 
        ...prev, 
        [name]: (e.target as HTMLInputElement).files?.[0] || null 
      }))
    } else {
      const { value } = e.target
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setDebugInfo(null)

    try {
      // Combine firstName and lastName back into contact_person
      const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(' ').trim()
      
      const submitData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        contactPerson: fullName,
        email: formData.email,
        contactNumber: formData.contactNumber,
        address: formData.address, // Personal address
        businessName: formData.businessName,
        businessType: formData.businessType,
        businessAddress: formData.businessAddress, // Business address (separate!)
        tin: formData.tin,
      }
      
      console.log('Submitting data:', submitData)
      setDebugInfo(`Sending: ${JSON.stringify(submitData, null, 2)}`)
      
      const response = await apiClient.updateTenant(tenantId, submitData)
      console.log('Update response:', response)
      
      // Upload profile picture if provided
      if (formData.profilePicture) {
        try {
          console.log('Starting profile picture upload...')
          const profileFormData = new FormData()
          profileFormData.append('profile_picture', formData.profilePicture)
          
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://contractmonitoringbackend-production.up.railway.app/api'
          console.log('Upload URL:', `${apiUrl}/tenants/${tenantId}/upload-picture`)
          console.log('File:', formData.profilePicture.name, formData.profilePicture.size)
          
          const uploadResponse = await fetch(`${apiUrl}/tenants/${tenantId}/upload-picture`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            },
            body: profileFormData,
          })
          
          console.log('Upload response status:', uploadResponse.status, uploadResponse.statusText)
          
          const responseText = await uploadResponse.text()
          console.log('Upload response text:', responseText)
          
          if (!uploadResponse.ok) {
            console.error('Picture upload HTTP error:', uploadResponse.status, responseText)
            throw new Error(`Upload failed: ${uploadResponse.status} - ${responseText.substring(0, 200)}`)
          }
          
          let uploadResult
          try {
            uploadResult = JSON.parse(responseText)
          } catch (parseErr) {
            console.error('Failed to parse upload response as JSON:', parseErr)
            throw new Error('Invalid response from server')
          }
          
          console.log('Picture uploaded successfully:', uploadResult)
          
          // Show success notification
          const notification = document.createElement('div')
          notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
          notification.innerHTML = '✓ Profile picture updated successfully'
          document.body.appendChild(notification)
          
          // Wait a bit for the server to process, then navigate
          setTimeout(() => {
            notification.remove()
            router.push(`/dashboard/tenants/${tenantId}`)
          }, 2000)
        } catch (uploadErr: any) {
          console.error('Failed to upload profile picture:', uploadErr)
          
          // Show error notification with actual error message
          const notification = document.createElement('div')
          notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-sm'
          const errorMsg = uploadErr.message || 'Unknown error'
          notification.innerHTML = `✗ Picture upload failed: ${errorMsg}`
          document.body.appendChild(notification)
          
          console.log('Error details:', {
            message: uploadErr.message,
            stack: uploadErr.stack
          })
          
          setTimeout(() => {
            notification.remove()
            router.push(`/dashboard/tenants/${tenantId}`)
          }, 4000)
        }
      } else {
        // No picture upload, navigate immediately
        router.push(`/dashboard/tenants/${tenantId}`)
      }
    } catch (err: any) {
      console.error('Error updating tenant:', err)
      
      // Show detailed error information
      let errorMessage = err.message || 'Failed to update tenant'
      let details = ''
      
      if (err.response?.data?.errors) {
        details = JSON.stringify(err.response.data.errors, null, 2)
        errorMessage = err.response.data.message || errorMessage
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      }
      
      setError(errorMessage)
      if (details) {
        setDebugInfo(`Errors: ${details}`)
      }
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
            <p className="mt-4 text-gray-600">Loading tenant...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Edit Tenant</h2>
          <p className="text-gray-600">Update tenant information</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <p className="text-sm font-semibold text-red-700">Error: {error}</p>
            {debugInfo && (
              <pre className="text-xs text-red-600 mt-2 bg-red-100 p-2 rounded overflow-auto max-h-48">
                {debugInfo}
              </pre>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Juan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Dela Cruz"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="juan@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="+63 912 345 6789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  placeholder="Enter complete address"
                />
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Enter business name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Identification Number (TIN)
                </label>
                <input
                  type="text"
                  value={formData.tin}
                  onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="e.g., 123-456-789-012"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Type
                </label>
                <select
                  value={formData.businessType}
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Select business type</option>
                  <option value="sole_proprietor">Sole Proprietor</option>
                  <option value="partnership">Partnership</option>
                  <option value="corporation">Corporation</option>
                  <option value="cooperative">Cooperative</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Address
                </label>
                <textarea
                  rows={3}
                  value={formData.businessAddress}
                  onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  placeholder="Enter complete business address"
                />
              </div>
            </div>
          </div>

          {/* Profile Picture Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture (Optional)</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Photo
                </label>
                <input
                  type="file"
                  name="profilePicture"
                  accept="image/*"
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">Accepts all image formats. Max file size: 5MB</p>
                {formData.profilePicture && (
                  <p className="text-xs text-green-600 mt-1">✓ File selected: {formData.profilePicture.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              title="Update Tenant"
              className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              💾
            </button>
            <button
              type="button"
              onClick={() => router.push(`/dashboard/tenants/${tenantId}`)}
              title="Cancel"
              className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              ✕
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  )
}
