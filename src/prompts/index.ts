import { Prompt } from "@modelcontextprotocol/sdk/types.js";

export const canvasPrompts: Prompt[] = [
  {
    name: "study_plan",
    description: "Generate a personalized study plan based on upcoming assignments and course content",
    arguments: [
      {
        name: "course_id",
        description: "The Canvas course ID to create a study plan for",
        required: true,
      },
    ],
  },
  {
    name: "assignment_helper",
    description: "Get help understanding assignment requirements and creating a completion plan",
    arguments: [
      {
        name: "course_id",
        description: "The Canvas course ID",
        required: true,
      },
      {
        name: "assignment_id",
        description: "The Canvas assignment ID",
        required: true,
      },
    ],
  },
  {
    name: "deadline_tracker",
    description: "Track and prioritize upcoming deadlines across all courses",
    arguments: [
      {
        name: "days_ahead",
        description: "Number of days to look ahead for deadlines (default: 14)",
        required: false,
      },
    ],
  },
  {
    name: "course_summary",
    description: "Generate a comprehensive summary of course content, progress, and requirements",
    arguments: [
      {
        name: "course_id",
        description: "The Canvas course ID to summarize",
        required: true,
      },
    ],
  },
];