
DIR	= task-rl-scanner

build:
	./verify-version-sync.sh
	npm install
	npm update
	pushd $(DIR); make; popd
	npm prune --omit=dev --json
	tfx extension create --manifest-globs vss-extension.json
	# rm $(DIR)/index.js
