function showErrorMsg(message) {
    $('#loader').css('padding', '8px 10px 8px 10px')
    $('#loader').html(message)
    $('#loader').delay(300).fadeIn(300)
    $('#loader').delay(3000).fadeOut(400)
    $('#submitBtn').css('pointer-events', '')
}


$(document).ready(function() {

    function openGift(price) {
        if ($('.click').attr('class') === 'click') {
            $('.click').addClass('active')
            $('.gift-box').addClass('active')
            $('.gift-shadow').addClass('active')
            $('.gift-container').addClass('active')
            $('.gift-text').text(`+${price}`)
            $('.gift-text').addClass('active')
            $('.gift-backdrop').delay(10000).fadeOut(300)
            showErrorMsg(`<p class="text-center">Congratulations! You've just won ${price}!</p>`)
        }
    }


    $('#redeemGift').on('submit', function(e) {
        e.preventDefault()
        var code = $('#redemptionCode').val()
        var csrftoken = $("input[name='csrfmiddlewaretoken']").val()


        if (code.length < 1  || code === null) {
            console.log('code is empty')
            showErrorMsg('<p>Input the gift code</p>')
            return
        }

        $('#submitBtn').css('pointer-events', 'none')
        $('#loader').css('padding', '50px')
        $('#loader').html(`
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div)
            >
        `)
        $('#loader').fadeIn(300)


        $.ajax({
            url: "/redeem-gift-codde/",
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                'code': code
            }),
            headers: {
                'contentType': 'application/json',
                'X-CSRFToken': csrftoken
            },
            success: function(response) {
                console.log(response) 
                $('#loader').fadeOut(400)
                $('.gift-backdrop').css('display', 'flex').hide();
                $('.gift-backdrop').fadeIn(300)
                $('.gift-container').on('click', function() {
                    openGift(`$${response.bonus}`)
                })
            },
            error: function(response) {
                if (response.responseJSON) {
                    showErrorMsg(`<p class="text-center">${response.responseJSON.message}</p>`)
                } else {
                    showErrorMsg('<p>system error occured</p>')
                }
                
            }
        })
    })
})