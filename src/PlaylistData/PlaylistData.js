import requestLib from 'request-promise-native'
import chunks from 'array.chunk'

const MAX_SONGS_INTO_ARRAY = 100

async function createPlaylist(accessToken, userId) {
  const url = encodeURI(`https://api.spotify.com/v1/users/${userId}/playlists`)
  const createPlaylistApiOptions = {
    url,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: {
      "name": "Recommendify Playlist",
      "public": false
    },
    json: true
  }

  return requestLib.post(createPlaylistApiOptions)
  .then((body) => {
    return body.id
  })
}

async function addTracksToPlaylist(accessToken, playlistId, songUris) {
  const url = encodeURI(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`)
  const addSongsApiOptions = {
    url,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    json: true
  }

  const songUriBatches = chunks(songUris, MAX_SONGS_INTO_ARRAY)

  const postSongPromises = songUriBatches.map((batch) => {
    const newBody = {
      body: {
        uris: batch
      }
    }
    const newRequestData = Object.assign(addSongsApiOptions, newBody)

    return requestLib.post(newRequestData)
  })

  await Promise.all(postSongPromises)

  return
}

export {
  createPlaylist,
  addTracksToPlaylist,
}
