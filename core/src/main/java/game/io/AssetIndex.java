package game.io; // 定义资源索引所在的包

import java.nio.file.Path; // 引入路径类型
import java.util.ArrayList; // 引入可变列表
import java.util.Collections; // 引入不可变包装
import java.util.HashMap; // 引入哈希表
import java.util.List; // 引入列表接口
import java.util.Locale; // 引入本地化工具
import java.util.Map; // 引入映射接口

public final class AssetIndex { // 定义资源索引类

    public enum ImageCategory { // 定义图像分类枚举
        BACKGROUND, // 背景类
        ANIMATION, // 动画类
        PLACEHOLDER, // 占位类
        CHARACTER // 角色类
    } // 枚举结束

    public static final class ImageInfo { // 定义图像信息结构
        public final Path path; // 文件路径
        public final int width; // 图像宽度
        public final int height; // 图像高度
        public final String notes; // 附加说明

        public ImageInfo(Path path, int width, int height, String notes) { // 构造函数
            this.path = path; // 记录路径
            this.width = width; // 记录宽度
            this.height = height; // 记录高度
            this.notes = notes; // 记录备注
        } // 构造结束
    } // 内部类结束

    public final List<Path> backgrounds = new ArrayList<>(); // 背景图片路径集合
    public final List<Path> animations = new ArrayList<>(); // 动画图片路径集合
    public final List<Path> placeholders = new ArrayList<>(); // 占位图片路径集合
    public final List<Path> characters = new ArrayList<>(); // 角色图片路径集合

    private final Map<Path, ImageInfo> metadata = new HashMap<>(); // 路径到元数据的映射
    private final Map<String, List<Path>> groupedByName = new HashMap<>(); // 文件名分组索引

    public AssetIndex() { // 默认构造
    } // 构造结束

    public static AssetIndex empty() { // 创建空索引的工厂
        return new AssetIndex(); // 返回新实例
    } // 方法结束

    public void add(ImageInfo info, ImageCategory category) { // 根据分类添加记录
        metadata.put(info.path, info); // 保存元数据
        addToGroup(info.path); // 加入文件名分组
        switch (category) { // 根据分类分派列表
            case BACKGROUND: // 背景类
                backgrounds.add(info.path); // 添加到背景列表
                break; // 跳出
            case ANIMATION: // 动画类
                animations.add(info.path); // 添加到动画列表
                break; // 跳出
            case CHARACTER: // 角色类
                characters.add(info.path); // 添加到角色列表
                break; // 跳出
            default: // 其他情况
                placeholders.add(info.path); // 添加到占位列表
                break; // 跳出
        } // switch 结束
    } // 方法结束

    private void addToGroup(Path path) { // 按文件名分组的辅助方法
        String key = path.getFileName().toString().toLowerCase(Locale.ROOT); // 获取小写文件名
        groupedByName.computeIfAbsent(key, k -> new ArrayList<>()).add(path); // 插入分组
    } // 方法结束

    public Map<Path, ImageInfo> getMetadata() { // 获取元数据映射
        return Collections.unmodifiableMap(metadata); // 返回只读视图
    } // 方法结束

    public Map<String, List<Path>> getGroupedByName() { // 获取按名称分组
        Map<String, List<Path>> copy = new HashMap<>(); // 创建副本映射
        for (Map.Entry<String, List<Path>> entry : groupedByName.entrySet()) { // 遍历原始映射
            copy.put(entry.getKey(), Collections.unmodifiableList(new ArrayList<>(entry.getValue()))); // 拷贝并封装列表
        } // 遍历结束
        return Collections.unmodifiableMap(copy); // 返回不可变结果
    } // 方法结束
}
