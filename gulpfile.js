var gulp = require("gulp");
var ts = require("gulp-typescript");
var del = require("del");
var webserver = require("gulp-webserver");

gulp.task("clean", () => del(["build"]));

gulp.task("copy", ["clean"], () => gulp.src(["app/**/*", "!app/scripts/**/*.ts"]).pipe(gulp.dest("build")));

gulp.task("serve", ["ts", "copy", "dependencies"], () => gulp.src("build").pipe(webserver({
  port: 3000,
  livereload: false,
  directoryListing: {
    enable: false,
    path: "build",
  },
  open: true
})));

var project = ts.createProject('tsconfig.json');

gulp.task("ts", ["clean"], function() {

  return gulp.src(["app/scripts/**/*.ts", "node_modules/types/@types/**/*.d.ts"]).pipe(project()).js.pipe(gulp.dest("build/scripts"));
});

gulp.task("dependencies", ["ace_copy"]);
gulp.task("ace_copy", ["clean"], () => {
  return gulp.src("node_modules/ace-builds/src-noconflict/**/*").pipe(gulp.dest("build/dependencies/ace-src"));
});
