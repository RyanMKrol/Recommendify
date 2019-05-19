import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'
import path from 'path'

import * as authLib from './Authentication'
import * as playlistLib from './PlaylistData'
import fetchArtistIds from './ArtistData'
import fetchTopTracks from './TrackData'
import fetchUserId from './UserData'

import {
  accessTokenCookieKey,
  refreshTokenCookieKey,
  defaultTracksPerArtist,
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
    // parse the data from the form/site
    const accessToken = req.cookies[accessTokenCookieKey]
    const listItems = req.body.artistsInput
      .split('\r\n')
      .filter((item) => item !== '')
    const tracksPerArtist = req.body.tracksPerArtist || defaultTracksPerArtist
    const noDuplicateArtists = new Set(listItems)

    if (!accessToken) {
      throw new Error('No access token')
    }

    // fetch artist IDs
    const artistIds = await fetchArtistIds(accessToken, [...noDuplicateArtists])

    // fetch top tracks for artists
    const tracks = await fetchTopTracks(accessToken, artistIds, tracksPerArtist)

    // fetch current user ID to make a playlist against
    const userId = await fetchUserId(accessToken)

    // create playlist, and fetch ID
    const playlistId = await playlistLib.createPlaylist(accessToken, userId)

    // add songs to playlist
    const _ = await playlistLib.addTracksToPlaylist(accessToken, playlistId, tracks)

    // send valid response
    const fileLoc = path.resolve(`${__dirname}./../public/done/index.html`)
    res.sendFile(fileLoc)
  } catch(err) {
    console.log(err)
    res.send(err)
  }
})

app.listen(8000, () => {
  console.log('Example app listening on port 8000!')
})
