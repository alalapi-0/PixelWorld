# 生成真实 PNG 素材（瓦片图集与玩家动画），输出到 assets/build/**
assets:
	python scripts/gen_tiles_and_player.py
	python scripts/gen_demo_map.py

# 仅生成地图（调整尺寸或随机种子时可单独运行）
map:
	python scripts/gen_demo_map.py

# 启动静态服务器预览 Phaser 像素地图原型
web-run:
	python -m http.server -d frontend/phaser 8080

# 将用户素材导入并标准化到 assets/build/**，自动更新映射
user-import:
	python scripts/import_user_assets.py

# 校验用户素材目录与清单配置的匹配情况
user-verify:
	python scripts/verify_user_assets.py

# 一键导入、校验并开启前端预览服务器
user-preview:
	python scripts/import_user_assets.py && \
	python scripts/verify_user_assets.py && \
	python -m http.server -d frontend/phaser 8080

# 启动一个静态服务器预览 PIXI 前端骨架（默认端口 8081）
web-pixi:
	python -m http.server -d frontend/pixi 8081

# 生成 PIXI 演示地图（供前端回退使用）
map-demo:
	python scripts/gen_demo_map.py
