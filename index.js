// @flow

'use strict'

let config = require('./config.js')
let Wit = require('node-wit').Wit
let interactive = require('node-wit').interactive
let req = require('request')

// Send request to Wit AI

const accessToken = config.WIT_TOKEN

const firstEntityValue = (entities, entity) => {
  const val = entities && entities[entity] &&
    Array.isArray(entities[entity]) &&
    entities[entity].length > 0 &&
    entities[entity][0].value
  if (!val) {
    return null
  }
  return typeof val === 'object' ? val.value : val
}

const actions = {
  send (request, response) {
    const {sessionId, context, entities} = request
    const {text, quickreplies} = response
    console.log('\n' + JSON.stringify(response).replace('{"text":"', '').replace('"}', '') + '\n')
  },
  getForecast ({context, entities}) {
    return new Promise((resolve, reject) => {
      var location = firstEntityValue(entities, 'location')
      if (location) {
        openWeatherMap(location, function (success, previsions) {
          if (!success) {
            console.log('An error occured when called openWeatherAPI, please try again.')
            return reject('Failed to get meteo')
          }
          previsions ? context.forecast = ('There is the weather for : ' + previsions.city + ' Temperature : ' + previsions.temperature + '°C Moisture : ' + previsions.humidity + '% Wind : ' + previsions.wind + 'km/h')
          : context.forecast = 'Error'
          return resolve(context)
        })
        context.missingLocation = false
      } else {
        console.log('There is no location')
        context.missingLocation = true
        delete context.forecast
        return reject('No location')
      }
    })
  }
}

// API openWeatherMap Function - Get the weather from API

var openWeatherMap = function (city, callback) {
  var url = 'http://api.openweathermap.org/data/2.5/weather?q=' + city + '&lang=us&units=metric&appid=' + config.OPENWEATHER_TOKEN

  req(url, function (err, response, body) {
    try {
      var result = JSON.parse(body)
      if (result.cod !== 200 || err) {
        callback(false)
      } else {
        var previsions = {
          temperature: Math.round(result.main.temp),
          humidity: result.main.humidity,
          wind: Math.round(result.wind.speed * 3.6),
          city: result.name
        }
        callback(true, previsions)
      }
    } catch (e) {
      callback(false)
    }
  })
}

const client = new Wit({accessToken, actions})
interactive(client)
