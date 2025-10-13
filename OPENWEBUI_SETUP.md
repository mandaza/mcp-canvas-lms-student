# Open WebUI Integration Guide

This guide explains how to integrate your Canvas MCP server with Open WebUI using the MCP (Streamable HTTP) protocol.

## Prerequisites

- Open WebUI v0.6.31 or higher
- Node.js 18+ installed
- Canvas LMS access token
- Your Canvas instance URL

## Installation & Setup

### 1. Install and Build the MCP Server

```bash
# Clone or navigate to the repository
cd student-mcp

# Install dependencies
npm install

# Build the server
npm run build
```

### 2. Configure Environment Variables

Create a `.env` file in the project root with your Canvas credentials:

```bash
# Canvas LMS Configuration
CANVAS_BASE_URL=https://your-institution.instructure.com
CANVAS_ACCESS_TOKEN=your_canvas_access_token_here

# HTTP Server Configuration (for Open WebUI integration)
# Note: Open WebUI typically runs on port 3000, so we use 3001 to avoid conflicts
PORT=3001
HOST=0.0.0.0
```

### 3. Start the HTTP Server

Run the HTTP/SSE server:

```bash
npm run start:http
```

The server will start on `http://0.0.0.0:3001` (or your configured PORT).

**Note**: The default port is 3001 to avoid conflicts with Open WebUI, which typically runs on port 3000.

You should see output like:
```
Canvas MCP Server (HTTP/SSE) running on http://0.0.0.0:3001
Health check: http://0.0.0.0:3001/health
SSE endpoint: http://0.0.0.0:3001/sse
JSON-RPC endpoint: http://0.0.0.0:3001/message
```

### 4. Verify Server is Running

Test the health endpoint:

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{"status":"ok","server":"canvas-mcp","version":"1.0.0"}
```

## Configure Open WebUI

### Step 1: Access Admin Settings

1. Log into Open WebUI as an administrator
2. Navigate to **Admin Settings** → **External Tools**

### Step 2: Add MCP Server

1. Click **"Add Server"**
2. Configure the following settings:

   - **Type**: Select `MCP (Streamable HTTP)`
   - **Server Name**: `Canvas LMS`
   - **Server URL**: `http://localhost:3001/sse`
     - If Open WebUI is running in Docker, use: `http://host.docker.internal:3001/sse`
     - If running on another machine, use the appropriate IP/hostname
   - **Authentication**: None (unless you add authentication to your server)

3. Click **Save**

### Step 3: Restart Open WebUI (if prompted)

Some configurations may require restarting Open WebUI for changes to take effect.

## Available Tools

Once integrated, the following Canvas LMS tools will be available in Open WebUI:

### Course Management (4 tools)
- `list_courses` - Get all enrolled courses
- `get_course_details` - Get detailed course information
- `list_course_modules` - Get course module structure
- `get_module_items` - Get items within a specific module

### Assignments (3 tools)
- `list_assignments` - Get all course assignments
- `get_assignment_details` - Get detailed assignment information
- `list_assignment_submissions` - Check submission status and feedback

### Announcements (2 tools)
- `list_announcements` - Get course announcements
- `get_announcement_details` - Read specific announcements

### Library & Files (3 tools)
- `list_course_files` - Get all course files and resources
- `get_file_details` - Get file metadata and access information
- `search_course_content` - Search across all course materials

### Content Extraction (5 tools)
- `get_page_content` - Extract full content from course pages
- `get_file_content` - Get file information and download URLs
- `get_media_content` - Access video/audio content and streams
- `extract_module_content` - Extract all content from a module
- `get_week_content` - Extract content for a specific week

## Example Usage in Open WebUI

Once configured, you can ask Open WebUI questions like:

```
"Show me all my current courses"
"What assignments do I have due this week in Biology 101?"
"Extract all content from Week 10 in my Data Structures course"
"Find all materials related to 'machine learning' in my courses"
"Show me recent announcements from my professors"
```

The AI will automatically use the Canvas MCP tools to fetch the requested information.

## Troubleshooting

### Server Connection Issues

**Problem**: Open WebUI cannot connect to the MCP server

**Solutions**:
- Verify the server is running: `curl http://localhost:3001/health`
- Check firewall settings
- If using Docker, ensure you're using `host.docker.internal` instead of `localhost`
- Check the server logs for errors
- Ensure there are no port conflicts (default is 3001, Open WebUI uses 3000)

### Authentication Errors

**Problem**: Canvas API returns 401 Unauthorized

**Solutions**:
- Verify your `CANVAS_ACCESS_TOKEN` is correct
- Check if the token has expired (regenerate if needed)
- Ensure your Canvas base URL is correct

### Tools Not Appearing

**Problem**: Canvas tools don't show up in Open WebUI

**Solutions**:
- Restart Open WebUI after adding the server
- Check the MCP server URL is correct (should end with `/sse`)
- Verify the server type is set to `MCP (Streamable HTTP)`
- Check Open WebUI logs for connection errors

### CORS Issues

**Problem**: CORS errors in browser console

**Solutions**:
The server already includes CORS headers. If issues persist:
- Ensure Open WebUI and MCP server are on the same domain, or
- Configure your reverse proxy to handle CORS properly

## Production Deployment

For production use, consider:

1. **Use a process manager** like PM2:
   ```bash
   npm install -g pm2
   pm2 start npm --name "canvas-mcp-http" -- run start:http
   ```

2. **Add authentication** to the HTTP endpoints

3. **Use HTTPS** with a reverse proxy (nginx, Caddy, etc.)

4. **Set up monitoring** and logging

5. **Use environment-specific configurations**

## Security Considerations

- The MCP server provides **read-only** access to Canvas LMS
- Keep your `CANVAS_ACCESS_TOKEN` secure and never commit it to version control
- Consider implementing rate limiting for production deployments
- Use HTTPS in production to encrypt data in transit
- Implement authentication/authorization if exposing the server publicly

## Dual Mode Support

Your Canvas MCP server supports both modes simultaneously:

- **stdio mode** for Claude Desktop: Use `canvas-mcp` command
- **HTTP mode** for Open WebUI: Use `npm run start:http`

You can run both at the same time if needed!

## Getting Help

If you encounter issues:

1. Check the server logs for error messages
2. Verify your Canvas credentials and permissions
3. Test the health endpoint to ensure the server is running
4. Review Open WebUI's MCP documentation for version-specific changes
5. Open an issue on the project repository

## Additional Resources

- [Open WebUI MCP Documentation](https://docs.openwebui.com/features/mcp)
- [Model Context Protocol Specification](https://modelcontextprotocol.io)
- [Canvas LMS API Documentation](https://canvas.instructure.com/doc/api/)
