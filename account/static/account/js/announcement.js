function showBroadcastMessage(id) {
    console.log(id, 'has been clicked')



    $('#clickedMessageModal').modal('show')


    $('#broadcastMessage').html(`
    <div class="text-center">
        <div class="spinner-border text-secondary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>
    `)


    $.ajax({
        type: 'GET',
        url: '/get-broadcast-message/',
        data: {
            id: id
        },
        success: function(response) {
            $('#broadcastMessage').html(`
                ${response.message}
                `)
            $('#clickedMessageModalLabel').text(response.subject)

            if (response.read == true) {
                $('#clickedMessageFooter').html(
                    `<button type="button" class="btn btn-secondary"  data-bs-dismiss="modal">Close</button>`
                )
            } else {
                $('#clickedMessageFooter').html(
                    `<button type="button" class="btn btn-primary" data-id="${response.id}" id="markMessage" onclick="markAsRead(${response.id})" data-bs-dismiss="modal">Mark as read</button>`
                )
            }
        },
        error: function(response) {

        }
    })
}



function markAsRead(id) {
    console.log(id, 'has been marked as read')
    $.ajax({
        url: '/mark-as-read/',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            'id': id
        }), 
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')  
        },
        success: function(response) {
            $('.messages').empty(); // Clear the messages container once at the beginning
            response.forEach(notification => {
                // Build the HTML string with conditional logic in JavaScript
                let messageHtml = `
                    <div class="message mb-3" onclick="showBroadcastMessage('${notification.id}')">
                        <div class="top">`

                            if (notification.read) {
                                messageHtml += `<div class="icon">
                                <i class="bi bi-megaphone-fill read"></i>
                            </div>`
                            } else {
                                messageHtml += `<div class="icon">
                                <i class="bi bi-megaphone-fill"></i>
                            </div>`
                            }
                            
                           messageHtml +=  `<h5 class="subject">${notification.subject}</h5>
                        </div>
                        <div class="text mt-2">
                            <p class="mb-0">${notification.message.length > 100 ? notification.message.substring(0, 101) + '...' : notification.message}</p>
                        </div> 
                        <div class="bottom mt-3">
                            <div><small>${notification.broadcast_on}</small></div>
                `;
                           
                
                // Add the "seen" section only if the notification is marked as read
                if (notification.read) {
                    messageHtml += `
                        <div class="seen"><i class="bi bi-check2-all me-1"></i> <small>seen</small></div>
                    `;
                }
        
                messageHtml += `
                        </div>
                    </div>
                `;
        
                // Append the constructed HTML to the messages container
                $('.messages').append(messageHtml);
            })},
        error: function(response) {

        }
    })
}