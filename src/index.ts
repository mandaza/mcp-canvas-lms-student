#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
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

// Don't use dotenv.config() in MCP mode - environment variables
// are provided directly by the MCP client (Claude Desktop)

const CANVAS_BASE_URL = process.env.CANVAS_BASE_URL;
const CANVAS_ACCESS_TOKEN = process.env.CANVAS_ACCESS_TOKEN;

if (!CANVAS_BASE_URL || !CANVAS_ACCESS_TOKEN) {
  console.error("Missing required environment variables: CANVAS_BASE_URL and CANVAS_ACCESS_TOKEN");
  process.exit(1);
}

const canvasClient = new CanvasLMSClient(CANVAS_BASE_URL, CANVAS_ACCESS_TOKEN);
const server = new Server(
  {
    name: "canvas-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      ...courseTools,
      ...assignmentTools,
      ...announcementTools,
      ...libraryTools,
      ...contentTools,
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

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
});

// Prompt handlers
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return { prompts: canvasPrompts };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

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
});

// Resource handlers
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return { resources: canvasResources };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

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
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Canvas MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server failed to start:", error);
  process.exit(1);
});