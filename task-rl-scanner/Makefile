
all:
	rm -f index.js
	-npm install
	npx gts lint *.ts
	npx gts fix *.ts
	tsc
	npm prune --omit=dev --json
