const express = require('express')
const router = express.Router()
const connection = require('../config/connect.js')
const moment = require('moment')

/**
 * Specific Availability
 * Documentation: http://s2.onetourismo.com:8087/documentation/
 *
 * Method: POST
 * @return {Object} result
 */
router.post('/specific-availability/', (req, res) => {
  const data = req.body
  data.paxSum = data.rooms[0].adults + data.rooms[0].children
  const start_date = moment(data.start_date)
  const end_date = moment(data.end_date)
  const dayDiff = parseInt(end_date.diff(start_date, 'days'))

  // Make mealplan string the way we save it in db
  data.mealPlan = data.mealPlan.charAt(0).toLowerCase() +
  data.mealPlan.slice(1).replace(/\s/g, '')

  // Gets properties, rooms, and rates
  const sql =
    `select id, name, stars from properties where id = ?;

    select id, name, baseOccupancy from roomTypes where id = ?;

    select typeOfPenalty, chargeType, days, value
    from cancelPolicies where propertyID = ?;

    select * from rates where id = ?;`

  // Values for query
  const values = [data.hotelID, data.roomID, data.hotelID, data.rateID]

  // Make the query
  connection.query(sql, values, (err, rows) => {
    if(err) console.log(err);
    if (err) return res.send({error: err})
    else return formatResult(rows, res, data, dayDiff)
  })
})


// FUNCTION - Create result object for response
const formatResult = (rows, res, data, dayDiff) => {
  const property = rows[0][0]
  const room = rows[1][0]
  const policies = rows[2]
  const rate = rows[3][0]
  let mealplanPrice = null

  // Check if data was found
  if (!property || !room || !rate) 
    return res.send({status: 'No data found.'})

  // If null the value shows that the base plan is used
  if (rate[data.mealPlan]) {
    rate.singleUsePrice = rate.singleUsePrice + rate[data.mealPlan]
    mealplanPrice = rate[data.mealPlan] + rate.basePlanPrice
  } else mealplanPrice = rate.basePlanPrice


  // More people than base occupancy
  if (data.paxSum > room.baseOccupancy) {
    const diff = data.paxSum - room.baseOccupancy
    const extraCharge = room.extraPaxCharge * diff
    room.price = (mealplanPrice + rate.extraPaxCharge) * dayDiff
  }
  // Single use price
  else if (data.paxSum === 1 && room.baseOccupancy === 2 && rate.singleUsePrice) {
    room.price = rate.singleUsePrice * dayDiff
  }
  // Normal price
  else room.price = mealplanPrice * dayDiff


  // Object to send
  const result = {
    hotel: property,
    room: room,
    cancelationPolicies: formatPolicies(policies, rate, data)
  }
  return res.send(result)
}


// FUNCTION - Create each policy object
const formatPolicies = (policies, rate, data) => {
  var formatedPolicies = []

  policies.forEach( (policy) => {
    // Calculate deadline according to check in date
    const checkIn = moment(data.start_date)
    if (policy.days) var deadline = checkIn.subtract(policy.days, "days")
    
    // Make policy object
    formatedPolicies.push({
      deadline: deadline,
      description: formatPolDesc(policy.typeOfPenalty),
      amount: calcAmount(policy.chargeType, policy.value, rate, data)
    })
  })
  return formatedPolicies
}

// FUNCTION - Calculate amount to be charged
const calcAmount = (chargeType, value, rate, data) => {
  const start_date = moment(data.start_date)
  const end_date = moment(data.end_date)
  const dayDiff = parseInt(end_date.diff(start_date, 'days'))

  if (chargeType) return parseInt((dayDiff * (rate[data.mealPlan] +
    rate.basePlanPrice)) * (value/100))
  else return rate.basePlanPrice * value
}

// FUNCTION - Descs are stored as numbers. Change them in text
const formatPolDesc = (type) => {
  if (type === 1) return 'Cancelation Policy'
  if (type === 2) return 'No show fee'
  if (type === 3) return 'Early departure fee'
}

module.exports = router
