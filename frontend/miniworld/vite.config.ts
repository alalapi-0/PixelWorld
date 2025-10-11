import { defineConfig } from 'vite'; // 引入Vite配置方法
import path from 'path'; // 引入路径处理模块
import { createSaveTextPlugin } from './plugins/vite.plugin.saveText'; // 引入文本保存插件
import { createFileHashPlugin } from './plugins/vite.plugin.fileHash'; // 引入文件哈希插件

const sharedAssetsRoot = path.resolve(__dirname, '../../assets/user_imports');

export default defineConfig({ // 导出Vite配置对象
  root: path.resolve(__dirname), // 指定项目根目录
  publicDir: path.resolve(__dirname, 'assets_external'), // 指定静态资源目录
  resolve: { // 配置解析选项
    alias: { // 配置别名
      '@sharedAssets': sharedAssetsRoot, // 映射共享资源路径
    }, // 对象结束
  }, // 解析配置结束
  server: { // 开发服务器配置
    host: true, // 允许外部访问
  }, // 服务器配置结束
  build: { // 构建选项
    outDir: 'dist', // 输出目录
    emptyOutDir: true, // 构建前清空目录
  }, // 构建配置结束
  plugins: [createSaveTextPlugin(), createFileHashPlugin()], // 注册开发期插件
}); // 配置结束
