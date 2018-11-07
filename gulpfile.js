// generated on 2018-04-09 using generator-webapp 3.0.1
const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const browserSync = require('browser-sync').create();
const browserSync2 = require('browser-sync');
const del = require('del');
const wiredep = require('wiredep').stream;
const runSequence = require('run-sequence');
const gulpFilter = require('gulp-filter'); // 4.0.0+

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

// const inline = require('gulp-inline');

const httpProxy = require('http-proxy');
const connect = require('gulp-connect-php7');
const uglify = require('gulp-uglify');
const minifycss = require('gulp-clean-css');
const rename = require('gulp-rename');
const flatten = require('gulp-flatten');

let dev = true;

gulp.task('styles', () => {
  return gulp.src('app/styles/*.scss')
    .pipe($.plumber())
    .pipe($.if(dev, $.sourcemaps.init()))
    .pipe($.sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', $.sass.logError))
    .pipe($.autoprefixer({browsers: ['> 1%', 'last 2 versions', 'Firefox ESR']}))
    .pipe($.if(dev, $.sourcemaps.write()))
    .pipe(gulp.dest('.tmp/css'))
    .pipe(reload({stream: true}));
});

gulp.task('scripts', () => {
  return gulp.src('app/scripts/**/*.js')
    .pipe($.plumber())
    .pipe($.if(dev, $.sourcemaps.init()))
    .pipe($.babel())
    .pipe($.if(dev, $.sourcemaps.write('.')))
    .pipe(gulp.dest('.tmp/js'))
    .pipe(reload({stream: true}));
});

gulp.task('libs', () => {
    return gulp.src('app/lib/**')
        .pipe(gulp.dest('.tmp/lib'))
        .pipe(reload({stream: true}));
});

// gulp.task('tmp', ['libs', 'phpmailer'], () => {
//     return gulp.src('.tmp/**')
//         .pipe(gulp.dest('dist'))
//         .pipe(reload({stream: true}));
// });


// gulp.task('phpmailer', () => {
//     return gulp.src('vendor/phpmailer/**')
//         .pipe(gulp.dest('.tmp/lib'))
//         .pipe(reload({stream: true}));
// });



function lint(files) {
  return gulp.src(files)
    .pipe($.eslint({ fix: true }))
    .pipe(reload({stream: true, once: true}))
    .pipe($.eslint.format())
    .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
}

gulp.task('lint', () => {
  return lint('app/scripts/**/*.js')
    .pipe(gulp.dest('app/scripts'));
});
gulp.task('lint:test', () => {
  return lint('test/spec/**/*.js')
    .pipe(gulp.dest('test/spec'));
});


gulp.task('html', ['styles', 'scripts', 'publish-components'], () => {
    return gulp.src('app/*.html')
    .pipe($.useref({searchPath: ['.tmp', 'app', '.']}))
    //.pipe($.if(/\.js$/, $.uglify({compress: {drop_console: true}})))
    //.pipe($.if(/\.css$/, $.cssnano({safe: true, autoprefixer: false})))
    .pipe($.if(/\.html$/, $.htmlmin({
      collapseWhitespace: false,
      minifyCSS: false,
      //minifyJS: {compress: {drop_console: false}},
      processConditionalComments: true,
      removeComments: true,
      removeEmptyAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true
    })))
    .pipe(gulp.dest('dist'));
});

// Define paths variables
var dest_path =  'dist';
// grab libraries files from bower_components, minify and push in /public
gulp.task('publish-components', function() {

    var jsFilter = gulpFilter('**/*.js', {restore: true});
    var cssFilter = gulpFilter('**/*.css', {restore: true});
    var fontFilter = gulpFilter(['**/*.eot', '**/*.woff', '**/*.svg', '**/*.ttf']);

    return gulp.src(require('main-bower-files')('app/*.html', function (err) {}))

        // grab vendor js files from bower_components, minify and push in /public
        .pipe(jsFilter)
        .pipe(gulp.dest(dest_path + '/js/'))
        .pipe(uglify())
        .pipe(rename({
            suffix: ".min"
        }))
        .pipe(gulp.dest(dest_path + '/js/'))
        .pipe(jsFilter.restore)

        // grab vendor css files from bower_components, minify and push in /public
        .pipe(cssFilter)
        .pipe(gulp.dest(dest_path + '/css'))
        .pipe(minifycss())
        .pipe(rename({
            suffix: ".min"
        }))
        .pipe(gulp.dest(dest_path + '/css'))
        .pipe(cssFilter.restore)

        // grab vendor font files from bower_components and push in /public
        .pipe(fontFilter)
        .pipe(flatten())
        .pipe(gulp.dest(dest_path + '/fonts'));
});

gulp.task('images', () => {
  return gulp.src('app/res/**/*')
    .pipe($.cache($.imagemin()))
    .pipe(gulp.dest('dist/res'));
});

gulp.task('fonts', () => {
  return gulp.src(require('main-bower-files')('**/*.{eot,svg,ttf,woff,woff2}', function (err) {})
    .concat('app/fonts/**/*'))
    .pipe($.if(dev, gulp.dest('.tmp/fonts'), gulp.dest('dist/fonts')));
});

gulp.task('extras', () => {
  return gulp.src([
    '.app/**',
    '!app/*.html'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'));
});

gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

gulp.task('serve', () => {
  runSequence(['clean', 'wiredep'], ['styles', 'scripts', 'fonts', 'libs'/*, 'phpmailer'*/], () => {

      connect.server({
          port: 9001,
          base: 'app',
          open: false
      });

      const proxy = httpProxy.createProxyServer({});

      browserSync2({
          notify: false,
          port  : 9000,
          server: {
              baseDir: ['.tmp', 'app'],
              routes    : {
                  '/bower_components': 'bower_components'
              },
              middleware: function (req, res, next) {
                  var url = req.url;

                  if (!url.match(/^\/(css|js|styles|fonts|bower_components)\//)) {
                      proxy.web(req, res, { target: 'http://127.0.0.1:9001' });
                  } else {
                      next();
                  }
              }
          }
      });

      gulp.watch('**/*.html').on('change', function () {
          browserSync2.reload();
      });

      gulp.watch([
      'app/*.html',
      'app/images/**/*',
      '.tmp/fonts/**/*'
    ]).on('change', reload);

    gulp.watch('app/styles/**/*.scss', ['styles']);
    gulp.watch('app/scripts/**/*.js', ['scripts']);
    gulp.watch('app/fonts/**/*', ['fonts']);
    gulp.watch('bower.json', ['wiredep', 'fonts']);
  });
});

gulp.task('serve:dist', ['default'], () => {

    connect.server({
        port: 9001,
        base: 'dist',
        open: false
    });

    const proxy = httpProxy.createProxyServer({});

    browserSync2({
        notify: false,
        port  : 9000,
        server: {
            baseDir   : ['dist'],
            routes    : {
                '/bower_components': 'bower_components'
            },
            middleware: function (req, res, next) {
                var url = req.url;

                if (!url.match(/^\/(css|js|fonts|bower_components)\//)) {
                    proxy.web(req, res, { target: 'http://127.0.0.1:9001' });
                } else {
                    next();
                }
            }
        }
    });

    gulp.watch('**/*.html').on('change', function () {
        browserSync2.reload();
    });

    gulp.watch([
        'app/*.html',
        'app/images/**/*',
        '.tmp/fonts/**/*'
    ]).on('change', reload);

    gulp.watch('app/styles/**/*.scss', ['styles']);
    gulp.watch('app/scripts/**/*.js', ['scripts']);
    gulp.watch('app/fonts/**/*', ['fonts']);
    gulp.watch('bower.json', ['wiredep', 'fonts']);
});

gulp.task('serve:test', ['scripts'], () => {
  browserSync.init({
    notify: false,
    port: 9000,
    ui: false,
    server: {
      baseDir: 'test',
      routes: {
        '/scripts': '.tmp/scripts',
        '/bower_components': 'bower_components'
      }
    }
  });

  gulp.watch('app/scripts/**/*.js', ['scripts']);
  gulp.watch(['test/spec/**/*.js', 'test/**/*.html']).on('change', reload);
  gulp.watch('test/spec/**/*.js', ['lint:test']);
});

// inject bower components
gulp.task('wiredep', () => {
  gulp.src('app/styles/*.scss')
    .pipe($.filter(file => file.stat && file.stat.size))
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)+/
    }))
    .pipe(gulp.dest('app/styles'));

  gulp.src('app/*.html')
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest('app'));
});

gulp.task('build', ['lint', 'html', 'images', 'fonts', 'extras', 'libs'/*, 'phpmailer'*//*, 'tmp'*/, 'publish-components'], () => {
  return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

//make all css and js inline
// gulp.task('makeInline', () => {
//     gulp.src('dist/*.html')
//         .pipe(inline({
//             base: 'dist/',
//             disabledTypes: ['svg', 'img']
//         }))
//         .pipe(gulp.dest('dist'));
//
//     //del fonts/images/scripts/styles folders
//     setTimeout(function() {
//         del([
//             'dist/images',
//             'dist/styles',
//             'dist/fonts',
//             'dist/scripts'
//         ]);
//     }, 1000);
// });

gulp.task('default', () => {
  return new Promise(resolve => {
    dev = false;
    //runSequence(['clean', 'wiredep'], 'build', 'makeInline', resolve);
    runSequence(['clean', 'wiredep'], 'build', resolve);
  });
});



