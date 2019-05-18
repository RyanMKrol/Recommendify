import requestLib from 'request-promise-native'

async function fetchArtistData(accessToken, artistName) {
  const searchApiOptions = {
    url: `https://api.spotify.com/v1/search?q=\"${artistName}\"&type=artist&limit=1`,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
  }

  return requestLib.get(searchApiOptions)
  .then((body) => {
    const jsonResponse = JSON.parse(body)
    return jsonResponse.artists.items[0].id
  })
}

export {
  fetchArtistData,
}
