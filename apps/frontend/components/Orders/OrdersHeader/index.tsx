import { memo } from 'react';
import { Button, Flex } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import OrdersHeaderSkeleton from './Skeleton';

interface Props {
  orderCount: number;
  loading?: boolean;
  rescheduling: boolean;
  onReschedule: () => void;
  onNewOrder: () => void;
}

export default memo(function OrdersHeader({ orderCount, loading, rescheduling, onReschedule, onNewOrder }: Props) {
  return (
    <div className="bg-white border-b border-[#e8edf5] px-6 py-3">
      <Flex justify="space-between" align="center">
        <div>
          <div className="text-[18px] font-bold text-[#001450]">
            Órdenes de Producción
          </div>
          {loading ? (
            <OrdersHeaderSkeleton />
          ) : (
            <div className="text-xs text-[#8C8C8C] mt-0.5">
              {orderCount} orden{orderCount !== 1 ? 'es' : ''} en total
            </div>
          )}
        </div>
        <Flex gap={8}>
          <Button
            icon={<ReloadOutlined />}
            loading={rescheduling}
            onClick={onReschedule}
            className="!border-[#116DFF] !text-[#116DFF]"
          >
            Resolver Conflictos
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={onNewOrder}>
            Nueva Orden
          </Button>
        </Flex>
      </Flex>
    </div>
  );
});
