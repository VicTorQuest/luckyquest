function Copied() {
    $('#loader').css('padding', '15px')
    $('#loader').html(`<div class='text-center'><i class="bi bi-check-circle"></i> <p>Copied</p></div>`)
    $('#loader').delay(100).fadeIn(300)
    $('#backdrop').delay(100).fadeIn(300)
    $('#loader').delay(2000).fadeOut(400)
    $('#backdrop').delay(2000).fadeOut(400)
}

function copyaddress() {
    var address = $('#walletAddress').val()
    navigator.clipboard.writeText(address)
    Copied()
}


function copyamount() {
    var amount = $('#amountDue').val()
    navigator.clipboard.writeText(amount)
    Copied()
}



$(document).ready(function() {
  console.log(transaction_id)
    var timeLeft = localStorage.getItem(transaction_id) || 900; // Retrieve remaining time from localStorage or set default to 15 minutes (900 seconds)
    var progressBar = document.getElementById('progressBar');
    var timerDisplay = document.getElementById('timer');

    function showrMsg(message) {
        $('#loader').css('padding', '8px 10px 8px 10px')
        $('#loader').html(message)
        $('#loader').delay(500).fadeIn(300)
        $('#loader').delay(3000).fadeOut(400)
    }
  
    // Function to update timer display
    function updateTimerDisplay() {
      var minutes = Math.floor(timeLeft / 60);
      var seconds = timeLeft % 60;
      var display = minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
      timerDisplay.textContent = display;
  
      // Calculate percentage of time remaining and update progress bar
      var percentage = (timeLeft / 900) * 100; // Calculate percentage
      progressBar.value = percentage;
    }
  
    // Function to start countdown
    function startCountdown() {
      var countdown = setInterval(function() {
        timeLeft--;
  
        if (timeLeft <= 0) {
          clearInterval(countdown);
          timerDisplay.textContent = '00:00';
          progressBar.value = 0;
  
          // Page displays invoice expired info
          $('.main-invoice').empty()
          $('.main-invoice').html(`
              <div class="py-3 awaiting bg-danger">
                  <div>
                      <span class="ms-1">Invoice Expired</span>
                  </div>
              
                  <div class="text-end">
                      0.00
                  </div>                      
              </div>
             
          
              <p class="p-3">Payment window for this invoice has closed. Your invoice has expired due to non-payment, please reinitiate the payment process.</p>
      
                  <div class="py-4 px-3 d-grid gap-2">
                      <a  href="${returnUrl}" class="btn mt-2 text-white return-btn">${callToAction}</a>
                  </div>

                                          
              </div>

          </div>
      </div>
          `)
  
          // Send Ajax request to update invoice status to failed
          console.log(getCookie('csrftoken')  )
          $.ajax({
            url: '/wallet/deposit/update-invoice/', // Replace with your Django endpoint
            method: 'POST',
            data: { 'transaction_id': transaction_id, "csrfmiddlewaretoken": getCookie('csrftoken')},
            success: function(response) {
              console.log('Invoice status updated to failed:', response);
              // Further actions on success
            },
            error: function(xhr, status, error) {
              console.error('Failed to update invoice status:', error);
              // Handle error
            }
          });
        } else {
          updateTimerDisplay();
          // Save the remaining time in localStorage
          localStorage.setItem(transaction_id, timeLeft);
        }
      }, 1000); // Update every second
    }
  
    updateTimerDisplay(); // Initial display of timer
    startCountdown(); // Start the countdown


    $('#paymentform').submit(function(e) {
        e.preventDefault()


        if ($('#paymentProof')[0].files.length < 1) {
            showrMsg('<p>Please upload the payment receipt</p>')
            return
        }

        var formData = new FormData($('#paymentform')[0]);
        $('#submitbtn').css('pointer-events', 'none')

        $('#loader').css('padding', '50px')
        $('#loader').html(`
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div)
            >
        `)

        $('#loader').fadeIn(400)

        $.ajax({
            url: "/wallet/deposit/submit-payment-proof/",
            type: 'POST',
            data: formData,
            headers: {
                'X-CSRFToken': csrf[0].value
            },
            processData:false,
            contentType: false,
            success: function (response) { 
                window.location.href = response.url

                showrMsg(`<p>Processing payment</p>`)
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
  });
  