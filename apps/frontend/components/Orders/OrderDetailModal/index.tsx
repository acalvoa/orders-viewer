'use client';

import { Modal, Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import dayjs from '@/lib/dayjs';
import { useOrdersStore } from '@/stores/orders.store';
import StatusTag from '../StatusTag';

export default function OrderDetailModal() {
  const { viewingOrder: order, closeView } = useOrdersStore();

  if (!order) return null;

  const duration = dayjs.utc(order.endDate).diff(dayjs.utc(order.startDate), 'day');

  return (
    <Modal
      open={!!order}
      onCancel={closeView}
      footer={null}
      width={480}
      title={null}
      closable={false}
    >
      <div className="bg-gradient-to-br from-[#F0F5FF] to-[#EFF4FF] rounded-xl p-5 mb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-2xl font-bold text-[#001450] m-0 truncate">{order.reference}</p>
            <p className="text-sm text-[#595959] mt-1 m-0 truncate">{order.product}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusTag status={order.status} />
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={closeView}
              className="text-[#8C8C8C] hover:!text-[#001450] hover:!bg-white/60"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#F9FBFF] border border-[#E8EEFA] rounded-xl p-4 mb-4">
        <p className="text-[11px] font-semibold text-[#8C8C8C] uppercase tracking-[0.5px] mb-4 m-0">
          Período de producción
        </p>
        <div className="flex items-center gap-3">
          <div className="text-center min-w-[80px]">
            <p className="text-[11px] text-[#8C8C8C] mb-1 m-0">Inicio</p>
            <p className="text-sm font-semibold text-[#001450] m-0">
              {dayjs.utc(order.startDate).local().format('DD MMM YYYY')}
            </p>
            <p className="text-xs text-[#595959] mt-0.5 m-0">
              {dayjs.utc(order.startDate).local().format('HH:mm')}
            </p>
          </div>

          <div className="flex flex-1 items-center">
            <div className="flex-1 border-t border-dashed border-[#C5D3F0]" />
            <span className="mx-2 text-[11px] bg-[#EFF4FF] text-[#1341CA] px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap">
              {duration} {duration === 1 ? 'día' : 'días'}
            </span>
            <div className="flex-1 border-t border-dashed border-[#C5D3F0]" />
          </div>

          <div className="text-center min-w-[80px]">
            <p className="text-[11px] text-[#8C8C8C] mb-1 m-0">Fin</p>
            <p className="text-sm font-semibold text-[#001450] m-0">
              {dayjs.utc(order.endDate).local().format('DD MMM YYYY')}
            </p>
            <p className="text-xs text-[#595959] mt-0.5 m-0">
              {dayjs.utc(order.endDate).local().format('HH:mm')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-[#FAFAFA] border border-[#F0F0F0] rounded-lg p-3">
          <p className="text-[11px] text-[#8C8C8C] uppercase tracking-[0.5px] font-semibold mb-1.5 m-0">
            Cantidad
          </p>
          <p className="text-xl font-bold text-[#001450] m-0">
            {order.quantity.toLocaleString()}
            <span className="text-xs font-normal text-[#8C8C8C] ml-1">uds</span>
          </p>
        </div>
        <div className="bg-[#FAFAFA] border border-[#F0F0F0] rounded-lg p-3">
          <p className="text-[11px] text-[#8C8C8C] uppercase tracking-[0.5px] font-semibold mb-1.5 m-0">
            Estado
          </p>
          <StatusTag status={order.status} />
        </div>
      </div>

      <p className="text-xs text-[#BFBFBF] text-center m-0">
        Creada el {dayjs.utc(order.createdAt).local().format('D [de] MMMM [de] YYYY[,] HH:mm')}
      </p>
    </Modal>
  );
}
