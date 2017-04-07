const express = require('express')
const router = express.Router()
const moment = require('moment')
const crypto = require('crypto')
const connection = require('../config/connect.js')
const Routes = require('./Routes.js')

/**
 * Show all bookings (check in and check out only)
 *
 * Method: GET
 * Route:  /user/:userID/properties/:propertyID/roomTypes/:roomTypeID/bookings
 * @return {Object} result
 */
router.get(Routes.allBookingsMin, (req, res, next) => {
  checkToken(req, res, () => {
    connection.query({

      sql: 'select checkIn, checkOut from bookings' +
           ' where propertyID = ? and roomTypeID = ?',
      values: [req.params.propertyID, req.params.roomTypeID]

    }, (err, rows, fields) => {
      var result = {}

      if (err) {
        result.error = err
        result.message = 'An error ocured. Please try again.'
        return res.send(result)
      } else {
        result.error = 'noErrors'
        result.count = rows.length
        result.bookingDates = rows
        return res.send(result)
      }
    })
  })
})

/**
 * Show all bookings (full info)
 *
 * Method: GET
 * Route:  /user/:userID/properties/:propertyID/roomTypes/:roomTypeID/bookings
 * @return {Object} result
 */
router.get(Routes.allBookingsFull, (req, res, next) => {
  checkToken(req, res, () => {
    connection.query({

      sql: 'select * from bookings where propertyID = ?',
      values: [req.params.propertyID]

    }, (err, rows, fields) => {
      var result = {}

      if (err) {
        result.error = err
        result.message = 'An error ocured. Please try again.'
        return res.send(result)
      } else {
        result.error = 'noErrors'
        result.bookings = rows
        return res.send(result)
      }
    })
  })
})

/**
 * New booking
 *
 * Method: POST
 * @return {Object} result
 */
router.post(Routes.newBooking, function(req, res, next) {
  var data = req.body;
  data.bookingID = crypto.randomBytes(8).toString('hex');

  checkToken(req, res, () => {
    connection.query({

       sql: 'insert into bookings set ?', values: [data]

    }, (err, rows, fields) => {
      var result = {}

      if (err) {
        result.error = err
        result.message = 'An error ocured. Please try again.'
        return res.send(result)
      } else {
        result.error = 'noErrors'
        result.message = 'New booking added successfully'
        result.bookingID = data.bookingID
        return res.send(result)
      }
    })
  })
})

/**
 * Delete booking
 *
 * Method: DELETE
 * @return {Object} result
 */
router.delete(Routes.deleteBooking, function(req, res, next) {
  checkToken(req, res, () => {
    connection.query({

       sql: 'delete from bookings where id = ?',
       values: [req.params.bookingID]

    }, (err, rows, fields) => {
      var result = {}

      if (err) {
        result.error = err
        result.message = 'An error ocured. Please try again.'
        return res.send(result)
      } else {
        result.error = 'noErrors'
        return res.send(result)
      }
    })
  })
})


// export router
module.exports = router;
