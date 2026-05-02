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
	client  *whatsmeow.Client
	lastQR  string
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
	if client != nil && client.IsLoggedIn() {
		status = "connected"
	}
	
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  status,
		"qr_code": lastQR,
	})
}

func main() {
	dbLog := waLog.Stdout("Database", "INFO", true)
	container, err := sqlstore.New(context.Background(), "sqlite3", "file:examplestore.db?_foreign_keys=on", dbLog)
	if err != nil {
		panic(err)
	}
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
			fmt.Printf("Failed to connect: %v\n", err)
			panic(err)
		}
		go func() {
			for evt := range qrChan {
				if evt.Event == "code" {
					lastQR = evt.Code
					fmt.Println("\n--- NEW QR CODE RECEIVED ---")
					fmt.Printf("Code: %s\n", lastQR)
					q, _ := qrcode.New(evt.Code, qrcode.Medium)
					fmt.Println(q.ToSmallString(false))
				} else if evt.Event == "success" {
					lastQR = ""
					fmt.Println("Successfully paired!")
				}
			}
		}()
	} else {
		fmt.Println("Existing session found. Connecting...")
		err = client.Connect()
		if err != nil {
			fmt.Printf("Failed to connect with existing session: %v\n", err)
			// Optional: force logout here if error is critical
		} else {
			fmt.Println("WhatsApp connection initiated!")
		}
	}

	http.HandleFunc("/api/send", handleSend)
	http.HandleFunc("/api/status", handleStatus)
	
	go func() {
		fmt.Println("Bridge listening on :8090")
		http.ListenAndServe(":8090", nil)
	}()

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c
	client.Disconnect()
}
