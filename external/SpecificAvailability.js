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
  const data              = req.body
  const start_date        = moment(data.start_date)
  const end_date          = moment(data.end_date)
  const today             = moment().format("YYYY-MM-DD")
  data.dayDiff            = parseInt(end_date.diff(start_date, 'days'))
  data.paxSum             = data.rooms[0].adults + data.rooms[0].children
  data.mealPlanNonFormat  = data.mealPlan

  // Make mealplan string the way we save it in db
  data.mealPlan = data.mealPlan.charAt(0).toLowerCase() +
  data.mealPlan.slice(1).replace(/\s/g, '')

  // Gets properties, rooms, and rates
  const sql =
    `select u.id as userID, u.email, p.id, p.name, p.stars, p.active
    from properties as p join users as u on p.userID = u.id
    where p.id = ? and u.email = ? and p.active = 1;

    select id, name, baseOccupancy from roomTypes where id = ?;

    select typeOfPenalty, chargeType, days, value
    from cancelPolicies where propertyID = ?;

    select r.*, p.id as propID, room.id as roomID from rates as r
    join properties as p on r.propertyID = p.id
    join roomTypes as room on r.roomTypeID = room.id
    where p.id = ? and room.id = ?
    and ((startDate between date(?) and date(?))
    or (endDate between date(?) and date(?))
    or (startDate <= date(?) and endDate >= date(?)))
    order by propertyID, startDate;
    
    select * from rates_childPolicies 
    where propertyID = ? group by age, id;
    
    select * from specialOffers as so 
    join specialOffers_dates as sod on so.id = sod.specialOfferID 
    join specialOffers_rooms as sor on sod.specialOfferID = sor.specialOfferID
    where ? between sod.bookingDateStart and sod.bookingDateEnd
    and ? between sod.stayDateStart and sod.stayDateEnd
    and ? between sod.stayDateStart and sod.stayDateEnd
    and sor.roomtypeID = ? order by so.cumulative desc`

  // Values for query
  const values = [
    data.hotelID,     data.username,    data.roomID,      data.hotelID,
    data.hotelID,     data.roomID,      data.start_date,  data.end_date,
    data.start_date,  data.end_date,    data.start_date,  data.end_date,
    data.hotelID,     today,            data.start_date,  data.end_date,
    data.roomID]

  // Make the query
  connection.query(sql, values, (err, rows) => {
    if (err) console.log(err);
    if (err) return res.send({error: err})
    else return formatResult(rows, res, data)
  })
})


// FUNCTION - Create result object for response
const formatResult = (rows, res, data) => {
  const property        = rows[0][0]
  const room            = rows[1][0]
  const policies        = rows[2]
  const rates           = rows[3]
  const childPolicies   = rows[4]
  const specialOffers   = rows[5]
  let mealplanPrice     = null

  let result = {
    hotel           : property,
    room            : room,
    fullPrice       : calculateFullPrice(data, rates, room, childPolicies),
    cancelPolicies  : formatPolicies(policies, rates[0], data)
  }

  if (result.fullPrice && specialOffers) calculateSpecialOffers(result, specialOffers)

  if (result.hotel && result.room && result.fullPrice) return res.send(result)
  return res.send({status: 'No rooms found.'})
}


// FUNCTION - gets all property special offers
function calculateSpecialOffers(result, specialOffers) {
  
  let mealPrice = result.fullPrice.price    //cumulative
  let mealPriceNonC = result.fullPrice.price  //non cumulative

  specialOffers.forEach( (offer) => {
    if (offer.roomtypeID != result.room.id) return
    else result.fullPrice.specialOffer = true

    testValue = mealPrice - (offer.discount / 100) * mealPrice
    testValueNonC = mealPriceNonC - (offer.discount / 100) * mealPriceNonC

    if (offer.cumulative) mealPrice = testValue
    else if (testValue < mealPriceNonC) mealPriceNonC = testValueNonC
  })
  result.fullPrice.price  = (mealPrice < mealPriceNonC) ?  mealPrice : mealPriceNonC
}

calculateFullPrice = function(data, rates, room, childPolicies) {
  let remainingDays = data.dayDiff
  let checkIn       = moment(data.start_date)
  let checkOut      = moment(data.end_date)
  let rateCount     = -1                      // For algorithm to work correctly
  let price         = null
  let adults        = data.rooms[0].adults
  let i             = moment(data.start_date).subtract(1, 'day')
  let x             = moment(data.end_date).subtract(1, 'day')
  let z             = moment(data.start_date)

  // Generate values for each rate
  rates.forEach( (rate) => {

    rate.baseOccupancy = room.baseOccupancy
    let diff              = null
    let dataHasChildren   = (data.rooms[0].children) ? true : false
    let rateBelongsToRoom = (rate.roomTypeID === room.id) ? true : false
    let singleUse         = (data.paxSum === 1 && rate.singleUsePrice) ? true : false

    if (data.paxSum > rate.baseOccupancy) diff = data.paxSum - rate.baseOccupancy
    if (dataHasChildren) rate = matchPoliciesWithRate(rate, childPolicies)
    if (z.isBefore(rate.startDate) && rateCount === -1) return
    if (rateBelongsToRoom) {
      rateCount++
      basePlan = rate.basePlan
    }

    // Add amount for each day
    if (rateBelongsToRoom) {
      for(i; i < x; i.add(1, 'day')) {

        let rateEndIsBefore   = i.isBefore(rate.endDate)
        let rateEndIsSame     = i.isSame(rate.endDate)
        if (rateEndIsSame) break;

        if (((rateEndIsBefore || rateEndIsSame) || rateCount > 0) && rateBelongsToRoom && data.basePlan) {
          if        (singleUse) price += rate.singleUsePrice
          else if   (dataHasChildren && diff) price += calcChildren(rate, data, 'charge', null)
          else if   (diff) price += rate.basePlanPrice + (rate.extraPaxCharge * diff)
          else      price += rate.basePlanPrice
        }
        else if (((rateEndIsBefore || rateEndIsSame) || rateCount > 0) && rateBelongsToRoom) {
          if        (singleUse) price += rate.singleUsePrice + rate[data.mealPlan]
          else if   (dataHasChildren && diff) price += calcChildren(rate, data, data.mealPlan, null)
          else if   (diff) price += rate.basePlanPrice + (rate[data.mealPlan] * data.paxSum) + (rate.extraPaxCharge * diff)
          else      price += ((rate[data.mealPlan] * data.paxSum) + rate.basePlanPrice)
        }
      } // For loop
    }
  }) // For each loop

  rateCount = 0    //  Reset rate counter
  if (price) return {price: price, description: data.mealPlanNonFormat}
  else return
}



// FUNCTION - Create each policy object
const formatPolicies = function(policies, rate, data) {
  var formatedPolicies = []
  policies.forEach( (policy) => {

    // Calculate deadline according to check in date
    const checkIn = moment(data.start_date)
    if (policy.days) var deadline = checkIn.subtract(policy.days, "days")
    
    // Make policy object
    formatedPolicies.push({
      deadline      : deadline,
      description   : formatPolDesc(policy.typeOfPenalty),
      amount        : calcAmount(policy.chargeType, policy.value, rate, data)
    })
  })
  return formatedPolicies
}

// FUNCTION - Calculate amount to be charged
const calcAmount = (chargeType, value, rate, data) => {
  const start_date  = moment(data.start_date)
  const end_date    = moment(data.end_date)
  const dayDiff     = parseInt(end_date.diff(start_date, 'days'))

  if (chargeType && rate) return parseInt((dayDiff * (rate.basePlanPrice)) * (value / 100))
  //else return rate.basePlanPrice * value
}

// FUNCTION - Descs are stored as numbers. Change them in text
const formatPolDesc = (type) => {
  if (type === 1) return 'Cancelation Policy'
  if (type === 2) return 'No show fee'
  if (type === 3) return 'Early departure fee'
}

module.exports = router
