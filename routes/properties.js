var express = require('express');
var router = express.Router();
var connection = require('../config/connect.js');
var checkToken = require('./checkToken.js');


/**
 * Show all properties full information
 *
 * Method: GET
 * Route:  /user/:userID/properties
 * @return {Object} result
 */
router.get('/user/:userID/properties', function(req, res) {
  var result = {};
  // check token and if token is not valid send invalidToken error
  checkToken(req, res, function() {
    // if the decoded token does not match the id
    connection.query({

      sql: 'select * from properties where userID = ?',
      values: [req.params.userID]

    }, function(err, rows, fields) {
      if (err) {
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else {
        result.error = 'noErrors';
        result.message = rows.length + ' properties found.';
        result.properties = rows;
        return res.send(result);
      }
    }); // callback function
  });
});


/**
 * Show all properties only name
 *
 * Method: GET
 * Route:  /user/:userID/properties-name
 * @return {Object} result
 */
router.get('/user/:userID/properties-name', function(req, res) {
  var result = {};
  // check token and if token is not valid send invalidToken error
  checkToken(req, res, function() {
    // if the decoded token does not match the id
    connection.query({

      sql: 'select id, name from properties where userID = ?',
      values: [req.params.userID]

    }, function(err, rows, fields) {
      if (err) {
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else {
        result.error = 'noErrors';
        result.message = rows.length + ' properties found.';
        result.properties = rows;
        return res.send(result);
      }
    }); // callback function
  });
});


/**
 * Show one property
 *
 * Method: GET
 * Route:  /user/:userID/properties/:propertyID
 * @return {Object} result
 */
router.get('/user/:userID/properties/:propertyID', function(req, res, next) {
  var result = {};
  // check token and if token is not valid send invalidToken error
  checkToken(req, res, function() {
    connection.query({

      sql: 'select * from properties where id = ? and userID = ?',
      values: [req.params.propertyID, req.params.userID]

    }, function(err, rows, fields) {
      if (err) {
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else {
        result.error = 'noErrors';
        result.message = rows.length + ' properties found.';
        result.property = rows;
        return res.send(result);
      }
    }); // query callback
  }); // checkToken callback
});


/**
 * Create new property
 *
 * Method: POST
 * Route:  /user/:userID/properties/new
 * @return {Object} result
 */
router.post('/user/:userID/properties/new', function(req, res, next) {
  var data = req.body;
  var result = {};
  //check if userID in the req is the same as the post data
  if (req.params.userID != data.userID) {
    result.error = 'paramsAndReqNotMatch';
    result.message = 'An error ocured. Please try again.';
    return res.send(result);
  }
  // check token and if token is not valid send invalidToken error
  checkToken(req, res, function() {
    connection.query({

      sql: 'insert into properties set ?',
      values: data

    }, function(err, rows, fields) {
      if (err) {
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else {
        result.error = 'noErrors';
        result.message = 'Property ' + data.name + ' added successfully';
        result.query = rows;
        return res.send(result);
      }
    }); // query callback
  }); // checkToken
});


/**
 * Update property
 *
 * Method: PUT
 * Route:  /user/:userID/properties/:propertyID
 * @return {Object} result
 */
router.put('/user/:userID/properties/:propertyID', function(req, res, next) {
  var result = {};
  checkToken(req, res, function() {
    connection.query({

      sql: 'update properties set ? where id = ? and userID = ?',
      values: [req.body, req.params.propertyID, req.params.userID]

    }, function(err, rows, fields) {
      if (err) {
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else if (rows.affectedRows === 0) {
        result.error = 'noPropertyFound';
        result.message = 'No property found.';
        return res.send(result);
      } else {
        result.error = 'noErrors';
        result.message = rows.affectedRows + ' properties updated.';
        result.query = rows;
        return res.send(result);
      }
    }); // query callback
  }); // checkToken
});

/**
 * Delete property
 *
 * Method: DELETE
 * Route:  /user/:userID/properties/:propertyID
 * @return {Object} result
 */
router.delete('/user/:userID/properties/:propertyID', function(req, res, next) {
  var result = {};
  checkToken(req, res, function() {
    connection.query({

      sql: 'delete from properties where id = ? and userID = ?;' +
          ' delete from cancelPolicies where propertyID = ?;' +
          ' delete from roomTypes where propertyID = ?;' +
          ' delete from services where propertyID = ?;' +
          ' delete from amenities where propertyID = ?;' +
          ' delete from childPolicies where propertyID = ?;' +
          ' delete from specialOffers where propertyID = ?;',
      values: [req.params.propertyID, req.params.userID,
              req.params.propertyID, req.params.propertyID,
              req.params.propertyID, req.params.propertyID,
              req.params.propertyID, req.params.propertyID]

    }, function(err, rows, fields) {

      if (err) {
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else {
        result.error = 'noErrors';
        result.message = 'Property deleted.';
        result.query = rows;
        return res.send(result);
      }
    }); //query callback
  }); // checkToken
});

// export router
module.exports = router;
