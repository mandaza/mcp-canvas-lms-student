import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const announcementTools: Tool[] = [
  {
    name: "list_announcements",
    description: "List all course announcements and important updates from instructors",
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
    name: "get_announcement_details",
    description: "Get detailed content of a specific announcement",
    inputSchema: {
      type: "object",
      properties: {
        course_id: {
          type: "string",
          description: "The Canvas course ID",
        },
        announcement_id: {
          type: "string",
          description: "The Canvas announcement/discussion topic ID",
        },
      },
      required: ["course_id", "announcement_id"],
    },
  },
];