package game.ui; // 定义游戏界面所在包

import com.badlogic.gdx.Gdx; // 引入 Gdx 用于输入和窗口信息
import com.badlogic.gdx.Input; // 引入输入常量
import com.badlogic.gdx.ScreenAdapter; // 引入屏幕基类
import com.badlogic.gdx.graphics.Color; // 引入颜色
import com.badlogic.gdx.graphics.OrthographicCamera; // 引入相机
import com.badlogic.gdx.graphics.g2d.BitmapFont; // 引入字体
import com.badlogic.gdx.graphics.g2d.SpriteBatch; // 引入批处理
import com.badlogic.gdx.graphics.glutils.ShapeRenderer; // 引入形状渲染器
import game.build.BuildFromInventory; // 引入建造系统
import game.inventory.InventorySystem; // 引入背包系统
import game.inventory.StarterKits; // 引入启动礼包
import game.io.AssetIndex; // 引入资源索引
import game.world.InitialWorldGenerator; // 引入世界生成器
import game.world.tiles.TileTypes; // 引入地块类型
import io.github.alalapi.pixelworld.GameMain; // 引入游戏主体
import java.util.Map; // 引入映射
import java.util.StringJoiner; // 引入字符串拼接器

public final class GameScreen extends ScreenAdapter { // 定义游戏界面类

    private static final Color HIGHLIGHT_COLOR = new Color(1f, 1f, 0f, 0.5f); // 建造高亮颜色

    private final GameMain game; // 游戏主体引用
    private final PlayerProfile profile; // 玩家档案
    private final AssetIndex assetIndex; // 资源索引

    private InitialWorldGenerator.GeneratedWorld world; // 世界生成结果
    private TileTypes[][] tiles; // 地块数组
    private int worldWidth; // 地图宽度
    private int worldHeight; // 地图高度
    private int playerX; // 玩家 X 坐标
    private int playerY; // 玩家 Y 坐标
    private int facingX = 0; // 朝向 X
    private int facingY = -1; // 朝向 Y

    private OrthographicCamera worldCamera; // 世界相机
    private OrthographicCamera hudCamera; // HUD 相机
    private ShapeRenderer shapeRenderer; // 形状渲染器
    private SpriteBatch batch; // 批处理器
    private BitmapFont font; // 字体

    private InventorySystem inventory; // 背包系统
    private BuildFromInventory builder; // 建造系统
    private boolean inventoryVisible; // 背包显示标志
    private boolean buildMode; // 建造模式标志
    private boolean paused; // 暂停标志
    private String selectedBuildItem; // 当前建造物品
    private String inventoryText = ""; // 背包文本
    private String hudProfileText = ""; // 档案文本

    public GameScreen(GameMain game, PlayerProfile profile, AssetIndex assetIndex) { // 构造函数
        this.game = game; // 记录游戏引用
        this.profile = profile; // 记录档案
        this.assetIndex = assetIndex; // 记录资源索引
    } // 构造结束

    @Override
    public void show() { // 显示时初始化
        worldCamera = new OrthographicCamera(); // 创建世界相机
        worldCamera.setToOrtho(false, 20f, 15f); // 设置视口大小
        hudCamera = new OrthographicCamera(); // 创建 HUD 相机
        hudCamera.setToOrtho(false, Gdx.graphics.getWidth(), Gdx.graphics.getHeight()); // 匹配屏幕尺寸
        shapeRenderer = new ShapeRenderer(); // 创建形状渲染器
        batch = new SpriteBatch(); // 创建批处理器
        font = new BitmapFont(); // 创建字体
        initializeWorld(); // 初始化世界
        initializeInventory(); // 初始化背包
        hudProfileText = buildProfileText(); // 构建档案文本
    } // show 方法结束

    private void initializeWorld() { // 初始化世界方法
        InitialWorldGenerator generator = new InitialWorldGenerator(); // 创建生成器
        world = generator.generate(); // 生成世界
        tiles = world.tiles; // 保存地块
        worldWidth = tiles.length; // 记录宽度
        worldHeight = tiles[0].length; // 记录高度
        playerX = world.spawnX; // 设置玩家 X
        playerY = world.spawnY; // 设置玩家 Y
    } // 方法结束

    private void initializeInventory() { // 初始化背包
        inventory = new InventorySystem(); // 创建背包系统
        builder = new BuildFromInventory(inventory); // 创建建造系统
        inventory.addListener(snapshot -> inventoryText = formatInventory(snapshot)); // 注册监听器
        for (Map.Entry<String, Integer> entry : StarterKits.getStarterKit().entrySet()) { // 遍历礼包
            inventory.addItem(entry.getKey(), entry.getValue()); // 添加物资
        } // 遍历结束
        selectedBuildItem = builder.nextAvailableItem(null, 1); // 获取初始建造物品
    } // 方法结束

    private String buildProfileText() { // 构建档案显示文本
        StringBuilder builder = new StringBuilder(); // 创建字符串构造器
        builder.append("昵称：").append(profile.nickname); // 添加昵称
        builder.append("  性别：").append(profile.gender); // 添加性别
        if (profile.walkSheetPath != null) { // 如果有行走像
            builder.append("  行走像：").append(profile.walkSheetPath.getFileName()); // 显示文件名
        } // 条件结束
        builder.append("  角色素材数：").append(assetIndex.characters.size()); // 显示角色素材数量
        return builder.toString(); // 返回文本
    } // 方法结束

    private String formatInventory(Map<String, Integer> snapshot) { // 格式化背包文本
        if (snapshot.isEmpty()) { // 若无物资
            return "背包为空"; // 返回提示
        } // 条件结束
        StringJoiner joiner = new StringJoiner("\n"); // 创建多行拼接器
        joiner.add("背包物资："); // 添加标题
        for (Map.Entry<String, Integer> entry : snapshot.entrySet()) { // 遍历物资
            joiner.add(entry.getKey() + " × " + entry.getValue()); // 添加条目
        } // 遍历结束
        return joiner.toString(); // 返回文本
    } // 方法结束

    @Override
    public void render(float delta) { // 渲染循环
        handleGlobalInput(); // 处理全局输入
        if (!paused) { // 未暂停时
            handleGameplayInput(); // 处理游戏输入
        } // 条件结束
        updateCamera(); // 更新相机
        drawWorld(); // 绘制世界
        drawHud(); // 绘制 HUD
    } // render 方法结束

    private void handleGlobalInput() { // 处理全局输入
        if (Gdx.input.isKeyJustPressed(Input.Keys.ESCAPE)) { // 检测 ESC
            paused = !paused; // 切换暂停
            return; // 直接返回避免重复处理
        } // 条件结束
        if (paused) { // 若处于暂停
            if (Gdx.input.isKeyJustPressed(Input.Keys.T)) { // 检测返回标题
                game.returnToTitle(); // 返回标题界面
            } // 条件结束
        } // 条件结束
    } // 方法结束

    private void handleGameplayInput() { // 处理游戏输入
        if (Gdx.input.isKeyJustPressed(Input.Keys.W) || Gdx.input.isKeyJustPressed(Input.Keys.UP)) { // 按下上
            attemptMove(0, 1); // 尝试向上移动
        } // 条件结束
        if (Gdx.input.isKeyJustPressed(Input.Keys.S) || Gdx.input.isKeyJustPressed(Input.Keys.DOWN)) { // 按下下
            attemptMove(0, -1); // 尝试向下移动
        } // 条件结束
        if (Gdx.input.isKeyJustPressed(Input.Keys.A) || Gdx.input.isKeyJustPressed(Input.Keys.LEFT)) { // 按下左
            attemptMove(-1, 0); // 尝试向左移动
        } // 条件结束
        if (Gdx.input.isKeyJustPressed(Input.Keys.D) || Gdx.input.isKeyJustPressed(Input.Keys.RIGHT)) { // 按下右
            attemptMove(1, 0); // 尝试向右移动
        } // 条件结束
        if (Gdx.input.isKeyJustPressed(Input.Keys.I)) { // 切换背包
            inventoryVisible = !inventoryVisible; // 切换显示
        } // 条件结束
        if (Gdx.input.isKeyJustPressed(Input.Keys.U)) { // 切换建造模式
            buildMode = !buildMode; // 切换模式
            if (buildMode && selectedBuildItem == null) { // 若进入建造但无物品
                selectedBuildItem = builder.nextAvailableItem(null, 1); // 选择首个物品
            } // 条件结束
        } // 条件结束
        if (buildMode) { // 在建造模式内
            if (Gdx.input.isKeyJustPressed(Input.Keys.Q)) { // 向前切换物品
                selectedBuildItem = builder.nextAvailableItem(selectedBuildItem, -1); // 切换
            } // 条件结束
            if (Gdx.input.isKeyJustPressed(Input.Keys.E)) { // 向后切换物品
                selectedBuildItem = builder.nextAvailableItem(selectedBuildItem, 1); // 切换
            } // 条件结束
            if (Gdx.input.isKeyJustPressed(Input.Keys.X)) { // 退出建造
                buildMode = false; // 关闭建造
            } // 条件结束
            if (Gdx.input.isKeyJustPressed(Input.Keys.Z)) { // 放置建造
                attemptBuild(); // 尝试建造
            } // 条件结束
        } // 条件结束
    } // 方法结束

    private void attemptMove(int dx, int dy) { // 尝试移动
        int targetX = playerX + dx; // 目标 X
        int targetY = playerY + dy; // 目标 Y
        if (!isInside(targetX, targetY)) { // 越界检测
            facingX = dx; // 更新朝向
            facingY = dy; // 更新朝向
            return; // 返回
        } // 条件结束
        TileTypes tile = tiles[targetX][targetY]; // 获取目标地块
        facingX = dx; // 更新朝向
        facingY = dy; // 更新朝向
        if (!tile.solid) { // 若可通行
            playerX = targetX; // 更新位置
            playerY = targetY; // 更新位置
        } // 条件结束
    } // 方法结束

    private void attemptBuild() { // 尝试建造
        if (selectedBuildItem == null) { // 若没有选中物品
            return; // 直接返回
        } // 条件结束
        int targetX = playerX + facingX; // 目标 X
        int targetY = playerY + facingY; // 目标 Y
        if (!isInside(targetX, targetY)) { // 越界
            return; // 返回
        } // 条件结束
        if (!isBuildable(targetX, targetY)) { // 地块不可建造
            return; // 返回
        } // 条件结束
        if (builder.place(selectedBuildItem, tiles, targetX, targetY)) { // 成功建造
            if (inventory.getQuantity(selectedBuildItem) == 0) { // 如果物品耗尽
                selectedBuildItem = builder.nextAvailableItem(selectedBuildItem, 1); // 切换到下一个
            } // 条件结束
        } // 条件结束
    } // 方法结束

    private boolean isBuildable(int x, int y) { // 判断地块是否允许建造
        TileTypes tile = tiles[x][y]; // 获取地块
        if (tile == TileTypes.HOUSE_WALL || tile == TileTypes.HOUSE_DOOR || tile == TileTypes.TREE || tile == TileTypes.FENCE) { // 阻挡地块
            return false; // 不允许
        } // 条件结束
        return true; // 允许建造
    } // 方法结束

    private boolean isInside(int x, int y) { // 判断是否在地图内
        return x >= 0 && y >= 0 && x < worldWidth && y < worldHeight; // 返回范围检测
    } // 方法结束

    private void updateCamera() { // 更新相机位置
        worldCamera.position.set(playerX + 0.5f, playerY + 0.5f, 0f); // 设置相机位置
        worldCamera.update(); // 更新相机
    } // 方法结束

    private void drawWorld() { // 绘制世界
        shapeRenderer.setProjectionMatrix(worldCamera.combined); // 应用相机矩阵
        shapeRenderer.begin(ShapeRenderer.ShapeType.Filled); // 开始绘制
        for (int x = 0; x < worldWidth; x++) { // 遍历 X
            for (int y = 0; y < worldHeight; y++) { // 遍历 Y
                TileTypes tile = tiles[x][y]; // 获取地块
                shapeRenderer.setColor(tile.color); // 设置颜色
                shapeRenderer.rect(x, y, 1f, 1f); // 绘制方块
            } // 内层循环结束
        } // 外层循环结束
        shapeRenderer.setColor(Color.RED); // 设置玩家颜色
        shapeRenderer.rect(playerX + 0.2f, playerY + 0.2f, 0.6f, 0.6f); // 绘制玩家方块
        if (buildMode) { // 若处于建造模式
            int highlightX = playerX + facingX; // 计算高亮 X
            int highlightY = playerY + facingY; // 计算高亮 Y
            if (isInside(highlightX, highlightY)) { // 若在范围内
                shapeRenderer.setColor(HIGHLIGHT_COLOR); // 设置高亮颜色
                shapeRenderer.rect(highlightX, highlightY, 1f, 1f); // 绘制高亮
            } // 条件结束
        } // 条件结束
        shapeRenderer.end(); // 结束绘制
    } // 方法结束

    private void drawHud() { // 绘制 HUD
        hudCamera.update(); // 更新 HUD 相机
        batch.setProjectionMatrix(hudCamera.combined); // 设置投影
        batch.begin(); // 开始绘制文本
        font.draw(batch, hudProfileText, 16f, hudCamera.viewportHeight - 16f); // 绘制档案
        if (inventoryVisible) { // 若显示背包
            font.draw(batch, inventoryText, 16f, hudCamera.viewportHeight - 56f); // 绘制背包内容
        } // 条件结束
        if (buildMode) { // 建造模式提示
            String text; // 定义文本
            if (selectedBuildItem == null) { // 若无物品
                text = "没有可建造的物品"; // 文本提示
            } else { // 否则
                TileTypes tile = builder.resolveTile(selectedBuildItem); // 获取对应地块
                String label = tile == null ? "未知建筑" : tile.label; // 获取描述
                text = "建造目标：" + selectedBuildItem + " → " + label + "  (Q/E 切换, Z 放置, X 退出)"; // 拼接文本
            } // 条件结束
            font.draw(batch, text, 16f, 80f); // 绘制提示
        } // 条件结束
        if (paused) { // 暂停提示
            font.draw(batch, "暂停中：按 ESC 继续，按 T 返回标题", hudCamera.viewportWidth / 2f - 160f, hudCamera.viewportHeight / 2f); // 绘制暂停文本
        } // 条件结束
        batch.end(); // 结束绘制
    } // 方法结束

    @Override
    public void resize(int width, int height) { // 窗口大小变化
        hudCamera.setToOrtho(false, width, height); // 更新 HUD 相机
    } // 方法结束

    @Override
    public void dispose() { // 释放资源
        shapeRenderer.dispose(); // 释放形状渲染器
        batch.dispose(); // 释放批处理器
        font.dispose(); // 释放字体
    } // 方法结束
}
