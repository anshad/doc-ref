//jshint strict: false
var gulp = require('gulp'),
concat = require('gulp-concat'),
connect = require('gulp-connect'),
del = require('del'),
minifyHTML = require('gulp-htmlmin'),
templatecache = require('gulp-angular-templatecache'),
sass = require('gulp-sass'),
minifyCSS = require('gulp-clean-css'),
uglify = require('gulp-uglify'),
stripDebug = require('gulp-strip-debug'),
gulpif = require('gulp-if'),
appCache = require('gulp-appcache'),
sourcemaps = require('gulp-sourcemaps'),
jshint = require('gulp-jshint'),
stylish = require('jshint-stylish'),
sassLint = require('gulp-sass-lint'),
injectVersion = require('gulp-inject-version'),
replace = require('gulp-replace');

var devDir = './www',
distDir = './dist',
srcDir = './src',
dist = false;

//Clean the build directory
gulp.task('clean', function(cb) {
	del([distDir + '/**'], cb);
});

/* Build Fonts */
gulp.task('fonts', function() {
	var fonts = [
	'./bower_components/font-awesome/fonts/**.*',
	'./bower_components/bootstrap/dist/fonts/**.*',
	srcDir + '/assets/fonts/helvetica/**.*'
	];

	return gulp.src(fonts)
	.pipe(gulpif(!dist, gulp.dest(devDir + '/fonts')))
	.pipe(gulpif(dist, gulp.dest(distDir + '/fonts')));
});

/* Build Images */
gulp.task('images', function() {
	return gulp.src(srcDir + '/assets/images/**/*')
	.pipe(gulpif(!dist, gulp.dest(devDir + '/images/')))
	.pipe(gulpif(dist, gulp.dest(distDir + '/images/')));
});

/* Build CSS */
gulp.task('styles', function() {
	var styles = [
	'./bower_components/font-awesome/scss/font-awesome.scss',
	'./bower_components/angular-toastr/dist/angular-toastr.min.css',
	'./bower_components/font-awesome-animation/dist/font-awesome-animation.min.css',
	'./bower_components/angular-ui-select/dist/select.css',
	srcDir + '/assets/styles/daterangepicker.css',
	srcDir + '/assets/styles/app.scss'
	];
	return gulp.src(styles)
	.pipe(sourcemaps.init())
	.pipe(sass())
	.pipe(concat('app.min.css'))
	.pipe(gulpif(!dist, minifyCSS()))
	.pipe(gulpif(!dist, sourcemaps.write('/')))
	.pipe(gulpif(!dist, gulp.dest(devDir + '/styles/')))
	.pipe(gulpif(!dist, connect.reload()))
	.pipe(gulpif(dist, minifyCSS()))
	.pipe(gulpif(dist, gulp.dest(distDir + '/styles/')));
});

gulp.task('deps', function() {
	var libs = [
	'./bower_components/jquery/dist/jquery.js',
	'./bower_components/angular/angular.js',
	'./bower_components/angular-sanitize/angular-sanitize.js',
	'./bower_components/angular-animate/angular-animate.js',
	'./bower_components/angular-ui-router/release/angular-ui-router.js',
	'./node_modules/angular1-ui-bootstrap4/dist/ui-bootstrap.js',
	'./node_modules/angular1-ui-bootstrap4/dist/ui-bootstrap-tpls.js',
	'./bower_components/angular-ui-select/dist/select.js',
	'./bower_components/tether/dist/js/tether.js',
	'./bower_components/bootstrap/dist/js/bootstrap.js',
	'./bower_components/bootbox.js/bootbox.js',
	'./bower_components/angular-toastr/dist/angular-toastr.tpls.min.js',
	'./bower_components/underscore/underscore-min.js',
	'./bower_components/angulartics/dist/angulartics.min.js',
	'./bower_components/d3/d3.js',
	'./bower_components/d3-tip/index.js',
	'./node_modules/d3-textwrap/build/d3-textwrap.js',
	'./bower_components/moment/moment.js',
	srcDir + '/assets/js/daterangepicker.js',
	];

	return gulp.src(libs)
	.pipe(sourcemaps.init())
	.pipe(concat('dep.min.js'))
	.pipe(uglify())
	.pipe(gulpif(!dist, sourcemaps.write('/')))
	.pipe(gulpif(dist, stripDebug()))
	.pipe(gulpif(!dist, gulp.dest(devDir + '/scripts/')))
	.pipe(gulpif(dist, gulp.dest(distDir + '/scripts/')));
});

gulp.task('scripts', function() {

	function createErrorHandler(name) {
		return function(err) {
			console.error('Error from ' + name + ' in compress task', err.toString());
		};
	}

	return gulp.src(srcDir + '/app/**/*.js')
	.on('error', createErrorHandler('gulp.src'))
	.pipe(replace(/('|")use strict\1/g, ''))
	.on('error', createErrorHandler('remove'))
	.pipe(sourcemaps.init())
	.pipe(concat('app.min.js'))
	.pipe(gulpif(!dist, connect.reload()))
	.pipe(gulpif(dist, uglify()))
	.on('error', createErrorHandler('uglify'))
	.pipe(gulpif(dist, stripDebug()))
	.on('error', createErrorHandler('strip'))
	.pipe(gulpif(!dist, sourcemaps.write('/')))
	.pipe(gulpif(!dist, gulp.dest(devDir + '/scripts/')))
	.pipe(gulpif(dist, gulp.dest(distDir + '/scripts/')))
	.on('error', createErrorHandler('gulp.dest'));
});


//build json
gulp.task('json', function() {
	return gulp.src(srcDir + '/app/components/**/*.json')
	.pipe(gulpif(!dist, gulp.dest(devDir + '/scripts')));
});

gulp.task('templates', function() {
	return gulp.src(srcDir + '/app/**/*.html')
	.pipe(minifyHTML({
		empty: true,
		quotes: true,
		spare: true
	}))
	.pipe(templatecache('tpl.min.js', {
		module: 'somnoware.templates',
		standalone: true
	}))
	.pipe(uglify())
	.pipe(gulpif(!dist, gulp.dest(devDir + '/scripts/')))
	.pipe(gulpif(!dist, connect.reload()))
	.pipe(gulpif(dist, gulp.dest(distDir + '/scripts/')));
});

gulp.task('html', function() {
	return gulp.src(srcDir + '/index.html')
	.pipe(injectVersion({
		replace: /%%GULP_INJECT_VERSION%%/g
	}))
	.pipe(gulpif(!dist, gulp.dest(devDir)))
	.pipe(gulpif(!dist, connect.reload()))
	.pipe(gulpif(dist, gulp.dest(distDir)));
});

gulp.task('connect-dev', function() {
	return connect.server({
		root: 'www',
		port: '1212',
		livereload: true
	});
});

gulp.task('watch', function() {
	gulp.watch(srcDir + '/app/**/*.html', ['html']);
	gulp.watch(srcDir + '/app/**/*.js', ['scripts', 'jslint']);
	gulp.watch(srcDir + '/**/*.scss', ['styles', 'csslint']);
	gulp.watch(srcDir + '/app/**/*.html', ['templates']);
	gulp.watch(srcDir + '/assets/**/*.json', ['json']);
});

gulp.task('appCache', function() {
	return gulp.src(distDir)
	.pipe(appCache({
		hash: true,
		timestamp: false,
		preferOnline: true,
		network: ['http://*', 'https://*', '*'],
		filename: 'app.manifest',
		exclude: 'app.manifest'
	}))
	.pipe(gulp.dest(distDir));
});

gulp.task('devCache', function() {
	return gulp.src(distDir + '/**/*')
	.pipe(appCache({
		hash: true,
		timestamp: false,
		preferOnline: true,
		network: ['http://*', 'https://*', '*'],
		filename: 'app.manifest',
		exclude: 'app.manifest'
	}))
	.pipe(gulp.dest(devDir));
});

// Lint Task - Lint all javascript files using jshint
gulp.task('jslint', function() {
	return gulp.src(srcDir + '/app/**/*.js')
	.pipe(jshint())
	.pipe(jshint.reporter(stylish));
});

// Lint Task - Lint all SASS/CSS files
gulp.task('csslint', function() {
	return gulp.src([srcDir + '/app/**/*.s+(a|c)ss',
	                srcDir + '/assets/styles/app.scss',
	                srcDir + '/assets/styles/variables/*.s+(a|c)ss'
	                ])
	.pipe(sassLint({
		configFile: '.sass-lint.yml'
	}))
	.pipe(sassLint.format())
	.pipe(sassLint.failOnError());
});

gulp.task('set-production', function() {
	dist = true;
});

gulp.task('dev', ['fonts','styles','html','deps','scripts','templates','images','connect-dev','json', 'jslint', 'csslint', 'watch']);

gulp.task('dist', ['set-production','clean','fonts','styles','html','deps','scripts','templates','images','appCache']);

// Default Task
gulp.task('default', ['dev'], function() {});
