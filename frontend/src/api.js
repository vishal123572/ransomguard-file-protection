import axios from 'axios'
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 25000 })
api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('ransomguard-token') || sessionStorage.getItem('cybershield-token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 && !error.config?.url?.startsWith('/auth/login')) {
    sessionStorage.removeItem('ransomguard-token')
    sessionStorage.removeItem('cybershield-token')
    window.dispatchEvent(new Event('session-expired'))
  }
  return Promise.reject(error)
})
export const errorMessage = error => {
  const data = error.response?.data
  if (data?.fields) return Object.entries(data.fields).map(([field, text]) => `${field}: ${text}`).join(' · ')
  return data?.message || (error.response ? 'Something went wrong. Please try again.' : 'Unable to reach the server. Please check your connection and try again.')
}
export default api
