import { describe, expect, it } from 'vitest';
import { parseActionOptionsBlock, parseResponse } from '@/services/ai/responseParser';

const 八条行动 = Array.from({ length: 8 }, (_, index) => `${index + 1}. 第${index + 1}个行动`);

describe('行动选项解析：有多少保留多少', () => {
  it('解析块不再把选项截断到固定条数', () => {
    expect(parseActionOptionsBlock(八条行动.join('\n'))).toEqual(
      八条行动.map((_, index) => `第${index + 1}个行动`),
    );
  });

  it('parseResponse 把完整选项列表交给前端', () => {
    const raw = [
      '<正文>正文内容</正文>',
      '<行动选项>',
      ...八条行动,
      '</行动选项>',
    ].join('\n');

    expect(parseResponse(raw).actionOptions).toHaveLength(8);
  });
});
