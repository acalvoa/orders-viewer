import { memo } from 'react';
import { Button } from 'antd';
import { InboxOutlined, PlusOutlined } from '@ant-design/icons';

interface Props {
  onNewOrder: () => void;
}

export default memo(function EmptyOrders({ onNewOrder }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <InboxOutlined className="text-[64px] text-[#c8d4e8] mb-4" />
      <h2 className="text-lg font-semibold text-[#001450] mb-1 m-0">
        No hay órdenes de producción
      </h2>
      <p className="text-sm text-[#8C8C8C] mb-6 text-center">
        Crea tu primera orden para empezar a gestionar la producción.
      </p>
      <Button type="primary" icon={<PlusOutlined />} onClick={onNewOrder}>
        Nueva Orden
      </Button>
    </div>
  );
});
