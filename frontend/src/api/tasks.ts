import api from './axios';
import { Task, CreateTaskPayload, UpdateTaskPayload } from '../types';

export interface TaskFilters {
  projectId?: string;
  status?: string;
  assignedTo?: string;
}

export const tasksApi = {
  getAll: async (filters?: TaskFilters): Promise<Task[]> => {
    const res = await api.get<{ success: boolean; tasks: Task[] }>('/tasks', {
      params: filters,
    });
    return res.data.tasks;
  },

  getById: async (id: string): Promise<Task> => {
    const res = await api.get<{ success: boolean; task: Task }>(`/tasks/${id}`);
    return res.data.task;
  },

  create: async (data: CreateTaskPayload): Promise<Task> => {
    const res = await api.post<{ success: boolean; task: Task }>('/tasks', data);
    return res.data.task;
  },

  update: async (id: string, data: UpdateTaskPayload): Promise<Task> => {
    const res = await api.put<{ success: boolean; task: Task }>(`/tasks/${id}`, data);
    return res.data.task;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },
};
