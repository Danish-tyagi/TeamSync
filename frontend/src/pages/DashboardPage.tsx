import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FolderKanban, CheckSquare, Clock, AlertTriangle, Users, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { dashboardApi } from '../api/dashboard';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import Spinner from '../components/ui/Spinner';
import { StatusBadge } from '../components/ui/Badge';
import { Task } from '../types';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, bgColor }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      </div>
      <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center`}>
        {icon}
      </div>
    </div>
  </div>
);

const DashboardPage: React.FC = () => {
  const { user, isAdmin } = useAuth();

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.getStats,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return <Layout><Spinner size="lg" className="mt-20" /></Layout>;
  }

  if (error || !stats) {
    return <Layout><div className="text-center mt-20 text-red-600">Failed to load dashboard</div></Layout>;
  }

  const completionRate = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0]} 
        </h1>
        <p className="text-gray-500 mt-1">
          {isAdmin ? "Here's your team's overview" : "Here's your task overview"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Projects" value={stats.totalProjects} icon={<FolderKanban className="w-6 h-6 text-blue-600" />} color="text-blue-700" bgColor="bg-blue-50" />
        <StatCard label="Total Tasks" value={stats.totalTasks} icon={<CheckSquare className="w-6 h-6 text-indigo-600" />} color="text-indigo-700" bgColor="bg-indigo-50" />
        <StatCard label="In Progress" value={stats.inProgressTasks} icon={<Clock className="w-6 h-6 text-yellow-600" />} color="text-yellow-700" bgColor="bg-yellow-50" />
        <StatCard label="Overdue" value={stats.overdueTasks} icon={<AlertTriangle className="w-6 h-6 text-red-600" />} color="text-red-700" bgColor="bg-red-50" />
        {isAdmin && stats.totalUsers !== undefined && (
          <StatCard label="Team Members" value={stats.totalUsers} icon={<Users className="w-6 h-6 text-purple-600" />} color="text-purple-700" bgColor="bg-purple-50" />
        )}
        <StatCard label="Completed" value={stats.completedTasks} icon={<TrendingUp className="w-6 h-6 text-green-600" />} color="text-green-700" bgColor="bg-green-50" />
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Overall Completion</h2>
          <span className="text-2xl font-bold text-blue-600">{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <progress
            className="w-full h-3 rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-gray-100 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-blue-600 transition-all duration-500"
            value={completionRate}
            max={100}
            aria-label={`${completionRate}% tasks completed`}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>{stats.pendingTasks} pending</span>
          <span>{stats.inProgressTasks} in progress</span>
          <span>{stats.completedTasks} completed</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Tasks</h2>
          <Link to="/tasks" className="text-sm text-blue-600 hover:underline font-medium">
            View all
          </Link>
        </div>
        {stats.recentTasks.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>No tasks yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {stats.recentTasks.map((task: Task) => (
              <div key={task._id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {typeof task.projectId === 'object' ? task.projectId.title : ''}
                    {task.deadline && (
                      <span className="ml-2">· Due {format(new Date(task.deadline), 'MMM d')}</span>
                    )}
                  </p>
                </div>
                <StatusBadge status={task.status} isOverdue={task.isOverdue} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DashboardPage;
