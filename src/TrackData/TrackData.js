import requestLib from 'request-promise-native'

async function fetchArtistTopTracksData(accessToken, artistId) {
  const url = encodeURI(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?country=GB`)
  const topTracksApiOptions = {
    url: url,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
  }

  return requestLib.get(topTracksApiOptions)
  .then((body) => {
    try {
      const jsonResponse = JSON.parse(body)
      return jsonResponse.tracks.map((item) => {
        return item.uri
      })
    } catch (_) {
      return
    }
  })
}

export {
  fetchArtistTopTracksData,
}
