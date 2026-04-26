import { memo } from 'react';
import { Button } from 'antd';
import { WarningOutlined, ReloadOutlined } from '@ant-design/icons';

interface Props {
  error: Error | null;
  onRetry: () => void;
}

export default memo(function ErrorOrders({ error, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <WarningOutlined className="text-[64px] text-[#ff4d4f] mb-4" />
      <h2 className="text-lg font-semibold text-[#001450] mb-1 m-0">
        Error al cargar las órdenes
      </h2>
      <p className="text-sm text-[#8C8C8C] mb-6 text-center max-w-sm">
        {error?.message ?? 'Ocurrió un error inesperado. Intenta de nuevo.'}
      </p>
      <Button icon={<ReloadOutlined />} onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  );
});
