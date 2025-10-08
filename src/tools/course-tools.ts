import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const courseTools: Tool[] = [
  {
    name: "list_courses",
    description: "List all courses the student is enrolled in",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_course_details",
    description: "Get detailed information about a specific course",
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
    name: "list_course_modules",
    description: "List all modules in a course with their structure and content",
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
    name: "get_module_items",
    description: "Get all items within a specific course module (pages, assignments, quizzes, discussions, etc.)",
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
    name: "get_page_content",
    description: "Get the content of a specific course page",
    inputSchema: {
      type: "object",
      properties: {
        course_id: {
          type: "string",
          description: "The Canvas course ID",
        },
        page_url: {
          type: "string",
          description: "The page URL slug or ID",
        },
      },
      required: ["course_id", "page_url"],
    },
  },
];