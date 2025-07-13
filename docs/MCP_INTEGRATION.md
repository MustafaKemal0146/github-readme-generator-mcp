# MCP Integration Guide

Bu doküman, MCP README Generator'ı farklı AI client'larıyla nasıl entegre edeceğinizi açıklar.

## Claude Desktop Entegrasyonu

### 1. MCP Server'ı Kur

```bash
npm install -g mcp-readme-generator
```

### 2. Claude Desktop Konfigürasyonu

`~/Library/Application Support/Claude/claude_desktop_config.json` dosyasını düzenleyin:

```json
{
  "mcpServers": {
    "readme-generator": {
      "command": "mcp-readme-generator",
      "env": {
        "GITHUB_TOKEN": "your_github_token_here"
      }
    }
  }
}
```

### 3. Claude'u Yeniden Başlatın

Claude Desktop'ı kapatıp yeniden açın. Artık README generator tool'larını kullanabilirsiniz.

## Continue.dev Entegrasyonu

### 1. Continue Konfigürasyonu

`.continue/config.json` dosyasına ekleyin:

```json
{
  "models": [...],
  "mcpServers": [
    {
      "name": "readme-generator",
      "command": "mcp-readme-generator",
      "env": {
        "GITHUB_TOKEN": "your_github_token_here"
      }
    }
  ]
}
```

## Cursor Entegrasyonu

### 1. Cursor Settings

Cursor ayarlarında MCP server'ı ekleyin:

```json
{
  "mcp.servers": {
    "readme-generator": {
      "command": "mcp-readme-generator",
      "args": [],
      "env": {
        "GITHUB_TOKEN": "your_github_token_here"
      }
    }
  }
}
```

## Kullanım Örnekleri

### Temel README Oluşturma

```
Bu GitHub repository için README oluştur: https://github.com/facebook/react
```

### Özelleştirilmiş README

```
https://github.com/vercel/next.js repository'si için Türkçe, modern stil README oluştur. Badge'ler ve proje ağacı dahil et.
```

### Repository Analizi

```
Bu repository'yi analiz et: https://github.com/microsoft/vscode
```

## n8n Workflow Tetikleme

```
n8n workflow'unu tetikle:
- Webhook URL: https://your-n8n.com/webhook/readme
- Repository: https://github.com/user/project
- Bildirim gönder: true
```

## Troubleshooting

### GitHub Rate Limit

GitHub token olmadan API rate limit'e takılabilirsiniz:

```bash
export GITHUB_TOKEN=your_token_here
```

### MCP Server Başlatma Sorunu

Server'ın doğru yolda olduğundan emin olun:

```bash
which mcp-readme-generator
```

### Log Kontrolü

Debug için log'ları kontrol edin:

```bash
mcp-readme-generator --debug
```

## API Referansı

### generate_readme

Repository için README oluşturur.

**Parametreler:**
- `repoUrl` (string, required): GitHub repository URL'i
- `language` (string): 'tr', 'en', 'multi' (default: 'en')
- `style` (string): 'minimal', 'modern', 'detailed' (default: 'modern')
- `includeBadges` (boolean): Badge'leri dahil et (default: true)
- `includeTree` (boolean): Proje ağacını dahil et (default: true)

### analyze_repository

Repository'yi analiz eder.

**Parametreler:**
- `repoUrl` (string, required): GitHub repository URL'i
- `deep` (boolean): Derin analiz yap (default: false)

### trigger_n8n_workflow

n8n workflow'unu tetikler.

**Parametreler:**
- `webhookUrl` (string, required): n8n webhook URL'i
- `repoUrl` (string, required): GitHub repository URL'i
- `config` (object): Konfigürasyon ayarları