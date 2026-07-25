package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"

	_ "github.com/mattn/go-sqlite3"
	"github.com/skip2/go-qrcode"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
	waLog "go.mau.fi/whatsmeow/util/log"
	"google.golang.org/protobuf/proto"
)

const dbPath = "file:data/examplestore.db?_foreign_keys=on"

var (
	client    *whatsmeow.Client
	lastQR    string
	clientMu  sync.Mutex
	clientLog waLog.Logger
	dbLog     waLog.Logger
)

func eventHandler(evt interface{}) {
	switch v := evt.(type) {
	case *events.Message:
		msgText := v.Message.GetConversation()
		if msgText == "" {
			msgText = v.Message.GetExtendedTextMessage().GetText()
		}

		if msgText != "" {
			realPhoneNumber := v.Info.Chat.User
			if v.Info.IsFromMe && v.Info.RecipientAlt.User != "" {
				realPhoneNumber = v.Info.RecipientAlt.User
			} else if !v.Info.IsFromMe && v.Info.SenderAlt.User != "" {
				realPhoneNumber = v.Info.SenderAlt.User
			}

			payload := map[string]interface{}{
				"sender":   realPhoneNumber,
				"message":  msgText,
				"isFromMe": v.Info.IsFromMe,
			}
			jsonData, _ := json.Marshal(payload)

			webhookUrl := os.Getenv("WHATSAPP_WEBHOOK_URL")
			if webhookUrl == "" {
				webhookUrl = "http://server:5000/api/whatsapp/webhook"
			}
			resp, err := http.Post(webhookUrl, "application/json", bytes.NewBuffer(jsonData))
			if err == nil {
				resp.Body.Close()
			}
		}
	}
}

type SendRequest struct {
	Recipient string `json:"recipient"`
	Message   string `json:"message"`
}

func handleSend(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req SendRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	clientMu.Lock()
	c := client
	clientMu.Unlock()

	if c == nil || !c.IsConnected() {
		http.Error(w, "WhatsApp not connected", http.StatusServiceUnavailable)
		return
	}

	recipientJID, _ := types.ParseJID(req.Recipient + "@s.whatsapp.net")
	_, err := c.SendMessage(context.Background(), recipientJID, &waE2E.Message{
		Conversation: proto.String(req.Message),
	})

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "sent"})
}

func handleStatus(w http.ResponseWriter, r *http.Request) {
	clientMu.Lock()
	c := client
	qr := lastQR
	clientMu.Unlock()

	status := "disconnected"
	if c != nil && c.IsLoggedIn() {
		status = "connected"
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  status,
		"qr_code": qr,
	})
}

func handleLogout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	clientMu.Lock()
	if client != nil {
		client.Logout(context.Background())
		client.Disconnect()
		lastQR = ""
	}
	clientMu.Unlock()

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "logged_out"})
}

// buildClient creates a fresh whatsmeow client from the DB store.
func buildClient() (*whatsmeow.Client, error) {
	container, err := sqlstore.New(context.Background(), "sqlite3", dbPath, dbLog)
	if err != nil {
		return nil, fmt.Errorf("failed to open store: %w", err)
	}
	deviceStore, err := container.GetFirstDevice(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to get device: %w", err)
	}
	c := whatsmeow.NewClient(deviceStore, clientLog)
	c.AddEventHandler(eventHandler)
	return c, nil
}

// connectClient starts the pairing or session-resume flow.
// It must be called while clientMu is NOT held — it locks internally.
func connectClient() {
	clientMu.Lock()
	c := client
	clientMu.Unlock()

	if c.Store.ID == nil {
		fmt.Println("No session found. Starting pairing process...")
		qrChan, _ := c.GetQRChannel(context.Background())
		err := c.Connect()
		if err != nil {
			fmt.Printf("Failed to connect: %v\n", err)
			return
		}
		go func() {
			for evt := range qrChan {
				clientMu.Lock()
				switch evt.Event {
				case "code":
					lastQR = evt.Code
					clientMu.Unlock()
					fmt.Println("\n--- NEW QR CODE RECEIVED ---")
					fmt.Printf("Code: %s\n", evt.Code)
					q, _ := qrcode.New(evt.Code, qrcode.Medium)
					fmt.Println(q.ToSmallString(false))
				case "success":
					lastQR = ""
					clientMu.Unlock()
					fmt.Println("Successfully paired!")
				case "timeout":
					lastQR = ""
					clientMu.Unlock()
					fmt.Println("QR timeout.")
				default:
					clientMu.Unlock()
				}
			}
		}()
	} else {
		fmt.Println("Existing session found. Connecting...")
		err := c.Connect()
		if err != nil {
			fmt.Printf("Failed to connect with existing session: %v\n", err)
		} else {
			fmt.Println("WhatsApp connection initiated!")
		}
	}
}

// handleRefresh tears down the current client and builds a brand-new one
// so whatsmeow opens a fresh QR channel. This works even after a QR timeout.
func handleRefresh(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	clientMu.Lock()
	// Tear down old client completely
	if client != nil {
		client.Disconnect()
	}
	lastQR = ""

	// Delete stale session so whatsmeow enters pairing mode
	os.Remove("data/examplestore.db")
	os.Remove("data/examplestore.db-wal")
	os.Remove("data/examplestore.db-shm")

	newClient, err := buildClient()
	if err != nil {
		clientMu.Unlock()
		fmt.Printf("[Refresh] Failed to rebuild client: %v\n", err)
		http.Error(w, "Failed to rebuild client", http.StatusInternalServerError)
		return
	}
	client = newClient
	clientMu.Unlock()

	fmt.Println("[Refresh] Client rebuilt. Starting new pairing...")
	connectClient()

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "refreshing"})
}

func main() {
	dbLog = waLog.Stdout("Database", "INFO", true)
	clientLog = waLog.Stdout("Client", "INFO", true)

	initialClient, err := buildClient()
	if err != nil {
		panic(err)
	}

	clientMu.Lock()
	client = initialClient
	clientMu.Unlock()

	connectClient()

	http.HandleFunc("/api/send", handleSend)
	http.HandleFunc("/api/status", handleStatus)
	http.HandleFunc("/api/logout", handleLogout)
	http.HandleFunc("/api/refresh", handleRefresh)

	go func() {
		fmt.Println("Bridge listening on :8090")
		http.ListenAndServe(":8090", nil)
	}()

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c

	clientMu.Lock()
	if client != nil {
		client.Disconnect()
	}
	clientMu.Unlock()
}
