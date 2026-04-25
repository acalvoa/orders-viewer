'use client';

import { useState, useCallback, useMemo } from 'react';
import { App } from 'antd';
import type { CreateProductionOrderDto } from '@repo/shared';
import { useOrders } from '@/hooks/useOrders';
import { useCreateOrder } from '@/hooks/useCreateOrder';
import { useUpdateOrder } from '@/hooks/useUpdateOrder';
import { useDeleteOrder } from '@/hooks/useDeleteOrder';
import { useRescheduleConflicts } from '@/hooks/useRescheduleConflicts';
import { useSimulateReschedule } from '@/hooks/useSimulateReschedule';
import { useConflictsCount } from '@/hooks/useConflictsCount';
import { useOrderStats } from '@/hooks/useOrderStats';
import { useOrdersStore } from '@/stores/orders.store';
import OrdersHeader from '../OrdersHeader';
import StatsStrip from '../StatsStrip';
import OrdersTable from '../OrdersTable';
import OrderModal from '../OrderModal';
import RescheduleModal from '../RescheduleModal';
import EmptyOrders from '../EmptyOrders';
import ErrorOrders from '../ErrorOrders';

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : 'Ocurrió un error inesperado';
}

export default function OrdersPage() {
  const { message, notification } = App.useApp();
  const { openCreate, openEdit, closeModal, setSubmitting } = useOrdersStore();
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data: paginatedData, isLoading, isError, error, refetch } = useOrders({ page, size: pageSize });
  const orders = useMemo(() => paginatedData?.data ?? [], [paginatedData]);
  const total = paginatedData?.total ?? 0;

  const handlePageChange = useCallback((newPage: number, newSize: number) => {
    setPage(newPage);
    setPageSize(newSize);
  }, []);

  const createMutation = useCreateOrder();
  const updateMutation = useUpdateOrder();
  const deleteMutation = useDeleteOrder();
  const rescheduleMutation = useRescheduleConflicts();
  const simulateQuery = useSimulateReschedule();
  const { data: conflictsCount, isLoading: conflictsLoading } = useConflictsCount();
  const { data: stats, isLoading: statsLoading } = useOrderStats();

  const handleSubmit = useCallback(
    (data: CreateProductionOrderDto) => {
      const { editingOrder } = useOrdersStore.getState();
      if (editingOrder) {
        updateMutation.mutate(
          { id: editingOrder.id, data },
          {
            onSuccess: () => { message.success('Orden actualizada'); closeModal(); },
            onError: (err) => {
              notification.error({ message: 'Error al guardar la orden', description: errMsg(err) });
              setSubmitting(false);
            },
          },
        );
      } else {
        createMutation.mutate(data, {
          onSuccess: () => { message.success('Orden creada'); closeModal(); },
          onError: (err) => {
            notification.error({ message: 'Error al crear la orden', description: errMsg(err) });
            setSubmitting(false);
          },
        });
      }
    },
    [createMutation, updateMutation, message, notification, closeModal, setSubmitting],
  );

  const handleDelete = useCallback((id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => message.success('Orden eliminada'),
      onError: (err) => notification.error({ message: 'Error al eliminar la orden', description: errMsg(err) }),
    });
  }, [deleteMutation, message, notification]);

  const handleRescheduleClick = useCallback(async () => {
    const result = await simulateQuery.refetch();
    if (result.error) {
      notification.error({ message: 'Error al simular el reordenamiento', description: errMsg(result.error) });
      return;
    }
    if (!result.data || result.data.length === 0) {
      message.info('No hay conflictos que resolver');
      return;
    }
    setRescheduleModalOpen(true);
  }, [simulateQuery, notification, message]);

  const handleRescheduleConfirm = useCallback(() => {
    rescheduleMutation.mutate(undefined, {
      onSuccess: (result) => {
        message.success(`${result.rescheduled} orden(es) reprogramada(s)`);
        setRescheduleModalOpen(false);
      },
      onError: (err) => notification.error({ message: 'Error al reprogramar', description: errMsg(err) }),
    });
  }, [rescheduleMutation, message, notification]);

  const proposals = useMemo(() => simulateQuery.data ?? [], [simulateQuery.data]);

  const isEmpty = !isLoading && !isError && total === 0;

  return (
    <div>
      <OrdersHeader
        orderCount={total}
        loading={isLoading}
        rescheduling={simulateQuery.isFetching || rescheduleMutation.isPending}
        onReschedule={handleRescheduleClick}
        onNewOrder={openCreate}
      />

      {isError ? (
        <ErrorOrders error={error} onRetry={() => refetch()} />
      ) : isEmpty ? (
        <EmptyOrders onNewOrder={openCreate} />
      ) : (
        <>
          <StatsStrip
            total={stats?.total ?? 0}
            planned={stats?.planned ?? 0}
            inProgress={stats?.inProgress ?? 0}
            loading={isLoading || statsLoading}
            conflictsCount={conflictsCount}
            conflictsLoading={conflictsLoading}
          />
          <OrdersTable
            orders={orders}
            loading={isLoading}
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onEdit={openEdit}
            onDelete={handleDelete}
            deletingId={deleteMutation.isPending ? deleteMutation.variables : undefined}
            editingId={updateMutation.isPending ? updateMutation.variables?.id : undefined}
          />
        </>
      )}

      <OrderModal
        loading={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmit}
      />

      <RescheduleModal
        open={rescheduleModalOpen}
        proposals={proposals}
        applying={rescheduleMutation.isPending}
        onConfirm={handleRescheduleConfirm}
        onClose={() => setRescheduleModalOpen(false)}
      />
    </div>
  );
}
