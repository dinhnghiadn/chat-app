const express = require('express')
const router = new express.Router()
const User = require('../models/User')
const {socketRepository, userRepository} = require('../utils/db')
const {generateAuthToken} = require('../utils/users')
const {auth} = require('../utils/middleware')

module.exports = function (io) {
    router.post('/signup', async (req, res) => {
        try {
            const existUser = await userRepository.findOne({where: {username: req.body.username}})
            if (existUser === null) {
                const user = await userRepository.create(req.body)
                await userRepository.save(user)
                res.status(201).redirect('/')
            } else res.status(400).send({error: 'Username has been taken!'})

        } catch (e) {
            res.status(400).send({error: 'Error occur!'})
        }
    })

    router.post('/login', async (req, res) => {
        try {
            if (!req.body.username || !req.body.password) {
                return res.status(400).send({'message': 'Invalid input!'})
            }
            const user = await userRepository.findOneOrFail({
                where: {
                    username: req.body.username,
                    password: req.body.password
                }
            })
            if (user !== null) {
                const token = generateAuthToken(user)
                res.send({user, token})
            } else res.status(404).send({error: 'User not found!'})
        } catch (e) {
            res.status(400).send({error: 'Error occur!'})
        }
    })

    router.delete('/admin/users/:id', auth, async (req, res) => {
        try {
            if (req.user.role === 'admin') {
                const existUser = await userRepository.findOne({where: {id: req.params.id}})
                if (existUser !== null) {
                    await userRepository.createQueryBuilder().delete().where('id' +
                        ' =:id', {id: req.params.id}).execute()

                    res.status(200).send({'message': 'Delete user successfully!'})
                } else res.status(404).send({error: 'User not found!'})
            } else {
                return res.status(401).send({
                    error: 'Unauthorized. Only admin can' +
                        ' delete user!'
                })
            }
        } catch (e) {
            res.status(400).send({error: 'Error occur. Cannot delete user!'})
        }
    })

    router.delete('/admin/room/:name', auth, async (req, res) => {
        try {
            if (req.user.role === 'admin') {
                const existRoom = await socketRepository.find({where: {roomName: req.params.name}})
                if (existRoom.length !== 0) {
                    // io.to(req.params.name).disconnectSockets()
                    await socketRepository.createQueryBuilder().delete().where('roomName' +
                        ' =:name', {name: req.params.name}).execute()
                    io.to(req.params.name).disconnectSockets()
                    res.status(200).send({'message': 'Delete room successfully!'})
                } else res.status(404).send({error: 'Room not found!'})
            } else {
                return res.status(401).send({
                    error: 'Unauthorized. Only admin can' +
                        ' delete room!'
                })
            }
        } catch (e) {
            res.status(400).send({error: 'Error occur. Cannot delete room!'})
        }
    })

    router.post('/chat.html', async (req, res) => {

        const user = await userRepository.findOne({
            where: {
                username: req.body.username,
                password: req.body.password
            }
        })
        if (user) {
            const username = req.body.username;
            const room = req.body.room;
            user.isActive = true
            await userRepository.save(user)
            req.session.User = {username}
            res.redirect('/chat.html?room=' + room)

        } else {
            res.status(404).send({error: 'Invalid username/password!'})
        }
    })

    return router
}
