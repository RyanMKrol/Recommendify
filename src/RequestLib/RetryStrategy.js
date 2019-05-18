function retryStrategy(err, response, body, options){
  return !!err || response.statusCode === 429
}

export default retryStrategy
