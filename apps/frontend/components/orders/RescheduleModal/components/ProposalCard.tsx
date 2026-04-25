import { memo } from 'react';
import { Typography, Tag, Flex, Col, Row } from 'antd';
import { ArrowRightOutlined, LinkOutlined } from '@ant-design/icons';
import type { ProductionOrder, RescheduleProposal } from '@repo/shared';
import StatusTag from '../../StatusTag';
import DateRange from './DateRange';

const { Text } = Typography;

interface Props {
  proposal: RescheduleProposal;
  order: ProductionOrder | undefined;
  conflictsWith: string[];
  orderMap: Map<string, ProductionOrder>;
}

export default memo(function ProposalCard({ proposal, order, conflictsWith, orderMap }: Props) {
  return (
    <div className="border border-[#E8EEFA] rounded-xl px-5 py-5 bg-white mb-3 last:mb-0">
      <Flex justify="space-between" align="flex-start" className="mb-6">
        <div>
          <Flex align="center" gap={8} className="mb-1.5">
            <Text strong className="text-sm text-[#001450]">
              {order?.reference ?? proposal.id}
            </Text>
            {order && <StatusTag status={order.status} />}
          </Flex>
          {order && (
            <Text type="secondary" className="text-xs">{order.product}</Text>
          )}
        </div>
        <Flex align="center" gap={12}>
          {order && (
            <Text type="secondary" className="text-xs">
              Cant: <Text strong className="text-[#222]">{order.quantity}</Text>
            </Text>
          )}
          {conflictsWith.length > 0 && (
            <Flex align="center" gap={5}>
              <LinkOutlined className="text-[#FF4D4F] text-xs" />
              {conflictsWith.map((id) => {
                const partner = orderMap.get(id);
                return (
                  <Tag key={id} variant="filled" color="error" className="!text-[11px] !m-0">
                    {partner?.reference ?? id}
                  </Tag>
                );
              })}
            </Flex>
          )}
        </Flex>
      </Flex>

      <Row gutter={10} align="stretch">
        <Col span={11}>
          <DateRange variant="conflict" start={proposal.currentStartDate} end={proposal.currentEndDate} />
        </Col>
        <Col span={2} className="flex items-center justify-center">
          <ArrowRightOutlined className="text-[#52C41A] text-lg" />
        </Col>
        <Col span={11}>
          <DateRange variant="resolved" start={proposal.proposedStartDate} end={proposal.proposedEndDate} />
        </Col>
      </Row>
    </div>
  );
});
