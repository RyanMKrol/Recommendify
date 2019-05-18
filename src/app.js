import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'
import path from 'path'

import * as authLib from './Authentication'
import * as artistLib from './ArtistData'
import * as trackLib from './TrackData'
import * as userLib from './UserData'
import * as playlistLib from './PlaylistData'

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

    // fetch the artist IDs for a given list of artist names
    const artistIds = await Promise.all([...noDuplicateArtists].map( async (artist) => {
      return await artistLib.fetchArtistData(accessToken, artist)
    }))
    const filteredArtistIds = artistIds.filter((artistId) => artistId)

    // fetch the top tracks for each artist ID
    const topTracks = await Promise.all(filteredArtistIds.map( async (artistId) => {
      const trackList = await trackLib.fetchArtistTopTracksData(accessToken, artistId)
      return trackList.slice(0, tracksPerArtist)
    }))
    const flattenedTopTracks = topTracks.flat()

    // fetch the user ID of the person using this site
    const userId = await userLib.fetchUserId(accessToken)

    // create a new playlist
    const playlistId = await playlistLib.createPlaylist(accessToken, userId)

    // add tracks to this new playlist
    playlistLib.addTracksToPlaylist(accessToken, playlistId, flattenedTopTracks)

    console.log('done!')
  } catch(err) {
    console.log(err)
  }
})

app.listen(8000, () => {
  console.log('Example app listening on port 8000!')
})
