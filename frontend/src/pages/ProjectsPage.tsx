import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FolderKanban, Users, Trash2, Edit2, UserPlus, UserMinus } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

import { projectsApi } from '../api/projects';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { Project, User } from '../types';

import Layout from '../components/layout/Layout';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';

interface ProjectFormProps {
  initial?: Partial<Project>;
  onSubmit: (data: { title: string; description: string }) => void;
  isLoading: boolean;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ initial, onSubmit, isLoading }) => {
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || form.title.length < 2) {
      setErrors({ title: 'Title must be at least 2 characters' });
      return;
    }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Project Title"
        name="title"
        value={form.title}
        onChange={(e) => { setForm((p) => ({ ...p, title: e.target.value })); setErrors({}); }}
        error={errors.title}
        placeholder="e.g. Website Redesign"
      />
      <Input
        label="Description (optional)"
        name="description"
        value={form.description}
        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
        placeholder="Brief project description..."
      />
      <Button type="submit" className="w-full" isLoading={isLoading}>
        {initial ? 'Update Project' : 'Create Project'}
      </Button>
    </form>
  );
};

interface ManageMembersProps {
  project: Project;
  allUsers: User[];
  onAdd: (userId: string) => void;
  onRemove: (userId: string) => void;
  isAdding: boolean;
  isRemoving: boolean;
}

const ManageMembers: React.FC<ManageMembersProps> = ({
  project, allUsers, onAdd, onRemove, isAdding, isRemoving,
}) => {
  const [selectedUser, setSelectedUser] = useState('');
  const memberIds = project.members.map((m) => m.id || (m as any)._id);
  const available = allUsers.filter(
    (u) => !memberIds.includes(u.id) && u.id !== (project.createdBy?.id || (project.createdBy as any)?._id)
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Add Member</p>
        <div className="flex gap-2">
          <Select
            options={available.map((u) => ({ value: u.id, label: `${u.name} (${u.role})` }))}
            placeholder="Select a user..."
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={() => { if (selectedUser) { onAdd(selectedUser); setSelectedUser(''); } }}
            disabled={!selectedUser}
            isLoading={isAdding}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Add
          </Button>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">
          Current Members ({project.members.length})
        </p>
        {project.members.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No members yet</p>
        ) : (
          <ul className="space-y-2">
            {project.members.map((member) => {
              const id = member.id || (member as any)._id;
              return (
                <li key={id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onRemove(id)}
                    isLoading={isRemoving}
                    leftIcon={<UserMinus className="w-3 h-3" />}
                  >
                    Remove
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

const ProjectsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [membersProject, setMembersProject] = useState<Project | null>(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: authApi.getUsers,
    enabled: isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created!');
      setCreateOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create project'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => projectsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project updated!');
      setEditProject(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update project'),
  });

  const deleteMutation = useMutation({
    mutationFn: projectsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Project deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete project'),
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ projectId, userId }: { projectId: string; userId: string }) =>
      projectsApi.addMember(projectId, userId),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setMembersProject(updated);
      toast.success('Member added!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to add member'),
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ projectId, userId }: { projectId: string; userId: string }) =>
      projectsApi.removeMember(projectId, userId),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setMembersProject(updated);
      toast.success('Member removed');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to remove member'),
  });

  const handleDelete = (project: Project) => {
    if (window.confirm(`Delete "${project.title}" and all its tasks?`)) {
      deleteMutation.mutate(project._id);
    }
  };

  if (isLoading) {
    return <Layout><Spinner size="lg" className="mt-20" /></Layout>;
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            New Project
          </Button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No projects yet</p>
          {isAdmin && <p className="text-gray-400 text-sm mt-1">Create your first project to get started</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div key={project._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FolderKanban className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 leading-tight">{project.title}</h3>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => setEditProject(project)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      aria-label="Edit project"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(project)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {project.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{project.description}</p>
              )}

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>{project.members.length} member{project.members.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {format(new Date(project.createdAt), 'MMM d, yyyy')}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => setMembersProject(project)}
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      Manage
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create New Project">
        <ProjectForm onSubmit={(data) => createMutation.mutate(data)} isLoading={createMutation.isPending} />
      </Modal>

      <Modal isOpen={!!editProject} onClose={() => setEditProject(null)} title="Edit Project">
        {editProject && (
          <ProjectForm
            initial={editProject}
            onSubmit={(data) => updateMutation.mutate({ id: editProject._id, data })}
            isLoading={updateMutation.isPending}
          />
        )}
      </Modal>

      <Modal
        isOpen={!!membersProject}
        onClose={() => setMembersProject(null)}
        title={`Members — ${membersProject?.title}`}
        size="md"
      >
        {membersProject && (
          <ManageMembers
            project={membersProject}
            allUsers={allUsers}
            onAdd={(userId) => addMemberMutation.mutate({ projectId: membersProject._id, userId })}
            onRemove={(userId) => removeMemberMutation.mutate({ projectId: membersProject._id, userId })}
            isAdding={addMemberMutation.isPending}
            isRemoving={removeMemberMutation.isPending}
          />
        )}
      </Modal>
    </Layout>
  );
};

export default ProjectsPage;
