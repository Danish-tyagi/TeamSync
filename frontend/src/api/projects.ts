import api from './axios';
import { Project, CreateProjectPayload } from '../types';

export const projectsApi = {
  getAll: async (): Promise<Project[]> => {
    const res = await api.get<{ success: boolean; projects: Project[] }>('/projects');
    return res.data.projects;
  },

  getById: async (id: string): Promise<Project> => {
    const res = await api.get<{ success: boolean; project: Project }>(`/projects/${id}`);
    return res.data.project;
  },

  create: async (data: CreateProjectPayload): Promise<Project> => {
    const res = await api.post<{ success: boolean; project: Project }>('/projects', data);
    return res.data.project;
  },

  update: async (id: string, data: Partial<CreateProjectPayload>): Promise<Project> => {
    const res = await api.put<{ success: boolean; project: Project }>(`/projects/${id}`, data);
    return res.data.project;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  addMember: async (projectId: string, userId: string): Promise<Project> => {
    const res = await api.post<{ success: boolean; project: Project }>(
      `/projects/${projectId}/members`,
      { userId }
    );
    return res.data.project;
  },

  removeMember: async (projectId: string, userId: string): Promise<Project> => {
    const res = await api.delete<{ success: boolean; project: Project }>(
      `/projects/${projectId}/members/${userId}`
    );
    return res.data.project;
  },
};
