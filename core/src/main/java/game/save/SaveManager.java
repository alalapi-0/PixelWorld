package game.save; // 定义存档管理器所在包

import com.badlogic.gdx.Gdx; // 引入 Gdx 用于文件访问
import com.badlogic.gdx.files.FileHandle; // 引入文件句柄
import java.util.Arrays; // 引入数组工具
import java.util.Comparator; // 引入比较器
import java.util.Optional; // 引入可选类型

public final class SaveManager { // 定义存档管理器类

    private static final String SAVE_DIRECTORY = "saves"; // 存档目录
    private static final String SAVE_EXTENSION = ".json"; // 存档扩展名
    private static boolean noWrite = true; // 只读开关

    private SaveManager() { // 私有构造防止实例化
    } // 构造结束

    public static void initialize(boolean requestedNoWrite) { // 初始化方法
        noWrite = requestedNoWrite; // 记录开关
    } // 方法结束

    public static boolean isNoWrite() { // 查询是否只读
        return noWrite; // 返回状态
    } // 方法结束

    public static void save(String slot, String json) { // 保存接口
        if (noWrite) { // 如果禁止写入
            Gdx.app.log("SaveManager", "NO_WRITE: skip save"); // 打印提示
            return; // 直接返回
        } // 条件结束
        FileHandle dir = Gdx.files.local(SAVE_DIRECTORY); // 获取目录
        if (!dir.exists()) { // 如果目录不存在
            dir.mkdirs(); // 创建目录（仅在允许写入时）
        } // 条件结束
        FileHandle file = dir.child(slot + SAVE_EXTENSION); // 组合文件名
        file.writeString(json, false); // 写出 JSON 内容
    } // 方法结束

    public static void autosave(String json) { // 自动存档接口
        save("autosave", json); // 调用保存
    } // 方法结束

    public static Optional<SaveGame> tryLoadMostRecent() { // 读取最新存档
        FileHandle dir = Gdx.files.local(SAVE_DIRECTORY); // 获取目录
        if (!dir.exists() || !dir.isDirectory()) { // 如果目录不存在
            return Optional.empty(); // 返回空
        } // 条件结束
        FileHandle[] candidates = dir.list(file -> file.extension().equalsIgnoreCase("json")); // 列出 JSON 文件
        if (candidates == null || candidates.length == 0) { // 如果没有文件
            return Optional.empty(); // 返回空
        } // 条件结束
        Arrays.sort(candidates, Comparator.comparingLong(FileHandle::lastModified).reversed()); // 按修改时间排序
        FileHandle newest = candidates[0]; // 获取最新文件
        try { // 捕获读取异常
            String content = newest.readString(); // 读取文本
            return Optional.of(new SaveGame(newest.nameWithoutExtension(), content)); // 构造结果
        } catch (Exception exception) { // 捕获异常
            Gdx.app.log("SaveManager", "Failed to read save: " + newest.path(), exception); // 打印错误
            return Optional.empty(); // 返回空
        } // 捕获结束
    } // 方法结束

    public static final class SaveGame { // 定义存档数据结构
        public final String slotName; // 存档槽名称
        public final String json; // 原始 JSON 内容

        public SaveGame(String slotName, String json) { // 构造函数
            this.slotName = slotName; // 记录名称
            this.json = json; // 记录内容
        } // 构造结束
    } // 内部类结束
}
