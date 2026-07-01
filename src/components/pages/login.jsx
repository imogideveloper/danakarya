import React, { useState } from 'react'
import { Wallet, Eye, EyeOff, TrendingUp, Building2, Clock, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/lib/store'
import axios from 'axios'

const API_BASE = 'http://localhost:8000/api'

async function doLogin(email, password) {
  const { data: tokens } = await axios.post(`${API_BASE}/auth/login/`, { email, password })
  sessionStorage.setItem('access_token', tokens.access)
  sessionStorage.setItem('refresh_token', tokens.refresh)

  const { data: user } = await axios.get(`${API_BASE}/auth/me/`, {
    headers: { Authorization: `Bearer ${tokens.access}` },
  })

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    employeeId: user.employee_id,
    companyId: user.company_id,
  }
}

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Pinjaman Mudah',
    desc: 'Proses pengajuan cepat dengan persetujuan bertahap',
  },
  {
    icon: Building2,
    title: 'Multi Perusahaan',
    desc: 'Mendukung kerjasama MoU dengan berbagai perusahaan',
  },
  {
    icon: Clock,
    title: 'Cicilan Fleksibel',
    desc: 'Tenor pinjaman yang dapat disesuaikan kebutuhan',
  },
  {
    icon: Shield,
    title: 'Transparan',
    desc: 'Biaya admin jelas tanpa biaya tersembunyi',
  },
]

function SpinnerIcon() {
  return (
    <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
  )
}

function BrandLogo({ size = 'md' }) {
  const isLg = size === 'lg'
  return (
    <div className="flex items-center gap-3">
      <div
        className={`${isLg ? 'size-9' : 'size-8'} rounded-lg bg-white/20 flex items-center justify-center`}
      >
        <Wallet className={isLg ? 'size-5' : 'size-4'} />
      </div>
      <div>
        <p className={`font-bold ${isLg ? 'text-base' : 'text-sm'} leading-tight`}>DANAKARYA</p>
        {isLg && <p className="text-xs text-white/70">Dana untuk Karyawan Sejahtera</p>}
      </div>
    </div>
  )
}

function FeatureItem({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
      <div className="size-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-white/60">{desc}</p>
      </div>
    </div>
  )
}

function LeftPanel() {
  return (
    <div className="hidden lg:flex lg:w-[420px] shrink-0 bg-[#1a5c3a] flex-col justify-between p-10 text-white">
      <BrandLogo size="lg" />

      <div className="space-y-8">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold leading-tight">
            Kelola Pinjaman<br />
            Karyawan dengan<br />
            <span className="text-emerald-300">Mudah & Transparan</span>
          </h1>
          <p className="text-sm text-white/70 leading-relaxed">
            Platform manajemen pinjaman karyawan terintegrasi untuk solusi finansial.
          </p>
        </div>

        <div className="space-y-3">
          {FEATURES.map((feature) => (
            <FeatureItem key={feature.title} {...feature} />
          ))}
        </div>
      </div>

      <p className="text-xs text-white/40">
        &copy; 2026 DANAKARYA. Sistem Manajemen Pinjaman Karyawan.
      </p>
    </div>
  )
}

function LoginForm({ onSubmit, isLoading, error }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(email, password) }} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="nama@danakarya.id"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-11"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password
          </Label>
        </div>

        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Masukkan password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-11 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-11 bg-[#1a5c3a] hover:bg-[#154d30] text-white font-semibold rounded-lg"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <SpinnerIcon />
            Memproses...
          </span>
        ) : (
          'Masuk'
        )}
      </Button>
    </form>
  )
}

export function LoginPage() {
  const { login } = useAppStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (email, password) => {
    setError('')
    setIsLoading(true)
    try {
      const user = await doLogin(email, password)
      login(user)
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Email atau password salah')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-5xl flex rounded-2xl overflow-hidden shadow-xl">
        <LeftPanel />

        {/* Right Panel */}
        <div className="flex-1 min-w-0 flex items-center justify-center bg-white p-10">
          <div className="w-full space-y-6">
            {/* Mobile logo */}
            <div className="flex items-center gap-2 lg:hidden text-[#1a5c3a]">
              <div className="size-8 rounded-lg bg-[#1a5c3a] flex items-center justify-center">
                <Wallet className="size-4 text-white" />
              </div>
              <span className="font-bold">DANAKARYA</span>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">Selamat Datang</h2>
              <p className="text-sm text-gray-500 mt-1">Masuk ke akun Anda untuk melanjutkan</p>
            </div>

            <LoginForm onSubmit={handleLogin} isLoading={isLoading} error={error} />
          </div>
        </div>
      </div>
    </div>
  )
}