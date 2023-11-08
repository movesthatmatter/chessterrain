import { useEffect, useRef } from 'react';
import { logger } from '../logger';

export const useLogState = <T>(state: T, name = 'Unnamed State') => {
  const prevStateRef = useRef<T>();

  useEffect(() => {
    logger.group('State Log:', name);
    logger.log('Prev:', prevStateRef.current);
    logger.log('Current', state);
    logger.groupEnd();

    prevStateRef.current = state;
  }, [state]);
};
