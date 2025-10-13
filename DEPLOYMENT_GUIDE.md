# Production Deployment Guide

This guide covers hosting your Canvas MCP server so it can be accessed from anywhere via HTTP/HTTPS.

## Table of Contents
- [Hosting Options](#hosting-options)
- [Security Setup (Required!)](#security-setup-required)
- [Deployment Methods](#deployment-methods)
- [Cloud Platform Guides](#cloud-platform-guides)
- [Monitoring & Maintenance](#monitoring--maintenance)

---

## Hosting Options

### Option 1: Cloud VPS (Recommended for Production)
**Best for:** Production use, remote access, multiple integrations

**Providers:**
- DigitalOcean Droplets ($4-6/month)
- AWS EC2 (t2.micro - free tier eligible)
- Google Cloud Compute Engine
- Linode
- Vultr
- Hetzner

**Pros:**
- Public IP address
- Always online
- Scalable
- Professional setup

**Cons:**
- Monthly cost
- Requires server management

### Option 2: Platform-as-a-Service (Easiest)
**Best for:** Quick deployment, minimal management

**Providers:**
- Railway.app (Free tier available)
- Render.com (Free tier available)
- Fly.io (Free tier available)
- Heroku
- Vercel (with limitations for long-running processes)

**Pros:**
- Very easy deployment
- Automatic SSL/HTTPS
- Built-in monitoring
- Often includes free tier

**Cons:**
- May sleep on free tier
- Less control
- Can be more expensive at scale

### Option 3: Self-Hosted (Behind NAT)
**Best for:** Home lab, testing, learning

**Requirements:**
- Static IP or DDNS service
- Port forwarding on router
- Reverse proxy (nginx/Caddy)

**Pros:**
- No monthly costs
- Full control
- Use existing hardware

**Cons:**
- Complex network setup
- Potential security risks
- Downtime during outages
- ISP may block ports

### Option 4: Tunnel Services
**Best for:** Quick testing, demos, temporary access

**Providers:**
- ngrok (Free tier: 1 online process)
- Cloudflare Tunnel (Free)
- LocalTunnel (Free)
- Tailscale (Free for personal use)

**Pros:**
- Instant public URL
- No port forwarding needed
- Good for testing

**Cons:**
- URL may change (free tier)
- Limited features on free tier
- Not recommended for production

---

## Security Setup (Required!)

⚠️ **CRITICAL**: Before exposing your server to the internet, you MUST add authentication!

### Why Security Matters

Your Canvas access token provides access to all your course data. Without authentication:
- Anyone can call your endpoints
- Your Canvas token could be exposed
- Unauthorized access to your academic information

### Add API Key Authentication

Let's add a simple but effective API key authentication to your HTTP server.

#### Step 1: Update .env file

```bash
# Canvas LMS Configuration
CANVAS_BASE_URL=https://your-institution.instructure.com
CANVAS_ACCESS_TOKEN=your_canvas_access_token_here

# HTTP Server Configuration
PORT=3001
HOST=0.0.0.0

# Security (ADD THIS!)
API_KEY=your-secure-random-api-key-here
# Generate a secure key: openssl rand -hex 32
```

#### Step 2: Update openwebui-server.ts

Add authentication middleware before your routes. I'll provide the code below.

---

## Deployment Methods

### Method 1: Deploy to Railway.app (Easiest)

Railway is perfect for Node.js apps and has a generous free tier.

#### Steps:

1. **Install Railway CLI** (optional, or use web)
   ```bash
   npm install -g @railway/cli
   ```

2. **Create railway.json**
   ```json
   {
     "$schema": "https://railway.app/railway.schema.json",
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "npm run start:http",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

3. **Push to GitHub** (Railway can deploy from GitHub)
   ```bash
   git add .
   git commit -m "Add deployment configuration"
   git push origin main
   ```

4. **Deploy via Railway Web UI**
   - Go to https://railway.app
   - Create new project
   - Connect GitHub repository
   - Add environment variables:
     - `CANVAS_BASE_URL`
     - `CANVAS_ACCESS_TOKEN`
     - `API_KEY`
     - `PORT` (Railway sets this automatically, but you can override)
   - Deploy!

5. **Get your public URL**
   - Railway provides: `https://your-app.railway.app`
   - Use in n8n: `https://your-app.railway.app/message`

**Cost:** Free tier includes $5 credit/month (enough for small apps)

---

### Method 2: Deploy to Render.com

Similar to Railway with a permanent free tier.

#### Steps:

1. **Create render.yaml**
   ```yaml
   services:
     - type: web
       name: canvas-mcp-server
       env: node
       buildCommand: npm install && npm run build
       startCommand: npm run start:http
       envVars:
         - key: CANVAS_BASE_URL
           sync: false
         - key: CANVAS_ACCESS_TOKEN
           sync: false
         - key: API_KEY
           sync: false
         - key: PORT
           value: 3001
   ```

2. **Push to GitHub**

3. **Connect to Render**
   - Go to https://render.com
   - New → Web Service
   - Connect repository
   - Configure environment variables
   - Deploy

**Cost:** Free tier available (sleeps after 15 min inactivity)

---

### Method 3: Deploy to DigitalOcean VPS

For full control and always-on service.

#### Prerequisites:
- DigitalOcean account
- Basic Linux knowledge

#### Steps:

1. **Create Droplet**
   ```bash
   # Choose:
   - Ubuntu 22.04 LTS
   - Basic plan ($4-6/month)
   - Datacenter near you
   ```

2. **SSH into server**
   ```bash
   ssh root@your-droplet-ip
   ```

3. **Install Node.js**
   ```bash
   # Install Node.js 18.x
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Verify
   node --version
   npm --version
   ```

4. **Install PM2 (Process Manager)**
   ```bash
   npm install -g pm2
   ```

5. **Clone and setup project**
   ```bash
   # Create app directory
   mkdir -p /var/www/canvas-mcp
   cd /var/www/canvas-mcp

   # Clone your repo (or use git, scp, etc.)
   git clone https://github.com/yourusername/canvas-mcp.git .

   # Install dependencies
   npm install

   # Build
   npm run build
   ```

6. **Create .env file**
   ```bash
   nano .env
   # Add your environment variables
   ```

7. **Start with PM2**
   ```bash
   pm2 start npm --name "canvas-mcp" -- run start:http
   pm2 save
   pm2 startup
   ```

8. **Setup nginx reverse proxy**
   ```bash
   # Install nginx
   sudo apt install nginx

   # Create config
   sudo nano /etc/nginx/sites-available/canvas-mcp
   ```

   Add this configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;  # or use IP address

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```

9. **Enable site and restart nginx**
   ```bash
   sudo ln -s /etc/nginx/sites-available/canvas-mcp /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

10. **Setup SSL with Let's Encrypt** (Highly Recommended!)
    ```bash
    # Install certbot
    sudo apt install certbot python3-certbot-nginx

    # Get certificate
    sudo certbot --nginx -d your-domain.com

    # Auto-renewal is setup automatically
    ```

11. **Setup firewall**
    ```bash
    sudo ufw allow 22      # SSH
    sudo ufw allow 80      # HTTP
    sudo ufw allow 443     # HTTPS
    sudo ufw enable
    ```

**Your server is now live at:**
- HTTP: `http://your-domain.com/message`
- HTTPS: `https://your-domain.com/message` (after SSL setup)

---

### Method 4: Docker Deployment

Perfect for containerized environments.

#### Create Dockerfile

See the `Dockerfile` I'll create below.

#### Docker Compose Setup

See the `docker-compose.yml` I'll create below.

---

### Method 5: Quick Testing with ngrok

For quick testing without full deployment.

#### Steps:

1. **Install ngrok**
   ```bash
   # macOS
   brew install ngrok

   # Or download from https://ngrok.com
   ```

2. **Start your server locally**
   ```bash
   npm run start:http
   ```

3. **Create tunnel**
   ```bash
   ngrok http 3001
   ```

4. **Use the public URL**
   ```
   Forwarding: https://abc123.ngrok.io -> http://localhost:3001
   ```

5. **Use in n8n**
   ```
   URL: https://abc123.ngrok.io/message
   ```

**Note:** Free tier URL changes each restart. Paid plan gives fixed domains.

---

## Cloud Platform Guides

### AWS EC2 Deployment

1. **Launch EC2 Instance**
   - AMI: Ubuntu Server 22.04 LTS
   - Instance type: t2.micro (free tier)
   - Security group: Allow ports 22, 80, 443

2. **Follow DigitalOcean steps above** (same process)

3. **Use Elastic IP** for permanent IP address

### Google Cloud Compute Engine

1. **Create VM Instance**
   - Machine type: e2-micro (free tier)
   - Boot disk: Ubuntu 22.04
   - Firewall: Allow HTTP/HTTPS

2. **Follow DigitalOcean steps above**

3. **Reserve static IP** in VPC network settings

### Fly.io Deployment

1. **Install flyctl**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login and initialize**
   ```bash
   flyctl auth login
   flyctl launch
   ```

3. **Configure fly.toml** (I'll create this below)

4. **Deploy**
   ```bash
   flyctl deploy
   ```

---

## Using Your Hosted Server

### From n8n

Update your HTTP Request nodes:

```json
{
  "url": "https://your-domain.com/message",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json",
    "X-API-Key": "your-api-key-here"
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

### From Claude Desktop

Claude Desktop uses stdio, so it runs locally. No hosting needed!

### From Open WebUI

Update your MCP server URL:
```
https://your-domain.com/sse
```

Add API key in headers if implemented.

---

## Monitoring & Maintenance

### Check Server Health

```bash
# Test health endpoint
curl https://your-domain.com/health

# Expected response
{"status":"ok","server":"canvas-mcp","version":"1.0.0"}
```

### PM2 Monitoring (VPS)

```bash
# Check status
pm2 status

# View logs
pm2 logs canvas-mcp

# Restart if needed
pm2 restart canvas-mcp

# Monitor resources
pm2 monit
```

### View Logs

```bash
# PM2 logs
pm2 logs

# nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
journalctl -u canvas-mcp
```

### Update Deployment

```bash
# SSH into server
cd /var/www/canvas-mcp

# Pull latest changes
git pull

# Install dependencies
npm install

# Rebuild
npm run build

# Restart
pm2 restart canvas-mcp
```

### Backup Important Data

```bash
# Backup .env file
cp .env .env.backup

# Backup nginx config
sudo cp /etc/nginx/sites-available/canvas-mcp ~/canvas-mcp.nginx.backup
```

---

## Security Best Practices

### 1. Use Environment Variables
Never hardcode secrets in your code.

### 2. Enable HTTPS
Always use SSL/TLS in production. Use Let's Encrypt (free).

### 3. Implement Rate Limiting
Prevent abuse by limiting requests per IP.

### 4. Use Strong API Keys
Generate with: `openssl rand -hex 32`

### 5. Keep Software Updated
```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Update Node.js packages
npm update
```

### 6. Monitor Access Logs
Regularly check who's accessing your server.

### 7. Use Firewall
Only allow necessary ports (22, 80, 443).

### 8. Rotate Canvas Tokens
Periodically regenerate your Canvas access token.

---

## Cost Estimation

| Platform | Free Tier | Paid (Small) | Best For |
|----------|-----------|--------------|----------|
| Railway | $5/month credit | ~$5-10/month | Easy deployment |
| Render | Yes (sleeps) | $7/month | Simple apps |
| DigitalOcean | No | $4-6/month | Full control |
| Fly.io | Yes (limited) | $1.94/month | Global deployment |
| AWS EC2 | 12 months free | $3-10/month | Enterprise |
| ngrok | Limited | $8/month | Testing only |
| Cloudflare Tunnel | Yes | Free | Home hosting |

---

## Troubleshooting

### Server Not Responding

1. Check if server is running
   ```bash
   pm2 status
   # or
   curl http://localhost:3001/health
   ```

2. Check firewall rules
   ```bash
   sudo ufw status
   ```

3. Check nginx config
   ```bash
   sudo nginx -t
   ```

### Canvas API Errors

1. Verify token is valid
2. Check Canvas base URL
3. Ensure Canvas isn't rate limiting you

### Connection Timeout

1. Check server location (latency)
2. Increase timeout in n8n
3. Optimize Canvas API calls

### SSL Certificate Issues

```bash
# Renew certificate manually
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

---

## Recommended Setup for Production

For a reliable, secure, production setup:

1. **Hosting:** DigitalOcean VPS ($6/month) or Railway ($5-10/month)
2. **Domain:** Your own domain with DNS
3. **SSL:** Let's Encrypt (free)
4. **Process Manager:** PM2
5. **Reverse Proxy:** nginx
6. **Monitoring:** PM2 + Uptime monitoring (UptimeRobot free tier)
7. **Backups:** Daily .env and config backups
8. **Security:** API key auth + HTTPS + firewall

**Total monthly cost:** $4-10/month for reliable 24/7 service

---

## Next Steps

1. Choose your hosting platform
2. Implement API key authentication (see code below)
3. Deploy using one of the methods above
4. Setup SSL/HTTPS
5. Update your n8n workflows with new URL
6. Setup monitoring
7. Test thoroughly!

---

## Quick Start Recommendation

**For beginners:** Start with Railway.app or Render.com
- Easiest setup
- Free tier available
- Automatic SSL
- Good documentation

**For advanced users:** DigitalOcean VPS
- Full control
- Always-on
- Cost-effective
- Professional setup

**For testing:** ngrok or Cloudflare Tunnel
- Instant access
- No configuration
- Good for demos

Choose based on your needs and technical comfort level!
