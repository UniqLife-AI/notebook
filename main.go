// File: main.go
// Намерение: Добавить новую функцию `CheckFileExists` для атомарной
// проверки существования файла на диске. Это позволит фронтенду
// безопасно проверять, можно ли создать новый чат, не перезаписав старый.

package main

import (
	"bytes"
	"context"
	"embed"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"golang.org/x/text/encoding/charmap"
	"golang.org/x/text/transform"
)

//go:embed all:frontend/dist
var assets embed.FS

// App представляет собой основную структуру нашего приложения.
type App struct {
	ctx context.Context
}

// NewApp создает новый экземпляр App.
func NewApp() *App {
	return &App{}
}

// OnStartup является частью жизненного цикла Wails.
func (a *App) OnStartup(ctx context.Context) {
	a.ctx = ctx
}

// ShowConfirmationDialog показывает нативный диалог подтверждения.
func (a *App) ShowConfirmationDialog(title string, message string) (string, error) {
	result, err := runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
		Type:          runtime.QuestionDialog,
		Title:         title,
		Message:       message,
		Buttons:       []string{"Да, удалить", "Нет, оставить"},
		DefaultButton: "Нет, оставить",
	})
	if err != nil {
		log.Printf("Ошибка вызова диалогового окна: %s", err)
		return "", err
	}
	return result, nil
}

// GetChatSessionPath конструирует полный, OS-специфичный путь к файлу чата.
func (a *App) GetChatSessionPath(baseDir string, fileName string) string {
	chatsDir := a.getChatsDir(baseDir)
	return filepath.Join(chatsDir, fileName)
}

// SelectDirectory открывает системный диалог для выбора каталога.
func (a *App) SelectDirectory(defaultPath string) (string, error) {
	path, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title:            "Выберите каталог",
		DefaultDirectory: defaultPath,
	})
	if err != nil {
		log.Printf("Ошибка выбора каталога: %s", err)
		return "", err
	}
	return path, nil
}

// ReadFile читает содержимое файла по указанному пути.
func (a *App) ReadFile(filePath string) (string, error) {
	bytes, err := os.ReadFile(filePath)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

// WriteFile записывает контент в файл по указанному пути.
func (a *App) WriteFile(filePath string, content string) error {
	return os.WriteFile(filePath, []byte(content), 0644)
}

// ИЗМЕНЕНИЕ: Новая функция для проверки существования файла.
// CheckFileExists проверяет, существует ли файл по указанному пути.
func (a *App) CheckFileExists(filePath string) (bool, error) {
	_, err := os.Stat(filePath)
	if err == nil {
		// Ошибки нет, значит файл или каталог существует.
		return true, nil
	}
	if os.IsNotExist(err) {
		// Ошибка "не существует" - это ожидаемый результат, а не сбой.
		return false, nil
	}
	// Любая другая ошибка является непредвиденной.
	return false, err
}

type FileInfo struct {
	Name        string `json:"name"`
	IsDirectory bool   `json:"isDirectory"`
	Path        string `json:"path"`
}

// ListFiles возвращает список файлов и каталогов по указанному пути.
func (a *App) ListFiles(dirPath string) ([]FileInfo, error) {
	entries, err := os.ReadDir(dirPath)
	if err != nil {
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

// TerminalCommand выполняет команду в системной оболочке.
func (a *App) TerminalCommand(command string) (string, error) {
	cmd := exec.Command("powershell", "-Command", command)
	output, err := cmd.CombinedOutput()
	reader := transform.NewReader(bytes.NewReader(output), charmap.CodePage866.NewDecoder())
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

type ChatFile struct {
	Path    string `json:"path"`
	Content string `json:"content"`
}

// getChatsDir является внутренним хелпером для определения пути к каталогу с чатами.
func (a *App) getChatsDir(projectDir string) string {
	return filepath.Join(projectDir, ".ai-notebook", "chats")
}

// LoadChatSessions загружает все сессии чатов из каталога .ai-notebook/chats.
func (a *App) LoadChatSessions(projectDir string) ([]ChatFile, error) {
	chatsDir := a.getChatsDir(projectDir)
	entries, err := os.ReadDir(chatsDir)
	if os.IsNotExist(err) {
		return []ChatFile{}, nil
	}
	if err != nil {
		log.Printf("Ошибка чтения каталога чатов %s: %s", chatsDir, err)
		return nil, err
	}

	var chatFiles []ChatFile
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".md") {
			filePath := filepath.Join(chatsDir, entry.Name())
			content, readErr := os.ReadFile(filePath)
			if readErr != nil {
				log.Printf("Ошибка чтения файла чата %s: %s", filePath, readErr)
				continue
			}
			chatFiles = append(chatFiles, ChatFile{
				Path:    filePath,
				Content: string(content),
			})
		}
	}
	return chatFiles, nil
}

// SaveChatSession сохраняет одну сессию чата в файл .md.
func (a *App) SaveChatSession(filePath string, content string) error {
	dir := filepath.Dir(filePath)
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		log.Printf("Ошибка создания каталога %s: %s", dir, err)
		return err
	}
	err := os.WriteFile(filePath, []byte(content), 0644)
	if err != nil {
		log.Printf("Ошибка сохранения файла чата %s: %s", filePath, err)
	}
	return err
}

// DeleteChatSession удаляет файл сессии чата.
func (a *App) DeleteChatSession(filePath string) error {
	err := os.Remove(filePath)
	if err != nil {
		log.Printf("Ошибка удаления файла чата %s: %s", filePath, err)
	}
	return err
}

// main является точкой входа в приложение.
func main() {
	app := NewApp()
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
