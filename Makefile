LIBDIR=static/libs

default: run-server

help:
	echo 'make targets:'
	@echo '  help          This message'
	@echo '  deps          Download and install all dependencies (for compiling / testing / CLI operation)'
	@echo '  compile       Create output files from source files where necessary'
	@echo '  test          Run tests'
	@echo '  run-server    Run the server'
	@echo '  clean         Remove temporary files'
	@echo '  install-service  (root only) Install the systemd service'


deps:
	npm install

test:
	@npm test

clean:
	@npm clean

run-server:
	node_modules/.bin/node-supervisor src/bbt.js

lint: eslint stylelint ## Verify source code quality

eslint: eslint-server eslint-client

eslint-server:
	@node_modules/.bin/eslint src/ div/

eslint-client:
	@node_modules/.bin/eslint -c static/.eslintrc.yml static/*.js

stylelint:
	@./node_modules/.bin/stylelint static/*.css

install-service:
	sed -e "s#BBT_ROOT_DIR#$$PWD#" div/bbt.service.template > /etc/systemd/system/bbt.service
	systemctl enable bbt
	systemctl start bbt

install-docker:
	docker build . -t bbt
	docker rm -f bbt
	docker run --restart=always --name bbt -p 19005:9005 bbt

cleandist:
	rm -rf -- dist

dist: cleandist ## Create distribution files
	mkdir -p dist/
	node div/make_dist.js . dist/
	mkdir -p dist/static/logos/
	node_modules/.bin/svgo -q --folder static/logos/ -o dist/static/logos/

docker:
	docker build . -t bbt
	docker run -it --name bbt --rm -p 19005:9005 bbt

.PHONY: default compile help deps test clean run-server lint eslint eslint-server eslint-client install-service stylelint cleandist docker
