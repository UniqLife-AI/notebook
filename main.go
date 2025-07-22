package main

import (
    "context"
    "embed"
    "io"
    "log"
    "os/exec"
    "sync"

    "github.com/wailsapp/wails/v2"
    "github.com/wailsapp/wails/v2/pkg/options"
    "github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed all:frontend/dist
var assets embed.FS

type App struct {
    ctx        context.Context
    shellStdin io.WriteCloser
    wg         sync.WaitGroup
}

func NewApp() *App {
    return &App{}
}

func (a *App) startup(ctx context.Context) {
    a.ctx = ctx
    log.Println("INFO: App startup. Starting shell...")
    go a.startShell()
}

func (a *App) startShell() {
    log.Println("INFO: Goroutine started. Attempting to launch 'powershell.exe' using standard os/exec...")
    cmd := exec.Command("powershell.exe", "-NoLogo", "-NoExit")

    stdin, err := cmd.StdinPipe()
    if err != nil {
        log.Printf("FATAL: Failed to get stdin pipe: %v", err)
        return
    }
    a.shellStdin = stdin

    stdout, err := cmd.StdoutPipe()
    if err != nil {
        log.Printf("FATAL: Failed to get stdout pipe: %v", err)
        return
    }

    stderr, err := cmd.StderrPipe()
    if err != nil {
        log.Printf("FATAL: Failed to get stderr pipe: %v", err)
        return
    }

    if err := cmd.Start(); err != nil {
        log.Printf("FATAL: Failed to start command: %v", err)
        return
    }
    log.Println("SUCCESS: PowerShell process started successfully.")

    // Set output encoding to UTF-8 and UI language to Russian
    go func() {
        log.Println("INFO: Setting PowerShell encoding to UTF-8 and UI culture to ru-RU.")
        setupCommand := "$OutputEncoding = [System.Text.Encoding]::UTF8; [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; [System.Threading.Thread]::CurrentThread.CurrentUICulture = 'ru-RU'\r\n"
        _, err := stdin.Write([]byte(setupCommand))
        if err != nil {
            log.Printf("ERROR: Failed to set PowerShell encoding and culture: %v", err)
        }
    }()

    a.wg.Add(2)
    go a.pipeOutput(stdout, "stdout")
    go a.pipeOutput(stderr, "stderr")

    log.Println("INFO: Waiting for process to exit...")
    cmd.Wait()
    a.wg.Wait()
    log.Println("INFO: Shell process has fully exited.")
}

func (a *App) pipeOutput(pipe io.ReadCloser, pipeName string) {
    defer a.wg.Done()
    buffer := make([]byte, 4096)
    for {
        n, err := pipe.Read(buffer)
        if err != nil {
            if err != io.EOF {
                log.Printf("ERROR: Failed to read from %s: %v", pipeName, err)
            }
            break
        }
        if n > 0 {
            data := string(buffer[:n])
            log.Printf("DATA: Read %d bytes from %s. Emitting 'shell-output'.", n, pipeName)
            runtime.EventsEmit(a.ctx, "shell-output", data)
        }
    }
    log.Printf("INFO: Finished reading from %s pipe.", pipeName)
}

func (a *App) WriteToShell(data string) {
    if a.shellStdin != nil {
        log.Printf("WRITE: Writing %d bytes to stdin.", len(data))
        _, err := a.shellStdin.Write([]byte(data))
        if err != nil {
            log.Printf("ERROR: Failed to write to stdin: %v", err)
        }
    } else {
        log.Println("WARN: WriteToShell called but stdin is not available.")
    }
}

func main() {
    app := NewApp()
    err := wails.Run(&options.App{
        Title:     "local-first-llm-notebook",
        Width:     1024,
        Height:    768,
        Assets:    assets,
        OnStartup: app.startup,
        Bind: []interface{}{
            app,
        },
    })

    if err != nil {
        log.Fatal(err)
    }
}