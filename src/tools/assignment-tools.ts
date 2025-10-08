import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const assignmentTools: Tool[] = [
  {
    name: "list_assignments",
    description: "List all assignments for a course, including due dates and requirements",
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
    name: "get_assignment_details",
    description: "Get detailed information about a specific assignment including description, requirements, due date, and grading criteria",
    inputSchema: {
      type: "object",
      properties: {
        course_id: {
          type: "string",
          description: "The Canvas course ID",
        },
        assignment_id: {
          type: "string",
          description: "The Canvas assignment ID",
        },
      },
      required: ["course_id", "assignment_id"],
    },
  },
  {
    name: "list_assignment_submissions",
    description: "Get submission details for an assignment (useful for checking submission status and feedback)",
    inputSchema: {
      type: "object",
      properties: {
        course_id: {
          type: "string",
          description: "The Canvas course ID",
        },
        assignment_id: {
          type: "string",
          description: "The Canvas assignment ID",
        },
      },
      required: ["course_id", "assignment_id"],
    },
  },
];