var express = require('express');
var router = express.Router();
var moment = require('moment');
var connection = require('../config/connect.js');

/**
 * Adds new special date.
 *
 * Method: POST
 * Route:  /user/:userID/properties/:propertyID/roomTypes/:roomTypeID/specialDates
 * @return {Object} result
 */
router.post('/user/:userID/properties/:propertyID/roomTypes/:roomTypeID/specialDates',
    function(req, res) {
        var result = {};
        var data = req.body;

        // check token and if token is not valid send invalidToken error
        checkToken(req, res, function() {

            // Validate date
            if (!moment(data.date).isValid() || !moment(data.toDate).isValid()) {
                result.error = 'datesNotValid';
                result.message = 'Dates provided are not valid.';
                return res.send(result);
            }

            connection.query({

                sql: 'insert into rates_specialdates set ?',
                values: [data]

            }, function(err, rows, fields) {
                if (err) {
                    console.log(err);
                    result.error = err;
                    result.message = 'An error ocured. Please try again.';
                    return res.send(result);
                } else {
                    result.error = 'noErrors';
                    result.message = 'Date edited successfully.';
                    return res.send(result);
                }

            }); // callback function
        }); // checkToken function
    });

// export router
module.exports = router;