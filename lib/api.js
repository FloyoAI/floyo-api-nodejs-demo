const path = require('path')
const dotenv = require('dotenv')

const envResult = dotenv.config({ path: path.resolve(__dirname, '../.env') })

const API_KEY = process.env.API_KEY || envResult.parsed?.API_KEY
const API_URL = process.env.API_URL || envResult.parsed?.API_URL

async function apiRequest(url, method, body) {
  if (!API_KEY || !API_URL) {
    throw new Error('Missing API_KEY or API_URL. Set them in your .env file.')
  }

  // Create the options object for the fetch request
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
  }

  if (body) {
    // If there is a body, stringify it and set it as the body of the options object
    options.body = JSON.stringify(body)
  }

  // Return the fetch request
  return fetch(`${API_URL}${url}`, options)
}

const api = {
  get: async (url) => {
    return apiRequest(url, 'GET')
  },
  post: async (url, body) => {
    return apiRequest(url, 'POST', body)
  },
}

module.exports = api
