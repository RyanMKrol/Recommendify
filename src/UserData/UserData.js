import * as requestLib from './../RequestLib'

async function fetchUserId(accessToken) {
  const userOptions = {
    url: 'https://api.spotify.com/v1/me',
    headers: { 'Authorization': 'Bearer ' + accessToken },
    json: true
  }

  return requestLib.get(userOptions)
  .then((response) => {
    try {
      return response.body.id
    } catch (_) {
      return
    }
  })
}

export default fetchUserId
