'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import apiClient from '@/lib/api-client'
import { Message } from '@/types'

export default function MessagesPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [newMessage, setNewMessage] = useState({
    subject: '',
    content: '',
    receiverId: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCompose, setShowCompose] = useState(false)

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      const data = await apiClient.getMessages()
      setMessages(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load messages')
      setMessages([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiClient.sendMessage(newMessage)
      setNewMessage({ subject: '', content: '', receiverId: '' })
      setShowCompose(false)
      fetchMessages()
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  const handleSelectMessage = async (message: Message) => {
    setSelectedMessage(message)
    if (!message.isRead) {
      try {
        await apiClient.markMessageAsRead(message.id)
        fetchMessages()
      } catch (err) {
        console.error('Failed to mark as read:', err)
      }
    }
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
            <p className="text-gray-600">Communication between staff and tenants</p>
          </div>
          <button
            onClick={() => setShowCompose(!showCompose)}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            ✉️ New Message
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Compose Message Modal */}
        {showCompose && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">New Message</h3>
                  <button
                    onClick={() => setShowCompose(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recipient (Leave empty for broadcast to all)
                    </label>
                    <input
                      type="text"
                      value={newMessage.receiverId}
                      onChange={(e) =>
                        setNewMessage({ ...newMessage, receiverId: e.target.value })
                      }
                      placeholder="Recipient ID"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={newMessage.subject}
                      onChange={(e) =>
                        setNewMessage({ ...newMessage, subject: e.target.value })
                      }
                      placeholder="Message subject"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      value={newMessage.content}
                      onChange={(e) =>
                        setNewMessage({ ...newMessage, content: e.target.value })
                      }
                      placeholder="Type your message here..."
                      required
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCompose(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Send Message
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Messages Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900">Inbox</h3>
            </div>
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
                </div>
              ) : messages.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No messages</div>
              ) : (
                messages.map((message) => (
                  <button
                    key={message.id}
                    onClick={() => handleSelectMessage(message)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                      !message.isRead ? 'bg-blue-50' : ''
                    } ${selectedMessage?.id === message.id ? 'bg-blue-100' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-medium text-sm text-gray-900">
                        {message.sender?.firstName} {message.sender?.lastName}
                      </span>
                      {!message.isRead && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      )}
                    </div>
                    <div className="text-sm text-gray-700 font-medium mb-1">
                      {message.subject || 'No subject'}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {message.content}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(message.createdAt).toLocaleString()}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            {selectedMessage ? (
              <div className="p-6">
                <div className="border-b pb-4 mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {selectedMessage.subject || 'No subject'}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">
                      From: {selectedMessage.sender?.firstName}{' '}
                      {selectedMessage.sender?.lastName}
                    </span>
                    <span>•</span>
                    <span>{new Date(selectedMessage.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedMessage.content}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full p-12 text-gray-500">
                Select a message to read
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
