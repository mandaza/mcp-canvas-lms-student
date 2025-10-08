import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface Course {
  id: number;
  name: string;
  course_code: string;
  workflow_state: string;
  account_id: number;
  start_at?: string;
  end_at?: string;
  enrollment_term_id: number;
  total_students?: number;
  time_zone?: string;
  default_view?: string;
  license?: string;
  term?: {
    id: number;
    name: string;
    start_at?: string;
    end_at?: string;
    workflow_state: string;
  };
  calendar?: {
    ics: string;
  };
}

export interface Module {
  id: number;
  name: string;
  position: number;
  unlock_at?: string;
  require_sequential_progress: boolean;
  prerequisite_module_ids: number[];
  items_count: number;
  items_url: string;
  items?: ModuleItem[];
  state: string;
  completed_at?: string;
  publish_final_grade: boolean;
  published: boolean;
}

export interface ModuleItem {
  id: number;
  title: string;
  position: number;
  indent: number;
  type: string;
  content_id?: number;
  html_url?: string;
  url?: string;
  page_url?: string;
  external_url?: string;
  new_tab?: boolean;
  completion_requirement?: {
    type: string;
    min_score?: number;
    completed: boolean;
  };
  published: boolean;
}

export interface Assignment {
  id: number;
  name: string;
  description: string;
  due_at?: string;
  unlock_at?: string;
  lock_at?: string;
  points_possible: number;
  grading_type: string;
  assignment_group_id: number;
  grading_standard_id?: number;
  created_at: string;
  updated_at: string;
  peer_reviews: boolean;
  automatic_peer_reviews: boolean;
  position: number;
  grade_group_students_individually: boolean;
  anonymous_peer_reviews: boolean;
  group_category_id?: number;
  post_to_sis: boolean;
  moderated_grading: boolean;
  omit_from_final_grade: boolean;
  intra_group_peer_reviews: boolean;
  anonymous_instructor_annotations: boolean;
  anonymous_grading: boolean;
  graders_anonymous_to_graders: boolean;
  grader_count: number;
  grader_comments_visible_to_graders: boolean;
  final_grader_id?: number;
  grader_names_visible_to_final_grader: boolean;
  allowed_attempts: number;
  secure_params?: string;
  course_id: number;
  html_url: string;
  submissions_download_url: string;
  submission_types?: string[];
  assignment_group: {
    id: number;
    name: string;
    position: number;
    group_weight: number;
  };
}

export interface Announcement {
  id: number;
  title: string;
  message: string;
  html_url: string;
  posted_at: string;
  delayed_post_at?: string;
  author: {
    id: number;
    display_name: string;
    avatar_image_url: string;
    html_url: string;
  };
  read_state: string;
  unread_count: number;
  subscription_hold?: string;
  assignment_id?: number;
  require_initial_post: boolean;
  user_can_see_posts: boolean;
  podcast_has_student_posts: boolean;
  discussion_type: string;
  group_category_id?: number;
  position?: number;
  allow_rating: boolean;
  only_graders_can_rate: boolean;
  sort_by_rating: boolean;
}

export interface File {
  id: number;
  uuid: string;
  folder_id: number;
  display_name: string;
  filename: string;
  upload_status: string;
  'content-type': string;
  url: string;
  size: number;
  created_at: string;
  updated_at: string;
  unlock_at?: string;
  locked: boolean;
  hidden: boolean;
  lock_at?: string;
  locked_for_user: boolean;
  lock_explanation?: string;
  lock_info?: {
    asset_string: string;
    unlock_at?: string;
    lock_at?: string;
    context_module?: {
      id: number;
      name: string;
      position: number;
      unlock_at?: string;
      require_sequential_progress: boolean;
    };
  };
  thumbnail_url?: string;
  modified_at: string;
  mime_class: string;
  media_entry_id?: string;
}

export interface Submission {
  id: number;
  user_id: number;
  assignment_id: number;
  body?: string;
  url?: string;
  grade?: string;
  score?: number;
  submitted_at?: string;
  assignment: Assignment;
  course: Course;
  attempt: number;
  workflow_state: string;
  grade_matches_current_submission: boolean;
  graded_at?: string;
  grader_id?: number;
  excused: boolean;
  late_policy_status?: string;
  points_deducted?: number;
  grading_period_id?: number;
  extra_attempts?: number;
  posted_at?: string;
  late: boolean;
  missing: boolean;
  seconds_late: number;
  entered_grade?: string;
  entered_score?: number;
  preview_url: string;
}

export class CanvasLMSClient {
  private client: AxiosInstance;
  private baseURL: string;
  private accessToken: string;
  private requestCount = 0;
  private lastRequestTime = 0;
  private readonly RATE_LIMIT_DELAY = 100; // 100ms between requests

  constructor(baseURL: string, accessToken: string) {
    // Validate and normalize URL
    if (!baseURL) {
      throw new Error('Canvas base URL is required');
    }

    // Add https:// if no protocol specified
    if (!baseURL.startsWith('http://') && !baseURL.startsWith('https://')) {
      baseURL = 'https://' + baseURL;
    }

    // Validate URL format
    try {
      new URL(baseURL);
    } catch (error) {
      throw new Error(`Invalid Canvas base URL: ${baseURL}. Please provide a valid URL like https://your-school.instructure.com`);
    }

    this.baseURL = baseURL.replace(/\/$/, ''); // Remove trailing slash
    this.accessToken = accessToken;

    this.client = axios.create({
      baseURL: `${this.baseURL}/api/v1`,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });

    // Add request interceptor for rate limiting
    this.client.interceptors.request.use(async (config) => {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
        await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLastRequest));
      }

      this.lastRequestTime = Date.now();
      this.requestCount++;

      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          throw new Error('Canvas API authentication failed. Please check your access token.');
        } else if (error.response?.status === 403) {
          throw new Error('Canvas API access forbidden. Please check your permissions.');
        } else if (error.response?.status === 429) {
          throw new Error('Canvas API rate limit exceeded. Please try again later.');
        } else if (error.response?.status >= 500) {
          throw new Error('Canvas API server error. Please try again later.');
        }
        throw error;
      }
    );
  }

  private async makeRequest<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.request<T>(config);
      return response.data;
    } catch (error) {
      throw new Error(`Canvas API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getAllPages<T>(url: string, params: Record<string, any> = {}): Promise<T[]> {
    const allData: T[] = [];
    let currentUrl = url;
    let page = 1;
    const perPage = 100;

    while (currentUrl && page <= 50) { // Limit to 50 pages for safety
      const response = await this.client.get<T[]>(currentUrl, {
        params: { ...params, page, per_page: perPage },
      });

      allData.push(...response.data);

      // Check for Link header to get next page
      const linkHeader = response.headers.link;
      const nextMatch = linkHeader?.match(/<([^>]+)>;\s*rel="next"/);
      currentUrl = nextMatch ? nextMatch[1].replace(this.baseURL + '/api/v1', '') : null;
      page++;
    }

    return allData;
  }

  async listCourses(): Promise<{ content: { type: 'text', text: string }[] }> {
    const courses = await this.getAllPages<Course>('/courses', {
      enrollment_state: 'active',
      include: ['total_students', 'term'],
    });

    const activeCourses = courses.filter(course => course.workflow_state === 'available');

    const courseList = activeCourses.map((course, index) => {
      const termInfo = course.term ? ` (${course.term.name})` : '';
      const studentCount = course.total_students ? ` - ${course.total_students} students` : '';

      return `${index + 1}. **${course.name}** (${course.course_code})${termInfo}
   - Course ID: ${course.id}
   - Status: ${course.workflow_state}${studentCount}
   - Time Zone: ${course.time_zone}`;
    }).join('\n\n');

    const summary = `## Your Canvas Courses (${activeCourses.length} courses found)\n\n${courseList}`;

    return {
      content: [{
        type: 'text',
        text: summary
      }]
    };
  }

  async getCourseDetails(courseId: string): Promise<{ content: { type: 'text', text: string }[] }> {
    const course = await this.makeRequest<Course>({
      method: 'GET',
      url: `/courses/${courseId}`,
      params: {
        include: ['total_students', 'term', 'course_progress'],
      },
    });

    const termInfo = course.term ? `**Term:** ${course.term.name}\n` : '';
    const startDate = course.start_at ? `**Start Date:** ${new Date(course.start_at).toLocaleDateString()}\n` : '';
    const endDate = course.end_at ? `**End Date:** ${new Date(course.end_at).toLocaleDateString()}\n` : '';
    const studentCount = course.total_students ? `**Total Students:** ${course.total_students}\n` : '';

    const details = `## ${course.name} (${course.course_code})

**Course ID:** ${course.id}
**Status:** ${course.workflow_state}
${termInfo}${startDate}${endDate}${studentCount}**Time Zone:** ${course.time_zone}
**Default View:** ${course.default_view}
**License:** ${course.license}

**Calendar Feed:** [View Calendar](${course.calendar?.ics || 'Not available'})`;

    return {
      content: [{
        type: 'text',
        text: details
      }]
    };
  }

  async listCourseModules(courseId: string): Promise<{ content: { type: 'text', text: string }[] }> {
    const modules = await this.getAllPages<Module>(`/courses/${courseId}/modules`, {
      include: ['items', 'content_details'],
    });

    if (modules.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `## No modules found for this course.`
        }]
      };
    }

    // Sort modules by position
    const sortedModules = modules.sort((a, b) => a.position - b.position);

    const moduleList = sortedModules.map((module, index) => {
      const status = module.state ? `**Status:** ${module.state}` : '';
      const sequential = module.require_sequential_progress ? '**Sequential Progress Required**' : '';
      const itemCount = module.items_count ? `**Items:** ${module.items_count}` : '';
      const unlockDate = module.unlock_at ? `**Unlocks:** ${new Date(module.unlock_at).toLocaleDateString()}` : '';

      const prerequisites = module.prerequisite_module_ids && module.prerequisite_module_ids.length > 0 ?
        `**Prerequisites:** Module IDs ${module.prerequisite_module_ids.join(', ')}` : '';

      return `### ${module.position}. ${module.name}

**Module ID:** ${module.id}
${status}
${itemCount}
${unlockDate}
${sequential}
${prerequisites}

---`;
    }).join('\n');

    const summary = `## Course Modules for Course ${courseId} (${modules.length} modules)

${moduleList}

💡 **Tip:** Use the "get_module_items" tool with a specific module ID to see detailed content within each module.`;

    return {
      content: [{
        type: 'text',
        text: summary
      }]
    };
  }

  async getModuleItems(courseId: string, moduleId: string): Promise<{ content: { type: 'text', text: string }[] }> {
    const items = await this.getAllPages<ModuleItem>(`/courses/${courseId}/modules/${moduleId}/items`, {
      include: ['content_details', 'mastery_paths'],
    });

    if (items.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `## No items found in this module.`
        }]
      };
    }

    // Sort items by position
    const sortedItems = items.sort((a, b) => a.position - b.position);

    const itemList = await Promise.all(sortedItems.map(async (item, index) => {
      const indent = '  '.repeat(item.indent || 0);
      const itemType = item.type || 'Unknown';

      // Better status determination: if there's an html_url, it's accessible
      const accessibleStatus = item.html_url ? '✅ Accessible' :
                              item.published ? '✅ Published' :
                              '❌ Not available';

      // Handle different content types with enhanced info
      let contentInfo = '';
      let contentPreview = '';

      try {
        switch(item.type) {
          case 'Page':
            if (item.page_url) {
              contentInfo = `**Page URL:** ${item.page_url}`;

              // Try to get a content preview
              try {
                const pageContent = await this.getPageContent(courseId, item.page_url);
                const fullContent = pageContent.content[0].text;

                // Extract just the content section
                const contentMatch = fullContent.match(/## Content\n\n(.*?)\n\n---/s);
                if (contentMatch) {
                  const preview = contentMatch[1].substring(0, 200).trim();
                  contentPreview = `\n${indent}**Preview:** ${preview}${contentMatch[1].length > 200 ? '...' : ''}`;
                }
              } catch (e) {
                // If content extraction fails, just note it's available
                contentPreview = `\n${indent}**Preview:** Content available - use get_page_content tool to extract`;
              }
            }
            break;
          case 'Assignment':
            contentInfo = item.content_id ? `**Assignment ID:** ${item.content_id}` : '';
            break;
          case 'Quiz':
            contentInfo = item.content_id ? `**Quiz ID:** ${item.content_id}` : '';
            break;
          case 'Discussion':
            contentInfo = item.content_id ? `**Discussion ID:** ${item.content_id}` : '';
            break;
          case 'ExternalUrl':
            contentInfo = item.external_url ? `**External URL:** ${item.external_url}` : '';
            break;
          case 'File':
            contentInfo = item.content_id ? `**File ID:** ${item.content_id}` : '';
            break;
          default:
            contentInfo = item.content_id ? `**Content ID:** ${item.content_id}` : '';
        }
      } catch (e) {
        // If any content processing fails, continue with basic info
      }

      // Completion requirements
      let completionReq = '';
      if (item.completion_requirement) {
        const req = item.completion_requirement;
        const status = req.completed ? '✅ Completed' : '⏳ Not completed';
        completionReq = `**Completion:** ${req.type} - ${status}`;
        if (req.min_score) {
          completionReq += ` (Min score: ${req.min_score})`;
        }
      }

      // Access link
      const accessLink = item.html_url ? `**Link:** [View Content](${item.html_url})` : '';

      return `${indent}### ${item.position}. ${item.title}

${indent}**Type:** ${itemType}
${indent}**Item ID:** ${item.id}
${indent}**Status:** ${accessibleStatus}
${indent}${contentInfo}${contentPreview}
${indent}${completionReq}
${indent}${accessLink}

${indent}---`;
    }));

    // Get module name if available
    let moduleHeader = `Module ${moduleId}`;
    try {
      // We could make an additional API call to get module name, but let's keep it simple
      moduleHeader = `Module ${moduleId}`;
    } catch (e) {
      // If we can't get module name, just use ID
    }

    const summary = `## ${moduleHeader} - Course Items (${items.length} items)

${itemList}

💡 **Tip:** Click the "View Content" links to access individual items, or use specific tools like "get_assignment_details" with the content IDs shown above.`;

    return {
      content: [{
        type: 'text',
        text: summary
      }]
    };
  }

  async getPageContent(courseId: string, pageUrl: string): Promise<{ content: { type: 'text', text: string }[] }> {
    const page = await this.makeRequest<any>({
      method: 'GET',
      url: `/courses/${courseId}/pages/${pageUrl}`,
    });

    // Extract and clean HTML content
    const htmlContent = page.body || '';

    // Basic HTML to text conversion (remove tags but preserve structure)
    const textContent = htmlContent
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<h([1-6])[^>]*>/gi, (match: string, level: string) => '\n' + '#'.repeat(parseInt(level)) + ' ')
      .replace(/<a[^>]+href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<img[^>]+src="([^"]*)"[^>]*>/gi, '\n![Image]($1)\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();

    const publishStatus = page.published ? '✅ Published' : '❌ Unpublished';
    const lastUpdated = page.updated_at ? new Date(page.updated_at).toLocaleDateString() : 'Unknown';

    const formattedContent = `# ${page.title}

**Page URL:** ${pageUrl}
**Status:** ${publishStatus}
**Last Updated:** ${lastUpdated}
**Page ID:** ${page.page_id || page.id}

---

## Content

${textContent}

---

**Raw HTML Content Available:** ${htmlContent.length} characters
**Original URL:** ${page.html_url || 'Not available'}`;

    return {
      content: [{
        type: 'text',
        text: formattedContent
      }]
    };
  }

  async listAssignments(courseId: string): Promise<{ content: { type: 'text', text: string }[] }> {
    const assignments = await this.getAllPages<Assignment>(`/courses/${courseId}/assignments`, {
      include: ['assignment_group', 'rubric', 'submission'],
      order_by: 'due_at',
    });

    if (assignments.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `## No assignments found for this course.`
        }]
      };
    }

    // Sort assignments by due date (upcoming first)
    const sortedAssignments = assignments.sort((a, b) => {
      if (!a.due_at && !b.due_at) return 0;
      if (!a.due_at) return 1;
      if (!b.due_at) return -1;
      return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
    });

    const assignmentList = sortedAssignments.map((assignment, index) => {
      const dueDate = assignment.due_at ?
        `**Due:** ${new Date(assignment.due_at).toLocaleDateString()} at ${new Date(assignment.due_at).toLocaleTimeString()}` :
        '**Due:** No due date';

      const points = assignment.points_possible ? `**Points:** ${assignment.points_possible}` : '**Points:** Not specified';

      const group = assignment.assignment_group ? `**Group:** ${assignment.assignment_group.name}` : '';

      // Get a brief description (first 200 chars)
      const description = assignment.description ?
        assignment.description.replace(/<[^>]*>/g, '').substring(0, 200) + (assignment.description.length > 200 ? '...' : '') :
        'No description provided';

      return `### ${index + 1}. ${assignment.name}

${dueDate}
${points}
${group}
**Assignment ID:** ${assignment.id}

**Description:** ${description}

---`;
    }).join('\n');

    const summary = `## Assignments for Course ${courseId} (${assignments.length} assignments)

${assignmentList}`;

    return {
      content: [{
        type: 'text',
        text: summary
      }]
    };
  }

  async getAssignmentDetails(courseId: string, assignmentId: string): Promise<{ content: { type: 'text', text: string }[] }> {
    const assignment = await this.makeRequest<Assignment>({
      method: 'GET',
      url: `/courses/${courseId}/assignments/${assignmentId}`,
      params: {
        include: ['assignment_group', 'rubric', 'submission'],
      },
    });

    const dueDate = assignment.due_at ?
      `**Due:** ${new Date(assignment.due_at).toLocaleDateString()} at ${new Date(assignment.due_at).toLocaleTimeString()}` :
      '**Due:** No due date';

    const points = assignment.points_possible ? `**Points:** ${assignment.points_possible}` : '**Points:** Not specified';
    const gradingType = `**Grading Type:** ${assignment.grading_type}`;
    const group = assignment.assignment_group ? `**Assignment Group:** ${assignment.assignment_group.name}` : '';

    // Clean HTML description
    const description = assignment.description ?
      assignment.description
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/h[1-6]>/gi, '\n\n')
        .replace(/<h([1-6])[^>]*>/gi, (match: string, level: string) => '\n' + '#'.repeat(parseInt(level)) + ' ')
        .replace(/<a[^>]+href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim() :
      'No description provided';

    const submissionTypes = assignment.submission_types ?
      `**Submission Types:** ${assignment.submission_types.join(', ')}` : '';

    const allowedAttempts = assignment.allowed_attempts > 0 ?
      `**Allowed Attempts:** ${assignment.allowed_attempts}` :
      '**Allowed Attempts:** Unlimited';

    const formattedContent = `# ${assignment.name}

**Assignment ID:** ${assignment.id}
${dueDate}
${points}
${gradingType}
${group}
${submissionTypes}
${allowedAttempts}

---

## Description

${description}

---

## Assignment Details

**Created:** ${new Date(assignment.created_at).toLocaleDateString()}
**Updated:** ${new Date(assignment.updated_at).toLocaleDateString()}
**Course ID:** ${assignment.course_id}
**HTML URL:** [View Assignment](${assignment.html_url})

💡 **Tip:** Use the HTML URL above to access the assignment directly in Canvas.`;

    return {
      content: [{
        type: 'text',
        text: formattedContent
      }]
    };
  }

  async listAssignmentSubmissions(courseId: string, assignmentId: string): Promise<{ content: Submission[] }> {
    const submissions = await this.getAllPages<Submission>(`/courses/${courseId}/assignments/${assignmentId}/submissions`, {
      include: ['assignment', 'course', 'user'],
    });

    return { content: submissions };
  }

  async listAnnouncements(courseId: string): Promise<{ content: Announcement[] }> {
    const announcements = await this.getAllPages<Announcement>(`/courses/${courseId}/discussion_topics`, {
      only_announcements: true,
      order_by: 'recent_activity',
    });

    return { content: announcements };
  }

  async getAnnouncementDetails(courseId: string, announcementId: string): Promise<{ content: Announcement }> {
    const announcement = await this.makeRequest<Announcement>({
      method: 'GET',
      url: `/courses/${courseId}/discussion_topics/${announcementId}`,
    });

    return { content: announcement };
  }

  async listCourseFiles(courseId: string): Promise<{ content: File[] }> {
    const files = await this.getAllPages<File>(`/courses/${courseId}/files`, {
      sort: 'updated_at',
      order: 'desc',
    });

    return { content: files };
  }

  async getFileDetails(fileId: string): Promise<{ content: File }> {
    const file = await this.makeRequest<File>({
      method: 'GET',
      url: `/files/${fileId}`,
    });

    return { content: file };
  }

  async searchCourseContent(courseId: string, query: string): Promise<{ content: any[] }> {
    // Search across multiple content types
    const [assignments, announcements, pages, files] = await Promise.allSettled([
      this.getAllPages<Assignment>(`/courses/${courseId}/assignments`, {
        search_term: query,
      }),
      this.getAllPages<Announcement>(`/courses/${courseId}/discussion_topics`, {
        search_term: query,
        only_announcements: true,
      }),
      this.getAllPages<any>(`/courses/${courseId}/pages`, {
        search_term: query,
      }),
      this.getAllPages<File>(`/courses/${courseId}/files`, {
        search_term: query,
      }),
    ]);

    const results: any[] = [];

    if (assignments.status === 'fulfilled') {
      results.push(...assignments.value.map(item => ({ ...item, content_type: 'assignment' })));
    }

    if (announcements.status === 'fulfilled') {
      results.push(...announcements.value.map(item => ({ ...item, content_type: 'announcement' })));
    }

    if (pages.status === 'fulfilled') {
      results.push(...pages.value.map(item => ({ ...item, content_type: 'page' })));
    }

    if (files.status === 'fulfilled') {
      results.push(...files.value.map(item => ({ ...item, content_type: 'file' })));
    }

    return { content: results };
  }

  async getUserProfile(): Promise<{ content: any }> {
    const profile = await this.makeRequest<any>({
      method: 'GET',
      url: '/users/self/profile',
    });

    return { content: profile };
  }

  async getFileContent(fileId: string): Promise<{ content: { type: 'text', text: string }[] }> {
    const file = await this.makeRequest<File>({
      method: 'GET',
      url: `/files/${fileId}`,
    });

    const sizeFormatted = file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size';
    const uploadDate = file.created_at ? new Date(file.created_at).toLocaleDateString() : 'Unknown';
    const contentType = file['content-type'] || 'Unknown';

    // Determine file type and provide appropriate access info
    let fileTypeInfo = '';
    let accessInfo = '';

    if (contentType.includes('pdf')) {
      fileTypeInfo = '📄 PDF Document';
      accessInfo = '**Note:** PDF content requires download to view. Use the download URL below.';
    } else if (contentType.includes('image')) {
      fileTypeInfo = '🖼️ Image File';
      accessInfo = '**Note:** Image can be viewed directly through the URL below.';
    } else if (contentType.includes('video')) {
      fileTypeInfo = '🎥 Video File';
      accessInfo = '**Note:** Video can be streamed through Canvas or downloaded.';
    } else if (contentType.includes('audio')) {
      fileTypeInfo = '🎵 Audio File';
      accessInfo = '**Note:** Audio can be played through Canvas or downloaded.';
    } else if (contentType.includes('powerpoint') || contentType.includes('presentation')) {
      fileTypeInfo = '📊 Presentation File';
      accessInfo = '**Note:** Presentation requires download to view fully.';
    } else if (contentType.includes('word') || contentType.includes('document')) {
      fileTypeInfo = '📝 Document File';
      accessInfo = '**Note:** Document requires download for full formatting.';
    } else if (contentType.includes('excel') || contentType.includes('spreadsheet')) {
      fileTypeInfo = '📈 Spreadsheet File';
      accessInfo = '**Note:** Spreadsheet requires download for full functionality.';
    } else {
      fileTypeInfo = '📁 File';
      accessInfo = '**Note:** Download required to access content.';
    }

    const lockInfo = file.locked ? '🔒 **File is locked**' : '🔓 **File is accessible**';
    const hiddenInfo = file.hidden ? '👁️‍🗨️ **File is hidden**' : '👁️ **File is visible**';

    const formattedContent = `# ${file.display_name}

${fileTypeInfo}

**File ID:** ${file.id}
**Filename:** ${file.filename}
**Content Type:** ${contentType}
**Size:** ${sizeFormatted}
**Uploaded:** ${uploadDate}
${lockInfo}
${hiddenInfo}

---

## Access Information

${accessInfo}

**Download URL:** [Download File](${file.url})
${file.thumbnail_url ? `**Thumbnail:** [View Thumbnail](${file.thumbnail_url})` : ''}

---

## File Details

**Folder ID:** ${file.folder_id}
**UUID:** ${file.uuid}
**MIME Class:** ${file.mime_class}
${file.modified_at ? `**Last Modified:** ${new Date(file.modified_at).toLocaleDateString()}` : ''}

💡 **Tip:** Use the download URL above to access the file content directly.`;

    return {
      content: [{
        type: 'text',
        text: formattedContent
      }]
    };
  }

  async getMediaObjectContent(mediaId: string): Promise<{ content: { type: 'text', text: string }[] }> {
    try {
      const mediaObject = await this.makeRequest<any>({
        method: 'GET',
        url: `/media_objects/${mediaId}`,
      });

      const mediaTracks = await this.makeRequest<any[]>({
        method: 'GET',
        url: `/media_objects/${mediaId}/media_tracks`,
      }).catch(() => []); // If tracks fail, continue without them

      let mediaInfo = '🎥 Media Content\n\n';

      if (mediaObject.title) {
        mediaInfo += `**Title:** ${mediaObject.title}\n`;
      }

      mediaInfo += `**Media ID:** ${mediaId}\n`;

      if (mediaObject.media_type) {
        const typeIcon = mediaObject.media_type === 'video' ? '🎥' : '🎵';
        mediaInfo += `**Type:** ${typeIcon} ${mediaObject.media_type}\n`;
      }

      if (mediaObject.duration) {
        const minutes = Math.floor(mediaObject.duration / 60);
        const seconds = Math.floor(mediaObject.duration % 60);
        mediaInfo += `**Duration:** ${minutes}:${seconds.toString().padStart(2, '0')}\n`;
      }

      mediaInfo += '\n---\n\n## Available Sources\n\n';

      // List available media sources/formats
      if (mediaObject.media_sources && mediaObject.media_sources.length > 0) {
        mediaObject.media_sources.forEach((source: any, index: number) => {
          mediaInfo += `### Source ${index + 1}\n`;
          mediaInfo += `**Quality:** ${source.width || 'Unknown'}x${source.height || 'Unknown'}\n`;
          mediaInfo += `**Format:** ${source.content_type || 'Unknown'}\n`;
          if (source.url) {
            mediaInfo += `**Stream URL:** [Play Media](${source.url})\n`;
          }
          mediaInfo += '\n';
        });
      } else {
        mediaInfo += 'No direct media sources available through API.\n\n';
      }

      // List available captions/subtitles
      if (mediaTracks.length > 0) {
        mediaInfo += '## Available Captions/Subtitles\n\n';
        mediaTracks.forEach((track: any) => {
          mediaInfo += `**Language:** ${track.locale || 'Unknown'}\n`;
          mediaInfo += `**Kind:** ${track.kind || 'Unknown'}\n`;
          if (track.content) {
            mediaInfo += `**Content Available:** Yes (${track.content.length} characters)\n`;
          }
          mediaInfo += '\n';
        });
      }

      mediaInfo += '\n💡 **Note:** Media content may require Canvas login to access.';

      return {
        content: [{
          type: 'text',
          text: mediaInfo
        }]
      };

    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `# Media Content (ID: ${mediaId})

❌ **Unable to retrieve media information**

**Error:** ${error instanceof Error ? error.message : 'Unknown error'}

**Media ID:** ${mediaId}

💡 **Note:** This media object may be restricted or the ID may be incorrect.`
        }]
      };
    }
  }

  async extractModuleContent(courseId: string, moduleId: string): Promise<{ content: { type: 'text', text: string }[] }> {
    // Get module items first
    const items = await this.getAllPages<ModuleItem>(`/courses/${courseId}/modules/${moduleId}/items`, {
      include: ['content_details', 'mastery_paths'],
    });

    if (items.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `## No content found in module ${moduleId}`
        }]
      };
    }

    let moduleContent = `# Module ${moduleId} - Complete Content Extract\n\n`;
    moduleContent += `**Course ID:** ${courseId}\n`;
    moduleContent += `**Total Items:** ${items.length}\n\n`;
    moduleContent += '---\n\n';

    // Process each item and extract its content
    const contentPromises = items.map(async (item, index) => {
      let itemContent = `## ${index + 1}. ${item.title}\n\n`;
      itemContent += `**Type:** ${item.type}\n`;
      itemContent += `**Item ID:** ${item.id}\n`;
      itemContent += `**Published:** ${item.published ? '✅ Yes' : '❌ No'}\n\n`;

      try {
        switch (item.type) {
          case 'Page':
            if (item.page_url) {
              const pageContent = await this.getPageContent(courseId, item.page_url);
              itemContent += '### 📄 Page Content:\n\n';
              itemContent += pageContent.content[0].text + '\n\n';
            }
            break;

          case 'File':
            if (item.content_id) {
              const fileContent = await this.getFileContent(item.content_id.toString());
              itemContent += '### 📁 File Information:\n\n';
              itemContent += fileContent.content[0].text + '\n\n';
            }
            break;

          case 'Assignment':
            if (item.content_id) {
              const assignmentContent = await this.getAssignmentDetails(courseId, item.content_id.toString());
              itemContent += '### 📝 Assignment Details:\n\n';
              itemContent += assignmentContent.content[0].text + '\n\n';
            }
            break;

          case 'ExternalUrl':
            if (item.external_url) {
              itemContent += `### 🔗 External Link:\n\n**URL:** [${item.title}](${item.external_url})\n\n`;
            }
            break;

          case 'Quiz':
            itemContent += `### 📊 Quiz Information:\n\n**Quiz ID:** ${item.content_id}\n`;
            if (item.html_url) {
              itemContent += `**Access:** [Take Quiz](${item.html_url})\n`;
            }
            itemContent += '\n';
            break;

          default:
            itemContent += `### ℹ️ Content Information:\n\n**Content ID:** ${item.content_id || 'Not available'}\n`;
            if (item.html_url) {
              itemContent += `**Access:** [View Content](${item.html_url})\n`;
            }
            itemContent += '\n';
        }
      } catch (error) {
        itemContent += `### ❌ Content Extraction Error:\n\n**Error:** ${error instanceof Error ? error.message : 'Unknown error'}\n\n`;
      }

      itemContent += '---\n\n';
      return itemContent;
    });

    // Wait for all content to be extracted
    const extractedContent = await Promise.all(contentPromises);
    moduleContent += extractedContent.join('');

    moduleContent += '\n\n💡 **Complete Module Content Extracted**\n';
    moduleContent += 'This includes all accessible pages, files, assignments, and other resources in this module.';

    return {
      content: [{
        type: 'text',
        text: moduleContent
      }]
    };
  }

  async getWeekContent(courseId: string, weekNumber: string): Promise<{ content: { type: 'text', text: string }[] }> {
    try {
      // First, get all modules in the course
      const modules = await this.getAllPages<Module>(`/courses/${courseId}/modules`, {
        include: ['items', 'content_details'],
      });

      // Find the module that contains the week number
      const weekModule = modules.find(module =>
        module.name.toLowerCase().includes(`week ${weekNumber.toLowerCase()}`) ||
        module.name.toLowerCase().includes(`week${weekNumber.toLowerCase()}`) ||
        module.name.toLowerCase().match(new RegExp(`week\\s*${weekNumber}\\b`, 'i'))
      );

      if (!weekModule) {
        return {
          content: [{
            type: 'text',
            text: `# Week ${weekNumber} - Not Found

❌ **No module found for Week ${weekNumber}**

**Course ID:** ${courseId}
**Searched for:** Week ${weekNumber}

**Available modules:**
${modules.map((m, i) => `${i + 1}. ${m.name} (ID: ${m.id})`).join('\n')}

💡 **Tip:** Try using \`extract_module_content\` with a specific module ID from the list above.`
          }]
        };
      }

      // Extract content from the found week module
      const moduleContent = await this.extractModuleContent(courseId, weekModule.id.toString());

      // Enhance the header to show it's specifically for this week
      const enhancedContent = moduleContent.content[0].text
        .replace(`# Module ${weekModule.id} - Complete Content Extract`, `# Week ${weekNumber} Content - Complete Extract`)
        .replace(`**Course ID:** ${courseId}`, `**Course ID:** ${courseId}\n**Module Name:** ${weekModule.name}\n**Module ID:** ${weekModule.id}`);

      return {
        content: [{
          type: 'text',
          text: enhancedContent
        }]
      };

    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `# Week ${weekNumber} Content - Error

❌ **Failed to retrieve Week ${weekNumber} content**

**Error:** ${error instanceof Error ? error.message : 'Unknown error'}
**Course ID:** ${courseId}

💡 **Troubleshooting:**
1. Verify the course ID is correct
2. Check that Week ${weekNumber} exists in this course
3. Ensure you have access to the course content`
        }]
      };
    }
  }

  async getRequestStats(): Promise<{ requestCount: number; lastRequestTime: number }> {
    return {
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
    };
  }
}