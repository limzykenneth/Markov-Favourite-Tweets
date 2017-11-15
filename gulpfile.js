const gulp = require("gulp");
const rename = require("gulp-rename");
const nodemon = require("gulp-nodemon"),
	  browserSync = require('browser-sync');
const plumber = require("gulp-plumber");
const gutil = require("gulp-util");

const less = require("gulp-less"),
	  cleanCSS = require("gulp-clean-css"),
      autoprefixer = require("gulp-autoprefixer");

const path = require("path");

// Run server
gulp.task("nodemon", function(cb){
	var started = false;

	return nodemon({
		verbose: false,
		script: "./bin/www",
		ignore: ["public/**/*"]
	}).on("start", function(){
		if(!started){
			cb();
			started = true;
		}
	});
});

gulp.task("browser-sync", ["nodemon"], function(){
	browserSync.init({
		proxy: "http://localhost:3000",
		files: ["public/!(src)/*", "views/**/*"],
		port: "3001"
	});
});

gulp.task("server", ["default", "browser-sync"], function(){
	gulp.watch("./public/stylesheets/src/*", ["stylesheets"]);
});

gulp.task("stylesheets", function(){
	var lessOptions = {
		paths: ["./public/stylesheets/src"]
	};

	var cleanCSSOptions = {};

	return gulp.src(path.join(__dirname, "public/stylesheets/src/style.less"))
		.pipe(plumber({
			errorHandler: onError
		}))
		.pipe(less(lessOptions))
		.pipe(autoprefixer())
		.pipe(gulp.dest(path.join(__dirname, "public/stylesheets")))
		.pipe(cleanCSS(cleanCSSOptions))
		.pipe(rename("style.min.css"))
		.pipe(gulp.dest(path.join(__dirname, "public/stylesheets")))
		.pipe(browserSync.stream());
});

gulp.task("default", ["stylesheets"]);


function onError(err){
	gutil.log(gutil.colors.red('Error (' + err.plugin + '): ' + err.message));
	this.emit("end");
}