import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'
import path from 'path'

import * as authLib from './Authentication'
import * as artistLib from './ArtistData'

import {
  accessTokenCookieKey,
  refreshTokenCookieKey,
} from './constants'

const app = express()

app.use(express.static(__dirname + './../public'))
  .use(cors())
  .use(cookieParser())
  .use(bodyParser.urlencoded({extended: false}))

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

    res.cookie(accessTokenCookieKey, access_token)
    res.cookie(refreshTokenCookieKey, refresh_token)

    res.redirect(`/artistList`)
  } catch(err) {
    console.log(err)
  }
})

app.get('/artistList', async function(req, res) {
  try {
    const fileLoc = path.resolve(`${__dirname}./../public/artistList/index.html`)
    res.sendFile(fileLoc)
  } catch(err) {
    console.log(err)
  }
})

app.post('/processArtists', async function(req, res) {
  try {
    const listItems = req.body.artistsInput
      .split('\r\n')
      .filter((item) => item !== '')
    const noDuplicateListItems = new Set(listItems)

    // fetch the artist IDs
    artistLib.fetchArtistData(req, res)

  } catch(err) {
    console.log(err)
  }
})

app.listen(8000, () => {
  console.log('Example app listening on port 8000!')
})
