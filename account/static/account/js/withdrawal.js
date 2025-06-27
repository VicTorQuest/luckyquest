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


function showErrorMsg(message) {
    $('#loader').css('padding', '8px 10px 8px 10px')
    $('#loader').html(message)
    $('#loader').delay(500).fadeIn(300)
    $('#loader').delay(3000).fadeOut(400)
}
$(document).ready(function() {
    $('.input-phone-select').on('click', function () {
        $('#countryCodeModal').modal('show')

        if (previousSelectionPosition) {
            $('#countryCodeModal').on('shown.bs.modal', function() {
                $('#countryCodeModal .modal-body').animate({ scrollTop: previousSelectionPosition }, 500);
            });
    

        }
    })

    $('#countryCodeSearch').on('keyup', filterCountryCodeList)


    $('#trcNetwork').on('click', function() {
        $('#ercNetwork').removeClass('selected')

        $(this).addClass('selected')

        $('#usdtNetwork').val('TRC')
        $('#selectNetwork').modal('hide')
    })

    $('#ercNetwork').on('click', function() {
        $('#trcNetwork').removeClass('selected')
        $(this).addClass('selected')
        $('#usdtNetwork').val('ERC')
        $('#selectNetwork').modal('hide')
    })


    $('#bankForm').submit(function (e) { 
        e.preventDefault()
        var bank_name = $('#bankName').val()
        var recipient_name = $('#recipientName').val()
        var account_number = $('#accountNumber').val()
        var phone = $('.input-phone-select').text()
        var phone_input = $('#phoneNumber').val()
        var phone_number = phone + phone_input
        var email_address = $('#emailInput').val()
        var amount = $('#amountBank').val()
        var csrf_token = $(this).find("input[name='csrfmiddlewaretoken']").val()



        if (bank_name.length < 1) {
            showErrorMsg('<p>Please Input the bank name</p>')
            return
        }

        if (recipient_name.length < 1) {
            showErrorMsg('<p>Please Input the recipient name</p>')
            return
        }

        if  (account_number.length < 1) {
            showErrorMsg('<p>Please Input the account number</p>')
            return
        }

        if (! /^\d+$/.test(account_number)) {
            showErrorMsg('<p>Invalid account number format</p>')
            return
        }

        if (phone_input.length < 1) {
            showErrorMsg('<p>Phone number can not be empty</p>')
            return
        }

        if (! /^\d+$/.test(phone_input)) {
            console.log(phone_number)
            showErrorMsg('<p>Invalid phone number format</p>')
            return
        }

        if (email_address.length < 1) {
            showErrorMsg('<p>Email can not be empty</p>')
            return
        }

        if (! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email_address)  ) {
            showErrorMsg('<p>Inavlid email format</p>')
            return
        }

        if (amount.length < 1) {
            showErrorMsg('<p>Please enter the withdrawal amount</p>')
            return
        }

        if (parseInt(amount) < 50) {
            showErrorMsg('<p>Minimum withdrawal is $50</p>')
            return
        }

        if (parseInt(amount) > balance) {
            showErrorMsg('<p>Insufficient balance</p>')
            return
        }

        $('#loader').css('padding', '50px')
        $('#loader').html(`
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div)
            >
        `)
        $('#loader').fadeIn(400)

        $('#submitBankForm').css('pointer-events', 'none')


        $.ajax({
            url: '/wallet/withdrawal/start_withdrawal/',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                'bank_name': bank_name,
                'recipient_name': recipient_name,
                'account_number': account_number,
                'phone_number': phone_number,
                'email_address': email_address,
                'amount': amount,
                'type': 'bank'
            }),
            headers: {
                'X-CSRFToken': csrf_token,
                'contentType': 'application/json'
            },
            success: function(response) {
                window.location.href = response.url
            },
            error: function(error) {
                $('#submitBankForm').css('pointer-events', '')
                if (error.status == 402) {
                    showErrorMsg(`<p>${error.responseJSON.message}</p>`)
                    return 
                }

                console.log(error)
                showErrorMsg(`<p>Server error</p>`)
            }
        })
    })



    $('#usdtForm').submit(function(e) {
        e.preventDefault()
        var usdt_network = $('#usdtNetwork').val()
        var wallet_address = $('#usdtAddress').val()
        var amount = $('#amountUSDT').val()
        var csrf_token = $(this).find("input[name='csrfmiddlewaretoken']").val()


        if (wallet_address.length < 1) {
            showErrorMsg('<p>Please enter your wallet address</p>')
            return
        }


        if (amount.length < 1) {
            showErrorMsg('<p>Please enter the withdrawal amount</p>')
            return
        }

        if (parseInt(amount) < 50) {
            showErrorMsg('<p>Minimum withdrawal is $50</p>')
            return
        }

        if (parseInt(amount) > balance) {
            showErrorMsg('<p>Insufficient balance</p>')
            return
        }

        $('#loader').css('padding', '50px')
        $('#loader').html(`
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div)
            >
        `)
        $('#loader').fadeIn(400)
        $('#submitUSDTForm').css('pointer-events', 'none')


        $.ajax({
            url: '/wallet/withdrawal/start_withdrawal/',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                'usdt_network': usdt_network,
                'wallet_address': wallet_address,
                'amount': amount,
                'type': 'usdt'
            }),
            headers: {
                'X-CSRFToken': csrf_token,
                'contentType': 'application/json'
            },
            success: function(response) {
                window.location.href = response.url
            },
            error: function(error) {
                $('#submitUSDTForm').css('pointer-events', '')
                if (error.status == 402) {
                    showErrorMsg(`<p>${error.responseJSON.message}</p>`)
                    return 
                }

                console.log(error)
                showErrorMsg(`<p>Server error</p>`)
            }
        })

    })
})