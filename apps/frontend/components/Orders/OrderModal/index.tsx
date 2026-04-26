'use client';

import { useEffect } from 'react';
import { Modal, Form } from 'antd';
import dayjs from '@/lib/dayjs';
import type { CreateProductionOrderDto } from '@repo/shared';
import { useOrdersStore } from '@/stores/orders.store';
import OrderForm, { type FormValues } from '../OrderForm';

interface Props {
  loading: boolean;
  onSubmit: (data: CreateProductionOrderDto) => void;
}

export default function OrderModal({ loading, onSubmit }: Props) {
  const { modalOpen, editingOrder, closeModal, submitting, setSubmitting } = useOrdersStore();
  const [form] = Form.useForm<FormValues>();

  useEffect(() => {
    if (!modalOpen) return;
    if (editingOrder) {
      form.setFieldsValue({
        reference: editingOrder.reference,
        product: editingOrder.product,
        quantity: editingOrder.quantity,
        startDate: dayjs.utc(editingOrder.startDate).local(),
        endDate: dayjs.utc(editingOrder.endDate).local(),
        status: editingOrder.status,
      });
    } else {
      form.resetFields();
      form.setFieldValue('status', 'planned');
    }
  }, [modalOpen, editingOrder, form]);

  const onFinish = (values: FormValues) => {
    onSubmit({
      reference: values.reference,
      product: values.product,
      quantity: values.quantity,
      startDate: values.startDate.utc().format('YYYY-MM-DDTHH:mm:ss'),
      endDate: values.endDate.utc().format('YYYY-MM-DDTHH:mm:ss'),
      status: values.status,
    });
  };

  return (
    <Modal
      title={
        <div className="pt-1">
          <p className="text-base font-semibold text-[#001450] m-0">
            {editingOrder ? 'Editar Orden' : 'Nueva Orden de Producción'}
          </p>
          <p className="text-xs text-[#8C8C8C] font-normal mt-0.5 m-0">
            {editingOrder ? `Modificando ${editingOrder.reference}` : 'Completa los datos para registrar la orden'}
          </p>
        </div>
      }
      open={modalOpen}
      onCancel={closeModal}
      width={620}
      footer={null}
    >
      <OrderForm
        form={form}
        onFinish={onFinish}
        onCancel={closeModal}
        onSubmitClick={() => { setSubmitting(true); form.submit(); }}
        submitting={submitting}
        loading={loading}
        isEditing={!!editingOrder}
      />
    </Modal>
  );
}
