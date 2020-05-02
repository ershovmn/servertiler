const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const mongoose = require('mongoose')
const io = require('socket.io').listen(8000)

const newGameGem = require('./fieldGenerator')
const Game = require('./modelGame')

let app = express()

mongoose.connect('mongodb+srv://tehnarenok:tehnarenok@cluster0-oi3cn.mongodb.net/test?retryWrites=true&w=majority', 
    { useNewUrlParser: true, useUnifiedTopology: true }, 
    (err)  => {
        if(err) console.log(err)
        else console.log('database active')
    })

app.get('/', (req, res) => {
    res.send('Hello')
})

io.set('log level', 1);

io.on('connection', (socket) => {
    try {
        console.log(socket.id)
        socket.on('gametype', (data) => {
            let gameType = parseInt(data)
            //console.log('data', data)
            Game.findOne({'typeGame' : gameType, 'startGame' : false}, (err, game) => {
                if(err) {
                    //console.log(err)
                    return 
                }
                console.log(game)
                if(game) {
                    Game.findByIdAndUpdate(game.id, {'startGame' : true, 'player2ID' : socket.id}, (err, startedGame) => {
                        if(err) {
                            //console.log(err)
                            return
                        }
                        if(startedGame) {
                            let {game1, game2} = newGameGem(gameType)
                            //console.log(startedGame.player2ID)
                            try {
                                socket.emit('startGame', game2)
                                io.sockets.sockets[startedGame.player1ID].emit('startGame', game1, () => {
                                    //console.log('afhvwgtabfj')
                                })
                            } catch(err) {
                                //console.log(err)
                            }
                        }
                    })
                } else {
                    let createdGame = new Game({player1ID: socket.id, player2ID: null, startGame: false, typeGame: gameType})
                    createdGame.save(() => {
                        socket.send('createdgame', {})
                    })
                }
            })
        })
        socket.on('move', (data) => {
            //console.log('move', socket.id, data)
            Game.findOne({player1ID: socket.id}, (err, game) => {
                if(game) {
                    let idPlayer = game.player2ID
                    //console.log('1', idPlayer)
                    io.sockets.sockets[idPlayer].emit('move', {data: data})
                } else {
                    Game.findOne({player2ID: socket.id}, (err, game1) => {
                        if(game1) {
                            let idPlayer = game1.player1ID
                            //console.log('2', idPlayer)
                            io.sockets.sockets[idPlayer].emit('move', {data: data})
                        }
                    })
                }
            })
        })
        socket.on('gameend', () => {
            Game.deleteOne({player1ID: socket.id}, (err, res) => {
                //console.log(err, res)
            })
            Game.deleteOne({player2ID: socket.id}, (err, res) => {
                //console.log(err, res)
            })
        })
        socket.on('disconnect', () => {
            console.log('deetet', socket.id)
            Game.deleteOne({player1ID: socket.id}, (err, res) => {
                //console.log(err, res)
            })
            Game.deleteOne({player2ID: socket.id}, (err, res) => {
                //console.log(err, res)
            })
            //console.log('disconnect')
        })
    } catch(err) {

    }
})

app.listen(8080, () => {
    //console.log('Server started')
})
