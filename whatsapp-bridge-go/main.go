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

var client *whatsmeow.Client

func eventHandler(evt interface{}) {
	switch v := evt.(type) {
	case *events.Message:
		msgText := v.Message.GetConversation()
		if msgText == "" {
			msgText = v.Message.GetExtendedTextMessage().GetText()
		}
		
		if msgText != "" {
			// Dump info for debugging
			infoBytes, _ := json.MarshalIndent(v.Info, "", "  ")
			fmt.Printf("\n--- DEBUG INFO ---\n%s\n------------------\n", string(infoBytes))

			// Extraer el número real (bypass del @lid masking de WhatsApp)
			realPhoneNumber := v.Info.Chat.User
			
			if v.Info.IsFromMe && v.Info.RecipientAlt.User != "" {
				realPhoneNumber = v.Info.RecipientAlt.User
			} else if !v.Info.IsFromMe && v.Info.SenderAlt.User != "" {
				realPhoneNumber = v.Info.SenderAlt.User
			}
			
			fmt.Printf("Mensaje de %s (IsFromMe: %v): %s\n", realPhoneNumber, v.Info.IsFromMe, msgText)
			
			// Send Webhook to Secretary App
			payload := map[string]interface{}{
				"sender":   realPhoneNumber,
				"message":  msgText,
				"isFromMe": v.Info.IsFromMe,
			}
			jsonData, _ := json.Marshal(payload)
			
			resp, err := http.Post("http://127.0.0.1:5000/api/whatsapp/webhook", "application/json", bytes.NewBuffer(jsonData))
			if err != nil {
				fmt.Printf("Error enviando webhook a la app: %v\n", err)
			} else {
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
		http.Error(w, "Método no permitido", http.StatusMethodNotAllowed)
		return
	}

	var req SendRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if client == nil || !client.IsConnected() {
		http.Error(w, "WhatsApp no está conectado", http.StatusServiceUnavailable)
		return
	}

	recipientJID, _ := types.ParseJID(req.Recipient + "@s.whatsapp.net")
	
	_, err := client.SendMessage(context.Background(), recipientJID, &waE2E.Message{
		Conversation: proto.String(req.Message),
	})

	if err != nil {
		fmt.Printf("Error al enviar a %s: %v\n", req.Recipient, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Printf("Mensaje enviado a %s: %s\n", req.Recipient, req.Message)
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "sent"})
}

func main() {
	dbLog := waLog.Stdout("Database", "DEBUG", true)
	// CORRECCIÓN: Añadido context.Background()
	container, err := sqlstore.New(context.Background(), "sqlite3", "file:examplestore.db?_foreign_keys=on", dbLog)
	if err != nil {
		panic(err)
	}
	// CORRECCIÓN: Añadido context.Background()
	deviceStore, err := container.GetFirstDevice(context.Background())
	if err != nil {
		panic(err)
	}
	clientLog := waLog.Stdout("Client", "DEBUG", true)
	client = whatsmeow.NewClient(deviceStore, clientLog)
	client.AddEventHandler(eventHandler)

	if client.Store.ID == nil {
		qrChan, _ := client.GetQRChannel(context.Background())
		err = client.Connect()
		if err != nil {
			panic(err)
		}
		for evt := range qrChan {
			if evt.Event == "code" {
				fmt.Println("\n--- ESCANEA ESTE QR ---")
				q, _ := qrcode.New(evt.Code, qrcode.Medium)
				fmt.Println(q.ToSmallString(false))
				fmt.Println("-----------------------\n")
			} else {
				fmt.Println("Evento de QR:", evt.Event)
			}
		}
	} else {
		err = client.Connect()
		if err != nil {
			panic(err)
		}
		fmt.Println("¡WhatsApp conectado automáticamente!")
	}

	http.HandleFunc("/api/send", handleSend)
	go func() {
		fmt.Println("Bridge de Go escuchando en puerto 8090")
		if err := http.ListenAndServe(":8090", nil); err != nil {
			fmt.Printf("Error en servidor HTTP: %s\n", err)
		}
	}()

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c

	client.Disconnect()
}
