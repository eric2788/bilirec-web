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
    })

    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers['X-API-Token'] = this.token
      }
      return config
    })

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          this.clearAuth()
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

  setToken(token: string) {
    this.token = token
  }

  getToken(): string | null {
    return this.token
  }

  clearAuth() {
    this.token = null
  }

  async verifyToken(data: LoginRequest): Promise<boolean> {
    try {
      this.setToken(data.token)
      await this.client.get('/api/records')
      return true
    } catch (error) {
      this.clearAuth()
      return false
    }
  }

  async getRecords(): Promise<RecordTask[]> {
    const response = await this.client.get<RecordTask[]>('/api/records')
    return response.data
  }

  async startRecord(data: StartRecordRequest): Promise<void> {
    await this.client.post('/api/records/start', data)
  }

  async stopRecord(roomId: number): Promise<void> {
    await this.client.post(`/api/records/${roomId}/stop`)
  }

  async getFiles(): Promise<RecordFile[]> {
    const response = await this.client.get<RecordFile[]>('/api/files')
    return response.data
  }

  getDownloadUrl(filePath: string): string {
    return `${this.baseURL}/api/files/download?path=${encodeURIComponent(filePath)}`
  }
}

export const apiClient = new ApiClient()
