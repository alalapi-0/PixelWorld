// 模块：应用入口，负责加载配置并启动 PIXI 场景管理器
import { createAppManager } from "./core/app.js"; // 导入创建应用管理器函数
import { initInput } from "./core/input.js"; // 导入初始化输入的函数
import { SceneBoot } from "./scenes/scene_boot.js"; // 导入启动场景类

const DEFAULT_CONFIG = { width: 640, height: 480, tileSize: 32, cameraSpeed: 6, messageDuration: 1500 }; // 定义默认配置对象

async function loadConfig() { // 定义异步函数用于加载配置
  try { // 尝试执行加载逻辑
    const response = await fetch("./config.json"); // 请求用户自定义配置文件
    if (response.ok) { // 如果响应成功
      const data = await response.json(); // 解析配置数据
      return { ...DEFAULT_CONFIG, ...data }; // 合并默认配置与用户配置
    } // 结束响应成功判断
  } catch (error) { // 捕获请求异常
    console.warn("自定义配置读取失败，使用示例配置", error); // 输出警告信息
  } // 结束异常捕获
  try { // 再次尝试读取示例配置
    const response = await fetch("./config.example.json"); // 请求示例配置文件
    if (response.ok) { // 如果响应成功
      const data = await response.json(); // 解析示例配置数据
      return { ...DEFAULT_CONFIG, ...data }; // 合并默认配置与示例配置
    } // 结束响应成功判断
  } catch (error) { // 捕获请求异常
    console.warn("示例配置读取失败，使用内置默认值", error); // 输出警告信息
  } // 结束异常捕获
  return { ...DEFAULT_CONFIG }; // 返回默认配置对象
} // 结束加载配置函数

async function main() { // 定义主入口异步函数
  const config = await loadConfig(); // 加载配置数据
  initInput(); // 初始化键盘输入监听
  const manager = await createAppManager(config); // 创建应用管理器实例
  manager.changeScene(SceneBoot); // 切换到启动场景
} // 结束主入口函数

main(); // 调用主入口函数
