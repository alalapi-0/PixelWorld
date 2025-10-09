import { defineConfig } from 'vite'; // 引入定义配置函数
import path from 'path'; // 引入路径工具
// 分隔注释 // 保持行有注释
export default defineConfig({ // 导出Vite配置对象
  root: path.resolve(__dirname), // 设置项目根目录
  publicDir: path.resolve(__dirname, 'assets_external'), // 指定外部素材目录为公共目录
  server: { // 开发服务器配置对象
    host: true, // 允许外部访问
  }, // 结束服务器配置
  build: { // 构建相关配置
    outDir: 'dist', // 指定输出目录
    emptyOutDir: true, // 构建前清空目录
  }, // 结束构建配置
}); // 结束配置导出
