import { useState, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useERPStore } from '../../core/store';
import { useToast } from '../../shared/hooks/useToast';
import type { Customer } from '../../core/types';
import { syncCustomer } from '../../core/supabase';

const EMPTY_FORM = { name: '', phone: '', address: '', credit: false };

export const useCustomers = () => {
  const { customers, setCustomers } = useERPStore(
    useShallow(s => ({ customers: s.customers, setCustomers: s.setCustomers }))
  );
  const showToast = useToast();

  const [addModal, setAddModal] = useState(false);
  const [payModal, setPayModal] = useState<Customer | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [payAmt, setPayAmt] = useState('');

  const isKanchi = form.name.toLowerCase().includes('kanchi');

  const setField = useCallback(
    (k: keyof typeof EMPTY_FORM, v: string | boolean) =>
      setForm(p => ({ ...p, [k]: v })),
    []
  );

  const openAdd = useCallback(() => {
    setForm(EMPTY_FORM);
    setAddModal(true);
  }, []);
  const closeAdd = useCallback(() => {
    setAddModal(false);
    setForm(EMPTY_FORM);
  }, []);
  const openCollect = useCallback((c: Customer) => {
    setPayModal(c);
    setPayAmt('');
  }, []);
  const closeCollect = useCallback(() => {
    setPayModal(null);
    setPayAmt('');
  }, []);

  const addCustomer = useCallback(() => {
    if (!form.name.trim()) {
      showToast('Name is required', 'error');
      return;
    }
    const newC: Customer = {
      id: crypto.randomUUID(),
      ...form,
      credit: isKanchi || form.credit,
      outstanding: 0,
      joinDate: new Date().toISOString().slice(0, 10),
      ledger: [],
    };
    setCustomers(p => [...p, newC]);
    syncCustomer(newC);
    closeAdd();
    showToast('Customer added');
  }, [form, isKanchi, setCustomers, closeAdd, showToast]);

  const recordPayment = useCallback(() => {
    if (!payModal) return;
    if (!payAmt || +payAmt <= 0) {
      showToast('Enter a valid amount', 'error');
      return;
    }
    setCustomers(p => {
      const updated = p.map(c => {
        if (c.id !== payModal!.id) return c;
        const next = {
          ...c,
          outstanding: Math.max(0, c.outstanding - +payAmt),
        };
        syncCustomer(next);
        return next;
      });
      return updated;
    });
    closeCollect();
    showToast('Payment recorded');
  }, [payModal, payAmt, setCustomers, closeCollect, showToast]);

  return {
    customers,
    addModal,
    openAdd,
    closeAdd,
    form,
    setField,
    isKanchi,
    addCustomer,
    payModal,
    openCollect,
    closeCollect,
    payAmt,
    setPayAmt,
    recordPayment,
  };
};
