const querystring = require('querystring')
const e = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const fs = require('fs')

const app = e()
const cookieName = 'username'
const numFakeUsers = 1

const words = [{
  w: 'Giraffe',
  c: 'Tier'
}, {
  w: 'Fahrrad',
  c: 'Fahrzeug'
}]

const state = {
  users: [],
  readyUsers: [],
  fakeUsers: [],
  word: '',
  category: ''
}

const fileName = n => path.join(__dirname, 'pages', n)

const startGame = () => {
  const nonFakeUsers = [...state.users]
  for (let i = 0; i < numFakeUsers; i++) {
    const fakeIndex = Math.floor(Math.random() * nonFakeUsers.length)
    const fakeUser = nonFakeUsers.splice(fakeIndex, 1)
    state.fakeUsers = [...state.fakeUsers, ...fakeUser]
  }

  const w = words[Math.floor(Math.random() * words.length)]
  state.word = w.w
  state.category = w.c
}

app.use(e.urlencoded({ extended: true }))

app.use(cookieParser())

// app.use((req, res, next) => {console.log(state); return next()})

app.get('/', (req, res) => {
  res.sendFile(fileName('index.html'))
})

app.post('/', (req, res) => {
  const username = req.body.username
  if (!state.users.includes(username)) {
    state.users = [...state.users, username]
  }
  res.cookie(cookieName, username)
  res.redirect('/wait')
})

app.get('/wait', (req, res) => {
  if (state.users.length !== state.readyUsers.length || state.users.length === 0) {
    res.sendFile(fileName('wait.html'))
  }
})

app.post('/ready', (req, res) => {
  const userName = req.cookies[cookieName]
  if (!userName || !state.users.includes(userName)) {
    res.status(403)
    res.send('Bad request')
    return
  }

  if (!state.readyUsers.includes(userName)) {
    state.readyUsers = [...state.readyUsers, userName]
  }
  if (state.users.length === state.readyUsers.length) {
    if (state.word === '') {
      startGame()
    }
    fs.readFile(state.fakeUsers.includes(userName) ? fileName('fake.html') : fileName('player.html'), (err, data) => {
      if (err) {
        res.status(500)
        res.send('Internal server error: ' + err)
        return
      }

      data = data.toString('utf8').replace('{{ word }}', state.word)
      data = data.replace('{{ category }}', state.category)
      res.send(data)
    })
    return
  }

  res.send('please reload when all players are ready')
})

app.listen(3000)
