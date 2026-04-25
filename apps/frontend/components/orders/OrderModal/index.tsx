'use client';

import { useEffect, useState, useCallback } from 'react';
import { Modal, Form, Button } from 'antd';
import dayjs from 'dayjs';
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
  const [, forceUpdate] = useState(0);

  const requiredFields = ['reference', 'product', 'quantity', 'startDate', 'endDate'] as const;

  const isSubmitDisabled =
    !modalOpen ||
    submitting ||
    loading ||
    form.getFieldsError().some(({ errors }) => errors.length > 0) ||
    requiredFields.some(f => {
      const val = form.getFieldValue(f);
      return val === undefined || val === null || val === '';
    });

  const handleFieldsChange = useCallback(() => forceUpdate(n => n + 1), []);

  useEffect(() => {
    if (!modalOpen) return;
    if (editingOrder) {
      form.setFieldsValue({
        reference: editingOrder.reference,
        product: editingOrder.product,
        quantity: editingOrder.quantity,
        startDate: dayjs(editingOrder.startDate),
        endDate: dayjs(editingOrder.endDate),
        status: editingOrder.status,
      });
    } else {
      form.resetFields();
      form.setFieldValue('status', 'planned');
    }
    forceUpdate(n => n + 1);
  }, [modalOpen, editingOrder, form]);

  const onFinish = (values: FormValues) => {
    onSubmit({
      reference: values.reference,
      product: values.product,
      quantity: values.quantity,
      startDate: values.startDate.format('YYYY-MM-DDTHH:mm:ss'),
      endDate: values.endDate.format('YYYY-MM-DDTHH:mm:ss'),
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
      footer={[
        <Button key="cancel" onClick={closeModal} disabled={submitting || loading}>
          Cancelar
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={submitting || loading}
          disabled={isSubmitDisabled}
          onClick={() => {
            setSubmitting(true);
            form.submit();
          }}
        >
          {editingOrder ? 'Guardar cambios' : 'Crear Orden'}
        </Button>,
      ]}
    >
      <OrderForm form={form} onFinish={onFinish} onFieldsChange={handleFieldsChange} />
    </Modal>
  );
}
