import type { 智库条目 } from '@/models/zhiku';
import { Field, PerformanceTextarea, SectionLabel, StructuredFlag } from './fields';
import { zhikuScopeOptions, zhikuUnlockStatuses, ZHIKU_SPOILER_LEVELS } from './constants';

export function StructuredCharacterFields({
  entry,
  editable,
  onUpdate,
}: {
  entry: 智库条目;
  editable: boolean;
  onUpdate: (patch: Partial<智库条目>) => void;
}) {
  const displayedUnlock = entry.运行时解锁状态 ?? entry.解锁状态;
  const updateUnlock = (status: string) => {
    onUpdate(entry.builtin ? { 运行时解锁状态: status } : { 解锁状态: status });
  };
  const updateScope = (scope: string, checked: boolean) => {
    const current = entry.使用范围 ?? [];
    const next = checked
      ? Array.from(new Set([...current, scope]))
      : current.filter((item) => item !== scope);
    onUpdate({ 使用范围: next });
  };

  return (
    <div className="zn-section">
      <SectionLabel>结构字段</SectionLabel>
      <div className="zn-form-grid">
        <Field label="资料类型">
          <input value={entry.资料类型 ?? ''} onChange={(e) => onUpdate({ 资料类型: e.target.value })} readOnly={!editable} className="tn-input" placeholder="角色主体 / 角色形态" />
        </Field>
        <Field label="关联角色">
          <input value={entry.关联角色ID ?? ''} onChange={(e) => onUpdate({ 关联角色ID: e.target.value })} readOnly={!editable} className="tn-input" />
        </Field>
        <Field label="关联形态">
          <input value={entry.关联形态ID ?? ''} onChange={(e) => onUpdate({ 关联形态ID: e.target.value })} readOnly={!editable} className="tn-input" />
        </Field>
        <Field label="解锁状态">
          <select value={displayedUnlock ?? ''} onChange={(e) => updateUnlock(e.target.value)} disabled={!editable && !entry.builtin} className="tn-input">
            <option value="">未标注</option>
            {zhikuUnlockStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </Field>
        <Field label="剧透等级">
          <select value={entry.剧透等级 ?? ''} onChange={(e) => onUpdate({ 剧透等级: e.target.value })} disabled={!editable} className="tn-input">
            <option value="">未标注</option>
            {ZHIKU_SPOILER_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
          </select>
        </Field>
        <Field label="首次可用剧情段">
          <input value={entry.首次可用剧情段 ?? ''} onChange={(e) => onUpdate({ 首次可用剧情段: e.target.value })} readOnly={!editable} className="tn-input" />
        </Field>
        <Field label="关联剧情分段ID">
          <input value={entry.关联剧情分段ID ?? ''} onChange={(e) => onUpdate({ 关联剧情分段ID: e.target.value })} readOnly={!editable} className="tn-input" />
        </Field>
        <Field label="解锁条件">
          <input value={entry.解锁条件 ?? ''} onChange={(e) => onUpdate({ 解锁条件: e.target.value })} readOnly={!editable} className="tn-input" />
        </Field>
      </div>

      <div className="mt-4">
        <div className="zn-field__label">使用范围</div>
        <div className="zn-form-grid">
          {zhikuScopeOptions.map((scope) => (
            <label key={scope} className="zn-toggle">
              <span className="min-w-0 truncate">{scope}</span>
              <input
                type="checkbox"
                checked={(entry.使用范围 ?? []).includes(scope)}
                onChange={(e) => updateScope(scope, e.target.checked)}
                disabled={!editable}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="zn-field__label">手动门禁</div>
        <div className="flex flex-wrap gap-2">
          {zhikuUnlockStatuses.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => updateUnlock(status)}
              disabled={!editable && !entry.builtin}
              aria-pressed={displayedUnlock === status}
              className={displayedUnlock === status ? 'tn-btn tn-btn-accent' : 'tn-btn'}
            >
              {status}
            </button>
          ))}
        </div>
        <p className="zn-note">
          自制条目会修改资料字段；内置条目只写入当前本地智库的运行时解锁覆盖，不改内置原文。
        </p>
      </div>

      <div className="zn-section">
        <SectionLabel>范围继承</SectionLabel>
        <div className="zn-form-grid">
          <StructuredFlag label="主剧情注入" checked={entry.可否主剧情注入} editable={editable} onChange={(checked) => onUpdate({ 可否主剧情注入: checked })} />
          <StructuredFlag label="手机使用" checked={entry.可否手机使用} editable={editable} onChange={(checked) => onUpdate({ 可否手机使用: checked })} />
          <StructuredFlag label="新闻使用" checked={entry.可否新闻使用} editable={editable} onChange={(checked) => onUpdate({ 可否新闻使用: checked })} />
          <StructuredFlag label="变量参考" checked={entry.可否变量参考} editable={editable} onChange={(checked) => onUpdate({ 可否变量参考: checked })} />
        </div>
      </div>

      <div className="zn-section">
        <SectionLabel>人物摘要与表现结构</SectionLabel>
        <div className="zn-form-grid">
          <PerformanceTextarea label="角色故事摘要" value={entry.角色故事摘要 ?? ''} editable={editable} rows={4} onChange={(value) => onUpdate({ 角色故事摘要: value })} />
        </div>
        <p className="zn-note">
          仅替代角色故事层 / 历史故事层注入；语料层、表现锚点层和常驻事实层仍按原文正常读取。
        </p>
        <div className="zn-form-grid mt-3">
          <PerformanceTextarea label="外貌锚点" value={entry.外貌锚点 ?? ''} editable={editable} onChange={(value) => onUpdate({ 外貌锚点: value })} />
          <PerformanceTextarea label="性格锚点" value={entry.性格锚点 ?? ''} editable={editable} onChange={(value) => onUpdate({ 性格锚点: value })} />
          <PerformanceTextarea label="说话方式" value={entry.说话方式 ?? ''} editable={editable} onChange={(value) => onUpdate({ 说话方式: value })} />
          <PerformanceTextarea label="行为习惯" value={entry.行为习惯 ?? ''} editable={editable} onChange={(value) => onUpdate({ 行为习惯: value })} />
          <PerformanceTextarea label="关系边界" value={entry.关系边界 ?? ''} editable={editable} onChange={(value) => onUpdate({ 关系边界: value })} />
          <PerformanceTextarea label="禁止误写" value={entry.禁止误写 ?? ''} editable={editable} onChange={(value) => onUpdate({ 禁止误写: value })} />
        </div>
      </div>
    </div>
  );
}
