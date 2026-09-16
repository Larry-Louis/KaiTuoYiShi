import { ChevronRight } from 'lucide-react';
import type { ZhikuArchiveCategoryId } from '@/services/zhikuArchive';

interface LobbyCategory {
  id: ZhikuArchiveCategoryId;
  label: string;
  description: string;
  countLabel: string;
}

interface LobbyProps {
  categories: LobbyCategory[];
  itemCount: number;
  chapterCount: number;
  onSelect: (id: ZhikuArchiveCategoryId) => void;
}

export function Lobby({ categories, itemCount, chapterCount, onSelect }: LobbyProps) {
  const isEmpty = itemCount === 0 && chapterCount === 0 && categories.every((category) => category.id !== 'custom' || category.countLabel.startsWith('0'));

  return (
    <div className="zn-hall" aria-label="智库分类大厅">
      <p className="zn-hall__intro">
        档案以条目为单位收录，剧情按卷宗与章节归档。自制资料在「自制」里统一管理，可新建、编辑并即时保存。
      </p>
      <nav className="zn-hall__list" aria-label="分类索引">
        {categories.map((category, index) => (
          <button
            key={category.id}
            type="button"
            className="zn-hall__row"
            style={{ '--i': index } as React.CSSProperties}
            onClick={() => onSelect(category.id)}
            aria-label={`${category.label}，${category.countLabel}`}
          >
            <span className="zn-hall__label">{category.label}</span>
            <span className="zn-hall__desc">{category.description}</span>
            <span className="zn-hall__count">{category.countLabel}</span>
            <ChevronRight size={15} strokeWidth={1.5} aria-hidden="true" className="zn-hall__chevron" />
          </button>
        ))}
      </nav>
      {isEmpty && (
        <p className="zn-note mt-4" data-archive-state="empty">
          档案尚未收录：内置资料未载入，或当前存档还没有可归档的剧情章节。可尝试重载内置档案。
        </p>
      )}
    </div>
  );
}
