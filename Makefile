.PHONY: miniworld-dev miniworld-build miniworld-test user-import user-preview build-all

miniworld-dev:
	pnpm --filter miniworld dev

miniworld-build:
	pnpm --filter miniworld build

miniworld-test:
	pnpm --filter miniworld test

user-import:
	python3 scripts/import_user_assets.py

user-preview:
	python3 scripts/preview_user_assets.py

build-all:
	make user-import
	gradle build
	pnpm --filter miniworld build
