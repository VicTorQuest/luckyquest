function showmsg() {       
    $('#loader').css('padding', '15px')
    $('#loader').html(`<div class='text-center'><i class="bi bi-check-circle"></i> <p>Copied</p></div>`)
    $('#loader').delay(100).fadeIn(300)
    $('#backdrop').delay(100).fadeIn(300)
    $('#loader').delay(2000).fadeOut(400)
    $('#backdrop').delay(2000).fadeOut(400)
}



function copyUID(uid) {
    navigator.clipboard.writeText(uid)
    showmsg()
}


$(document).ready(function() {


    $('#invCopy').on('click', function() {
        var code = $('.inv-code').text()
        navigator.clipboard.writeText(code)
        showmsg()
    })
    $('.copy-inv-link').on('click', function() {
        var link = $('.copy-inv-link').data('copy-link')
        navigator.clipboard.writeText(link)
        $('#shareModal').modal('hide')
        showmsg()
    })
    
})




   
