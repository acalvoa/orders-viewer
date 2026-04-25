'use client';

import { memo } from 'react';
import { Card, Col, Row, Statistic } from 'antd';
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
            <Statistic title="Total Órdenes" value={total} styles={{ content: { color: '#001450', fontWeight: 700 } }} />
          )}
        </StatCard>
      </Col>
      <Col span={6}>
        <StatCard>
          {loading ? <StatSkeleton /> : (
            <Statistic title="Planned" value={planned} styles={{ content: { color: '#1341CA', fontWeight: 700 } }} />
          )}
        </StatCard>
      </Col>
      <Col span={6}>
        <StatCard>
          {loading ? <StatSkeleton /> : (
            <Statistic title="In Progress" value={inProgress} styles={{ content: { color: '#275BF3', fontWeight: 700 } }} />
          )}
        </StatCard>
      </Col>
      <Col span={6}>
        <StatCard>
          {(loading || conflictsLoading) ? <StatSkeleton /> : (
            <Statistic
              title="Con Conflictos"
              value={conflicts}
              styles={{ content: { color: conflicts > 0 ? '#D92D20' : '#001450', fontWeight: 700 } }}
            />
          )}
        </StatCard>
      </Col>
    </Row>
  );
}

export default memo(StatsStrip);
