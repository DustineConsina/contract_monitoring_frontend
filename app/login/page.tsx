'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="flex min-h-screen items-center justify-center px-4 relative"
      style={{
        backgroundImage: 'url(/background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Minimal Overlay */}
      <div className="absolute inset-0 bg-black/20" />
      
      <div className="w-full max-w-sm relative z-10">
        {/* Transparent Blue Ocean Card with Fish */}
        <div className="relative overflow-hidden rounded-2xl shadow-2xl p-8 border border-blue-300/30">
          {/* Ocean Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/60 via-blue-500/60 to-cyan-400/60 backdrop-blur-sm" />
          
          {/* Swimming Fish Animation */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {/* Fish 1 - Pufferfish 🐡 - Diagonal down-right */}
            <div 
              className="absolute text-3xl"
              style={{
                animation: 'swim-diagonal-1 6s infinite ease-in-out',
                top: '10%',
                left: '-40px',
              }}
            >
              🐡
            </div>
            
            {/* Fish 2 - Clownfish 🐠 - Curved up-left */}
            <div 
              className="absolute text-4xl"
              style={{
                animation: 'swim-curved-1 8s infinite ease-in-out 1s',
                top: '80%',
                right: '-50px',
              }}
            >
              🐠
            </div>

            {/* Fish 3 - Tropical Fish 🐟 - Horizontal fast */}
            <div 
              className="absolute text-3xl"
              style={{
                animation: 'swim-horizontal-fast 5s infinite ease-in-out 2s',
                top: '45%',
                left: '-45px',
              }}
            >
              🐟
            </div>

            {/* Fish 4 - Blowfish 🐙 - Spiral pattern */}
            <div 
              className="absolute text-2xl"
              style={{
                animation: 'swim-spiral 10s infinite ease-in-out 3s',
                top: '25%',
                right: '-35px',
              }}
            >
              🦐
            </div>

            {/* Fish 5 - Dolphin 🐬 - Zigzag */}
            <div 
              className="absolute text-3xl"
              style={{
                animation: 'swim-zigzag 7s infinite ease-in-out 1.5s',
                top: '65%',
                left: '-50px',
              }}
            >
              🐬
            </div>

            {/* Fish 6 - Shark 🦈 - Fast sweep right */}
            <div 
              className="absolute text-2xl"
              style={{
                animation: 'swim-fast-sweep 4s infinite ease-in-out 4s',
                top: '35%',
                left: '-40px',
              }}
            >
              🦈
            </div>

            {/* Fish 7 - Squid 🦑 - Gentle wave */}
            <div 
              className="absolute text-2xl"
              style={{
                animation: 'swim-gentle-wave 9s infinite ease-in-out 2.5s',
                top: '75%',
                right: '-45px',
              }}
            >
              🦑
            </div>

            {/* Fish 8 - Tropical Fish 🐠 - Vertical movement */}
            <div 
              className="absolute text-3xl"
              style={{
                animation: 'swim-vertical 8s infinite ease-in-out 3.5s',
                top: '20%',
                left: '50%',
              }}
            >
              🐠
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10">
            {/* PFDA Header */}
            <div className="text-center mb-8">
              <div className="mb-4">
                <h1 className="text-4xl font-bold text-white drop-shadow-lg">PFDA</h1>
                <p className="text-xs text-blue-50 mt-1 font-semibold drop-shadow">Philippine Fisheries Development Authority</p>
              </div>
              <h2 className="text-xl font-semibold text-white drop-shadow-lg">
                Contract Management System
              </h2>
              <p className="text-xs text-blue-100 mt-1 drop-shadow">
                Bulan, Sorsogon
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/30 backdrop-blur-sm border border-red-300/50 text-red-100 px-4 py-3 rounded-xl text-xs font-medium flex items-start gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-white drop-shadow mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-blue-300/50 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent outline-none transition bg-white/20 text-white placeholder-white/60 backdrop-blur-sm"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-white drop-shadow mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-blue-300/50 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent outline-none transition bg-white/20 text-white placeholder-white/60 backdrop-blur-sm"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-white text-blue-600 py-2.5 px-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-6 drop-shadow-lg"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-sm">Signing in...</span>
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-blue-100 pt-4 border-t border-white/20 drop-shadow">
              <p>Need help? Contact your administrator</p>
            </div>
          </div>

          {/* CSS Animations */}
          <style>{`
            /* Diagonal down-right sweep */
            @keyframes swim-diagonal-1 {
              0% { 
                left: -40px;
                top: 10%;
              }
              50% {
                left: 70%;
                top: 70%;
              }
              100% {
                left: 110%;
                top: 10%;
              }
            }
            
            /* Curved up-left path */
            @keyframes swim-curved-1 {
              0% {
                right: -50px;
                top: 80%;
              }
              25% {
                right: 30%;
                top: 60%;
              }
              50% {
                right: 60%;
                top: 20%;
              }
              75% {
                right: 20%;
                top: 50%;
              }
              100% {
                right: 110%;
                top: 80%;
              }
            }
            
            /* Fast horizontal */
            @keyframes swim-horizontal-fast {
              0% { left: -45px; top: 45%; }
              100% { left: 110%; top: 45%; }
            }
            
            /* Spiral pattern */
            @keyframes swim-spiral {
              0% {
                right: -35px;
                top: 25%;
              }
              25% {
                right: 20%;
                top: 10%;
              }
              50% {
                right: 50%;
                top: 50%;
              }
              75% {
                right: 80%;
                top: 80%;
              }
              100% {
                right: 110%;
                top: 25%;
              }
            }
            
            /* Zigzag pattern */
            @keyframes swim-zigzag {
              0% { left: -50px; top: 65%; }
              25% { left: 25%; top: 40%; }
              50% { left: 50%; top: 80%; }
              75% { left: 75%; top: 30%; }
              100% { left: 110%; top: 65%; }
            }
            
            /* Fast sweep right */
            @keyframes swim-fast-sweep {
              0% { left: -40px; top: 35%; }
              50% { left: 50%; top: 35%; }
              100% { left: 110%; top: 35%; }
            }
            
            /* Gentle wave motion */
            @keyframes swim-gentle-wave {
              0% { right: -45px; top: 75%; }
              25% { right: 25%; top: 65%; }
              50% { right: 50%; top: 75%; }
              75% { right: 75%; top: 65%; }
              100% { right: 110%; top: 75%; }
            }
            
            /* Vertical up and down */
            @keyframes swim-vertical {
              0% { 
                left: 50%;
                top: 20%;
                transform: translateX(-50%);
              }
              50% {
                left: 50%;
                top: 80%;
                transform: translateX(-50%);
              }
              100% {
                left: 50%;
                top: 20%;
                transform: translateX(-50%);
              }
            }
          `}</style>
        </div>

        <div className="text-center mt-6 text-xs text-blue-100 drop-shadow-lg">
          <p>© 2026 PFDA Bulan, Sorsogon</p>
        </div>
      </div>
    </div>
  )
}
