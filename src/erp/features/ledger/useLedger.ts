import { useState, useMemo, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useERPStore } from '../../core/store';
import { useToast }    from '../../shared/hooks/useToast';
import type { LedgerEntry } from '../../core/types';
import { syncCustomer } from '../../core/supabase';

const EMPTY_ENTRY = {
  type:        'DEBIT' as 'DEBIT' | 'CREDIT',
  date:        new Date().toISOString().slice(0, 10),
  amount:      '',
  description: '',
};

export const useLedger = () => {
  const { customers, setCustomers } = useERPStore(
    useShallow(s => ({ customers: s.customers, setCustomers: s.setCustomers })),
  );
  const showToast = useToast();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [entryModal, setEntryModal]  = useState(false);
  const [entryForm,  setEntryForm]   = useState(EMPTY_ENTRY);

  const setEntry = useCallback(
    (k: keyof typeof EMPTY_ENTRY, v: string) =>
      setEntryForm(p => ({ ...p, [k]: v })),
    [],
  );

  const creditCustomers = useMemo(() => customers.filter(c => c.credit), [customers]);
  const totalOutstanding = useMemo(() => creditCustomers.reduce((s, c) => s + c.outstanding, 0), [creditCustomers]);
  const selectedCustomer = useMemo(() => customers.find(c => c.id === selectedId) ?? null, [customers, selectedId]);

  const openDebit  = useCallback(() => { setEntryForm({ ...EMPTY_ENTRY, type: 'DEBIT'  }); setEntryModal(true); }, []);
  const openCredit = useCallback(() => { setEntryForm({ ...EMPTY_ENTRY, type: 'CREDIT' }); setEntryModal(true); }, []);
  const closeEntry = useCallback(() => { setEntryModal(false); setEntryForm(EMPTY_ENTRY); }, []);

  const addEntry = useCallback(() => {
    if (!entryForm.amount || +entryForm.amount <= 0) { showToast('Enter a valid amount', 'error'); return; }
    if (!selectedId) return;

    const amt = +entryForm.amount;

    setCustomers(prev =>
      prev.map(c => {
        if (c.id !== selectedId) return c;
        const ledger  = c.ledger ?? [];
        const prevBal = ledger.length > 0 ? ledger[ledger.length - 1].balance : 0;
        const balance = entryForm.type === 'DEBIT' ? prevBal + amt : Math.max(0, prevBal - amt);
        const newEntry: LedgerEntry = {
          id:          crypto.randomUUID(),
          type:        entryForm.type,
          date:        entryForm.date,
          amount:      amt,
          description: entryForm.description,
          balance,
        };
        const outstanding = entryForm.type === 'DEBIT'
          ? c.outstanding + amt
          : Math.max(0, c.outstanding - amt);
        const updated = { ...c, outstanding, ledger: [...ledger, newEntry] };
        syncCustomer(updated);
        return updated;
      }),
    );

    closeEntry();
    showToast(entryForm.type === 'DEBIT' ? 'Debit entry added' : 'Payment recorded');
  }, [entryForm, selectedId, setCustomers, closeEntry, showToast]);

  const previewBalance = useMemo(() => {
    if (!selectedCustomer || !entryForm.amount || +entryForm.amount <= 0) return null;
    return entryForm.type === 'DEBIT'
      ? selectedCustomer.outstanding + +entryForm.amount
      : Math.max(0, selectedCustomer.outstanding - +entryForm.amount);
  }, [selectedCustomer, entryForm]);

  return {
    creditCustomers,
    totalOutstanding,
    selectedCustomer,
    selectedId,
    setSelectedId,
    entryModal,
    entryForm,
    setEntry,
    openDebit,
    openCredit,
    closeEntry,
    addEntry,
    previewBalance,
  };
};
