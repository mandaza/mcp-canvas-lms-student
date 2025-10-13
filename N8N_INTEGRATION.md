# n8n Workflow Integration Guide

This guide explains how to integrate your Canvas MCP server with n8n workflows to automate Canvas LMS tasks.

## Overview

Your Canvas MCP server provides HTTP endpoints that can be easily integrated with n8n workflows using the **HTTP Request** node. This allows you to:

- Automate assignment tracking and notifications
- Schedule course content extractions
- Create weekly study plan reminders
- Monitor announcements and send alerts
- Generate reports from Canvas data

## Prerequisites

- n8n instance running (self-hosted or cloud)
- Canvas MCP HTTP server running (`npm run start:http`)
- Canvas LMS access token and base URL configured

## Quick Start

### 1. Start the HTTP Server

```bash
# Make sure your .env file is configured
npm run start:http
```

The server will run on `http://localhost:3001` (or your configured PORT).

### 2. Test the Health Endpoint

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{"status":"ok","server":"canvas-mcp","version":"1.0.0"}
```

## n8n Integration Methods

### Method 1: Using HTTP Request Node (Recommended)

The HTTP Request node is the primary way to interact with your Canvas MCP server.

#### Example: List All Courses

1. Add an **HTTP Request** node to your workflow
2. Configure the node:

**Configuration:**
```
Method: POST
URL: http://localhost:3001/message
Authentication: None
Body Content Type: JSON

Body (JSON):
{
  "id": "req-001",
  "method": "tools/call",
  "params": {
    "name": "list_courses",
    "arguments": {}
  }
}

Headers:
Content-Type: application/json
```

**Response:**
```json
{
  "id": "req-001",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "[List of courses in JSON format]"
      }
    ]
  }
}
```

#### Example: Get Assignment Details

```json
{
  "id": "req-002",
  "method": "tools/call",
  "params": {
    "name": "get_assignment_details",
    "arguments": {
      "course_id": "123456",
      "assignment_id": "789012"
    }
  }
}
```

#### Example: Extract Week Content

```json
{
  "id": "req-003",
  "method": "tools/call",
  "params": {
    "name": "get_week_content",
    "arguments": {
      "course_id": "123456",
      "week_number": "10"
    }
  }
}
```

### Method 2: Using Webhook Node

You can also create custom webhooks that trigger Canvas MCP actions.

## Available Tools Reference

### Course Tools

| Tool Name | Arguments | Description |
|-----------|-----------|-------------|
| `list_courses` | None | Get all enrolled courses |
| `get_course_details` | `course_id` | Get detailed course information |
| `list_course_modules` | `course_id` | Get course module structure |
| `get_module_items` | `course_id`, `module_id` | Get items within a module |

### Assignment Tools

| Tool Name | Arguments | Description |
|-----------|-----------|-------------|
| `list_assignments` | `course_id` | Get all course assignments |
| `get_assignment_details` | `course_id`, `assignment_id` | Get detailed assignment info |
| `list_assignment_submissions` | `course_id`, `assignment_id` | Check submission status |

### Content Extraction Tools

| Tool Name | Arguments | Description |
|-----------|-----------|-------------|
| `get_page_content` | `course_id`, `page_url` | Extract page content |
| `get_file_content` | `file_id` | Get file information |
| `get_media_content` | `media_id` | Access media content |
| `extract_module_content` | `course_id`, `module_id` | Extract all module content |
| `get_week_content` | `course_id`, `week_number` | Extract weekly content |

### Communication Tools

| Tool Name | Arguments | Description |
|-----------|-----------|-------------|
| `list_announcements` | `course_id` | Get course announcements |
| `get_announcement_details` | `course_id`, `announcement_id` | Read specific announcement |

### Resource Tools

| Tool Name | Arguments | Description |
|-----------|-----------|-------------|
| `list_course_files` | `course_id` | Get all course files |
| `get_file_details` | `file_id` | Get file metadata |
| `search_course_content` | `course_id`, `query` | Search course materials |

## Example n8n Workflows

### Workflow 1: Daily Assignment Reminder

**Purpose:** Send daily email with upcoming assignments due this week

**Nodes:**
1. **Cron** - Trigger daily at 8:00 AM
2. **HTTP Request** - Call `list_courses`
3. **Loop Over Items** - For each course
4. **HTTP Request** - Call `list_assignments` with course_id
5. **Filter** - Keep only assignments due within 7 days
6. **Email** - Send formatted assignment list

**HTTP Request Configuration (Step 4):**
```json
{
  "id": "{{ $json.id }}",
  "method": "tools/call",
  "params": {
    "name": "list_assignments",
    "arguments": {
      "course_id": "{{ $json.course_id }}"
    }
  }
}
```

### Workflow 2: Weekly Content Extraction

**Purpose:** Extract and archive weekly course content every Sunday

**Nodes:**
1. **Cron** - Trigger every Sunday at 10:00 PM
2. **Set** - Define course_id and current week number
3. **HTTP Request** - Call `get_week_content`
4. **Google Drive / Dropbox** - Save extracted content

**HTTP Request Configuration:**
```json
{
  "id": "weekly-content-001",
  "method": "tools/call",
  "params": {
    "name": "get_week_content",
    "arguments": {
      "course_id": "{{ $json.course_id }}",
      "week_number": "{{ $json.week_number }}"
    }
  }
}
```

### Workflow 3: Announcement Monitor

**Purpose:** Check for new announcements every hour and send Slack notification

**Nodes:**
1. **Cron** - Trigger every hour
2. **HTTP Request** - Call `list_courses`
3. **Loop Over Items** - For each course
4. **HTTP Request** - Call `list_announcements` with course_id
5. **Filter** - Keep only announcements from last hour
6. **Slack** - Send notification for new announcements

### Workflow 4: Assignment Submission Checker

**Purpose:** Check submission status for specific assignments

**Nodes:**
1. **Webhook** - Trigger manually or via schedule
2. **HTTP Request** - Call `list_assignment_submissions`
3. **Code** - Process submission data
4. **Email** - Send status report

**HTTP Request Configuration:**
```json
{
  "id": "submission-check-001",
  "method": "tools/call",
  "params": {
    "name": "list_assignment_submissions",
    "arguments": {
      "course_id": "{{ $json.course_id }}",
      "assignment_id": "{{ $json.assignment_id }}"
    }
  }
}
```

## Processing MCP Responses in n8n

The Canvas MCP server returns responses in this format:

```json
{
  "id": "request-id",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "[JSON data here]"
      }
    ]
  }
}
```

To access the actual data in n8n, use:

```javascript
// In a Code node or expression
const responseText = $json.result.content[0].text;
const data = JSON.parse(responseText);
```

Or use JSONPath in n8n:
```
{{ $json.result.content[0].text }}
```

## Error Handling

Add error handling to your n8n workflows:

1. **HTTP Request Node Settings:**
   - Set "Continue On Fail" to true
   - Add "Ignore SSL Issues" if needed for local development

2. **Add Error Handling Node:**
   - Use **If** node to check for errors
   - Send notifications on failure
   - Implement retry logic

**Example Error Check:**
```javascript
// In IF node
{{ $json.error !== undefined }}
```

## Advanced: Custom Webhook Integration

Create a custom endpoint in your workflow:

1. Add **Webhook** node (trigger)
2. Set HTTP Method to POST
3. Get webhook URL
4. Use this URL to trigger workflows from external apps

**Example webhook payload:**
```json
{
  "tool": "list_assignments",
  "course_id": "123456"
}
```

Then use an HTTP Request node to call your Canvas MCP server with the webhook data.

## Docker Deployment Considerations

If running n8n and Canvas MCP in Docker:

### Same Docker Network
```bash
# Use container name
URL: http://canvas-mcp:3001/message
```

### Different Networks
```bash
# Use host.docker.internal
URL: http://host.docker.internal:3001/message
```

### Both on Host
```bash
# Use localhost
URL: http://localhost:3001/message
```

## Environment Variables for Production

For production deployments, consider:

```env
# .env file
CANVAS_BASE_URL=https://your-institution.instructure.com
CANVAS_ACCESS_TOKEN=your_secure_token_here
PORT=3001
HOST=0.0.0.0
LOG_LEVEL=info

# Optional: Add authentication
API_KEY=your_api_key_for_n8n_access
```

## Security Best Practices

1. **Use Environment Variables** - Never hardcode credentials in n8n workflows
2. **Secure the HTTP Server** - Add authentication middleware if exposed publicly
3. **Use HTTPS** - Set up reverse proxy with SSL for production
4. **Rate Limiting** - Implement rate limiting to prevent abuse
5. **Network Isolation** - Keep Canvas MCP server in private network
6. **Token Security** - Regularly rotate Canvas access tokens

## Troubleshooting

### Connection Refused

**Problem:** n8n cannot connect to Canvas MCP server

**Solutions:**
- Verify server is running: `curl http://localhost:3001/health`
- Check firewall settings
- Ensure correct host/port in n8n configuration
- Use `0.0.0.0` as HOST in .env to allow external connections

### Invalid Response Format

**Problem:** n8n receives unexpected response

**Solutions:**
- Verify request format matches MCP specification
- Check that `method` field is correct (`tools/call`, `tools/list`, etc.)
- Ensure `params` structure matches tool requirements

### Canvas API Errors

**Problem:** Canvas returns 401 or 403 errors

**Solutions:**
- Verify `CANVAS_ACCESS_TOKEN` is valid and not expired
- Check Canvas base URL is correct
- Ensure token has necessary permissions

### Timeout Errors

**Problem:** Requests timeout in n8n

**Solutions:**
- Increase timeout in HTTP Request node settings
- Check Canvas API is responding
- Optimize queries (use specific filters, limit results)

## Example: Complete Workflow JSON

Here's a complete n8n workflow you can import:

```json
{
  "name": "Canvas Assignment Tracker",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "hours",
              "hoursInterval": 1
            }
          ]
        }
      },
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.cron",
      "position": [250, 300]
    },
    {
      "parameters": {
        "url": "http://localhost:3001/message",
        "method": "POST",
        "jsonParameters": true,
        "options": {},
        "bodyParametersJson": "{\n  \"id\": \"courses-001\",\n  \"method\": \"tools/call\",\n  \"params\": {\n    \"name\": \"list_courses\",\n    \"arguments\": {}\n  }\n}"
      },
      "name": "Get Courses",
      "type": "n8n-nodes-base.httpRequest",
      "position": [450, 300]
    }
  ],
  "connections": {
    "Schedule Trigger": {
      "main": [
        [
          {
            "node": "Get Courses",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## Additional Resources

- [n8n HTTP Request Node Documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/)
- [n8n Workflow Examples](https://n8n.io/workflows)
- [Canvas LMS API Documentation](https://canvas.instructure.com/doc/api/)
- [Model Context Protocol Specification](https://modelcontextprotocol.io)

## Getting Help

If you encounter issues:
1. Check the Canvas MCP server logs
2. Verify n8n execution logs
3. Test endpoints with curl/Postman first
4. Check network connectivity between n8n and MCP server
5. Review Canvas API permissions and token validity

## Next Steps

1. Import the example workflow into n8n
2. Configure your Canvas credentials in .env
3. Start the HTTP server
4. Test the workflow with a manual trigger
5. Customize workflows for your specific needs
6. Set up monitoring and alerts

Happy automating!
