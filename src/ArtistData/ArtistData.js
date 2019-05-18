import requestLib from 'request-promise-native'

async function fetchArtistData(accessToken, artistName) {
  const url = encodeURI(`https://api.spotify.com/v1/search?q=\"${artistName}\"&type=artist&limit=1`)
  const searchApiOptions = {
    url,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
  }

  return requestLib.get(searchApiOptions)
  .then((body) => {
    try {
      const jsonResponse = JSON.parse(body)
      return jsonResponse.artists.items[0].id
    } catch (_) {
      return
    }
  })
}

export {
  fetchArtistData,
}
