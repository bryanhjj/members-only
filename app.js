const dotenv = require('dotenv').config();
const createError = require('http-errors');
const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
var bcrypt = require('bcryptjs');
const userRouter = require('./routes/user');
const messageRouter = require('./routes/message');
const indexRouter = require('./routes/index');
const User = require('./models/users');

// MongoDB setup
const mongoDb = process.env.DB_URL;
mongoose.connect(mongoDb, { useUnifiedTopology: true, useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));

const app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname + '/public'));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Passport setup
app.use(session({ secret: process.env.SECRET_WORD, resave: false, saveUninitialized: true }));
passport.use(
    new LocalStrategy((username, password, done) => {
      User.findOne({ username: username }, (err, user) => {
        if (err) { 
          return done(err);
        }
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }
        bcrypt.compare(password, user.password, (err, res) => {
          if (res) {
            // password match! log user in
            return done(null, user);
          } else {
            // password doesn't match
            return done(null, false, { message: "Incorrect password" });
          }
        });
      });
    })
);
passport.serializeUser(function(user, done) {
    done(null, user.id);
});
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
});
app.use(passport.initialize());
app.use(passport.session());

// Create a currentUser variable accessible in every views
app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  next();
});

// Routers to middleware chain
app.use('/', indexRouter);
app.use('/user', userRouter);
app.use('/message', messageRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});
  
// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
  
    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

app.listen(process.env.PORT || 3000, () => console.log("app listening on port 3000!"));