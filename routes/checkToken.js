
/**
 * check if token matches the id in the req params (to identify users)
 * if token is valid it executes the callback function of the route
 * import this in all routes to check the tokens provided
 *
 */
module.exports = checkToken = function (req, res, callback) {

    if (req.params.userID + '!Roomier@#$' !== req.tokenDecoded) {
      var result = {}
      result.error = 'invalidToken'
      result.message = 'An error ocured. Please try again.'
      res.send(result)
      res.end()

    } else callback() // Token matches id
}; // CheckToken
