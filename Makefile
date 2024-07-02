
.PHONY: deno
deno:
	deno run --allow-read --allow-env --allow-write main.ts -d

.PHONY: tests
tests:
	deno test --allow-read --allow-env --allow-write

crots: crots
	deno compile --allow-read --allow-env --allow-write --output crots main.ts

.PHONY: clean
clean:
	rm crots || true

.PHONY: fmt
fmt:
	deno fmt --check
	@echo "Use deno fmt"

.PHONY: lint
lint:
	deno lint
