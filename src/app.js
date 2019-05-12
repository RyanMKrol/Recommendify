import config from 'config'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import querystring from 'querystring'
import request from 'request'
import uuid from 'uuid/v1'

const app = express()
const clientId = 'a9333632c14a45b0ad372b5ab7a8afef'
const clientSecret = config.get('clientSecret');
const redirect_uri = 'http://localhost:8000/callback'
const stateKey = 'spotify_auth_state'
const scope = 'user-read-private user-read-email user-read-playback-state'

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

  const code = req.query.code
  const state = req.query.state
  const storedState = req.cookies ? req.cookies[stateKey] : null

  if (!state || state !== storedState) {
      res.status(500).send('Internal Server Error');
  } else {
    res.clearCookie(stateKey)
    const authOptions = {
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

        const access_token = body.access_token,
            refresh_token = body.refresh_token

        const options = {
          url: 'https://api.spotify.com/v1/me/player',
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
        res.status(500).send('Invalid Token');
      }
    })
  }
})

app.listen(8000, () => {
  console.log('Example app listening on port 8000!')
})
