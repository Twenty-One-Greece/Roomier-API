var express = require('express');
var router = express.Router();
var connection = require('../config/connect.js');
var checkToken = require('./checkToken.js');
var functions = require('./functions.js');

/**
 * Create new roomType. When a roomType is created the user specifies how many
 * rooms this roomtype has. After creating the roomType the rooms are created
 * according to the number of rooms specified
 * functions.generateRooms(req, rows.insertId) creates the rooms. Takes the request
 * and the id of the room created. Returns an error array with the error that ocured
 * during the creation of rooms. this function exists in functions.js
 *
 * Method: POST
 * Route:  /user/:userID/properties/:propertyID/roomTypes/new
 * @return {Object} result
 */
router.post('/user/:userID/properties/:propertyID/roomTypes/new', function (req, res, next) {
  var data = req.body;
  var result = {};

  if (req.params.userID != data.userID || req.params.propertyID != data.propertyID) {
    //check if userID in the req is the same as the post data
    result.error = 'paramsAndReqNotMatch';
    result.message = 'An error ocured. Please try again.';
    return res.send(result);

  } /*
  else if (data.maxPax < data.maxAdults + data.maxChildren + data.maxInfants) {
    // max PAX cant be less than the sum of adults, children, and infants
    result.error = 'maxPaxLower';
    result.message = 'Max PAX can\'t be less than the sum of adults, children, and infants';
    return res.send(result);
  }*/

  // check token and if token is not valid send invalidToken error
  checkToken(req, res, function () {
    if (data.minimumStay === 0) data.minimumStay = null;
    connection.query({

      sql: 'insert into roomTypes set ?',
      values: data

    }, function (err, rows, fields) {
      // this function exists in functions.js and returns an array of errors for every room added
      var errors = functions.generateRooms(req, rows.insertId);
      if (err || errors.length > 0) {
        // if error in either query is found
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else if (rows.affectedRows === 0) {
        result.error = 'noRoomTypesAdded';
        result.message = 'No room types could be added. Please try again.';
        return res.send(result);
      } else {
        result.error = 'noErrors';
        result.message = 'Room type ' + data.name + ' added successfully';
        result.query = rows;
        return res.send(result);
      }
    }); // query callback
  }); // checkToken
});

/**
 * Show all roomTypes (all infos)
 *
 * Method: GET
 * Route:  /user/:userID/properties/:propertyID/roomTypes
 * @return {Object} result
 */
router.get('/user/:userID/properties/:propertyID/roomTypes', function (req, res) {
  var result = {};
  // check token and if token is not valid send invalidToken error
  checkToken(req, res, function () {
    // if the decoded token does not match the id
    connection.query({

      sql: 'select * from roomTypes where userID = ? and propertyID = ?',
      values: [req.params.userID, req.params.propertyID]

    }, function (err, rows, fields) {
      if (err) {
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else {
        result.error = 'noErrors';
        result.message = rows.length + ' room types found.';
        result.roomTypes = rows;
        return res.send(result);
      }
    }); // callback function
  }); // checkToken function
});

/**
 * Show all roomTypes (names only)
 *
 * Method: GET
 * Route:  /user/:userID/properties/:propertyID/roomTypes-names
 * @return {Object} result
 */
router.get('/user/:userID/properties/:propertyID/roomTypes-names', function (req, res) {
  var result = {};
  // check token and if token is not valid send invalidToken error
  checkToken(req, res, function () {
    // if the decoded token does not match the id
    connection.query({

      sql: 'select id, name from roomTypes where userID = ? and propertyID = ?',
      values: [req.params.userID, req.params.propertyID]

    }, function (err, rows, fields) {
      if (err) {
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else {
        result.error = 'noErrors';
        result.message = rows.length + ' room types found.';
        result.roomTypes = rows;
        return res.send(result);
      }
    }); // callback function
  }); // checkToken function
});

/**
 * Base occupancy of a room
 *
 * Method: GET
 * Route:  /user/:userID/properties/:propertyID/baseOccupancy/:roomTypeID
 * @return {Object} result
 */
router.get('/user/:userID/properties/:propertyID/baseOccupancy/:roomTypeID',
function (req, res) {
  var result = {};
  // check token and if token is not valid send invalidToken error
  checkToken(req, res, function () {
    // if the decoded token does not match the id
    connection.query({

      sql: 'select baseOccupancy from roomTypes where id = ?',
      values: [req.params.roomTypeID]

    }, function (err, rows, fields) {
      if (err) {
        result.error = err;
        result.message = 'Could not get the base occupancy of room.';
        return res.send(result);
      } else {
        result = rows[0];
        return res.send(result);
      }
    }); // callback function
  }); // checkToken function
});

/**
 * Show one roomType
 *
 * Method: GET
 * Route:  /user/:userID/properties/:propertyID/roomTypes/:roomTypeID
 * @return {Object} result
 */
router.get('/user/:userID/properties/:propertyID/roomTypes/:roomTypeID', function (req, res) {
  var result = {};
  // check token and if token is not valid send invalidToken error
  checkToken(req, res, function () {
    // if the decoded token does not match the id
    connection.query({

      sql: 'select * from roomTypes where userID = ? and propertyID = ? and id = ?',
      values: [req.params.userID, req.params.propertyID, req.params.roomTypeID]

    }, function (err, rows, fields) {
      if (err) {
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else {
        result.error = 'noErrors';
        result.message = rows.length + ' room types found.';
        result.roomTypes = rows;
        return res.send(result);
      }
    }); // callback function
  }); // checkToken function
});

/**
 * Update roomType. This should not take another number of rooms as the rooms have
 * been created and may have bookings attched to them
 *
 * Method: PUT
 * Route:  /user/:userID/properties/:propertyID/roomTypes/:roomTypeID
 * @return {Object} result
 */
router.put('/user/:userID/properties/:propertyID/roomTypes/:roomTypeID', function (req, res, next) {
  var result = {};
  checkToken(req, res, function () {
    connection.query({

      sql: 'update roomTypes set ? where id = ? and userID = ? and propertyID',
      values: [req.body, req.params.roomTypeID, req.params.userID, req.params.propertyID]

    }, function (err, rows, fields) {

      if (err) {
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else if (rows.affectedRows === 0) {
        result.error = 'noRoomTypesFound';
        result.message = 'No room types found to update.';
        return res.send(result);
      } else {
        result.error = 'noErrors';
        result.message = rows.affectedRows + ' room types updated.';
        result.query = rows;
        return res.send(result);
      }
    }); // query callback
  }); // checkToken
});

/**
 * Delete roomTypes. When a room type is deleted all
 * rooms assocaiated with it must be deleted (functions.deleteRooms())
 * functions.deleteRooms(req) takes in the request and returns an error val with
 * the error during deleting the rooms (if any).
 *
 * Method: DELETE
 * Route:  /user/:userID/properties/:propertyID/roomTypes/:roomTypeID
 * @return {Object} result
 */
router.delete('/user/:userID/properties/:propertyID/roomTypes/:roomTypeID', function (req, res, next) {
  var result = {};
  checkToken(req, res, function () {
    connection.query({

      sql:
      'delete from roomTypes where id = ?;' +
      ' delete from rates where roomTypeID = ?;' +
      ' delete from specialOffers_rooms where roomTypeID = ?;' +
      ' delete from amenities where roomTypeID = ?',
      values: [req.params.roomTypeID,req.params.roomTypeID,
              req.params.roomTypeID, req.params.roomTypeID]

    }, function (err, rows, fields) {
      // this function exists in functions.js and returns the error of the query (if any)
      var error = functions.deleteRooms(req);
      if (err || error) {
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else {
        result.error = 'noErrors';
        result.message = 'Room type deleted.';
        result.query = rows;
        return res.send(result);
      }
    }); //query callback
  }); // checkToken
});


// export router
module.exports = router;
