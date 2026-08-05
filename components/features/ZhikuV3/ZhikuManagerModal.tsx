import type { Dispatch, SetStateAction } from 'react';
import { ZhikuExperience } from '@/components/features/ZhikuV3/ZhikuExperience';
import type { 剧情编织系统 } from '@/models/storyWeaving';
import type { 智库系统 } from '@/models/zhiku';
import type { 智库系统设置 } from '@/models/settings';

interface Props {
  zhikuSystem: 智库系统;
  storyWeavingSystem: 剧情编织系统;
  onZhikuSystemChange: Dispatch<SetStateAction<智库系统>>;
  settings: 智库系统设置;
  /** 当前世界观 ID：智库持久化按世界命名空间隔离。 */
  worldId: string;
  onClose: () => void;
}

export function ZhikuManagerModal({
  zhikuSystem,
  storyWeavingSystem,
  onZhikuSystemChange,
  settings,
  worldId,
  onClose,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-[100] min-h-0 min-w-0 overflow-hidden bg-[#090c0f]"
      role="dialog"
      aria-modal="true"
      aria-label="智库"
    >
      <ZhikuExperience
        zhikuSystem={zhikuSystem}
        storyWeavingSystem={storyWeavingSystem}
        onZhikuSystemChange={onZhikuSystemChange}
        settings={settings}
        worldId={worldId}
        onClose={onClose}
      />
    </div>
  );
}
