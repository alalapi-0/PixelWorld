package game.inventory; // 定义背包系统所在包

import java.util.ArrayList; // 引入数组列表
import java.util.Collections; // 引入集合工具
import java.util.LinkedHashMap; // 引入有序映射
import java.util.List; // 引入列表接口
import java.util.Map; // 引入映射接口
import java.util.function.Consumer; // 引入函数式消费者

public final class InventorySystem { // 定义背包系统类

    private final Map<String, Integer> stock = new LinkedHashMap<>(); // 储存物品及数量
    private final List<Consumer<Map<String, Integer>>> listeners = new ArrayList<>(); // 监听器列表

    public InventorySystem() { // 默认构造
    } // 构造结束

    public void addListener(Consumer<Map<String, Integer>> listener) { // 注册监听器
        listeners.add(listener); // 保存监听器
        listener.accept(getSnapshot()); // 立即推送一次快照
    } // 方法结束

    public void addItem(String itemId, int amount) { // 增加物品
        if (amount <= 0) { // 非正数量
            return; // 忽略
        } // 条件结束
        stock.merge(itemId, amount, Integer::sum); // 合并数量
        notifyListeners(); // 通知变化
    } // 方法结束

    public boolean consumeItem(String itemId, int amount) { // 消耗物品
        if (amount <= 0) { // 非正数量
            return true; // 视为成功
        } // 条件结束
        Integer current = stock.get(itemId); // 获取当前数量
        if (current == null || current < amount) { // 数量不足
            return false; // 消耗失败
        } // 条件结束
        int remaining = current - amount; // 计算剩余
        if (remaining == 0) { // 若用尽
            stock.remove(itemId); // 移除条目
        } else { // 仍有剩余
            stock.put(itemId, remaining); // 更新数量
        } // 条件结束
        notifyListeners(); // 通知监听器
        return true; // 返回成功
    } // 方法结束

    public int getQuantity(String itemId) { // 查询物品数量
        return stock.getOrDefault(itemId, 0); // 返回数量
    } // 方法结束

    public Map<String, Integer> getSnapshot() { // 获取当前快照
        return Collections.unmodifiableMap(new LinkedHashMap<>(stock)); // 返回不可变副本
    } // 方法结束

    private void notifyListeners() { // 通知所有监听器
        Map<String, Integer> snapshot = getSnapshot(); // 创建快照
        for (Consumer<Map<String, Integer>> listener : listeners) { // 遍历监听器
            listener.accept(snapshot); // 分发快照
        } // 遍历结束
    } // 方法结束
}
