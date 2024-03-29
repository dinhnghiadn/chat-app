const socket = io()
//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector(('#messages'))
const $logOutButton = document.querySelector('#log-out')
const sidebarIndexTemplate = document.querySelector('#sidebar-index').innerHTML
//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const searchParams = new URLSearchParams(window.location.search)
const room = searchParams.get('room').toString()
const autoscroll = () => {
    $messages.scrollTop = $messages.scrollHeight
}

// Sockets event listener

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('MMM Do h:mm A')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()

})

socket.on('locationMessage', (location) => {
    console.log(location)
    const html = Mustache.render(locationMessageTemplate, {
        username: location.username,
        url: location.url,
        createdAt: moment(location.createdAt).format('MMM Do h:mm A')

    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

socket.on('joinInfo',(info)=>{
    console.log(info)

    const html = Mustache.render(sidebarIndexTemplate, {
        rooms: info
    })
    document.querySelector('#sidebar2').innerHTML = html
})
socket.on('redirect',(message)=>{
    alert(`${message}. Redirect to index...`)
    location.href = '/'
})

// Event listeners
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value
    socket.emit('sendMessage', message, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if (error) {
            return console.log(error)
        }
        console.log('Message delivered!')
    })
})
$logOutButton.addEventListener('click',()=>{
    socket.emit('clearSession')
})


$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return ('Geolocation is not supported by your browser!')
    }
    $sendLocationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {

        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!')
        })
    })
})


// Emit join event
socket.emit('join', room, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})

// Change room function
function changeRoom(room)  {
    location.href = '/chat?room='+room
}

