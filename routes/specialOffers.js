var express = require('express');
var router = express.Router();
var moment = require('moment');
var connection = require('../config/connect.js');
var async = require('async');

// #################################################################################
// a special offer has many rooms (that it applies to) and
// many dates(that it applies to). Because there are many ways to show an offer
// in this route there are many GET routes.
// #################################################################################

/**
 * Show all dates that have specialOffers
 *
 * Method: GET
 * Route:  /user/:userID/properties/:propertyID/dates-specialOffers
 * @return {Object} result
 */
router.get('/user/:userID/properties/:propertyID/dates-specialOffers', function(req, res) {
  var result = {};
  // check token and if token is not valid send invalidToken error
  checkToken(req, res, function() {
    connection.query({

      sql: ' select *' +

        ' from specialOffers_dates as d' +
        ' join specialOffers as o' +

        ' on o.id = d.specialOfferID' +
        ' where propertyID = ? and userID = ?' +
        ' order by stayDateStart, stayDateEnd;',
      nestTables: '_',
      values: [req.params.propertyID, req.params.userID,
              req.params.propertyID, req.params.userID]

    }, function(err, rows, fields) {
      if (err) {
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else {
        result.error = 'noErrors';
        result.message = rows.length + ' offers found.';
        result.specialOffers = rows;
        return res.send(result);
      }
    }); // callback function
  }); // checkToken
});

/**
 * Show all special offers with the dates they apply to
 *
 * Method: GET
 * Route:  /user/:userID/properties/:propertyID/specialOffers-dates
 * @return {Object} result
 */
router.get('/user/:userID/properties/:propertyID/specialOffers-dates', function(req, res) {
  var result = {};
  // check token and if token is not valid send invalidToken error
  checkToken(req, res, function() {
    connection.query({

      sql: 'select * from specialOffers where propertyID = ? and userID = ?;' +

        ' select o.id, o.name, o.type, o.discount, o.conditions,' +
        ' d.bookingDateStart, d.bookingDateEnd, d.stayDateStart, d.stayDateEnd' +

        ' from specialOffers as o' +
        ' join specialOffers_dates as d' +

        ' on o.id = d.specialOfferID' +
        ' where propertyID = ? and userID = ?;',
      values: [req.params.propertyID, req.params.userID, req.params.propertyID, req.params.userID]

    }, function(err, rows, fields) {
      if (err) {
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else {
        rows = formatResult(rows)
        result.error = 'noErrors';
        result.message = rows.length + ' offers found.';
        result.specialOffers = rows;
        return res.send(result);
      }
    }); // callback function
  }); // checkToken
});

var formatResult = function(rows) {
  var offers = rows[0];
  var offersWithDates = rows[1];
  var result = [];

  // format rows
  for (var i = 0; i < offers.length; i++) {
    offers[i].dates = [];
    for (var x = 0; x < offersWithDates.length; x++) {
      if (offers[i].id === offersWithDates[x].id) {
        var dates = {
          "bookingDateStart": offersWithDates[x].bookingDateStart,
          "bookingDateEnd": offersWithDates[x].bookingDateEnd,
          "stayDateStart": offersWithDates[x].stayDateStart,
          "stayDateEnd": offersWithDates[x].stayDateEnd
        }
        offers[i].dates.push(dates)
      } // if
    } // inner for
  } // outer for
  return offers
}

/**
 * New special offer
 *
 * Method: POST
 * Route:  /user/:userID/properties/:propertyID/specialOffers/new
 * @return {Object} result
 */
router.post('/user/:userID/properties/:propertyID/specialOffers/new', function(req, res) {
  var result = {};
  var data = req.body.data;
  var dates = req.body.dates;
  var rooms = req.body.rooms;


  // Do some checks on the data provided
  // check if rooms were provided
  if (rooms.length === 0) {
    result.error = 'noRooms';
    result.message = 'You need to add at least one room this offer applies.';
    return res.send(result);
  }

  // chceck if dates where provided
  if (dates.length === 0) {
    result.error = 'noDates';
    result.message = 'You need to add the dates this offer applies.';
    return res.send(result);
  }

  // check if data is provided
  if (typeof data.name === 'undefined' ||
      typeof data.discount === 'undefined') {

    result.error = 'noData';
    result.message = 'You need to fill the required inputs.';
    return res.send(result);
  }

  // check token and if token is not valid send invalidToken error
  checkToken(req, res, function() {
    connection.query({

      sql: 'insert into specialOffers set ?',
      values: [data]

    }, function(err, rows, fields) {
      if (err) {
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else if (rows.affectedRows === 0) {
        result.error = 'noRateAdded';
        result.message = 'No special offer could be added. Please try again.';
        return res.send(result);
      } else {
        // if everything is ok save the dates and the rooms in the db
        datesToDB(dates, rows.insertId);
        roomsToDB(rooms, rows.insertId);
        // format an send the result
        result.error = 'noErrors';
        result.message = 'New special offer added.';
        result.rates = rows;
        return res.send(result);
      }
    }); // callback function
  }); // checkToken
});

var datesToDB = function(dates, specialOfferID) {
    for (var i = 0; i < dates.length; i++) {

      dates[i].specialOfferID = specialOfferID;
      connection.query({
          sql: 'insert into specialOffers_dates set ?',
          values: [dates[i]]
        },
        function(err, rows, fields) {
          if (err) console.log(err);

        }); // callback
    } // for loop
    return true
  } // datesToDB

var roomsToDB = function(rooms, specialOfferID) {
    for (var i = 0; i < rooms.length; i++) {
      // format data
      var data = {
        roomTypeID: rooms[i].roomTypeID,
        specialOfferID: specialOfferID
      }
      connection.query({
          sql: 'insert into specialOffers_rooms set ?',
          values: [data]
        },
        function(err, rows, fields) {
          if (err) console.log(err);

        }); // query callback
    } // for loop
    return true
  } // roomsToDB

  /**
   * Delete special offer
   *
   * Method: DELETE
   * Route:  /user/:userID/properties/:propertyID/specialOffers-dates/:dateID
   * @return {Object} result
   */
router.delete('/user/:userID/properties/:propertyID/specialOffers-dates/:dateID',
 function(req, res) {
  var result = {};

  // check token and if token is not valid send invalidToken error
  checkToken(req, res, function() {
    connection.query({

      sql: 'delete from specialOffers_dates where id = ?',
      values: [req.params.dateID]

    }, function(err, rows, fields) {
      if (err) {
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else {
        //deleteOffersWithNoDates(rows.insertId);
        result.error = 'noErrors';
        result.message = rows.affectedRows + 'Dates deleted.';
        result.rates = rows;
        return res.send(result);
      }
    }); // callback function
  }); // checkToken
});



module.exports = router;
