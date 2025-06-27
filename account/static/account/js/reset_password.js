let previousSelection = $('#defaultCountryCode');;
let previousSelectionPosition = null;


function setCountryCode(element, code) {
    previousSelectionPosition = $('.modal-body').scrollTop()
    if (previousSelection) {
        $(previousSelection).removeClass('selected')
        $(previousSelection).find('.bi-check-circle-fill').remove();
    }
    $('.input-phone-select').text(code)
    $('#countryCode').val(code)
    $(element).append(`
         <div class="bi bi-check-circle-fill ms-auto"></div>
    `)
    $(element).addClass('selected')
    $('#countryCodeModal').modal('hide')

    previousSelection = element
}


function filterCountryCodeList() {
    var searchValue = $('#countryCodeSearch').val().toLowerCase();
    $('#countryCodeList li').each(function() {
        var countryName = $(this).find('span:first').text().toLowerCase();
        var countryCode = $(this).find('span:last').text().toLowerCase();
        if (countryName.includes(searchValue) || countryCode.includes(searchValue)) {
            $(this).show();
        } else {
            $(this).hide();
        }
    });
}


$(document).ready(function () {
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


    function sendCode(type, user_id, element, helptext) {
        var countdown = 120

        helptext.fadeIn(100)
        element.css('background', 'linear-gradient(180deg,#a6acd0 0%,#c2caf4 100%)')
        element.css('pointer-events', 'none')


        // Update button text every second
        var interval = setInterval(function(){
            element.text(countdown + "s");
            countdown--;

            // When countdown reaches 0, reset the button
            if(countdown <= 0){
                clearInterval(interval);
                element.text('send');
                element.css('background', 'linear-gradient(to bottom, #55208a, #744da0)')
                element.css('pointer-events', '')
            }
        }, 1000);


        $.ajax({
            url: '/reset-passwod/send-otp/',
            type: 'GET',
            data: {
                'type': type,
                'user_id': user_id
            },
            success: function() {
                showErrorMsg("<p>Sent successfully</p>")
            },
            error: function(error) {
                if (error.status == 404) {
                    showErrorMsg(`<p>${error.responseJSON.message}</p>`)
                    return
                }

                showErrorMsg(`<p>Server error</p>`)
            }
        })

    }

    function reset_password(login_type, button, user_id, new_password, verification_code, csrf_token, element) {
        button.css('pointer-events', 'none')

        $('#loader').css('padding', '50px')
        $('#loader').html(`
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div)
            >
        `)
        $('#loader').fadeIn(400)



        $.ajax({
            url: '/reset-login-password/',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                'user_id': user_id,
                'password': new_password,
                'verification_code': verification_code,
                'login_type': login_type

            }),
            headers: {
                'X-CSRFToken': csrf_token,
                'contentType': 'application/json',
            },
            success: function(res) {
                showErrorMsg(`<p>Password reset successful</p>`)
                element[0].reset()

                setTimeout(() => {
             
                    window.location.href = res.url
                }, 3500);
            },
            error: function(error) {
                button.css('pointer-events', '')
                if (error.status == 404) {
                    showErrorMsg(`<p>${error.responseJSON.message}</p>`)
                    return
                } else if (error.status == 400) {
                    showErrorMsg(`<p>${error.responseJSON.message}</p>`)
                    return
                }

                showErrorMsg(`<p>Server error</p>`)
            }
        })
    }




    $('.toggle-password-new').on('click', function () {
        toggleEyeIcon($('#newPassword'), $('.toggle-password-new'))
    })
    
    $('.toggle-password-confirm').on('click', function () {
        toggleEyeIcon($('#confirmPassword'), $('.toggle-password-confirm'))
    })

    
    $('.toggle-password-phone').on('click', function () {
        toggleEyeIcon($('#InputPhonePassword'), $('.toggle-password-phone'))
    })

    $('.toggle-password-phone2').on('click', function () {
        toggleEyeIcon($('#confirmPhonePassword'), $('.toggle-password-phone2'))
    })
    
    
    $('#newPassword').on('input', function () {
        togglePasswordStrength($('#newPassword'), $('#passwordStrengthNew')) 
    })

    $('#InputPhonePassword').on('input', function () {
        togglePasswordStrength($('#InputPhonePassword'), $('#passwordStrength2')) 
    })

    $('#sendCode').on('click', function () {
        var email_input = $('#emailInput').val()
        


        if (email_input.length < 1) {
            showErrorMsg("<p>Email field can not be empty</p>")
            return
        }

        if (! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email_input)  ) {
            showErrorMsg('<p>Inavlid email format</p>')
            return
        }

       
        sendCode('email', email_input, $('#sendCode'), $('#vrcodeHelp'))

        
    })

    $('#sendCode2').on('click', function() {
        var phone_input = $('#phoneNumber').val()
        var phone_number = $('#countryCode').val() + phone_input


        if (phone_input.length < 1) {
            showErrorMsg('<p>Phone number can not be empty</p>')
            return
        }

        if (! /^\d+$/.test(phone_input)) {
            showErrorMsg('<p>Inavlid phone number format</p>')
            return
        }

        sendCode('phone', phone_number, $('#sendCode2'), $('#vrcodeHelp2'))
    })
    


    $('#emailForm').submit(function(e) {
        e.preventDefault()


        var email_input = $('#emailInput').val()
        var new_password = $('#newPassword').val()
        var confirm_password = $('#confirmPassword').val()
        var verification_code = $('#verificationCode').val()
        var agreement = $('#btnradio1')
        var csrf_token = $(this).find("input[name='csrfmiddlewaretoken']").val()


        if (email_input.length < 1) {
            showErrorMsg("<p>Email field can not be empty</p>")
            return
        }

        if (! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email_input)  ) {
            showErrorMsg('<p>Inavlid email format</p>')
            return
        }

        if (verification_code.length < 1) {
            showErrorMsg('<p>Input the verification code</p>')
            return
        }

        if (new_password.length < 1 || confirm_password.length < 1) {
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


        if (!agreement.is(':checked')) {
            showErrorMsg('<p>Please agree to the user agreement</p>')
            return
        }

        reset_password('email', $('#submitEmail'), email_input, new_password, verification_code, csrf_token, $('#emailForm'))
        
    })




    $('#phoneForm').submit(function (e) { 
        e.preventDefault()

        var phone_input = $('#phoneNumber').val()
        var phone_number = $('#countryCode').val() + phone_input
        var new_password = $('#InputPhonePassword').val()
        var confirm_password = $('#confirmPhonePassword').val()
        var verification_code = $('#verificationCode2').val()
        var agreement = $('#agreement2')
        var csrf_token = $(this).find("input[name='csrfmiddlewaretoken']").val()



        if (phone_input.length < 1) {
            showErrorMsg('<p>Phone number can not be empty</p>')
            return
        }

        if (! /^\d+$/.test(phone_input)) {
            showErrorMsg('<p>Inavlid phone number format</p>')
            return
        }


        if (verification_code.length < 1) {
            showErrorMsg('<p>Input the verification code</p>')
            return
        }
        
        
        if (new_password.length < 1 || confirm_password.length < 1) {
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


        if (!agreement.is(':checked')) {
            showErrorMsg('<p>Please agree to the user agreement</p>')
            return
        }


        reset_password('phone', $('#sobmitPhone'), phone_number, new_password, verification_code, csrf_token, $('#phoneForm'))


    })



    $('.input-phone-select').on('click', function () {
        $('#countryCodeModal').modal('show')

        if (previousSelectionPosition) {
            $('#countryCodeModal').on('shown.bs.modal', function() {
                $('#countryCodeModal .modal-body').animate({ scrollTop: previousSelectionPosition }, 500);
            });
    

        }
    })


    $('#countryCodeSearch').on('keyup', filterCountryCodeList)

})