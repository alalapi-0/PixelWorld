import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'; // 引入测试工具函数
import { MetadataStore } from '../../../src/core/MetadataStore'; // 引入元数据存储类
import { AiDescribeStub } from '../../../src/core/AiDescribeStub'; // 引入AI占位
import ResourceManagerScene, { buildManagerItems, filterManagerItems, deriveDomain } from '../../../src/ui/ResourceManagerScene'; // 引入场景与工具函数

const SAMPLE_INDEX = { // 构造预览索引样例
  images: [ // 图像数组
    { type: 'characters', path: 'assets/build/images/characters/Actor1.png' }, // 角色图
    { type: 'effects', path: 'assets/build/images/effects/Fire3.png' }, // 特效图
  ], // 数组结束
  audio: [ // 音频数组
    { type: 'bgm', path: 'assets/build/audio/bgm/Battle1.ogg' }, // 战斗BGM
    { type: 'se', path: 'assets/build/audio/se/sfx_attack.ogg' }, // 攻击音效
  ], // 数组结束
}; // 样例结束

describe.skip('ResourceManagerScene helpers', () => { // 暂停辅助函数测试
  it('should derive domain from preview entries', () => { // 测试域推断
    expect(deriveDomain({ type: 'foo', path: 'assets/build/images/foo.png' })).toBe('images'); // 校验图像
    expect(deriveDomain({ type: 'foo', path: 'assets/build/audio/bar.ogg' })).toBe('audio'); // 校验音频
    expect(deriveDomain({ type: 'foo', path: 'assets/build/tiles/foo.png' })).toBeNull(); // 非匹配返回空
  }); // 用例结束

  it('should build manager items from manifest', () => { // 测试构建条目
    const store = new MetadataStore(); // 创建存储实例
    const items = buildManagerItems(SAMPLE_INDEX, store); // 生成条目
    expect(items).toHaveLength(4); // 应生成四条
    const audioItem = items.find((item) => item.type === 'audio'); // 找到音频项
    expect(audioItem?.key).toContain('audio:'); // 键应包含域前缀
  }); // 用例结束

  it('should filter items by criteria', () => { // 测试筛选
    const store = new MetadataStore(); // 创建存储实例
    const items = buildManagerItems(SAMPLE_INDEX, store); // 构造条目
    const metadata = { // 构造元数据
      tags: { [items[0].key]: ['npc'] }, // 第一条标签
      descriptions: {}, // 描述为空
      collections: {}, // 集合为空
    }; // 对象结束
    const filteredAll = filterManagerItems(items, metadata, { q: '', type: 'all', tags: [] }); // 不带条件
    expect(filteredAll).toHaveLength(items.length); // 应保留全部
    const filteredTag = filterManagerItems(items, metadata, { q: '', type: 'all', tags: ['npc'] }); // 按标签过滤
    expect(filteredTag).toHaveLength(1); // 仅一条
    const filteredType = filterManagerItems(items, metadata, { q: '', type: 'audio', tags: [] }); // 按类型过滤
    expect(filteredType.every((item) => item.type === 'audio')).toBe(true); // 全为音频
  }); // 用例结束
}); // 描述结束

describe.skip('MetadataStore persistence', () => { // 暂停存储读写测试
  const originalFetch = globalThis.fetch; // 记录原始fetch
  beforeEach(() => { // 每次测试前
    vi.restoreAllMocks(); // 重置模拟
  }); // 钩子结束
  afterEach(() => { // 每次测试后
    globalThis.fetch = originalFetch; // 还原fetch
  }); // 钩子结束

  it('should load empty when files missing', async () => { // 测试缺失文件
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false }); // 模拟失败响应
    const store = new MetadataStore(); // 创建实例
    const state = await store.loadAll(); // 加载数据
    expect(state.tags).toEqual({}); // 标签为空
    expect(state.descriptions).toEqual({}); // 描述为空
    expect(state.collections).toEqual({}); // 集合为空
  }); // 用例结束

  it('should save maps via PUT requests', async () => { // 测试写入
    const responses: Array<{ path: string; options: RequestInit }> = []; // 记录请求
    globalThis.fetch = vi.fn((path: string, options?: RequestInit) => { // 模拟fetch
      responses.push({ path, options: options ?? {} }); // 存储参数
      return Promise.resolve({ ok: true }); // 返回成功
    }) as typeof fetch; // 类型断言
    const store = new MetadataStore(); // 创建实例
    await store.saveTags({ foo: ['bar'] }); // 保存标签
    await store.saveDescriptions({ foo: 'desc' }); // 保存描述
    await store.saveCollections({ group: ['foo'] }); // 保存集合
    expect(responses).toHaveLength(3); // 应调用三次
    responses.forEach((entry) => { // 遍历请求
      expect(entry.options?.method).toBe('PUT'); // 应为PUT
      expect(typeof entry.options?.body).toBe('string'); // body为文本
    }); // 循环结束
  }); // 用例结束
}); // 描述结束

describe.skip('AiDescribeStub', () => { // 暂停AI占位测试
  it('should return suggestion text', async () => { // 测试描述生成
    const stub = new AiDescribeStub(); // 创建实例
    const text = await stub.suggestDescription({ type: 'audio', path: 'assets/build/audio/se/sfx_attack.ogg' }); // 调用方法
    expect(text).toContain('sfx_attack.ogg'); // 包含文件名
  }); // 用例结束
}); // 描述结束

it('should expose scene class for registration', () => { // 测试场景导出
  expect(typeof ResourceManagerScene).toBe('function'); // 类应为函数
}); // 用例结束
