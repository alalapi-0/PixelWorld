import { defineConfig } from 'vitest/config'; // 引入Vitest配置工具
import path from 'path'; // 引入路径模块
// 空行用于分隔
export default defineConfig({ // 导出配置
  test: { // 测试配置
    setupFiles: [path.resolve(__dirname, 'test/setup.ts')], // 指定测试前置脚本
    environment: 'node', // 使用Node环境
    exclude: ['test/ui/test_resource_browser.spec.ts', 'test/ui/test_resource_manager.spec.ts'], // 排除依赖Phaser环境的测试
  }, // 测试配置结束
}); // 配置结束
