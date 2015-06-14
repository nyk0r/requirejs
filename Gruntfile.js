module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            files: ['require.js']
        },
        mocha: {
            test: {
                src: ['spec/index.html'],
            },
            options: {
                run: true,
                reporter: 'Dot'
            }
        },
        jsdoc : {
            dist : {
                src: ['require.js'],
                    options: { destination: 'doc' }
                }
        },
        watch: {
            files: 'require.js',
            tasks: ['jshint', '']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-mocha');

    grunt.registerTask('test', ['jshint', 'mocha']);
};
