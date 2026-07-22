package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

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

var (
	client         *whatsmeow.Client
	lastQR         string
	loggedOut      bool
	pairingDone    bool
	storeContainer *sqlstore.Container
)

func eventHandler(evt interface{}) {
	switch v := evt.(type) {
	case *events.Message:
		msgText := v.Message.GetConversation()
		if msgText == "" {
			msgText = v.Message.GetExtendedTextMessage().GetText()
		}

		if msgText != "" {
			// Extract real phone number
			realPhoneNumber := v.Info.Chat.User
			if v.Info.IsFromMe && v.Info.RecipientAlt.User != "" {
				realPhoneNumber = v.Info.RecipientAlt.User
			} else if !v.Info.IsFromMe && v.Info.SenderAlt.User != "" {
				realPhoneNumber = v.Info.SenderAlt.User
			}

			// Send Webhook to Secretary App
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

	if client == nil || !client.IsConnected() {
		http.Error(w, "WhatsApp not connected", http.StatusServiceUnavailable)
		return
	}

	recipientJID, _ := types.ParseJID(req.Recipient + "@s.whatsapp.net")
	_, err := client.SendMessage(context.Background(), recipientJID, &waE2E.Message{
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
	status := "disconnected"
	if !loggedOut && client != nil && client.Store.ID != nil {
		status = "connected"
	} else if lastQR != "" {
		status = "pairing"
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  status,
		"qr_code": lastQR,
	})
}

func handleDisconnect(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	fmt.Println("=== DISCONNECT REQUESTED ===")

	if client == nil {
		fmt.Println("Client is nil, nothing to disconnect")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"status":  "disconnected",
		})
		return
	}

	// Logout from WhatsApp servers first (needs active WebSocket)
	logoutCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	err := client.Logout(logoutCtx)
	if err != nil {
		fmt.Printf("Logout error (non-fatal): %v\n", err)
	} else {
		fmt.Println("Logged out from WhatsApp servers")
	}

	// Disconnect the WebSocket connection
	client.Disconnect()
	fmt.Println("WebSocket disconnected")

	// Reinitialize WhatsApp (this will delete database files and recreate client in pairing mode)
	go func() {
		defer func() {
			if r := recover(); r != nil {
				fmt.Printf("PANIC in initWhatsApp: %v\n", r)
			}
		}()
		fmt.Println("Re-initializing WhatsApp client in pairing mode...")
		initWhatsApp(true)
	}()

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"status":  "disconnected",
	})
}

func initWhatsApp(reset bool) {
	if client != nil {
		client.Disconnect()
	}
	if storeContainer != nil {
		// No hay un Close directo en sqlstore, pero podemos intentar borrar el archivo si se desconecta
	}

	if reset {
		fmt.Println("Resetting WhatsApp store...")
		os.Remove("examplestore.db")
		os.Remove("examplestore.db-shm")
		os.Remove("examplestore.db-wal")
		lastQR = ""
		loggedOut = true
	}

	dbLog := waLog.Stdout("Database", "INFO", true)
	container, err := sqlstore.New(context.Background(), "sqlite3", "file:examplestore.db?_foreign_keys=on", dbLog)
	if err != nil {
		panic(err)
	}
	storeContainer = container

	deviceStore, err := container.GetFirstDevice(context.Background())
	if err != nil {
		panic(err)
	}
	clientLog := waLog.Stdout("Client", "INFO", true)
	client = whatsmeow.NewClient(deviceStore, clientLog)
	client.AddEventHandler(eventHandler)

	if client.Store.ID == nil {
		fmt.Println("No session found. Starting pairing process...")
		qrChan, _ := client.GetQRChannel(context.Background())
		err = client.Connect()
		if err != nil {
			fmt.Printf("Failed to connect for pairing: %v. Retrying in 5 seconds...\n", err)
			time.Sleep(5 * time.Second)
			go initWhatsApp(true)
			return
		}
		go func() {
			defer func() {
				if r := recover(); r != nil {
					fmt.Printf("PANIC in QR handler: %v\n", r)
				}
			}()
			pairingDone = false
			for evt := range qrChan {
				if evt.Event == "code" {
					lastQR = evt.Code
					loggedOut = false
					fmt.Println("\n--- NEW QR CODE RECEIVED ---")
					fmt.Printf("Code: %s\n", lastQR)
					q, _ := qrcode.New(evt.Code, qrcode.Medium)
					fmt.Println(q.ToSmallString(false))
				} else if evt.Event == "success" {
					lastQR = ""
					loggedOut = false
					pairingDone = true
					fmt.Println("Successfully paired!")
				}
			}
			if !pairingDone {
				fmt.Println("QR channel closed. Restarting pairing safely in 5 seconds...")
				time.Sleep(5 * time.Second)
				initWhatsApp(true)
			}
		}()
	} else {
		fmt.Println("Existing session found. Connecting...")
		loggedOut = false
		err = client.Connect()
		if err != nil {
			fmt.Printf("Failed to connect with existing session: %v\n", err)
		} else {
			fmt.Println("WhatsApp connection initiated!")
		}
	}
}

func main() {
	initWhatsApp(false)

	http.HandleFunc("/api/send", handleSend)
	http.HandleFunc("/api/status", handleStatus)
	http.HandleFunc("/api/disconnect", handleDisconnect)

	go func() {
		fmt.Println("Bridge listening on :8090")
		http.ListenAndServe(":8090", nil)
	}()

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c
	if client != nil {
		client.Disconnect()
	}
}
