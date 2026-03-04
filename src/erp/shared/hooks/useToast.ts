import { create } from 'zustand';

// ── Global toast store (not persisted) ───────────────────────
interface ToastStore {
  msg:     string;
  type:    'success' | 'error';
  visible: boolean;
  show:    (msg: string, type?: 'success' | 'error') => void;
  hide:    () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastStore>((set) => ({
  msg:     '',
  type:    'success',
  visible: false,

  show: (msg, type = 'success') => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ msg, type, visible: true });
    toastTimer = setTimeout(() => set({ visible: false }), 2500);
  },

  hide: () => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ visible: false });
  },
}));

/** Call in any component to get the showToast function. */
export const useToast = () => useToastStore((s) => s.show);
