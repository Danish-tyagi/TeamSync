import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, CheckSquare, Trash2, Edit2, Filter, Calendar, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

import { tasksApi } from '../api/tasks';
import { projectsApi } from '../api/projects';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { Task, TaskStatus } from '../types';

import Layout from '../components/layout/Layout';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { StatusBadge } from '../components/ui/Badge';

interface TaskFormProps {
  initial?: Partial<Task>;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  isAdmin: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({ initial, onSubmit, isLoading, isAdmin }) => {
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    projectId: typeof initial?.projectId === 'object' ? (initial.projectId as any)._id : initial?.projectId || '',
    assignedTo: (initial?.assignedTo as any)?._id || (initial?.assignedTo as any)?.id || '',
    deadline: initial?.deadline ? initial.deadline.slice(0, 10) : '',
    status: initial?.status || 'pending',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll,
    enabled: isAdmin,
  });

  const selectedProject = projects.find((p) => p._id === form.projectId);
  const assignableUsers = selectedProject?.members || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.title || form.title.length < 2) errs.title = 'Title must be at least 2 characters';
    if (isAdmin && !form.projectId) errs.projectId = 'Project is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit({
      ...form,
      assignedTo: form.assignedTo || undefined,
      deadline: form.deadline || undefined,
    });
  };

  const set = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: '' }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isAdmin && (
        <>
          <Input
            label="Task Title"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            error={errors.title}
            placeholder="e.g. Design landing page"
          />
          <Input
            label="Description (optional)"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Task details..."
          />
          <Select
            label="Project"
            value={form.projectId}
            onChange={(e) => { set('projectId', e.target.value); set('assignedTo', ''); }}
            error={errors.projectId}
            placeholder="Select project..."
            options={projects.map((p) => ({ value: p._id, label: p.title }))}
          />
          {form.projectId && (
            <Select
              label="Assign To (optional)"
              value={form.assignedTo}
              onChange={(e) => set('assignedTo', e.target.value)}
              placeholder="Unassigned"
              options={assignableUsers.map((u) => ({
                value: u.id || (u as any)._id,
                label: `${u.name} (${u.role})`,
              }))}
            />
          )}
          <Input
            label="Deadline (optional)"
            type="date"
            value={form.deadline}
            onChange={(e) => set('deadline', e.target.value)}
          />
        </>
      )}

      <Select
        label="Status"
        value={form.status}
        onChange={(e) => set('status', e.target.value)}
        options={[
          { value: 'pending', label: 'Pending' },
          { value: 'in-progress', label: 'In Progress' },
          { value: 'completed', label: 'Completed' },
        ]}
      />

      <Button type="submit" className="w-full" isLoading={isLoading}>
        {initial ? 'Update Task' : 'Create Task'}
      </Button>
    </form>
  );
};

const TasksPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProject, setFilterProject] = useState('');

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', filterStatus, filterProject],
    queryFn: () => tasksApi.getAll({
      status: filterStatus || undefined,
      projectId: filterProject || undefined,
    }),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: authApi.getUsers,
    enabled: isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Task created!');
      setCreateOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create task'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => tasksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Task updated!');
      setEditTask(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update task'),
  });

  const deleteMutation = useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Task deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete task'),
  });

  const handleDelete = (task: Task) => {
    if (window.confirm(`Delete task "${task.title}"?`)) {
      deleteMutation.mutate(task._id);
    }
  };

  const handleStatusChange = (task: Task, status: TaskStatus) => {
    updateMutation.mutate({ id: task._id, data: { status } });
  };

  if (isLoading) {
    return <Layout><Spinner size="lg" className="mt-20" /></Layout>;
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 mt-1">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            New Task
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-gray-400" />
        <Select
          options={[
            { value: 'pending', label: 'Pending' },
            { value: 'in-progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
          ]}
          placeholder="All Statuses"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-40"
        />
        <Select
          options={projects.map((p) => ({ value: p._id, label: p.title }))}
          placeholder="All Projects"
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="w-48"
        />
        {(filterStatus || filterProject) && (
          <button
            onClick={() => { setFilterStatus(''); setFilterProject(''); }}
            className="text-sm text-blue-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No tasks found</p>
          {isAdmin && <p className="text-gray-400 text-sm mt-1">Create your first task to get started</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const projectTitle = typeof task.projectId === 'object' ? task.projectId.title : task.projectId;
            const assigneeName = task.assignedTo ? (task.assignedTo as any).name : 'Unassigned';

            return (
              <div key={task._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 truncate">{task.title}</h3>
                      <StatusBadge status={task.status} isOverdue={task.isOverdue} />
                    </div>

                    {task.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{task.description}</p>
                    )}

                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                        {projectTitle}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <UserIcon className="w-3 h-3" />
                        {assigneeName}
                      </span>
                      {task.deadline && (
                        <span className={`flex items-center gap-1 text-xs ${task.isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          <Calendar className="w-3 h-3" />
                          {format(new Date(task.deadline), 'MMM d, yyyy')}
                          {task.isOverdue && ' (Overdue)'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!isAdmin && task.status !== 'completed' && (
                      <Select
                        options={[
                          { value: 'pending', label: 'Pending' },
                          { value: 'in-progress', label: 'In Progress' },
                          { value: 'completed', label: 'Completed' },
                        ]}
                        value={task.status}
                        onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                        className="text-xs w-36"
                      />
                    )}
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => setEditTask(task)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          aria-label="Edit task"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(task)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create New Task" size="md">
        <TaskForm
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
          isAdmin={isAdmin}
        />
      </Modal>

      <Modal isOpen={!!editTask} onClose={() => setEditTask(null)} title="Edit Task" size="md">
        {editTask && (
          <TaskForm
            initial={editTask}
            onSubmit={(data) => updateMutation.mutate({ id: editTask._id, data })}
            isLoading={updateMutation.isPending}
            isAdmin={isAdmin}
          />
        )}
      </Modal>
    </Layout>
  );
};

export default TasksPage;
