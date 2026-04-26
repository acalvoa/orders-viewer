'use client';

import { memo } from 'react';
import { Card, Col, Row } from 'antd';
import Stat from './Stat';
import StatSkeleton from './Skeleton';

interface Props {
  total: number;
  planned: number;
  inProgress: number;
  loading?: boolean;
  conflictsCount?: number;
  conflictsLoading?: boolean;
}

const StatCard = memo(function StatCard({ children }: { children: React.ReactNode }) {
  return (
    <Card size="small" variant="outlined" className="!border-[#e8edf5]">
      {children}
    </Card>
  );
});

function StatsStrip({ total, planned, inProgress, loading, conflictsCount, conflictsLoading }: Props) {
  const conflicts = conflictsCount ?? 0;

  return (
    <Row gutter={12} className="px-6 py-4">
      <Col span={6}>
        <StatCard>
          {loading ? <StatSkeleton /> : (
            <Stat title="Total Órdenes" value={total} className="text-[#001450]" />
          )}
        </StatCard>
      </Col>
      <Col span={6}>
        <StatCard>
          {loading ? <StatSkeleton /> : (
            <Stat title="Planned" value={planned} className="text-[#1341CA]" />
          )}
        </StatCard>
      </Col>
      <Col span={6}>
        <StatCard>
          {loading ? <StatSkeleton /> : (
            <Stat title="In Progress" value={inProgress} className="text-[#275BF3]" />
          )}
        </StatCard>
      </Col>
      <Col span={6}>
        <StatCard>
          {(loading || conflictsLoading) ? <StatSkeleton /> : (
            <Stat
              title="Con Conflictos"
              value={conflicts}
              className={conflicts > 0 ? 'text-[#D92D20]' : 'text-[#001450]'}
            />
          )}
        </StatCard>
      </Col>
    </Row>
  );
}

export default memo(StatsStrip);
