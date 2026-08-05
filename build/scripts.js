import gulp from 'gulp';
import eslint from 'gulp-eslint-new';

const jsPath = '_scripts/*.js';
const destPath = '_site/js';

// Lint and copy _scripts/ to both the Jekyll output and js/, which is the
// copy committed to git. Minification stays off so the shipped js/main.js
// remains readable and diffable.
export function scripts() {
  return gulp
    .src(jsPath)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(gulp.dest(destPath))
    .pipe(gulp.dest('js'));
}

scripts.displayName = 'scripts';
