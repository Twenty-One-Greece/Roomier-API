var express = require('express');
var router = express.Router();
var connection = require('../config/connect.js');
var checkToken = require('./checkToken.js');

// #################################################################################
// Show all rooms
// #################################################################################
router.get('/user/:userID/properties/:propertyID/roomTypes/:roomTypeID/rooms', function (req, res) {
  var result = {};
  // check token and if token is not valid send invalidToken error
  checkToken(req, res, function () {
    // if the decoded token does not match the id
    connection.query({

      sql: 'select * from rooms where userID = ? and propertyID = ? and roomTypeID = ?',
      values: [req.params.userID, req.params.propertyID, req.params.roomTypeID]

    }, function (err, rows, fields) {
      if (err) {
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else {
        result.error = 'noErrors';
        result.message = rows.length + ' rooms found.';
        result.rooms = rows;
        return res.send(result);
      }
    }); // callback function
  }); // checkToken function
});

// #################################################################################
// Change room availability. Availability is boolian so flipping its value will
// change the room availability to the opposite
// #################################################################################
router.put('/user/:userID/properties/:propertyID/roomTypes/:roomTypeID/rooms/:roomID', function (req, res) {
  var result = {};
  // check token and if token is not valid send invalidToken error
  checkToken(req, res, function () {
    // if the decoded token does not match the id
    connection.query({

      sql: 'update rooms set available = not available where id = ? and userID = ? and propertyID = ? and roomTypeID = ?',
      values: [req.params.roomID, req.params.userID, req.params.propertyID, req.params.roomTypeID]

    }, function (err, rows, fields) {
      if (err) {
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else {
        result.error = 'noErrors';
        result.message = 'Room availability changed.';
        result.rooms = rows;
        return res.send(result);
      }
    }); // callback function
  });
});

// export router
module.exports = router;
