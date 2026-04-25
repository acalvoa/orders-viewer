'use client';

import { App, ConfigProvider } from 'antd';
import theme from '@/lib/theme';

export default function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider theme={theme}>
      <App>{children}</App>
    </ConfigProvider>
  );
}
