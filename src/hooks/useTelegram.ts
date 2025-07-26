import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: WebApp;
    };
  }
}

interface WebApp {
  ready: () => void;
  initDataRaw: string;
  initData: string;
  platform: string;
  colorScheme: string;
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  BackButton: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    onClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive: boolean) => void;
    hideProgress: () => void;
    setText: (text: string) => void;
    setParams: (params: { text?: string; color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean }) => void;
  };
}

export function useTelegram() {
  const [webApp, setWebApp] = useState<WebApp | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Ждем загрузки окружения Telegram
    const checkTelegramApp = () => {
      if (typeof window !== 'undefined') {
        const app = window.Telegram?.WebApp;
        if (app) {
          setWebApp(app);
          app.ready();
        } else {
          setError('Telegram Web App не доступен');
          
          // В режиме разработки можно использовать моки
          if (process.env.NODE_ENV === 'development') {
            console.warn('Development mode: Using mock Telegram WebApp data');
            setWebApp({
              initDataRaw: 'mock_init_data',
              initData: 'mock_init_data',
              platform: 'mock_platform',
              colorScheme: 'light',
              themeParams: {},
              isExpanded: false,
              viewportHeight: 0,
              viewportStableHeight: 0,
              headerColor: '#ffffff',
              backgroundColor: '#ffffff',
              ready: () => {},
              BackButton: {
                isVisible: false,
                onClick: () => {},
                show: () => {},
                hide: () => {},
              },
              MainButton: {
                text: '',
                color: '#2481cc',
                textColor: '#ffffff',
                isVisible: false,
                isActive: true,
                isProgressVisible: false,
                onClick: () => {},
                show: () => {},
                hide: () => {},
                enable: () => {},
                disable: () => {},
                showProgress: () => {},
                hideProgress: () => {},
                setText: () => {},
                setParams: () => {},
              },
            });
          }
        }
      }
    };

    checkTelegramApp();
  }, []);

  return { webApp, error, isReady: !!webApp };
}
