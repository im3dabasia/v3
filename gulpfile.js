import gulp from 'gulp';
import { styles } from './build/sass.js';
import { scripts } from './build/scripts.js';
import { images } from './build/images.js';
import { jekyllBuild, jekyllDev, serve as startServer } from './build/browsersync.js';

// Individual tasks, so `gulp sass` and friends still work.
export { styles as sass, scripts, images, jekyllBuild, jekyllDev };

// Assets first, then Jekyll, so the build picks up freshly compiled CSS.
export const build = gulp.series(
  gulp.parallel(styles, scripts, images),
  jekyllBuild
);

export const serve = gulp.series(styles, scripts, jekyllDev, startServer);

export default build;
