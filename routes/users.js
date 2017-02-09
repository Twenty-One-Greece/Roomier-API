var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var passwordHash = require('password-hash');
var connection = require('../config/connect.js');

/**
 * Registers new user
 *
 * Method: POST
 * Route:  /register
 * @return {Object} result
 */
router.post('/register', function (req, res, next) {
  var data = req.body;
  // init the result variable which we will be sending sa a response
  var result = {};
  // check if at least email and pass are sent
  if (typeof data.email !== 'undefined' && typeof data.password !== 'undefined') {
    // if they are set hash the password using the sha1 algorithm
    data.password = passwordHash.generate(data.password);
    // insert into db
    connection.query({

      sql: 'insert into users set ?',
      values: data

    }, function (err, rows, fields) {
      if (!err) {
        result.error = 'noErrors';
        result.message = 'New user created. You can enter via the login screen';
        res.send(result);
      } else if (err.code === 'ER_DUP_ENTRY') {
        // check for duplicate entries
        result.error = 'emailInUse';
        result.message = 'Email in already in use. Try logging in or use another email.';
        res.send(result);
      } else {
        result.error = err;
        result.message = 'Error during data processing. Please try again.';
        res.send(result);
      }
    }); // query callback
  } else {
    // if email or password is not provided
    result.error = 'notAllDataProvided';
    result.message = 'You need to provide all data specified by the form.';
    res.send(result);
  }
}); // register

/**
 * Login user. Along with the user data returns
 * a jwt to be used in every transaction
 *
 * Method: POST
 * Route:  /login
 * @return {Object} result
 */
router.post('/login', function (req, res, next) {
  var data = req.body;
  var result = {};

  if (typeof data.email === 'undefined' || typeof data.password === 'undefined') {
    result.error = 'emailAndPassRequired';
    result.message = 'Email and password are both required. Please try again';
    res.send(result);
  } else {
    connection.query({

      sql: 'select * from users where email = ?',
      values: [data.email]

    }, function (err, rows, fields) {
      if (rows.length > 1) {
        //this shouldnt appear normaly
        result.error = 'moreThanOneUsersFound';
        result.message = 'More than one users found. Please contact administrator';
        res.send(result);
      } else if (rows.length < 1) {
        result.error = 'noUsersFound';
        result.message = 'No users found. Please try again.';
        res.send(result);
      } else if (rows.length === 1) {
        if (!passwordHash.verify(data.password, rows[0].password)) {
          result.error = 'passwordsDoNotMatch';
          result.message = 'Wrong password. Please try again.';
          res.send(result);
        } else {
          result.error = 'noErrors';
          result.message = 'Login successful.';
          result.userInfo = rows;
          // add !Roomier@#$ to the user id to secure the token
          result.token = jwt.sign(result.userInfo[0].id + '!Roomier@#$', 'A15081980p');
          res.send(result);
        }
      }
    }); // end of callback function
  }
}); // login

// TODO add forget email route

// export the router
module.exports = router;
