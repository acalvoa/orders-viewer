'use client';

import { Menu } from 'antd';
import { OrderedListOutlined } from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';
import OmniscientLogo from '../OmniscientLogo';

const NAV_ITEMS = [
  { key: '/orders', icon: <OrderedListOutlined />, label: 'Órdenes' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div>
      <aside className="fixed inset-y-0 left-0 w-[220px] bg-[#001450] z-[100] flex flex-col">
        <div className="px-5 pt-5 pb-4 border-b border-white/[0.08] shrink-0">
          <OmniscientLogo textColor="#ffffff" />
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={NAV_ITEMS}
          onClick={({ key }) => router.push(key)}
          className="!bg-[#001450] !border-r-0 mt-2"
        />
      </aside>
      <main className="ml-[220px] min-h-screen bg-[#F9FBFF]">
        {children}
      </main>
    </div>
  );
}
