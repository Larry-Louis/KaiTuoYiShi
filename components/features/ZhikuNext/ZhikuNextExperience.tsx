import { ArrowLeft, PenLine, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { 剧情编织系统 } from '@/models/storyWeaving';
import type { ZhikuCatalogStatus, 智库系统 } from '@/models/zhiku';
import { buildZhikuArchiveView, type ZhikuArchiveCategoryId, type ZhikuArchiveLoreCategoryId } from '@/services/zhikuArchive';
import { devLogError } from '@/utils/devLog';
import { CustomWorkspace } from './customWorkspace';
import { Lobby } from './lobby';
import { ReaderControls, type ReaderRefreshStatus } from './readerControls';
import { CategoryReader } from './categoryReader';
import { StoryReader } from './storyReader';
import { useZhikuReaderFontSize } from './readerFontSize';
import './zhiku-next.css';

export type ZhikuSurface = 'home' | 'ingame';

type ZhikuView =
  | { kind: 'lobby' }
  | { kind: 'category'; id: ZhikuArchiveLoreCategoryId }
  | { kind: 'story' }
  | { kind: 'custom' };

interface ZhikuNextExperienceProps {
  zhikuSystem: 智库系统;
  storyWeavingSystem: 剧情编织系统;
  onZhikuSystemChange: Dispatch<SetStateAction<智库系统>>;
  onSaveZhikuSystem: (system: 智库系统) => Promise<void>;
  onRefreshBundled?: (current: 智库系统) => Promise<智库系统>;
  onClose?: () => void;
  catalogStatus?: ZhikuCatalogStatus;
  surface?: ZhikuSurface;
}

export function ZhikuNextExperience({
  zhikuSystem,
  storyWeavingSystem,
  onZhikuSystemChange,
  onSaveZhikuSystem,
  onRefreshBundled,
  onClose,
  catalogStatus = 'ready',
  surface = 'ingame',
}: ZhikuNextExperienceProps) {
  const [view, setView] = useState<ZhikuView>(() => (surface === 'home' ? { kind: 'custom' } : { kind: 'lobby' }));
  const [refreshStatus, setRefreshStatus] = useState<ReaderRefreshStatus>('idle');
  const refreshTimerRef = useRef<number | null>(null);
  const { fontSize, decreaseFontSize, increaseFontSize } = useZhikuReaderFontSize();
  const archive = useMemo(
    () => buildZhikuArchiveView(zhikuSystem, storyWeavingSystem),
    [storyWeavingSystem, zhikuSystem],
  );

  useEffect(() => () => {
    if (refreshTimerRef.current !== null) window.clearTimeout(refreshTimerRef.current);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      if (surface === 'home') {
        onClose?.();
        return;
      }
      if (view.kind !== 'lobby') {
        setView({ kind: 'lobby' });
        return;
      }
      onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, surface, view.kind]);

  const scheduleRefreshIdle = (delay: number) => {
    if (refreshTimerRef.current !== null) window.clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = window.setTimeout(() => {
      refreshTimerRef.current = null;
      setRefreshStatus('idle');
    }, delay);
  };

  const handleRefreshBundled = async () => {
    if (!onRefreshBundled || refreshStatus === 'loading') return;
    setRefreshStatus('loading');
    try {
      const next = await onRefreshBundled(zhikuSystem);
      onZhikuSystemChange(next);
      setRefreshStatus('done');
      scheduleRefreshIdle(2000);
    } catch (error) {
      devLogError('ui', 'zhiku-next-refresh-failed', error);
      setRefreshStatus('error');
      scheduleRefreshIdle(3200);
    }
  };

  const lobbyCategories = archive.categories
    .filter((category) => category.id !== 'custom' && surface === 'ingame')
    .map((category) => ({
      id: category.id as Exclude<ZhikuArchiveCategoryId, 'custom'>,
      label: category.label,
      description: category.description,
      count: category.count,
      countLabel: category.id === 'story'
        ? `${category.count} 卷 / ${archive.chapterCount} 章`
        : `${category.count} 条`,
    }));
  const selectedCategory = view.kind === 'category'
    ? archive.categories.find((category) => category.id === view.id)
    : undefined;
  const subtitle = view.kind === 'lobby'
    ? `${archive.itemCount} 条资料 · ${archive.volumes.length} 部卷宗 · ${archive.chapterCount} 个章节`
    : view.kind === 'story'
      ? `${archive.volumes.length} 部卷宗 · ${archive.chapterCount} 个章节`
      : view.kind === 'custom'
        ? '自制条目的新建、编辑与删除，保存到本地智库'
        : '按条目翻阅档案与注入内容';
  const title = view.kind === 'lobby'
    ? '智库'
    : view.kind === 'story'
      ? '剧情档案'
      : view.kind === 'custom'
        ? '自制'
        : selectedCategory?.label ?? '智库档案';
  const canGoBack = surface === 'ingame' && view.kind !== 'lobby';

  return (
    <div
      className="zn-root"
      data-view={view.kind}
      data-surface={surface}
      data-catalog-status={catalogStatus}
    >
      <header className="zn-topbar">
        <div className="min-w-0">
          <div className="tn-kicker">ZHIKU // {surface === 'home' ? 'STUDIO' : 'ARCHIVE'}</div>
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            {canGoBack && (
              <button
                type="button"
                className="tn-chip"
                onClick={() => setView({ kind: 'lobby' })}
                aria-label="返回分类大厅"
                title="返回分类大厅"
              >
                <ArrowLeft size={12} strokeWidth={1.8} aria-hidden="true" />
                返回
              </button>
            )}
            <h1 className="zn-title">{title}</h1>
          </div>
          <p className="zn-subtitle">{subtitle}</p>
        </div>
        <div className="zn-actions">
          {surface === 'ingame' && view.kind !== 'custom' && (
            <button type="button" className="tn-chip" onClick={() => setView({ kind: 'custom' })} aria-label="打开自制工作台" title="自制条目的新建与编辑">
              <PenLine size={12} strokeWidth={1.7} aria-hidden="true" />
              工作台
            </button>
          )}
          <ReaderControls
            fontSize={fontSize}
            onDecreaseFontSize={decreaseFontSize}
            onIncreaseFontSize={increaseFontSize}
            onRefresh={onRefreshBundled ? () => void handleRefreshBundled() : undefined}
            refreshStatus={refreshStatus}
          />
          {onClose && (
            <button type="button" className="tn-chip" onClick={onClose} aria-label="关闭智库" title="关闭智库">
              <X size={13} strokeWidth={1.7} aria-hidden="true" />
            </button>
          )}
        </div>
      </header>

      <div className="zn-stage">
        {view.kind === 'lobby' ? (
          <Lobby
            categories={lobbyCategories}
            itemCount={archive.itemCount}
            chapterCount={archive.chapterCount}
            onSelect={(id) => setView(id === 'story' ? { kind: 'story' } : { kind: 'category', id })}
          />
        ) : view.kind === 'story' ? (
          <StoryReader key="story" volumes={archive.volumes} fontSize={fontSize} />
        ) : view.kind === 'custom' ? (
          <CustomWorkspace
            zhikuSystem={zhikuSystem}
            onZhikuSystemChange={onZhikuSystemChange}
            onSaveZhikuSystem={onSaveZhikuSystem}
          />
        ) : (
          <CategoryReader
            key={view.id}
            category={{ id: view.id, label: selectedCategory?.label ?? '档案' }}
            items={archive.itemsByCategory[view.id]}
            fontSize={fontSize}
          />
        )}
      </div>
    </div>
  );
}
