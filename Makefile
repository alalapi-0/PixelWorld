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
