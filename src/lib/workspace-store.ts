'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WorkspacePlan = 'free' | 'pro' | 'team';
export type WorkspaceRole = 'owner' | 'manager' | 'viewer';
export type WorkspaceMemberStatus = 'active' | 'pending';
export type WorkspaceFeature = 'aiAdvisor' | 'fieldIntelligence' | 'reportExport' | 'teamCollaboration';

export interface WorkspaceMember {
  id: string;
  email: string;
  name: string;
  role: WorkspaceRole;
  status: WorkspaceMemberStatus;
  invitedAt: number;
}

export interface WorkspacePlanPolicy {
  maxMembers: number;
  features: Record<WorkspaceFeature, boolean>;
}

export const WORKSPACE_PLANS: Record<WorkspacePlan, WorkspacePlanPolicy> = {
  free: {
    maxMembers: 1,
    features: {
      aiAdvisor: true,
      fieldIntelligence: true,
      reportExport: true,
      teamCollaboration: false,
    },
  },
  pro: {
    maxMembers: 5,
    features: {
      aiAdvisor: true,
      fieldIntelligence: true,
      reportExport: true,
      teamCollaboration: true,
    },
  },
  team: {
    maxMembers: 25,
    features: {
      aiAdvisor: true,
      fieldIntelligence: true,
      reportExport: true,
      teamCollaboration: true,
    },
  },
};

export function planAllows(plan: WorkspacePlan, feature: WorkspaceFeature): boolean {
  return WORKSPACE_PLANS[plan].features[feature];
}

interface WorkspaceState {
  workspaceName: string;
  plan: WorkspacePlan;
  role: WorkspaceRole;
  members: WorkspaceMember[];
  setWorkspaceName: (name: string) => void;
  inviteMember: (email: string, role: Exclude<WorkspaceRole, 'owner'>) => boolean;
  removeMember: (memberId: string) => void;
  setMemberRole: (memberId: string, role: Exclude<WorkspaceRole, 'owner'>) => void;
  resetWorkspace: () => void;
}

const DEFAULT_WORKSPACE: Pick<WorkspaceState, 'workspaceName' | 'plan' | 'role' | 'members'> = {
  workspaceName: 'My Farm Workspace',
  plan: 'free',
  role: 'owner',
  members: [
    {
      id: 'owner-local',
      email: 'owner@local.farm',
      name: 'Workspace owner',
      role: 'owner',
      status: 'active',
      invitedAt: Date.now(),
    },
  ],
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_WORKSPACE,
      setWorkspaceName: (name) => {
        const trimmed = name.trim();
        if (trimmed) set({ workspaceName: trimmed.slice(0, 80) });
      },
      inviteMember: (email, role) => {
        const normalizedEmail = email.trim().toLowerCase();
        const state = get();
        const policy = WORKSPACE_PLANS[state.plan];
        if (!policy.features.teamCollaboration || !normalizedEmail || !normalizedEmail.includes('@')) return false;
        if (state.members.length >= policy.maxMembers) return false;
        if (state.members.some(member => member.email === normalizedEmail)) return false;
        set({
          members: [
            ...state.members,
            {
              id: `member-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              email: normalizedEmail,
              name: normalizedEmail.split('@')[0] || 'Invited member',
              role,
              status: 'pending',
              invitedAt: Date.now(),
            },
          ],
        });
        return true;
      },
      removeMember: (memberId) => set(state => ({ members: state.members.filter(member => member.id !== memberId || member.role === 'owner') })),
      setMemberRole: (memberId, role) => set(state => ({
        members: state.members.map(member => member.id === memberId && member.role !== 'owner' ? { ...member, role } : member),
      })),
      resetWorkspace: () => set(DEFAULT_WORKSPACE),
    }),
    { name: 'agri-atlas-workspace', version: 1 },
  ),
);
