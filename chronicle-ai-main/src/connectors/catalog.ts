/**
 * AgentOS Connector Catalog
 * ---------------------------
 * The single source of truth for every external app AgentOS can act across.
 *
 * This module is intentionally dependency-free (pure data) so it can be
 * imported by BOTH the Express server (planning + execution) and the React
 * client (Integrations Hub UI) without pulling in any Node-only or
 * browser-only code.
 *
 * Each connector declares the concrete `actions` the AI agent is allowed to
 * take in that app. The planner exposes these actions to Gemini as the agent's
 * toolset; the executor dispatches to them at run time.
 */

export type ConnectorCategory =
  | "Communication"
  | "Productivity"
  | "Development"
  | "Project Management"
  | "CRM & Sales"
  | "Calendar & Scheduling"
  | "Storage"
  | "Finance"
  | "Support";

export interface ConnectorAction {
  /** Stable action id, unique within the connector, e.g. "send_message" */
  id: string;
  /** Human label shown in the UI, e.g. "Send message" */
  label: string;
  /** Natural-language description the LLM uses to decide when to call it */
  description: string;
  /** Parameter names the action expects (documented for the planner) */
  params: string[];
}

export interface Connector {
  id: string;
  name: string;
  category: ConnectorCategory;
  /** Brand-ish accent color used by the UI cards/badges */
  color: string;
  /** lucide-react icon export name; client maps this to a component */
  icon: string;
  /** Short tagline shown on the integration card */
  description: string;
  /** Whether AgentOS can perform a *real* (non-simulated) call for this app */
  liveCapable?: boolean;
  actions: ConnectorAction[];
}

export const CONNECTORS: Connector[] = [
  // ── Communication ────────────────────────────────────────────────
  {
    id: "slack",
    name: "Slack",
    category: "Communication",
    color: "#4A154B",
    icon: "Slack",
    description: "Post messages, alerts, and summaries to channels & DMs.",
    liveCapable: true,
    actions: [
      { id: "send_message", label: "Send message", description: "Post a message to a Slack channel or user.", params: ["channel", "text"] },
      { id: "create_channel", label: "Create channel", description: "Create a new Slack channel.", params: ["name", "purpose"] },
      { id: "schedule_message", label: "Schedule message", description: "Schedule a message to be sent later.", params: ["channel", "text", "post_at"] },
    ],
  },
  {
    id: "discord",
    name: "Discord",
    category: "Communication",
    color: "#5865F2",
    icon: "MessageSquare",
    description: "Send messages and alerts to Discord servers & channels.",
    actions: [
      { id: "send_message", label: "Send message", description: "Post a message to a Discord channel.", params: ["channel", "text"] },
      { id: "create_thread", label: "Create thread", description: "Open a discussion thread in a channel.", params: ["channel", "title"] },
    ],
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    category: "Communication",
    color: "#6264A7",
    icon: "Users",
    description: "Notify Teams channels and start chats.",
    actions: [
      { id: "send_message", label: "Send message", description: "Post a message to a Teams channel or chat.", params: ["channel", "text"] },
    ],
  },
  {
    id: "gmail",
    name: "Gmail",
    category: "Communication",
    color: "#EA4335",
    icon: "Mail",
    description: "Draft, send, and reply to emails on your behalf.",
    actions: [
      { id: "send_email", label: "Send email", description: "Compose and send an email.", params: ["to", "subject", "body"] },
      { id: "create_draft", label: "Create draft", description: "Save an email draft for review.", params: ["to", "subject", "body"] },
      { id: "reply", label: "Reply to thread", description: "Reply to an existing email thread.", params: ["thread_id", "body"] },
    ],
  },
  {
    id: "outlook",
    name: "Outlook",
    category: "Communication",
    color: "#0078D4",
    icon: "Mail",
    description: "Send Outlook mail and manage your inbox.",
    actions: [
      { id: "send_email", label: "Send email", description: "Compose and send an Outlook email.", params: ["to", "subject", "body"] },
    ],
  },

  // ── Productivity ─────────────────────────────────────────────────
  {
    id: "notion",
    name: "Notion",
    category: "Productivity",
    color: "#000000",
    icon: "FileText",
    description: "Create pages, log entries, and update databases.",
    actions: [
      { id: "create_page", label: "Create page", description: "Create a new Notion page.", params: ["parent", "title", "content"] },
      { id: "add_db_row", label: "Add database row", description: "Append a row to a Notion database.", params: ["database", "properties"] },
      { id: "append_block", label: "Append content", description: "Append content blocks to a page.", params: ["page_id", "content"] },
    ],
  },
  {
    id: "google_docs",
    name: "Google Docs",
    category: "Productivity",
    color: "#4285F4",
    icon: "FileText",
    description: "Create and update Google Docs documents.",
    actions: [
      { id: "create_doc", label: "Create document", description: "Create a new Google Doc.", params: ["title", "content"] },
      { id: "append_text", label: "Append text", description: "Append text to an existing doc.", params: ["doc_id", "content"] },
    ],
  },
  {
    id: "confluence",
    name: "Confluence",
    category: "Productivity",
    color: "#172B4D",
    icon: "BookOpen",
    description: "Publish and update knowledge-base pages.",
    actions: [
      { id: "create_page", label: "Create page", description: "Publish a Confluence page.", params: ["space", "title", "content"] },
    ],
  },
  {
    id: "airtable",
    name: "Airtable",
    category: "Productivity",
    color: "#18BFFF",
    icon: "Table",
    description: "Create and update records across bases.",
    actions: [
      { id: "create_record", label: "Create record", description: "Add a record to a table.", params: ["base", "table", "fields"] },
    ],
  },

  // ── Development ──────────────────────────────────────────────────
  {
    id: "github",
    name: "GitHub",
    category: "Development",
    color: "#181717",
    icon: "Github",
    description: "Open issues, PRs, and comment on repos.",
    liveCapable: true,
    actions: [
      { id: "create_issue", label: "Create issue", description: "Open a new GitHub issue.", params: ["repo", "title", "body", "labels"] },
      { id: "comment_issue", label: "Comment on issue", description: "Add a comment to an issue or PR.", params: ["repo", "issue_number", "body"] },
      { id: "create_pr", label: "Open pull request", description: "Open a new pull request.", params: ["repo", "title", "head", "base", "body"] },
    ],
  },
  {
    id: "gitlab",
    name: "GitLab",
    category: "Development",
    color: "#FC6D26",
    icon: "GitBranch",
    description: "Manage issues and merge requests.",
    actions: [
      { id: "create_issue", label: "Create issue", description: "Open a GitLab issue.", params: ["project", "title", "description"] },
    ],
  },

  // ── Project Management ───────────────────────────────────────────
  {
    id: "linear",
    name: "Linear",
    category: "Project Management",
    color: "#5E6AD2",
    icon: "CircleDot",
    description: "Create and triage engineering tickets.",
    actions: [
      { id: "create_issue", label: "Create issue", description: "Create a Linear issue.", params: ["team", "title", "description", "priority"] },
      { id: "update_status", label: "Update status", description: "Move an issue to a new status.", params: ["issue_id", "status"] },
    ],
  },
  {
    id: "jira",
    name: "Jira",
    category: "Project Management",
    color: "#0052CC",
    icon: "CircleDot",
    description: "Create tickets and manage sprints.",
    actions: [
      { id: "create_issue", label: "Create issue", description: "Create a Jira ticket.", params: ["project", "summary", "description", "issue_type"] },
      { id: "transition", label: "Transition ticket", description: "Move a ticket through its workflow.", params: ["issue_key", "status"] },
    ],
  },
  {
    id: "trello",
    name: "Trello",
    category: "Project Management",
    color: "#0079BF",
    icon: "Trello",
    description: "Add cards and organize boards.",
    actions: [
      { id: "create_card", label: "Create card", description: "Add a card to a Trello list.", params: ["board", "list", "name", "description"] },
    ],
  },
  {
    id: "asana",
    name: "Asana",
    category: "Project Management",
    color: "#F06A6A",
    icon: "CheckSquare",
    description: "Create tasks and assign work.",
    actions: [
      { id: "create_task", label: "Create task", description: "Create an Asana task.", params: ["project", "name", "notes", "assignee"] },
    ],
  },

  // ── CRM & Sales ──────────────────────────────────────────────────
  {
    id: "hubspot",
    name: "HubSpot",
    category: "CRM & Sales",
    color: "#FF7A59",
    icon: "Contact",
    description: "Log contacts, deals, and CRM notes.",
    actions: [
      { id: "create_contact", label: "Create contact", description: "Add a contact to the CRM.", params: ["email", "firstname", "lastname", "company"] },
      { id: "create_deal", label: "Create deal", description: "Create a deal in a pipeline.", params: ["name", "amount", "stage"] },
      { id: "log_note", label: "Log note", description: "Attach a note to a contact or deal.", params: ["object_id", "note"] },
    ],
  },
  {
    id: "salesforce",
    name: "Salesforce",
    category: "CRM & Sales",
    color: "#00A1E0",
    icon: "Cloud",
    description: "Create leads and update opportunities.",
    actions: [
      { id: "create_lead", label: "Create lead", description: "Create a Salesforce lead.", params: ["name", "company", "email"] },
    ],
  },

  // ── Calendar & Scheduling ────────────────────────────────────────
  {
    id: "google_calendar",
    name: "Google Calendar",
    category: "Calendar & Scheduling",
    color: "#4285F4",
    icon: "Calendar",
    description: "Schedule meetings and send invites.",
    actions: [
      { id: "create_event", label: "Create event", description: "Schedule a calendar event with attendees.", params: ["title", "start", "end", "attendees"] },
      { id: "find_slot", label: "Find free slot", description: "Find a mutually free time slot.", params: ["attendees", "duration", "window"] },
    ],
  },
  {
    id: "calendly",
    name: "Calendly",
    category: "Calendar & Scheduling",
    color: "#006BFF",
    icon: "CalendarClock",
    description: "Share booking links and schedule calls.",
    actions: [
      { id: "create_invite", label: "Send booking link", description: "Send a Calendly scheduling link.", params: ["to", "event_type"] },
    ],
  },

  // ── Storage ──────────────────────────────────────────────────────
  {
    id: "google_drive",
    name: "Google Drive",
    category: "Storage",
    color: "#1FA463",
    icon: "HardDrive",
    description: "Create, share, and organize files.",
    actions: [
      { id: "create_file", label: "Create file", description: "Create a file in Drive.", params: ["name", "content", "folder"] },
      { id: "share_file", label: "Share file", description: "Share a file with people.", params: ["file_id", "emails", "role"] },
    ],
  },
  {
    id: "dropbox",
    name: "Dropbox",
    category: "Storage",
    color: "#0061FF",
    icon: "Package",
    description: "Upload and share files.",
    actions: [
      { id: "share_link", label: "Create share link", description: "Create a shareable link for a file.", params: ["path"] },
    ],
  },

  // ── Finance ──────────────────────────────────────────────────────
  {
    id: "stripe",
    name: "Stripe",
    category: "Finance",
    color: "#635BFF",
    icon: "CreditCard",
    description: "Create invoices and issue refunds.",
    actions: [
      { id: "create_invoice", label: "Create invoice", description: "Draft and send an invoice.", params: ["customer", "amount", "description"] },
      { id: "issue_refund", label: "Issue refund", description: "Refund a charge.", params: ["charge_id", "amount"] },
    ],
  },

  // ── Support ──────────────────────────────────────────────────────
  {
    id: "zendesk",
    name: "Zendesk",
    category: "Support",
    color: "#03363D",
    icon: "LifeBuoy",
    description: "Create and update support tickets.",
    actions: [
      { id: "create_ticket", label: "Create ticket", description: "Open a support ticket.", params: ["subject", "description", "priority"] },
      { id: "add_reply", label: "Reply to ticket", description: "Add a public reply to a ticket.", params: ["ticket_id", "body"] },
    ],
  },
];

export const CATEGORIES: ConnectorCategory[] = [
  "Communication",
  "Productivity",
  "Development",
  "Project Management",
  "CRM & Sales",
  "Calendar & Scheduling",
  "Storage",
  "Finance",
  "Support",
];

export function getConnector(id: string): Connector | undefined {
  return CONNECTORS.find((c) => c.id === id);
}

/** Apps that are connected by default so the demo works out of the box. */
export const DEFAULT_CONNECTED = ["slack", "gmail", "notion", "github", "google_calendar", "linear"];
