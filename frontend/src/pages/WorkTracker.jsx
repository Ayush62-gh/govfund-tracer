import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import WorkKanban from '../components/works/WorkKanban';
import DuplicateDetectionPanel from '../components/works/DuplicateDetectionPanel';
import AssetPhotoVerifier from '../components/works/AssetPhotoVerifier';
import {
  GitBranch,
  Copy,
  Camera,
  Layers,
  Sparkles,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ShieldAlert,
  MapPin,
} from 'lucide-react';
import { PERMISSIONS } from '../services/rbacService';

/**
 * WorkTracker Page Component
 * Kanban execution lifecycle, ML delay likelihood classifier, duplicate detection, and photo verification.
 * Enforces role-based action permissions (only District Authority can certify milestone photos).
 */
export const WorkTracker = () => {
  const { works, showToast, handleVerifyPhoto } = useData();
  const { currentUser, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('kanban'); // 'kanban' | 'duplicates'
  const [verifyingWork, setVerifyingWork] = useState(null);

  const canApproveMilestones = hasPermission(PERMISSIONS.APPROVE_MILESTONES);
  const delayedCount = works.filter((w) => w.stage === 'delayed').length;
  const inProgressCount = works.filter((w) => w.stage === 'inprogress').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
              {currentUser.jurisdiction}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-blue-600" />
            <span>Work Progress & Execution Tracker</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tracking lifecycle milestones, AI-predicted completion delays, spatial duplicate sanctions, and site photos
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('kanban')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'kanban'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Execution Kanban</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('duplicates')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'duplicates'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Copy className="w-4 h-4" />
            <span>Duplicate Detector (AI)</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Authorized Works</div>
            <div className="text-lg font-bold font-display text-slate-900 dark:text-slate-100 font-mono">
              {works.length}
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-500">In Progress</div>
            <div className="text-lg font-bold font-display text-amber-600 font-mono">
              {inProgressCount}
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950 text-red-600">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-500">At Delay Risk</div>
            <div className="text-lg font-bold font-display text-red-600 font-mono">
              {delayedCount}
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Completed</div>
            <div className="text-lg font-bold font-display text-emerald-600 font-mono">
              {works.filter((w) => w.stage === 'completed').length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'kanban' ? (
        <WorkKanban
          works={works}
          onSelectWork={(w) => setVerifyingWork(w)}
          onVerifyPhotos={(w) => {
            if (!canApproveMilestones) {
              showToast('Role Restriction: Only District Authority / DM is authorized to certify physical site milestone inspection.', 'warning');
            }
            setVerifyingWork(w);
          }}
        />
      ) : (
        <DuplicateDetectionPanel
          onEscalateDuplicate={(id) => {
            showToast(`Duplicate incident [${id}] escalated to Vigilance Wing.`);
          }}
        />
      )}

      {/* Asset Photo Verifier Modal */}
      <AssetPhotoVerifier
        work={verifyingWork}
        isOpen={Boolean(verifyingWork)}
        onClose={() => setVerifyingWork(null)}
        onApprove={async (workId) => {
          const success = await handleVerifyPhoto(workId);
          if (success) {
            setVerifyingWork(null);
          }
        }}
      />
    </div>
  );
};

export default WorkTracker;
