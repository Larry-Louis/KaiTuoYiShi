import { useEffect, useState } from 'react';

/**
 * 手机面。JS 与 CSS 必须用同一个查询——两边各判各的，
 * 一处改了另一处没跟上，就会出现「JS 按单栈渲染、CSS 按分栏排版」的错版。
 * zhiku.css 末尾那块手机媒体查询必须与此字符串逐字一致。
 *
 * 横屏手机 (844×390) 宽度超过 620，但高度根本放不下上下分栏，所以按「矮」也算手机。
 * 第二段限定在 940 宽以内，免得把又宽又矮的桌面窗口也拖进手机版。
 */
export const COMPACT_SURFACE_QUERY = '(max-width: 620px), (max-width: 940px) and (max-height: 460px)';

function matchesNow(query: string): boolean {
  /* jsdom 与老浏览器可能没有 matchMedia：一律按宽屏处理，桌面排版才是默认。 */
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(query).matches;
}

export function useCompactSurface(): boolean {
  const [compact, setCompact] = useState(() => matchesNow(COMPACT_SURFACE_QUERY));

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const list = window.matchMedia(COMPACT_SURFACE_QUERY);
    const sync = () => setCompact(list.matches);
    /* 挂载后再对一次：首帧与 effect 之间窗口可能已经被拉窄。 */
    sync();
    list.addEventListener('change', sync);
    return () => list.removeEventListener('change', sync);
  }, []);

  return compact;
}
