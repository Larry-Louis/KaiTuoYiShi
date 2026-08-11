import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { SquarePen, X } from 'lucide-react';
import type { 智库辅助关键词逻辑 } from '@/models/zhiku';
import type { ZhikuArchiveItem } from './ArchiveBrowser';
import './zhiku-entry-editor.css';

export interface ZhikuEntryPatch {
  标题?: string;
  原文?: string;
  触发关键词?: string[];
  辅助关键词?: string[];
  辅助关键词逻辑?: 智库辅助关键词逻辑;
}

interface ZhikuEntryEditorProps {
  entry: ZhikuArchiveItem;
  onCancel: () => void;
  onSave: (patch: ZhikuEntryPatch) => void;
}

const SECONDARY_KEYWORD_LOGIC_OPTIONS: { value: 智库辅助关键词逻辑; label: string }[] = [
  { value: 'AND_ANY', label: 'AND_ANY — 任一形态限定词' },
  { value: 'AND_ALL', label: 'AND_ALL — 全部形态限定词' },
  { value: 'NOT_ANY', label: 'NOT_ANY — 排除其他形态词' },
  { value: 'NOT_ALL', label: 'NOT_ALL — 不同时出现全部排除词' },
];

function keywordsToString(keywords: string[] | undefined): string {
  if (!keywords || !keywords.length) return '';
  return keywords.join('，');
}

function stringToKeywords(value: string): string[] {
  return value
    .split(/[，,、\s]+/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ZhikuEntryEditor({ entry, onCancel, onSave }: ZhikuEntryEditorProps) {
  const [title, setTitle] = useState(entry.title);
  const [body, setBody] = useState(entry.body);
  const [triggerKeywordsStr, setTriggerKeywordsStr] = useState(keywordsToString(entry.triggerKeywords));
  const [secondaryKeywordsStr, setSecondaryKeywordsStr] = useState(keywordsToString(entry.secondaryKeywords));
  const [secondaryKeywordLogic, setSecondaryKeywordLogic] = useState<智库辅助关键词逻辑>(
    entry.secondaryKeywordLogic ?? 'AND_ANY',
  );

  const titleRef = useRef<HTMLInputElement>(null);
  const isBuiltin = entry.meta === '内置资料';

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const patch: ZhikuEntryPatch = {};
    const trimmedTitle = title.trim();
    if (trimmedTitle && trimmedTitle !== entry.title) patch.标题 = trimmedTitle;
    const trimmedBody = body.trim();
    if (trimmedBody !== entry.body) patch.原文 = trimmedBody;

    const newTriggerKeywords = stringToKeywords(triggerKeywordsStr);
    const oldTriggerStr = keywordsToString(entry.triggerKeywords);
    if (keywordsToString(newTriggerKeywords) !== oldTriggerStr) {
      patch.触发关键词 = newTriggerKeywords.length ? newTriggerKeywords : [];
    }

    const newSecondaryKeywords = stringToKeywords(secondaryKeywordsStr);
    const oldSecondaryStr = keywordsToString(entry.secondaryKeywords);
    if (keywordsToString(newSecondaryKeywords) !== oldSecondaryStr) {
      patch.辅助关键词 = newSecondaryKeywords.length ? newSecondaryKeywords : [];
    }

    if (secondaryKeywordLogic !== (entry.secondaryKeywordLogic ?? 'AND_ANY')) {
      patch.辅助关键词逻辑 = secondaryKeywordLogic;
    }

    if (Object.keys(patch).length === 0) {
      onCancel();
      return;
    }

    onSave(patch);
  };

  const handleOverlayKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
  };

  return (
    <div
      className="zhiku-entry-editor__overlay"
      role="dialog"
      aria-modal="true"
      aria-label="编辑档案条目"
      onKeyDown={handleOverlayKeyDown}
    >
      <form className="zhiku-entry-editor__panel" onSubmit={handleSubmit}>
        <header className="zhiku-entry-editor__header">
          <div className="zhiku-entry-editor__field">
            <span className="zhiku-entry-editor__header-kicker">EDIT // ARCHIVE ENTRY</span>
            <h2>{entry.title}</h2>
          </div>
          <button
            type="button"
            className="zhiku-entry-editor__header-close"
            onClick={onCancel}
            aria-label="取消编辑"
            title="取消编辑"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </header>

        <div className="zhiku-entry-editor__body">
          <div className="zhiku-entry-editor__field">
            <label className="zhiku-entry-editor__label" htmlFor="zhiku-editor-title">
              标题
            </label>
            <input
              ref={titleRef}
              id="zhiku-editor-title"
              className="zhiku-entry-editor__input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="资料标题"
            />
          </div>

          <div className="zhiku-entry-editor__field">
            <label className="zhiku-entry-editor__label" htmlFor="zhiku-editor-body">
              原文
            </label>
            <textarea
              id="zhiku-editor-body"
              className="zhiku-entry-editor__textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="请输入正文内容..."
            />
          </div>

          <div className="zhiku-entry-editor__field">
            <label className="zhiku-entry-editor__label" htmlFor="zhiku-editor-trigger-keywords">
              触发关键词
            </label>
            <input
              id="zhiku-editor-trigger-keywords"
              className="zhiku-entry-editor__input"
              type="text"
              value={triggerKeywordsStr}
              onChange={(e) => setTriggerKeywordsStr(e.target.value)}
              placeholder="多个关键词用逗号分隔"
            />
          </div>

          <div className="zhiku-entry-editor__field-row">
            <div className="zhiku-entry-editor__field">
              <label className="zhiku-entry-editor__label" htmlFor="zhiku-editor-secondary-keywords">
                辅助关键词
              </label>
              <input
                id="zhiku-editor-secondary-keywords"
                className="zhiku-entry-editor__input"
                type="text"
                value={secondaryKeywordsStr}
                onChange={(e) => setSecondaryKeywordsStr(e.target.value)}
                placeholder="多个关键词用逗号分隔"
              />
            </div>

            <div className="zhiku-entry-editor__field">
              <label className="zhiku-entry-editor__label" htmlFor="zhiku-editor-secondary-logic">
                辅助关键词逻辑
              </label>
              <select
                id="zhiku-editor-secondary-logic"
                className="zhiku-entry-editor__select"
                value={secondaryKeywordLogic}
                onChange={(e) => setSecondaryKeywordLogic(e.target.value as 智库辅助关键词逻辑)}
              >
                {SECONDARY_KEYWORD_LOGIC_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isBuiltin && (
            <p className="zhiku-entry-editor__field" style={{ marginTop: 12, color: 'rgba(var(--zhiku-gold), 0.66)', fontSize: 10, lineHeight: 1.6 }}>
              该条目为内置资料。修改后将以本地覆写为准，重启合并时覆盖预设内容。
            </p>
          )}
        </div>

        <footer className="zhiku-entry-editor__footer">
          <button type="button" className="zhiku-entry-editor__btn" onClick={onCancel}>
            取消
          </button>
          <button type="submit" className="zhiku-entry-editor__btn zhiku-entry-editor__btn--primary">
            <SquarePen size={13} strokeWidth={1.6} />
            保存修改
          </button>
        </footer>
      </form>
    </div>
  );
}
