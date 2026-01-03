export interface LoginRequest {
  user: string
  pass: string
}

export interface RecordTask {
  roomId: number
  status: 'recording' | 'idle' | 'error' | 'waiting'
  fileName?: string
  fileSize?: number
  recordedTime?: number
  startTime?: string
  error?: string
  roomInfo?: {
    title: string
    uname: string
    face: string
    live_status: number
    online?: number
  }
}

export interface RecordFile {
  path: string
  name: string
  size: number
  modTime: string
  isDir: boolean
}

export interface StartRecordRequest {
  roomId: number
}

export interface ApiError {
  message: string
  code?: string
}
