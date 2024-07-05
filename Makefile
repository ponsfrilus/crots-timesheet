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
	deno run --allow-read --allow-env --allow-write main.ts -d

.PHONY: test
test:
	deno test --allow-read --allow-env --allow-write -- --input_file=tests/test.db

crots: crots
	deno compile --allow-read --allow-env --allow-write --output crots main.ts

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
