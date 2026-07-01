import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { PiggyBank } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { getGreeting } from '@/utils/format'

export default function SplashScreen() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(isAuthenticated ? '/dashboard' : '/login', { replace: true })
    }, 2500)
    return () => clearTimeout(timer)
  }, [navigate, isAuthenticated])

  return (
    <motion.div
      className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-emerald-50 via-white to-blue-50 dark:from-dark-950 dark:via-dark-900 dark:to-dark-950"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.p
        className="mb-6 text-sm font-medium tracking-wide text-emerald-600 dark:text-emerald-400"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {getGreeting()}
      </motion.p>

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 180,
          damping: 14,
          delay: 0.3,
        }}
      >
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30 dark:shadow-emerald-500/20">
          <PiggyBank className="h-12 w-12 text-white" />
        </div>
      </motion.div>

      <motion.h1
        className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-500 via-emerald-600 to-blue-500 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        MoneySaver
      </motion.h1>

      <motion.p
        className="mt-2 text-sm text-gray-500 dark:text-gray-400 tracking-wide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        Save Smarter, Live Better
      </motion.p>

      <motion.div
        className="mt-16 flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.4 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400"
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  )
}
