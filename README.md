# Canvas LMS MCP Server

A Model Context Protocol (MCP) server that provides comprehensive access to Canvas LMS course content, enabling AI assistants to help students manage their coursework more effectively.

## Features

### 📚 Course Management
- List enrolled courses with detailed information
- Access course modules and structured content
- Navigate learning materials and resources

### 📝 Assignment Support
- View assignments with due dates and requirements
- Get detailed assignment descriptions and grading criteria
- Track submission status and progress

### 📢 Communications
- Read course announcements and updates
- Stay informed about important course notifications

### 📁 Content Access
- Extract content from course pages (lectures, readings, etc.)
- Access files, presentations, videos, and other media
- Search across all course materials
- Download links for course resources

### 🗓️ Week-based Navigation
- Extract complete content for any course week
- Automatic module detection by week number
- Comprehensive content previews

## Installation

### Prerequisites
- Node.js 18+ and npm
- Canvas LMS access token
- Canvas LMS instance URL

### Quick Installation (Recommended)

Install globally from GitHub:

```bash
npm install -g git+https://github.com/mandaza/mcp-canvas-lms-student.git
```

### Alternative: Local Development Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mandaza/mcp-canvas-lms-student.git
   cd mcp-canvas-lms-student
   npm install
   ```

2. **Build the server:**
   ```bash
   npm run build
   ```

## Configuration

### Getting a Canvas Access Token

1. Log into your Canvas LMS instance
2. Go to Account → Settings
3. Scroll down to "Approved Integrations"
4. Click "+ New Access Token"
5. Give it a purpose (e.g., "MCP Server Access")
6. Copy the generated token for use in Claude Desktop

⚠️ **Important**: Keep your access token secure and never share it.

## Integration Options

This MCP server supports multiple integration modes:

### Option 1: Claude Desktop (stdio mode)

Add this configuration to your Claude Desktop settings:

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

**Configuration File Locations:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\\Claude\\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Option 2: Open WebUI (HTTP/SSE mode)

For Open WebUI integration, see the detailed [Open WebUI Setup Guide](OPENWEBUI_SETUP.md).

**Quick Start:**

1. Create a `.env` file with your Canvas credentials and server configuration
2. Start the HTTP server: `npm run start:http`
3. In Open WebUI Admin Settings → External Tools, add an MCP server:
   - Type: `MCP (Streamable HTTP)`
   - Server URL: `http://localhost:3001/sse`
   - (Use `http://host.docker.internal:3001/sse` if Open WebUI is in Docker)

### Option 3: n8n Workflows (HTTP mode)

For n8n workflow automation, see the detailed [n8n Integration Guide](N8N_INTEGRATION.md).

**Quick Start:**

1. Start the HTTP server: `npm run start:http`
2. In n8n, use the **HTTP Request** node with:
   - Method: POST
   - URL: `http://localhost:3001/message`
   - Body: MCP JSON-RPC format
3. Check the guide for complete workflow examples

All modes can run simultaneously if needed!

## Available Tools

The server provides 17 tools for comprehensive Canvas access:

### Course Tools
- `list_courses` - Get all enrolled courses
- `get_course_details` - Get detailed course information
- `list_course_modules` - Get course module structure
- `get_module_items` - Get items within a specific module

### Assignment Tools
- `list_assignments` - Get all course assignments
- `get_assignment_details` - Get detailed assignment information
- `list_assignment_submissions` - Check submission status and feedback

### Content Extraction Tools
- `get_page_content` - Extract full content from course pages
- `get_file_content` - Get file information and download URLs
- `get_media_content` - Access video/audio content and streams
- `extract_module_content` - Extract all content from a module
- `get_week_content` - Extract content for a specific week

### Communication Tools
- `list_announcements` - Get course announcements
- `get_announcement_details` - Read specific announcements

### Resource Tools
- `list_course_files` - Get all course files and resources
- `get_file_details` - Get file metadata and access information
- `search_course_content` - Search across all course materials

## Example Queries

Once integrated with Claude Desktop, you can use natural language queries like:

```
"Show me all my current courses"
"What assignments do I have due this week in Biology 101?"
"Extract all content from Week 10 in my Data Structures course"
"Find all materials related to 'machine learning' in my courses"
"Show me recent announcements from my professors"
"Get the presentation slides from today's lecture"
```

## Development

### Building
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

### Project Structure
```
src/
├── index.ts              # Main MCP server
├── canvas-client.ts      # Canvas API client
├── tools/               # MCP tool definitions
│   ├── course-tools.ts
│   ├── assignment-tools.ts
│   ├── announcement-tools.ts
│   ├── library-tools.ts
│   └── content-tools.ts
├── prompts/             # Predefined prompts
│   └── index.ts
└── resources/           # Resource definitions
    └── index.ts
```

## Security & Privacy

- **Read-only access**: Students can only read their course data, not modify it
- **Rate limiting**: Built-in request throttling to prevent API abuse
- **Secure authentication**: Uses Canvas API tokens with proper error handling
- **Local processing**: All data processing happens locally

## Troubleshooting

### Common Issues

**Authentication Failed**
- Verify your Canvas access token is correct and hasn't expired
- Ensure your Canvas base URL is properly formatted
- Check that your token has the necessary permissions

**No Content Found**
- Verify you're enrolled in the course
- Check that the course content is published and accessible
- Ensure the course/module/week numbers are correct

**Connection Issues**
- Verify your Canvas instance is accessible
- Check network connectivity
- Ensure Canvas isn't undergoing maintenance

## Deployment & Hosting

To use your MCP server from anywhere (not just localhost), you need to host it on a server or cloud platform.

### Quick Start Guides

- **[Quick Start Deployment](QUICKSTART_DEPLOYMENT.md)** - Deploy in 10 minutes with Railway.app
- **[Full Deployment Guide](DEPLOYMENT_GUIDE.md)** - Complete guide for all hosting options
- **[Security Guide](SECURITY.md)** - API key authentication and best practices

### Hosting Options

| Platform | Time | Cost | Best For |
|----------|------|------|----------|
| Railway.app | 10 min | Free tier | Easiest deployment |
| Render.com | 10 min | Free tier | Simple setup |
| DigitalOcean VPS | 20 min | $4-6/month | Full control |
| Docker | 15 min | Varies | Containerized apps |

### Security (Required for Production!)

Before deploying to production, **you must add API key authentication**:

```bash
# Generate a secure API key
openssl rand -hex 32

# Add to your .env file
API_KEY=your_generated_key_here
```

See [SECURITY.md](SECURITY.md) for detailed setup instructions.

## License

This project is licensed under the ISC License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.