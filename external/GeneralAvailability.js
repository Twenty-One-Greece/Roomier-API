const express = require('express')
const router = express.Router()
const connection = require('../config/connect.js')
const moment = require('moment')
const functions = require('./functions.js')

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
    data.dayDiff = parseInt(end_date.diff(start_date, 'days'))
    const dayDiff = parseInt(end_date.diff(start_date, 'days'))
    data.paxSum = data.rooms[0].adults + data.rooms[0].children
    const today = moment().format("YYYY-MM-DD")

    // Gets properties, rooms, and rates
    const sql = `select u.id as userID, u.email, p.id, p.name, p.city, p.country, p.address,
    p.longitude, p.latitude, p.shortDescription, p.image, p.stars
    from properties as p join users as u on p.userID = u.id
    where p.city = ? and u.email = ? and p.active = 1;

    select r.name, r.baseOccupancy, r.id, p.id as propertyID
    from roomTypes as r join properties as p
    on r.propertyID = p.id where maxAdults >= ? 
    and maxChildren >= ? and p.city = ? and r.maxPax >= ?;

    select * from rates where ((startDate between date(?) and date(?))
    or (endDate between date(?) and date(?))
    or (startDate <= date(?) and endDate >= date(?)))
    order by propertyID, startDate;

    select * from rates_specialdates as sp
    where (sp.date between date(?) and date(?))
    or (sp.toDate between date(?) and date(?))
    or (sp.date <= date(?) and sp.toDate >= date(?));

    select r.*, u.id as userID, u.email from rates_childPolicies as r
    join users as u on r.userID = u.id
    where u.email = ? group by r.age, r.id;

    select * from specialOffers as so
    join specialOffers_dates as sod on so.id = sod.specialOfferID 
    join specialOffers_rooms as sor on sod.specialOfferID = sor.specialOfferID
    where ? between sod.bookingDateStart and sod.bookingDateEnd
    and ? between sod.stayDateStart and sod.stayDateEnd
    and ? between sod.stayDateStart and sod.stayDateEnd 
    order by so.cumulative desc`

    // Values for query
    const values = [data.otagDestinationCode, data.username, data.rooms[0].adults,
    data.rooms[0].children, data.otagDestinationCode,
    data.paxSum, data.start_date, data.end_date,
    data.start_date, data.end_date, data.start_date, data.end_date,
    data.start_date, data.end_date, data.start_date,
    data.end_date, data.start_date, data.end_date, data.username, today,
    data.start_date, data.end_date]

    // Make the query
    connection.query(sql, values, (err, rows) => {
        if (err) console.log(err);
        // return res.send(rows)
        if (err) return res.send({ error: err })
        else return handleResult(res, rows, dayDiff, data)
    })
})

// select roomTypeImages.image, roomTypes.id as roomTypeId from roomTypeImages
// join roomTypes on roomTypes.id = roomTypeImages.roomTypeID
// where maxAdults >= ? and maxChildren >= ?;


//Elissaios test route
//General availability Route backup
router.post('/general-availability/test', (req, res) => {
    const data = req.body
    const start_date = moment(data.start_date)
    const end_date = moment(data.end_date)
    data.dayDiff = parseInt(end_date.diff(start_date, 'days'))
    const dayDiff = parseInt(end_date.diff(start_date, 'days'))
    data.paxSum = data.rooms[0].adults + data.rooms[0].children
    const today = moment().format("YYYY-MM-DD")

    // Gets properties, rooms, and rates
    const sql =
        `select u.id as userID, u.email, p.id, p.name, p.city, p.country, p.address,
    p.longitude, p.latitude, p.shortDescription, p.image, p.stars
    from properties as p join users as u on p.userID = u.id
    where p.city = ? and u.email = ? and p.active = 1;

    select r.name, r.baseOccupancy, r.id, p.id as propertyID
    from roomTypes as r join properties as p
    on r.propertyID = p.id where maxAdults >= ? 
    and maxChildren >= ? and p.city = ? and r.maxPax >= ?;

    select * from rates where ((startDate between date(?) and date(?))
    or (endDate between date(?) and date(?))
    or (startDate <= date(?) and endDate >= date(?)))
    order by propertyID, startDate;

    select * from rates_specialdates as sp
    where (sp.date between date(?) and date(?))
    or (sp.toDate between date(?) and date(?))
    or (sp.date <= date(?) and sp.toDate >= date(?));

    select r.*, u.id as userID, u.email from rates_childPolicies as r
    join users as u on r.userID = u.id
    where u.email = ? group by r.age, r.id;

    select * from specialOffers as so
    join specialOffers_dates as sod on so.id = sod.specialOfferID 
    join specialOffers_rooms as sor on sod.specialOfferID = sor.specialOfferID
    where ? between sod.bookingDateStart and sod.bookingDateEnd
    and ? between sod.stayDateStart and sod.stayDateEnd
    and ? between sod.stayDateStart and sod.stayDateEnd 
    order by so.cumulative desc

    select roomTypeImages.image, roomTypes.id as roomTypeId from roomTypeImages
    join roomTypes on roomTypes.id = roomTypeImages.roomTypeID
    where maxAdults >= ? and maxChildren >= ?;`

    // Values for query
    const values = [data.otagDestinationCode, data.username, data.rooms[0].adults,
    data.rooms[0].children, data.otagDestinationCode,
    data.paxSum, data.start_date, data.end_date,
    data.start_date, data.end_date, data.start_date, data.end_date,
    data.start_date, data.end_date, data.start_date,
    data.end_date, data.start_date, data.end_date, data.username, today,
    data.start_date, data.end_date]

    // Make the query
    connection.query(sql, values, (err, rows) => {
        if (err) console.log(err);
        // return res.send(rows)
        else return res.send(rows)
        // if (err) return res.send({ error: err })
        // else return handleResult(res, rows, dayDiff, data)
    })
})

// This function formats the results
handleResult = (res, rows, dayDiff, data) => {
    const allRoomTypeImages = row[2]
    const specialdates = rows[4]
    const childPolicies = rows[5]
    const specialOffers = rows[6]

    results = []

    rows[0].forEach((property) => {
        result = {
            provider: { name: 'ROOMIER TEST PLATFORM' },
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
            rooms: getRooms(rows[1], allRoomTypeImages, rows[3], property.id, dayDiff, data, specialdates, childPolicies),
        }
        if (result.rooms) results.push(result)
    }) // For each property

    if (results && specialOffers) calculateSpecialOffers(results, specialOffers)

    return res.send(results)
}



function calculateSpecialOffers(results, specialOffers) {
    results.forEach((result) => result.rooms.forEach((room) => room.mealPlans.forEach((meal) => {
        let mealPrice = meal.price //cumulative
        let mealPriceNonC = mealPrice //non cumulative

        specialOffers.forEach((offer) => {
            if (offer.roomtypeID != room.id) return
            else room.specialOffer = true

            testValue = mealPrice - (offer.discount / 100) * mealPrice
            testValueNonC = mealPriceNonC - (offer.discount / 100) * mealPriceNonC

            if (offer.cumulative) mealPrice = testValue
            else if (testValue < mealPriceNonC) mealPriceNonC = testValueNonC
        })
        meal.price = (mealPrice < mealPriceNonC) ? mealPrice : mealPriceNonC
    })))
}


// FUNCTION - gets all property rooms
getRooms = (rooms, allRoomTypeImages, rates, propID, dayDiff, data, specialdates, childPolicies) => {
    var roomsResult = []
    // Generate values for each room
    rooms.forEach((room, i) => {
        // Match property

        if (propID === room.propertyID) {

            let currentRoomImages = []
            allRoomTypeImages.forEach((roomTypeImage, i) => {
                if (roomTypeImage.roomTypeID === room.id) {
                    images.push(roomTypeImage.image)
                }
            })

            const roomData = {
                name: room.name,
                id: room.id,
                base_occupancy: room.baseOccupancy,
                mealPlans: getMealPlans(rates, room, data, childPolicies),
                images: images
            }

            // Check if room has a stop sales or 0 alotment or checkInDisallowed
            specialdates.forEach((date) => {
                const dateBelongsToRoom = (date.roomTypeID === room.id) ? true : false
                const noAvail = (date.stopSales || date.alotment === 0) ? true : false
                const from = new Date(data.date)
                const to = new Date(data.toDate)
                const dateTest = moment(from).isBetween(data.start_date, data.end_date, null, '[]')
                const toDateTest = moment(to).isBetween(data.start_date, data.end_date, null, '[]')

                if (dateBelongsToRoom && (dateTest || toDateTest) && noAvail) {
                    roomData.mealPlans = null
                }
            })
            // Only push if mealplans were found
            if (roomData.mealPlans) roomsResult.push(roomData)
        }
    }) // For each room

    // Check if rooms with meal plans were found
    if (roomsResult.length) return roomsResult
    else return null
}

// FUNCTION - gets all meal plans that a room has
getMealPlans = function (rates, room, data, childPolicies) {
    let mealPlans = []
    let remainingDays = data.dayDiff
    let checkIn = moment(data.start_date)
    let checkOut = moment(data.end_date)
    let rateCount = -1 // For algorithm to work correctly
    let price = priceHB = priceFB = priceAI = null // Set all prices to null
    let priceBnB = priceSC = priceRO = null // Set all prices to null
    let basePlan = null
    let adults = data.rooms[0].adults
    let i = moment(data.start_date).subtract(1, 'day')
    let x = moment(data.end_date).subtract(1, 'day')
    let z = moment(data.start_date)

    // Generate values for each rate
    rates.forEach((rate) => {
        rate.baseOccupancy = room.baseOccupancy
        let diff = null
        let dataHasChildren = (data.rooms[0].children) ? true : false
        let rateBelongsToRoom = (rate.roomTypeID === room.id && (rate.minimumStay <= data.dayDiff)) ? true : false
        let singleUse = (data.paxSum === 1 && rate.singleUsePrice) ? true : false

        if (data.paxSum > rate.baseOccupancy) diff = data.paxSum - rate.baseOccupancy
        if (dataHasChildren) rate = matchPoliciesWithRate(rate, childPolicies)
        if (z.isBefore(rate.startDate) && rateCount === -1) return
        if (rateBelongsToRoom) {
            rateCount++
            basePlan = rate.basePlan
        }

        // Add amount for each day
        if (rateBelongsToRoom) {
            for (i; i < x; i.add(1, 'day')) {
                let rateEndIsBefore = i.isBefore(rate.endDate)
                let rateEndIsSame = i.isSame(rate.endDate)
                if (rateEndIsSame) break;

                // Base Price
                if (((rateEndIsBefore || rateEndIsSame) || rateCount > 0) && rateBelongsToRoom) {
                    if (singleUse) price += rate.singleUsePrice
                    else if (dataHasChildren && diff) price += calcChildren(rate, data, 'charge', null)
                    else if (diff) price += rate.basePlanPrice + (rate.extraPaxCharge * diff)
                    else price += rate.basePlanPrice
                }
                // All Inclusive
                if (((rateEndIsBefore || rateEndIsSame) || rateCount > 0) && rateBelongsToRoom && rate.allInclusive) {
                    if (singleUse) priceAI += (rate.singleUsePrice + rate.allInclusive)
                    else if (dataHasChildren && diff) priceAI += calcChildren(rate, data, 'allInclusive', adults)
                    else if (diff) priceAI += rate.basePlanPrice + (rate.allInclusive * data.paxSum) + (rate.epcAllInclusive * diff)
                    else priceAI += ((rate.allInclusive * data.paxSum) + rate.basePlanPrice)
                }
                // Full Board
                if (((rateEndIsBefore || rateEndIsSame) || rateCount > 0) && rateBelongsToRoom && rate.fullBoard) {
                    if (diff) priceFB += rate.basePlanPrice + (rate.fullBoard * data.paxSum) + (rate.epcFullBoard * diff)
                    else if (dataHasChildren && diff) priceFB += calcChildren(rate, data, 'fullBoard', adults)
                    else if (singleUse) priceFB += (rate.singleUsePrice + rate.fullBoard)
                    else priceFB += ((rate.fullBoard * data.paxSum) + rate.basePlanPrice)
                }
                // Half Board
                if (((rateEndIsBefore || rateEndIsSame) || rateCount > 0) && rateBelongsToRoom && rate.halfBoard) {
                    if (singleUse) priceHB += (rate.singleUsePrice + rate.halfBoard)
                    else if (dataHasChildren && diff) priceHB += calcChildren(rate, data, 'halfBoard', adults)
                    else if (diff) priceHB += rate.basePlanPrice + (rate.halfBoard * data.paxSum) + (rate.epcHalfBoard * diff)
                    else priceHB += ((rate.halfBoard * data.paxSum) + rate.basePlanPrice)
                }
                // Bed and Breakfast
                if (((rateEndIsBefore || rateEndIsSame) || rateCount > 0) && rateBelongsToRoom && rate.bedAndBreakfast) {
                    if (singleUse) priceBnB += (rate.singleUsePrice + rate.bedAndBreakfast)
                    else if (dataHasChildren && diff) priceBnB += calcChildren(rate, data, 'bedAndBreakfast', adults)
                    else if (diff) priceBnB += rate.basePlanPrice + (rate.bedAndBreakfast * data.paxSum) + (rate.epcBedAndBreakfast * diff)
                    else priceBnB += ((rate.bedAndBreakfast * data.paxSum) + rate.basePlanPrice)
                }
                // Self Catering
                if (((rateEndIsBefore || rateEndIsSame) || rateCount > 0) && rateBelongsToRoom && rate.selfCatering) {
                    if (singleUse) priceSC += (rate.singleUsePrice + rate.selfCatering)
                    else if (dataHasChildren && diff) priceSC += calcChildren(rate, data, 'selfCatering', adults)
                    else if (diff) priceSC += rate.basePlanPrice + (rate.selfCatering * data.paxSum) + (rate.epcSelfCatering * diff)
                    else priceSC += ((rate.selfCatering * data.paxSum) + rate.basePlanPrice)
                }
                // Room Only
                if (((rateEndIsBefore || rateEndIsSame) || rateCount > 0) && rateBelongsToRoom && rate.roomOnly) {
                    if (singleUse) priceRO += (rate.singleUsePrice + rate.roomOnly)
                    else if (dataHasChildren && diff) priceRO += calcChildren(rate, data, 'roomOnly', adults)
                    else if (diff) priceRO += rate.basePlanPrice + (rate.roomOnly * data.paxSum) + (rate.epcRoomOnly * diff)
                    else priceRO += ((rate.roomOnly * data.paxSum) + rate.basePlanPrice)
                }
            } // For loop
        }
    }) // For each rate

    // Push prices added in the mealplans array
    if (price) mealPlans.push({ basePlan: true, price: price, description: formatBasePlan(basePlan) })
    if (priceHB) mealPlans.push({ price: priceHB, description: "Half Board" })
    if (priceFB) mealPlans.push({ price: priceFB, description: "Full Board" })
    if (priceAI) mealPlans.push({ price: priceAI, description: "All Inclusive" })
    if (priceBnB) mealPlans.push({ price: priceBnB, description: "Bed And Breakfast" })
    if (priceSC) mealPlans.push({ price: priceSC, description: "Self Catering" })
    if (priceRO) mealPlans.push({ price: priceRO, description: "Room Only" })

    rateCount = 0 //  Reset rate counter
    if (!mealPlans.length) return // Check if mealPlans were found
    else return mealPlans
}

// Calculate childern prices
calcChildren = function (rate, data, plan, adults) {
    let price = (plan === 'charge') ? rate.basePlanPrice : rate.basePlanPrice + rate[plan] * adults
    let ageGroups = []

    data.rooms[0].childrenAges.forEach((age, i) => {
        rate.childPolicies.forEach((policy) => {
            if (age < policy.age && !ageGroups[i]) {
                ageGroups.push(policy)
            }
        })
    })

    if (plan === 'charge') ageGroups.forEach((ageGroup) => {
        price += (ageGroup.charge)
    })
    else ageGroups.forEach((ageGroup) => {
        price += (ageGroup[plan]) + ageGroup.charge
    })

    return (price)
}


// Match child policies with the rate it belongs to
matchPoliciesWithRate = function (rate, childPolicies) {
    rate.childPolicies = []
    childPolicies.forEach((policy) => {
        if (policy.rateID === rate.id) rate.childPolicies.push(policy)
    })
    return rate
}

// FUNCTION - Convert base plan from number to string
formatBasePlan = (basePlan) => {
    if (basePlan === 1) return 'All Inclusive'
    else if (basePlan === 2) return 'Full Board'
    else if (basePlan === 3) return 'Half Board'
    else if (basePlan === 4) return 'Bed And Breakfast'
    else if (basePlan === 5) return 'Self Catering'
    else if (basePlan === 6) return 'Room Only'
}

module.exports = router