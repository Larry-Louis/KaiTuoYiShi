import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { ResilientImage } from '@/components/ui/ResilientImage';
import type { ZhikuArchiveCategoryId, ZhikuArchiveItem } from '@/services/zhikuArchive';
import { buildZhikuReaderStyle } from './readerFontSize';
import { Prose } from './prose';
import { EmptyState } from './fields';

interface CategoryReaderProps {
  category: { id: ZhikuArchiveCategoryId; label: string };
  items: ZhikuArchiveItem[];
  fontSize: number;
}

type ReadingPane = 'archive' | 'injection';

const formatSequence = (index: number): string => String(index + 1).padStart(2, '0');

export function CategoryReader({ category, items, fontSize }: CategoryReaderProps) {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [pane, setPane] = useState<ReadingPane>('archive');
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? items.at(0);
  const variants = selectedItem?.variants ?? [];
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) ?? variants.at(0);
  const keywords = selectedVariant?.keywords ?? selectedItem?.keywords ?? [];
  const injectionPreview = (selectedVariant?.injectionPreview ?? selectedItem?.injectionPreview ?? '').trim();

  return (
    <div className="zn-view" data-archive-state={items.length ? 'ready' : 'empty'}>
      <div className="zn-view__body">
        <div className="zn-index tn-scroll" aria-label={`${category.label}列表`}>
          {items.length === 0 ? (
            <EmptyState title="暂无档案" hint="当前分类没有玩家可见资料" />
          ) : (
            items.map((item, index) => {
              const active = item.id === selectedItem?.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className="zn-index__item"
                  data-active={active ? 'true' : 'false'}
                  data-item-id={item.id}
                  aria-pressed={active}
                  aria-label={`阅读${item.title}`}
                  onClick={() => {
                    setSelectedItemId(item.id);
                    setSelectedVariantId('');
                    setPane('archive');
                  }}
                >
                  <span className="zn-index__seq">{formatSequence(index)}</span>
                  {category.id === 'character' && (
                    <span className="zn-index__avatar">
                      {item.avatarSrc ? (
                        <ResilientImage src={item.avatarSrc} alt={item.avatarAlt ?? `${item.title}头像`} className="h-full w-full object-cover" draggable={false} />
                      ) : (
                        <span className="grid h-full w-full place-items-center text-sm" style={{ color: 'var(--tn-accent)' }}>{item.title.slice(0, 1)}</span>
                      )}
                    </span>
                  )}
                  <span className="zn-index__copy">
                    <span className="zn-index__title">{item.title}</span>
                    <span className="zn-index__meta">{item.subtitle ?? item.meta ?? category.label}</span>
                  </span>
                  {!item.builtin && <span className="zn-index__badge">自制</span>}
                  <ChevronRight size={13} strokeWidth={1.5} aria-hidden="true" style={{ color: 'var(--tn-text-faint)' }} />
                </button>
              );
            })
          )}
        </div>

        <section className="zn-reader" aria-live="polite">
          {selectedItem ? (
            <>
              <header className="zn-reader__head">
                <div className="tn-kicker">
                  {category.id.toUpperCase()} // {formatSequence(items.findIndex((item) => item.id === selectedItem.id))}
                </div>
                <h2 className="zn-reader__title">{selectedItem.title}</h2>
                <div className="zn-reader__meta">
                  <span>{selectedItem.meta ?? '已收录档案'}</span>
                  {selectedItem.subtitle && <span>{selectedItem.subtitle}</span>}
                  <span>{keywords.length} 个关键词</span>
                </div>
                <div className="zn-tabs" role="tablist" aria-label="档案内容视图">
                  <button type="button" role="tab" className="zn-tab" aria-selected={pane === 'archive'} onClick={() => setPane('archive')}>
                    档案预览
                  </button>
                  <button type="button" role="tab" className="zn-tab" aria-selected={pane === 'injection'} onClick={() => setPane('injection')}>
                    注入内容
                  </button>
                </div>
                {variants.length > 1 && (
                  <div className="zn-variants" role="tablist" aria-label="选择档案形态">
                    {variants.map((variant) => (
                      <button
                        key={variant.id}
                        type="button"
                        role="tab"
                        className="zn-variant"
                        aria-selected={variant.id === selectedVariant?.id}
                        onClick={() => setSelectedVariantId(variant.id)}
                      >
                        {variant.label}
                      </button>
                    ))}
                  </div>
                )}
              </header>
              <div className="zn-reader__scroll tn-scroll" role="tabpanel" aria-label="档案正文" style={buildZhikuReaderStyle(fontSize)}>
                {pane === 'archive' ? (
                  <Prose source={selectedVariant?.body || selectedItem.body} />
                ) : (
                  <>
                    {keywords.length > 0 && (
                      <div className="zn-keywords">
                        {keywords.map((keyword, index) => (
                          <span key={`${keyword}-${index}`} className="zn-keyword">{keyword}</span>
                        ))}
                      </div>
                    )}
                    {injectionPreview ? (
                      <pre className="zn-terminal">{injectionPreview}</pre>
                    ) : (
                      <p style={{ color: 'var(--tn-text-faint)', fontSize: 12 }}>暂无可注入内容</p>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            <EmptyState title="暂无可阅读档案" hint="当前没有玩家可见资料" />
          )}
        </section>
      </div>
    </div>
  );
}
