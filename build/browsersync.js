import { spawn } from 'node:child_process';
import { accessSync, constants, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, join } from 'node:path';
import browserSyncLib from 'browser-sync';
import gulp from 'gulp';
import { styles } from './sass.js';
import { scripts } from './scripts.js';

const browserSync = browserSyncLib.create();

const jekyllBin = process.platform === 'win32' ? 'jekyll.bat' : 'jekyll';

function isExecutable(file) {
  try {
    accessSync(file, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function findOnPath(bin) {
  const dirs = (process.env.PATH || '').split(delimiter).filter(Boolean);
  return dirs.map(dir => join(dir, bin)).find(isExecutable) || null;
}

// Gems installed against a Homebrew or user ruby land in a bin directory that
// is usually not on PATH, so `gem install jekyll` alone is not enough to make
// `jekyll` runnable. Look in the usual places before giving up.
function findInGemDirs(bin) {
  const roots = [
    '/opt/homebrew/lib/ruby/gems',
    '/usr/local/lib/ruby/gems',
    join(homedir(), '.gem', 'ruby'),
  ];

  for (const root of roots) {
    let versions;
    try {
      versions = readdirSync(root);
    } catch {
      continue;
    }
    // Newest ruby first, so 3.10 beats 3.4.
    versions.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    const found = versions
      .map(version => join(root, version, 'bin', bin))
      .find(isExecutable);
    if (found) return found;
  }

  return null;
}

// JEKYLL wins if set, otherwise fall back to the bare name so the error
// message below is the one the user sees.
const jekyll =
  process.env.JEKYLL || findOnPath(jekyllBin) || findInGemDirs(jekyllBin) || jekyllBin;

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
