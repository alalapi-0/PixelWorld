package game.world; // 定义初始世界生成器所在包

import game.world.tiles.TileTypes; // 引入地块类型

public final class InitialWorldGenerator { // 定义初始世界生成器类

    private final int width; // 地图宽度
    private final int height; // 地图高度

    public InitialWorldGenerator() { // 默认构造
        this(64, 64); // 使用默认尺寸
    } // 构造结束

    public InitialWorldGenerator(int width, int height) { // 自定义构造
        this.width = width; // 记录宽度
        this.height = height; // 记录高度
    } // 构造结束

    public GeneratedWorld generate() { // 生成世界
        TileTypes[][] tiles = new TileTypes[width][height]; // 创建地块数组
        fillWithGrass(tiles); // 填充草地
        int spawnX = width / 4; // 设置出生点 X
        int spawnY = height / 2; // 设置出生点 Y
        buildHouse(tiles, spawnX + 1, spawnY - 2); // 在出生点旁建造房子
        layRoad(tiles, spawnX, spawnY, spawnX + 1, spawnY - 1); // 铺设连接道路
        return new GeneratedWorld(tiles, spawnX, spawnY); // 返回生成结果
    } // 方法结束

    private void fillWithGrass(TileTypes[][] tiles) { // 填充草地
        for (int x = 0; x < width; x++) { // 遍历 X
            for (int y = 0; y < height; y++) { // 遍历 Y
                tiles[x][y] = TileTypes.GRASS; // 设置为草地
            } // 内层循环结束
        } // 外层循环结束
    } // 方法结束

    private void buildHouse(TileTypes[][] tiles, int originX, int originY) { // 构建房屋
        int houseWidth = 6; // 房屋宽度
        int houseHeight = 5; // 房屋高度
        int doorX = originX + houseWidth / 2; // 门的 X 坐标
        for (int x = 0; x < houseWidth; x++) { // 遍历房屋宽度
            for (int y = 0; y < houseHeight; y++) { // 遍历房屋高度
                int worldX = originX + x; // 转换为世界坐标 X
                int worldY = originY + y; // 转换为世界坐标 Y
                if (x == 0 || y == 0 || x == houseWidth - 1 || y == houseHeight - 1) { // 边缘为墙
                    if (y == 0 && worldX == doorX) { // 底边中间留门
                        tiles[worldX][worldY] = TileTypes.HOUSE_DOOR; // 设置为门
                    } else { // 其他边缘
                        tiles[worldX][worldY] = TileTypes.HOUSE_WALL; // 设置为墙
                    } // 条件结束
                } else { // 内部区域
                    tiles[worldX][worldY] = TileTypes.HOUSE_FLOOR; // 设置为地板
                } // 条件结束
            } // 内层循环结束
        } // 外层循环结束
    } // 方法结束

    private void layRoad(TileTypes[][] tiles, int startX, int startY, int endX, int endY) { // 铺设道路
        int minX = Math.min(startX, endX); // 计算最小 X
        int maxX = Math.max(startX, endX); // 计算最大 X
        int minY = Math.min(startY, endY); // 计算最小 Y
        int maxY = Math.max(startY, endY); // 计算最大 Y
        for (int x = minX; x <= maxX; x++) { // 铺设水平道路
            tiles[x][startY] = TileTypes.ROAD; // 设置为道路
        } // 循环结束
        for (int y = minY; y <= maxY; y++) { // 铺设垂直道路
            tiles[endX][y] = TileTypes.ROAD; // 设置为道路
        } // 循环结束
    } // 方法结束

    public static final class GeneratedWorld { // 定义生成结果结构
        public final TileTypes[][] tiles; // 地块数组
        public final int spawnX; // 出生点 X
        public final int spawnY; // 出生点 Y

        public GeneratedWorld(TileTypes[][] tiles, int spawnX, int spawnY) { // 构造函数
            this.tiles = tiles; // 记录地块
            this.spawnX = spawnX; // 记录 X
            this.spawnY = spawnY; // 记录 Y
        } // 构造结束
    } // 内部类结束
}
