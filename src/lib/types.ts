export interface LoginRequest {
  user: string
  pass: string
}

export interface RoomInfo {
  room_id: number
  short_id: number
  uid: number
  title: string
  cover: string
  user_cover: string
  keyframe: string
  live_status: number
  live_start_time: number
  area_id: number
  area_name: string
  parent_area_id: number
  parent_area_name: string
  uname: string
  face: string
  description: string
  online: number
}

export interface RecordTask {
  roomId: number
  status: 'recording' | 'recovering' | 'idle'
  fileName?: string
  fileSize?: number
  recordedTime?: number
  startTime?: string
  error?: string
  roomInfo?: RoomInfo
}

export interface RecordFile {
  name: string
  size: number
  time: number
  isDir: boolean
}

export interface StartRecordRequest {
  roomId: number
}

export interface ApiError {
  message: string
  code?: string
}
