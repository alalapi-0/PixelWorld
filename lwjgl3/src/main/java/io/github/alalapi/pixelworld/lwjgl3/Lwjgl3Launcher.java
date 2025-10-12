package io.github.alalapi.pixelworld.lwjgl3; // 指定桌面启动器的包名

import com.badlogic.gdx.backends.lwjgl3.Lwjgl3Application; // 引入 LWJGL3 应用类
import com.badlogic.gdx.backends.lwjgl3.Lwjgl3ApplicationConfiguration; // 引入配置类
import io.github.alalapi.pixelworld.GameMain; // 引入游戏主体

/** Desktop launcher for the LWJGL3 backend. */
public class Lwjgl3Launcher { // 定义桌面启动器类

    private static final String DEFAULT_GRAPHICS_PATH = "E\\PixelWorld\\assets\\user_imports\\Graphics"; // 默认的外部图像路径
    private static final String GRAPHICS_PROPERTY = "PIXELWORLD_USER_GRAPHICS"; // 外部图像路径的系统属性键
    private static final String NO_WRITE_PROPERTY = "PIXELWORLD_NO_WRITE"; // 只读模式的系统属性键

    private Lwjgl3Launcher() { // 私有构造防止实例化
    } // 私有构造结束

    public static void main(String[] args) { // 程序入口
        createApplication(); // 创建并启动应用
    } // main 方法结束

    private static void createApplication() { // 创建应用的方法
        Lwjgl3ApplicationConfiguration configuration = new Lwjgl3ApplicationConfiguration(); // 创建配置对象
        configuration.setTitle("PixelWorld"); // 设置窗口标题
        configuration.useVsync(true); // 开启垂直同步
        configuration.setForegroundFPS(60); // 设置前台帧率
        configuration.setWindowedMode(1280, 720); // 设置窗口尺寸
        String graphicsRoot = resolveGraphicsRoot(); // 解析外部图像路径
        boolean noWrite = resolveNoWrite(); // 解析只读模式开关
        GameMain game = new GameMain(graphicsRoot, noWrite); // 创建游戏主体并注入参数
        new Lwjgl3Application(game, configuration); // 启动 LWJGL3 应用
    } // createApplication 方法结束

    private static String resolveGraphicsRoot() { // 解析外部图像路径的方法
        String userDefined = System.getProperty(GRAPHICS_PROPERTY); // 读取系统属性
        if (userDefined == null || userDefined.isEmpty()) { // 检查是否为空
            System.setProperty(GRAPHICS_PROPERTY, DEFAULT_GRAPHICS_PATH); // 写回默认路径
            return DEFAULT_GRAPHICS_PATH; // 返回默认路径
        } // 条件结束
        return userDefined; // 返回用户指定路径
    } // resolveGraphicsRoot 方法结束

    private static boolean resolveNoWrite() { // 解析只读模式的方法
        String flag = System.getProperty(NO_WRITE_PROPERTY); // 读取系统属性
        if (flag == null) { // 未显式设置
            System.setProperty(NO_WRITE_PROPERTY, "1"); // 默认开启只读模式
            return true; // 返回真
        } // 条件结束
        return "1".equals(flag); // 判断属性值是否为 1
    } // resolveNoWrite 方法结束
}
