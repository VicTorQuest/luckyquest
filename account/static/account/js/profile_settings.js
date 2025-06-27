function showErrorMsg(message) {
    $('#loader').css('padding', '8px 10px 8px 10px')
    $('#loader').html(message)
    $('#loader').delay(500).fadeIn(300)
    $('#loader').delay(3000).fadeOut(400)
}

function copyUID(uid) {
    navigator.clipboard.writeText(uid)
    $('#loader').css('padding', '15px')
    $('#loader').html(`<div class='text-center'><i class="bi bi-check-circle"></i> <p>Copied</p></div>`)
    $('#loader').delay(100).fadeIn(300)
    $('#backdrop').delay(100).fadeIn(300)
    $('#loader').delay(2000).fadeOut(400)
    $('#backdrop').delay(2000).fadeOut(400)
}

$(document).ready(function() {
    function changeUsername(type, username, csrf_token) {
        $('#loader').css('padding', '50px')
        $('#loader').html(`
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div)
            >
        `)
        $('#loader').fadeIn(400)

        $.ajax({
            url: '/change-username/',
            type: 'POST',
            contentType:'application/json',
            data: JSON.stringify({
                'type': type,
                'username': username,
            }),
            headers: {
                'X-CSRFToken': csrf_token,
                'contentType': 'application/json',
            },

            success: function(response) {
                $('#loader').fadeOut(400)
                if (type == 'email') {        
                    $('.email').html(`${response.username} <i class="bi bi-chevron-right ms-2"></i>`)
                    initialEmail = response.username
                } else {
                    $('.phone').html(`${response.username} <i class="bi bi-chevron-right ms-2"></i>`)
                    initialPhone = response.username
                }
                console.log(response)
            },

            error: function(error) {
                if (error.status == 409) {
                    showErrorMsg(`<p>${error.responseJSON.message}</p>`)
                    if (type == 'email') {
                        $('#emailAddress').val(initialEmail)
                    } else {
                        $('#phoneNumber').val(initialEmail)
                    }
                    
                    return
                } else if (error.status == 400) {
                    showErrorMsg(`<p>${error.responseJSON.message}</p>`)
                    ('#phoneNumber').val(initialEmail)
                    return
                }
                showErrorMsg('<p>Server error</p>')
            }
        })
    }



    $('#saveEmail').on('click', function() {
        var email_address = $('#emailAddress').val()
        var csrf_token = $("input[name='csrfmiddlewaretoken']").val()

        $('#emailModal').modal('hide')

        if (email_address == initialEmail) {
            return
        }


        if (email_address.length < 1) {
            showErrorMsg('<p><p>Email can not be empty</p>')
            return
        }

        if (! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email_address)  ) {
            showErrorMsg('<p>Inavlid email format</p>')
            return
        }


        changeUsername('email', email_address, csrf_token)
    })


    $('#savephone').on('click', function() {
        var phone_number = $('#phoneNumber').val()
        var csrf_token = $("input[name='csrfmiddlewaretoken']").val()

        console.log('cheking..')
        $('#phoneModal').modal('hide')
        if (phone_number == initialPhone) {
            return
        }

        if (phone_number.length < 1) {
            showErrorMsg('<p>Phone number can not be empty</p>')
            return
        }

        changeUsername('phone', phone_number, csrf_token)
        console.log('continuing to ajax request')
    })


    $('#review').on('click', function() {
        url = $('#review').data('url')
        window.location.href = url
    })
})