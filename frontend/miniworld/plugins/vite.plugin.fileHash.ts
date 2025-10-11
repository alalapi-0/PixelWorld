// 引入所需的Node模块以处理路径、文件与哈希
import type { Plugin } from 'vite'; // 引入Vite插件类型
import path from 'path'; // 引入路径模块
import fs from 'fs/promises'; // 引入文件系统Promise接口
import crypto from 'crypto'; // 引入哈希计算模块

// 计算仓库根目录，方便进行路径校验
const repoRoot = path.resolve(__dirname, '..', '..', '..'); // 推导仓库根目录
// 定义允许访问哈希的目录前缀
const autoDir = path.resolve(repoRoot, 'assets', 'auto'); // 自动数据目录
const scriptsDir = path.resolve(repoRoot, 'scripts'); // 脚本目录

// 帮助函数：验证目标文件是否位于白名单内
function isPathAllowed(target: string): boolean { // 定义白名单校验函数
  const normalized = path.normalize(target); // 规范化路径
  return normalized.startsWith(autoDir) || normalized === path.resolve(scriptsDir, 'rules_mapping.json'); // 检查是否在允许范围
} // 函数结束

// 帮助函数：读取文件并计算SHA1摘要
async function readFileHash(filePath: string): Promise<{ mtime?: string; sha1?: string }> { // 定义哈希计算函数
  const stat = await fs.stat(filePath); // 读取文件状态
  const buffer = await fs.readFile(filePath); // 读取文件内容
  const hash = crypto.createHash('sha1'); // 创建SHA1哈希实例
  hash.update(buffer); // 写入文件内容
  return { mtime: stat.mtime.toISOString(), sha1: hash.digest('hex') }; // 返回修改时间与摘要
} // 函数结束

// 创建Vite插件，向开发服务器注入哈希查询端点
export function createFileHashPlugin(): Plugin { // 定义插件工厂函数
  return { // 返回插件对象
    name: 'miniworld-file-hash', // 插件名称
    apply: 'serve', // 仅在开发服务器启用
    configureServer(server) { // 配置开发服务器钩子
      server.middlewares.use(async (req, res, next) => { // 注册中间件
        if (!req.url || !req.url.startsWith('/__fileHash')) { // 若不是哈希请求
          return next(); // 交给下一个中间件
        } // 分支结束
        const url = new URL(req.url, 'http://localhost'); // 解析请求URL
        const queryPath = url.searchParams.get('path'); // 读取path参数
        if (!queryPath) { // 若缺少参数
          res.statusCode = 400; // 设置状态码
          res.end(JSON.stringify({ error: 'missing path' })); // 返回错误信息
          return; // 结束处理
        } // 分支结束
        const targetPath = path.resolve(repoRoot, queryPath); // 解析为绝对路径
        if (!isPathAllowed(targetPath)) { // 校验白名单
          res.statusCode = 403; // 设置禁止访问状态
          res.end(JSON.stringify({ error: 'forbidden' })); // 返回错误信息
          return; // 结束处理
        } // 分支结束
        try { // 捕获文件读取异常
          const info = await readFileHash(targetPath); // 计算文件哈希
          res.setHeader('Content-Type', 'application/json'); // 设置响应类型
          res.end(JSON.stringify({ path: queryPath, ...info })); // 返回哈希信息
        } catch (error) { // 捕获异常
          res.statusCode = 500; // 设置服务器错误状态
          res.end(JSON.stringify({ error: String(error) })); // 返回错误描述
        } // 分支结束
      }); // 中间件结束
    }, // 钩子结束
  }; // 插件对象结束
} // 函数结束
