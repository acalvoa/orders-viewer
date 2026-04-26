import { Skeleton } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ProductionOrder } from '@repo/shared';

export const SKELETON_COLUMNS: ColumnsType<ProductionOrder> = [
  { key: 'reference', title: 'Referencia', render: () => <Skeleton.Input active size="small" /> },
  { key: 'product', title: 'Producto', render: () => <Skeleton.Input active size="small" /> },
  { key: 'quantity',title: 'Cantidad', width: 50, align: 'right', render: () => <Skeleton.Input active size="small" /> },
  { key: 'startDate', title: 'Inicio', render: () => <Skeleton.Input active size="small" /> },
  { key: 'endDate', title: 'Fin', render: () => <Skeleton.Input active size="small" /> },
  { key: 'status', title: 'Estado', render: () => <Skeleton.Button active size="small" shape="round" /> },
  { key: 'createdAt', title: 'Creado', render: () => <Skeleton.Input active size="small" /> },
  { key: 'actions', title: 'Acciones',  width: 100, align: 'center', render: () => <Skeleton.Input active size="small" /> },
];
