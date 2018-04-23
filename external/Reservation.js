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
  const sql = `select name from roomTypes where id = ?;
               insert into bookings set ?;`

  // Data created according to data provided
  const reservation = {
    bookingID: bookingID,
    checkIn: data.start_date,
    checkOut: data.end_date,
    bookingOrigin: (data.bookingOrigin) ? data.bookingOrigin : "Onetourismo",
    propertyID: data.hotelID,
    roomTypeID: data.roomTypeID,
    bookingTotalPrice: data.bookingPrice,
    bookingStatus: "Confirmed",
    paymentMethod: (data.paymentMethod) ? data.paymentMethod : "Not Defined",
    name: data.leadCustomer.firstName,
    surname: data.leadCustomer.lastName,
    email: data.leadCustomer.email,
    zip: data.leadCustomer.postalCode,
    address: data.leadCustomer.address,
    phone: data.leadCustomer.telephone,
    comments: data.remarks.clientRemarks,
    // mealPlan:                            data.mealPlan
  }

  // Make the query. Save reservation in db
  connection.query(sql, [data.roomTypeID, reservation], (err, rowsFirstQuery) => {
    if (err) {
      console.log(err);
      return res.send({ status: 'An error ocured' })
    }
    console.log("roomtypeid:" + reservation.roomTypeID, "propertyId" + reservation.propertyID)
    console.log(reservation.checkIn, reservation.checkOut)
    let sqlQuery = `UPDATE rates_specialdates SET stopSales=1 WHERE roomTypeID= ${reservation.roomTypeID} AND propertyID=${reservation.propertyID}`
    connection.query(sqlQuery, [data.roomTypeID, reservation], (err, rows) => {
      if (err) {
        console.log(err)
        return res.send({ status: 'An error ocured, booking was made successfully but stopsales could not be updated' })
      }
      return res.send(formatReservation(data, bookingID, rowsFirstQuery[0][0]))
    })
  })
})

// Create object to send as response
formatReservation = (data, bookingID, name) => {
  return {
    checkOut: data.start_date,
    checkIn: data.end_date,
    propviderStatus: 'ACTIVE',
    roomType: name,
    provider: {
      name: 'ROOMIER',
      code: bookingID
    },
    leadCustomer: {
      firstName: data.leadCustomer.firstName,
      lastName: data.leadCustomer.lastName,
      email: data.leadCustomer.email,
      telephone: data.leadCustomer.telephone
    },
    fullPrice: data.bookingPrice
  }
}


module.exports = router
