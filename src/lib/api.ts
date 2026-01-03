import axios, { AxiosInstance } from 'axios'
import type { LoginRequest, LoginResponse, RecordTask, RecordFile, StartRecordRequest } from './types'

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
        config.headers.Authorization = `Bearer ${this.token}`
      }
      return config
    })

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
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

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>('/api/auth/login', data)
    this.setToken(response.data.token)
    return response.data
  }

  async getTasks(): Promise<RecordTask[]> {
    const response = await this.client.get<RecordTask[]>('/api/records/tasks')
    return response.data
  }

  async startRecord(data: StartRecordRequest): Promise<void> {
    await this.client.post('/api/records/start', data)
  }

  async stopRecord(roomId: number): Promise<void> {
    await this.client.post(`/api/records/stop/${roomId}`)
  }

  async getFiles(): Promise<RecordFile[]> {
    const response = await this.client.get<RecordFile[]>('/api/records/files')
    return response.data
  }

  getDownloadUrl(fileId: string, format: 'flv' | 'mp4'): string {
    return `${this.baseURL}/api/records/download/${fileId}?format=${format}`
  }
}

export const apiClient = new ApiClient()
