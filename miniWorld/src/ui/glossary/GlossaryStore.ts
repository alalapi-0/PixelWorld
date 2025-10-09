import Phaser from 'phaser'; // 引入Phaser框架
import sampleData from './glossary.sample.json'; // 引入示例数据
// 分隔注释 // 保持行有注释
export interface GlossaryCategory { id: string; name: string; } // 定义分类结构
export interface GlossaryEntry { id: string; cat: string; name: string; desc: string; img?: string; } // 定义词条结构
interface GlossaryFile { categories: GlossaryCategory[]; entries: GlossaryEntry[]; } // 定义文件结构
// 分隔注释 // 保持行有注释
let categories: GlossaryCategory[] = []; // 保存分类列表
let entries: GlossaryEntry[] = []; // 保存词条列表
let loaded = false; // 标记是否已加载
// 分隔注释 // 保持行有注释
async function tryLoadExternal(): Promise<GlossaryFile | null> { // 尝试加载外部JSON
  if (typeof fetch !== 'function') { // 如果环境不支持fetch
    return null; // 返回空
  } // 条件结束
  try { // 捕获加载异常
    const response = await fetch('glossary/glossary.sample.json', { cache: 'no-cache' }); // 请求外部文件
    if (!response.ok) { // 如果返回失败
      return null; // 返回空
    } // 条件结束
    const data = (await response.json()) as GlossaryFile; // 解析JSON
    return data; // 返回解析结果
  } catch (error) { // 捕获异常
    console.warn('[GlossaryStore] 外部图鉴读取失败', error); // 输出警告
    return null; // 返回空
  } // 异常结束
} // 函数结束
// 分隔注释 // 保持行有注释
function assignData(data: GlossaryFile): void { // 将数据写入内部缓存
  categories = [...data.categories]; // 复制分类
  entries = [...data.entries]; // 复制词条
  loaded = true; // 标记已加载
} // 函数结束
// 分隔注释 // 保持行有注释
export async function loadGlossary(_: Phaser.Scene): Promise<void> { // 对外暴露的加载函数
  if (loaded) { // 如果已经加载
    return; // 不重复处理
  } // 条件结束
  const external = await tryLoadExternal(); // 尝试外部加载
  if (external) { // 如果成功
    assignData(external); // 写入外部数据
    return; // 结束
  } // 条件结束
  assignData(sampleData as GlossaryFile); // 使用示例数据
} // 函数结束
// 分隔注释 // 保持行有注释
export function getCategories(): GlossaryCategory[] { // 获取分类列表
  return categories.map((cat) => ({ ...cat })); // 返回拷贝数组
} // 函数结束
// 分隔注释 // 保持行有注释
export function getEntriesByCat(catId: string): GlossaryEntry[] { // 根据分类获取词条
  return entries.filter((entry) => entry.cat === catId).map((entry) => ({ ...entry })); // 筛选并拷贝
} // 函数结束
// 分隔注释 // 保持行有注释
export function __resetGlossaryStore(): void { // 提供测试用重置函数
  categories = []; // 清空分类
  entries = []; // 清空词条
  loaded = false; // 重置加载标记
} // 函数结束
