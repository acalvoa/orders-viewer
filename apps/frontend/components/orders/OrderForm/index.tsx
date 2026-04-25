import { Form, Input, InputNumber, DatePicker, Select, Row, Col } from 'antd';
import type { FormInstance } from 'antd';
import dayjs from 'dayjs';
import { ProductionOrderStatus } from '@repo/shared';

const STATUS_OPTIONS: { value: ProductionOrderStatus; label: string }[] = [
  { value: ProductionOrderStatus.PLANNED,     label: 'Planificada' },
  { value: ProductionOrderStatus.SCHEDULED,   label: 'Programada' },
  { value: ProductionOrderStatus.IN_PROGRESS, label: 'En Progreso' },
  { value: ProductionOrderStatus.COMPLETED,   label: 'Completada' },
];

export interface FormValues {
  reference: string;
  product: string;
  quantity: number;
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
  status: ProductionOrderStatus;
}

interface Props {
  form: FormInstance<FormValues>;
  onFinish: (values: FormValues) => void;
  onFieldsChange?: () => void;
}

export default function OrderForm({ form, onFinish, onFieldsChange }: Props) {
  return (
    <Form form={form} layout="vertical" onFinish={onFinish} onFieldsChange={onFieldsChange} className="mt-5">
      <Form.Item
        label="Referencia"
        name="reference"
        rules={[{ required: true, message: 'La referencia es obligatoria' }]}
      >
        <Input placeholder="ej. ORD-001" />
      </Form.Item>

      <Form.Item
        label="Producto"
        name="product"
        rules={[{ required: true, message: 'El producto es obligatorio' }]}
      >
        <Input placeholder="ej. Widget Alpha" />
      </Form.Item>

      <Form.Item
        label="Cantidad"
        name="quantity"
        rules={[{ required: true, type: 'number', min: 1, message: 'Debe ser un entero positivo' }]}
      >
        <InputNumber min={1} className="!w-full" />
      </Form.Item>

      <Form.Item label="Estado" name="status" initialValue="planned">
        <Select options={STATUS_OPTIONS} />
      </Form.Item>

      <div className="bg-[#F9FBFF] border border-[#E8EEFA] rounded-lg px-4 pt-4 pb-1 mb-4">
        <p className="text-[11px] font-semibold text-[#8C8C8C] uppercase tracking-[0.5px] mb-3 m-0">
          Período de producción
        </p>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Inicio"
              name="startDate"
              rules={[{ required: true, message: 'Selecciona fecha y hora de inicio' }]}
            >
              <DatePicker showTime={{ format: 'HH:mm' }} format="DD/MM/YYYY HH:mm" className="!w-full" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Fin"
              name="endDate"
              dependencies={['startDate']}
              rules={[
                { required: true, message: 'Selecciona fecha y hora de fin' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const start = getFieldValue('startDate') as dayjs.Dayjs | undefined;
                    if (!value || !start || value.isAfter(start)) return Promise.resolve();
                    return Promise.reject(new Error('Debe ser posterior al inicio'));
                  },
                }),
              ]}
            >
              <DatePicker showTime={{ format: 'HH:mm' }} format="DD/MM/YYYY HH:mm" className="!w-full" />
            </Form.Item>
          </Col>
        </Row>
      </div>
    </Form>
  );
}
