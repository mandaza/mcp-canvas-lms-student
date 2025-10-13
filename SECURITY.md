# Security Guide for Canvas MCP Server

This document outlines security best practices and authentication setup for your Canvas MCP server.

## Table of Contents
- [Why Security Matters](#why-security-matters)
- [Quick Setup](#quick-setup)
- [Authentication Methods](#authentication-methods)
- [Using API Keys](#using-api-keys)
- [Best Practices](#best-practices)
- [Security Checklist](#security-checklist)

---

## Why Security Matters

Your Canvas MCP server provides access to:
- Personal course information
- Assignment details and submissions
- Announcements and communications
- Course files and materials
- Your Canvas access token

**Without proper security:**
- Anyone can access your academic data
- Your Canvas token could be exposed
- Unauthorized users could abuse your server
- Your Canvas account could be compromised

---

## Quick Setup

### Step 1: Generate API Key

```bash
# Generate a secure 32-byte random key
openssl rand -hex 32
```

Example output:
```
a7f5c9d8e2b4f6a1c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9
```

### Step 2: Add to .env File

```bash
# Edit your .env file
nano .env

# Add this line (use your generated key)
API_KEY=a7f5c9d8e2b4f6a1c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9
```

### Step 3: Restart Server

```bash
npm run start:http
```

You should see:
```
Canvas MCP Server (HTTP/SSE) running on http://0.0.0.0:3001
```

(No warning about unprotected server!)

### Step 4: Test Authentication

**Without API Key (should fail):**
```bash
curl http://localhost:3001/message \
  -H "Content-Type: application/json" \
  -d '{"id":"test","method":"tools/list","params":{}}'
```

Expected response:
```json
{
  "error": "Authentication required",
  "message": "Please provide API key in X-API-Key header"
}
```

**With API Key (should succeed):**
```bash
curl http://localhost:3001/message \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{"id":"test","method":"tools/list","params":{}}'
```

Expected response: List of available tools

---

## Authentication Methods

The server supports two authentication methods:

### Method 1: X-API-Key Header (Recommended)

```bash
curl -X POST http://your-server.com/message \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{"id":"1","method":"tools/call","params":{"name":"list_courses","arguments":{}}}'
```

### Method 2: Authorization Bearer Token

```bash
curl -X POST http://your-server.com/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key-here" \
  -d '{"id":"1","method":"tools/call","params":{"name":"list_courses","arguments":{}}}'
```

Both methods work identically. Choose whichever fits your integration better.

---

## Using API Keys

### In n8n Workflows

Add the API key to your HTTP Request nodes:

**Configuration:**
```json
{
  "url": "https://your-server.com/message",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json",
    "X-API-Key": "{{ $env.CANVAS_MCP_API_KEY }}"
  }
}
```

**Store the key in n8n environment variables:**
1. n8n Settings → Variables
2. Add: `CANVAS_MCP_API_KEY` = your API key
3. Reference with: `{{ $env.CANVAS_MCP_API_KEY }}`

### In Open WebUI

When configuring the MCP server, add custom headers:

```json
{
  "url": "https://your-server.com/sse",
  "headers": {
    "X-API-Key": "your-api-key-here"
  }
}
```

### In Custom Applications

**JavaScript/Node.js:**
```javascript
const response = await fetch('https://your-server.com/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.CANVAS_MCP_API_KEY
  },
  body: JSON.stringify({
    id: 'req-001',
    method: 'tools/call',
    params: { name: 'list_courses', arguments: {} }
  })
});
```

**Python:**
```python
import requests
import os

response = requests.post(
    'https://your-server.com/message',
    headers={
        'Content-Type': 'application/json',
        'X-API-Key': os.environ['CANVAS_MCP_API_KEY']
    },
    json={
        'id': 'req-001',
        'method': 'tools/call',
        'params': {'name': 'list_courses', 'arguments': {}}
    }
)
```

---

## Best Practices

### 1. Never Commit Secrets

**Add to .gitignore:**
```bash
# Already in .gitignore, but verify:
.env
.env.local
.env.*.local
.env.production
```

**Check before committing:**
```bash
# Make sure .env is not tracked
git status

# If .env shows up, remove it:
git rm --cached .env
```

### 2. Use Different Keys for Different Environments

```bash
# .env (local development)
API_KEY=dev-key-12345

# .env.production (production)
API_KEY=prod-key-67890-very-long-secure-key
```

### 3. Rotate Keys Regularly

**Monthly rotation recommended:**
```bash
# Generate new key
openssl rand -hex 32

# Update .env
# Update all clients (n8n, Open WebUI, etc.)
# Restart server
```

### 4. Use HTTPS in Production

**Always use HTTPS for production deployments:**
- Protects API key in transit
- Prevents man-in-the-middle attacks
- Required for secure authentication

**Setup with Let's Encrypt:**
```bash
sudo certbot --nginx -d your-domain.com
```

### 5. Store Keys Securely

**Good practices:**
- Use environment variables
- Use secret management tools (AWS Secrets Manager, HashiCorp Vault)
- Use password managers for backup storage
- Never share via email or chat

**Bad practices:**
- ❌ Hardcoding in source code
- ❌ Storing in plain text files
- ❌ Sharing via insecure channels
- ❌ Using weak/predictable keys

### 6. Monitor Access Logs

**Check server logs regularly:**
```bash
# PM2 logs
pm2 logs canvas-mcp | grep "403\|401"

# nginx logs
sudo tail -f /var/log/nginx/access.log | grep "POST"
```

Look for:
- Failed authentication attempts (401, 403)
- Unusual request patterns
- Requests from unknown IPs

### 7. Implement Rate Limiting

Consider adding rate limiting to prevent abuse:

```bash
# In nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
```

### 8. Use IP Whitelisting (Optional)

For extra security, restrict access to known IPs:

**nginx configuration:**
```nginx
# Allow only specific IPs
allow 203.0.113.1;  # Your n8n server
allow 203.0.113.2;  # Your office
deny all;
```

---

## Security Checklist

Before deploying to production:

- [ ] Generated strong API key (`openssl rand -hex 32`)
- [ ] Added `API_KEY` to `.env` file
- [ ] Verified `.env` is in `.gitignore`
- [ ] Never committed secrets to git
- [ ] Setup HTTPS with valid SSL certificate
- [ ] Tested authentication works
- [ ] Updated all clients with API key
- [ ] Configured firewall (only ports 22, 80, 443)
- [ ] Setup monitoring/logging
- [ ] Created backup of configuration
- [ ] Documented API key location (securely!)
- [ ] Setup key rotation schedule
- [ ] Restricted Canvas token permissions (if possible)
- [ ] Configured CORS properly
- [ ] Implemented rate limiting (optional)
- [ ] Setup IP whitelisting (optional)

---

## Development vs Production

### Development Mode

```bash
# .env
API_KEY=  # Empty = no authentication

# Server will start with warning:
⚠️  WARNING: API_KEY is not set. Your server is unprotected!
```

**Use for:**
- Local testing
- Development
- When server is not exposed to internet

### Production Mode

```bash
# .env
API_KEY=a7f5c9d8e2b4f6a1c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9

# Server starts normally with authentication enabled
```

**Required for:**
- Public deployments
- VPS hosting
- Cloud platforms
- Any internet-facing server

---

## Troubleshooting

### Problem: "Authentication required" error

**Cause:** API key not provided or incorrect header

**Solution:**
```bash
# Make sure to include X-API-Key header
curl -H "X-API-Key: your-key" http://your-server.com/message
```

### Problem: "Invalid API key" error

**Cause:** Wrong API key

**Solution:**
1. Check your `.env` file on server
2. Verify the key matches what clients are using
3. Restart server after changing `.env`

### Problem: Health check works but endpoints fail

**Cause:** Health check endpoint skips authentication

**Solution:** This is by design. `/health` is public, all other endpoints require auth.

### Problem: Can't test locally with authentication

**Solution:** Either:
1. Add API_KEY to local `.env`
2. Or leave it empty for local development

---

## Advanced Security

### Adding More Headers

Edit `src/openwebui-server.ts` to add security headers:

```typescript
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  next();
});
```

### Adding Request Logging

```typescript
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
  next();
});
```

### Implementing Rate Limiting

Install `express-rate-limit`:

```bash
npm install express-rate-limit
```

Add to server:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});

app.use(limiter);
```

---

## Getting Help

If you encounter security issues:

1. **Do not share your API key or Canvas token publicly**
2. Check server logs for error details
3. Verify environment variables are set correctly
4. Test with curl first before using integrations
5. Review this guide for common issues

For security vulnerabilities, please report privately to the repository maintainers.

---

## Summary

✅ **Always use API key authentication in production**

✅ **Generate strong random keys**

✅ **Use HTTPS for all production deployments**

✅ **Never commit secrets to version control**

✅ **Rotate keys regularly**

✅ **Monitor access logs**

✅ **Keep software updated**

Security is not optional when exposing your server to the internet. Follow these guidelines to keep your Canvas data safe!
