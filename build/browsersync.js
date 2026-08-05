import { spawn } from 'node:child_process';
import browserSyncLib from 'browser-sync';
import gulp from 'gulp';
import { styles } from './sass.js';
import { scripts } from './scripts.js';

const browserSync = browserSyncLib.create();

// Jekyll is a Ruby gem and may not be on PATH (e.g. when it is installed
// against a Homebrew ruby). Set JEKYLL to point at the binary directly.
const jekyll =
  process.env.JEKYLL || (process.platform === 'win32' ? 'jekyll.bat' : 'jekyll');

const scssPath = '_scss/**/*.scss';
const jsPath = '_scripts/*.js';
const templatePath = [
  '*.html',
  '+(_includes|_layouts)/*.html',
  '*.yml',
  '_data/*.yml',
  '_posts/*',
];

function runJekyll(args, done) {
  spawn(jekyll, args, { stdio: 'inherit' })
    .on('error', err =>
      done(
        new Error(
          `Could not run "${jekyll}". Install it with \`gem install jekyll\` ` +
            `or set JEKYLL to the full path of the binary. (${err.message})`
        )
      )
    )
    .on('close', code =>
      done(code === 0 ? undefined : new Error(`jekyll exited with code ${code}`))
    );
}

export function jekyllBuild(done) {
  runJekyll(['build'], done);
}

export function jekyllDev(done) {
  runJekyll(['build', '--config', '_config.yml,_config_dev.yml'], done);
}

function reload(done) {
  browserSync.reload();
  done();
}

const jekyllRebuild = gulp.series(jekyllDev, reload);

export function serve(done) {
  browserSync.init({ server: { baseDir: '_site' } });

  gulp.watch(scssPath, gulp.series(styles, reload));
  gulp.watch(jsPath, gulp.series(scripts, reload));
  gulp.watch(templatePath, jekyllRebuild);

  done();
}
