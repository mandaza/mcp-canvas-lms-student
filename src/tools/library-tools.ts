import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const libraryTools: Tool[] = [
  {
    name: "list_course_files",
    description: "List all files and resources available in a course (documents, presentations, readings, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        course_id: {
          type: "string",
          description: "The Canvas course ID",
        },
      },
      required: ["course_id"],
    },
  },
  {
    name: "get_file_details",
    description: "Get detailed information about a specific file including metadata, download URL, and access permissions",
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
    name: "search_course_content",
    description: "Search across all course content including assignments, announcements, pages, and files",
    inputSchema: {
      type: "object",
      properties: {
        course_id: {
          type: "string",
          description: "The Canvas course ID",
        },
        query: {
          type: "string",
          description: "Search query to find relevant content",
        },
      },
      required: ["course_id", "query"],
    },
  },
];