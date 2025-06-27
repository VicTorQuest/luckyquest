$(document).ready(function () {
    function showErrorMsg(message) {
        $('#loader').css('padding', '8px 10px 8px 10px')
        $('#loader').html(message)
        $('#loader').delay(500).fadeIn(300)
        $('#loader').delay(3000).fadeOut(400)
    }


    $('#withdrawBtn').on('click', function() {
        if (!referral_bonus > 0) {
            showErrorMsg('<p>Insufficient bonus</p>')
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


        $.ajax({
            url: '/wallet/withdraw-referral-bonus/',
            type: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'contentType': 'application/json'
            },
            success: function(response) {
                showErrorMsg('<p>Withdrawal successful</p>')
                $('#mainBalance').text(`$${response.balance}`)
                $('#referralBonus').text(`$${response.referral_bonus}`)
                $('#balanceBg').text(`$${response.balance}`)
            },
            error: function (error) {
                if (error.status == 402) {
                    showErrorMsg(`<p>${error.responseJSON.message}</p>`)
                    return
                }
                showErrorMsg('<p>Server error</p>')
            }
        })
    })
})