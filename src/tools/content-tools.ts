import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const contentTools: Tool[] = [
  {
    name: "get_file_content",
    description: "Get detailed information about a specific file including type, size, download URL and access instructions",
    inputSchema: {
      type: "object",
      properties: {
        file_id: {
          type: "string",
          description: "The Canvas file ID",
        },
      },
      required: ["file_id"],
    },
  },
  {
    name: "get_media_content",
    description: "Extract information about video, audio, or other media content including sources and captions",
    inputSchema: {
      type: "object",
      properties: {
        media_id: {
          type: "string",
          description: "The Canvas media object ID",
        },
      },
      required: ["media_id"],
    },
  },
  {
    name: "extract_module_content",
    description: "Extract complete content from all items in a module including pages, files, assignments, and media",
    inputSchema: {
      type: "object",
      properties: {
        course_id: {
          type: "string",
          description: "The Canvas course ID",
        },
        module_id: {
          type: "string",
          description: "The Canvas module ID",
        },
      },
      required: ["course_id", "module_id"],
    },
  },
  {
    name: "get_week_content",
    description: "Extract all content from a specific week module by searching for week number (e.g., Week 10, Week 1)",
    inputSchema: {
      type: "object",
      properties: {
        course_id: {
          type: "string",
          description: "The Canvas course ID",
        },
        week_number: {
          type: "string",
          description: "The week number (e.g., '10', '1', '5')",
        },
      },
      required: ["course_id", "week_number"],
    },
  },
];