import axios, { AxiosInstance } from 'axios'
import type { LoginRequest, RecordTask, RecordFile, StartRecordRequest } from './types'

class ApiClient {
  private client: AxiosInstance
  private baseURL: string = ''
  private token: string | null = null

  constructor() {
    this.client = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      // Send cookies for cross-origin requests (server must set cookie with HttpOnly)
      withCredentials: true,
    })

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          // If unauthorized, reload so app can show login UI
          window.location.reload()
        }
        return Promise.reject(error)
      }
    )
  }

  setBaseURL(url: string) {
    this.baseURL = url
    this.client.defaults.baseURL = url
  }

  getBaseURL(): string {
    return this.baseURL
  }

  // Token is handled by an HttpOnly cookie set by the server. We don't store it client-side.

  clearAuth() {
    // no-op for cookie auth; server must clear cookie on logout
  }

  async login(data: LoginRequest): Promise<any | null> {
    try {
      // withCredentials:true makes browser include cookies and accept Set-Cookie from server
      const response = await this.client.post('/login', data)
      return response.data
    } catch (error) {
      return null
    }
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/logout')
    } catch (error) {
      // ignore
    }
  }

  async getRecords(): Promise<RecordTask[]> {
    const response = await this.client.get<RecordTask[]>('/record/list')
    return response.data
  }

  async startRecord(data: StartRecordRequest): Promise<void> {
    const roomId = data.roomId
    await this.client.post(`/record/${roomId}/start`, {})
  }

  async stopRecord(roomId: number): Promise<void> {
    await this.client.post(`/record/${roomId}/stop`, {})
  }

  async getFiles(path: string = ''): Promise<RecordFile[]> {
    const encodedPath = path.split('/').filter(Boolean).map(encodeURIComponent).join('/')
    const url = encodedPath ? `/files/${encodedPath}` : '/files/'
    const response = await this.client.get<RecordFile[]>(url)
    return response.data
  }

  async downloadFile(path: string): Promise<Blob> {
    const encodedPath = path.split('/').filter(Boolean).map(encodeURIComponent).join('/')
    const url = `/files/${encodedPath}`
    const response = await this.client.post(url, null, { responseType: 'blob' })
    return response.data
  }
}

export const apiClient = new ApiClient()
