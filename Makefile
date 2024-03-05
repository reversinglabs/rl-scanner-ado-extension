
DIR	= task-rl-scanner

build:
	./verify-version-sync.sh
	pushd $(DIR); make; popd
	tfx extension create --manifest-globs vss-extension.json
	rm $(DIR)/index.js
