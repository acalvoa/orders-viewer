import { memo } from 'react';
import { Tag } from 'antd';
import { WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { fmtDt } from '@/utils/format';
import { hours } from '../utils';

interface Props {
  variant: 'conflict' | 'resolved';
  start: string;
  end: string;
}

export default memo(function DateRange({ variant, start, end }: Props) {
  const isConflict = variant === 'conflict';
  const dur = hours(start, end);

  return (
    <div className={`rounded-lg p-3 h-full border-l-[3px] ${
      isConflict
        ? 'bg-[#FFF2F0] border-l-[#FF4D4F]'
        : 'bg-[#F6FFED] border-l-[#52C41A]'
    }`}>
      <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.6px] mb-3 ${isConflict ? 'text-[#CF1322]' : 'text-[#389E0D]'}`}>
        {isConflict ? <WarningOutlined /> : <CheckCircleOutlined />}
        {isConflict ? 'Actual · en conflicto' : 'Propuesto · sin conflicto'}
      </div>
      <div className="flex flex-col gap-1.5 mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold w-6 shrink-0 ${isConflict ? 'text-[#FF4D4F]' : 'text-[#52C41A]'}`}>INI</span>
          <span className="text-xs text-[#222]">{fmtDt(start)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold w-6 shrink-0 ${isConflict ? 'text-[#FF4D4F]' : 'text-[#52C41A]'}`}>FIN</span>
          <span className="text-xs text-[#222]">{fmtDt(end)}</span>
        </div>
      </div>
      <Tag variant="filled" className={`!text-[11px] !m-0 ${isConflict ? '!bg-[#FFE0DE] !text-[#CF1322]' : '!bg-[#D9F7BE] !text-[#389E0D]'}`}>
        {dur}
      </Tag>
    </div>
  );
});
