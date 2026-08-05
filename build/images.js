import gulp from 'gulp';
import imagemin from 'gulp-imagemin';

const imgPath = 'img/**/*.+(png|jpg|gif|svg)';
const destPath = '_site/img';

// encoding: false is required from gulp 5 onwards — without it gulp decodes
// binary files as UTF-8 and corrupts every image it touches.
export function images() {
  return gulp
    .src(imgPath, { encoding: false })
    .pipe(imagemin())
    .pipe(gulp.dest(destPath));
}

images.displayName = 'images';
