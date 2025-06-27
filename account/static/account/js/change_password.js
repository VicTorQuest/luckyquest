$(document).ready(function() {
    function showErrorMsg(message) {
        $('#loader').css('padding', '8px 10px 8px 10px')
        $('#loader').html(message)
        $('#loader').delay(500).fadeIn(300)
        $('#loader').delay(3000).fadeOut(400)
    }

    function toggleEyeIcon(password_input, eye_icon) {
        if (password_input.attr('type') == 'password') {
            eye_icon.removeClass('bi-eye-slash-fill')
            password_input.attr('type', 'text')
            eye_icon.addClass('bi-eye-fill')
        }
        else {
            eye_icon.removeClass('bi-eye-fill')
            password_input.attr('type', 'password')
            eye_icon.addClass('bi-eye-slash-fill')
        }
    }
    
    function setSecureLevel(secureLevel) {
        if (secureLevel === 1) {
            $('.one').addClass('checked')
            $('.two').removeClass('checked')
            $('.three').removeClass('checked')
        }
        else if (secureLevel === 2) {
            $('.one').addClass('checked')
            $('.two').addClass('checked')
            $('.three').removeClass('checked')
        }
    
        else if (secureLevel >= 3) {
            $('.one').addClass('checked')
            $('.two').addClass('checked')
            $('.three').addClass('checked')
        }
    
        else {
            $('.one').removeClass('checked')
            $('.two').removeClass('checked')
            $('.three').removeClass('checked')
        }
    }
    
    
    function checkSecureLevel(password) {
        let secureLevel = 0;
    
        if (password.length > 7) {
            secureLevel += 1
        }
    
    
    
    
        if (/[A-Za-z]/.test(password) && /[0-9]/.test(password)) {
            secureLevel += 1
        }
    
    
    
        if (/[^A-Za-z0-9]/.test(password)) {
            secureLevel += 1
        }
    
        return secureLevel
    }
    
    
    function togglePasswordStrength(password_input, password_strength) {
        if (password_input.val().length > 0) {
            password_strength.css('display', 'flex');
    
            let password = password_input.val();
    
    
            secureLevel = checkSecureLevel(password)
    
            setSecureLevel(secureLevel)
    
        } else {
            password_strength.toggle();
        }
    }
    
    
    $('.toggle-password-original').on('click', function () {
        toggleEyeIcon($('#originalPassword'), $('.toggle-password-original'))
    })
    
    
    $('.toggle-password-new').on('click', function () {
        toggleEyeIcon($('#newPassword'), $('.toggle-password-new'))
    })
    
    $('.toggle-password-confirm').on('click', function () {
        toggleEyeIcon($('#confirmPassword'), $('.toggle-password-confirm'))
    })
    
    
    $('#newPassword').on('input', function () {
        togglePasswordStrength($('#newPassword'), $('#passwordStrengthNew')) 
    })
    


    $('#changePasswordForm').submit(function(e) {
        e.preventDefault()
        var original_password = $('#originalPassword').val()
        var new_password = $('#newPassword').val()
        var confirm_password = $('#confirmPassword').val()
        var csrf_token = $(this).find("input[name='csrfmiddlewaretoken']").val()

        console.log(csrf_token)
        if (original_password.length < 1 || new_password.length < 1 || confirm_password.length < 1) {
            showErrorMsg('<p>Password fields must not be empty</p>')
            return
        }
        
        if (checkSecureLevel(new_password) < 2) {
            showErrorMsg('<p>Please enter a 8-20 digit alphanumeric password</p>')
            return
        }

        if (new_password != confirm_password) {
            showErrorMsg('<p>The two password fields didn’t match</p>')
            return
        }

        $('.submit-btn').css('pointer-events', 'none')

        $('#loader').css('padding', '50px')
        $('#loader').html(`
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div)
            >
        `)
        $('#loader').fadeIn(400)

        $.ajax({
            url: '/change-password/',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                'original_password': original_password,
                'new_password': new_password
            }),
            headers: {
                'X-CSRFToken': csrf_token,
                'contentType': 'application/json'
            },
            success: function(res) {
                console.log(res)
                showErrorMsg('<p>Password changed successful</p>')


                $('#changePasswordForm')[0].reset()
                $('#passwordStrengthNew').css('display', 'none');


                $('.submit-btn').css('pointer-events', '')
            },
            error: function(err) {
                if (err.status == 401) {
                    showErrorMsg(`<p>${err.responseJSON.message}</p>`)

                }
                $('.submit-btn').css('pointer-events', '')
            }
        })
    })

})