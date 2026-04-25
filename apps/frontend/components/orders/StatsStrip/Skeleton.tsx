import { Skeleton } from 'antd';

export default function StatSkeleton() {
  return (
    <div className="flex flex-col gap-[10px]">
      <Skeleton.Button active size="small" className="!w-[90px] !h-[14px] !min-w-0" />
      <Skeleton.Button active className="!w-[44px] !h-[28px] !min-w-0" />
    </div>
  );
}
