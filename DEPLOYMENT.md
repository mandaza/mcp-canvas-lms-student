# Deployment Guide

## Quick Deployment Steps

### 1. Clone and Setup
```bash
git clone <your-repository-url>
cd canvas-mcp
npm install
npm run build
```

### 2. Configure Canvas API Access

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env` with your Canvas credentials:
```env
CANVAS_BASE_URL=https://your-institution.instructure.com
CANVAS_ACCESS_TOKEN=your_canvas_access_token_here
```

### 3. Configure Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "canvas": {
      "command": "node",
      "args": ["/absolute/path/to/canvas-mcp/dist/index.js"],
      "env": {
        "CANVAS_BASE_URL": "https://your-institution.instructure.com",
        "CANVAS_ACCESS_TOKEN": "your_canvas_access_token_here"
      }
    }
  }
}
```

### 4. Restart Claude Desktop

Completely restart Claude Desktop for the configuration to take effect.

### 5. Test

Try asking Claude: "Show me my Canvas courses"

## Getting Your Canvas Access Token

1. Log into your Canvas LMS
2. Go to **Account → Settings**
3. Scroll to **"Approved Integrations"**
4. Click **"+ New Access Token"**
5. Enter purpose: "MCP Server Access"
6. Copy the generated token

⚠️ **Security**: Never share or commit your access token to version control.

## Troubleshooting

**Common Issues:**

- **"No tools available"**: Check Claude Desktop configuration file syntax
- **"Authentication failed"**: Verify Canvas URL and access token
- **"Server not found"**: Ensure absolute path to `dist/index.js` is correct
- **"Permission denied"**: Run `chmod +x dist/index.js` after building

**Verify Installation:**
```bash
# Test the server directly
node dist/index.js
# Should output: "Canvas MCP Server running on stdio"
```

## Updates

To update the server:
```bash
git pull
npm install
npm run build
# Restart Claude Desktop
```