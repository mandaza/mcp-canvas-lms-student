# Quick Start: Deploy Your Canvas MCP Server

This is a quick guide to get your Canvas MCP server hosted and accessible from anywhere in under 15 minutes.

## Choose Your Path

### 🚀 Path 1: Railway.app (Easiest - Recommended for Beginners)
**Time:** 10 minutes | **Cost:** Free tier ($5 credit/month)

### 🐳 Path 2: Docker + VPS (Most Control)
**Time:** 20 minutes | **Cost:** $4-6/month

### ⚡ Path 3: Quick Test with ngrok (Testing Only)
**Time:** 5 minutes | **Cost:** Free

---

## 🚀 Path 1: Railway.app (Recommended)

### Step 1: Prepare Your Code (5 min)

1. **Generate API Key:**
   ```bash
   openssl rand -hex 32
   ```
   Save this key somewhere safe!

2. **Update .env.example:**
   Already configured! Just note your Canvas details.

3. **Commit to GitHub:**
   ```bash
   git add .
   git commit -m "Add deployment configuration"
   git push origin main
   ```

### Step 2: Deploy to Railway (5 min)

1. **Go to Railway:** https://railway.app

2. **Sign up/Login** with GitHub

3. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `student-mcp` repository

4. **Add Environment Variables:**
   Click on your service → Variables → Add:
   ```
   CANVAS_BASE_URL=https://your-institution.instructure.com
   CANVAS_ACCESS_TOKEN=your_canvas_token_here
   API_KEY=your_generated_api_key_here
   PORT=3001
   NODE_ENV=production
   ```

5. **Deploy:**
   - Railway automatically deploys
   - Wait for build to complete (~2 min)

6. **Get Your URL:**
   - Click "Settings" → "Generate Domain"
   - You'll get: `https://your-app.railway.app`

### Step 3: Test It!

```bash
# Health check
curl https://your-app.railway.app/health

# Test with authentication
curl https://your-app.railway.app/message \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"id":"1","method":"tools/call","params":{"name":"list_courses","arguments":{}}}'
```

### Step 4: Use in n8n

In your n8n HTTP Request nodes:
- **URL:** `https://your-app.railway.app/message`
- **Method:** POST
- **Headers:**
  - `Content-Type: application/json`
  - `X-API-Key: your-api-key`

**✅ Done! Your server is live!**

---

## 🐳 Path 2: Docker + DigitalOcean VPS

### Step 1: Create Droplet (5 min)

1. **Go to DigitalOcean:** https://digitalocean.com
2. **Create Droplet:**
   - Ubuntu 22.04
   - Basic - $4/month
   - Choose datacenter near you
3. **Note the IP address**

### Step 2: Setup Server (10 min)

```bash
# SSH into server
ssh root@your-droplet-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Clone your repo
git clone https://github.com/yourusername/student-mcp.git
cd student-mcp

# Create .env file
nano .env
```

Add to .env:
```bash
CANVAS_BASE_URL=https://your-institution.instructure.com
CANVAS_ACCESS_TOKEN=your_canvas_token_here
API_KEY=your_generated_api_key_here
PORT=3001
HOST=0.0.0.0
NODE_ENV=production
```

### Step 3: Deploy with Docker (2 min)

```bash
# Build and start
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 4: Setup Domain (Optional - 5 min)

If you have a domain:

```bash
# Install nginx
apt install nginx -y

# Create config
nano /etc/nginx/sites-available/canvas-mcp
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable:
```bash
ln -s /etc/nginx/sites-available/canvas-mcp /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Setup SSL
apt install certbot python3-certbot-nginx -y
certbot --nginx -d your-domain.com
```

**✅ Server is live at your domain or IP!**

---

## ⚡ Path 3: Quick Test with ngrok

### Perfect for Testing Before Full Deployment

```bash
# Install ngrok (macOS)
brew install ngrok

# Or download from https://ngrok.com

# Start your server locally
npm run start:http

# In another terminal, create tunnel
ngrok http 3001
```

You'll get:
```
Forwarding: https://abc123.ngrok.io -> http://localhost:3001
```

**Use in n8n:**
```
URL: https://abc123.ngrok.io/message
```

**⚠️ Note:**
- Free tier URL changes on restart
- Good for testing only
- Not for production

---

## Using Your Deployed Server

### In n8n HTTP Request Node

```json
{
  "method": "POST",
  "url": "https://your-server.com/message",
  "headers": {
    "Content-Type": "application/json",
    "X-API-Key": "your-api-key"
  },
  "body": {
    "id": "req-001",
    "method": "tools/call",
    "params": {
      "name": "list_courses",
      "arguments": {}
    }
  }
}
```

### In Open WebUI

Admin Settings → External Tools → Add Server:
- **Type:** MCP (Streamable HTTP)
- **URL:** `https://your-server.com/sse`
- **Headers:**
  ```json
  {
    "X-API-Key": "your-api-key"
  }
  ```

### Test All Available Tools

See [N8N_INTEGRATION.md](N8N_INTEGRATION.md) for complete list of 17 tools and examples.

---

## Security Checklist ✅

Before using in production:

- [ ] Generated strong API key (`openssl rand -hex 32`)
- [ ] Added `API_KEY` to environment variables
- [ ] Using HTTPS (Railway provides this automatically)
- [ ] Never committed `.env` file to git
- [ ] Tested authentication works
- [ ] Updated n8n workflows with new URL and API key
- [ ] Saved API key in password manager

---

## Cost Summary

| Option | Setup Time | Monthly Cost | Best For |
|--------|-----------|--------------|----------|
| Railway | 10 min | Free-$5 | Beginners, quick setup |
| DigitalOcean | 20 min | $4-6 | Full control, always-on |
| Render | 10 min | Free-$7 | Simple apps |
| ngrok | 5 min | Free-$8 | Testing only |

---

## Troubleshooting

### Can't connect to server

```bash
# Check if server is running
curl https://your-server.com/health

# Should return:
{"status":"ok","server":"canvas-mcp","version":"1.0.0"}
```

### Authentication errors

Make sure you're sending the API key:
```bash
curl -H "X-API-Key: your-key" https://your-server.com/message
```

### Canvas API errors

1. Verify Canvas token is valid
2. Check Canvas base URL format
3. Test Canvas API directly

---

## Next Steps

1. ✅ Deploy your server (choose path above)
2. ✅ Test with curl
3. ✅ Update n8n workflows
4. ✅ Import example workflows from `examples/`
5. ✅ Setup monitoring (optional)

See detailed guides:
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Complete deployment options
- [SECURITY.md](SECURITY.md) - Security best practices
- [N8N_INTEGRATION.md](N8N_INTEGRATION.md) - n8n workflow examples

---

## Get Help

- **Deployment issues:** Check [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Security questions:** See [SECURITY.md](SECURITY.md)
- **n8n integration:** Read [N8N_INTEGRATION.md](N8N_INTEGRATION.md)

**Happy deploying! 🚀**
