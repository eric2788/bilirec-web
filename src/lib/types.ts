export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
}

export interface RecordTask {
  room_id: number
  status: 'recording' | 'idle' | 'error'
  file_size?: number
  duration?: number
  start_time?: string
  error_message?: string
  room_info?: {
    title: string
    uname: string
    face: string
    online: number
  }
}

export interface RecordFile {
  id: string
  room_id: number
  filename: string
  file_size: number
  duration: number
  format: 'flv' | 'mp4'
  created_at: string
  room_info?: {
    title: string
    uname: string
    face: string
  }
}

export interface StartRecordRequest {
  room_id: number
}

export interface ApiError {
  message: string
  code?: string
}
