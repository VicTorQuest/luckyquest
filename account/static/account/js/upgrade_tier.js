$(document).ready(function() {
    function showErrorMsg(message) {
        $('#loader').css('padding', '8px 10px 8px 10px')
        $('#loader').html(message)
        $('#loader').delay(500).fadeIn(300)
        $('#loader').delay(3000).fadeOut(400)
    }
    
    $('#upgradeBtn').on('click', function() {
        $('#confirmUpgradeModal').modal('hide')
        if (upgrade_amount > balance) {
            showErrorMsg('<p>Insufficient balance</p>')
            $('#depositLink').show()
            return
        }

        $('#upgradeBtn').css('pointer-events', 'none')

        $('#loader').css('padding', '50px')
        $('#loader').html(`
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div)
            >
        `)
        $('#loader').fadeIn(400)

        $.ajax({
            url: '/upgrade-level/',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                'slug': slug,
                'upgrade_amount': upgrade_amount,
                'level': level
            }),
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'contentType': 'application/json'
            },
            success: function(response) {
                showErrorMsg('<p>upgrade successful</p>')
                window.location.href = response.url
            },
            error: function(error) {
                $('#upgradeBtn').css('pointer-events', '')
                showErrorMsg('<p>Server error</p>')
                return
            }
        })
    })
})