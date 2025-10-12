package game.ui; // 定义玩家档案所在包

import com.badlogic.gdx.utils.JsonReader; // 引入 JSON 读取器
import com.badlogic.gdx.utils.JsonValue; // 引入 JSON 值
import game.save.SaveManager; // 引入存档结构
import java.nio.file.Path; // 引入路径
import java.nio.file.Paths; // 引入路径工厂

public final class PlayerProfile { // 定义玩家档案类

    public final String gender; // 性别
    public final String nickname; // 昵称
    public final Path avatarPath; // 头像路径
    public final Path walkSheetPath; // 行走像路径

    public PlayerProfile(String gender, String nickname, Path avatarPath, Path walkSheetPath) { // 主构造
        this.gender = gender; // 记录性别
        this.nickname = nickname; // 记录昵称
        this.avatarPath = avatarPath; // 记录头像
        this.walkSheetPath = walkSheetPath; // 记录行走像
    } // 构造结束

    public static PlayerProfile fromSave(SaveManager.SaveGame saveGame) { // 从存档构造档案
        try { // 捕获解析异常
            JsonValue root = new JsonReader().parse(saveGame.json); // 解析 JSON
            String gender = root.getString("gender", "未知"); // 读取性别
            String nickname = root.getString("nickname", saveGame.slotName); // 读取昵称
            Path avatar = parsePath(root.getString("avatar", "")); // 解析头像路径
            Path walk = parsePath(root.getString("walk", "")); // 解析行走像路径
            return new PlayerProfile(gender, nickname, avatar, walk); // 返回档案
        } catch (Exception exception) { // 捕获异常
            return new PlayerProfile("未知", saveGame.slotName, null, null); // 回退为默认档案
        } // 捕获结束
    } // 方法结束

    private static Path parsePath(String text) { // 解析字符串为路径
        if (text == null || text.isEmpty()) { // 如果为空
            return null; // 返回空
        } // 条件结束
        return Paths.get(text); // 转换为 Path
    } // 方法结束
}
