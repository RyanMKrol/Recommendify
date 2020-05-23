import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'
import path from 'path'
import querystring from 'querystring'

import * as authLib from './Authentication'
import * as playlistLib from './PlaylistData'
import fetchArtistIds from './ArtistData'
import fetchTopTracks from './TrackData'
import fetchUserId from './UserData'

import { logger } from './Utils'

import {
  accessTokenCookieKey,
  refreshTokenCookieKey,
  defaultTracksPerArtist
} from './constants'

const app = express()

app
  .use(express.static(__dirname + './../public'))
  .use(cors())
  .use(cookieParser())
  .use(bodyParser.urlencoded({ extended: false }))

// initial permissions fetching
app.get('/login', function(req, res) {
  logger.info('Logging in')
  authLib.requestInitialAuth(res)
})

app.get('/callback', async function(req, res) {
  try {
    logger.info('Fetching the access tokens')

    // getting specific tokens for API requests
    const tokens = await authLib.requestApiTokens(req, res)

    res.cookie(refreshTokenCookieKey, tokens.refreshToken)

    res.redirect(`/artistList`)
  } catch (err) {
    logger.fatal(`Issue fetching access tokens with error: ${err}`)
  }
})

app.get('/artistList', async function(req, res) {
  try {
    logger.info('Redirecting to artistList page')

    const fileLoc = path.resolve(
      `${__dirname}./../public/artistList/index.html`
    )

    res.sendFile(fileLoc)
  } catch (err) {
    logger.fatal(`Issue redirecting to artistList page with error: ${err}`)
  }
})

app.post('/processArtists', async function(req, res) {
  try {
    // fetch access token and update refresh token
    const currentRefreshToken = req.cookies[refreshTokenCookieKey]
    if (!currentRefreshToken) {
      res.redirect(`/login`)
    }

    const tokens = await authLib.refreshTokens(currentRefreshToken)
    const refreshToken = tokens.refreshToken
    const accessToken = tokens.accessToken

    // if we have no access token, we can't do anything, so error
    if (!accessToken) {
      throw new Error('No access token')
    }

    // fetch data from the page/request
    const listItems = req.body.artistsInput
      .split('\r\n')
      .filter(item => item !== '')
    const tracksPerArtist = req.body.tracksPerArtist || defaultTracksPerArtist
    const noDuplicateArtists = new Set(listItems)

    logger.info(`List items we're using: ${listItems}`)
    logger.info(`Tracks per artist: ${tracksPerArtist}`)

    // fetch artist IDs
    const artistIds = await fetchArtistIds(accessToken, [...noDuplicateArtists])
    logger.info(`Artist IDs: ${artistIds}`)

    // fetch top tracks for artists
    const tracks = await fetchTopTracks(accessToken, artistIds, tracksPerArtist)
    logger.info(`Tracks: ${tracks}`)

    // fetch current user ID to make a playlist against
    const userId = await fetchUserId(accessToken)
    logger.info(`User ID: ${userId}`)

    // create playlist, and fetch ID
    const playlistInfo = await playlistLib.createPlaylist(accessToken, userId)
    logger.info(`Playlist Info: ${playlistInfo}`)

    // add songs to playlist
    const _ = await playlistLib.addTracksToPlaylist(
      accessToken,
      playlistInfo.id,
      tracks
    )
    logger.info(`Finished adding tracks to playlist`)

    // send valid response
    res.redirect(
      `/done?${querystring.stringify({ playlistUri: playlistInfo.href })}`
    )
  } catch (err) {
    console.log(err)
    logger.fatal(`Issue processing artistList with error: ${err}`)
    res.send(err)
  }
})

app.get('/done', async function(req, res) {
  const fileLoc = path.resolve(`${__dirname}./../public/done/index.html`)
  res.sendFile(fileLoc)
})

app.listen(8000, () => {
  console.log('Example app listening on port 8000!')
})
