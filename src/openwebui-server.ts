#!/usr/bin/env node

import express, { Request, Response } from 'express';
import cors from 'cors';
import { CanvasLMSClient } from "./canvas-client.js";
import {
  courseTools,
  assignmentTools,
  announcementTools,
  libraryTools,
  contentTools
} from "./tools/index.js";
import { canvasPrompts } from "./prompts/index.js";
import { canvasResources } from "./resources/index.js";
import dotenv from 'dotenv';

// Load environment variables from .env file for HTTP mode
dotenv.config();

const CANVAS_BASE_URL = process.env.CANVAS_BASE_URL;
const CANVAS_ACCESS_TOKEN = process.env.CANVAS_ACCESS_TOKEN;
const PORT = parseInt(process.env.PORT || '3001');
const HOST = process.env.HOST || '0.0.0.0';
const API_KEY = process.env.API_KEY; // Optional: for production security

if (!CANVAS_BASE_URL || !CANVAS_ACCESS_TOKEN) {
  console.error("Missing required environment variables: CANVAS_BASE_URL and CANVAS_ACCESS_TOKEN");
  console.error("Please create a .env file with these variables or set them in your environment");
  process.exit(1);
}

// Warn if API_KEY is not set
if (!API_KEY) {
  console.warn("⚠️  WARNING: API_KEY is not set. Your server is unprotected!");
  console.warn("⚠️  Set API_KEY in your .env file for production deployments.");
  console.warn("⚠️  Generate one with: openssl rand -hex 32");
}

const canvasClient = new CanvasLMSClient(CANVAS_BASE_URL, CANVAS_ACCESS_TOKEN);

// All available tools
const allTools = [
  ...courseTools,
  ...assignmentTools,
  ...announcementTools,
  ...libraryTools,
  ...contentTools,
];

// Handle tool execution
async function executeTool(name: string, args: any): Promise<any> {
  try {
    switch (name) {
      // Course tools
      case "list_courses":
        return await canvasClient.listCourses();

      case "get_course_details":
        return await canvasClient.getCourseDetails((args?.course_id as string) || "");

      case "list_course_modules":
        return await canvasClient.listCourseModules((args?.course_id as string) || "");

      case "get_module_items":
        return await canvasClient.getModuleItems((args?.course_id as string) || "", (args?.module_id as string) || "");

      case "get_page_content":
        return await canvasClient.getPageContent((args?.course_id as string) || "", (args?.page_url as string) || "");

      // Assignment tools
      case "list_assignments":
        return await canvasClient.listAssignments((args?.course_id as string) || "");

      case "get_assignment_details":
        return await canvasClient.getAssignmentDetails((args?.course_id as string) || "", (args?.assignment_id as string) || "");

      case "list_assignment_submissions":
        return await canvasClient.listAssignmentSubmissions((args?.course_id as string) || "", (args?.assignment_id as string) || "");

      // Announcement tools
      case "list_announcements":
        return await canvasClient.listAnnouncements((args?.course_id as string) || "");

      case "get_announcement_details":
        return await canvasClient.getAnnouncementDetails((args?.course_id as string) || "", (args?.announcement_id as string) || "");

      // Library tools
      case "list_course_files":
        return await canvasClient.listCourseFiles((args?.course_id as string) || "");

      case "get_file_details":
        return await canvasClient.getFileDetails((args?.file_id as string) || "");

      case "search_course_content":
        return await canvasClient.searchCourseContent((args?.course_id as string) || "", (args?.query as string) || "");

      // Content extraction tools
      case "get_file_content":
        return await canvasClient.getFileContent((args?.file_id as string) || "");

      case "get_media_content":
        return await canvasClient.getMediaObjectContent((args?.media_id as string) || "");

      case "extract_module_content":
        return await canvasClient.extractModuleContent((args?.course_id as string) || "", (args?.module_id as string) || "");

      case "get_week_content":
        return await canvasClient.getWeekContent((args?.course_id as string) || "", (args?.week_number as string) || "");

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    throw new Error(`Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Handle prompt requests
function getPrompt(name: string, args: any): any {
  switch (name) {
    case "study_plan":
      return {
        description: "Generate a personalized study plan based on upcoming assignments and course content",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Create a study plan for course ${args?.course_id || '[course_id]'} focusing on upcoming assignments and important deadlines.`
            }
          }
        ]
      };

    case "assignment_helper":
      return {
        description: "Get help understanding assignment requirements and creating a plan to complete it",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Help me understand and plan for assignment ${args?.assignment_id || '[assignment_id]'} in course ${args?.course_id || '[course_id]'}.`
            }
          }
        ]
      };

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
}

// Handle resource requests
async function readResource(uri: string): Promise<any> {
  // Parse URI to extract resource type and ID
  const match = uri.match(/^canvas:\/\/(.+)\/(.+)$/);
  if (!match) {
    throw new Error(`Invalid resource URI: ${uri}`);
  }

  const [, resourceType, resourceId] = match;

  try {
    switch (resourceType) {
      case "course":
        const course = await canvasClient.getCourseDetails(resourceId);
        return {
          contents: [
            {
              type: "text",
              text: JSON.stringify(course, null, 2)
            }
          ]
        };

      case "assignment":
        const [courseId, assignmentId] = resourceId.split("/");
        const assignment = await canvasClient.getAssignmentDetails(courseId, assignmentId);
        return {
          contents: [
            {
              type: "text",
              text: JSON.stringify(assignment, null, 2)
            }
          ]
        };

      default:
        throw new Error(`Unknown resource type: ${resourceType}`);
    }
  } catch (error) {
    throw new Error(`Failed to read resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Create Express app
const app = express();

app.use(cors());
app.use(express.json());

// Authentication middleware (optional but recommended for production)
const authMiddleware = (req: Request, res: Response, next: Function) => {
  // Skip auth for health check
  if (req.path === '/health') {
    return next();
  }

  // If API_KEY is not set, allow all requests (development mode)
  if (!API_KEY) {
    return next();
  }

  // Check for API key in headers
  const providedKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  if (!providedKey) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide API key in X-API-Key header'
    });
  }

  if (providedKey !== API_KEY) {
    return res.status(403).json({
      error: 'Invalid API key',
      message: 'The provided API key is invalid'
    });
  }

  next();
};

// Apply authentication to all routes
app.use(authMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'canvas-mcp', version: '1.0.0' });
});

// SSE endpoint for MCP messages
app.post('/sse', async (req: Request, res: Response) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const message = req.body;

  try {
    let response;

    // Handle different MCP request types
    if (message.method === 'tools/list') {
      response = { tools: allTools };
    } else if (message.method === 'tools/call') {
      response = await executeTool(message.params.name, message.params.arguments);
    } else if (message.method === 'prompts/list') {
      response = { prompts: canvasPrompts };
    } else if (message.method === 'prompts/get') {
      response = getPrompt(message.params.name, message.params.arguments);
    } else if (message.method === 'resources/list') {
      response = { resources: canvasResources };
    } else if (message.method === 'resources/read') {
      response = await readResource(message.params.uri);
    } else {
      throw new Error(`Unsupported method: ${message.method}`);
    }

    // Send response as SSE event
    res.write(`data: ${JSON.stringify({ id: message.id, result: response })}\n\n`);
    res.end();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.write(`data: ${JSON.stringify({ id: message.id, error: { message: errorMessage } })}\n\n`);
    res.end();
  }
});

// Standard JSON-RPC endpoint (alternative to SSE)
app.post('/message', async (req: Request, res: Response) => {
  const message = req.body;

  try {
    let response;

    // Handle different MCP request types
    if (message.method === 'tools/list') {
      response = { tools: allTools };
    } else if (message.method === 'tools/call') {
      response = await executeTool(message.params.name, message.params.arguments);
    } else if (message.method === 'prompts/list') {
      response = { prompts: canvasPrompts };
    } else if (message.method === 'prompts/get') {
      response = getPrompt(message.params.name, message.params.arguments);
    } else if (message.method === 'resources/list') {
      response = { resources: canvasResources };
    } else if (message.method === 'resources/read') {
      response = await readResource(message.params.uri);
    } else {
      throw new Error(`Unsupported method: ${message.method}`);
    }

    res.json({ id: message.id, result: response });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ id: message.id, error: { message: errorMessage } });
  }
});

async function main() {
  app.listen(PORT, HOST, () => {
    console.log(`Canvas MCP Server (HTTP/SSE) running on http://${HOST}:${PORT}`);
    console.log(`Health check: http://${HOST}:${PORT}/health`);
    console.log(`SSE endpoint: http://${HOST}:${PORT}/sse`);
    console.log(`JSON-RPC endpoint: http://${HOST}:${PORT}/message`);
  });
}

main().catch((error) => {
  console.error("Server failed to start:", error);
  process.exit(1);
});
