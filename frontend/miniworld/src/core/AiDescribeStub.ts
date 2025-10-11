export interface DescribeTarget { // 定义输入对象接口
  type: string; // 资源类型字段
  path: string; // 资源路径字段
} // 接口结束

function extractFileName(path: string): string { // 提取文件名的辅助函数
  const segments = path.split('/'); // 使用斜杠分割路径
  return segments[segments.length - 1] ?? path; // 返回最后一段或原路径
} // 函数结束

function describeDomain(type: string, path: string): string { // 根据类型与路径生成域描述
  if (type === 'audio' || /\/audio\//.test(path)) { // 判断是否属于音频
    return '音频'; // 返回音频描述
  } // 条件结束
  return '图像'; // 默认归类为图像
} // 函数结束

function describeCategory(type: string): string { // 根据细分类型生成说明
  if (type.includes('bgm')) { // 如果含有bgm标签
    return '背景音乐'; // 返回背景音乐说明
  } // 条件结束
  if (type.includes('se') || type.includes('sfx')) { // 判断音效
    return '音效'; // 返回音效说明
  } // 条件结束
  if (type.includes('character') || type.includes('actor')) { // 判断角色图像
    return '角色立绘或行走图'; // 返回角色说明
  } // 条件结束
  if (type.includes('ui')) { // 判断UI资源
    return '界面元素'; // 返回UI说明
  } // 条件结束
  return '通用素材'; // 默认说明
} // 函数结束

export class AiDescribeStub { // 定义AI描述占位类
  public async suggestDescription(item: DescribeTarget): Promise<string> { // 提供异步描述方法
    const fileName = extractFileName(item.path); // 获取文件名
    const domain = describeDomain(item.type, item.path); // 获取域描述
    const category = describeCategory(item.type); // 获取类别说明
    const baseName = fileName.replace(/\.[^.]+$/, ''); // 去掉扩展名
    return `${domain}（${category}）：${fileName} —— 适用于${baseName}相关的场景`; // 返回组合描述
  } // 方法结束
} // 类结束
