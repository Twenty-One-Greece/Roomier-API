// TODO: add all repeated functions for external api
const connection = require('../config/connect.js')

module.exports = {

  // Get user id from username provided
  findUser: function(username, password) {
    let userID = 'uh'
    const sql = 'select id from users where email = ?'
    connection.query(sql, username, (err, rows) => {
      userID = rows[0].id
    })
    setTimeout(() => {return userID}, 1000)
  },



}