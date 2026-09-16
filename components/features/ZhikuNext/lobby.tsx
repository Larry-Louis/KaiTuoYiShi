import { useState, type CSSProperties } from 'react';
import type { ZhikuArchiveCategoryId } from '@/services/zhikuArchive';

interface LobbyCategory {
  id: Exclude<ZhikuArchiveCategoryId, 'custom'>;
  label: string;
  description: string;
  countLabel: string;
}

interface LobbyProps {
  categories: LobbyCategory[];
  itemCount: number;
  chapterCount: number;
  onSelect: (id: Exclude<ZhikuArchiveCategoryId, 'custom'>) => void;
}

const HUB_POSITION = { x: 50, y: 47 };

const NODE_POSITIONS: Record<Exclude<ZhikuArchiveCategoryId, 'custom'>, { x: number; y: number; scale: number }> = {
  character: { x: 28, y: 26, scale: 1 },
  story: { x: 72, y: 26, scale: 1 },
  location: { x: 17, y: 56, scale: 0.9 },
  faction: { x: 83, y: 56, scale: 0.9 },
  event: { x: 32, y: 81, scale: 0.85 },
  term: { x: 68, y: 81, scale: 0.85 },
};

function routePath(id: Exclude<ZhikuArchiveCategoryId, 'custom'>): string {
  const node = NODE_POSITIONS[id];
  const bendX = (HUB_POSITION.x + node.x) / 2 + (id.length % 2 === 0 ? 3 : -3);
  const bendY = (HUB_POSITION.y + node.y) / 2 + (node.y < HUB_POSITION.y ? -5 : 5);
  return `M ${HUB_POSITION.x} ${HUB_POSITION.y} Q ${bendX} ${bendY} ${node.x} ${node.y}`;
}

export function Lobby({ categories, itemCount, chapterCount, onSelect }: LobbyProps) {
  const [hoveredId, setHoveredId] = useState<Exclude<ZhikuArchiveCategoryId, 'custom'> | null>(null);
  const isEmpty = itemCount === 0 && chapterCount === 0;

  return (
    <div className="zn-hall" aria-label="智库分类大厅">
      <svg className="zn-routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {categories.map((category) => (
          <g key={category.id}>
            <path
              d={routePath(category.id)}
              data-active={hoveredId === category.id ? 'true' : 'false'}
            />
            <circle cx={NODE_POSITIONS[category.id].x} cy={NODE_POSITIONS[category.id].y} r="0.4" />
          </g>
        ))}
      </svg>

      <div
        className="zn-hub"
        style={{ '--x': `${HUB_POSITION.x}%`, '--y': `${HUB_POSITION.y}%` } as CSSProperties}
      >
        <div className="zn-hub__disc">
          <span className="zn-hub__label">智库</span>
        </div>
        <span className="zn-hub__count">{itemCount} 条资料 · {chapterCount} 个章节</span>
      </div>

      {categories.map((category) => {
        const position = NODE_POSITIONS[category.id];
        return (
          <button
            key={category.id}
            type="button"
            className="zn-node"
            data-category-id={category.id}
            style={{
              '--x': `${position.x}%`,
              '--y': `${position.y}%`,
              '--s': position.scale,
            } as CSSProperties}
            onMouseEnter={() => setHoveredId(category.id)}
            onMouseLeave={() => setHoveredId(null)}
            onFocus={() => setHoveredId(category.id)}
            onBlur={() => setHoveredId(null)}
            onClick={() => onSelect(category.id)}
            aria-label={`${category.label}，${category.countLabel}`}
            title={category.description}
          >
            <span className="zn-node__disc">
              <span className="zn-node__halo" aria-hidden="true" />
            </span>
            <span className="zn-node__label">{category.label}</span>
            <span className="zn-node__count">{category.countLabel}</span>
          </button>
        );
      })}

      {isEmpty && (
        <p className="zn-hall__intro" data-archive-state="empty">
          档案尚未收录：内置资料未载入，或当前存档还没有可归档的剧情章节。可尝试重载内置档案。
        </p>
      )}
    </div>
  );
}
