import type { 智库分类, 智库注入内容 } from '@/models/zhiku';
import {
  创建空智库注入内容,
  归一化智库注入内容,
  ZHIKU_CHARACTER_INJECTION_FIELDS,
  ZHIKU_LORE_INJECTION_FIELDS,
} from '@/models/zhiku';
import { PerformanceTextarea, SectionLabel } from './fields';

interface InjectionContentFieldsProps {
  category: 智库分类;
  value?: 智库注入内容;
  editable: boolean;
  onChange: (next: 智库注入内容) => void;
}

function readField(content: 智库注入内容, field: string): string {
  const record = content as unknown as Record<string, string>;
  return typeof record[field] === 'string' ? record[field] : '';
}

export function InjectionContentFields({ category, value, editable, onChange }: InjectionContentFieldsProps) {
  const normalized = 归一化智库注入内容(value, category) ?? 创建空智库注入内容(category);
  if (!normalized) return null;
  const fields = normalized.类型 === 'character'
    ? ZHIKU_CHARACTER_INJECTION_FIELDS
    : ZHIKU_LORE_INJECTION_FIELDS;

  return (
    <div className="zn-section">
      <SectionLabel>注入内容</SectionLabel>
      <p className="zn-note mb-3">
        结构化注入是召回时真正送给模型的内容；任一字段为空，该条目都不会参与主剧情注入。
      </p>
      <div className="zn-form-grid">
        {fields.map((field) => (
          <PerformanceTextarea
            key={field}
            label={field}
            value={readField(normalized, field)}
            editable={editable}
            onChange={(next) => onChange({ ...normalized, [field]: next })}
          />
        ))}
      </div>
    </div>
  );
}
