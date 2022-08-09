const socket = io()
const sidebarIndexTemplate = document.querySelector('#sidebar-index').innerHTML
const $signUpButton = document.querySelector('#signup')
socket.on('info', (info) => {
    console.log(info)
    const html = Mustache.render(sidebarIndexTemplate, {
        rooms: info
    })
    document.querySelector('#sidebar2').innerHTML = html
})
$signUpButton.addEventListener('click',()=>{
    location.href = '/signup'
})
