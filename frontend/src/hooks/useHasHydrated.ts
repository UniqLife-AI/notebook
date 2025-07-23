// File: frontend/src/hooks/useHasHydrated.ts
// Намерение: Этот хук решает проблему гонки состояний. Он предоставляет
// простой способ узнать, завершил ли Zustand свою асинхронную операцию
// восстановления состояния из localStorage. Компоненты могут использовать
// его, чтобы отложить выполнение логики до полной готовности хранилища.

import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

export const useHasHydrated = () => {
  const [hydrated, setHydrated] = useState(useAppStore.persist.hasHydrated());

  useEffect(() => {
    // ИСПРАВЛЕНИЕ: Используем `onFinishHydration`, так как это правильный метод в API.
    // Он вызывается один раз после того, как состояние было восстановлено.
    const unsubFinish = useAppStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    return () => {
      // Отписываемся от события при размонтировании компонента, чтобы избежать утечек памяти.
      unsubFinish();
    };
  }, []);

  return hydrated;
};