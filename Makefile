all: crots
	$(MAKE) clean
	$(MAKE) tests
	$(MAKE) lint
	$(MAKE) fmt
	$(MAKE) fmt-do
	$(MAKE) crots
	@echo "\nUse the following command to add "crots" in your PATH:"
	@echo '  export PATH=$$PATH:'"$$(pwd)"

.PHONY: run
run:
	deno run --allow-env --allow-read --allow-write --allow-run main.ts -d

.PHONY: test
test:
	deno test --allow-read --allow-env --allow-write -- --input_file=tests/test.db

crots:
	deno compile \
	--allow-env \
	--allow-run \
	--allow-read \
	--allow-write \
	--target=x86_64-unknown-linux-gnu \
	--output ./build/crots_x86_64-linux main.ts;
	deno compile \
	--allow-env \
	--allow-run \
	--allow-read \
	--allow-write \
	--target=aarch64-unknown-linux-gnu \
	--output ./build/crots_aarch64-linux main.ts;
	deno compile \
	--allow-env \
	--allow-run \
	--allow-read \
	--allow-write \
	--target=x86_64-pc-windows-msvc \
	--output ./build/crots_x86_64-win main.ts;
	deno compile \
	--allow-env \
	--allow-run \
	--allow-read \
	--allow-write \
	--target=x86_64-apple-darwin \
	--output ./build/crots_x86_64-darwin main.ts;
	deno compile \
	--allow-env \
	--allow-run \
	--allow-read \
	--allow-write \
	--target=aarch64-apple-darwin \
	--output ./build/crots_aarch64-darwin main.ts;

.PHONY: clean
clean:
	rm crots || true

.PHONY: fmt
fmt:
	@echo "Note: use 'deno fmt' to auto fix"
	deno fmt --check *.ts

.PHONY: fmt-do
fmt-do:
	deno fmt *.ts

.PHONY: lint
lint:
	deno lint *.ts
