var express = require('express');
var router = express.Router();
var connection = require('../config/connect.js');
var checkToken = require('./checkToken.js');
var multer = require('multer');
const fs = require('fs');

// Because digital ocean seems to not be accepring a
// relative path you need to toggle between the paths provided below:
//var imageProperties = 'uploads/properties/'
var imageProperties = '/home/roomier/roomier-server/uploads/properties/'
//var logoProperties = 'uploads/logos/'
var logoProperties = '/home/roomier/roomier-server/uploads/logos/'
//var imagesRooms = 'uploads/rooms/'
var imagesRooms = '/home/roomier/roomier-server/uploads/rooms/'

// Each storage variable is different in that it saves images in
// different directories

// Storage variable for property images
var storageImageProperties = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, imageProperties) },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + '.jpg')
  }
})

// Storage variable for property logos
var storageLogoProperties = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, logoProperties) },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + '.jpg')
  }
})

// Storage variable for room images
var storageImagesRooms = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, imagesRooms) },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + '.jpg')
  }
})

// Pass destination functions to multer
var uploadImageProperties = multer({ storage: storageImageProperties })
var uploadLogoProperties = multer({ storage: storageLogoProperties })
var uploadImagesRooms = multer({ storage: storageImagesRooms })

/**
 * Upload image
 *
 * Method: POST
 * Route:  /user/:userID/properties/:propertyID/image
 * @return {Object} result
 */
router.post('/user/:userID/properties/:propertyID/image',
uploadImageProperties.single('image'), function(req, res, next) {
  var result = {};
  var errors = [];

  // Update property with the new image
  connection.query({

      sql: 'update properties set image = ? where id = ? and userID = ?',
      values: [req.file.filename, req.params.propertyID, req.params.userID]

  }, function(err, rows, fields) {
     if (err) errors.push(err)
     // Count errors from previous functions
     if (errors.length) {
       result.error = "error";
       result.message = 'An error ocured. Please try again.';
       return res.send(result);
     } else {
       result.error = 'noErrors';
       result.message = 'Image upload complete';
       return res.send(result);
     }
   }); // query
});

/**
 * Upload logo
 *
 * Method: POST
 * Route:  /user/:userID/properties/:propertyID/logo
 * @return {Object} result
 */
router.post('/user/:userID/properties/:propertyID/logo',
uploadLogoProperties.single('logo'), function(req, res, next) {
  var result = {};
  var errors = [];

  // Update property with the new image
  connection.query({
      sql: 'update properties set logo = ? where id = ? and userID = ?',
      values: [req.file.filename, req.params.propertyID, req.params.userID]

  }, function(err, rows, fields) {
     if (err) errors.push(err)
     // Count errors from previous functions
     if (errors.length) {
       console.log(errors);
       result.error = "error";
       result.message = 'An error ocured. Please try again.';
       return res.send(result);
     } else {
       result.error = 'noErrors';
       result.message = 'Image upload complete';
       return res.send(result);
     }
   }); // query
});

/**
 * Upload room type images
 *
 * Method: POST
 * Route:  /user/:userID/properties/:propertyID/roomTypes/:roomTypeID/images
 * @return {Object} result
 */
router.post('/user/:userID/properties/:propertyID/roomTypes/:roomTypeID/images',
uploadImagesRooms.single('imageRoom'), function(req, res, next) {
  var result = {};
  var errors = [];
  var data = req.body;
  data.image = req.file.filename
  data.userID = req.params.userID
  data.roomTypeID = req.params.roomTypeID

  connection.query({
      sql: 'insert into roomTypeImages set ?',
      values: [data]

  }, function(err, rows, fields) {
     if (err) errors.push(err)
     // Count errors from previous functions
     if (errors.length) {
       console.log(errors);
       result.error = "error";
       result.message = 'An error ocured. Please try again.';
       return res.send(result);
     } else {
       result.error = 'noErrors';
       result.message = 'Image upload complete';
       return res.send(result);
     }
   }); // query
});

/**
 * Delete room type images
 *
 * Method: DELETE
 * Route:  /user/:userID/properties/:propertyID/roomTypes/:roomTypeID/images/:imageName
 * @return {Object} result
 */
router.delete('/user/:userID/properties/:propertyID/roomTypes/:roomTypeID/images/:imageName',
function(req, res, next) {
  var result = {};
  connection.query({

      sql: 'delete from roomTypeImages where userID = ? and image = ?',
      values: [req.params.userID, req.params.imageName]

  }, function(err, rows, fields) {
     if (err) {
       console.log(err);
       result.error = "error";
       result.message = 'An error ocured. Please try again.';
       return res.send(result);
     } else {
       result.error = 'noErrors';
       return res.send(result);
     }
   }); // query

   // Delete image from file system
   fs.unlink(imagesRooms + req.params.imageName, (err) => {
      if (err) throw err;
   });
});

/**
 * Show all propertiy images
 *
 * Method: GET
 * Route:  /user/:userID/properties/:propertyID/images
 * @return {Object} result
 */
router.get('/user/:userID/properties/:propertyID/images', function(req, res) {
  var result = {};
  // check token and if token is not valid send invalidToken error
  checkToken(req, res, function() {
    // if the decoded token does not match the id
    connection.query({

      sql: 'select logo, image from properties' +
      ' where userID = ? and id = ?',
      values: [req.params.userID, req.params.propertyID]

    }, function(err, rows, fields) {
      if (err) {
        console.log(err);
        result.error = err;
        result.message = 'No images found or an error occured.';
        return res.send(result);
      } else {
        result.images = rows[0];
        return res.send(result);
      }
    }); // callback function
  });
});

/**
 * Show all roomtype images
 *
 * Method: GET
 * Route:  /user/:userID/properties/:propertyID/roomTypes/:roomTypeID/images
 * @return {Object} result
 */
router.get('/user/:userID/properties/:propertyID/roomTypes/:roomTypeID/images', function(req, res) {
  var result = {};
  checkToken(req, res, function() {
    connection.query({

      sql: 'select * from roomTypeImages' +
      ' where userID = ? and roomTypeID = ?',
      values: [req.params.userID, req.params.roomTypeID]

    }, function(err, rows, fields) {
      if (err) {
        console.log(err);
        result.error = err;
        result.message = 'No images found or an error occured.';
        return res.send(result);
      } else {
        result.images = rows;
        return res.send(result);
      }
    }); // callback function
  });
});

// export router
module.exports = router;
