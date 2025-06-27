let previousSelection = $('#defaultCountryCode');;
let previousSelectionPosition = null;

function setCountryCode(element, code) {
    previousSelectionPosition = $('.modal-body').scrollTop()
    if (previousSelection) {
        $(previousSelection).removeClass('selected')
        $(previousSelection).find('.bi-check-circle-fill').remove();
        console.log('removed old selected')
    }
    console.log(`Country now set to ${code}`)
    $('.input-phone-select').text(code)
    $('#countryCode').val(code)
    $(element).append(`
         <div class="bi bi-check-circle-fill ms-auto"></div>
    `)
    $(element).addClass('selected')
    $('#countryCodeModal').modal('hide')

    previousSelection = element
    console.log(previousSelectionPosition)
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


function showErrorMsg(message) {
    $('#loader').css('padding', '8px 10px 8px 10px')
    $('#loader').html(message)
    $('#loader').delay(500).fadeIn(300)
    $('#loader').delay(3000).fadeOut(400)
}



$(document).ready(function () {
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
    
            console.log(secureLevel)
            setSecureLevel(secureLevel)
    
        } else {
            password_strength.toggle();
        }
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

    $('#InputPassword1').on('input', function () {
        togglePasswordStrength($('#InputPassword1'), $('#passwordStrength'))
    })

    $('#InputPassword2').on('input', function () {
        togglePasswordStrength($('#InputPassword2'), $('#passwordStrength2'))
    })


    // for email login
    $('.toggle-password-email').on('click', function () {
        toggleEyeIcon($('#InputPassword1'), $('.toggle-password-email'))
    })


    // for phone login
    $('.toggle-password-phone').on('click', function () {
        toggleEyeIcon($('#InputPassword2'), $('.toggle-password-phone'))
    })



    $('.input-phone-select').on('click', function () {
        $('#countryCodeModal').modal('show')

        if (previousSelectionPosition) {
            $('#countryCodeModal').on('shown.bs.modal', function() {
                $('#countryCodeModal .modal-body').animate({ scrollTop: previousSelectionPosition }, 500);
            });
    
            console.log('scrolled')

        }
    })


    $('#countryCodeSearch').on('keyup', filterCountryCodeList)

    function register(reg_type, account_id, password, invite_code, token) {
        $('#loader').css('padding', '50px')
        $('#loader').html(`
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div)
            >
        `)
        $('#loader').fadeIn(400)


        $.ajax({
            url: '/register-user/',
            type: 'POST',
            contentType: 'application/json',  
            data: JSON.stringify({
                'reg_type': reg_type,
                'account_id': account_id,
                'password': password,
                'invitation_code': invite_code,
            }),
            headers: {
                'X-CSRFToken': token
            },
            success: function(response) {
                console.log(response)
                if (response.status == 'success') {
                    window.location.href = response.url_redirect
                }
                $('#loader').fadeOut(400)
            },

            error: function(response) {
                if (response.responseJSON) {
                    showErrorMsg(`<p>${response.responseJSON.message}</p>`)
                } else {
                    showErrorMsg(`<p>An error occured</p>`)
                }
                console.log(response.responseJSON)
            }

        })
    }

    $('#emailForm').on('submit', function (e) { 
        e.preventDefault()
        var email_input = $('#emailInput').val()
        var password = $('#InputPassword1').val()
        var invite_code = $('#invitationCode').val()
        var token = $(this).find("input[name='csrfmiddlewaretoken']").val()

        if (email_input.length < 1) {
            showErrorMsg('<p>Email can not be empty</p>')
            return
        }

        if (! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email_input)  ) {
            showErrorMsg('<p>Inavlid email format</p>')
            return
        }


        if (password.length < 1) {
            showErrorMsg('<p>Password can not be empty</p>')
            return
        }

        if (checkSecureLevel(password) < 2) {
            showErrorMsg('<p>Please enter a 8-20 digit alphanumeric password</p>')
            return
        }

        if (invite_code.length < 1) {
            showErrorMsg('<p>Invitation code can not be empty</p>')
            return
        }


        console.log(token)
        register('email', email_input, password, invite_code, token)

     })


     $('#phoneForm').on('submit', function (e) { 
        e.preventDefault()
        var phone_input = $('#phoneNumber').val()
        var phone_number = $('#countryCode').val() + phone_input
        var password = $('#InputPassword2').val()
        var invite_code = $('#invitationCode2').val()
        var token = $(this).find("input[name='csrfmiddlewaretoken']").val()


        if (phone_input.length < 1) {
            showErrorMsg('<p>Phone number can not be empty</p>')
            return
        }

        if (! /^\d+$/.test(phone_input)) {
            showErrorMsg('<p>Inavlid phone number format</p>')
            return
        }

        
        if (password.length < 1) {
            showErrorMsg('<p>Password can not be empty</p>')
            return
        }

        if (checkSecureLevel(password) < 2) {
            showErrorMsg('<p>Please enter a 8-20 digit alphanumeric password</p>')
            return
        }

        if (invite_code.length < 1) {
            showErrorMsg('<p>Invitation code can not be empty</p>')
            return
        }

        register('phone_number', phone_number, password, invite_code, token)
    })

})