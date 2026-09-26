import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../common/Modal';
import { ROLES, ROLE_DEFINITIONS } from '../../services/rbacService';
import { UserPlus, Shield, Building, MapPin, Mail, DollarSign } from 'lucide-react';

/**
 * UserManagementModal Component
 * Modal for creating and managing institutional users and assigning RBAC roles and scopes.
 */
export const UserManagementModal = ({ isOpen, onClose, onSaveUser }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'district',
    roleName: 'District Magistrate & District Authority',
    constituency: '',
    state: 'Uttar Pradesh',
    district: 'Varanasi',
    allocatedBudget: 250000000,
    jurisdiction: '',
  });

  const handleRoleChange = (selectedRole) => {
    const roleMeta = {
      mp: { roleName: 'Member of Parliament (Lok Sabha)', jurisdiction: `${formData.constituency || 'Varanasi'} Constituency` },
      district: { roleName: 'District Magistrate & District Authority', jurisdiction: `${formData.district || 'Varanasi'} District` },
      state: { roleName: 'Principal Secretary & State Nodal Officer', jurisdiction: `State of ${formData.state || 'Uttar Pradesh'}` },
      ministry: { roleName: 'Joint Secretary (MPLADS), MoSPI', jurisdiction: 'Pan-India Nationwide' },
      admin: { roleName: 'System Administrator', jurisdiction: 'System-wide' },
    };

    const currentMeta = roleMeta[selectedRole] || roleMeta.district;
    setFormData((prev) => ({
      ...prev,
      role: selectedRole,
      roleName: currentMeta.roleName,
      jurisdiction: currentMeta.jurisdiction,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    let computedJurisdiction = formData.jurisdiction;
    if (!computedJurisdiction) {
      if (formData.role === 'mp') computedJurisdiction = `${formData.constituency || 'Custom'} Constituency`;
      else if (formData.role === 'district') computedJurisdiction = `${formData.district || 'Custom'} District`;
      else if (formData.role === 'state') computedJurisdiction = `State of ${formData.state || 'Custom'}`;
      else computedJurisdiction = 'Pan-India Nationwide';
    }

    onSaveUser({
      ...formData,
      jurisdiction: computedJurisdiction,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register Institutional Authority & Role"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              Full Name & Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Smt. Neha Sharma, IAS"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              Official Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="e.g. neha.sharma@gov.in"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
            Institutional Role & Security Scope *
          </label>
          <select
            value={formData.role}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium"
          >
            <option value={ROLES.MP}>Member of Parliament (MP) — Constituency Scope Only</option>
            <option value={ROLES.DISTRICT}>District Authority / DM — District Scope Only</option>
            <option value={ROLES.STATE}>State Nodal Authority (SNA) — State Scope Only</option>
            <option value={ROLES.MINISTRY}>Ministry / MoSPI Apex Officer — Pan-India Access</option>
            <option value={ROLES.ADMIN}>System Administrator — User & Governance Access</option>
          </select>
        </div>

        {/* Dynamic Scope Inputs */}
        <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-3">
          <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            <span>Jurisdiction Scope Binding</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                State
              </label>
              <input
                type="text"
                placeholder="e.g. Uttar Pradesh, Maharashtra, Bihar"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                District / Constituency
              </label>
              <input
                type="text"
                placeholder="e.g. Varanasi, Patna, Pune"
                value={formData.district}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    district: e.target.value,
                    constituency: e.target.value,
                  })
                }
                className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-gov-blue hover:bg-blue-700 text-white font-bold shadow-md flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create & Issue Credentials</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

UserManagementModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSaveUser: PropTypes.func.isRequired,
};

export default UserManagementModal;
