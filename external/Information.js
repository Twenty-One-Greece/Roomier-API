const express = require('express')
const router = express.Router()
const connection = require('../config/connect.js')

/**
 * Information of property
 * Documentation: http://s2.onetourismo.com:8087/documentation/
 *
 * Method: POST
 * @return {Object} result
 */
router.post('/information/', (req, res) => {
 const data = req.body

 // Gets properties, rooms, and rates
 const sql = `select id, name, email, phone, city, country, address,
    stars, longitude, latitude, longDescription, image
    from properties where id = ?;

    select id, name from amenities where propertyID = ?;

    select roomTypeImages.image from roomTypeImages
    join roomTypes on roomTypes.id = roomTypeImages.roomTypeID
    where roomTypes.propertyID = ?;`

  // Values for query
  const values = [data.hotelID, data.hotelID, data.hotelID]

  // Make the query
  connection.query(sql, values, (err, rows) => {
   if(err) console.log(err);
   if (err) return res.send({error: err})
   else return formatInfoResult(rows, res)
  })
})


formatInfoResult = (rows, res) => {
  const property = rows[0][0]
  const services = rows[1]
  const roomTypeImages = rows[2]
  //if (property.image) roomTypeImages.push({image:property.image})

  // Format result
  result = {
    id: property.id,
    name: property.name,
    photos: roomTypeImages,
    description: property.longDescription,
    rating: property.stars,
    services: services,
    loc: { coordinates: [property.longitude, property.latitude] },
    providerContractID: 'ROOMIER TEST PLATFORM',
    hotelID: property.id,
    location: {
      country: property.country,
      city: property.city,
      address: property.address,
      longitude: property.longitude,
      latitude: property.latitude
    },
    contactInfo: {
      phone: property.phone,
      email: property.email,
    }
  }

  // Send result
  return res.send(result)
}

 module.exports = router
