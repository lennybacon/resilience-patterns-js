var gulp = require("gulp");
var jasmine = require("gulp-jasmine");

gulp.task('test', function () {
  return gulp.src(["src/*", "specs/*"])
      .pipe(jasmine({verbose : true, includeStackTrace : true}));
});

gulp.task('tdd', function() {
  return gulp.watch(["specs/*", "src/*"], ['test']);
});