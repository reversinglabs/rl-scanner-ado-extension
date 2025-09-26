
DIR	= task-rl-scanner

build:
	./verify-version-sync.sh
	npm install
	npm update
	-npm audit fix --force
	npm ls
	pushd $(DIR) && make && popd
	npm prune --omit=dev
	-npm ls
	tfx extension create --manifest-globs vss-extension.json
	rm $(DIR)/index.js
	ls -l *.vsix
	du -sm *.vsix
