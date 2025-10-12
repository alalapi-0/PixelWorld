package io.github.alalapi.pixelworld; // 指定核心游戏的包名

import com.badlogic.gdx.Game; // 引入 LibGDX Game 基类
import com.badlogic.gdx.Gdx; // 引入 Gdx 以便日志输出
import com.badlogic.gdx.graphics.GL20; // 引入清屏常量
import game.io.AssetIndex; // 引入资源索引
import game.io.ExternalGraphicsScanner; // 引入外部图像扫描器
import game.save.SaveManager; // 引入存档管理器
import game.ui.TitleScreen; // 引入标题画面
import game.ui.CharacterCreateScreen; // 引入创角画面类型
import game.ui.GameScreen; // 引入游戏画面
import game.ui.PlayerProfile; // 引入玩家档案结构

/**
 * Minimal {@link Game} bootstrap that wires the {@link TitleScreen}.
 */
public class GameMain extends Game { // 定义游戏主体类

    private final String graphicsRoot; // 外部图像根目录
    private final boolean noWriteMode; // 是否处于只读模式
    private AssetIndex assetIndex; // 扫描得到的资源索引

    public GameMain() { // 无参构造用于兼容其他入口
        this(resolveGraphicsRoot(), resolveNoWriteFlag()); // 调用主构造
    } // 无参构造结束

    public GameMain(String graphicsRoot, boolean noWriteMode) { // 主构造
        this.graphicsRoot = graphicsRoot; // 记录图像路径
        this.noWriteMode = noWriteMode; // 记录只读模式
    } // 主构造结束

    @Override
    public void create() { // 创建生命周期
        SaveManager.initialize(noWriteMode); // 初始化存档管理器
        assetIndex = performScan(); // 执行外部图片扫描
        setScreen(new TitleScreen(this, assetIndex)); // 切换到标题画面
    } // create 方法结束

    private AssetIndex performScan() { // 执行扫描的私有方法
        try { // 捕获可能的异常
            ExternalGraphicsScanner scanner = new ExternalGraphicsScanner(graphicsRoot); // 创建扫描器
            return scanner.scan(); // 执行扫描并返回索引
        } catch (Exception exception) { // 捕获所有异常
            Gdx.app.log("GameMain", "Scan external graphics failed", exception); // 记录错误
            return AssetIndex.empty(); // 返回空索引以保证流程继续
        } // 异常处理结束
    } // performScan 方法结束

    @Override
    public void render() { // 渲染循环
        Gdx.gl.glClearColor(0f, 0f, 0f, 1f); // 设置清屏颜色
        Gdx.gl.glClear(GL20.GL_COLOR_BUFFER_BIT); // 执行清屏
        super.render(); // 继续父类渲染
    } // render 方法结束

    @Override
    public void dispose() { // 资源释放
        if (getScreen() != null) { // 检查是否存在屏幕
            getScreen().dispose(); // 释放当前屏幕
        } // 条件结束
    } // dispose 方法结束

    public void openCharacterCreator() { // 打开创角界面
        setScreen(new CharacterCreateScreen(this, assetIndex)); // 切换到创角界面
    } // openCharacterCreator 方法结束

    public void startNewGame(PlayerProfile profile) { // 根据档案开始游戏
        setScreen(new GameScreen(this, profile, assetIndex)); // 切换到游戏界面
    } // startNewGame 方法结束

    public void returnToTitle() { // 返回标题界面
        setScreen(new TitleScreen(this, assetIndex)); // 切换回标题画面
    } // returnToTitle 方法结束

    public boolean isNoWriteMode() { // 公开只读模式状态
        return noWriteMode; // 返回标志
    } // isNoWriteMode 方法结束

    public AssetIndex getAssetIndex() { // 获取资源索引
        return assetIndex; // 返回索引
    } // getAssetIndex 方法结束

    private static String resolveGraphicsRoot() { // 解析系统属性的工具方法
        String value = System.getProperty("PIXELWORLD_USER_GRAPHICS"); // 读取属性
        if (value == null || value.isEmpty()) { // 判空
            return "E\\\\PixelWorld\\\\assets\\\\user_imports\\\\Graphics"; // 返回默认值
        } // 条件结束
        return value; // 返回用户值
    } // resolveGraphicsRoot 方法结束

    private static boolean resolveNoWriteFlag() { // 解析只读开关的工具方法
        String value = System.getProperty("PIXELWORLD_NO_WRITE", "1"); // 读取属性并给默认
        return "1".equals(value); // 判断是否等于 1
    } // resolveNoWriteFlag 方法结束
}
