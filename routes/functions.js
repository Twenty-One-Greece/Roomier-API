// #################################################################################
// this file contains functions that would make other files big if included
// use this file to refactor other files and specify on the other
// file that you use a function from this file
// #################################################################################
var connection = require('../config/connect.js');

// init the functions var to be exported in the end of the file
// this object contains all the functions
var functions = {};

// #################################################################################
// this is used in the roomTypes.js
// when the user adds a new room type he has to specify how many rooms
// this roomType has. this function creates as many
// rooms as were specified in the totalRooms
// this functions returns an array of errors.
// #################################################################################
functions.generateRooms = function (req, roomTypeID) {
  var errors = [];

  // loop according to number of rooms specified
  for (var i = 0; i < req.body.totalRooms; i++) {
    var roomData = {};
    roomData.name = String(req.body.name + ' ' + parseInt(i + 1));
    roomData.roomTypeID = roomTypeID;
    roomData.propertyID = req.body.propertyID;
    roomData.userID = req.body.userID;
    //then gennerate new rooms
    connection.query({

      sql: 'insert into rooms set ?',
      values: [roomData]

    }, function (err, rows, fields) {
      // if an error is found push it in an array
      if (err) errors.push(err);
    }); //end of callback
  } // end of for
  return errors;
}; // end of generateRooms function


// #################################################################################
// this is used in the roomTypes.js
// when the user deletes a room type the rooms associated have
// to be deleted as well
// #################################################################################
functions.deleteRooms = function (req) {
  var error = null;
  connection.query({

    sql: 'delete from rooms where roomTypeID = ? and propertyID = ?',
    values: [req.params.roomTypeID, req.params.propertyID]

  }, function (err, rows, fields) {
    error = err;
  }); // callback
  return error;
}; // end of deleteRooms

// export all functions
module.exports = functions;
