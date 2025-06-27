const $children = $('.transaction-report').children().clone()

function showErrorMsg(message) {
    $('#loader').css('padding', '8px 10px 8px 10px')
    $('#loader').html(message)
    $('#loader').delay(500).fadeIn(300)
    $('#loader').delay(3000).fadeOut(400)
}


function filterTransactions(response) {
    if (response.transactions.length > 0) {
        $('.transaction-report').html(`
            <div class="table-responsive">
                <table class="table table-hover transaction-table">
                    <thead>
                      <tr>
                        <th scope="col">Transaction type</th>
                        <th scope="col">Amount</th>
                        <th scope="col">Status</th>
                        <th scope="col">Transaction Date</th>
                        <th scope="col">Transaction/order ID</th>
                      </tr>
                    </thead>
                    <tbody id="transactionBody">
                      
                    </tbody>
                  </table>
            </div>
    
            
        `)




        response.transactions.forEach(transaction => {
            $('#transactionBody').append(
                `<tr>
                    <td>${transaction.transaction_type}</td>
                    <th scope="row">${transaction.symbol}$${transaction.amount}</th>
                    <td><span class="badge ${transaction.status}">${transaction.status}</span></td>
                    <td>${transaction.date}</td>
                    <td>${transaction.transaction_id}</td>
                </tr>`
            )
        });
    } else {
        $('.transaction-report').html(`
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
        $('.transaction-report').html($children)
        return
    }

    $('#selectedStatus').text(status)
    
    $('.transaction-report').html(`
        <div class="d-flex justify-content-center">
        <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>
        `)


    $.ajax({
        url: '/filter-transaction-by-status/',
        type: 'GET',
        data: {
            'status': status
        },
        success: function(response) {
            filterTransactions(response)
        },
        error: function(error) {
            $('.transaction-report').html($children)
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

    $('.transaction-report').html(`
        <div class="d-flex justify-content-center">
        <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>
        `)


    $.ajax({
        url: '/filter-transaction-by-date/',
        type: 'GET',
        data: {
            'start_date': startDate,
            'end_date': endDate
        },
        success: function(response) {
            filterTransactions(response)
        },
        error: function(error) {
            $('.transaction-report').html($children)
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