.PHONY: miniworld-dev miniworld-build miniworld-test user-import user-import-move user-import-rules user-preview build-all

miniworld-dev:
	pnpm --filter miniworld dev

miniworld-build:
	pnpm --filter miniworld build

miniworld-test:
	pnpm --filter miniworld test

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
