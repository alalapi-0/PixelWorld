package game.build; // 定义建造系统所在包

import game.inventory.InventorySystem; // 引入背包系统
import game.world.tiles.TileTypes; // 引入地块类型
import java.util.ArrayList; // 引入数组列表
import java.util.Collections; // 引入集合工具
import java.util.LinkedHashMap; // 引入有序映射
import java.util.List; // 引入列表接口
import java.util.Map; // 引入映射接口

public final class BuildFromInventory { // 定义建造系统类

    private final InventorySystem inventory; // 背包引用
    private final Map<String, TileTypes> itemToTile = new LinkedHashMap<>(); // 物品到地块映射
    private final List<String> buildOrder = new ArrayList<>(); // 建造物品顺序

    public BuildFromInventory(InventorySystem inventory) { // 构造函数
        this.inventory = inventory; // 保存背包引用
        register("road_tile", TileTypes.ROAD); // 注册道路建造
        register("wood", TileTypes.HOUSE_WALL); // 注册木材建造墙壁
        register("stone", TileTypes.HOUSE_FLOOR); // 注册石头建造地板
        register("seed", TileTypes.TREE); // 注册种子建造树木
        register("fence", TileTypes.FENCE); // 注册栅栏建造
    } // 构造结束

    private void register(String itemId, TileTypes tile) { // 注册物品与地块映射
        itemToTile.put(itemId, tile); // 存储映射
        buildOrder.add(itemId); // 记录顺序
    } // 方法结束

    public List<String> getBuildableItems() { // 获取可建造物品列表
        return Collections.unmodifiableList(buildOrder); // 返回不可变列表
    } // 方法结束

    public TileTypes resolveTile(String itemId) { // 根据物品获取地块类型
        return itemToTile.get(itemId); // 返回对应地块
    } // 方法结束

    public String nextAvailableItem(String current, int direction) { // 计算下一个可用物品
        if (buildOrder.isEmpty()) { // 若无可建造物品
            return null; // 返回空
        } // 条件结束
        int currentIndex = current == null ? -1 : buildOrder.indexOf(current); // 查找当前索引
        int size = buildOrder.size(); // 获取总数
        for (int i = 1; i <= size; i++) { // 最多遍历一次列表
            int candidateIndex = (currentIndex + direction * i) % size; // 计算候选索引
            if (candidateIndex < 0) { // 处理负索引
                candidateIndex += size; // 调整为正
            } // 条件结束
            String candidate = buildOrder.get(candidateIndex); // 获取物品
            if (inventory.getQuantity(candidate) > 0) { // 若库存充足
                return candidate; // 返回物品
            } // 条件结束
        } // 循环结束
        return null; // 若没有可用物品
    } // 方法结束

    public boolean place(String itemId, TileTypes[][] tiles, int x, int y) { // 尝试在地图上建造
        TileTypes targetTile = itemToTile.get(itemId); // 获取目标地块
        if (targetTile == null) { // 未注册
            return false; // 失败
        } // 条件结束
        if (!inventory.consumeItem(itemId, 1)) { // 消耗材料
            return false; // 若不足则失败
        } // 条件结束
        tiles[x][y] = targetTile; // 设置地块
        return true; // 返回成功
    } // 方法结束
}
