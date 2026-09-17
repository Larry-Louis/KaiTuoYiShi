import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { ZHIKU_BUNDLED_ENTRY_COUNT } from '@/data/zhikuPreset';
import type { ZhikuArchiveCategoryId, ZhikuArchiveItem, ZhikuArchiveVolume } from '@/services/zhikuArchive';
import { Avatar } from './Avatar';
import { RollingNumber } from './IndexColumn';

type LoreCategory = Exclude<ZhikuArchiveCategoryId, 'custom'>;

/**
 * 档位由排名决定，不由数量直接换算：
 * 数量会随解锁进度天天变，而「谁最大」稳定得多；直接换算会让版面天天重排。
 * 最小的档也保证可读——一块仪板再小也得看得清，这是下限，不是比例失真。
 */
const SLOTS = ['a', 'b', 'c', 'd', 'e', 'f'] as const;

type BentoMode = 'wide' | 'square' | 'tall';

/**
 * 便当盒按容器自身的宽高比换版式，而不是只按宽度断点。
 * 同一台显示器拉高拉窄都会换一种排布——版面跟着盒子走，不跟着设备走。
 */
const TEMPLATES: Record<BentoMode, { areas: string; cols: string; rows: string; minHeight?: number }> = {
  /* 六格等分。曾经让头名占去一半版面，结果是人物的头像墙压着五个空盒子——
     体量差已经由读数和名单长度说清楚了，版面不必再喊一遍。
     等大之后每一格都被自己的内容填满，整体才安静得下来。 */
  wide: {
    areas: '"a a a a a a a a b b b b" "a a a a a a a a c c c c" "d d d d e e e e f f f f"',
    cols: 'repeat(12, 1fr)',
    rows: 'repeat(3, minmax(148px, auto))',
  },
  square: {
    areas: '"a a a b b b" "a a a b b b" "c c d d e e" "f f f f f f"',
    cols: 'repeat(6, 1fr)',
    rows: 'repeat(4, auto)',
  },
  tall: {
    areas: '"a a" "a a" "b b" "c c" "d d" "e e" "f f"',
    cols: 'repeat(2, 1fr)',
    rows: 'repeat(7, auto)',
  },
};

function useBentoMode(ref: React.RefObject<HTMLElement | null>): BentoMode {
  const [mode, setMode] = useState<BentoMode>('wide');

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => {
      const { width, height } = node.getBoundingClientRect();
      if (!width || !height) return;
      const aspect = width / height;
      setMode(aspect > 1.55 ? 'wide' : aspect > 1.05 ? 'square' : 'tall');
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return mode;
}

/**
 * 每格摆多少，由它自己占多大决定。
 * 摆满整面 89 张头像墙会让 908px 的大格子和 260px 的小格子彻底失衡；
 * 反过来只给大格子六个名字，它就变成空盒子。大格子多摆、小格子少摆，六格才站得住。
 */
/* 音量给到尺度上，不给到元素数量上：
   头名格靠「一个字都认得的头像墙」和纪念碑读数撑起来，而不是再塞几十个词条。
   头像墙密度有上限，否则又回到「89 个头像压着六个名字」的失衡。 */
const WIDE_AVATAR_CAP = 36;
const WIDE_NAME_CAP = 10;
const NARROW_NAME_CAP = 6;
/** 只有头名档跨两行；其余一视同仁。 */
const WIDE_RANKS = 1;

interface OverviewProps {
  categories: { id: LoreCategory; label: string; description: string; count: number; countLabel: string }[];
  itemsByCategory: Record<string, ZhikuArchiveItem[]>;
  volumes: ZhikuArchiveVolume[];
  onSelectCategory: (id: LoreCategory) => void;
}

/** 总览：进智库的第一眼。整屏弹性便当盒，格子按体量分档，随容器宽高比换版式。 */
export function Overview({ categories, itemsByCategory, volumes, onSelectCategory }: OverviewProps) {
  const reduced = useReducedMotion();
  const boardRef = useRef<HTMLDivElement>(null);
  const mode = useBentoMode(boardRef);
  const template = TEMPLATES[mode];

  const ranked = [...categories].sort((a, b) => b.count - a.count);
  /* 收录进度只算条目：卷宗是章节不是条目，混进分子会让进度条说谎。 */
  const loreTotal = categories.reduce((sum, row) => sum + (row.id === 'story' ? 0 : row.count), 0);

  const hover = reduced ? undefined : { scale: 1.014, transition: { type: 'spring' as const, stiffness: 460, damping: 26 } };
  const tap = reduced ? undefined : { scale: 0.985 };

  return (
    <div className="zk-overview">
      <header className="zk-overview__head">
        <h1 className="zk-overview__title">智库</h1>
        <p className="zk-overview__stat">
          已收录 {loreTotal} / {ZHIKU_BUNDLED_ENTRY_COUNT}
          {volumes.length > 0 ? ` · ${volumes.length} 卷剧情` : ''}
        </p>
      </header>

      <div
        ref={boardRef}
        className="zk-bento"
        data-mode={mode}
        style={{
          gridTemplateAreas: template.areas,
          gridTemplateColumns: template.cols,
          gridTemplateRows: template.rows,
        }}
      >
        {ranked.map((row, rank) => {
          const isCharacter = row.id === 'character';
          const wide = rank < WIDE_RANKS;
          /* 剧情档案的预览是卷宗，不是条目——它没有 itemsByCategory 这一栏。 */
          const cap = isCharacter
            ? (wide ? WIDE_AVATAR_CAP : NARROW_NAME_CAP)
            : (wide ? WIDE_NAME_CAP : NARROW_NAME_CAP);
          const previews = row.id === 'story'
            ? volumes.slice(0, cap).map((volume) => ({
                id: volume.id,
                /* 未解锁的卷宗不留标题槽：二十七个「未解锁」堆在一起是一堵墙，
                   编号才是一排能读出进度的封条。 */
                title: volume.locked ? `卷 ${volume.number}` : volume.title,
                sealed: Boolean(volume.locked),
                avatarSrc: undefined as string | undefined,
                avatarAlt: undefined as string | undefined,
              }))
            : (itemsByCategory[row.id] ?? []).slice(0, cap).map((item) => ({
                id: item.id,
                title: item.title,
                sealed: false,
                avatarSrc: item.avatarSrc,
                avatarAlt: item.avatarAlt,
              }));
          return (
            <motion.button
              key={row.id}
              type="button"
              /* 不要在这里用 Motion 的 layout：房间切换会让总览整体重挂载，
                 每块格子都会从上一次的坐标重飞一遍，来回切换时反复出现飞入与叠压。
                 版式切换改为直接换栅格，瞬时且不会误动。 */
              whileHover={hover}
              whileTap={tap}
              style={{ gridArea: SLOTS[rank] ?? 'f' }}
              className="zk-cell"
              data-rank={rank}
              data-category-id={row.id}
              aria-label={`展开${row.label}，${row.countLabel}`}
              onClick={() => onSelectCategory(row.id)}
            >
              <span className="zk-cell__top">
                <span className="zk-cell__label">{row.label}</span>
                <RollingNumber className="zk-cell__n" value={row.count} />
              </span>

              <span className="zk-cell__preview">
                {isCharacter && previews.length > 0
                  ? previews.map((item) => (
                    <Avatar
                      key={item.id}
                      className="zk-cell__ava"
                      src={item.avatarSrc}
                      alt={item.avatarAlt ?? `${item.title}头像`}
                      fallback={item.title.slice(0, 1)}
                    />
                  ))
                  : previews.map((item) => (
                    <span key={item.id} className="zk-cell__name" data-sealed={item.sealed ? 'true' : 'false'}>
                      {item.title}
                    </span>
                  ))}
              </span>

              {/* 单位只在它比读数多出信息时才出现：剧情档案的「27 卷 / 0 章」值得写，
                  其余分类底部的「89 条」只是把上面的 89 又抄了一遍。 */}
              {row.id === 'story' && (
                <span className="zk-cell__foot">
                  <span className="zk-cell__unit">{row.countLabel}</span>
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
