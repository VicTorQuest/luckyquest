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

    function sign_in(account_id, password, token) {
        $('#loader').css('padding', '50px')
        $('#loader').html(`
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div)
            >
        `)
        $('#loader').fadeIn(400)
        console.log(next_param)
        console.log(account_id)
        $.ajax({
            url: '/sign-in-user/',
            type: 'POST',
            contentType: 'application/json',  
            data: JSON.stringify({
                'account_id': account_id,
                'password': password,
                'next_param': next_param
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
        var token = $(this).find("input[name='csrfmiddlewaretoken']").val()

        if (email_input.length < 1) {
            showErrorMsg('<p><p>Input your email</p>')
            return
        }

        if (! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email_input)  ) {
            showErrorMsg('<p>Inavlid email format</p>')
            return
        }


        if (password.length < 1) {
            showErrorMsg('<p>input your account password</p>')
            return
        }

        sign_in(email_input, password, token)

     })


     $('#phoneForm').on('submit', function (e) { 
        e.preventDefault()
        var phone_input = $('#phoneNumber').val()
        var phone_number = $('#countryCode').val() + phone_input
        var password = $('#InputPassword2').val()
        var token = $(this).find("input[name='csrfmiddlewaretoken']").val()


        if (phone_input.length < 1) {
            showErrorMsg('<p><p>Input your phone number</p>')
            return
        }

        if (! /^\d+$/.test(phone_input)) {
            showErrorMsg('<p>Inavlid phone number format</p>')
            return
        }

        
        if (password.length < 1) {
            showErrorMsg('<p>Input your account password</p>')
            return
        }


        sign_in(phone_number, password, token)
    })

})