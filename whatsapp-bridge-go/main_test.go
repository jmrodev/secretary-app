package main

import (
	"os"
	"testing"
	"fmt"

	"go.mau.fi/whatsmeow/types/events"
)

func TestLoggedOutEventCleansUpDB(t *testing.T) {
	// Setup
	os.MkdirAll("data", 0755)
	os.WriteFile("data/examplestore.db", []byte("dummy"), 0644)
	os.WriteFile("data/examplestore.db-wal", []byte("dummy"), 0644)
	os.WriteFile("data/examplestore.db-shm", []byte("dummy"), 0644)

	// Action
	evt := &events.LoggedOut{}
	eventHandler(evt)

	// Assert
	if _, err := os.Stat("data/examplestore.db"); !os.IsNotExist(err) {
		t.Errorf("Expected data/examplestore.db to be deleted")
	}
	if _, err := os.Stat("data/examplestore.db-wal"); !os.IsNotExist(err) {
		t.Errorf("Expected data/examplestore.db-wal to be deleted")
	}
	if _, err := os.Stat("data/examplestore.db-shm"); !os.IsNotExist(err) {
		t.Errorf("Expected data/examplestore.db-shm to be deleted")
	}
}
