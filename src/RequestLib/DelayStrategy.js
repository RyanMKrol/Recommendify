function delayStrategy(err, response, body) {
  if (response.headers && response.headers['retry-after']) {
    return response.headers['retry-after'] * 1000
  }

  return 2000
}

export default delayStrategy
