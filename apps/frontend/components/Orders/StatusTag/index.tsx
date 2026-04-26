import { Tag } from 'antd';
import type { ProductionOrderStatus } from '@repo/shared';

const CLASSES: Record<ProductionOrderStatus, string> = {
  planned:     '!bg-[#EFF4FF] !text-[#1341CA] !font-medium',
  scheduled:   '!bg-[#E6F7FF] !text-[#0958d9] !font-medium',
  in_progress: '!bg-[#F0F3FF] !text-[#275BF3] !font-medium',
  completed:   '!bg-[#F0FFF4] !text-[#0E5B40] !font-medium',
};

const LABEL: Record<ProductionOrderStatus, string> = {
  planned:     'Planificada',
  scheduled:   'Programada',
  in_progress: 'En Progreso',
  completed:   'Completada',
};

export default function StatusTag({ status }: { status: ProductionOrderStatus }) {
  return (
    <Tag variant="filled" className={CLASSES[status]}>
      {LABEL[status]}
    </Tag>
  );
}
