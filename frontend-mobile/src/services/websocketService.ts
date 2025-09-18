import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Notification } from './notificationApi';

export interface WebSocketMessage {
  type: string;
  data: any;
}

export interface NotificationMessage {
  type: 'notification';
  data: Notification;
}

export interface WelcomeMessage {
  type: 'welcome';
  data: {
    user_id: string;
    connection_id: string;
    unread_count: number;
    timestamp: number;
  };
}

export interface UnreadCountMessage {
  type: 'unread_count';
  data: {
    count: number;
  };
}

export interface SystemNotificationMessage {
  type: 'system_notification';
  data: Notification;
}

export type WebSocketEventType =
  | 'connected'
  | 'disconnected'
  | 'notification'
  | 'welcome'
  | 'unread_count'
  | 'system_notification'
  | 'error';

export interface WebSocketEventListener {
  (data?: any): void;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000; // 1 second
  private isConnecting = false;
  private listeners: Map<WebSocketEventType, WebSocketEventListener[]> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeListeners();
  }

  private initializeListeners() {
    // 初始化所有事件類型的監聽器數組
    const eventTypes: WebSocketEventType[] = [
      'connected', 'disconnected', 'notification', 'welcome',
      'unread_count', 'system_notification', 'error'
    ];

    eventTypes.forEach(type => {
      this.listeners.set(type, []);
    });
  }

  // 獲取 WebSocket URL
  private getWebSocketUrl(): string {
    const baseUrl = Platform.OS === 'web' ? 'localhost:8090' : '192.168.1.100:8090';
    return `ws://${baseUrl}/ws`;
  }

  // 獲取認證 Token
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  // 連接 WebSocket
  async connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('No auth token available');
      }

      const url = this.getWebSocketUrl();
      console.log('🔌 Connecting to WebSocket:', url);

      this.ws = new WebSocket(url);

      // 設置事件監聽器
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);

      // 發送認證信息（通過 URL 參數或首個消息）
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.emit('connected');
      };

    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
      this.isConnecting = false;
      this.emit('error', error);
    }
  }

  // 斷開連接
  disconnect(): void {
    console.log('🔌 Disconnecting WebSocket');

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  // 發送消息
  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket not connected, message not sent:', message);
    }
  }

  // 標記通知為已讀
  markNotificationAsRead(notificationId: string): void {
    this.send({
      type: 'mark_as_read',
      data: { notification_id: notificationId }
    });
  }

  // 標記所有通知為已讀
  markAllNotificationsAsRead(): void {
    this.send({
      type: 'mark_all_as_read',
      data: {}
    });
  }

  // 獲取未讀數量
  getUnreadCount(): void {
    this.send({
      type: 'get_unread_count',
      data: {}
    });
  }

  // 發送心跳
  ping(): void {
    this.send({
      type: 'ping',
      data: { timestamp: Date.now() }
    });
  }

  // 添加事件監聽器
  addEventListener(type: WebSocketEventType, listener: WebSocketEventListener): void {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  // 移除事件監聽器
  removeEventListener(type: WebSocketEventType, listener: WebSocketEventListener): void {
    const listeners = this.listeners.get(type) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
      this.listeners.set(type, listeners);
    }
  }

  // 觸發事件
  private emit(type: WebSocketEventType, data?: any): void {
    const listeners = this.listeners.get(type) || [];
    listeners.forEach(listener => listener(data));
  }

  // 處理連接打開
  private handleOpen(): void {
    console.log('✅ WebSocket opened');
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.startHeartbeat();
    this.emit('connected');
  }

  // 處理消息
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      console.log('📨 WebSocket message received:', message.type, message.data);

      switch (message.type) {
        case 'welcome':
          this.emit('welcome', message.data);
          break;
        case 'notification':
          this.emit('notification', message.data);
          break;
        case 'system_notification':
          this.emit('system_notification', message.data);
          break;
        case 'unread_count':
          this.emit('unread_count', message.data);
          break;
        case 'notification_read':
        case 'all_notifications_read':
          // 通知已讀確認
          console.log('✅ Notification read confirmation:', message.data);
          break;
        case 'pong':
          // 心跳回應
          console.log('💓 Pong received');
          break;
        case 'recent_notifications':
          // 最近通知
          console.log('📮 Recent notifications:', message.data);
          this.emit('notification', message.data);
          break;
        default:
          console.log('🤷‍♂️ Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('❌ Failed to parse WebSocket message:', error);
    }
  }

  // 處理連接關閉
  private handleClose(event: CloseEvent): void {
    console.log('🔌 WebSocket closed:', event.code, event.reason);
    this.ws = null;
    this.isConnecting = false;

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.emit('disconnected');

    // 自動重連
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval * this.reconnectAttempts);
    } else {
      console.log('❌ Max reconnection attempts reached');
    }
  }

  // 處理錯誤
  private handleError(event: Event): void {
    console.error('❌ WebSocket error:', event);
    this.emit('error', event);
  }

  // 開始心跳
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      this.ping();
    }, 30000); // 30 seconds
  }

  // 獲取連接狀態
  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  // 獲取連接狀態描述
  get connectionState(): string {
    if (!this.ws) return 'disconnected';

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'unknown';
    }
  }
}

// 單例模式
export const webSocketService = new WebSocketService();