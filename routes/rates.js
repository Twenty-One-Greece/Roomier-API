var express = require('express');
var router = express.Router();
var moment = require('moment');
var connection = require('../config/connect.js');


/**
 * Add new rate. Checks if meal values are set (if not, creates null value)
 * Checks dates to be valid. Lastly it adds the rate to the db
 *
 * Method: POST
 * Route:  /user/:userID/properties/:propertyID/roomTypes/:roomTypeID/rates/new
 * @return {Object} result
 */
router.post('/user/:userID/properties/:propertyID/roomTypes/:roomTypeID/rates/new',
function(req, res, next) {
  // Format data
  let data = req.body
  let dates = data.dates
  let childPolicies = data.rates_childPolicies
  let result = {}
  let errors = []
  delete data.rates_childPolicies
  delete data.dates

  // Check if userID in the req is the same as the post data
  if (req.params.userID != data.userID ||
      req.params.propertyID != data.propertyID) {

    result.error = 'paramsAndReqNotMatch';
    result.message = 'An error ocured. Please try again.';
    return res.send(result);
  }

  // Validate token
  checkToken(req, res, () => {
    // For every set of dates make a new rate
    dates.forEach( (date, i) => {
      data.startDate = date.startDate
      data.endDate = date.endDate
      const sql = 'insert into rates set ?'

      if (data.startDate && data.endDate) {
        connection.query(sql, data, (err, rows, fields) => {
          // Insert policies of rate in db and store result
          let error = saveChildPolicies(childPolicies, rows.insertId, data)
          if (error) errors.push(error)
          if (err) errors.push(err)
        })
      }
    })

    if (!errors.length) 
      return res.send({error: 'noErrors', message: 'New rate added successfully'});
    else return res.send({error: errors, message: 'An error eccured'})

  }) // checkToken
})

/**
 * Add new rate. Checks if meal values are set (if not, creates null value)
 * Checks dates to be valid. Lastly it adds the rate to the db
 *
 * Method: GET
 * Route:  /user/:userID/properties/:propertyID/roomTypes/:roomTypeID/rates
 * @return {Object} result
 */
router.get('/user/:userID/properties/:propertyID/roomTypes/:roomTypeID/rates',
function(req, res) {
  var result = {};
  // Check token and if token is not valid send invalidToken error
  checkToken(req, res, function() {
    connection.query({

      sql: 'select rates.*, roomTypes.name as roomName' +
        ' from rates' +
        ' inner join roomTypes' +
        ' on rates.roomTypeID = roomTypes.id' +
        ' where rates.propertyID = ?' +
        ' and rates.userID = ?' +
        ' and rates.roomTypeID = ?' +
        ' order by startDate',
      values: [req.params.propertyID, req.params.userID, req.params.roomTypeID]

    }, function(err, rows, fields) {
      if (err) {
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else {
        result.error = 'noErrors';
        result.message = rows.length + ' rates found.';
        result.rates = rows;
        return res.send(result);
      }
    }); // callback function
  }); // checkToken
});

/**
 * Show one rate
 *
 * Method: GET
 * Route:  /user/:userID/properties/:propertyID/roomTypes/:roomTypeID/rates/:rateID
 * @return {Object} result
 */
router.get('/user/:userID/properties/:propertyID/roomTypes/:roomTypeID/rates/:rateID',
function(req, res) {
  var result = {};
  // check token and if token is not valid send invalidToken error
  checkToken(req, res, function() {
    connection.query({

      sql: `select * from rates where id = ?;
        select * from rates_childPolicies where rateID = ?;`,
      values: [req.params.rateID, req.params.rateID]

    }, function(err, rows, fields) {
      if (err) {
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else {
        result.error = 'noErrors';
        result.rate = rows[0][0]
        result.childPolicies = rows[1];
        return res.send(result);
      }
    }); // callback function
  }); // checkToken
});

/**
 * Show all rates with special dates
 *
 * Method: GET
 * Route:  /user/:userID/properties/:propertyID/roomTypes/:roomTypeID/ratesCalendar/
 * @return {Object} result
 */
router.get('/user/:userID/properties/:propertyID/roomTypes/:roomTypeID/ratesCalendar/',
function(req, res) {
  var result = {}
  // Check token and if token is not valid send invalidToken error
  checkToken(req, res, function() {
    connection.query({

      sql: `select * from rates where roomTypeID = ? order by startDate;
        select * from rates_specialdates where roomTypeID = ? order by date;`,
      values: [req.params.roomTypeID, req.params.roomTypeID]

    }, function(err, rows, fields) {
      if (err) {
        result.error = err
        result.message = 'An error ocured. Please try again.'
        return res.send(result)
      } else {
        result.error = 'noErrors'
        result.rates = rows[0]
        result.specialDates = rows[1]
        formatDates(result, res)
      }
    }); // callback function
  }); // checkToken
});


/**
 * Update rate
 *
 * Method: PUT
 * Route:  /user/:userID/properties/:propertyID/roomTypes/:roomTypeID/rates/:rateID
 * @return {Object} result
 */
router.put('/user/:userID/properties/:propertyID/roomTypes/:roomTypeID/rates/:rateID',
function(req, res, next) {
  var data = req.body;
  var result = {};
  //check if userID in the req is the same as the post data
  if (req.params.userID != data.userID || req.params.propertyID != data.propertyID) {
    result.error = 'paramsAndReqNotMatch';
    result.message = 'An error ocured. Please try again.';
    return res.send(result);
  }

  // check token and if token is not valid send invalidToken error
  checkToken(req, res, function() {

    // check if values provided are valid values. returns a warning if not
    if (!moment(data.startDate).isValid() || !moment(data.endDate).isValid()) {
      result.error = 'datesNotValid';
      result.message = 'Dates provided are not valid.';
      return res.send(result);
    } else {
      // format dates with moment js
      data.startDate = moment(data.startDate).format('YYYY-MM-DD');
      data.endDate = moment(data.endDate).format('YYYY-MM-DD');
    }

    // start date cant be greated than end date
    if (moment(data.startDate).isAfter(data.endDate) || data.startDate === data.endDate) {
      result.error = 'datesNotValid';
      result.message = 'End date must be greater than start date.';
      return res.send(result);
    }

    connection.query({

      sql: 'update rates set ? where id = ?',
      values: [data, req.params.rateID]

    }, function(err, rows, fields) {
      if (err) {
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else {
        result.error = 'noErrors';
        result.message = 'New rate updated successfully';
        result.query = rows;
        return res.send(result);
      }
    }); // callback function
  }); // checkToken
});


/**
 * Delete child policies of one rate
 *
 * Method: PUT
 * Route:  /user/:userID/properties/:propertyID/roomTypes/:roomTypeID/rates/:rateID
 * @return {Object} result
 */
router.put('/user/:userID/properties/:propertyID/roomTypes/:roomTypeID/childPolicies/:rateID',
function(req, res) {
  const data = req.body
  const sql = "update rates_childPolicies set ? where id = ?"
  let errors = []

  data.forEach( (policy, i) => {
    connection.query(sql, [data[i], data[i].id], (err, rows) => {
      if (err) return errors.push(err)
      return 
    })
  })

  if (errors.length >= 0) return res.send({error: 'noErrors', message: "Updated successfully"})
  return res.send({error: errors, message: "An error occured"})
})


/**
 * Delete one rate
 *
 * Method: DELETE
 * Route:  /user/:userID/properties/:propertyID/roomTypes/:roomTypeID/rates/:rateID
 * @return {Object} result
 */
router.delete('/user/:userID/properties/:propertyID/roomTypes/:roomTypeID/rates/:rateID',
function(req, res) {
  var result = {};
  // check token and if token is not valid send invalidToken error
  checkToken(req, res, function() {
    connection.query({

      sql: 'delete from rates where id = ?;' +
           ' delete from rates_childPolicies where rateID = ?;' +
           ' delete from rates_cancelPolicies where rateID = ?;',
      values: [req.params.rateID, req.params.rateID, req.params.rateID]

    }, function(err, rows, fields) {
      if (err) {
        console.log(err);
        result.error = err;
        result.message = 'An error ocured. Please try again.';
        return res.send(result);
      } else {
        result.error = 'noErrors';
        result.message = 'Rate deleted.';
        result.rates = rows;
        return res.send(result);
      }
    }); // callback function
  }); // checkToken
});


// #################################################################################
// FUNCTIONS START HERE
// #################################################################################


// saveRateChildPolicies - used in new rate route
saveChildPolicies = function(childPolicies, rateID, data) {
  let result = {};
  let error = null

  // instert all child policies in db
  childPolicies.forEach( (policy) => {
    policy.propertyID = data.propertyID
    policy.userID = data.userID
    policy.rateID = rateID
    const sql = 'insert into rates_childPolicies set ?'
    connection.query(sql, policy, (err, rows, fields) => {
      if (err) console.log(err)
      error = err
    })
  })

  if (error) return error
  return null;
}


formatDates = (result, res) => {
  result.rates.forEach( (rate) => {
    rate.startDate = moment(rate.startDate).format("YYYY-MM-DD")
    rate.endDate = moment(rate.endDate).format("YYYY-MM-DD")
  })
  result.specialDates.forEach( (specialDate) => {
    specialDate.date = moment(specialDate.date).format("YYYY-MM-DD")
    specialDate.toDate = moment(specialDate.toDate).format("YYYY-MM-DD")
  })
  res.send(result)
}



// export router
module.exports = router;
