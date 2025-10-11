.PHONY: miniworld-dev miniworld-build miniworld-test user-import user-import-move user-import-rules user-preview build-all miniworld-preview miniworld-manager assets-analyze assets-rename-dry assets-rename-apply assets-rename-revert synth-defaults miniworld-auto # 声明新增命令

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

assets-analyze:
	python3 scripts/analyze_assets.py \
	  --sources assets/user_imports assets/build \
	  --out-plan assets/rename/rename_plan.json \
	  --out-conflicts assets/rename/conflicts.json

assets-rename-dry:
	python3 scripts/apply_renames.py --plan assets/rename/rename_plan.json

assets-rename-apply:
	python3 scripts/apply_renames.py --plan assets/rename/rename_plan.json --apply

assets-rename-revert:
	python3 scripts/apply_renames.py --revert assets/rename/revert_log.json

synth-defaults: # 生成智能默认草案
	python3 scripts/synth_defaults.py # 调用脚本生成auto数据

miniworld-auto: # 启动开发环境并确保先生成auto数据
	make synth-defaults # 先执行数据合成
	pnpm --filter miniworld dev # 启动前端开发服务器

