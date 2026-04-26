import { Button, Space, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { ProductionOrder, ProductionOrderStatus } from '@repo/shared';
import StatusTag from '@/components/Orders/StatusTag';
import { fmtDt } from '@/utils/format';

export function buildColumns(
  onEdit: (order: ProductionOrder) => void,
  onDeleteConfirm: (order: ProductionOrder) => void,
  deletingId?: string,
  editingId?: string,
): ColumnsType<ProductionOrder> {
  const anyDeleting = !!deletingId;

  return [
    {
      title: 'Referencia',
      dataIndex: 'reference',
      key: 'reference',
      render: (v: string) => <strong className="text-[#001450]">{v}</strong>,
    },
    { title: 'Producto', dataIndex: 'product', key: 'product' },
    { title: 'Cantidad', dataIndex: 'quantity', key: 'quantity', align: 'right' },
    { title: 'Inicio', dataIndex: 'startDate', key: 'startDate', render: fmtDt },
    { title: 'Fin', dataIndex: 'endDate', key: 'endDate', render: fmtDt },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status: ProductionOrderStatus) => <StatusTag status={status} />,
    },
    { title: 'Creado', dataIndex: 'createdAt', key: 'createdAt', render: fmtDt },
    {
      title: 'Acciones',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const isDeleting = record.id === deletingId;
        const isEditing = record.id === editingId;

        return (
          <Space size={4}>
            <Tooltip title="Editar">
              <Button
                type="text"
                size="small"
                loading={isEditing}
                icon={!isEditing && <EditOutlined className="text-[#116DFF]" />}
                onClick={(e) => { e.stopPropagation(); onEdit(record); }}
                disabled={anyDeleting || isEditing}
              />
            </Tooltip>
            <Tooltip title="Eliminar">
              <Button
                type="text"
                size="small"
                danger
                loading={isDeleting}
                icon={!isDeleting && <DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!anyDeleting) onDeleteConfirm(record);
                }}
                disabled={anyDeleting && !isDeleting}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];
}
