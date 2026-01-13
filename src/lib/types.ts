export interface LoginRequest {
  user: string
  pass: string
}

export interface RoomInfo {
  uid: number
  room_id: number
  short_id: number
  attention: number
  online: number
  is_portrait: boolean
  description: string
  live_status: number
  area_id: number
  parent_area_id: number
  parent_area_name: string
  old_area_id: number
  background: string
  title: string
  user_cover: string
  live_time: string
  tags: string
  area_name: string
}

export interface RecordTask {
  roomId: number
  status: 'recording' | 'recovering' | 'idle'
  fileName?: string
  fileSize?: number
  recordedTime?: number
  startTime?: string | number
  error?: string
  roomInfo?: RoomInfo
}

export interface RecorderStats {
  bytes_written: number
  elapsed_seconds: number
  start_time: number
  status: string
  output_path: string
}

// Response from /record/{room}/info
export interface RecordInfo {
  room_id: number
  status: 'recording' | 'recovering' | 'idle'
}

export interface RecordFile {
  name: string
  size: number
  path: string
  is_dir: boolean
  is_recording: boolean
}

export interface ShareFileInfo {
  url: string
  expires_in: number
}

export interface StartRecordRequest {
  roomId: number
}

export interface ApiError {
  message: string
  code?: string
}

export interface ConvertQueue {
  task_id: string
  input_path: string
  output_path: string
  input_format: string
  output_format: string
  delete_source: boolean
}