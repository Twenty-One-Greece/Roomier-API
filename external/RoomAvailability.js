const express = require('express')
const router = express.Router()
const connection = require('../config/connect.js')
const moment = require('moment')

/**
 * Room Availability
 * Documentation: http://s2.onetourismo.com:8087/documentation/
 *
 * Method: POST
 * @return {Object} result
 */
router.post('/room-availability/', (req, res) => {
  const data = req.body
  const start_date = moment(data.start_date)
  const end_date = moment(data.end_date)
  const diff = parseInt(end_date.diff(start_date, 'days'))
  data.paxSum = data.rooms[0].adults + data.rooms[0].children

  // Get rooms with rates, and special dates
  const sql = `select rt.*, r.id as roomID, r.name as roomName,
        r.baseOccupancy
        from rates as rt join roomTypes as r on rt.roomTypeID = r.id
        where r.propertyID = ? and r.maxAdults >= ? 
        and r.maxChildren >= ? and r.maxPax >= ?
        and ((rt.startDate between date(?) and date(?))
        or (rt.endDate between date(?) and date(?))
        or (rt.startDate <= date(?) and rt.endDate >= date(?)));

        select * from rates_specialdates where propertyID = ?;`

  // Values for query
  const values = [data.hotelID, data.rooms[0].adults,
    data.rooms[0].children, data.paxSum, 
    data.start_date, data.end_date, data.start_date,
    data.end_date, data.start_date, data.end_date, data.hotelID]

  // Make the query
  connection.query(sql, values, (err, rows) => {
    if (err) console.log(err);
    if (err) return res.send({status: 'An error ocured'})
    else return formatResult(rows, res, data)
  })
})

/**
 *       ***** FUNCTIONS *****
 */
// FUNCTION - Format result to send
formatResult = (rows, res, data) => {
  const roomsWithRates = rows[0]
  const specialDates = rows[1]
  const start_date = moment(data.start_date)
  const end_date = moment(data.end_date)
  const dayDiff = parseInt(end_date.diff(start_date, 'days'))
  const diffForRelease = parseInt(start_date.diff(moment(), 'days'))
  let results = []

  // Check if rooms were found
  // or check if stop sales or if allotment === 0
  if (!roomsWithRates.length || checkStopSales(specialDates, data))
    return res.send({status: 'No rooms found'})


  // Create object to send
  roomsWithRates.forEach( (room) => {
    // Checks release
    if (room.releaseRoom < diffForRelease) {
      const name = room.roomName
      const plans = createMealPlans(room, dayDiff, data)
      const mealPlan = {id: room.id, type: name, mealPlans: plans}
      results.push(mealPlan)
      }
    })

  // Send result
  return res.send(results)
}

// FUNCTION - Check if stop sales or if allotment === 0
checkStopSales = (specialDates, data) => {
  let stopSalesOrAlotment0 = false
  
  specialDates.forEach( (date) => {
    const specialDateStart = moment(date.date)
    const start_date = moment(data.start_date).format('YYYY-MM-DD')
    const end_date = moment(data.end_date).format('YYYY-MM-DD')

    if ((date.stopSales || date.allotment === 0) &&
     specialDateStart.isBetween(start_date, end_date, null, '[]')) {
       stopSalesOrAlotment0 = true
     }
   })
   return stopSalesOrAlotment0
}

// FUNCTION - Calculate mealPlans
createMealPlans = (room, dayDiff, data) => {
  let mealPlans = [], diff = null, price = null, singleUse = false

  // More prople than base occupancy
  if (data.paxSum > room.baseOccupancy) diff = data.paxSum - room.baseOccupancy
  // Single use price
  else if (data.paxSum === 1 && room.baseOccupancy === 2 
    && room.singleUsePrice) singleUse = true


  // Check what meal plans are supported and calculate price
  if (room.allInclusive) {
    price = ((room.allInclusive * data.paxSum) + room.basePlanPrice) * dayDiff
    if (diff) price = price + (room.epcAllInclusive * diff) + room.extraPaxCharge
    else if (singleUse) price = (room.singleUsePrice + room.epcAllInclusive) * dayDiff
    mealPlans.push({id: room.id, price: price, description: 'All Inclusive'})
  }
  if (room.halfBoard) {
    price = ((room.halfBoard * data.paxSum) + room.basePlanPrice) * dayDiff
    if (diff) price = price + (room.epcHalfBoard * diff) + room.extraPaxCharge
    else if (singleUse) price = (room.singleUsePrice + room.halfBoard) * dayDiff
    mealPlans.push({id: room.id, price: price, description: 'Half Board'})
  }
  if (room.fullBoard) {
    price = ((room.fullBoard * data.paxSum) + room.basePlanPrice) * dayDiff
    if (diff) price = price + (room.epcFullBoard * diff) + room.extraPaxCharge
    else if (singleUse) price = (room.singleUsePrice + room.fullBoard) * dayDiff
    mealPlans.push({id: room.id, price: price, description: 'Full Board'})
  }
  if (room.bedAndBreakfast){
    price = ((room.bedAndBreakfast * data.paxSum) + room.basePlanPrice) * dayDiff
    if (diff) price = price + (room.epcBedAndBreakfast * diff) + room.extraPaxCharge
    else if (singleUse) price = (room.singleUsePrice + room.bedAndBreakfast) * dayDiff
    mealPlans.push({id: room.id, price: price, description: 'Bed And Breakfast'})
  }
  if (room.selfCatering) {
    price = ((room.selfCatering * data.paxSum) + room.basePlanPrice) * dayDiff
    if (diff) price = price + (room.epcSelfCatering * diff) + room.extraPaxCharge
    else if (singleUse) price = (room.singleUsePrice + room.selfCatering) * dayDiff
    mealPlans.push({id: room.id, price: price, description: 'Self Catering'})
  }
  if (room.roomOnly) {
    price = ((room.roomOnly * data.paxSum) + room.basePlanPrice) * dayDiff
    if (diff) price = price + (room.epcRoomOnly * diff) + room.extraPaxCharge
    else if (singleUse) price = (room.singleUsePrice + room.roomOnly) * dayDiff
    mealPlans.push({id: room.id, price: price, description: 'Room Only'})
  }

  // Add base meal plan
  mealPlans.push(addBasePlanPrice(room, dayDiff, data))
  return mealPlans
}


// FUNCTION - Base plan is saved in numbers. Conver numbers as seen below
addBasePlanPrice = (room, dayDiff, data) => {
  let basePlan = null
  let price = null

  // Convert number to string
  if (room.basePlan === 1) basePlan = 'All Inclusive'
  if (room.basePlan === 2) basePlan = 'Full Board'
  if (room.basePlan === 3) basePlan = 'Half Board'
  if (room.basePlan === 4) basePlan = 'Bed And Breakfast'
  if (room.basePlan === 5) basePlan = 'Self Catering'
  if (room.basePlan === 6) basePlan = 'Room Only'

  // Calculate price
  // More prople than base occupancy
  if (data.paxSum > room.baseOccupancy) {
    const diff = data.paxSum - room.baseOccupancy
    const extraCharge = room.extraPaxCharge * diff
    price = (room.basePlanPrice + extraCharge) * dayDiff
  } 
  // Single use price
  else if (data.paxSum === 1 && room.baseOccupancy === 2 && room.singleUsePrice) {
    price = room.singleUsePrice * dayDiff
  } 
  // Normal price
  else price = room.basePlanPrice * dayDiff

  return {
    id: room.id,
    price: price,
    description: basePlan
  }
}

// Export
module.exports = router
