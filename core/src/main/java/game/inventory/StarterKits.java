package game.inventory; // 定义起始背包所在包

import java.util.LinkedHashMap; // 引入有序映射
import java.util.Map; // 引入映射接口

public final class StarterKits { // 定义起始背包工具类

    private StarterKits() { // 私有构造避免实例化
    } // 构造结束

    public static Map<String, Integer> getStarterKit() { // 获取默认启动礼包
        Map<String, Integer> items = new LinkedHashMap<>(); // 创建有序映射
        items.put("wood", 50); // 木材数量
        items.put("stone", 30); // 石头数量
        items.put("seed", 15); // 种子数量
        items.put("road_tile", 50); // 道路砖数量
        items.put("fence", 30); // 栅栏数量
        return items; // 返回映射
    } // 方法结束
}
