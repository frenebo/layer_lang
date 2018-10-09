var gulp = require("gulp");
var ts = require("gulp-typescript");
var del = require("del");
var webserver = require("gulp-webserver");

gulp.task("clean", () => del(["build"]));

gulp.task("copy", () => gulp.src(["app/**/*", "!app/scripts/**/*.ts"]).pipe(gulp.dest("build")));

gulp.task("start_server", () => gulp.src("build").pipe(webserver({
  port: 3000,
  livereload: false,
  directoryListing: {
    enable: false,
    path: "build",
  },
  // open: true,
})));

var project = ts.createProject('tsconfig.json');

gulp.task("ts", function() {
  return gulp.src(["app/scripts/**/*.ts", "node_modules/types/@types/**/*.d.ts"])
    .pipe(project()).js
    .pipe(gulp.dest("build/scripts"));
});

gulp.task("ace_copy", () => {
  return gulp.src("node_modules/ace-builds/src-noconflict/**/*").pipe(gulp.dest("build/dependencies/ace-src"));
});

gulp.task("dependencies", gulp.series("ace_copy"));

gulp.task("serve", gulp.series("clean", "ts", "copy", "dependencies", "start_server"));
