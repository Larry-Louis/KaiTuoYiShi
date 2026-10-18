import { describe, expect, it } from 'vitest';
import {
  buildRequiredTagRetryGuard,
  取缺失必需标签,
  解析必需标签,
} from '@/hooks/useGame/mainResponseProtocol';

describe('正文格式校验：必需标签', () => {
  it('解析标签时兼容尖括号、斜杠、逗号、分号和换行', () => {
    expect(解析必需标签('<正文>\n<短期记忆>；正文, </动态世界> <思考>')).toEqual([
      '正文', '短期记忆', '动态世界', '思考',
    ]);
  });

  it('忽略空白与非法片段，并对标签名去重', () => {
    expect(解析必需标签('正文, 正文, < >, <bad tag>, /')).toEqual(['正文']);
    expect(解析必需标签('')).toEqual([]);
  });

  it('只报告原始输出里缺失的开标签', () => {
    const raw = '<正文>正文</正文>\n<短期记忆>摘要</短期记忆>\n<动态世界 类型="事件">下雨</动态世界>';
    expect(取缺失必需标签(raw, ['正文', '短期记忆', '动态世界', '变量草稿'])).toEqual(['变量草稿']);
  });

  it('重写指令点名缺失标签，要求整段重写', () => {
    const guard = buildRequiredTagRetryGuard(['动态世界']);
    expect(guard).toContain('<动态世界>');
    expect(guard).toContain('完全重写');
  });
});
