import api from './axios';
import { DashboardStats } from '../types';

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await api.get<{ success: boolean; stats: DashboardStats }>('/dashboard/stats');
    return res.data.stats;
  },
};
