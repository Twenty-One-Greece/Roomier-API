var express = require('express');
var router = express.Router();
var connection = require('../config/connect.js');
var checkToken = require('./checkToken.js');

/**
 * Show all services
 *
 * Method: GET
 * Route:  /user/:userID/properties/:propertyID/services
 * @return {Object} result
 */
router.get('/user/:userID/properties/:propertyID/services', function (req, res) {
  var result = {};
  // check token and if token is not valid send invalidToken error
  checkToken(req, res, function () {
    connection.query({

      sql: 'select * from services where propertyID = ? and userID = ?',
      values: [req.params.propertyID, req.params.userID]

    }, function (err, rows, fields) {
      if (err) {
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else {
        result.error = 'noErrors';
        result.message = rows.length + ' services found.';
        result.services = rows;
        return res.send(result);
      }
    }); // callback function
  }); // checkToken
});

/**
 * Show one service
 *
 * Method: GET
 * Route:  /user/:userID/properties/:propertyID/services/:serviceID
 * @return {Object} result
 */
router.get('/user/:userID/properties/:propertyID/services/:serviceID', function (req, res, next) {
  var result = {};
  // check token and if token is not valid send invalidToken error
  checkToken(req, res, function () {
    connection.query({

      sql: 'select * from services where id = ? and propertyID = ? and userID = ?',
      values: [req.params.serviceID, req.params.propertyID, req.params.userID]

    }, function (err, rows, fields) {
      if (err) {
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else if (rows.length > 1) {
        // this shouldn't be shown normaly
        result.error = 'multipleServicesFound';
        result.message = 'Multiple services found with this ID.';
        return res.send(result);
      } else {
        result.error = 'noErrors';
        result.message = rows.length + ' services found.';
        result.service = rows;
        return res.send(result);
      }
    }); // query callback
  }); // checkToken
});

/**
 * Create new service
 *
 * Method: POST
 * Route:  /user/:userID/properties/:propertyID/services/new
 * @return {Object} result
 */
router.post('/user/:userID/properties/:propertyID/services/new', function (req, res, next) {
  var data = req.body;
  var result = {};
  //check if userID in the req is the same as the post data
  if (req.params.userID != data.userID || req.params.propertyID != data.propertyID ) {
    result.error = 'paramsAndReqNotMatch';
    result.message = 'An error ocured. Please try again.';
    return res.send(result);
  }
  // check token to match userID
  checkToken(req, res, function () {
    // check if service is free and save it as null if it is
    if (data.price === 0) data.price = null;
    connection.query({

      sql: 'insert into services set ?',
      values: data

    }, function (err, rows, fields) {
      if (err) {
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else {
        result.error = 'noErrors';
        result.message = 'Service: ' + data.name + ', added successfully';
        result.query = rows;
        return res.send(result);
      }
    }); // query callback
  }); // checkToken
});

/**
 * update service
 *
 * Method: PUT
 * Route:  /user/:userID/properties/:propertyID/services/:serviceID
 * @return {Object} result
 */
router.put('/user/:userID/properties/:propertyID/services/:serviceID', function (req, res, next) {
  var data = req.body;
  var result = {};
  // check token to match userID
  checkToken(req, res, function () {
    // check if service is free and save it as null if it is
    if (data.price === 0) data.price = null;
    connection.query({

      sql: 'update services set ? where id = ? and propertyID = ? and userID = ?',
      values: [data, req.params.serviceID, req.params.propertyID, req.params.userID]

    }, function (err, rows, fields) {
      if (err) {
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else if (rows.affectedRows === 0) {
        result.error = 'noServiceFound';
        result.message = 'No service found to update with ID ' + req.params.id;
        return res.send(result);
      } else {
        result.error = 'noErrors';
        result.message = rows.affectedRows + ' services updated.';
        result.query = rows;
        return res.send(result);
      }
    }); // query callback
  }); // checkToken
});

/**
 * Delete service
 *
 * Method: DELETE
 * Route:  /user/:userID/properties/:propertyID/services/:serviceID
 * @return {Object} result
 */
router.delete('/user/:userID/properties/:propertyID/services/:serviceID', function (req, res, next) {
  var result = {};
  // check token to match userID
  checkToken(req, res, function () {
    connection.query({

      sql: 'delete from services where id = ? and propertyID = ? and userID = ?',
      values: [req.params.serviceID, req.params.propertyID, req.params.userID]

    }, function (err, rows, fields) {
      if (err) {
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else if (rows.affectedRows === 0) {
        result.error = 'noServiceFound';
        result.message = 'No service found to delete with ID ' + req.params.id;
        return res.send(result);
      } else {
        result.error = 'noErrors';
        result.message = rows.affectedRows + ' service deleted.';
        result.query = rows;
        return res.send(result);
      }
    }); // query callback
  }); // checkToken
});

// export router
module.exports = router;
