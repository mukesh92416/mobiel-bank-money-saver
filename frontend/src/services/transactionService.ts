import { api } from '@/api/client'
import { apiUrl } from '@/config/api'
import type { Transaction, DepositInput, WithdrawInput, MonthlyReport } from '@/types'

interface TransactionListResponse {
  transactions: Transaction[]
  total: number
  pages: number
  current_page: number
  per_page: number
}

export const transactionService = {
  list: (params?: {
    page?: number
    per_page?: number
    sort_by?: string
    sort_order?: string
    type?: string
    category?: string
    search?: string
    goal_id?: number
  }) =>
    api.get<TransactionListResponse>('/transactions', params as Record<string, string | number | undefined>),

  get: (id: number) =>
    api.get<{ transaction: Transaction }>(`/transactions/${id}`),

  deposit: (data: DepositInput) =>
    api.post<{ message: string; transaction: Transaction }>('/transactions/deposit', data),

  withdraw: (data: WithdrawInput) =>
    api.post<{ message: string; transaction: Transaction }>('/transactions/withdraw', data),

  delete: (id: number) =>
    api.delete<{ message: string }>(`/transactions/${id}`),

  exportCsv: (params?: { start_date?: string; end_date?: string; type?: string }) =>
    api.get<{ csv: string }>('/transactions/export', params as Record<string, string | undefined>),

  exportPdf: async (params?: { start_date?: string; end_date?: string }) => {
    const token = localStorage.getItem('access_token')
    const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    const res = await fetch(apiUrl(`/api/transactions/export-pdf${query}`), {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },

  monthlyReport: (year?: number, month?: number) =>
    api.get<MonthlyReport>('/transactions/monthly-report', { year: String(year ?? new Date().getFullYear()), month: String(month ?? new Date().getMonth() + 1) }),
}
