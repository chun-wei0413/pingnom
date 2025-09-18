package notification

import "errors"

var (
	// ErrNotificationNotFound 通知未找到錯誤
	ErrNotificationNotFound = errors.New("notification not found")

	// ErrInvalidNotificationType 無效的通知類型錯誤
	ErrInvalidNotificationType = errors.New("invalid notification type")

	// ErrInvalidReceiver 無效的接收者錯誤
	ErrInvalidReceiver = errors.New("invalid notification receiver")

	// ErrWebSocketConnectionFailed WebSocket 連接失敗錯誤
	ErrWebSocketConnectionFailed = errors.New("websocket connection failed")

	// ErrNotificationSendFailed 通知發送失敗錯誤
	ErrNotificationSendFailed = errors.New("failed to send notification")
)