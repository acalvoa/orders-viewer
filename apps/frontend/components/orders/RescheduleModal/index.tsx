'use client';

import { useMemo } from 'react';
import { Modal, Button, Typography, Flex } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import type { RescheduleProposal } from '@repo/shared';
import { computeConflictMap } from './utils';
import ProposalCard from './components/ProposalCard';

const { Text } = Typography;

interface Props {
  open: boolean;
  proposals: RescheduleProposal[];
  applying: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function RescheduleModal({ open, proposals, applying, onConfirm, onClose }: Props) {
  const proposalMap = useMemo(() => new Map(proposals.map((p) => [p.id, p])), [proposals]);
  const conflictMap = useMemo(() => computeConflictMap(proposals), [proposals]);
  const count = proposals.length;

  return (
    <Modal
      title={
        <div className="pt-3 pb-2">
          <Flex align="center" gap={8} className="mb-2">
            <WarningOutlined className="text-[#FAAD14]" />
            <Text strong className="text-[#001450] text-base">Resolución de Conflictos</Text>
          </Flex>
          <Text type="secondary" className="text-xs font-normal">
            {count} orden{count !== 1 ? 'es' : ''} con solapamientos detectados
          </Text>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={900}
      classNames={{ body: 'pt-3 pb-0' }}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={applying}>Cancelar</Button>,
        <Button key="confirm" type="primary" loading={applying} onClick={onConfirm}>
          Confirmar {count} orden{count !== 1 ? 'es' : ''}
        </Button>,
      ]}
      destroyOnHidden
    >
      <div className="bg-[#FFFBE6] border border-[#FFE58F] rounded-lg px-4 py-4 mb-5">
        <Text strong className="text-sm text-[#874D00] block mb-1.5">
          {count} orden{count !== 1 ? 'es' : ''} con solapamientos detectados
        </Text>
        <Text className="text-xs text-[#AD6800]">
          Las órdenes se reprogramarán en cadena para eliminar los conflictos. Revisa las fechas propuestas antes de confirmar.
        </Text>
      </div>

      <div className="max-h-[52vh] overflow-y-auto pr-1 pb-4">
        {proposals.map((p) => (
          <ProposalCard
            key={p.id}
            proposal={p}
            conflictsWith={conflictMap.get(p.id) ?? []}
            proposalMap={proposalMap}
          />
        ))}
      </div>
    </Modal>
  );
}
