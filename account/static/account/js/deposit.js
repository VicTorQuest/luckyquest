$(document).ready(function() {
    function showrMsg(message) {
        $('#loader').css('padding', '8px 10px 8px 10px')
        $('#loader').html(message)
        $('#loader').delay(500).fadeIn(300)
        $('#loader').delay(3000).fadeOut(400)
    }

    $('#selectTrc').on('click', function() {
        $(this).addClass('selected')
        $('#selectErc').removeClass('selected')
        $('#usdtNetwork').val('trc')
        return
    })

    $('#selectErc').on('click', function() {
        $(this).addClass('selected')
        $('#selectTrc').removeClass('selected')
        $('#usdtNetwork').val('erc')
        return
    })


    $('.selectamount').on('click', function() {
        $('.selectamount').removeClass('selected')
        $(this).addClass('selected')
        amount = $(this).data('amount')
        $('#amountInput').val(amount) 
    })


    $('#depositForm').submit(function(e) {
        e.preventDefault()
        var amount = $('#amountInput').val()
        var network = $('#usdtNetwork').val()
        var csrf = $("input[name='csrfmiddlewaretoken']").val()
        
        console.log(csrf)
        
        if (amount.length < 1) {
            showrMsg(`<p>Please enter the amount</p>`)
            return
        }

        if (parseInt(amount) < 20) {
            showrMsg(`<p>Minimum deposit is $20</p>`)
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
            url: '/wallet/deposit/start-deposit/',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                'amount': amount,
                'network': network
            }),
            headers: {
                'X-CSRFToken': csrf,
                'contentType': 'application/json'
            },
            success: function(response) {
                window.location.href = response.url
            },
            error: function(error) {
                $('.submit-btn').css('pointer-events', '')
                if (error.status == 408) {
                    showrMsg(`<p>${error.responseJSON.message}</p>`)
                    return
                } else if (error.status == 402) {
                    return showrMsg(`<p>${error.responseJSON.message}</p>`)
                }

                showrMsg('<p>Server error</p>')
            }
        })
    })
})