$(document).ready(function() {
    function showrMsg(message) {
        $('#loader').css('padding', '8px 10px 8px 10px')
        $('#loader').html(message)
        $('#loader').delay(500).fadeIn(300)
        $('#loader').delay(3000).fadeOut(400)
    }


    $('#feedbackForm').submit(function(e) {
        e.preventDefault()

        feedback = $('#feedback').val()

        if (feedback.length < 1) {
            showrMsg('<p>Please enter your feedback</p>')
            return
        }


        $('#submitfeedback').css('pointer-events', 'none')


        $('#loader').css('padding', '50px')
        $('#loader').html(`
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div)
            >
        `)
        $('#loader').fadeIn(400)

        $.ajax({
            url: '/send-feedback/',
            type: 'GET',
            data: {
                'feedback': feedback
            },
            success: function() {
                $('#feedbackForm')[0].reset()
                showrMsg('<p>Message sent successfully</p>')
                $('#submitfeedback').css('pointer-events', '')
                return
            },
            error: function() {
                showrMsg('<p>Server error</p>')
                $('#submitfeedback').css('pointer-events', '')
            }

        })
    })
})