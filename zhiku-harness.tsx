import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { ZhikuExperience } from '@/components/features/Zhiku/ZhikuExperience';
import type { ZhikuSurface } from '@/components/features/Zhiku/ZhikuExperience';
import { loadAllBundledZhikuPresets } from '@/data/zhikuPreset';
import { loadAllBundledStoryWeavingPresets, hydratePersistedStoryWeavingSystem } from '@/data/storyWeavingPreset';
import { 归一化智库系统 } from '@/models/zhiku';
import type { 智库系统 } from '@/models/zhiku';
import { 归一化剧情编织系统 } from '@/models/storyWeaving';
import type { 剧情编织系统 } from '@/models/storyWeaving';
import '@/styles/tailwind.css';
import '@/styles/root-theme.css';
import '@/styles/global.css';

declare global {
  interface Window {
    __HARNESS_READY__?: boolean;
  }
}

const params = new URLSearchParams(location.search);
const surface = (params.get('surface') ?? 'home') as ZhikuSurface;
const withStory = params.get('story') !== '0';
const catalog = (params.get('catalog') ?? 'ready');
/** unlock=all 让内置条目全部可见；默认保持「新存档」形态——那才是多数玩家见到的第一个状态。 */
const unlockAll = params.get('unlock') === 'all';
/** progress=all 把全部分段标成「已经历」：新存档下 27 卷全是封条，卷宗→章节那条路根本走不到。 */
const progressAll = params.get('progress') === 'all';

/** 新存档下内置条目全部处于未解锁态，档案因此是空的。这里只做展示用的解锁覆盖。 */
function withRuntimeUnlock(system: 智库系统): 智库系统 {
  if (!unlockAll) return system;
  return 归一化智库系统({
    ...system,
    条目: system.条目.map((entry) => (
      entry.builtin ? { ...entry, 运行时解锁状态: '已解锁' } : entry
    )),
  });
}

/** 新存档下没有任何一章可读，卷宗列表全是封条。这里只做展示用的进度覆盖。 */
function withStoryProgress(system: 剧情编织系统): 剧情编织系统 {
  if (!progressAll) return system;
  return 归一化剧情编织系统({
    ...system,
    系列列表: system.系列列表.map((series) => ({
      ...series,
      分段列表: series.分段列表.map((segment) => ({
        ...segment,
        运行状态: '已经历' as const,
        处理状态: '已完成' as const,
      })),
    })),
  });
}

async function main() {
  const zhiku = await loadAllBundledZhikuPresets().catch((error) => {
    console.error('[harness] zhiku preset load failed:', error);
    throw error;
  });
  const story = withStory
    ? await loadAllBundledStoryWeavingPresets().catch(() => 归一化剧情编织系统(undefined))
    : 归一化剧情编织系统(undefined);

  window.__HARNESS_READY__ = true;

  const rootEl = document.getElementById('root');
  if (!rootEl) throw new Error('no root');

  /* 与 App 同一条装载路径：新存档没有 saved，hydrate 直接回落到内置的完整剧情系统。
     之前这里喂的是持久化投影（canon 的章节列表被剥空），于是 27 卷全是封条，
     卷宗→章节那条路根本走不到——那不是新存档的样子，是存档文件的样子。 */
  const storySystem = withStoryProgress(hydratePersistedStoryWeavingSystem(null, story));

  ReactDOM.createRoot(rootEl).render(
    <StrictMode>
      <ZhikuExperience
        zhikuSystem={withRuntimeUnlock(zhiku)}
        storyWeavingSystem={storySystem}
        onZhikuSystemChange={() => {}}
        onSaveZhikuSystem={() => Promise.resolve()}
        onClose={() => {}}
        catalogStatus={catalog as never}
        surface={surface}
      />
    </StrictMode>,
  );
}

void main();
