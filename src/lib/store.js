import { create } from 'zustand'
import api from './api'

export const useAppStore = create((set, get) => ({
  // Auth
  isAuthenticated: false,
  currentUser: null,

  // Navigation
  currentPage: 'dashboard',
  selectedEmployeeId: null,
  selectedLoanId: null,
  selectedApplicationId: null,
  sidebarOpen: true,
  pageHistory: [],

  // Set user after successful login (called from login page with data from API)
  login: (user) => set({
    isAuthenticated: true,
    currentUser: user,
    currentPage: 'dashboard',
    pageHistory: [],
  }),

  logout: () => {
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('refresh_token')
    set({
      isAuthenticated: false,
      currentUser: null,
      currentPage: 'dashboard',
      selectedEmployeeId: null,
      selectedLoanId: null,
      selectedApplicationId: null,
      pageHistory: [],
    })
  },

  // Restore session from sessionStorage on page reload
  initAuth: async () => {
    const token = sessionStorage.getItem('access_token')
    if (!token) return
    try {
      const { data } = await api.get('/auth/me/')
      set({
        isAuthenticated: true,
        currentUser: {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          employeeId: data.employee_id,
          companyId: data.company_id,
        },
      })
    } catch {
      sessionStorage.removeItem('access_token')
      sessionStorage.removeItem('refresh_token')
    }
  },

  navigate: (page, params) => {
    const { currentPage, selectedEmployeeId, selectedLoanId, selectedApplicationId, pageHistory } = get()
    set({
      pageHistory: [...pageHistory, { page: currentPage, selectedEmployeeId, selectedLoanId, selectedApplicationId }],
      currentPage: page,
      selectedEmployeeId: params?.employeeId ?? null,
      selectedLoanId: params?.loanId ?? null,
      selectedApplicationId: params?.applicationId ?? null,
    })
  },

  goBack: () => {
    const { pageHistory } = get()
    if (pageHistory.length === 0) return
    const previous = pageHistory[pageHistory.length - 1]
    set({
      currentPage: previous.page,
      selectedEmployeeId: previous.selectedEmployeeId,
      selectedLoanId: previous.selectedLoanId,
      selectedApplicationId: previous.selectedApplicationId,
      pageHistory: pageHistory.slice(0, -1),
    })
  },

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
