import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  PiggyBank,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain an uppercase letter')
      .regex(/[0-9]/, 'Password must contain a number'),
    confirmPassword: z.string(),
    agreeTerms: z.literal<true>(true, { message: 'You must agree to the terms' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type RegisterForm = z.infer<typeof registerSchema>

function getPasswordStrength(password: string): {
  score: number
  label: string
  color: string
  width: string
} {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1)
    return { score, label: 'Weak', color: 'bg-red-500', width: 'w-1/4' }
  if (score === 2)
    return { score, label: 'Fair', color: 'bg-orange-500', width: 'w-2/4' }
  if (score === 3)
    return { score, label: 'Good', color: 'bg-yellow-500', width: 'w-3/4' }
  return { score, label: 'Strong', color: 'bg-emerald-500', width: 'w-full' }
}

export default function Register() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false as unknown as true,
    },
  })

  const passwordValue = watch('password')
  const strength = useMemo(
    () => getPasswordStrength(passwordValue ?? ''),
    [passwordValue],
  )

  async function onSubmit(data: RegisterForm) {
    setError(null)
    try {
      const res = await authService.register({
        name: data.name,
        email: data.email,
        password: data.password,
      })
      localStorage.setItem('access_token', res.access_token)
      if (res.refresh_token) {
        localStorage.setItem('refresh_token', res.refresh_token)
      }
      setUser(res.user)
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Registration failed. Please try again.'
      setError(message)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-blue-50 px-4 py-8 dark:from-dark-950 dark:via-dark-900 dark:to-dark-950">
      <motion.div
        className="mb-6 flex flex-col items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30 dark:shadow-emerald-500/20">
          <PiggyBank className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">
          MoneySaver
        </h1>
      </motion.div>

      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
      >
        <Card variant="glass" padding="lg" className="w-full">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Create Account
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Join MoneySaver today
          </p>

          {error && (
            <motion.div
              className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit as any)} className="mt-6 space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              leftIcon={<User className="h-4 w-4" />}
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                leftIcon={<Lock className="h-4 w-4" />}
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {passwordValue && (
              <div className="space-y-1.5">
                <div className="flex h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <motion.div
                    className={`h-full ${strength.color} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: strength.width }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p
                  className={`text-xs font-medium ${
                    strength.score <= 1
                      ? 'text-red-500'
                      : strength.score === 2
                        ? 'text-orange-500'
                        : strength.score === 3
                          ? 'text-yellow-600'
                          : 'text-emerald-600'
                  }`}
                >
                  {strength.label}
                </p>
              </div>
            )}

            <div className="relative">
              <Input
                label="Confirm Password"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repeat your password"
                leftIcon={<Lock className="h-4 w-4" />}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                tabIndex={-1}
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500 dark:border-gray-600"
                {...register('agreeTerms')}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                I agree to the{' '}
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  Terms &amp; Conditions
                </span>
              </span>
            </label>
            {errors.agreeTerms && (
              <p className="text-xs text-red-500 dark:text-red-400">
                {errors.agreeTerms.message}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              loading={isSubmitting}
            >
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              Login
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  )
}
