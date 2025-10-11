import type { ResourcePreviewItem } from '../ui/ResourcePreviewPanel'; // 引入现有类型以复用路径结构

export type MetadataTagMap = Record<string, string[]>; // 定义标签映射类型
export type MetadataDescriptionMap = Record<string, string>; // 定义描述映射类型
export type MetadataCollectionMap = Record<string, string[]>; // 定义集合映射类型

export interface StoreState { // 定义整体存储状态接口
  tags: MetadataTagMap; // 标签数据
  descriptions: MetadataDescriptionMap; // 描述数据
  collections: MetadataCollectionMap; // 集合数据
} // 接口结束

const TAGS_PATH = 'assets/metadata/tags.json'; // 标签文件路径常量
const DESCRIPTIONS_PATH = 'assets/metadata/descriptions.json'; // 描述文件路径常量
const COLLECTIONS_PATH = 'assets/metadata/collections.json'; // 集合文件路径常量

async function readJson<T>(path: string): Promise<T | null> { // 封装读取JSON的函数
  try { // 捕获网络异常
    const response = await fetch(path, { method: 'GET', cache: 'no-cache' }); // 以GET读取文本JSON
    if (!response.ok) { // 判断状态码
      return null; // 失败时返回空
    }
    return (await response.json()) as T; // 成功时解析JSON
  } catch (error) { // 捕获错误
    console.warn(`MetadataStore readJson ${path} failed`, error); // 控制台提示读取失败
    return null; // 出错时返回空
  }
} // 函数结束

async function writeJson(path: string, data: unknown): Promise<void> { // 封装写入JSON的函数
  const body = JSON.stringify(data, null, 2); // 将数据序列化为带缩进的字符串
  const response = await fetch(path, { // 通过fetch发送PUT请求
    method: 'PUT', // 采用PUT以覆盖文件
    headers: { 'Content-Type': 'application/json' }, // 指定内容类型
    body, // 携带文本内容
  });
  if (!response.ok) { // 判断请求是否成功
    throw new Error(`Failed to write ${path}: HTTP ${response.status}`); // 抛出错误供上层捕获
  }
} // 函数结束

export class MetadataStore { // 定义元数据存取类
  public async loadAll(): Promise<StoreState> { // 统一加载全部文件
    const [tags, descriptions, collections] = await Promise.all([ // 并行请求三个文件
      readJson<MetadataTagMap>(TAGS_PATH), // 读取标签
      readJson<MetadataDescriptionMap>(DESCRIPTIONS_PATH), // 读取描述
      readJson<MetadataCollectionMap>(COLLECTIONS_PATH), // 读取集合
    ]); // Promise结束
    return { // 组装返回对象
      tags: tags ?? {}, // 若缺失则回退空对象
      descriptions: descriptions ?? {}, // 同上
      collections: collections ?? {}, // 同上
    }; // 返回存储状态
  } // 方法结束

  public async saveTags(map: MetadataTagMap): Promise<void> { // 保存标签
    await writeJson(TAGS_PATH, map); // 调用统一写入方法
  } // 方法结束

  public async saveDescriptions(map: MetadataDescriptionMap): Promise<void> { // 保存描述
    await writeJson(DESCRIPTIONS_PATH, map); // 调用统一写入方法
  } // 方法结束

  public async saveCollections(map: MetadataCollectionMap): Promise<void> { // 保存集合
    await writeJson(COLLECTIONS_PATH, map); // 调用统一写入方法
  } // 方法结束

  public keyOf(item: { type: string; path: string } | ResourcePreviewItem): string { // 根据条目生成唯一键
    const domain = this.detectDomain(item); // 判定资源所属域
    const relative = this.stripPrefix(item.path); // 去除assets/build前缀
    return `${domain}:${relative}`; // 拼接键值
  } // 方法结束

  private detectDomain(item: { type: string; path: string }): 'images' | 'audio' { // 推断域名
    if (item.type === 'audio' || /\/audio\//.test(item.path)) { // 如果类型为音频或路径含audio
      return 'audio'; // 返回音频域
    } // 条件结束
    return 'images'; // 默认归类到图像域
  } // 方法结束

  private stripPrefix(path: string): string { // 去除公共路径前缀
    return path.replace(/^assets\/build\//, ''); // 移除assets/build/，保持统一
  } // 方法结束
} // 类结束
