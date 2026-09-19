# AGENTS.md

## 优先级与授权

User 当前请求优先，其次是本文件，再次是任务相关 skill，最后是参考文档。User 明确要求执行时直接执行；未明确要求修改时默认只读。细节缺失时由 Codex 依据上下文补全；仅在可能造成重大、不可逆或范围扩大的结果时暂停确认。无关脏改动和未跟踪文件必须保留。

## 背景

这是一个 React 19、TypeScript、Vite 的客户端叙事游戏。游戏数据和设置主要保存到 IndexedDB，模型调用使用 User 配置的 API 接口。

- `App.tsx` 组合界面。
- `hooks/useGame.ts` 提供界面动作。
- `hooks/useGameState.ts` 管理顶层状态和启动恢复。
- `hooks/useGame/sendWorkflow.ts` 编排主剧情回合。
- `models/`、`services/`、`utils/` 分别承载数据结构、领域操作和状态转换。

需要当前架构事实时阅读 [`ideal_design.md`](ideal_design.md)。需要长期目标时阅读 [`kernelization.md`](kernelization.md)。历史 prompt、report 和 audit 不属于当前规范。

## 工作流程

先读取本文件和任务直接相关的代码、`CONTEXT.md` 与 ADR。按任务需要自行决定是否运行测试、构建、服务器、浏览器或子代理。使用仓库现有工具和 `pnpm`。

## 工程约定

匹配现有领域命名和导入方式。领域逻辑放在 hooks、services、models 或 utils。持久化结构变更保留迁移路径，并同步检查保存、恢复、快照和压缩链路。日志使用 `utils/devLog.ts`。测试验证行为，不绑定实现细节。

## 常见错误

- **以 "established" 为由**：本仓库充斥已成惯例的垃圾逻辑，既有实现不构成正当性。遇到难以判断的案例，读 `kernelization.md`、使用 good-taste skill，或直接问 User；不要把现有代码当作依据。
- **React UI 越界**：UI 应当是引擎逻辑的纯投影（现状未必如此，但这是目标）。它只能使用自己已定义的服务和 hooks，直接触碰 IndexedDB 之类的东西即视为违规。
- **"patchy"**：不打补丁式的局部修补，UI 上尤其如此。
- **"self-comfort"**：`tsc` 和 `vitest` 通过不构成任何证据，自己新写的测试尤其不算。要验证就让另一个 agent 写对抗性测试，且不告诉它你想测什么。UI 更弱：有 jsdom 也只是很弱的测试。

## 文档与交付

`CONTEXT.md` 描述领域词汇，`docs/adr/` 记录架构决策，`docs/agents/` 记录协作流程；`ideal_design.md` 和 `kernelization.md` 是架构参考，不是代理命令。Skill 只补充专业流程，不得改变本文件的优先级或授权模型。交付报告变更文件、事实依据、验证范围、未验证项、风险和未提交改动。

## Agent skills

### Issue tracker

Issues are tracked on GitHub via the `gh` CLI. External PRs are not a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
