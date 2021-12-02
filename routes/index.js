var express = require('express');
var router = express.Router();
const passport = require("passport");

/* redirect users to the login page upon landing */
router.get('/', function(req, res, next) {
  res.redirect('/log-in');
});

router.get('/log-in', function(req, res, next) {
  res.render('login', {title: 'Log in'});
});

router.post('/log-in', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/',
}));

router.get('/log-out', (req, res) => {
  req.logout();
  res.redirect('/');
})

module.exports = router;