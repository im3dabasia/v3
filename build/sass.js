import gulp from 'gulp';
import gulpSass from 'gulp-sass';
import * as dartSass from 'sass';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

const sass = gulpSass(dartSass);

const scssPath = '_scss/*.scss';
const destPath = '_site/css';

// Compile _scss/ into both the Jekyll output and css/, which is the copy
// committed to git and the one GitHub Pages actually serves.
export function styles() {
  return gulp
    .src(scssPath)
    .pipe(
      sass({
        loadPaths: ['_scss'],
        style: 'expanded',
        // The partials still use @import; silence the deprecation notice
        // until they are migrated to @use.
        silenceDeprecations: ['import'],
      }).on('error', sass.logError)
    )
    // autoprefixer reads the browserslist key in package.json.
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(gulp.dest(destPath))
    .pipe(gulp.dest('css'));
}

styles.displayName = 'sass';
