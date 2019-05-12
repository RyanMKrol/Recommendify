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
const scope = 'user-read-private user-read-email user-read-playback-state playlist-modify-public playlist-modify-private'

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
  const code = req.query.code
  const state = req.query.state
  const storedState = req.cookies ? req.cookies[stateKey] : null

  if (!state || state !== storedState) {
      res.status(500).send('Internal Server Error')
      return
  }

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
    if (error || response.statusCode !== 200) {
        res.status(500).send('Invalid Token');
        return
    }

    const access_token = body.access_token
    const refresh_token = body.refresh_token

    const options = {
      url: 'https://api.spotify.com/v1/me',
      headers: { 'Authorization': 'Bearer ' + access_token },
      json: true
    }

    // use the access token to access the Spotify Web API
    request.get(options, function(error, response, body) {
      console.log(body)
      const userId = body.id

      const playlistApiOptions = {
          url: `https://api.spotify.com/v1/users/${userId}/playlists`,
          headers: {
              'Authorization': `Bearer ${access_token}`,
              'Content-Type': 'application/json'
          },
          body: {
              "name": "New Playlist",
              "description": "New playlist description",
              "public": true
          },
          json: true
      }

      request.post(playlistApiOptions, function(error, response, body) {
          res.status(200).send('Well done');
      })
    })

    // store the token and start doing something with it

  })
})

app.listen(8000, () => {
  console.log('Example app listening on port 8000!')
})
