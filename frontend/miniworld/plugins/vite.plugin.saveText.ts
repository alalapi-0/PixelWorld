// 引入Node模块以实现文本写入与路径校验
import type { Plugin } from 'vite'; // 引入Vite插件类型定义
import path from 'path'; // 引入路径处理模块
import fs from 'fs/promises'; // 引入文件系统Promise接口

// 计算仓库根目录以定位资源
const repoRoot = path.resolve(__dirname, '..', '..', '..'); // 推导仓库根目录
// 定义允许写入的目录前缀，严格限制为自动数据目录
const autoDir = path.resolve(repoRoot, 'assets', 'auto'); // 自动数据根目录

// 帮助函数：判断路径是否属于允许目录
function isAllowed(target: string): boolean { // 定义白名单判断函数
  const normalized = path.normalize(target); // 规范化路径
  return normalized.startsWith(autoDir); // 检查是否位于自动目录下
} // 函数结束

// 帮助函数：判断文件扩展名是否为文本类型
function isTextFile(target: string): boolean { // 定义扩展名判断函数
  return target.endsWith('.json') || target.endsWith('.txt'); // 仅允许JSON与TXT
} // 函数结束

// 帮助函数：解析请求体JSON
async function readRequestBody(req: import('http').IncomingMessage): Promise<unknown> { // 定义请求体读取函数
  const chunks: Buffer[] = []; // 收集数据块
  for await (const chunk of req) { // 监听流事件
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)); // 保存缓冲区
  } // 遍历结束
  const raw = Buffer.concat(chunks).toString('utf8'); // 拼接并转为字符串
  return raw ? JSON.parse(raw) : {}; // 解析JSON或返回空对象
} // 函数结束

// 创建Vite插件以暴露文本保存端点
export function createSaveTextPlugin(): Plugin { // 定义插件工厂函数
  return { // 返回插件对象
    name: 'miniworld-save-text', // 插件名称
    apply: 'serve', // 仅在开发服务器启用
    configureServer(server) { // 配置服务器钩子
      server.middlewares.use(async (req, res, next) => { // 注册中间件
        if (!req.url || (!req.url.startsWith('/__saveText') && !req.url.startsWith('/__copyText'))) { // 如果不是目标端点
          return next(); // 传递给下一个中间件
        } // 分支结束
        if (req.method !== 'POST') { // 仅允许POST
          res.statusCode = 405; // 方法不被允许
          res.end(JSON.stringify({ error: 'method not allowed' })); // 返回错误
          return; // 结束处理
        } // 分支结束
        try { // 捕获解析与写入错误
          const body = await readRequestBody(req); // 读取请求体
          if (req.url.startsWith('/__saveText')) { // 处理保存文本请求
            const { path: targetPath, content } = body as { path?: string; content?: string }; // 解构目标路径与内容
            if (!targetPath || typeof targetPath !== 'string') { // 校验路径
              res.statusCode = 400; // 设置错误码
              res.end(JSON.stringify({ error: 'invalid path' })); // 返回错误
              return; // 结束处理
            } // 分支结束
            const absolutePath = path.resolve(repoRoot, targetPath); // 计算绝对路径
            if (!isAllowed(absolutePath) || !isTextFile(absolutePath)) { // 校验白名单与扩展名
              res.statusCode = 403; // 禁止访问
              res.end(JSON.stringify({ error: 'forbidden' })); // 返回错误
              return; // 结束处理
            } // 分支结束
            if (typeof content !== 'string') { // 校验内容类型
              res.statusCode = 400; // 设置错误码
              res.end(JSON.stringify({ error: 'invalid content' })); // 返回错误信息
              return; // 结束处理
            } // 分支结束
            await fs.mkdir(path.dirname(absolutePath), { recursive: true }); // 确保目录存在
            await fs.writeFile(absolutePath, content, 'utf8'); // 写入文本内容
            res.setHeader('Content-Type', 'application/json'); // 设置返回类型
            res.end(JSON.stringify({ ok: true })); // 返回成功
            return; // 结束处理
          } // 分支结束
          if (req.url.startsWith('/__copyText')) { // 处理文本复制请求
            const { from, to } = body as { from?: string; to?: string }; // 解构源与目标
            if (!from || !to) { // 校验参数
              res.statusCode = 400; // 设置错误码
              res.end(JSON.stringify({ error: 'invalid arguments' })); // 返回错误
              return; // 结束处理
            } // 分支结束
            const sourcePath = path.resolve(repoRoot, from); // 计算源路径
            const targetPath = path.resolve(repoRoot, to); // 计算目标路径
            if (!isAllowed(sourcePath) || !isAllowed(targetPath) || !isTextFile(sourcePath) || !isTextFile(targetPath)) { // 校验白名单与扩展名
              res.statusCode = 403; // 禁止访问
              res.end(JSON.stringify({ error: 'forbidden' })); // 返回错误
              return; // 结束处理
            } // 分支结束
            const content = await fs.readFile(sourcePath, 'utf8'); // 读取源文件内容
            await fs.mkdir(path.dirname(targetPath), { recursive: true }); // 确保目标目录存在
            await fs.writeFile(targetPath, content, 'utf8'); // 写入目标文件
            res.setHeader('Content-Type', 'application/json'); // 设置返回类型
            res.end(JSON.stringify({ ok: true })); // 返回成功
            return; // 结束处理
          } // 分支结束
        } catch (error) { // 捕获异常
          res.statusCode = 500; // 设置服务器错误码
          res.end(JSON.stringify({ error: String(error) })); // 返回错误信息
          return; // 结束处理
        } // 分支结束
      }); // 中间件结束
    }, // 配置结束
  }; // 插件返回
} // 函数结束
