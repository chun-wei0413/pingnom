package notification

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

// MockWebSocketConn for testing
type MockWebSocketConn struct {
	messages     [][]byte
	closed       bool
	mu           sync.Mutex
	readMessage  chan []byte
	writeMessage chan []byte
}

func NewMockWebSocketConn() *MockWebSocketConn {
	return &MockWebSocketConn{
		messages:     make([][]byte, 0),
		readMessage:  make(chan []byte, 10),
		writeMessage: make(chan []byte, 10),
	}
}

func (m *MockWebSocketConn) WriteMessage(messageType int, data []byte) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.closed {
		return websocket.ErrCloseSent
	}

	m.messages = append(m.messages, data)
	select {
	case m.writeMessage <- data:
	default:
	}
	return nil
}

func (m *MockWebSocketConn) ReadMessage() (messageType int, p []byte, err error) {
	select {
	case message := <-m.readMessage:
		return websocket.TextMessage, message, nil
	case <-time.After(100 * time.Millisecond):
		return 0, nil, websocket.ErrReadLimit
	}
}

func (m *MockWebSocketConn) Close() error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.closed = true
	close(m.readMessage)
	close(m.writeMessage)
	return nil
}

func (m *MockWebSocketConn) SetReadLimit(limit int64) {}
func (m *MockWebSocketConn) SetReadDeadline(t time.Time) error { return nil }
func (m *MockWebSocketConn) SetWriteDeadline(t time.Time) error { return nil }
func (m *MockWebSocketConn) SetPongHandler(h func(appData string) error) {}

func (m *MockWebSocketConn) SimulateIncomingMessage(message []byte) {
	select {
	case m.readMessage <- message:
	default:
	}
}

func (m *MockWebSocketConn) GetWrittenMessages() [][]byte {
	m.mu.Lock()
	defer m.mu.Unlock()
	result := make([][]byte, len(m.messages))
	copy(result, m.messages)
	return result
}

func TestHubNewHub(t *testing.T) {
	ctx := context.Background()
	hub := NewHub(ctx)

	if hub == nil {
		t.Error("Expected hub to be created")
	}

	if hub.connections == nil {
		t.Error("Expected connections map to be initialized")
	}

	if hub.register == nil {
		t.Error("Expected register channel to be initialized")
	}

	if hub.unregister == nil {
		t.Error("Expected unregister channel to be initialized")
	}

	if hub.broadcast == nil {
		t.Error("Expected broadcast channel to be initialized")
	}

	if hub.userMessage == nil {
		t.Error("Expected userMessage channel to be initialized")
	}
}

func TestHubRegisterConnection(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	hub := NewHub(ctx)
	go hub.Run()

	userID := uuid.New()
	connectionID := uuid.New()
	mockConn := NewMockWebSocketConn()

	connection := &Connection{
		ID:     connectionID,
		UserID: userID,
		Conn:   mockConn,
		Send:   make(chan []byte, 10),
		Hub:    hub,
	}

	hub.RegisterConnection(connection)

	// Give some time for the connection to be registered
	time.Sleep(10 * time.Millisecond)

	// Verify connection is registered
	userConnections := hub.GetUserConnections(userID)
	if len(userConnections) != 1 {
		t.Errorf("Expected 1 connection for user, got %d", len(userConnections))
	}

	if userConnections[0].ID != connectionID {
		t.Errorf("Expected connection ID %v, got %v", connectionID, userConnections[0].ID)
	}

	// Verify user is online
	if !hub.IsUserOnline(userID) {
		t.Error("Expected user to be online after registering connection")
	}
}

func TestHubUnregisterConnection(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	hub := NewHub(ctx)
	go hub.Run()

	userID := uuid.New()
	connectionID := uuid.New()
	mockConn := NewMockWebSocketConn()

	connection := &Connection{
		ID:     connectionID,
		UserID: userID,
		Conn:   mockConn,
		Send:   make(chan []byte, 10),
		Hub:    hub,
	}

	// Register connection
	hub.RegisterConnection(connection)
	time.Sleep(10 * time.Millisecond)

	// Verify connection is registered
	if !hub.IsUserOnline(userID) {
		t.Error("Expected user to be online")
	}

	// Unregister connection
	hub.UnregisterConnection(connection)
	time.Sleep(10 * time.Millisecond)

	// Verify connection is unregistered
	if hub.IsUserOnline(userID) {
		t.Error("Expected user to be offline after unregistering connection")
	}

	userConnections := hub.GetUserConnections(userID)
	if len(userConnections) != 0 {
		t.Errorf("Expected 0 connections for user after unregistering, got %d", len(userConnections))
	}
}

func TestHubMultipleConnectionsForSameUser(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	hub := NewHub(ctx)
	go hub.Run()

	userID := uuid.New()
	connectionID1 := uuid.New()
	connectionID2 := uuid.New()

	connection1 := &Connection{
		ID:     connectionID1,
		UserID: userID,
		Conn:   NewMockWebSocketConn(),
		Send:   make(chan []byte, 10),
		Hub:    hub,
	}

	connection2 := &Connection{
		ID:     connectionID2,
		UserID: userID,
		Conn:   NewMockWebSocketConn(),
		Send:   make(chan []byte, 10),
		Hub:    hub,
	}

	// Register both connections
	hub.RegisterConnection(connection1)
	hub.RegisterConnection(connection2)
	time.Sleep(10 * time.Millisecond)

	// Verify both connections are registered
	userConnections := hub.GetUserConnections(userID)
	if len(userConnections) != 2 {
		t.Errorf("Expected 2 connections for user, got %d", len(userConnections))
	}

	// Verify user is still online
	if !hub.IsUserOnline(userID) {
		t.Error("Expected user to be online with multiple connections")
	}

	// Unregister one connection
	hub.UnregisterConnection(connection1)
	time.Sleep(10 * time.Millisecond)

	// Verify user is still online (has remaining connection)
	if !hub.IsUserOnline(userID) {
		t.Error("Expected user to still be online with remaining connection")
	}

	userConnections = hub.GetUserConnections(userID)
	if len(userConnections) != 1 {
		t.Errorf("Expected 1 connection for user after unregistering one, got %d", len(userConnections))
	}

	// Unregister second connection
	hub.UnregisterConnection(connection2)
	time.Sleep(10 * time.Millisecond)

	// Verify user is now offline
	if hub.IsUserOnline(userID) {
		t.Error("Expected user to be offline after unregistering all connections")
	}
}

func TestHubSendToUser(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	hub := NewHub(ctx)
	go hub.Run()

	userID := uuid.New()
	mockConn := NewMockWebSocketConn()

	connection := &Connection{
		ID:     uuid.New(),
		UserID: userID,
		Conn:   mockConn,
		Send:   make(chan []byte, 10),
		Hub:    hub,
	}

	// Register connection
	hub.RegisterConnection(connection)
	time.Sleep(10 * time.Millisecond)

	// Send message to user
	testMessage := []byte("test message")
	hub.SendToUser(userID, testMessage)

	// Verify message was sent to connection
	select {
	case receivedMessage := <-connection.Send:
		if string(receivedMessage) != string(testMessage) {
			t.Errorf("Expected message %s, got %s", testMessage, receivedMessage)
		}
	case <-time.After(100 * time.Millisecond):
		t.Error("Expected to receive message within timeout")
	}
}

func TestHubSendToUserNotOnline(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	hub := NewHub(ctx)
	go hub.Run()

	userID := uuid.New()
	testMessage := []byte("test message")

	// Send message to user who is not online
	hub.SendToUser(userID, testMessage)

	// This should not cause any errors or panics
	// and should simply be ignored since user is not online
	time.Sleep(10 * time.Millisecond)

	// Verify user is not online
	if hub.IsUserOnline(userID) {
		t.Error("Expected user to not be online")
	}
}

func TestHubBroadcastMessage(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	hub := NewHub(ctx)
	go hub.Run()

	// Create multiple users with connections
	userID1 := uuid.New()
	userID2 := uuid.New()

	connection1 := &Connection{
		ID:     uuid.New(),
		UserID: userID1,
		Conn:   NewMockWebSocketConn(),
		Send:   make(chan []byte, 10),
		Hub:    hub,
	}

	connection2 := &Connection{
		ID:     uuid.New(),
		UserID: userID2,
		Conn:   NewMockWebSocketConn(),
		Send:   make(chan []byte, 10),
		Hub:    hub,
	}

	// Register connections
	hub.RegisterConnection(connection1)
	hub.RegisterConnection(connection2)
	time.Sleep(10 * time.Millisecond)

	// Broadcast message
	testMessage := []byte("broadcast message")
	hub.BroadcastMessage(testMessage)

	// Verify both connections received the message
	select {
	case receivedMessage := <-connection1.Send:
		if string(receivedMessage) != string(testMessage) {
			t.Errorf("Expected broadcast message %s for user1, got %s", testMessage, receivedMessage)
		}
	case <-time.After(100 * time.Millisecond):
		t.Error("Expected user1 to receive broadcast message within timeout")
	}

	select {
	case receivedMessage := <-connection2.Send:
		if string(receivedMessage) != string(testMessage) {
			t.Errorf("Expected broadcast message %s for user2, got %s", testMessage, receivedMessage)
		}
	case <-time.After(100 * time.Millisecond):
		t.Error("Expected user2 to receive broadcast message within timeout")
	}
}

func TestHubGetOnlineUserCount(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	hub := NewHub(ctx)
	go hub.Run()

	// Initially should be 0
	if count := hub.GetOnlineUserCount(); count != 0 {
		t.Errorf("Expected 0 online users initially, got %d", count)
	}

	// Add users
	userID1 := uuid.New()
	userID2 := uuid.New()

	connection1 := &Connection{
		ID:     uuid.New(),
		UserID: userID1,
		Conn:   NewMockWebSocketConn(),
		Send:   make(chan []byte, 10),
		Hub:    hub,
	}

	connection2 := &Connection{
		ID:     uuid.New(),
		UserID: userID2,
		Conn:   NewMockWebSocketConn(),
		Send:   make(chan []byte, 10),
		Hub:    hub,
	}

	hub.RegisterConnection(connection1)
	time.Sleep(10 * time.Millisecond)

	if count := hub.GetOnlineUserCount(); count != 1 {
		t.Errorf("Expected 1 online user after first registration, got %d", count)
	}

	hub.RegisterConnection(connection2)
	time.Sleep(10 * time.Millisecond)

	if count := hub.GetOnlineUserCount(); count != 2 {
		t.Errorf("Expected 2 online users after second registration, got %d", count)
	}

	// Add another connection for the same user - should not increase count
	connection3 := &Connection{
		ID:     uuid.New(),
		UserID: userID1, // Same user
		Conn:   NewMockWebSocketConn(),
		Send:   make(chan []byte, 10),
		Hub:    hub,
	}

	hub.RegisterConnection(connection3)
	time.Sleep(10 * time.Millisecond)

	if count := hub.GetOnlineUserCount(); count != 2 {
		t.Errorf("Expected 2 online users after adding connection for existing user, got %d", count)
	}
}

func TestConnectionLastSeen(t *testing.T) {
	userID := uuid.New()
	mockConn := NewMockWebSocketConn()

	connection := &Connection{
		ID:       uuid.New(),
		UserID:   userID,
		Conn:     mockConn,
		Send:     make(chan []byte, 10),
		LastSeen: time.Now().Unix(),
	}

	if connection.LastSeen == 0 {
		t.Error("Expected LastSeen to be set")
	}

	// Update LastSeen
	newTime := time.Now().Unix()
	connection.LastSeen = newTime

	if connection.LastSeen != newTime {
		t.Errorf("Expected LastSeen to be %d, got %d", newTime, connection.LastSeen)
	}
}