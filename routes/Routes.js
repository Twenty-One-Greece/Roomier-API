/**
 * Store all routes here for easy documentation
 *
 */
 const Routes = {

   allPropertyAmenities: '/user/:userID/properties/:propertyID/amenities',

   allRoomTypeAmenities: '/user/:userID/properties/:propertyID/roomTypes/:roomTypeID/amenities',

   allBookingsMin: '/user/:userID/properties/:propertyID/roomTypes/:roomTypeID/bookings',

   allBookingsFull: '/user/:userID/properties/:propertyID/roomTypes/:roomTypeID/bookingsFull',

   deleteBooking: '/user/:userID/properties/:propertyID/roomTypes/:roomTypeID/bookings/:bookingID',

   newBooking: '/user/:userID/properties/:propertyID/roomTypes/:roomTypeID/newBooking'

 }

 module.exports = Routes
