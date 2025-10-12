package game.world.tiles; // 定义地块类型所在包

import com.badlogic.gdx.graphics.Color; // 引入颜色类

public enum TileTypes { // 定义地块枚举
    GRASS("草地", false, new Color(0.2f, 0.6f, 0.2f, 1f)), // 草地可通行
    ROAD("道路", false, new Color(0.4f, 0.3f, 0.2f, 1f)), // 道路可通行
    HOUSE_WALL("房屋墙体", true, new Color(0.5f, 0.4f, 0.3f, 1f)), // 房屋墙体阻挡
    HOUSE_DOOR("房屋门", false, new Color(0.7f, 0.5f, 0.2f, 1f)), // 房屋门可通行
    HOUSE_FLOOR("房屋地板", false, new Color(0.6f, 0.6f, 0.4f, 1f)), // 房屋地板可通行
    TREE("树木", true, new Color(0.1f, 0.4f, 0.1f, 1f)), // 树木阻挡
    FENCE("栅栏", true, new Color(0.75f, 0.65f, 0.4f, 1f)); // 栅栏阻挡

    public final String label; // 中文描述
    public final boolean solid; // 是否阻挡
    public final Color color; // 渲染颜色

    TileTypes(String label, boolean solid, Color color) { // 构造函数
        this.label = label; // 保存描述
        this.solid = solid; // 保存阻挡属性
        this.color = color; // 保存颜色
    } // 构造结束
}
