import { useCallback, useState } from 'react';

function useLocalStorage(keyName, defaultValue = null) {
  const [value, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(keyName);
      return item !== null ? JSON.parse(item) : defaultValue;
    } catch (err) {
      return defaultValue;
    }
  });

  const setValue = useCallback(
    (newValue) => {
      setStoredValue((current) => {
        const resolvedValue = newValue instanceof Function ? newValue(current) : newValue;
        try {
          if (resolvedValue === null || resolvedValue === undefined) {
            window.localStorage.removeItem(keyName);
          } else {
            window.localStorage.setItem(keyName, JSON.stringify(resolvedValue));
          }
        } catch (err) {} // eslint-disable-line no-empty
        return resolvedValue;
      });
    },
    [keyName]
  );

  return [value, setValue];
}

export default useLocalStorage;
