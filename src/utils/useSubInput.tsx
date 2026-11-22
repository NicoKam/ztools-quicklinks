import { useDocumentVisibility, useMemoizedFn } from 'ahooks';
import { useEffect, useState } from 'react';

export interface UseSubInputOptions {
  placeholder?: string;
  isFocus?: boolean;
}

export default function useSubInput(options: UseSubInputOptions = {}) {
  const { placeholder = '搜索', isFocus = true } = options;
  const [subInput, setSubInput] = useState('');

  const isVisible = useDocumentVisibility();

  const connectSubInput = useMemoizedFn((clear = false) => {
    if (clear) {
      setSubInput('');
    }
    window.ztools?.setSubInput(({ text }) => {
      setSubInput(text);
    }, placeholder, isFocus);
    window.ztools?.setSubInputValue(clear ? '' : subInput);
  });

  const disconnectSubInput = useMemoizedFn(() => {
    setSubInput('');
  });

  useEffect(() => {
    connectSubInput(true);
    window.ztools.onPluginEnter(() => {
      connectSubInput(true);
    });
    window.ztools.onPluginOut(() => {
      disconnectSubInput();
    });
  }, []);

  useEffect(() => {
    if (isVisible) {
      connectSubInput(true);
    }
  }, [isVisible]);

  return [subInput, { connectSubInput, disconnectSubInput }] as const;
}
