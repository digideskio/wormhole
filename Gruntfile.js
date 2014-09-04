'use strict';

module.exports = function (grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),


		connect: {
			server: {
				options: {
					port: 4790,
					base: '.'
				}
			}
		},


		jshint: {
			all: ['src/*.js'],

			options: {
				newcap: false,	// "Tolerate uncapitalized constructors"
				node: true,
				expr: true, // - true && call() "Expected an assignment or function call and instead saw an expression."
				supernew: true, // - "Missing '()' invoking a constructor."
				laxbreak: true,
				white: true,
				globals: {
					define: true,
					test: true,
					expect: true,
					module: true,
					asyncTest: true,
					start: true,
					ok: true,
					equal: true,
					notEqual: true,
					deepEqual: true,
					window: true,
					document: true,
					performance: true
				}
			}
		},


		qunit: {
			all: ['tests/index.html'],
			options: {
				'--web-security': 'no',
				coverage: {
					src: ['wormhole.js'],
					instrumentedFiles: 'temp/',
					htmlReport: 'report/coverage',
					coberturaReport: 'report/',
					linesThresholdPct: 100,
					functionsThresholdPct: 100,
					branchesThresholdPct: 100,
					statementsThresholdPct: 100
				}
			}
		},


		requirejs: {
			src: 'src/wormhole.js',
			dst: 'wormhole.js'
		},


		watch: {
			scripts: {
				files: 'src/*.*',
				tasks: ['requirejs'],
				options: { interrupt: true }
			}
		}
	});


	grunt.registerTask('requirejs', 'RequireJS to plain/javascript', function () {
		var deps = {};

		function file(name) {
			return config.src.split('/').slice(0, -1).concat(name).join('/') + '.js';
		}

		function parse(src) {
			var content = grunt.file.read(src);

			content = content
				.trim()
				.replace(/define\((\[.*?\]).*?\n/, function (_, str) {
					JSON.parse(str).forEach(function (name) {
						deps[name] = parse(file(name));
					});

					return '';
				})
				.replace(/\}\);$/, '')
				.replace(/\/\/\s+Export[\s\S]+/, '')
			;

			return content;
		}

		var config = grunt.config(this.name);
		var content = parse(config.src);
		var intro = '(function (window, document) {\n';
		var outro = '})(window, document);';

		for (var name in deps) {
			intro += deps[name] + '\n\n';
		}

		grunt.log.oklns('Write file:', config.dst, Object.keys(deps));
		grunt.file.write(config.dst, intro + content + outro);
	});


	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-qunit-istanbul');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-watch');


	grunt.registerTask('dev', ['connect', 'watch']);
	grunt.registerTask('test', ['jshint', 'requirejs', 'connect', 'qunit']);
	grunt.registerTask('default', ['test']);
};