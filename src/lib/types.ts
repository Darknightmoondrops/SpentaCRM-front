export type CompanyStatus = "CUSTOMER" | "PROSPECT" | "PARTNER" | "INACTIVE";
export type DealStage = "NEW" | "CONTACTED" | "PROPOSAL" | "NEGOTIATION" | "WON" | "LOST";
export type ProjectStatus = "PLANNED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED";
export type ProjectHealth = "ON_TRACK" | "AT_RISK" | "BLOCKED";
export type MilestoneStatus = "PLANNED" | "IN_PROGRESS" | "DONE";
export type TaskStatus = "OPEN" | "IN_PROGRESS" | "DONE";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RelationType = "COMPANY" | "CONTACT" | "DEAL" | "PROJECT";
export type ContactChannel = "EMAIL" | "PHONE" | "MEETING";
export type WorkspaceRoleId = "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER" | string;
export type WorkspaceUserStatus = "ACTIVE" | "INVITED" | "SUSPENDED";
export type PermissionKey =
  | "crm:read"
  | "crm:write"
  | "crm:archive"
  | "workspace:manage"
  | "members:manage"
  | "roles:manage"
  | "audit:read"
  | "extensions:manage";

export interface BaseRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceUser {
  id: string;
  name: string;
  initials: string;
  email?: string;
  roleId?: WorkspaceRoleId;
  role?: string;
  title?: string;
  status?: WorkspaceUserStatus;
  lastActiveAt?: string;
  joinedAt?: string;
}

export interface WorkspaceRole {
  id: WorkspaceRoleId;
  name: string;
  description: string;
  permissions: PermissionKey[];
  system: boolean;
  userCount: number;
}

export interface WorkspaceSettings {
  name: string;
  currency: string;
  locale: string;
  timezone: string;
  fiscalYearStart: string;
  weekStartsOn: "MONDAY" | "SUNDAY";
}

export interface AuthSession {
  user: Required<Pick<WorkspaceUser, "id" | "name" | "initials">> & {
    email: string;
    roleId: WorkspaceRoleId;
    role: string;
    title?: string;
  };
  workspace: { id: string; name: string; plan: string };
  permissions: PermissionKey[];
  expiresAt: string;
}

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "CREATE"
  | "UPDATE"
  | "ARCHIVE"
  | "REACTIVATE"
  | "STATUS_CHANGE"
  | "ROLE_CHANGE"
  | "SETTINGS_UPDATE"
  | "EXTENSION_CHANGE";

export interface AuditEvent extends BaseRecord {
  occurredAt: string;
  actorId: string;
  actor: string;
  actorEmail?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityLabel: string;
  summary: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
}

export interface Company extends BaseRecord {
  name: string;
  industry: string;
  status: CompanyStatus;
  location: string;
  website: string;
  ownerId: string;
  owner: string;
  openDeals: number;
  activeProjects: number;
  value: number;
  lastContact: string;
  description?: string;
  archivedAt?: string | null;
}

export interface Contact extends BaseRecord {
  name: string;
  role: string;
  department?: string;
  companyId: string;
  company: string;
  email: string;
  phone: string;
  preferredChannel: ContactChannel;
  isPrimary: boolean;
  linkedin?: string;
  notes?: string;
  lastContact: string;
  archivedAt?: string | null;
}

export interface Deal extends BaseRecord {
  title: string;
  companyId: string;
  company: string;
  primaryContactId?: string;
  stage: DealStage;
  value: number;
  ownerId: string;
  owner: string;
  closeDate: string;
  probability: number;
  description?: string;
  lostReason?: string;
  closedAt?: string | null;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  dueDate: string;
  status: MilestoneStatus;
}

export interface Project extends BaseRecord {
  title: string;
  companyId: string;
  company: string;
  sourceDealId?: string;
  status: ProjectStatus;
  health: ProjectHealth;
  ownerId: string;
  owner: string;
  memberIds: string[];
  team: number;
  progress: number;
  startDate: string;
  target: string;
  targetDate: string;
  description?: string;
  milestones: ProjectMilestone[];
  archivedAt?: string | null;
}

export interface Task extends BaseRecord {
  title: string;
  relationType: RelationType;
  relationId: string;
  relation: string;
  assigneeId: string;
  assignee: string;
  due: string;
  dueAt?: string;
  status: TaskStatus;
  priority: Priority;
  description?: string;
  completedAt?: string | null;
  archivedAt?: string | null;
}

export interface Activity extends BaseRecord {
  type: "MEETING" | "CALL" | "EMAIL" | "NOTE" | "UPDATE";
  title: string;
  detail: string;
  actorId: string;
  actor: string;
  time: string;
  relationType: RelationType;
  relationId: string;
  relation: string;
}
