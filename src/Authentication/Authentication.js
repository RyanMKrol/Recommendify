import config from 'config'
import querystring from 'querystring'
import uuid from 'uuid/v1'

import * as requestLib from './../RequestLib'

const CLIENT_ID = 'a9333632c14a45b0ad372b5ab7a8afef'
const CLIENT_SECRET = config.get('clientSecret')
const REDIRECT_URL = 'http://localhost:8000/callback'
const AUTH_STATE_KEY = 'spotify_auth_state'
const PERMISSIONS_LIST = 'user-read-private playlist-modify-public playlist-modify-private'

// user permits us to act on their behalf
function requestInitialAuth(httpResponse) {
    const state = uuid()

    httpResponse.cookie(AUTH_STATE_KEY, state)

    const authoriseParams = querystring.stringify({
      response_type: 'code',
      client_id: CLIENT_ID,
      scope: PERMISSIONS_LIST,
      redirect_uri: REDIRECT_URL,
      state: state
    })

    httpResponse.redirect(`https://accounts.spotify.com/authorize?${authoriseParams}`)
}

// double handshake - we use a code passed back from Spotify to fetch the access tokens
function requestApiTokens(httpRequest, httpResponse) {
  validateState(httpRequest, httpResponse)

  httpResponse.clearCookie(AUTH_STATE_KEY)
  const authOptions = buildAuthOptions(httpRequest)

  return requestLib.post(authOptions)
  .then((response) => {
    return ({
      "accessToken": response.access_token,
      "refreshToken": response.refresh_token
    })
  }).catch((error) => {
    httpResponse.status(500).send('Invalid Token')
    throw new Error('Invalid Token provided')
  })
}

function validateState(httpRequest, httpResponse) {
  const state = httpRequest.query.state
  const storedState = httpRequest.cookies ? httpRequest.cookies[AUTH_STATE_KEY] : null

  if (!state || state !== storedState) {
    httpResponse.status(500).send('Internal Server Error')
    throw new Error('Invalid Token provided')
  }
}

function buildAuthOptions(httpRequest) {
  const code = httpRequest.query.code
  const authToken = new Buffer(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')

  return {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: REDIRECT_URL,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': `Basic ${authToken}`
    },
    json: true
  }
}

export {
  requestInitialAuth,
  requestApiTokens
}
