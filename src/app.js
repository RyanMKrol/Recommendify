import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import request from 'request'
import * as authLib from './Authentication'

const app = express()

app.use(express.static(__dirname + './../public'))
  .use(cors())
  .use(cookieParser())

// initial permissions fetching
app.get('/login', function(req, res) {
  authLib.requestInitialAuth(res)
})

app.get('/callback', async function(req, res) {
  try {
    // getting specific tokens for API requests 
    const tokens = await authLib.requestApiTokens(req, res)

    const access_token = tokens.accessToken
    const refresh_token = tokens.refreshToken

    const options = {
      url: 'https://api.spotify.com/v1/me',
      headers: { 'Authorization': 'Bearer ' + access_token },
      json: true
    }

    // use the access token to access the Spotify Web API
    request.get(options, function(error, response, body) {
      console.log('WHATS GOING ON HERE')
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
  } catch(err) {
    console.log(err)
  }
})

app.listen(8000, () => {
  console.log('Example app listening on port 8000!')
})
