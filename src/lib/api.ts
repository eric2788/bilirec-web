import axios, { AxiosInstance } from 'axios'
import type { LoginRequest, RecordTask, RecordFile, StartRecordRequest, RecordInfo } from './types'

class ApiClient {
  private client: AxiosInstance
  private baseURL: string = ''

  // Simple in-memory cache for room info to reduce expensive requests
  private roomInfoCache = new Map<number, { data: any; ts: number }>()
  private ROOM_INFO_TTL = 60_000 // 60s

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

  // Server returns an array of room IDs at /record/list per swagger.
  async getRecords(): Promise<number[]> {
    const response = await this.client.get<number[]>('/record/list')
    return Array.isArray(response.data) ? response.data : []
  }

  async getRecordTasks(): Promise<RecordTask[]> {
    const ids = await this.getRecords()

    const now = Date.now()

    // For each room ID, fetch status and stats first. Only fetch room info when needed
    const tasks = await Promise.all(ids.map(async (id) => {
      // per API, use /record/{id}/status to get status
      const infoRes = await this.client.get<RecordInfo | any>(`/record/${id}/status`)
      const info = infoRes.data as RecordInfo
      let status: 'recording' | 'recovering' | 'idle' = info.status

      // stats - allow this to throw on error
      const r = await this.client.get<any>(`/record/${id}/stats`)
      const stats = r.data

      // room meta: cache and fetch only when status is not 'recording'
      let roomInfo: any = undefined
      const cached = this.roomInfoCache.get(id)
      if (cached && now - cached.ts < this.ROOM_INFO_TTL) {
        roomInfo = cached.data
      } else if (status === 'recording') {
        const rr = await this.client.get<any>(`/room/${id}/info`)
        roomInfo = rr.data
        this.roomInfoCache.set(id, { data: roomInfo, ts: now })
      }

      return {
        roomId: id,
        status,
        fileSize: stats?.bytes_written,
        recordedTime: stats?.elapsed_seconds,
        startTime: stats?.start_time,
        roomInfo,
      } as RecordTask
    }))

    return tasks
  }

  async startRecord(data: StartRecordRequest): Promise<void> {
    const roomId = data.roomId
    await this.client.post(`/record/${roomId}/start`, {})
    // invalidate cache for this room so subsequent fetch is fresh
    this.roomInfoCache.delete(roomId)
  }

  async stopRecord(roomId: number): Promise<void> {
    await this.client.post(`/record/${roomId}/stop`, {})
    // invalidate cache — server is expected to remove record; ensure subsequent fetch is fresh
    this.roomInfoCache.delete(roomId)
  }

  async getFiles(path: string = ''): Promise<RecordFile[]> {
    const encodedPath = path.split('/').filter(Boolean).map(encodeURIComponent).join('/')
    const url = encodedPath ? `/files/${encodedPath}` : '/files'
    const response = await this.client.get<RecordFile[]>(url)
    return response.data
  }

  async downloadFile(path: string): Promise<Blob> {
    const encodedPath = path.split('/').filter(Boolean).map(encodeURIComponent).join('/')
    const url = `/files/${encodedPath}`
    const response = await this.client.post(url, {}, { responseType: 'blob' })
    return response.data
  }

  async deleteFiles(paths: string[]): Promise<void> {
    // Swagger: DELETE /files/batch with body = array of paths
    await this.client.delete('/files/batch', { data: paths })
    return
  }

  async deleteDir(path: string): Promise<void> {
    // Encode each segment to avoid issues with slashes or special characters in path
    const encodedPath = path.split('/').filter(Boolean).map(encodeURIComponent).join('/')
    const url = `/files/${encodedPath}`
    await this.client.delete(url)
    return
  }
}

export const apiClient = new ApiClient()
