const socket = io()

// Change room function
function changeRoom(room)  {
    location.href = '/chat?room='+room
}

