const express = require('express')
const router = express.Router()
const connection = require('../config/connect.js')
const moment = require('moment')

/**
 * General Availability
 * Documentation: http://s2.onetourismo.com:8087/documentation/
 *
 * Method: POST
 * @return {Object} result
 */
router.post('/general-availability/', (req, res) => {
  const data = req.body
  const start_date = moment(data.start_date)
  const end_date = moment(data.end_date)
  const diff = parseInt(end_date.diff(start_date, 'days'))

  // Gets properties, rooms, and rates
  const sql = `select id, name, city, country, address,
     longitude, latitude, shortDescription, image, stars
     from properties where city = ?;

     select r.name, r.baseOccupancy, r.id, p.id as propertyID
     from roomTypes as r
     join properties as p on r.propertyID = p.id
     where maxAdults >= ? and maxChildren >= ? and p.city = ?;

     select name as rateName, propertyID, roomTypeID,
     basePlan, basePlanPrice from rates
     where (startDate between date(?) and date(?))
     or (endDate between date(?) and date(?))
     or (startDate <= date(?) and endDate >= date(?));`

  // Values for query
  const values = [data.otagDestinationCode,
    data.rooms[0].adults, data.rooms[0].children,
    data.otagDestinationCode, data.start_date, data.end_date,
    data.start_date, data.end_date, data.start_date, data.end_date]

  // Make the query
  connection.query(sql, values, (err, rows) => {
    if(err) console.log(err);
    if (err) return res.send({error: err})
    else return handleResult(res, rows, diff)
  })
})

// This function formats the results
handleResult = (res, rows, diff) => {
  results = []
  rows[0].forEach( (property) => {
    result = {
      provider: {
        name: 'ROOMIER TEST PLATFORM'
      },
      id: property.id,
      name: property.name,
      rating: property.stars,
      location: {
        country: property.country,
        city: property.city,
        address: property.address,
        latitude: property.latitude,
        longitude: property.longitude,
      },
      photo: property.image,
      description: property.shortDescription,
      rooms: getRooms(rows[1], rows[2], property.id, diff)
    }
    
    if (result.rooms) results.push(result)
  }) // For each property

  // Send result
  res.send(results)
}

// FUNCTION - gets all property rooms
getRooms = (rooms, rates, propID, diff) => {
  var roomsResult = []
  rooms.forEach( (room, i) => {
    if (propID === room.propertyID) {
      const roomData = {
        name: room.name,
        id: room.id,
        base_occupancy: room.baseOccupancy,
        mealPlans: getMEalPlans(rates, room.id, diff)
      }
      if (roomData.mealPlans) roomsResult.push(roomData)
    }
  }) // For each room

  // Check if rooms with meal plans were found
  if (roomsResult.length) return roomsResult
  else return null
}

// FUNCTION - gets all meal plans that a room has
getMEalPlans = (rates, roomID, diff) => {
  var mealPlans = []
  rates.forEach( (rate) => {
    if (rate.roomTypeID === roomID) mealPlans.push({
      price: rate.basePlanPrice * diff,
      description: formatBasePlan(rate.basePlan)
    })
  })

  // Check if mealPlans were found
  if (!mealPlans.length) return
  else return mealPlans
}

// FUNCTION - convert base plan to string
formatBasePlan = (basePlan) => {
  // Convert number to string
  if (basePlan === 1) return 'All Inclusive'
  if (basePlan === 2) return 'Full Board'
  if (basePlan === 3) return 'Half Board'
  if (basePlan === 4) return 'Bed And Breakfast'
  if (basePlan === 5) return 'Self Catering'
  if (basePlan === 6) return 'Room Only'
}

module.exports = router
