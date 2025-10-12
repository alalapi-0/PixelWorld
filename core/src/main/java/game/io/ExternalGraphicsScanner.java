package game.io; // 定义外部图像扫描器所在包

import com.badlogic.gdx.Gdx; // 引入 Gdx 用于日志
import com.badlogic.gdx.files.FileHandle; // 引入文件句柄
import com.badlogic.gdx.graphics.Pixmap; // 引入像素图读取
import java.io.IOException; // 引入 IO 异常
import java.nio.file.Files; // 引入文件工具
import java.nio.file.Path; // 引入路径
import java.nio.file.Paths; // 引入路径工厂
import java.util.Locale; // 引入地区工具

public final class ExternalGraphicsScanner { // 定义扫描器类

    private final Path rootDirectory; // 根目录路径

    public ExternalGraphicsScanner(String rootPath) { // 构造函数
        if (rootPath == null || rootPath.isEmpty()) { // 如果路径为空
            this.rootDirectory = null; // 记录为空
        } else { // 否则
            this.rootDirectory = Paths.get(rootPath); // 解析为 Path
        } // 条件结束
    } // 构造结束

    public AssetIndex scan() throws IOException { // 执行扫描的方法
        AssetIndex index = new AssetIndex(); // 创建索引
        if (rootDirectory == null) { // 如果没有有效路径
            return index; // 返回空索引
        } // 条件结束
        if (!Files.exists(rootDirectory)) { // 如果目录不存在
            Gdx.app.log("ExternalGraphicsScanner", "Graphics directory not found: " + rootDirectory); // 记录日志
            return index; // 返回空索引
        } // 条件结束
        Files.walk(rootDirectory) // 遍历目录树
                .filter(Files::isRegularFile) // 只处理文件
                .filter(path -> path.getFileName().toString().toLowerCase(Locale.ROOT).endsWith(".png")) // 过滤 PNG
                .forEach(path -> processFile(path, index)); // 处理文件
        return index; // 返回构建好的索引
    } // scan 方法结束

    private void processFile(Path path, AssetIndex index) { // 处理单个文件
        try { // 捕获读取过程异常
            FileHandle handle = new FileHandle(path.toFile()); // 创建文件句柄
            Pixmap pixmap = new Pixmap(handle); // 使用 Pixmap 读取头部
            try { // 嵌套 try 确保释放
                int width = pixmap.getWidth(); // 获取宽度
                int height = pixmap.getHeight(); // 获取高度
                ImageHeuristics.Classification classification = ImageHeuristics.classify(path, width, height); // 调用启发式分类
                AssetIndex.ImageInfo info = new AssetIndex.ImageInfo(path, width, height, classification.note); // 创建图像信息
                index.add(info, classification.category); // 加入索引
            } finally { // 无论成功与否
                pixmap.dispose(); // 释放 Pixmap
            } // finally 结束
        } catch (Exception exception) { // 捕获所有异常
            Gdx.app.log("ExternalGraphicsScanner", "Failed to inspect: " + path, exception); // 记录错误
        } // 捕获结束
    } // 方法结束
}
