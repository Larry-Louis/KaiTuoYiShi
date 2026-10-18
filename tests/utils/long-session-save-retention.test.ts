import { describe, expect, it } from 'vitest';
import { 创建聊天消息, 创建空解析回复 } from '@/models/chat';
import { compactChatHistoryForSave } from '@/utils/longSessionRetention';

function 助手消息(正文: string, actionOptions: string[]) {
  const parsed = 创建空解析回复();
  parsed.body = 正文;
  parsed.actionOptions = actionOptions;
  parsed.rawText = `<正文>${正文}</正文>\n<行动选项>\n${actionOptions.join('\n')}\n</行动选项>`;
  return 创建聊天消息('assistant', 正文, { parsedResponse: parsed });
}

describe('存档压缩保留继续游玩所需信息', () => {
  it('最后一条 assistant 保留行动选项和原始消息', () => {
    const saved = compactChatHistoryForSave([
      创建聊天消息('user', '推开门'),
      助手消息('门后是一条长廊。', ['走进长廊', '先观察四周']),
    ]);

    expect(saved[1].parsedResponse?.actionOptions).toEqual(['走进长廊', '先观察四周']);
    expect(saved[1].parsedResponse?.rawText).toContain('<行动选项>');
  });

  it('更早的 assistant 仍然按存档规则压缩', () => {
    const saved = compactChatHistoryForSave([
      助手消息('旧回合。', ['旧选项一', '旧选项二']),
      创建聊天消息('user', '继续'),
      助手消息('新回合。', ['新选项一', '新选项二']),
    ]);

    expect(saved[0].parsedResponse?.actionOptions).toEqual([]);
    expect(saved[0].parsedResponse?.rawText).toBe('');
    expect(saved[2].parsedResponse?.actionOptions).toEqual(['新选项一', '新选项二']);
  });
});
