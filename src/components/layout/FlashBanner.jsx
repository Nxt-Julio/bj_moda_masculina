import { useEffect } from 'react';
import { useStore } from '../../context/StoreContext';

export function FlashBanner() {
  const { notice, clearNotice } = useStore();

  useEffect(() => {
    if (!notice) return undefined;

    const timer = window.setTimeout(() => {
      clearNotice();
    }, 4500);

    return () => window.clearTimeout(timer);
  }, [clearNotice, notice]);

  if (!notice) return null;

  return (
    <div className={`flash ${notice.type}`}>
      <div className="flash-row">
        <span>{notice.text}</span>
        <button className="flash-close" type="button" onClick={clearNotice} aria-label="Fechar aviso">
          x
        </button>
      </div>
    </div>
  );
}
