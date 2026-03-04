import { useState, useMemo, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useERPStore } from '../../core/store';
import { useToast } from '../../shared/hooks/useToast';
import { syncStaffMember } from '../../core/supabase';
import { hashPassword } from '../../core/crypto';
import type { Role, StaffUser } from '../../core/types';

const ROLES: Role[] = ['Admin', 'Staff', 'Viewer'];

const EMPTY_FORM = { name: '', u: '', p: '', role: 'Staff' as Role };

export const useStaff = () => {
  const { staff, setStaff } = useERPStore(
    useShallow(s => ({ staff: s.staff, setStaff: s.setStaff }))
  );
  const showToast = useToast();

  // ── Modal state ───────────────────────────────────────────
  const [addModal, setAddModal] = useState(false);
  const [editMember, setEditMember] = useState<StaffUser | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPwd, setShowPwd] = useState(false);
  const [editRoleId, setEditRoleId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<Role>('Staff');

  const setField = useCallback(
    (k: keyof typeof EMPTY_FORM, v: string) => setForm(p => ({ ...p, [k]: v })),
    []
  );

  // ── Derived ───────────────────────────────────────────────
  const activeCount = useMemo(
    () => staff.filter(s => s.active).length,
    [staff]
  );
  const byRole = useCallback(
    (role: Role) => staff.filter(s => s.role === role).length,
    [staff]
  );

  // ── Open / close helpers ──────────────────────────────────
  const openAdd = useCallback(() => {
    setForm(EMPTY_FORM);
    setShowPwd(false);
    setAddModal(true);
  }, []);

  const closeAdd = useCallback(() => {
    setAddModal(false);
    setForm(EMPTY_FORM);
  }, []);

  const openEditRole = useCallback((member: StaffUser) => {
    setEditMember(member);
    setNewRole(member.role);
    setEditRoleId(member.id);
  }, []);

  const closeEditRole = useCallback(() => {
    setEditMember(null);
    setEditRoleId(null);
  }, []);

  // ── Add staff member (async — hashes password before storing) ────────
  const addStaff = useCallback(async () => {
    if (!form.name.trim()) {
      showToast('Name is required', 'error');
      return;
    }
    if (!form.u.trim()) {
      showToast('Username is required', 'error');
      return;
    }
    if (form.p.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }

    const duplicate = staff.find(
      s => s.u.toLowerCase() === form.u.toLowerCase()
    );
    if (duplicate) {
      showToast('Username already exists', 'error');
      return;
    }

    const hashed = await hashPassword(form.p); // ← SHA-256 hash

    const member: StaffUser = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      u: form.u.trim().toLowerCase(),
      p: hashed, // ← store hash, never plain-text
      role: form.role,
      active: true,
      createdAt: Date.now(),
    };

    setStaff(p => [...p, member]);
    syncStaffMember(member); // ← sync hash to Supabase
    closeAdd();
    showToast(`${member.name} added`);
  }, [form, staff, setStaff, closeAdd, showToast]);

  // ── Save role change ──────────────────────────────────────
  const saveRole = useCallback(() => {
    if (!editRoleId) return;
    setStaff(p => {
      const updated = p.map(s =>
        s.id === editRoleId ? { ...s, role: newRole } : s
      );
      const changed = updated.find(s => s.id === editRoleId);
      if (changed) syncStaffMember(changed);
      return updated;
    });
    closeEditRole();
    showToast('Role updated');
  }, [editRoleId, newRole, setStaff, closeEditRole, showToast]);

  // ── Toggle active/inactive ────────────────────────────────
  const toggleActive = useCallback(
    (id: string) => {
      setStaff(p => {
        const updated = p.map(s =>
          s.id === id ? { ...s, active: !s.active } : s
        );
        const changed = updated.find(s => s.id === id);
        if (changed) syncStaffMember(changed);
        return updated;
      });
    },
    [setStaff]
  );

  // ── Reset password (async — hashes new password before storing) ──────
  const [resetModal, setResetModal] = useState(false);
  const [resetTarget, setResetTarget] = useState<StaffUser | null>(null);
  const [resetPwd, setResetPwd] = useState('');

  const openReset = useCallback((member: StaffUser) => {
    setResetTarget(member);
    setResetPwd('');
    setResetModal(true);
  }, []);

  const saveReset = useCallback(async () => {
    if (!resetTarget) return;
    if (resetPwd.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }

    const hashed = await hashPassword(resetPwd); // ← SHA-256 hash

    setStaff(p => {
      const updated = p.map(s =>
        s.id === resetTarget.id ? { ...s, p: hashed } : s
      );
      const changed = updated.find(s => s.id === resetTarget.id);
      if (changed) syncStaffMember(changed); // ← sync new hash to Supabase
      return updated;
    });
    setResetModal(false);
    setResetTarget(null);
    showToast('Password reset');
  }, [resetTarget, resetPwd, setStaff, showToast]);

  return {
    staff,
    activeCount,
    byRole,
    ROLES,
    // add modal
    addModal,
    openAdd,
    closeAdd,
    form,
    setField,
    showPwd,
    setShowPwd,
    addStaff,
    // edit role modal
    editMember,
    editRoleId,
    newRole,
    setNewRole,
    openEditRole,
    closeEditRole,
    saveRole,
    // toggle
    toggleActive,
    // reset password
    resetModal,
    resetTarget,
    resetPwd,
    setResetPwd,
    openReset,
    saveReset,
    setResetModal,
  };
};
