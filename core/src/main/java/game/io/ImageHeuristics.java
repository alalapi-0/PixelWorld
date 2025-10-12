package game.io; // 定义图像启发式工具所在包

import java.nio.file.Path; // 引入路径类型
import java.util.Locale; // 引入地区工具

public final class ImageHeuristics { // 定义启发式工具类

    public static final class Classification { // 定义分类结果结构
        public final AssetIndex.ImageCategory category; // 分类类型
        public final String note; // 文本说明

        public Classification(AssetIndex.ImageCategory category, String note) { // 构造函数
            this.category = category; // 记录分类
            this.note = note; // 记录说明
        } // 构造结束
    } // 内部类结束

    private ImageHeuristics() { // 私有构造避免实例化
    } // 构造结束

    public static Classification classify(Path path, int width, int height) { // 主分类方法
        String normalized = path.toString().toLowerCase(Locale.ROOT); // 统一小写路径
        String fileName = path.getFileName().toString().toLowerCase(Locale.ROOT); // 小写文件名
        if (looksLikeCharacter(normalized, fileName, width, height)) { // 判断是否角色
            return new Classification(AssetIndex.ImageCategory.CHARACTER, describeFrames(width, height)); // 返回角色分类
        } // 条件结束
        if (looksLikeAnimation(normalized, fileName, width, height)) { // 判断是否动画
            return new Classification(AssetIndex.ImageCategory.ANIMATION, "检测到多帧序列"); // 返回动画分类
        } // 条件结束
        if (looksLikeBackground(normalized, width, height)) { // 判断是否背景
            return new Classification(AssetIndex.ImageCategory.BACKGROUND, "背景或大尺寸图像"); // 返回背景分类
        } // 条件结束
        if (looksLikePlaceholder(fileName, width, height)) { // 判断是否占位
            return new Classification(AssetIndex.ImageCategory.PLACEHOLDER, "疑似占位图"); // 返回占位分类
        } // 条件结束
        return new Classification(AssetIndex.ImageCategory.PLACEHOLDER, "未匹配规则"); // 默认归类为占位
    } // 方法结束

    private static boolean looksLikeCharacter(String normalized, String name, int width, int height) { // 角色判定
        if (normalized.contains("character") || normalized.contains("actor") || normalized.contains("people")) { // 路径关键字
            return hasSpriteSheetGrid(width, height); // 检查帧网格
        } // 条件结束
        if (name.startsWith("$") && !name.startsWith("!$")) { // RPG Maker 单人图命名
            return hasSpriteSheetGrid(width, height) || isSingleCharacterSheet(width, height); // 检查网格
        } // 条件结束
        if (normalized.contains("walk") || normalized.contains("sprite")) { // 其他关键字
            return hasSpriteSheetGrid(width, height) || isSingleCharacterSheet(width, height); // 检查尺寸
        } // 条件结束
        if (hasSpriteSheetGrid(width, height) && !looksLargeBackground(width, height)) { // 纯尺寸判定
            return true; // 视为角色表
        } // 条件结束
        return false; // 默认否
    } // 方法结束

    private static boolean looksLikeAnimation(String normalized, String name, int width, int height) { // 动画判定
        if (normalized.contains("effect") || normalized.contains("explosion") || normalized.contains("fire") || normalized.contains("anim")) { // 关键字
            return true; // 匹配动画
        } // 条件结束
        int framesAlongWidth = estimateFrameCount(width); // 估算横向帧
        int framesAlongHeight = estimateFrameCount(height); // 估算纵向帧
        return framesAlongWidth >= 6 || framesAlongHeight >= 6; // 帧数多则认定动画
    } // 方法结束

    private static boolean looksLikeBackground(String normalized, int width, int height) { // 背景判定
        if (normalized.contains("background") || normalized.contains("battleback") || normalized.contains("backdrop")) { // 关键字
            return true; // 匹配背景
        } // 条件结束
        return looksLargeBackground(width, height); // 根据尺寸判断
    } // 方法结束

    private static boolean looksLargeBackground(int width, int height) { // 大尺寸背景判定
        return width >= 800 && height >= 600; // 分辨率超过阈值
    } // 方法结束

    private static boolean looksLikePlaceholder(String name, int width, int height) { // 占位判定
        if (name.contains("iconset") || name.contains("placeholder")) { // 名称匹配
            return true; // 视为占位
        } // 条件结束
        if (width <= 32 && height <= 32) { // 很小的图
            return true; // 视为占位图标
        } // 条件结束
        return false; // 默认不是
    } // 方法结束

    private static boolean hasSpriteSheetGrid(int width, int height) { // 检查 3x4 网格
        if (width % 3 == 0 && height % 4 == 0) { // 标准 3x4
            int cellWidth = width / 3; // 计算单元宽
            int cellHeight = height / 4; // 计算单元高
            return Math.abs(cellWidth - cellHeight) <= Math.max(1, cellHeight / 5); // 判断接近方形
        } // 条件结束
        if (width % 4 == 0 && height % 4 == 0) { // 另一种布局
            int cellWidth = width / 4; // 单元宽
            int cellHeight = height / 4; // 单元高
            return Math.abs(cellWidth - cellHeight) <= Math.max(1, cellHeight / 5); // 判断相近
        } // 条件结束
        return false; // 默认不是
    } // 方法结束

    private static boolean isSingleCharacterSheet(int width, int height) { // 判断单人表
        if (width % 3 == 0 && height % 4 == 0) { // 单人标准表
            return true; // 满足网格
        } // 条件结束
        return width % 4 == 0 && height % 4 == 0; // 另一种等分
    } // 方法结束

    private static int estimateFrameCount(int size) { // 粗略估算帧数
        int tile = 64; // 假定单帧尺寸
        return Math.max(1, size / tile); // 按 64 像素估算
    } // 方法结束

    private static String describeFrames(int width, int height) { // 描述角色帧网格
        if (width % 3 == 0 && height % 4 == 0) { // 标准 3x4
            return "3x4 帧网格"; // 返回说明
        } // 条件结束
        if (width % 4 == 0 && height % 4 == 0) { // 方阵
            return "4x4 帧网格"; // 返回说明
        } // 条件结束
        return "角色贴图"; // 默认文本
    } // 方法结束
}
