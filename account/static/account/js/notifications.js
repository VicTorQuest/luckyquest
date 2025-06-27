function setMessageId(id) {
    console.log(id)
    $('#deleteNotice').data('id', id)
    console.log('id had been set')
}
$(document).ready(function() {
    
    
    if (unreadMessagesIds.length > 0) {
        $.ajax({
            url: '/read-notifications/',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                'unreadMessagesIds': unreadMessagesIds
            }),
            headers: {
                'contentType': 'application/json',
                'x-CSRFToken': getCookie('csrftoken')
            }
        })
    }


    $('#deleteNotice').on('click', function() {

        $('#confirmDeleteModal').modal('hide')
        $('.messages').empty()
        $('.messages').html(`
            <div class="text-center">
                <div class="spinner-border text-secondary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `)


        console.log('clicked')
        var id = $(this).data('id')

        console.log(getCookie('csrftoken') )

        $.ajax({
            url: '/delete-notification/',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                'id': id,
            }),
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')  
            },
            success: function(response) {
                $('.messages').empty()
                response.forEach(notification => {
                    var updatedTemp = `
                        <div class="message mb-3">
                            <div class="top">
                                <div class="notice-header">
                                <div class="icon">`
                                if (notification.read) {
                                    updatedTemp += `<i class="bi bi-envelope-fill read"></i>`
                                } else {
                                    updatedTemp += `<i class="bi bi-envelope-fill read"></i>`
                                }
                                    
                                updatedTemp += `</div>
                                    <h5 class="subject">${notification.notification_type}</h5> 
                                </div>
                                

                                <div class="del-notice" data-bs-toggle="modal" data-bs-target="#confirmDeleteModal" onclick="setMessageId('${notification.id}')">
                                    <i class="bi bi-trash3"></i>
                                </div>
                            </div>
                            <div><small>${notification.notified_on}</small></div>

                            <p class="mb-0 text">${notification.message}</p>
                            

                        </div>
                    `

                    $('.messages').append(updatedTemp)
                });
            },
            error: function(response) {

            }
        })
    })



})