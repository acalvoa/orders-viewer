import type { ThemeConfig } from 'antd';

const theme: ThemeConfig = {
  token: {
    colorPrimary: '#116DFF',
    colorLink: '#116DFF',
    colorBgBase: '#F9FBFF',
    colorTextBase: '#324158',
    colorBorder: '#e8edf5',
    borderRadius: 6,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    Layout: {
      siderBg: '#001450',
      triggerBg: '#001450',
    },
    Menu: {
      darkItemBg: '#001450',
      darkItemColor: 'rgba(255,255,255,0.55)',
      darkItemSelectedBg: 'rgba(17,109,255,0.15)',
      darkItemSelectedColor: '#ffffff',
      darkItemHoverBg: 'rgba(255,255,255,0.06)',
      darkItemHoverColor: 'rgba(255,255,255,0.85)',
    },
  },
};

export default theme;
