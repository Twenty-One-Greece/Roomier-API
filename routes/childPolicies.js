var express = require('express');
var router = express.Router();
var connection = require('../config/connect.js');
var checkToken = require('./checkToken.js');

/**
 * Create new child policy
 *
 * Method: POST
 * Route:  /user/:userID/properties/:propertyID/childPolicies/new
 * @return {Object} result
 */
router.post('/user/:userID/properties/:propertyID/childPolicies/new',
  function (req, res, next) {
    var data = req.body
    var result = {}

    //check if userID in the req is the same as the post data
    if (req.params.userID != data.userID ||
      req.params.propertyID != data.propertyID) {

      result.error = 'paramsAndReqNotMatch'
      result.message = 'An error ocured. Please try again.'
      return res.send(result)
    }

    // if the charge is null or empty string convert it to 0 to avoid calc problems later
    if (data.charge === null || data.charge === '') data.charge = 0;

    checkToken(req, res, function () {
      connection.query({

        sql: 'insert into childPolicies set ?',
        values: data,

      }, function (err, rows, fields) {
        if (err) {
          result.error = err
          result.message = 'An error ocured. Please try again.'
          return res.send(result)
        } else {
          result.error = 'noErrors'
          result.message = 'Child policy added successfully'
          result.query = rows
          return res.send(result)
        }
      })
    })
  })

/**
 * Show all child policies
 *
 * Method: GET
 * Route:  /user/:userID/properties/:propertyID/childPolicies
 * @return {Object} result
 */
router.get('/user/:userID/properties/:propertyID/childPolicies',
  function (req, res) {
    var result = {};
    checkToken(req, res, function () {
      // if the decoded token does not match the id
      connection.query({

        sql: 'select * from childPolicies where userID = ? and propertyID = ? group by age',
        values: [req.params.userID, req.params.propertyID],

      }, function (err, rows, fields) {
        if (err) {
          result.error = err;
          result.message = 'An error ocured. Please try again.';
          return res.send(result);
        } else {
          result.error = 'noErrors';
          result.message = rows.length + ' child policies found.';
          result.childPolicies = rows;
          return res.send(result);
        }
      })
    })
  })

/**
 * Delete one child policies
 *
 * Method: DELETE
 * Route:  /user/:userID/properties/:propertyID/childPolicies/:childPolicyID
 * @return {Object} result
 */
router.delete('/user/:userID/properties/:propertyID/childPolicies/:childPolicyID',
  function (req, res) {
    var result = {}

    checkToken(req, res, function () {
      connection.query({

        sql: 'delete from childPolicies where id = ? and userID = ? and propertyID = ?',
        values: [req.params.childPolicyID, req.params.userID, req.params.propertyID],

      }, function (err, rows, fields) {
        if (err) {
          result.error = err
          result.message = 'An error ocured. Please try again.'
          return res.send(result)
        } else {
          result.error = 'noErrors';
          result.message = rows.affectedRows + ' child policies deleted.'
          result.childPolicies = rows
          return res.send(result)
        }
      })
    })
  })

module.exports = router
