import { Resource } from "@modelcontextprotocol/sdk/types.js";

export const canvasResources: Resource[] = [
  {
    uri: "canvas://course/{course_id}",
    name: "Course Details",
    description: "Access detailed information about a specific course",
    mimeType: "application/json",
  },
  {
    uri: "canvas://assignment/{course_id}/{assignment_id}",
    name: "Assignment Details",
    description: "Access detailed information about a specific assignment",
    mimeType: "application/json",
  },
  {
    uri: "canvas://announcement/{course_id}/{announcement_id}",
    name: "Announcement Details",
    description: "Access detailed information about a specific announcement",
    mimeType: "application/json",
  },
  {
    uri: "canvas://file/{file_id}",
    name: "File Details",
    description: "Access detailed information about a specific file",
    mimeType: "application/json",
  },
];