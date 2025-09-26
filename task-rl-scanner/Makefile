
all:
	rm -f index.js
	npm install
	npm update
	-npm audit fix --force
	npm ls
	npx gts fix *.ts
	npx gts lint *.ts
	tsc
	npm prune --omit=dev
	-npm ls
