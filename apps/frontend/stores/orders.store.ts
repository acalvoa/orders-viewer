import { create } from 'zustand';
import type { ProductionOrder } from '@repo/shared';

interface OrdersStore {
  modalOpen: boolean;
  editingOrder: ProductionOrder | null;
  submitting: boolean;
  openCreate: () => void;
  openEdit: (order: ProductionOrder) => void;
  closeModal: () => void;
  setSubmitting: (v: boolean) => void;
}

export const useOrdersStore = create<OrdersStore>((set) => ({
  modalOpen: false,
  editingOrder: null,
  submitting: false,
  openCreate: () => set({ modalOpen: true, editingOrder: null }),
  openEdit: (order) => set({ modalOpen: true, editingOrder: order }),
  closeModal: () => set({ modalOpen: false, editingOrder: null, submitting: false }),
  setSubmitting: (v) => set({ submitting: v }),
}));
