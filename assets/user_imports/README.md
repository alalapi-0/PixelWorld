# 用户素材放置说明

- `tiles/`：放置自定义地形图集或散瓦片。
- `characters/`：放置角色雪碧图或拆分帧。
- `maps/`：可选放置 Tiled 导出的 TMX/JSON 地图。
- `user_manifest.json`：可选配置文件，可覆盖默认尺寸与绑定。

将外部素材放入上述目录后运行 `make user-import` 完成标准化，再运行 `make user-verify` 校验。
