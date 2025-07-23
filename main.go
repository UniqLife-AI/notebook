package main

import (
	"bytes"
	"context"
	"embed"
	"io" // ИЗМЕНЕНО: Заменили io/ioutil на io
	"log"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"golang.org/x/text/encoding/charmap"
	"golang.org/x/text/transform"
)

//go:embed all:frontend/dist
var assets embed.FS

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// OnStartup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) OnStartup(ctx context.Context) {
	a.ctx = ctx
}

// SelectDirectory opens a native directory selection dialog.
func (a *App) SelectDirectory() string {
	path, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Project Directory",
	})
	if err != nil {
		log.Printf("Error selecting directory: %s", err)
		return ""
	}
	return path
}

// ReadFile читает содержимое файла по указанному пути.
func (a *App) ReadFile(filePath string) (string, error) {
	bytes, err := os.ReadFile(filePath)
	if err != nil {
		log.Printf("Error reading file %s: %s", filePath, err)
		return "", err
	}
	return string(bytes), nil
}

// WriteFile записывает содержимое в файл по указанному пути.
func (a *App) WriteFile(filePath string, content string) error {
	err := os.WriteFile(filePath, []byte(content), 0644)
	if err != nil {
		log.Printf("Error writing file %s: %s", filePath, err)
	}
	return err
}

// FileInfo структура для передачи информации о файле на фронтенд.
type FileInfo struct {
	Name        string `json:"name"`
	IsDirectory bool   `json:"isDirectory"`
	Path        string `json:"path"`
}

// ListFiles сканирует указанную директорию и возвращает список файлов и папок.
func (a *App) ListFiles(dirPath string) ([]FileInfo, error) {
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		log.Printf("Error reading directory %s: %s", dirPath, err)
		return nil, err
	}

	var files []FileInfo
	for _, entry := range entries {
		files = append(files, FileInfo{
			Name:        entry.Name(),
			IsDirectory: entry.IsDir(),
			Path:        filepath.Join(dirPath, entry.Name()),
		})
	}
	return files, nil
}

// TerminalCommand executes a command and decodes its output from CP866 to UTF-8.
func (a *App) TerminalCommand(command string) (string, error) {
	cmd := exec.Command("powershell", "-Command", command)
	output, err := cmd.CombinedOutput()
	reader := transform.NewReader(bytes.NewReader(output), charmap.CodePage866.NewDecoder())

	// ИЗМЕНЕНО: Используем io.ReadAll вместо ioutil.ReadAll
	utf8Output, readErr := io.ReadAll(reader)
	if readErr != nil {
		if err != nil {
			return "", err
		}
		return "", readErr
	}

	if err != nil {
		return string(utf8Output), err
	}

	return string(utf8Output), nil
}

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "Local-first LLM Notebook",
		Width:  1280,
		Height: 800,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.OnStartup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		log.Fatal(err)
	}
}
