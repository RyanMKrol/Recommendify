import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import querystring from 'querystring'
import request from 'request'
import uuid from 'uuid/v1'
import config from 'config'

const app = express()
const clientId = 'a9333632c14a45b0ad372b5ab7a8afef'
const clientSecret = config.get('clientSecret');
const redirect_uri = 'http://localhost:8000/callback'
const stateKey = 'spotify_auth_state'
const scope = 'user-read-private user-read-email'

app.use(express.static(__dirname + './../public'))
   .use(cors())
   .use(cookieParser())

app.get('/login', function(req, res) {

  const state = uuid()
  res.cookie(stateKey, state)

  const authoriseParams = querystring.stringify({
    response_type: 'code',
    client_id: clientId,
    scope: scope,
    redirect_uri: redirect_uri,
    state: state
  })

  res.redirect(`https://accounts.spotify.com/authorize?${authoriseParams}`)
})

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null
  var state = req.query.state || null
  var storedState = req.cookies ? req.cookies[stateKey] : null

  if (state === null || state !== storedState) {
      // you done fucked up
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }))
  } else {
    res.clearCookie(stateKey)
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(clientId + ':' + clientSecret).toString('base64'))
      },
      json: true
    }

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        }

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body)
        })

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }))
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }))
      }
    })
  }
})

app.listen(8000, () => {
  console.log('Example app listening on port 8000!')
})
