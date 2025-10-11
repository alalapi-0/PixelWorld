.PHONY: miniworld-dev miniworld-build miniworld-test user-import user-import-move user-import-rules user-preview build-all miniworld-preview miniworld-manager # 声明新增命令

miniworld-dev:
	pnpm --filter miniworld dev

miniworld-build:
	pnpm --filter miniworld build

miniworld-test:
	pnpm --filter miniworld test

miniworld-preview:
        pnpm --filter miniworld dev -- --scene=ResourceBrowser

miniworld-manager: # 启动素材管理器场景
        pnpm --filter miniworld dev -- --scene=ResourceManager # 通过命令行参数进入管理器

user-import:
	python3 scripts/import_user_assets.py

user-import-move:
	python3 scripts/import_user_assets.py --move

user-import-rules:
	python3 scripts/import_user_assets.py --rules assets/mapping/import_rules.json

user-preview:
	python3 scripts/preview_user_assets.py

build-all:
	make user-import
	gradle build
	pnpm --filter miniworld build
