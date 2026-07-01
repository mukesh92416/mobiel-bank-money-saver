import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import * as Lucide from 'lucide-react'
import {
  ArrowUp,
  ArrowDown,
  Search,
  Download,
  SlidersHorizontal,
  RefreshCw,
  Wallet,
  FileText,
  Calendar,
} from 'lucide-react'
import { transactionService } from '@/services/transactionService'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import { formatCurrency, formatDate, getRelativeTime } from '@/utils/format'
import { pageVariants, staggerContainer, staggerItem } from '@/animations/index'
import type { Transaction } from '@/types'

const categoryOptions = [
  'All Categories',
  'Salary',
  'Freelance',
  'Gift',
  'Investment',
  'Savings',
  'Bonus',
  'Cashback',
  'Emergency',
  'Bill Payment',
  'Shopping',
  'Entertainment',
  'Travel',
  'Food',
  'Rent',
  'Other',
]

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'highest', label: 'Highest' },
  { value: 'lowest', label: 'Lowest' },
]

type FilterType = 'all' | 'deposit' | 'withdrawal'

interface TransactionListParams {
  page: number
  per_page: number
  sort_by: string
  sort_order: string
  type?: string
  category?: string
  search?: string
}

function buildQueryParams(
  page: number,
  filterType: FilterType,
  sortValue: string,
  categoryFilter: string,
  searchQuery: string,
): TransactionListParams {
  const params: TransactionListParams = {
    page,
    per_page: 20,
    sort_by: 'transaction_date',
    sort_order: 'desc',
  }

  if (filterType === 'deposit') params.type = 'deposit'
  else if (filterType === 'withdrawal') params.type = 'withdrawal'

  if (sortValue === 'oldest') {
    params.sort_by = 'transaction_date'
    params.sort_order = 'asc'
  } else if (sortValue === 'highest') {
    params.sort_by = 'amount'
    params.sort_order = 'desc'
  } else if (sortValue === 'lowest') {
    params.sort_by = 'amount'
    params.sort_order = 'asc'
  }

  if (categoryFilter && categoryFilter !== 'All Categories') {
    params.category = categoryFilter
  }

  if (searchQuery.trim()) {
    params.search = searchQuery.trim()
  }

  return params
}

function getCategoryIcon(category: string | null) {
  const map: Record<string, string> = {
    Salary: 'Briefcase',
    Freelance: 'Laptop',
    Gift: 'Gift',
    Investment: 'TrendingUp',
    Savings: 'PiggyBank',
    Bonus: 'Star',
    Cashback: 'RefreshCw',
    Emergency: 'AlertTriangle',
    'Bill Payment': 'Receipt',
    Shopping: 'ShoppingBag',
    Entertainment: 'Film',
    Travel: 'Plane',
    Food: 'UtensilsCrossed',
    Rent: 'Home',
  }
  return map[category ?? ''] || 'MoreHorizontal'
}

function triggerCsvDownload() {
  transactionService.exportCsv().then((res) => {
    const blob = new Blob([res.csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  })
}

export default function TransactionHistory() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [sortValue, setSortValue] = useState('newest')
  const [categoryFilter, setCategoryFilter] = useState('All Categories')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showMonthlyReport, setShowMonthlyReport] = useState(false)
  const reportYear = new Date().getFullYear()
  const reportMonth = new Date().getMonth() + 1

  const queryParams = buildQueryParams(page, filterType, sortValue, categoryFilter, searchQuery)

  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['transactions', queryParams],
    queryFn: () => transactionService.list(queryParams),
  })

  const transactions = data?.transactions ?? []
  const totalPages = data?.pages ?? 1
  const currentPage = data?.current_page ?? 1

  function handleFilterChange(type: FilterType) {
    setFilterType(type)
    setPage(1)
  }

  function handleSortChange(value: string) {
    setSortValue(value)
    setPage(1)
  }

  function handleCategoryFilterChange(category: string) {
    setCategoryFilter(category)
    setPage(1)
    setShowCategoryDropdown(false)
  }

  const { data: _monthlyReportData } = useQuery({
    queryKey: ['monthly-report', reportYear, reportMonth],
    queryFn: () => transactionService.monthlyReport(reportYear, reportMonth),
    enabled: showMonthlyReport,
  })

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchQuery(e.target.value)
    setPage(1)
  }

  function handleDownloadPdf() {
    transactionService.exportPdf({
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    })
  }

  return (
    <motion.main
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
      className="pb-28 px-4 pt-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Transactions
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowMonthlyReport(!showMonthlyReport)}
            className={cn(
              'flex size-9 items-center justify-center rounded-xl transition-all',
              showMonthlyReport
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-gradient-to-br from-gray-500 to-gray-700 text-white shadow-lg shadow-gray-500/25 hover:shadow-gray-500/40',
            )}
            aria-label="Monthly Report"
          >
            <Calendar className="size-4" />
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-shadow"
            aria-label="Export PDF"
          >
            <FileText className="size-4" />
          </button>
          <button
            type="button"
            onClick={triggerCsvDownload}
            className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-shadow"
            aria-label="Export CSV"
          >
            <Download className="size-4" />
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Search transactions..."
          value={searchQuery}
          onChange={handleSearch}
          className={cn(
            'block w-full rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 pl-10 pr-10 py-2.5 text-sm transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500',
            'border-gray-300 dark:border-gray-600',
          )}
        />
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors',
            showFilters
              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300',
          )}
        >
          <SlidersHorizontal className="size-4" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {(['all', 'deposit', 'withdrawal'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => handleFilterChange(type)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap border',
              filterType === type
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/25'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-500',
            )}
          >
            {type === 'all' ? 'All' : type === 'deposit' ? 'Deposit' : 'Withdrawal'}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card variant="glass" padding="sm" className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">
                  Sort by
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSortChange(opt.value)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border',
                        sortValue === opt.value
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-emerald-400',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">
                  From
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">
                  To
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">
                  Category
                </label>
                <div className="relative flex-1">
                  <button
                    type="button"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className={cn(
                      'w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200',
                      'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-emerald-400',
                    )}
                  >
                    {categoryFilter}
                  </button>
                  <AnimatePresence>
                    {showCategoryDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute top-full left-0 right-0 mt-1 z-20 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden"
                      >
                        <div className="max-h-48 overflow-y-auto py-1">
                          {categoryOptions.map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => handleCategoryFilterChange(cat)}
                              className={cn(
                                'w-full text-left px-3 py-2 text-xs font-medium transition-colors',
                                categoryFilter === cat
                                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50',
                              )}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-3"
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.div key={i} variants={staggerItem}>
              <SkeletonCard />
            </motion.div>
          ))}
        </motion.div>
      ) : isError ? (
        <Card variant="glass" padding="lg" className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/30">
            <Lucide.AlertCircle className="size-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Could not load transactions. Please try again.
          </p>
          <Button variant="primary" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={<Wallet className="size-12" />}
          title="No transactions found"
          description={
            searchQuery || filterType !== 'all' || categoryFilter !== 'All Categories'
              ? 'Try adjusting your filters or search query'
              : 'Start saving to see your transactions here'
          }
          actionLabel="Add Money"
          onAction={() => navigate('/add')}
        />
      ) : (
        <>
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-2"
          >
            {transactions.map((tx: Transaction) => {
              const isDeposit = tx.type === 'deposit'
              const CategoryIcon = (Lucide as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
                getCategoryIcon(tx.category)
              ]

              return (
                <motion.div key={tx.id} variants={staggerItem}>
                  <Card variant="glass" padding="sm">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex size-11 shrink-0 items-center justify-center rounded-full',
                          isDeposit
                            ? 'bg-emerald-100 dark:bg-emerald-900/40'
                            : 'bg-red-100 dark:bg-red-900/40',
                        )}
                      >
                        {isDeposit ? (
                          <ArrowDown className="size-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <ArrowUp className="size-5 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {tx.description || (isDeposit ? 'Deposit' : 'Withdrawal')}
                          </p>
                          <Badge variant={isDeposit ? 'success' : 'error'} size="sm">
                            {tx.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {tx.category && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-2 py-0.5 rounded-full">
                              {CategoryIcon ? <CategoryIcon className="size-3" /> : null}
                              {tx.category}
                            </span>
                          )}
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">
                            {getRelativeTime(tx.transaction_date)}
                          </span>
                          {tx.goal_title && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 truncate max-w-[120px]">
                              · {tx.goal_title}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={cn(
                            'text-sm font-bold tabular-nums',
                            isDeposit
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400',
                          )}
                        >
                          {isDeposit ? '+' : '-'}
                          {formatCurrency(tx.amount)}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                          {formatDate(tx.transaction_date)}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border',
                  currentPage <= 1
                    ? 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400',
                )}
              >
                Previous
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const pageNum = i + 1
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setPage(pageNum)}
                    className={cn(
                      'size-9 rounded-lg text-sm font-medium transition-all duration-200',
                      currentPage === pageNum
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50',
                    )}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border',
                  currentPage >= totalPages
                    ? 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400',
                )}
              >
                Next
              </button>
            </div>
          )}

          {isFetching && !isLoading && (
            <div className="flex justify-center py-3">
              <RefreshCw className="size-5 text-emerald-500 animate-spin" />
            </div>
          )}
        </>
      )}
    </motion.main>
  )
}
