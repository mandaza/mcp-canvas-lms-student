# Deployment Guide

## Quick Deployment Steps (Recommended)

### 1. Install Globally from GitHub
```bash
npm install -g git+https://github.com/mandaza/mcp-canvas-lms-student.git
```

### 2. Configure Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "canvas": {
      "command": "canvas-mcp",
      "env": {
        "CANVAS_BASE_URL": "https://your-institution.instructure.com",
        "CANVAS_ACCESS_TOKEN": "your_canvas_access_token_here"
      }
    }
  }
}
```

## Alternative: Local Development Setup

### 1. Clone and Setup
```bash
git clone https://github.com/mandaza/mcp-canvas-lms-student.git
cd mcp-canvas-lms-student
npm install
npm run build
```

### 2. Configure Claude Desktop (Local Path)

```json
{
  "mcpServers": {
    "canvas": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-canvas-lms-student/dist/index.js"],
      "env": {
        "CANVAS_BASE_URL": "https://your-institution.instructure.com",
        "CANVAS_ACCESS_TOKEN": "your_canvas_access_token_here"
      }
    }
  }
}
```

### 3. Restart Claude Desktop

Completely restart Claude Desktop for the configuration to take effect.

### 4. Test

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
# Test the global installation
canvas-mcp
# Should output: "Canvas MCP Server running on stdio"

# Or test local installation
node dist/index.js
```

## Updates

### Global Installation Updates
```bash
npm update -g git+https://github.com/mandaza/mcp-canvas-lms-student.git
# Restart Claude Desktop
```

### Local Installation Updates
```bash
git pull
npm install
npm run build
# Restart Claude Desktop
```