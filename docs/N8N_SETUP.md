# n8n Integration Setup Guide

Bu rehber, MCP README Generator'ı n8n ile nasıl entegre edeceğinizi adım adım açıklar.

## 🚀 Hızlı Başlangıç

### 1. n8n Kurulumu

```bash
# Docker ile n8n kurulumu
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# Veya npm ile
npm install -g n8n
n8n start
```

### 2. Workflow Import

1. n8n arayüzünde "Import from file" seçin
2. `n8n-workflows/readme-generator-workflow.json` dosyasını yükleyin
3. Workflow otomatik olarak yüklenecek

### 3. Credentials Ayarları

#### GitHub Token

1. n8n'de "Credentials" → "Add Credential" → "HTTP Header Auth"
2. Name: `GitHub Token`
3. Header Name: `Authorization`
4. Header Value: `token YOUR_GITHUB_TOKEN`

#### Email Credentials (Opsiyonel)

1. "Credentials" → "Add Credential" → "SMTP"
2. Email provider bilgilerinizi girin

## 🔧 Workflow Konfigürasyonu

### Webhook URL

Workflow aktif olduktan sonra webhook URL'inizi alın:

```
https://your-n8n-instance.com/webhook/readme-webhook
```

### Test Request

```bash
curl -X POST https://your-n8n-instance.com/webhook/readme-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/facebook/react",
    "config": {
      "language": "tr",
      "style": "modern",
      "notify": true
    }
  }'
```

## 📋 Workflow Detayları

### Node'lar

1. **Webhook Trigger**: HTTP POST isteklerini alır
2. **Process Input**: Gelen veriyi işler ve doğrular
3. **GitHub API**: Repository bilgilerini çeker
4. **GitHub Contents**: Dosya listesini alır
5. **Generate README**: README içeriğini oluşturur
6. **Check Notification**: Bildirim gerekip gerekmediğini kontrol eder
7. **Send Email**: Email bildirimi gönderir (opsiyonel)
8. **Webhook Response**: Sonucu döner

### Veri Akışı

```
Webhook → Process → GitHub API → Contents → Generate → Notify → Response
```

## 🎯 Kullanım Senaryoları

### 1. Otomatik README Güncelleme

GitHub webhook'u ile repository güncellendiğinde otomatik README oluşturma:

```json
{
  "repoUrl": "https://github.com/user/project",
  "config": {
    "language": "en",
    "style": "detailed",
    "notify": false
  }
}
```

### 2. Batch Processing

Birden fazla repository için README oluşturma:

```javascript
// n8n Code node
const repos = [
  "https://github.com/user/project1",
  "https://github.com/user/project2",
  "https://github.com/user/project3"
];

return repos.map(repoUrl => ({
  repoUrl,
  config: {
    language: "tr",
    style: "modern"
  }
}));
```

### 3. Scheduled Generation

Haftalık README güncellemeleri için cron job:

```
0 9 * * 1  # Her Pazartesi saat 09:00
```

## 🔍 Monitoring ve Logging

### Execution Logs

n8n'de "Executions" sekmesinden workflow çalışmalarını izleyin:

- ✅ Başarılı çalışmalar
- ❌ Hata durumları
- ⏱️ Çalışma süreleri

### Error Handling

Workflow'da hata yönetimi için:

```javascript
try {
  // README generation logic
} catch (error) {
  return {
    success: false,
    error: error.message,
    timestamp: new Date().toISOString()
  };
}
```

## 🔧 Özelleştirme

### Custom Templates

README template'lerini özelleştirmek için "Generate README" node'unu düzenleyin:

```javascript
const customTemplate = `
# 🎨 ${repoData.name}

${config.includeBadges ? badges.join('\n') : ''}

## 🌟 Custom Section
Your custom content here...

${standardSections}
`;
```

### Additional Integrations

- **Slack**: README oluşturulduğunda Slack bildirimi
- **Discord**: Discord webhook entegrasyonu
- **Jira**: Issue oluşturma
- **Confluence**: Dokümantasyon güncelleme

## 🚨 Troubleshooting

### Common Issues

1. **GitHub Rate Limit**
   ```
   Solution: GitHub token ekleyin
   ```

2. **Webhook Timeout**
   ```
   Solution: Timeout değerini artırın (Settings → Timeout)
   ```

3. **Memory Issues**
   ```
   Solution: n8n memory limit'ini artırın
   ```

### Debug Mode

```bash
# n8n debug mode
N8N_LOG_LEVEL=debug n8n start
```

## 📊 Performance Optimization

### Caching

Repository verilerini cache'lemek için Redis entegrasyonu:

```javascript
// Check cache first
const cacheKey = `repo:${owner}:${repo}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

// Fetch and cache
const data = await fetchGitHubData();
await redis.setex(cacheKey, 3600, JSON.stringify(data));
```

### Parallel Processing

Birden fazla repository için paralel işleme:

```javascript
const promises = repos.map(repo => 
  generateReadme(repo, config)
);

const results = await Promise.all(promises);
```

## 🔐 Security

### Environment Variables

Hassas bilgileri environment variable'larda saklayın:

```bash
export GITHUB_TOKEN=your_token
export OPENAI_API_KEY=your_key
export SMTP_PASSWORD=your_password
```

### Webhook Security

Webhook'ları güvenli hale getirmek için:

1. HTTPS kullanın
2. Secret token ekleyin
3. IP whitelist uygulayın
4. Rate limiting ekleyin