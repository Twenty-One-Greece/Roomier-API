var express = require('express');
var router = express.Router();
var connection = require('../config/connect.js');

/**
 * Cancelation policies can have 3 types of ponalties 1.Cancelation penalty,
 * 2.No-show penalty, 3.Early departure penalty. they are saved in the db according
 * to the number indicating the type.
 * Also the penalty can be charged either by a net value or by the percentage of the
 * total booking cost (0 or 1 in the db accordingly)
 * Lastly the value which will be used in the calculations according to the charge type
 */
 
/**
 * Show all proprty cancelation policies
 *
 * Method: GET
 * Route:  /user/:userID/properties/:propertyID/cancelPolicies
 * @return {Object} result
 */
router.get('/user/:userID/properties/:propertyID/cancelPolicies', function (req, res) {
  var result = {};
  // check token and if token is not valid send invalidToken error
  checkToken(req, res, function () {
    connection.query({

      sql: 'select * from cancelPolicies where propertyID = ? and userID = ?',
      values: [req.params.propertyID, req.params.userID]

    }, function (err, rows, fields) {
      if (err) {
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else {
        result.error = 'noErrors';
        result.message = rows.length + ' cancelation policies found.';
        result.cancelPolicies = rows;
        return res.send(result);
      }
    }); // callback function
  }); // checkToken
});

/**
 * Add new cancelation policy
 *
 * Method: POST
 * Route:  user/:userID/properties/:propertyID/cancelPolicies/new
 * @return {Object} result
 */
router.post('/user/:userID/properties/:propertyID/cancelPolicies/new', function (req, res, next) {
  var data = req.body;
  var result = {};
  //check if userID in the req is the same as the post data
  if (req.params.userID != data.userID || req.params.propertyID != data.propertyID) {
    result.error = 'paramsAndReqNotMatch';
    result.message = 'An error ocured. Please try again.';
    return res.send(result);
  }
  // chekc if user sent a value
  if(typeof data.value === 'undefined' || typeof data.value === 'undefined') {
    result.error = 'noValue';
    result.message = 'You need to specify the days and a value to be charged.';
    return res.send(result);
  }

  // check token and if token is not valid send invalidToken error
  checkToken(req, res, function () {
    // check if service is free and save it as null if it is
    if (data.price === 0) data.price = null;
    if (data.chargeType === 2) data.days = null;

    connection.query({

      sql: 'insert into cancelPolicies set ?',
      values: [data, req.params.id]

    }, function (err, rows, fields) {
      if (err) {
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else if (rows.affectedRows === 0) {
        result.error = 'noServicesAdded';
        result.message = 'No cancelation policies could be added. Please try again.';
        return res.send(result);
      } else {
        result.error = 'noErrors';
        result.message = 'Cancelation policy added successfully';
        result.query = rows;
        return res.send(result);
      }
    }); // callback function
  }); // checkToken
});

/**
 * Delete cancelation policy
 *
 * Method: DELETE
 * Route:  /user/:userID/properties/:propertyID/cancelPolicies/:cancelPolicyID
 * @return {Object} result
 */
router.delete('/user/:userID/properties/:propertyID/cancelPolicies/:cancelPolicyID', function (req, res, next) {
  var result = {};
  // check token and if token is not valid send invalidToken error
  checkToken(req, res, function () {
    connection.query({

      sql: 'delete from cancelPolicies where id = ? and propertyID = ? and userID = ?',
      values: [req.params.cancelPolicyID, req.params.propertyID, req.params.userID]

    }, function (err, rows, fields) {
      if (err) {
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else if (rows.affectedRows === 0) {
        result.error = 'noAmenityFound';
        result.message = 'No cancelation policies found to delete.';
        return res.send(result);
      } else {
        result.error = 'noErrors';
        result.message = rows.affectedRows + ' cancelation policy deleted.';
        result.query = rows;
        return res.send(result);
      }
    }); // callback function
  }); // checkToken
});



// export router
module.exports = router;
