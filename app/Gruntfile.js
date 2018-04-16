
module.exports = (grunt) => {

    grunt.file.setBase('..');
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({

        express: {
            dev: {
                options: {
                    script: 'app/index.js',
                    node_env: 'dev',
                    port: process.env.PORT,
                    output: 'started'
                }
            },
            test: {
                options: {
                    script: 'app/index.js',
                    node_env: 'test',
                    port: 5000,
                    output: 'started'
                }
            }
        },

        mochaTest: {
            e2e: {
                options: {
                    reporter: 'spec',
                    quiet: false,
                    clearRequireCache: true,
                },
                src: ['app/test/e2e/**/*.spec.js']
            }
        },

        watch: {
            options: {
                livereload: 35730
            },
            jssrc: {
                files: [
                    'app/src/**/*.js',
                ],
                tasks: ['express:dev'],
                options: {
                    spawn: false
                }
            },
            e2eTest: {
                files: [
                    'app/test/e2e/**/*.spec.js',
                ],
                tasks: ['express:test', 'mochaTest:e2e'],
                options: {
                    spawn: true
                }
            },

        }
    });

    grunt.registerTask('e2eTest', ['express:test', 'mochaTest:e2e']);

    grunt.registerTask('e2eTest-watch', ['watch:e2eTest']);

    grunt.registerTask('serve', ['express:dev', 'watch']);

    grunt.registerTask('default', 'serve');

};
