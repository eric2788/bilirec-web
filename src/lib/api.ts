import axios, { AxiosInstance } from "axios";
import type {
  LoginRequest,
  RecordTask,
  RecordFile,
  StartRecordRequest,
  RecordInfo,
  ConvertQueue,
  ShareFileInfo,
  RoomInfo,
  LiveStatus,
  SubscriptionStatus,
  SubscribedRooms
} from "./types";

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string = "";

  // Simple in-memory cache for room info to reduce expensive requests
  private roomInfoCache = new Map<number, { data: any; ts: number }>();
  private ROOM_INFO_TTL = 5 * 60_000; // 5 minutes

  constructor() {
    this.client = axios.create({
      timeout: 30000,
      headers: {
        "Content-Type": "application/json"
      },
      // Send cookies for cross-origin requests (server must set cookie with HttpOnly)
      withCredentials: true
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          window.dispatchEvent(new Event("api:unauthorized"));
        }
        return Promise.reject(error);
      }
    );
  }

  setBaseURL(url: string) {
    this.baseURL = url;
    this.client.defaults.baseURL = url;
  }

  getBaseURL(): string {
    return this.baseURL;
  }

  // Token is handled by an HttpOnly cookie set by the server. We don't store it client-side.

  clearAuth() {
    // no-op for cookie auth; server must clear cookie on logout
  }

  async login(data: LoginRequest): Promise<any | null> {
    try {
      // withCredentials:true makes browser include cookies and accept Set-Cookie from server
      const response = await this.client.post("/login", data);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.client.post("/logout");
    } catch (error) {
      console.warn("Logout request failed:", error);
    }
  }

  // Server returns an array of room IDs at /record/list per swagger.
  async getRecords(): Promise<number[]> {
    const response = await this.client.get<number[]>("/record/list");
    return Array.isArray(response.data) ? response.data : [];
  }

  async getRecordTasks(): Promise<RecordTask[]> {
    const ids = await this.getRecords();

    const now = Date.now();

    // For each room ID, fetch status and stats first. Only fetch room info when needed
    const tasks = await Promise.all(
      ids.map(async (id) => {
        // per API, use /record/{id}/status to get status
        const infoRes = await this.client.get<RecordInfo | any>(
          `/record/${id}/status`
        );
        const info = infoRes.data as RecordInfo;
        let status: "recording" | "recovering" | "idle" = info.status;

        // stats - allow this to throw on error
        const r = await this.client.get<any>(`/record/${id}/stats`);
        const stats = r.data;

        // room meta: cache and fetch only when status is not 'recording'
        let roomInfo: any = undefined;
        const cached = this.roomInfoCache.get(id);
        if (cached && now - cached.ts < this.ROOM_INFO_TTL) {
          roomInfo = cached.data;
        } else if (status === "recording") {
          const rr = await this.client.get<any>(`/room/${id}/info`);
          roomInfo = rr.data;
          this.roomInfoCache.set(id, { data: roomInfo, ts: now });
        }

        return {
          roomId: id,
          status,
          fileSize: stats?.bytes_written,
          recordedTime: stats?.elapsed_seconds,
          startTime: stats?.start_time,
          roomInfo
        } as RecordTask;
      })
    );

    return tasks;
  }

  async startRecord(data: StartRecordRequest): Promise<void> {
    const roomId = data.roomId;
    await this.client.post(`/record/${roomId}/start`, {});
    // invalidate cache for this room so subsequent fetch is fresh
    this.roomInfoCache.delete(roomId);
  }

  async stopRecord(roomId: number): Promise<void> {
    await this.client.post(`/record/${roomId}/stop`, {});
    // invalidate cache — server is expected to remove record; ensure subsequent fetch is fresh
    this.roomInfoCache.delete(roomId);
  }

  async getFiles(path: string = ""): Promise<RecordFile[]> {
    const encodedPath = path
      .split("/")
      .filter(Boolean)
      .map(encodeURIComponent)
      .join("/");
    const url = encodedPath ? `/files/browse/${encodedPath}` : "/files/browse";
    const response = await this.client.get<RecordFile[]>(url);
    return response.data;
  }

  /**
   * Request a URL and stream the response, reporting progress.
   * Supports arbitrary HTTP methods and optional request body.
   */
  public async requestAsStream(
    method: string,
    urlPath: string,
    options?: { body?: any; onProgress?: (loaded: number, total?: number) => void; signal?: AbortSignal }
  ): Promise<Blob> {
    const requestUrl = (this.baseURL ? this.baseURL.replace(/\/$/, "") : "") + urlPath;

    const init: RequestInit = {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" }
    };

    if (options?.signal) init.signal = options.signal;

    // Only set a JSON body for non-GET requests
    if (method.toUpperCase() !== "GET" && options?.body !== undefined) {
      init.body = JSON.stringify(options.body);
    }

    const res = await fetch(requestUrl, init);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(errText || `HTTP ${res.status}`);
    }

    const contentLength = res.headers.get("content-length");
    const total = contentLength ? Number(contentLength) : undefined;

    const reader = res.body?.getReader();
    if (!reader) throw new Error("Readable stream not supported by the environment");

    const chunks: Uint8Array[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        received += value.length;
        try {
          options?.onProgress?.(received, total);
        } catch (e) {
          // ignore errors from user-provided progress callback
        }
      }
    }

    // Convert each Uint8Array into an ArrayBuffer of the exact bytes to satisfy type checks
    const parts = chunks.map((c) => c.buffer.slice(c.byteOffset, c.byteOffset + c.byteLength));
    // Normalize buffers to concrete ArrayBuffer copies to avoid SharedArrayBuffer in some environments
    const normalized = parts.map((buf) => {
      const u = new Uint8Array(buf as ArrayBuffer);
      return u.slice().buffer;
    });
    return new Blob(normalized);
  }


  async downloadFile(
    path: string,
    _options?: { onProgress?: (loaded: number, total?: number) => void; signal?: AbortSignal; suggestedName?: string }
  ): Promise<void> {
    const encodedPath = path
      .split("/")
      .filter(Boolean)
      .map(encodeURIComponent)
      .join("/");
    const url = (this.baseURL ? this.baseURL.replace(/\/$/, "") : "") + `/files/download/${encodedPath}`;

    // Use an in-page anchor click so the download is handled in the same tab.
    try {
      const a = document.createElement('a')
      a.href = url
      // `download` is a hint; if the browser ignores it the resource will open/navigate in the same tab
      a.download = (_options?.suggestedName ?? path.split("/").pop() ?? '')
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (e) {
      // propagate error so callers can show an appropriate message
      throw e
    }

    return
  }

  async deleteFiles(paths: string[]): Promise<void> {
    // Swagger: DELETE /files/batch with body = array of paths
    await this.client.delete("/files/batch", { data: paths });
    return;
  }

  async shareFile(path: string): Promise<ShareFileInfo> {
    const encodedPath = path
      .split("/")
      .filter(Boolean)
      .map(encodeURIComponent)
      .join("/");
    const url = `/files/presigned/${encodedPath}`;
    const response = await this.client.post<ShareFileInfo>(url);
    return response.data;
  }

  async deleteDir(path: string): Promise<void> {
    // Encode each segment to avoid issues with slashes or special characters in path
    const encodedPath = path
      .split("/")
      .filter(Boolean)
      .map(encodeURIComponent)
      .join("/");
    const url = `/files/${encodedPath}`;
    await this.client.delete(url);
    return;
  }

  async getConvertTasks(): Promise<ConvertQueue[]> {
    const response = await this.client.get<ConvertQueue[]>("/convert/tasks");
    return response.data;
  }
  
  async enqueueConvertTask(path: string, deleteSource: boolean = false, format?: string): Promise<ConvertQueue> {
    const encodedPath = path
      .split("/")
      .filter(Boolean)
      .map(encodeURIComponent)
      .join("/");
    const params: any = { delete: deleteSource };
    if (format) params.format = format;
    const response = await this.client.post<ConvertQueue>(`/convert/tasks/${encodedPath}`, {}, { params });
    return response.data;
  }

  async deleteConvertTask(taskId: string): Promise<void> {
    await this.client.delete(`/convert/tasks/${encodeURIComponent(taskId)}`);
  }

  // Room info methods
  async getRoomInfo(roomId: number): Promise<RoomInfo> {
    const response = await this.client.get<RoomInfo>(`/room/${roomId}/info`);
    return response.data;
  }

  async getRoomInfos(roomIds: number[]): Promise<RoomInfo[]> {
    const idsParam = roomIds.join(',');
    const response = await this.client.get<RoomInfo[] | Record<string, RoomInfo>>(`/room/infos?roomIDs=${idsParam}`);
    
    // API returns an object with room IDs as keys, convert to array
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      return Object.values(response.data);
    }
    
    return Array.isArray(response.data) ? response.data : [];
  }

  async checkLiveStatus(roomId: number): Promise<LiveStatus> {
    const response = await this.client.get<LiveStatus>(`/room/${roomId}/live`);
    return response.data;
  }

  async getRecordStatus(roomId: number): Promise<RecordInfo> {
    const response = await this.client.get<RecordInfo>(`/record/${roomId}/status`);
    return response.data;
  }

  // Room subscription methods
  async subscribeRoom(roomId: number): Promise<void> {
    await this.client.post(`/room/${roomId}`);
  }

  async unsubscribeRoom(roomId: number): Promise<void> {
    await this.client.delete(`/room/${roomId}`);
  }

  async checkSubscription(roomId: number): Promise<SubscriptionStatus> {
    const response = await this.client.get<SubscriptionStatus>(`/room/subscribe/${roomId}`);
    return response.data;
  }

  async getSubscribedRooms(): Promise<number[]> {
    const response = await this.client.get<SubscribedRooms>('/room/subscribe');
    return response.data.room_ids ?? [];
  }

}

export const apiClient = new ApiClient();
