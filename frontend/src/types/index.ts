// ─── User ─────────────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'member';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

// ─── Project ──────────────────────────────────────────────────────────────────
export interface Project {
  _id: string;
  title: string;
  description: string;
  members: User[];
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectPayload {
  title: string;
  description?: string;
  memberIds?: string[];
}

// ─── Task ─────────────────────────────────────────────────────────────────────
export type TaskStatus = 'pending' | 'in-progress' | 'completed';

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignedTo: User | null;
  projectId: { _id: string; title: string } | string;
  deadline: string | null;
  createdBy: User;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  projectId: string;
  assignedTo?: string;
  deadline?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  assignedTo?: string | null;
  deadline?: string | null;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalUsers?: number;
  recentTasks: Task[];
}

// ─── API Response ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}
