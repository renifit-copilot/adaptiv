'use client';

import { AppRoot } from '@telegram-apps/telegram-ui';
import { PropsWithChildren, Suspense } from 'react';

// Компонент с отложенной загрузкой для клиентской части
function TelegramRoot({ children }: PropsWithChildren) {
  return <AppRoot>{children}</AppRoot>;
}

// Фоллбэк для серверного рендеринга
function ServerFallback({ children }: PropsWithChildren) {
  return <>{children}</>;
}

export function TelegramProvider({ children }: PropsWithChildren) {
  return (
    <Suspense fallback={<ServerFallback>{children}</ServerFallback>}>
      <TelegramRoot>{children}</TelegramRoot>
    </Suspense>
  );
}
