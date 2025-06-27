function selectOrder(order_id) {
    $('#orderNumber').val(order_id)
    $('#orderModal').modal('hide')
}





$(document).ready(function() {
    function showrMsg(message) {
        $('#loader').css('padding', '8px 10px 8px 10px')
        $('#loader').html(message)
        $('#loader').delay(500).fadeIn(300)
        $('#loader').delay(3000).fadeOut(400)
    }


    $('#depositIssue').submit(function(e) {
        e.preventDefault()
        
        var transaction_id = $('#orderNumber').val()
        var trn = $('#trn').val()
        var recipient_account = $('#recipientAccount').val()
        var message = $('#message').val()
        var proof = $('#proof').val()
        console.log(transaction_id.length )
        if (transaction_id.length < 1) {
            showrMsg('<p>Please select the order number</p>')
            return
        }

        if (trn.length < 1) {
            showrMsg('<p>Please enter the trn</p>')
            return
        }

        if (recipient_account.length < 1) {
            showrMsg(`<p>Please enter the recipient's account</p>`)
            return
        }

        if ($('#proof')[0].files.length < 1) {
            showrMsg('<p>Please upload the payment receipt</p>')
            return
        }

        var formData = new FormData($('#depositIssue')[0]);
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
            url: '/wallet/deposit-issue/submit/',
            type: 'POST',
            data: formData,
            processData:false,
            contentType: false,
            success: function (response) { 
                $('#depositIssue')[0].reset()
                showrMsg(`<p>Sent successfully</p>`)
                $('.submit-btn').css('pointer-events', '')
             },
             error: function(error) {
                $('.submit-btn').css('pointer-events', '')
                if (error.status == 404) {
                    showrMsg(`<p>${error.responseJSON.message}</p>`)
                    return
                }
                showrMsg(`<p>Server error</p>`)
             }

        })

    })
})