import * as requestLib from './../RequestLib'

async function _fetchArtistTopTracksData(accessToken, artistId) {
  const url = encodeURI(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?country=GB`)
  const topTracksApiOptions = {
    url: url,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
  }

  return requestLib.get(topTracksApiOptions)
  .then((response) => {
    try {
      const jsonResponse = JSON.parse(response.body)
      return jsonResponse.tracks.map((item) => {
        return item.uri
      })
    } catch (_) {
      return
    }
  })
}

async function fetchTopTracks(accessToken, artistIds, tracksPerArtist) {
  // fetch the top tracks for each artist ID
  const topTracks = await Promise.all(artistIds.map( async (artistId) => {
    const trackList = await _fetchArtistTopTracksData(accessToken, artistId)
    return trackList ? trackList.slice(0, tracksPerArtist) : []
  }))

  return topTracks.flat()
}

export default fetchTopTracks
