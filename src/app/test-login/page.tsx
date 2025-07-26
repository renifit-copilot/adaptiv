'use client';

import { useState, useEffect, Suspense } from 'react';
import { Section, Cell, List, Spinner } from '@telegram-apps/telegram-ui';
import { Page } from '@/components/Page';

// Отдельный компонент для логики входа
function LoginContent() {
  const [status, setStatus] = useState<{
    type: 'loading' | 'error' | 'success';
    message: string;
  }>({ type: 'loading', message: 'Инициализация...' });

  useEffect(() => {
    // Обработка только на клиенте
    if (typeof window === 'undefined') return;

    // В @telegram-apps/telegram-ui автоматически инициализируется Telegram Web App
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      setStatus({
        type: 'error',
        message: 'Ожидание инициализации Telegram Web App...'
      });
      return;
    }

    const raw = tg.initDataRaw;
    if (!raw) {
      setStatus({
        type: 'error',
        message: 'Ошибка: отсутствуют данные инициализации Telegram'
      });
      return;
    }

    setStatus({
      type: 'loading',
      message: 'Выполняется вход...'
    });

    fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `tma ${raw}`,
      },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Ошибка входа');
        }
        return data;
      })
      .then((data) => {
        setStatus({
          type: 'success',
          message: 'Успешный вход'
        });
        return data;
      })
      .catch((err) => {
        console.error('Login error:', err);
        setStatus({
          type: 'error',
          message: `Ошибка входа: ${err.message}`
        });
      });
  }, []);

  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

  return (
    <List>
      <Section header="Статус авторизации">
        <Cell
          before={status.type === 'loading' ? <Spinner size="s" /> : null}
          subtitle={status.message}
        >
          {status.type === 'success' ? 'Авторизация успешна' : 'Авторизация'}
        </Cell>
      </Section>
      {process.env.NODE_ENV === 'development' && tg && (
        <Section header="Отладочная информация">
          <Cell subtitle={`Platform: ${tg.platform}`}>
            Платформа
          </Cell>
          <Cell subtitle={`Color Scheme: ${tg.colorScheme}`}>
            Тема
          </Cell>
          <Cell subtitle={tg.initDataRaw ? 'Присутствует' : 'Отсутствует'}>
            Init Data
          </Cell>
        </Section>
      )}
    </List>
  );
}

// Основной компонент с обработкой загрузки
export default function TestLogin() {
  return (
    <Page>
      <Suspense fallback={
        <List>
          <Section header="Статус авторизации">
            <Cell before={<Spinner size="s" />} subtitle="Загрузка...">
              Авторизация
            </Cell>
          </Section>
        </List>
      }>
        <LoginContent />
      </Suspense>
    </Page>
  );
}
