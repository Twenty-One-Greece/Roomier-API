const express = require('express')
const app = express()
const jwt = require('jsonwebtoken')
const bodyParser = require('body-parser')
const auth = require('./config/auth.js')
const cors = require('cors')
const path = require('path')
// Require routes
const users = require('./routes/users.js')
const properties = require('./routes/properties.js')
const services = require('./routes/services.js')
const amenities = require('./routes/amenities.js')
const cancelPolicies = require('./routes/cancelationPolicies.js')
const roomTypes = require('./routes/roomTypes.js')
const childPolicies = require('./routes/childPolicies.js')
const rooms = require('./routes/rooms.js')
const rates = require('./routes/rates.js')
const specialOffers = require('./routes/specialOffers.js')
const ratesOverview = require('./routes/ratesOverview.js')
const bookings = require('./routes/bookings.js')
const images = require('./routes/images.js')
const specialDates = require('./routes/specialDates.js')
// Variables starting with capital indicate external api
const GeneralAvailability = require('./external/GeneralAvailability.js')
const Information = require('./external/Information.js')
const RoomAvailability = require('./external/RoomAvailability.js')
const SpecificAvailability = require('./external/SpecificAvailability.js')
const Reservation = require('./external/Reservation.js')

// Serve static files (images)
app.use(express.static('uploads/properties'))

// This will let us get the data from a POST
app.use(bodyParser.urlencoded({extended: false, limit: '50mb'}))
app.use(bodyParser.json({limit: '50mb'}))

// Allow cors
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
  next()
});
app.use(cors())

// Set JWT sectet
app.set('superSecret', 'A15081980p');
// Prefix api
app.use('/users', users);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
// Require authentication with jwt in dashboard api
app.use('/dashboard', auth)
app.use('/dashboard', properties)
app.use('/dashboard', services)
app.use('/dashboard', amenities)
app.use('/dashboard', cancelPolicies)
app.use('/dashboard', roomTypes)
app.use('/dashboard', childPolicies)
app.use('/dashboard', rooms)
app.use('/dashboard', rates)
app.use('/dashboard', specialOffers)
app.use('/dashboard', ratesOverview)
app.use('/dashboard', bookings)
app.use('/dashboard', images)
app.use('/dashboard', specialDates)
// External api
app.use('/api/v1.0', GeneralAvailability)
app.use('/api/v1.0', RoomAvailability)
app.use('/api/v1.0', Information)
app.use('/api/v1.0', SpecificAvailability)
app.use('/api/v1.0', Reservation)

// Default route shows nothing
app.get('/', function (req, res) {
  res.send('')
})

app.options('*', function (req, res) {
  res.status(200)
})

// Start server
app.listen(8000, function () {
  console.log('Roomier API listening on port 8000!')
})
