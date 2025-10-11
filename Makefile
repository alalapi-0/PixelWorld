.PHONY: assets map user-import user-verify user-preview miniworld-dev miniworld-build miniworld-test build-all

assets:
	python3 scripts/gen_tiles_and_player.py
	python3 scripts/gen_demo_map.py

map:
	python3 scripts/gen_demo_map.py

user-import:
	python3 scripts/import_user_assets.py

user-verify:
	python3 scripts/verify_user_assets.py

user-preview:
	python3 scripts/preview_user_assets.py

miniworld-dev:
	pnpm --filter miniworld dev

miniworld-build:
	pnpm --filter miniworld build

miniworld-test:
	pnpm --filter miniworld test

build-all:
	$(MAKE) user-import
	gradle build
	pnpm --filter miniworld build
