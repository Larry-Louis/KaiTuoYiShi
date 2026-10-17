// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InputArea } from '@/components/features/Chat/InputArea';

const 八条行动 = [
  '推开门走进去',
  '先观察四周',
  '叫住她',
  '转身离开',
  '检查随身物品',
  '询问守卫',
  '找个角落坐下',
  '大声喊出暗号',
];

function 渲染输入区(actionOptions: string[]) {
  return render(
    <InputArea
      onSend={() => {}}
      onAbort={() => {}}
      loading={false}
      actionOptions={actionOptions}
      onParseActionOptions={(text) => text.split('\n').map((line) => line.trim()).filter(Boolean)}
    />,
  );
}

describe('InputArea 行动选项显示', () => {
  it('渲染全部选项，而不是只显示固定四条', () => {
    const { container } = 渲染输入区(八条行动);
    const buttons = screen.getAllByTitle('点击加入输入框，可继续微调');

    expect(buttons).toHaveLength(8);
    八条行动.forEach((option) => {
      expect(buttons.some((button) => button.textContent?.includes(option))).toBe(true);
    });
    expect(container.querySelectorAll('button[title="点击加入输入框，可继续微调"]')).toHaveLength(8);
  });

  it('选项区用自动列宽布局，列数随数量与宽度变化', () => {
    渲染输入区(八条行动.slice(0, 3));
    const firstButton = screen.getAllByTitle('点击加入输入框，可继续微调')[0];
    const optionsRow = firstButton.parentElement;

    expect(optionsRow).toHaveClass('grid');
    expect(optionsRow?.style.gridTemplateColumns).toContain('auto-fit');
  });
});
