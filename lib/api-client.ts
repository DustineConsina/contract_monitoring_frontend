// API Client for communicating with backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

interface ApiError {
  message: string
  status: number
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (options.headers) {
      Object.assign(headers, options.headers)
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      })

      // Get content type
      const contentType = response.headers.get('content-type')

      if (!response.ok) {
        // Check if response is HTML (404 page, etc.)
        if (contentType?.includes('text/html')) {
          throw {
            message: `Backend endpoint not found: ${this.baseUrl}${endpoint}`,
            status: response.status,
          }
        }

        // Try to parse JSON error
        try {
          const errorData = await response.json()
          throw {
            message: errorData.message || errorData.error || 'Request failed',
            status: response.status,
          }
        } catch (e) {
          // If JSON parse fails, use status text
          throw {
            message: `Error ${response.status}: ${response.statusText}`,
            status: response.status,
          }
        }
      }

      // Check if successful response is HTML (shouldn't be)
      if (contentType?.includes('text/html')) {
        throw {
          message: 'Backend returned HTML instead of JSON. Check backend configuration.',
          status: 500,
        }
      }

      return response.json()
    } catch (error: any) {
      // Network errors (backend not running)
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw {
          message: `Cannot connect to backend at ${this.baseUrl}. Make sure backend is running.`,
          status: 0,
        }
      }
      // Re-throw our formatted errors
      throw error
    }
  }

  // Authentication
  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async register(data: any) {
    return this.request<{ token: string; user: any }>('/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async logout() {
    return this.request('/logout', { method: 'POST' })
  }

  async getCurrentUser() {
    return this.request<any>('/me')
  }

  // Contracts
  async getContracts(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return this.request<any>(`/contracts${query}`)
  }

  async getContract(id: string) {
    return this.request<any>(`/contracts/${id}`)
  }

  async createContract(data: any) {
    return this.request<any>('/contracts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateContract(id: string, data: any) {
    return this.request<any>(`/contracts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteContract(id: string) {
    return this.request<any>(`/contracts/${id}`, {
      method: 'DELETE',
    })
  }

  async getContractQRCode(id: string) {
    return this.request<{ qrCode: string }>(`/contracts/${id}/qr-code`)
  }

  // Payments
  async getPayments(contractId?: string) {
    const query = contractId ? `?contractId=${contractId}` : ''
    return this.request<any>(`/payments${query}`)
  }

  async createPayment(data: any) {
    return this.request<any>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updatePayment(id: string, data: any) {
    return this.request<any>(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Rental Spaces
  async getRentalSpaces(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return this.request<any>(`/rental-spaces${query}`)
  }

  async getRentalSpace(id: string) {
    return this.request<any>(`/rental-spaces/${id}`)
  }

  // Messages/Chat
  async getMessages(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return this.request<any>(`/messages${query}`)
  }

  async sendMessage(data: any) {
    return this.request<any>('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async markMessageAsRead(id: string) {
    return this.request<any>(`/messages/${id}/read`, {
      method: 'PUT',
    })
  }

  // Reports
  async getActiveContracts() {
    return this.request<any>('/reports/active-contracts')
  }

  async getExpiredContracts() {
    return this.request<any>('/reports/expired-contracts')
  }

  async getDelinquentContracts() {
    return this.request<any>('/reports/delinquent-contracts')
  }

  async getPaymentHistory(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return this.request<any>(`/reports/payment-history${query}`)
  }

  async getDashboardStats() {
    return this.request<any>('/reports/dashboard-stats')
  }

  // Notifications
  async getNotifications() {
    return this.request<any>('/notifications')
  }

  async markNotificationAsRead(id: string) {
    return this.request<any>(`/notifications/${id}/read`, {
      method: 'PUT',
    })
  }

  // Audit Logs
  async getAuditLogs(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return this.request<any>(`/audit-logs${query}`)
  }

  // Tenants/Users
  async getTenants(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return this.request<any>(`/tenants${query}`)
  }

  async getTenant(id: string) {
    return this.request<any>(`/tenants/${id}`)
  }

  async getTenantById(id: number) {
    return this.request<any>(`/tenants/${id}`)
  }

  async createTenant(data: any) {
    return this.request<any>('/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateTenant(id: string, data: any) {
    return this.request<any>(`/tenants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }
}

export const apiClient = new ApiClient(API_URL)
export default apiClient
