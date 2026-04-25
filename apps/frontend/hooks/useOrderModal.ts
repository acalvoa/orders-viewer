import { useState, useCallback } from 'react';
import type { ProductionOrder } from '@repo/shared';

export function useOrderModal() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ProductionOrder | null>(null);

  const openCreate = useCallback(() => {
    setEditingOrder(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((order: ProductionOrder) => {
    setEditingOrder(order);
    setModalOpen(true);
  }, []);

  const close = useCallback(() => {
    setModalOpen(false);
    setEditingOrder(null);
  }, []);

  return { modalOpen, editingOrder, openCreate, openEdit, close };
}
