const express = require('express')
const router = express.Router()
const connection = require('../config/connect.js')
const moment = require('moment')
const crypto = require('crypto')

/**
 * Resrvation
 * Documentation: N/A
 *
 * Method: POST
 * @return {Object} result
 */
router.post('/reservation/', (req, res) => {
  const data = req.body
  const bookingID = crypto.randomBytes(8).toString('hex');
  const sql = `insert into bookings set ?`

  // Data created according to data provided
  const reservation = {
      bookingID: bookingID,
      checkIn: data.start_date,
      checkOut: data.end_date,
      bookingOrigin: "Onetourismo",
      propertyID: data.hotelID,
      roomTypeID: data.roomTypeID,
      bookingTotalPrice: data.bookingPrice,
      bookingStatus: "Confirmed",
      paymentMethod: "Not Defined",
      name: data.leadCustomer.firstName,
      surname: data.leadCustomer.lastName,
      email: data.leadCustomer.email,
      zip: data.leadCustomer.postalCode,
      phone: data.leadCustomer.telephone,
      comments: data.remarks.clientRemarks
  }

  // Make the query. Save reservation in db
  connection.query(sql, reservation, (err, rows) => {
    if(err) console.log(err);
    if (err) return res.send({status: 'An error ocured'})
    else return res.send(formatReservation(data, bookingID))
  })
})

// Create object to send as responce
formatReservation = (data, bookingID) => {
  return {
    checkOut: data.start_date,
    checkIn: data.start_date,
    propviderStatus: 'ACTIVE',
    provider: {
      name: 'ROOMIER',
      code: bookingID
    },
    leadCustomer:{
      firstName: data.leadCustomer.firstName,
      lastName: data.leadCustomer.lastName,
      email: data.leadCustomer.email,
      telephone: data.leadCustomer.telephone
    },
    fullPrice: data.bookingPrice
  }
}


module.exports = router
