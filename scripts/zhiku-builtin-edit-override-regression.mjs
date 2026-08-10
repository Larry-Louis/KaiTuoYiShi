import fs from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const panel = fs.readFileSync('components/features/GameSystems/ZhikuPanel.tsx', 'utf8');
const preset = fs.readFileSync('data/zhikuPreset.ts', 'utf8');
const model = fs.readFileSync('models/zhiku.ts', 'utf8');

// 1) 内置（原著）条目不再只读：详情面板由 EDIT 按钮门控编辑，全部条目一视同仁。
assert(
  panel.includes('const [editing, setEditing] = useState(false)') &&
    panel.includes('const editable = editing;') &&
    !panel.includes('const editable = !entry.builtin;'),
  'DetailPanel 编辑必须由 EDIT 按钮门控，且不得按 builtin 禁用。',
);
assert(
  !panel.includes('READ ONLY') &&
    !panel.includes('SWITCH CUSTOM') &&
    !panel.includes('内置条目只读'),
  '智库界面不得残留只读徽标、自制切换按钮或只读文案。',
);
assert(
  panel.includes('内置条目来自预设原著资料，可直接修改，修改会以覆写形式保存并在重启后保留；删除后重启不再恢复。'),
  '内置条目详情必须说明可直接修改并以覆写保存，且删除后重启不再恢复。',
);
assert(
  !panel.includes('内置条目只写入当前本地智库的运行时解锁覆盖'),
  '内置条目不得再宣称只写运行时解锁覆盖。',
);
assert(
  !panel.includes('onSelectCustomOnly'),
  '内置条目不得再引导切换到自制视图才能编辑。',
);

// 2.5) 角色条目详情 = 只读诊断工作台 + 可编辑全字段表单（工作台数据从条目派生，编辑后实时联动）。
assert(
  panel.includes('<CharacterProfileWorkspace entry={entry} editable={editable} onUpdate={onUpdate} />') &&
    panel.includes('<DetailMetadataForm entry={entry} editable={editable} characterMeta={characterMeta} onUpdate={onUpdate} />'),
  '角色条目必须在诊断工作台之外渲染可编辑的完整字段表单。',
);

// 2) 编辑内置条目会打上「用户内容覆写」标记，且不再丢弃内容类补丁。
assert(
  panel.includes('...(selected.builtin ? { 用户内容覆写: true } : {})'),
  'updateSelected 对内置条目修改必须标记用户内容覆写。',
);
assert(
  !panel.includes('allowedRuntimePatch') &&
    !panel.includes('patch.运行时解锁状态 !== undefined'),
  'updateSelected 不得再把内置条目限制为仅运行时解锁补丁。',
);
assert(
  panel.includes('candidate && (!candidate.builtin || candidate.用户内容覆写)'),
  '内容校验必须同样作用于被覆写的内置条目。',
);

// 3) 持久化：覆写过的内置条目完整落盘，未覆写的内置条目保持轻量（只存运行时解锁）。
assert(
  preset.includes('!entry.builtin || Boolean(entry.运行时解锁状态 || entry.运行时解锁备注) || entry.用户内容覆写') &&
    preset.includes('if (entry.用户内容覆写) return entry;') &&
    preset.includes('摘要:') &&
    preset.includes('原文:') &&
    preset.includes('关键词: []'),
  'buildPersistedZhikuSystem 必须全量保存覆写过的内置条目，其余内置条目保持 slim。',
);

// 4) 重启合并：按身份 ID 把用户覆写内容应用到预设条目，身份与来源字段仍以预设为准。
assert(
  preset.includes('export function mergeZhikuContentOverrides(') &&
    preset.includes('if (!entry.builtin) continue;') &&
    preset.includes('if (entry.用户内容覆写) {') &&
    preset.includes('id: entry.id,') &&
    preset.includes('builtin: true,') &&
    preset.includes('mergeZhikuContentOverrides(') &&
    preset.includes('mergeZhikuRuntimeUnlockOverrides(bundledSystem.条目, currentEntries)'),
  'mergeBundledZhikuSystem 必须按身份匹配应用内容覆写，并保留内置身份与来源。',
);
assert(
  preset.includes('...mergeZhikuContentOverrides(') &&
    preset.includes('...customEntries,'),
  '覆写条目必须保留在内置区（不得混入自制区造成重复）。',
);

// 5) 模型层：字段与归一化保留。
assert(
  model.includes('用户内容覆写?: boolean;') &&
    model.includes('用户内容覆写: entry.用户内容覆写 === true'),
  '智库条目模型必须声明并归一化用户内容覆写字段。',
);

// 6) 内置条目删除：本地移除 + 删除标记落盘，重启合并不再恢复。
assert(
  panel.includes('已删除: true,') &&
    panel.includes('用户内容覆写: true,') &&
    panel.includes('buildPersistedZhikuSystem({ ...normalized, 条目: [...nextEntries, deletedEntry] })'),
  'deleteSelected 对内置条目必须写入删除标记（已删除 + 用户内容覆写）并单独持久化。',
);
assert(
  !panel.includes('if (!selected || selected.builtin) return;'),
  'deleteSelected 不得再拒绝删除内置条目。',
);
assert(
  panel.includes('删除后重启不再恢复'),
  '内置条目详情文案必须说明删除后重启不再恢复。',
);
assert(
  !panel.includes('{!entry.builtin && (') &&
    !panel.includes('{!entry.builtin &&\n            <button'),
  '详情面板删除按钮不得再按 builtin 隐藏。',
);
assert(
  preset.includes('const deletedById = new Set<string>();') &&
    preset.includes('if (entry.已删除) {') &&
    preset.includes('.filter((entry) => !获取智库条目身份ID(entry).some((id) => deletedById.has(id)))'),
  'mergeZhikuContentOverrides 必须把已删除的内置条目从预设结果中过滤掉。',
);
assert(
  model.includes('已删除?: boolean;') &&
    model.includes('已删除: entry.已删除 === true'),
  '智库条目模型必须声明并归一化已删除字段。',
);
assert(
  panel.includes('loadSetting<智库系统>(世界存储键(\'zhikuSystem\', worldId ?? DEFAULT_WORLD_ID))') ||
    panel.includes('loadSetting<智库系统>(世界存储键("zhikuSystem", worldId ?? DEFAULT_WORLD_ID))'),
  'DEV 刷新内置必须基于持久化数据合并，保留已删除标记。',
);

console.log('ZHIKU_BUILTIN_EDIT_OVERRIDE_REGRESSION_OK');
