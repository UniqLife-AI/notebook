package main

import (
	"context"
	"embed"
	"log"
	"os"
	"os/exec"
	"path/filepath" // <-- ДОБАВЛЕН ИМПОРТ

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/runtime"
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
// @comment: Мы используем структуру, чтобы фронтенд знал, что рендерить (файл или папку).
type FileInfo struct {
	Name        string `json:"name"`
	IsDirectory bool   `json:"isDirectory"`
	Path        string `json:"path"`
}

// ListFiles сканирует указанную директорию и возвращает список файлов и папок.
// @comment: Эта функция заменит старую логику из FileSystemService.
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

// TerminalCommand executes a command in the integrated terminal.
func (a *App) TerminalCommand(command string) (string, error) {
	cmd := exec.Command("powershell", "-Command", command)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", err
	}
	return string(output), nil
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
