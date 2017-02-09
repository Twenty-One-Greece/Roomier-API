var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var passwordHash = require('password-hash');
var moment = require('moment')
var connection = require('../config/connect.js');

/**
 * Show all calendar info
 *
 * Method: POST
 * Route:  /user/:userID/ratesOverview
 * @return {Object} result
 */
router.post('/user/:userID/ratesOverview',
  function(req, res) {
    var result = {}
    var data = req.body;

    // dates validation
    if (!moment(data.startDate).isValid() ||
        !moment(data.endDate).isValid()) {

      result.error = 'invalidDates';
      result.message = 'The dates you provided were invalid.';
      return res.send(result);
    }

    // check token and if token is not valid send invalidToken error
    checkToken(req, res, function() {
      connection.query({
        // Big query ahead...
        sql:
        // rooms query
        ' select id, name from roomTypes' +
        ' where propertyID = ? and userID = ?;' +

        // rates query
        ' select id, name, basePlanPrice, startDate, endDate, roomTypeID' +
        ' from rates' +
        ' where (startDate between date(?) and date(?))' +
        ' or (endDate between date(?) and date(?))' +
        ' or (startDate <= date(?) and endDate >= date(?))' +
        ' and propertyID = ? and userID = ?' +
        ' order by startDate;' +

        // specialOffers query
        ' select od. id, r.roomTypeID, r.specialOfferID, od.name, od.discount,' +
        ' od.stayDateStart, od.stayDateEnd' +

        ' from specialOffers_rooms as r' +
        ' join (select offers.id, offers.propertyID, offers.userID,' +
            ' offers.name, offers.discount,' +
            ' dates.stayDateStart, dates.stayDateEnd' +
            ' from specialOffers_dates as dates' +
            ' join specialOffers as offers ' +
            ' on dates.specialOfferID = offers.id) as od' + //od = offers-dates
        ' on r.specialOfferID = od.id' +
        ' where (stayDateStart between date(?) and date(?))' +
        ' or (stayDateEnd between date(?) and date(?))' +
        ' or (stayDateStart <= date(?) and stayDateEnd >= date(?))' +
        ' and od.propertyID = ? and od.userID = ?' +
        ' order by stayDateStart;',

        values: [
          data.propertyID, req.params.userID,
          data.startDate, data.endDate,
          data.startDate, data.endDate,
          data.startDate, data.endDate,
          data.propertyID, req.params.userID,
          data.startDate, data.endDate,
          data.startDate, data.endDate,
          data.startDate, data.endDate,
          data.propertyID, req.params.userID,
        ]

      }, function(err, rows, fields) {

        if (err) {
          result.error = err;
          result.message = 'An error ocured. Please try again.';
          return res.send(result);

        } else {
          // how many days?
          var from = moment(data.startDate);
          var to = moment(data.endDate);
          diff = to.diff(from, 'days');

          // format data
          var calendar = formatResult(rows);
          result.error = 'noErrors';
          result.differenceOfDays = diff;
          result.roomsCount = rows[0].length;
          result.dates = {startDate: data.startDate, endDate: data.endDate}
          result.rooms = calendar.rooms;
          result.rates = calendar.rates;
          result.offers = calendar.offers

          return res.send(result);
        }
      }); // callback function
    }); // checkToken
  }); // router.get


function formatResult(rows) {
  var rooms = rows[0];
  var rates = rows[1];
  var offers = rows[2];

  var formatedRooms = [];
  var formatedRates = [];
  var formatedOffers = [];
  var result = {};

  // format rooms for calendar
  for (var i = 0; i < rooms.length; i++) {
    // create formatedRooms array
    var room = {
      id: rooms[i].id,
      content: rooms[i].name
    }
    formatedRooms.push(room);
  }

  // format rates for calendar
  for (var x = 0; x < rates.length; x++) {
    var rate = {
      id: rates[x].id,
      group: rates[x].roomTypeID,
      content: rates[x].name  + " (" + rates[x].basePlanPrice + ")",
      start: rates[x].startDate,
      end: rates[x].endDate
    }
    formatedRates.push(rate);
  }

  // format offers for calendar
  for (var y = 0; y < offers.length; y++) {
    var offer = {
      offerID: offers[y].id,
      group: offers[y].roomTypeID,
      content: offers[y].name + " (-" + offers[y].discount + "%)",
      style: "background-color: pink;",
      start: offers[y].stayDateStart,
      end: offers[y].stayDateEnd
    }
    formatedOffers.push(offer);
  }

  // format and return the result
  result.rooms = formatedRooms;
  result.rates = formatedRates;
  result.offers = formatedOffers;
  return result;
}




// export router
module.exports = router;
