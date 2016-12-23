import gulp from 'gulp'
import gulpLoadPlugins from 'gulp-load-plugins'
import rimraf from 'rimraf'
import runSequence from 'run-sequence'
import browserSync from 'browser-sync'
import browserify from 'browserify'
import babelify from 'babelify'
import watchify from 'watchify'
import source from 'vinyl-source-stream'
import buffer from 'vinyl-buffer'
import historyApiFallback from 'connect-history-api-fallback'

var seq = runSequence.use(gulp)
var $ = gulpLoadPlugins({
    camelize: true
})
var path = {
    public: 'public/',
    browserifyCache: '.browserify-cache/',
    static: 'static/',
    styleEntrypoint: 'main.scss',
    style: 'public/stylesheets/',
    jsEntrypoint: 'main.js',
    js: 'public/javascripts/',
    jsFiles: '**/*.{js,jsx,es6}',
    imageFiles: '**/*.{jpg,jpeg,gif,png,svg}',
}
var opts = {
    isWatching: false,
    isDebug: false
}

gulp.task('build:sass', function() {
    return $.rubySass(path.style + path.styleEntrypoint)
        .on('error', function (err) {
            console.error('Error!', err.message)
         })
        .pipe($.cached('sass'))
        .pipe($.plumber())
        .pipe($.pleeease({
          autoprefixer: {
              browsers: ['last 5 versions']
          },
          minifier: true
        }))
        .pipe(gulp.dest(path.static))
        .pipe($.notify({
            message: 'Styles task complete'
        }))
})

gulp.task('babel', (cb) => {
    return gulp.src(path.js + path.jsFiles)
        .pipe($.cached('mv:js'))
        .pipe($.plumber())
        .pipe(gulp.dest(path.browserifyCache))
})

function compile() {
    // custom browserify options
    var b = browserify({
        entries: [path.browserifyCache + path.jsEntrypoint],
        debug: opts.isDebug,
        extensions: ['.js', '.json', '.es6']
    })
    b.transform(babelify)
    // add transformations
    if (opts.isWatching) {
        b = watchify(b)
        b.on('update', bundle)
        b.on('log', function(log) {
            console.log(log)
        })
    } else {
        b.transform({
            global: true
        }, 'uglifyify')
    }

    function bundle() {
        var _bundle = b.bundle().on('error', function() {
                var args = Array.prototype.slice.call(arguments)
                $.notify.onError({
                    title: 'Compile Error',
                    message: '<%= error %>'
                }).apply(this, args)
                this.emit('end')
            })
            .pipe(source('bundle.js'))
            .pipe(buffer())
            .pipe(gulp.dest(path.static))
            if (opts.isDebug) {
                _bundle = _bundle.pipe($.sourcemaps.init({
                    loadMaps: true
                })) // loads map from browserify file
                .pipe($.sourcemaps.write('./'))
            }
        return _bundle
    }
    return bundle()
}
gulp.task('build:js', (cb) => {
    compile()
    cb()
})

// Html
gulp.task('mv:html', (cb) => {
    return gulp.src(path.public + '{,**/}*.html')
        .pipe($.plumber())
        .pipe(gulp.dest(path.static))
})

// Json
gulp.task('mv:json', (cb) => {
    return gulp.src(path.public + '{,**/}*.json')
        .pipe($.plumber())
        .pipe(gulp.dest(path.static))
})


// Images
gulp.task('mv:images', (cb) => {
    return gulp.src(path.public + path.imageFiles)
        .pipe($.plumber())
        .pipe(gulp.dest(path.static))
})

//CSV
gulp.task('mv:csv', (cb) => {
    return gulp.src(path.public + '{,**/}*.csv')
        .pipe($.plumber())
        .pipe(gulp.dest(path.static))
})

gulp.task('enable:watch-mode', (cb) => {
    opts.isWatching = true
    cb()
})
gulp.task('enable:debug-mode', (cb) => {
    opts.isDebug = true
    cb()
})
gulp.task('clean:tmpdir', (cb) => {
    rimraf(path.browserifyCache, cb)
})

gulp.task('watch', (cb) => {
    browserSync.init({
        server: {
            baseDir: [path.static]
        },
        notify: false,
        stream: true
    });

    $.watch([path.public + '**/*.html'], function(cb) {
        seq('mv:html',browserSync.reload);
    });
    $.watch([path.public + '**/*.scss'], function(cb) {
        seq('build:sass',browserSync.reload);
    }); 
    $.watch([path.public + '**/*.{gif,jpg,jpeg,png,svg,ttf}'], function(cb) {
        seq('mv:images',browserSync.reload);
    });
    $.watch([path.js + '**/*'], function(cb) {
        seq('babel');
    })
    $.watch([path.static + '{,**/}*.js'], function(cb){
        browserSync.reload();
    })
})

gulp.task('default', (cb) => {
    seq('clean:tmpdir',
        'enable:debug-mode',
        'enable:watch-mode',
        ['mv:html','build:sass','babel','mv:csv',"mv:images", "mv:json"],
        'build:js',
        'watch',
        'clean:tmpdir',
        cb)
})