# Personal Website V3

## Dependencies

- [Node.js](https://nodejs.org/) 20 or newer
- [Jekyll](https://jekyllrb.com/) (Ruby)

## Getting Started

1. `gem install jekyll`
1. `npm install`
1. `npm start`

`npm start` compiles the assets, builds the site with `_config_dev.yml` and
serves it through Browsersync with live reload.

`gem install jekyll` often puts the binary in a directory that is not on
`PATH`, typically when it is installed against a Homebrew ruby rather than the
system one. The build looks in the usual gem directories for it, so this
normally sorts itself out. If your ruby lives somewhere unusual, point at the
binary explicitly:

```sh
JEKYLL=/path/to/jekyll npm start
```

## Stylesheets

`css/main.css` is a build artifact that is **committed to the repository**, and
it is the file GitHub Pages serves. Jekyll does not compile `_scss/` — that is
Gulp's job — so editing a partial has no effect on the published site until the
stylesheet is rebuilt and committed:

```sh
npm run css
```

## Tasks

| Command             | Description                                          |
| ------------------- | ---------------------------------------------------- |
| `npm start`         | Build and serve with live reload                     |
| `npm run build`     | Full production build into `_site/`                  |
| `npm run css`       | Compile `_scss/` to `css/main.css` and `_site/css/`  |
| `npx gulp scripts`  | Lint `_scripts/` and copy to `js/`                   |
| `npx gulp images`   | Optimise `img/` into `_site/img/`                    |
