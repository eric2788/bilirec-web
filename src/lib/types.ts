export interface LoginRequest {
  user: string
  pass: string
}

export interface RoomInfo {
  room_id: number
  uid: number
  area_id: number
  live_status: number
  live_url: string
  parent_area_id: number
  title: string
  parent_area_name: string
  area_name: string
  live_time: string
  description: string
  tags: string
  attention: number
  online: number
  short_id: number
  uname: string
  cover: string
  background: string
  join_slide: number
  live_id: number
  live_id_str: string
  lock_status: number
  hidden_status: number
  is_encrypted: boolean
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