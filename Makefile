# 初始化或下载CC0素材到本地构建目录
assets:
	python scripts/fetch_assets.py --only-cc0

# 校验瓦片与角色绑定文件是否指向有效资源
assets-verify:
	python scripts/verify_bindings.py

# 启动简易HTTP服务器预览Phaser像素地图原型
web-run:
	python -m http.server -d frontend/phaser 8080
