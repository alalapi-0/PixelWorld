import { readFile } from 'node:fs/promises'; // 引入文件读取能力
import path from 'node:path'; // 引入路径工具
import { fileURLToPath } from 'node:url'; // 引入URL转文件路径方法
import { afterEach, vi } from 'vitest'; // 引入测试工具
vi.mock('phaser3spectorjs', () => ({}), { virtual: true }); // 虚拟化调试器依赖
// 空行占位注释
declare global { // 声明全局接口
  // eslint-disable-next-line no-var
  var navigator: { userAgent: string }; // 定义全局navigator类型
  // eslint-disable-next-line no-var
  var window: typeof globalThis; // 定义全局window类型
  // eslint-disable-next-line no-var
  var document: { createElement: () => { style: Record<string, unknown> }; body: { style: Record<string, unknown> }; addEventListener: () => void; removeEventListener: () => void }; // 定义全局document类型
} // 声明结束
// 空行占位注释
if (typeof globalThis.navigator === 'undefined') { // 若环境未定义navigator
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'vitest' }, configurable: true }); // 注入简易navigator
} // 条件结束
if (typeof globalThis.window === 'undefined') { // 若环境未定义window
  Object.defineProperty(globalThis, 'window', { value: globalThis, configurable: true }); // 注入全局window
} // 条件结束
if (typeof globalThis.document === 'undefined') { // 若环境未定义document
  const fakeDocument = { createElement: () => ({ style: {} }), body: { style: {} }, addEventListener: () => undefined, removeEventListener: () => undefined }; // 构造伪造document
  Object.defineProperty(globalThis, 'document', { value: fakeDocument, configurable: true }); // 注入伪造document
} // 条件结束
// 空行占位注释
const originalFetch = globalThis.fetch?.bind(globalThis); // 绑定原始fetch引用
const absoluteSchemeReg = /^[a-zA-Z][a-zA-Z\d+\-.]*:/; // 定义匹配绝对URL的正则
const setupDir = path.dirname(fileURLToPath(import.meta.url)); // 计算当前文件目录
const projectRoot = path.resolve(setupDir, '..'); // 推导前端项目根目录
const contentTypeMap: Record<string, string> = { '.json': 'application/json', '.txt': 'text/plain', '.md': 'text/markdown' }; // 定义扩展名对应的内容类型
const fallbackContentType = 'text/plain'; // 默认内容类型
const resolveTargetUrl = (input: RequestInfo | URL): string => { // 定义工具函数解析请求目标
  if (typeof input === 'string') { // 若请求是字符串
    return input; // 直接返回字符串
  } // 条件结束
  if (input instanceof URL) { // 若请求是URL对象
    return input.href; // 返回绝对字符串
  } // 条件结束
  if (typeof Request !== 'undefined' && input instanceof Request) { // 若请求是Request实例
    return input.url; // 返回请求URL
  } // 条件结束
  const potential = (input as { url?: string }).url; // 读取可选url属性
  return potential ?? String(input); // 返回属性或字符串化
}; // 工具函数结束
const candidateRoots = [projectRoot, path.resolve(projectRoot, '..'), path.resolve(projectRoot, '..', '..')]; // 预设多级查找根目录
const loadLocalFile = async (targetPath: string): Promise<Response> => { // 定义读取本地文件的辅助函数
  let lastError: unknown = null; // 记录最后一次错误
  for (const root of candidateRoots) { // 遍历候选根目录
    const absolutePath = path.resolve(root, targetPath); // 拼接绝对路径
    try { // 尝试读取
      const data = await readFile(absolutePath); // 异步读取文件
      const ext = path.extname(absolutePath).toLowerCase(); // 获取扩展名
      const contentType = contentTypeMap[ext as keyof typeof contentTypeMap] ?? fallbackContentType; // 匹配内容类型
      return new Response(data, { status: 200, headers: { 'Content-Type': contentType } }); // 成功时返回响应
    } catch (error) { // 捕获异常
      lastError = error; // 更新最后一次错误
    } // 条件结束
  } // 循环结束
  console.error('[test setup] mock fetch failed', targetPath, lastError); // 所有尝试均失败时输出日志
  return new Response('Not Found', { status: 404 }); // 返回404响应
}; // 函数结束
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => { // 重写全局fetch函数
  const target = resolveTargetUrl(input); // 解析请求目标
  if (!absoluteSchemeReg.test(target)) { // 若为相对路径
    return loadLocalFile(target); // 返回本地文件响应
  } // 条件结束
  if (originalFetch) { // 若存在原始fetch
    return originalFetch(input as RequestInfo, init); // 调用原始实现
  } // 条件结束
  throw new Error('Fetch API is not available in this environment'); // 抛出不可用错误
}; // 函数结束
// 空行占位注释
if (typeof HTMLCanvasElement !== 'undefined') { // 若存在canvas元素
  HTMLCanvasElement.prototype.getContext = () => ({ // 定义上下文桩
    fillStyle: '', // 填充色属性
    createLinearGradient: () => ({ addColorStop: () => undefined }), // 线性渐变桩
    fillRect: () => undefined, // 填充矩形桩
    getImageData: () => ({ data: new Uint8ClampedArray(4) }), // 返回透明像素
    putImageData: () => undefined, // 写入像素桩
    drawImage: () => undefined, // 绘制图像桩
  }); // 返回桩对象
} // 条件结束
// 空行占位注释
afterEach(() => { // 保持钩子但无需操作
  return; // 注释占位
}); // 钩子结束
