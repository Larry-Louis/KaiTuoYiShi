import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { 智库系统, 智库分类, 智库条目 } from '@/models/zhiku';
import {
  ZHIKU_CATEGORY_LABELS,
  创建智库条目,
  创建空智库注入内容,
  归一化智库系统,
  搜索智库条目,
  智库分类计数,
  获取智库注入内容缺失字段,
  智库条目注入内容完整,
} from '@/models/zhiku';
import { isZhikuArchiveEntryVisible } from '@/services/zhikuArchive';
import { SectionLabel, ToggleRow, EmptyState, Field, PerformanceTextarea } from './fields';
import { StructuredCharacterFields } from './structuredFields';
import { InjectionContentFields } from './injectionContent';
import { ZHIKU_CREATE_CATEGORIES, zhikuScopeOptions, zhikuUnlockStatuses, ZHIKU_SPOILER_LEVELS } from './constants';
import { 创建空草稿, type Draft } from './draft';

interface CustomWorkspaceProps {
  zhikuSystem: 智库系统;
  onZhikuSystemChange: Dispatch<SetStateAction<智库系统>>;
  onSaveZhikuSystem: (system: 智库系统) => Promise<void>;
}

type Bucket = 'custom' | 'builtin';

export function CustomWorkspace({ zhikuSystem, onZhikuSystemChange, onSaveZhikuSystem }: CustomWorkspaceProps) {
  const reduced = useReducedMotion();
  const normalized = useMemo(() => 归一化智库系统(zhikuSystem), [zhikuSystem]);
  const visibleEntries = useMemo(() => normalized.条目.filter((entry) => isZhikuArchiveEntryVisible(entry)), [normalized]);
  const builtinEntries = useMemo(() => visibleEntries.filter((entry) => entry.builtin), [visibleEntries]);
  const customEntries = useMemo(() => visibleEntries.filter((entry) => !entry.builtin), [visibleEntries]);

  const [bucket, setBucket] = useState<Bucket>(() => (customEntries.length === 0 ? 'builtin' : 'custom'));
  const [activeCategory, setActiveCategory] = useState<智库分类 | 'all'>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(customEntries.length === 0);
  const [saveFlash, setSaveFlash] = useState(false);
  const [draft, setDraft] = useState<Draft>(创建空草稿);
  const [composerError, setComposerError] = useState('');

  const pool = bucket === 'builtin' ? builtinEntries : customEntries;
  const activeEntries = useMemo(() => {
    let result = pool;
    const hasQuery = !!query.trim();
    if (hasQuery) {
      result = 搜索智库条目({ 条目: result }, query, 200);
    }
    if (activeCategory !== 'all') {
      result = result.filter((entry) => entry.分类 === activeCategory);
    }
    return hasQuery ? result : [...result].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [activeCategory, pool, query]);

  const counts = useMemo(() => 智库分类计数({ 条目: pool }), [pool]);
  const selected: 智库条目 | null = activeEntries.find((entry) => entry.id === selectedId) ?? activeEntries.at(0) ?? null;

  const persist = async (nextEntries: 智库条目[]) => {
    const next = 归一化智库系统({ 条目: nextEntries });
    onZhikuSystemChange(next);
    await onSaveZhikuSystem(next);
    setSaveFlash(true);
    window.setTimeout(() => setSaveFlash(false), 1200);
  };

  const handleCreateCustom = async () => {
    const entry = 创建智库条目({
      标题: draft.标题,
      分类: draft.分类,
      来源: draft.来源,
      关键词: draft.关键词.split(/[,，、\n]/),
      资料类型: draft.资料类型,
      关联角色ID: draft.关联角色ID,
      关联形态ID: draft.关联形态ID,
      解锁状态: draft.解锁状态,
      剧透等级: draft.剧透等级,
      使用范围: draft.使用范围,
      外貌锚点: draft.外貌锚点,
      性格锚点: draft.性格锚点,
      说话方式: draft.说话方式,
      行为习惯: draft.行为习惯,
      关系边界: draft.关系边界,
      禁止误写: draft.禁止误写,
      注入内容: draft.注入内容,
      摘要: draft.摘要 || draft.原文.slice(0, 220),
      原文: draft.原文,
      角色故事摘要: draft.角色故事摘要,
      重要度: draft.重要度,
      可用于联动: draft.可用于联动,
      builtin: false,
    });
    if (!entry.原文.trim()) {
      setComposerError('自制资料必须填写档案原文。');
      return;
    }
    const missingInjectionFields = 获取智库注入内容缺失字段(entry);
    if (missingInjectionFields.length) {
      setComposerError(`缺少注入内容：${missingInjectionFields.join('、')}。结构化注入不完整的条目不会参与召回。`);
      return;
    }
    setComposerError('');
    const nextEntries = [entry, ...normalized.条目];
    await persist(nextEntries);
    setSelectedId(entry.id);
    setBucket('custom');
    setActiveCategory('all');
    setShowComposer(false);
    setDraft(创建空草稿(draft.分类));
  };

  const updateSelected = async (patch: Partial<智库条目>) => {
    if (!selected) return;
    const allowedRuntimePatch = selected.builtin
      ? {
          ...(patch.运行时解锁状态 !== undefined ? { 运行时解锁状态: patch.运行时解锁状态 } : {}),
          ...(patch.运行时解锁备注 !== undefined ? { 运行时解锁备注: patch.运行时解锁备注 } : {}),
        }
      : patch;
    if (selected.builtin && Object.keys(allowedRuntimePatch).length === 0) return;
    const nextEntries = normalized.条目.map((entry) =>
      entry.id === selected.id ? { ...entry, ...allowedRuntimePatch, updatedAt: Date.now() } : entry,
    );
    await persist(nextEntries);
  };

  const deleteSelected = async () => {
    if (!selected || selected.builtin) return;
    const nextEntries = normalized.条目.filter((entry) => entry.id !== selected.id);
    await persist(nextEntries);
    setSelectedId(nextEntries[0]?.id ?? null);
  };

  const collapseSpring = { type: 'spring' as const, stiffness: 320, damping: 32 };

  return (
    <div className="zk-work">
      <AnimatePresence initial={false}>
          {showComposer && (
            <motion.section
              key="composer"
              initial={reduced ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={reduced ? undefined : { height: 0, opacity: 0 }}
              transition={reduced ? { duration: 0 } : collapseSpring}
              style={{ overflow: 'hidden', flex: 'none' }}
            >
              {/* 高度上限跟视口走：矮屏上表单自己滚动，绝不去挤下方的工作区。 */}
              <div className="zk-index zk-scroll" style={{ width: '100%', maxHeight: 'min(40vh, 400px)', overflowY: 'auto' }} data-side="composer">
                <div style={{ padding: 14 }}>
                  <SectionLabel>自制内容接口</SectionLabel>
                  <p className="zk-note" style={{ marginBottom: 12 }}>
                    这里录入玩家自己整理的资料。不会污染内置内容，默认作为可编辑自制条目保存。
                  </p>
                  <div className="zk-grid">
                    <Field label="标题">
                      <input value={draft.标题} onChange={(e) => setDraft({ ...draft, 标题: e.target.value })} className="zk-input" />
                    </Field>
                    <Field label="分类">
                      <select
                        value={draft.分类}
                        onChange={(e) => {
                          const next = e.target.value as 智库分类;
                          setDraft({ ...draft, 分类: next, 注入内容: 创建空智库注入内容(next) });
                        }}
                        className="zk-input"
                      >
                        {ZHIKU_CREATE_CATEGORIES.map((cat) => <option key={cat} value={cat}>{ZHIKU_CATEGORY_LABELS[cat]}</option>)}
                      </select>
                    </Field>
                    <Field label="重要度">
                      <input type="number" min={1} max={5} value={draft.重要度} onChange={(e) => setDraft({ ...draft, 重要度: Number(e.target.value) || 3 })} className="zk-input" />
                    </Field>
                    <Field label="来源">
                      <input value={draft.来源} onChange={(e) => setDraft({ ...draft, 来源: e.target.value })} placeholder="例如：BiliWiki / 自整理" className="zk-input" />
                    </Field>
                    <Field label="关键词">
                      <input value={draft.关键词} onChange={(e) => setDraft({ ...draft, 关键词: e.target.value })} placeholder="用逗号、顿号或空格分隔" className="zk-input" />
                    </Field>
                  </div>

                  {draft.分类 === 'character' && (
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div className="zk-grid">
                        <Field label="资料类型">
                          <input value={draft.资料类型} onChange={(e) => setDraft({ ...draft, 资料类型: e.target.value })} placeholder="角色主体 / 角色形态" className="zk-input" />
                        </Field>
                        <Field label="关联角色">
                          <input value={draft.关联角色ID} onChange={(e) => setDraft({ ...draft, 关联角色ID: e.target.value })} placeholder="星 / 三月七 / 丹恒" className="zk-input" />
                        </Field>
                        <Field label="关联形态">
                          <input value={draft.关联形态ID} onChange={(e) => setDraft({ ...draft, 关联形态ID: e.target.value })} placeholder="基础形态 / 饮月 / 巡猎" className="zk-input" />
                        </Field>
                        <Field label="解锁状态">
                          <select value={draft.解锁状态} onChange={(e) => setDraft({ ...draft, 解锁状态: e.target.value })} className="zk-input">
                            <option value="">未标注</option>
                            {zhikuUnlockStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                          </select>
                        </Field>
                        <Field label="剧透等级">
                          <select value={draft.剧透等级} onChange={(e) => setDraft({ ...draft, 剧透等级: e.target.value })} className="zk-input">
                            <option value="">未标注</option>
                            {ZHIKU_SPOILER_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                          </select>
                        </Field>
                      </div>
                      <div className="zk-grid">
                        {zhikuScopeOptions.slice(0, 4).map((scope) => (
                          <label key={scope} className="zk-toggle">
                            <span className="min-w-0 truncate">{scope}</span>
                            <input
                              type="checkbox"
                              checked={draft.使用范围.includes(scope)}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? Array.from(new Set([...draft.使用范围, scope]))
                                  : draft.使用范围.filter((item) => item !== scope);
                                setDraft({ ...draft, 使用范围: next });
                              }}
                            />
                          </label>
                        ))}
                      </div>
                      <div className="zk-grid">
                        <PerformanceTextarea label="外貌锚点" value={draft.外貌锚点} editable onChange={(value) => setDraft({ ...draft, 外貌锚点: value })} />
                        <PerformanceTextarea label="性格锚点" value={draft.性格锚点} editable onChange={(value) => setDraft({ ...draft, 性格锚点: value })} />
                        <PerformanceTextarea label="说话方式" value={draft.说话方式} editable onChange={(value) => setDraft({ ...draft, 说话方式: value })} />
                        <PerformanceTextarea label="行为习惯" value={draft.行为习惯} editable onChange={(value) => setDraft({ ...draft, 行为习惯: value })} />
                        <PerformanceTextarea label="关系边界" value={draft.关系边界} editable onChange={(value) => setDraft({ ...draft, 关系边界: value })} />
                        <PerformanceTextarea label="禁止误写" value={draft.禁止误写} editable onChange={(value) => setDraft({ ...draft, 禁止误写: value })} />
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 12 }}>
                    <ToggleRow label="允许联动检索" checked={draft.可用于联动} onChange={(checked) => setDraft({ ...draft, 可用于联动: checked })} />
                  </div>

                  {draft.分类 !== 'story' && (
                    <div style={{ marginTop: 12 }}>
                      <InjectionContentFields
                        category={draft.分类}
                        value={draft.注入内容}
                        editable
                        onChange={(注入内容) => setDraft({ ...draft, 注入内容 })}
                      />
                    </div>
                  )}

                  <div className="zk-grid" style={{ marginTop: 12 }}>
                    <PerformanceTextarea label="摘要" value={draft.摘要} editable rows={4} placeholder="建议写成可检索的短摘要，留空会自动截原文前 220 字。" onChange={(value) => setDraft({ ...draft, 摘要: value })} />
                    <PerformanceTextarea label="角色故事摘要" value={draft.角色故事摘要} editable rows={5} placeholder="只压缩角色故事层 / 历史故事层；语料、表现锚点和常驻事实仍从原文结构正常注入。" onChange={(value) => setDraft({ ...draft, 角色故事摘要: value })} />
                    <PerformanceTextarea label="原文" value={draft.原文} editable rows={7} placeholder="把原文或整理好的内容贴进来。" onChange={(value) => setDraft({ ...draft, 原文: value })} />
                  </div>

                  {composerError && (
                    <div className="zk-alert" data-kind="error" role="alert" style={{ marginTop: 12 }}>{composerError}</div>
                  )}

                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <button
                      type="button"
                      onClick={() => void handleCreateCustom()}
                      disabled={!draft.标题.trim() && !draft.原文.trim()}
                      className="zk-btn zk-btn--primary"
                      style={{ flex: 1 }}
                    >
                      写入档案
                    </button>
                    <button type="button" className="zk-btn" onClick={() => setShowComposer(false)}>收起</button>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
      </AnimatePresence>

      <div className="zk-work__split">
        <aside className="zk-work__aside">
        <div className="zk-index" style={{ flex: 1, width: '100%' }}>
          <div style={{ padding: 10, flex: 'none', borderBottom: '1px solid var(--zk-hair)' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" className="zk-btn" data-active={bucket === 'custom' ? 'true' : 'false'} onClick={() => setBucket('custom')}>
                自制 {customEntries.length}
              </button>
              <button type="button" className="zk-btn" data-active={bucket === 'builtin' ? 'true' : 'false'} onClick={() => setBucket('builtin')}>
                内置 {builtinEntries.length}
              </button>
              {!showComposer && (
                <button type="button" className="zk-btn" style={{ marginLeft: 'auto' }} onClick={() => setShowComposer(true)}>
                  新建
                </button>
              )}
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索条目…"
              className="zk-input"
              style={{ marginTop: 8 }}
              aria-label="搜索条目"
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
              <button type="button" className="zk-btn" data-active={activeCategory === 'all' ? 'true' : 'false'} onClick={() => setActiveCategory('all')}>
                全部
              </button>
              {ZHIKU_CREATE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className="zk-btn"
                  data-active={activeCategory === cat ? 'true' : 'false'}
                  onClick={() => setActiveCategory(cat)}
                >
                  {ZHIKU_CATEGORY_LABELS[cat]} {counts[cat]}
                </button>
              ))}
            </div>
          </div>

          <div className="zk-entries zk-scroll" role="list">
            {activeEntries.length === 0 ? (
              <EmptyState title="没有匹配条目" hint="可在上方新建自制条目，或切到「内置」查看已有资料。" />
            ) : (
              activeEntries.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  role="listitem"
                  className="zk-entry zk-entry--plain"
                  data-active={entry.id === selected?.id ? 'true' : 'false'}
                  aria-pressed={entry.id === selected?.id}
                  onClick={() => setSelectedId(entry.id)}
                >
                  <span className="zk-entry__copy">
                    <span className="zk-entry__title">{entry.标题 || '未命名条目'}</span>
                    <span className="zk-entry__meta">
                      {ZHIKU_CATEGORY_LABELS[entry.分类]}{entry.关联角色ID?.trim() ? ` · ${entry.关联角色ID}` : ''}
                    </span>
                  </span>
                  {saveFlash && entry.id === selected?.id && <span className="zk-entry__flag">SAVED</span>}
                </button>
              ))
            )}
          </div>
        </div>
        </aside>

      <section className="zk-reader zk-editor zk-scroll" aria-label="条目编辑器">
        {selected ? (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 4 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="zk-reader__kicker">{selected.builtin ? 'BUILTIN DATA' : 'CUSTOM DATA'}</div>
                <input
                  value={selected.标题}
                  onChange={(e) => void updateSelected({ 标题: e.target.value })}
                  readOnly={selected.builtin}
                  aria-label="条目标题"
                  className="zk-editor__title"
                />
                <p className="zk-note">
                  {selected.builtin ? '内置条目只读，来自预设原著资料；可调整手动门禁。' : '自制条目编辑区，修改会即时保存到本地智库。'}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 'none' }}>
                {!selected.builtin && (
                  <button type="button" className="zk-btn zk-btn--danger" onClick={() => void deleteSelected()}>删除</button>
                )}
                {!selected.builtin && (
                  <button
                    type="button"
                    className="zk-btn"
                    onClick={() => { setDraft(创建空草稿(selected.分类)); setShowComposer(true); }}
                  >
                    再录一条
                  </button>
                )}
              </div>
            </div>

            {selected.分类 === 'character' ? (
              <StructuredCharacterFields entry={selected} editable={!selected.builtin} onUpdate={(patch) => void updateSelected(patch)} />
            ) : (
              <section className="zk-section">
                <SectionLabel>资料字段</SectionLabel>
                <div className="zk-grid">
                  <Field label="分类">
                    <select value={selected.分类} onChange={(e) => void updateSelected({ 分类: e.target.value as 智库分类 })} disabled={selected.builtin} className="zk-input">
                      {ZHIKU_CREATE_CATEGORIES.map((cat) => <option key={cat} value={cat}>{ZHIKU_CATEGORY_LABELS[cat]}</option>)}
                    </select>
                  </Field>
                  <Field label="重要度">
                    <input type="number" min={1} max={5} value={selected.重要度} onChange={(e) => void updateSelected({ 重要度: Number(e.target.value) || 3 })} readOnly={selected.builtin} className="zk-input" />
                  </Field>
                  <Field label="来源">
                    <input value={selected.来源 ?? ''} onChange={(e) => void updateSelected({ 来源: e.target.value })} readOnly={selected.builtin} className="zk-input" />
                  </Field>
                  <Field label="关键词">
                    <input value={selected.关键词.join('、')} onChange={(e) => void updateSelected({ 关键词: e.target.value.split(/[,，、\n]/).map((k) => k.trim()).filter(Boolean) })} readOnly={selected.builtin} className="zk-input" />
                  </Field>
                </div>
                <div style={{ marginTop: 12 }}>
                  <ToggleRow
                    label="允许剧情 / 周报联动检索"
                    checked={selected.可用于联动}
                    disabled={selected.builtin}
                    onChange={(checked) => void updateSelected({ 可用于联动: checked })}
                  />
                </div>
              </section>
            )}

            {selected.分类 !== 'story' && (
              <>
                {!智库条目注入内容完整(selected) && (
                  <div className="zk-alert" data-kind="warn" role="status" style={{ marginTop: 24 }}>
                    注入内容不完整，该条目不会参与主剧情召回；补齐后立即生效。
                  </div>
                )}
                <InjectionContentFields
                  category={selected.分类}
                  value={selected.注入内容}
                  editable={!selected.builtin}
                  onChange={(注入内容) => void updateSelected({ 注入内容 })}
                />
              </>
            )}

            <section className="zk-section">
              <SectionLabel>档案正文</SectionLabel>
              <div className="zk-grid">
                <PerformanceTextarea label="摘要" value={selected.摘要} editable={!selected.builtin} rows={5} onChange={(value) => void updateSelected({ 摘要: value })} />
                <PerformanceTextarea label="原文" value={selected.原文} editable={!selected.builtin} rows={10} onChange={(value) => void updateSelected({ 原文: value })} />
              </div>
            </section>
          </>
        ) : (
          <EmptyState title="先录入或选择一条资料" hint="自制条目支持新建、编辑与删除。" />
        )}
      </section>
      </div>
    </div>
  );
}
