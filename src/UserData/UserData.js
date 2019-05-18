import requestLib from 'request-promise-native'

async function fetchUserId(accessToken) {
  const userOptions = {
    url: 'https://api.spotify.com/v1/me',
    headers: { 'Authorization': 'Bearer ' + accessToken },
    json: true
  }

  return requestLib.get(userOptions)
  .then((body) => {
    try {
      return body.id
    } catch (_) {
      return
    }
  })
}

export {
  fetchUserId,
}
