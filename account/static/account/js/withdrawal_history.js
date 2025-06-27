const $children = $('.withdrawal-report').children().clone()


function showErrorMsg(message) {
    $('#loader').css('padding', '8px 10px 8px 10px')
    $('#loader').html(message)
    $('#loader').delay(500).fadeIn(300)
    $('#loader').delay(3000).fadeOut(400)
}


function filterWithdrawals(response) {
    if (response.withdrawals.length > 0) {
        $('.withdrawal-report').html(`
            <div class="table-responsive">
                <table class="table table-hover withdrawal-table">
                    <thead>
                      <tr>
                        <th scope="col">Amount</th>
                        <th scope="col">Status</th>
                        <th scope="col">Transaction Date</th>
                        <th scope="col">Transaction/order ID</th>
                      </tr>
                    </thead>
                    <tbody id="withdrawalBody">
                      
                    </tbody>
                  </table>
            </div>
    
            
        `)




        response.withdrawals.forEach(withdrawal => {
            $('#withdrawalBody').append(
                `<tr>
                    <th scope="row">-$${withdrawal.amount}</th>
                    <td><span class="badge ${withdrawal.status}">${withdrawal.status}</span></td>
                    <td>${withdrawal.date}</td>
                    <td>${withdrawal.transaction_id}</td>
                </tr>`
            )
        });
    } else {
        $('.withdrawal-report').html(`
        <div class="text-center empty">
            <div class="no-records">
                <img src="/static/account/img/no-records.webp" alt="">
                <p class="mt-2 mb-0">no data</p>
            </div>
            <div class="space">
    
            </div>
        </div>
        `)
    }
}

function filterByStatus(status) {
    $('#sortStatusModal').modal('hide')

    if (status == 'All') {
        $('.withdrawal-report').html($children)
        return
    }

    $('#selectedStatus').text(status)
    
    $('.withdrawal-report').html(`
        <div class="d-flex justify-content-center">
        <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>
        `)


    $.ajax({
        url: '/filter-withdrawal-by-status/',
        type: 'GET',
        data: {
            'status': status
        },
        success: function(response) {
            filterWithdrawals(response)
        },
        error: function(error) {
            $('.withdrawal-report').html($children)
            showErrorMsg('<p>Server error</p>')
        }
    })
}

function filterByDate() {
    
    let startDate = $('#start-date').val();
    let endDate = $('#end-date').val();

    if (!startDate && !endDate) {
        showErrorMsg('<p>Please select both start and end dates.</p>')
        return
    } else if (!startDate) {
        showErrorMsg('<p>Please select a start date.</p>')
        return
    } else if (!endDate) {
        showErrorMsg('<p>Please select an end date.</p>')
        return
    } 


    $('#selectedDate').text(`${startDate}/${endDate}`)

    $('.withdrawal-report').html(`
        <div class="d-flex justify-content-center">
        <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>
        `)


    $.ajax({
        url: '/filter-withdrawal-by-date/',
        type: 'GET',
        data: {
            'start_date': startDate,
            'end_date': endDate
        },
        success: function(response) {
            filterWithdrawals(response)
        },
        error: function(error) {
            $('.withdrawal-report').html($children)
            showErrorMsg('<p>Server error</p>')
        }
    })
    
}


$(document).ready(function() {
    let today = new Date().toISOString().split('T')[0];  // Get the current date in YYYY-MM-DD format
    $('#end-date').attr('max', today);


    $('#filterByStatus').on('click', function() {
        $('#sortStatusModal').modal('show')
    })


    $('#filterByDate').on('click', function () { 
        $('#sortDateModal').modal('show')
     })
})