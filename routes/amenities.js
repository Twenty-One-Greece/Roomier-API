const express = require('express')
const router = express.Router()
const connection = require('../config/connect.js')
const checkToken = require('./checkToken.js')
const Routes = require('./Routes.js')

/**
 * Amenities have 2 parts. one is the property amenities and the other
 * is roomtype amenities. In the db they are seperated by the type which is
 * boolean (1 = property || 0 = roomType	).
 * Also if an amenity is a property amenity it will have NULL rommTypeID in the db.
 * Likewise if an amenity is a roomType amenity it will have NULL propertyID in the db.
 */

/**
 * Show all proprty amenities.
 * (must have propertyID, type = 1, roomTypeID = null)
 *
 * Method: GET
 * @return {Object} result
 */
router.get(Routes.allPropertyAmenities, (req, res) => {

  checkToken(req, res, () => {
    connection.query({

      sql: 'select * from amenities where propertyID = ? and userID = ?' +
           ' and type = 1 and roomTypeID is null',
      values: [req.params.propertyID, req.params.userID]

    }, (err, rows, fields) => {
      var result = {};

      if (err) {
        result.error = err
        result.message = 'An error ocured. Please try again.'
        return res.send(result)
      } else {
        result.error = 'noErrors'
        result.amenities = rows
        return res.send(result)
      }
    })
  })
})

/**
 * Show all roomType amenities. (must have propertyID and roomTypeID, type = 2)
 *
 * Method: GET
 * @return {Object} result
 */
router.get(Routes.allRoomTypeAmenities, (req, res) => {
  checkToken(req, res, () => {
    connection.query({

      sql: 'select * from amenities where propertyID = ?' +
           ' and userID = ? and roomTypeID = ? and type = 2',
      values: [req.params.propertyID, req.params.userID, req.params.roomTypeID]

    }, (err, rows, fields) => {
      var result = {}

      if (err) {
        result.error = err
        result.message = 'An error ocured. Please try again.'
        return res.send(result)
      } else {
        result.error = 'noErrors'
        result.amenities = rows
        return res.send(result)
      }
    })
  })
})

/**
 * Show one property amenity
 *
 * Method: GET
 * @return {Object} result
 */
router.get('/user/:userID/properties/:propertyID/amenities/:amenityID', function (req, res, next) {
  var result = {};
  // check token and if token is not valid send invalidToken error
  checkToken(req, res, function () {
    connection.query({

      sql: 'select * from amenities where id = ? and propertyID =? and userID = ? and type = 1',
      values: [req.params.amenityID, req.params.propertyID, req.params.userID]

    }, function (err, rows, fields) {
      if (err) {
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else {
        result.error = 'noErrors';
        result.message = rows.length + ' amenity found.';
        result.amenity = rows;
        return res.send(result);
      }
    }); // callback function
  }); // checkToken function
});

/**
 *  Create new property amenity. Type must be = 1
 *
 * Method: POST
 * Route: /user/:userID/properties/:propertyID/amenities/new
 * @return {Object} result
 */
router.post('/user/:userID/properties/:propertyID/amenities/new', function (req, res, next) {
  var data = req.body;
  var result = {};
  //check if userID in the req is the same as the post data
  // also check if roomTypeID is set in the req to avoid mistakes
  if (req.params.userID != data.userID ||
     req.params.propertyID != data.propertyID) {

    result.error = 'paramsAndReqNotMatch';
    result.message = 'An error ocured. Please try again. ' + req.params.propertyID + data.propertyID;
    return res.send(result);
  }

  // check id it is a roomType amenity by checking the type (1 = property, 2 = roomType)
  if (data.type !== 1) {
    result.error = 'notPropertyAmenity';
    result.message = 'The amenity you are trying to add is not a property amenity.';
    return res.send(result);
  }

  // check token and if token is not valid send invalidToken error
  checkToken(req, res, function () {
    // check if service is free and save it as null if it is
    if (data.price === 0) data.price = null;
    connection.query({

      sql: 'insert into amenities set ?',
      values: data

    }, function (err, rows, fields) {
      if (err) {
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else if (rows.affectedRows === 0) {
        result.error = 'noServicesAdded';
        result.message = 'No amenities could be added. Please try again.';
        return res.send(result);
      } else {
        result.error = 'noErrors';
        result.message = 'Amenity: ' + data.name + ', added successfully';
        result.query = rows;
        return res.send(result);
      }
    }); // query callback
  }); // checkToken callback
});

/**
 * Create new roomType amenity. Type must be = 2
 *
 * Method: POST
 * Route: /user/:userID/properties/:propertyID/roomTypes/:roomTypeID/amenities/new
 * @return {Object} result
 */
router.post('/user/:userID/properties/:propertyID/roomTypes/:roomTypeID/amenities/new', function (req, res, next) {
  var data = req.body;
  var result = {};
  //check if userID in the req is the same as the post data
  if (req.params.userID != data.userID ||
     req.params.propertyID != data.propertyID ||
     req.params.roomTypeID != data.roomTypeID) {

    result.error = 'paramsAndReqNotMatch';
    result.message = 'An error ocured. Please try again.';
    return res.send(result);
  }

  // check id it is a roomType amenity by checking the type (1 = property, 2 = roomType)
  if (data.type !== 2) {
    result.error = 'notRoomTypeAmenity';
    result.message = 'The amenity you are trying to add is not a room type amenity.';
    return res.send(result);
  }

  // check token and if token is not valid send invalidToken error
  checkToken(req, res, function () {
    // check if service is free and save it as null if it is
    if (data.price === 0) data.price = null;
    connection.query({

      sql: 'insert into amenities set ?',
      values: data

    }, function (err, rows, fields) {
      if (err) {
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else if (rows.affectedRows === 0) {
        result.error = 'noServicesAdded';
        result.message = 'No amenities could be added. Please try again.';
        return res.send(result);
      } else {
        result.error = 'noErrors';
        result.message = 'Amenity: ' + data.name + ', added successfully';
        result.query = rows;
        return res.send(result);
      }
    }); // query callback
  }); // checkToken callback
});

/**
 * Delete amenities (either roomType or property since id is unique)
 *
 * Method: DELETE
 * Route: /user/:userID/properties/:propertyID/amenities/:amenityID
 * @return {Object} result
 */
router.delete('/user/:userID/properties/:propertyID/amenities/:amenityID', function (req, res, next) {
  var result = {};
  // check token and if token is not valid send invalidToken error
  checkToken(req, res, function () {
    connection.query({

      sql: 'delete from amenities where id = ? and propertyID =? and userID = ?',
      values: [req.params.amenityID, req.params.propertyID, req.params.userID]

    }, function (err, rows, fields) {
      if (err) {
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else if (rows.affectedRows === 0) {
        result.error = 'noAmenityFound';
        result.message = 'No amenities found to delete.';
        return res.send(result);
      } else {
        result.error = 'noErrors';
        result.message = rows.affectedRows + ' amenity deleted.';
        result.query = rows;
        return res.send(result);
      }
    }); // query callback
  }); // checkToken callback
});


// export router
module.exports = router;
