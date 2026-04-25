'use client';

import { memo, useCallback, useMemo } from 'react';
import { App, Table } from 'antd';
import type { ProductionOrder } from '@repo/shared';
import { buildColumns } from './columns';
import { SKELETON_COLUMNS } from './Skeleton';

interface Props {
  orders: ProductionOrder[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  onEdit: (order: ProductionOrder) => void;
  onDelete: (id: string) => void;
  deletingId?: string;
  editingId?: string;
}

function OrdersTable({
  orders,
  loading,
  total,
  page,
  pageSize,
  onPageChange,
  onEdit,
  onDelete,
  deletingId,
  editingId,
}: Props) {
  const { modal } = App.useApp();

  const handleDeleteConfirm = useCallback((order: ProductionOrder) => {
    modal.confirm({
      title: '¿Eliminar orden?',
      content: `La orden "${order.reference}" será eliminada permanentemente.`,
      okText: 'Eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: () => onDelete(order.id),
    });
  }, [modal, onDelete]);

  const columns = useMemo(
    () => loading ? SKELETON_COLUMNS : buildColumns(onEdit, handleDeleteConfirm, deletingId, editingId),
    [loading, onEdit, handleDeleteConfirm, deletingId, editingId],
  );

  const skeletonData = useMemo(
    () => Array.from({ length: pageSize }, (_, i) => ({ id: `sk-${i}` } as ProductionOrder)),
    [pageSize],
  );

  return (
    <div className="px-6 pb-6">
      <Table
        rowKey="id"
        columns={columns}
        dataSource={loading ? skeletonData : orders}
        loading={false}
        size="middle"
        className="!bg-white !rounded-lg"
        pagination={{
          current: page,
          pageSize,
          total,
          pageSizeOptions: [10, 20, 50],
          showSizeChanger: true,
          showTotal: (t) => `${t} órdenes`,
          onChange: onPageChange,
        }}
      />
    </div>
  );
}

export default memo(OrdersTable);
