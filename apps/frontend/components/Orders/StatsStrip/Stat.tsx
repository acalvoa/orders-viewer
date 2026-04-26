interface Props {
  title: string;
  value: number;
  className: string;
}

export default function Stat({ title, value, className }: Props) {
  return (
    <div>
      <p className="text-xs text-[#8C8C8C] mb-1 m-0">{title}</p>
      <p className={`text-2xl font-bold m-0 ${className}`}>{value}</p>
    </div>
  );
}
