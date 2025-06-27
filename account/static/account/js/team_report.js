const $children = $('.team-report').children().clone()


function showErrorMsg(message) {
    $('#loader').css('padding', '8px 10px 8px 10px')
    $('#loader').html(message)
    $('#loader').delay(500).fadeIn(300)
    $('#loader').delay(3000).fadeOut(400)
}


function filterReferrals(result) {
    if (result.filtered_referrals.length > 0) {
        $('.team-report').html(`
            <div class="team-report">
                <div class="table-responsive">
                    <table class="table table-hover referral-table">
                        <thead>
                        <tr>
                            <th scope="col">UID</th>
                            <th scope="col">Level</th>
                            <th scope="col">Bonus</th>
                            <th scope="col">Date Joined</th>
                        </tr>
                        </thead>
                        <tbody id='referralHistory'>

                        </tbody>
                    </table>
                </div>
            </div>
        `)
        result.filtered_referrals.forEach(referral => {
            $('#referralHistory').append(`
                <tr onclick="uidInfo('${referral.uid}')">
                    <th scope="row">${referral.uid}</th>
                    <td><span class="badge ${referral.slug}"><i class="bi bi-star-fill me-1"></i>${referral.level}</span></td>
                    <td>${referral.total_bonus}</td>
                    <td>${referral.date_joined}</td>
                </tr>
            `)
        })
   } else {
    $('.team-report').html(`
            <div class="text-center empty">
                <div class="no-records">
                <img src="/static/account/img/no-records.webp" alt="">
                <p class="mt-2">no data</p>
                </div>
                <div class="space">
    
                </div>
            </div>
        `)
   }     
}


function uidInfo(uid) {
    $('#uidInfoModal').modal('show')
    $('#uidBody').html(
        `
        <div class="d-flex justify-content-center">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
        `
    )

    $.ajax({
        url: '/get-uid-info/',
        type: 'GET',
        data: {
            'uid': uid
        },
        success: function(res) {
            console.log(res)
            $('#uidInfoModalLabel').text(`UID: ${res.uid}`)

            $('#uidBody').html(`
                <div class="uid-info">
                    <div>Referrals <span>${res.total_referrals}</span></div>
                    <div>Vip deposits <span>$${res.vip_deposits}</span></div>
                    <div>Current level <span><span class="badge ${res.slug}"><i class="bi bi-star-fill me-1"></i>${res.current_level}</span></span></div>
                    <div>Total bonus <span>$${res.total_bonus}</span></div>
                    <div>Date joined  <span>${res.date_joined}</span></div>
                </div>



                <div class="bonus-history mt-4">
                    <h6 class="text-center">Bonus history</h6>

                    <div class="history mb-2 mt-4" id="bonusHistory">
                       
                    </div>
                </div>
            `)

            res.bonus_history.forEach(bonus => {
                $('#bonusHistory').append(`
                    <div class="single-history shadow-sm">
                        <p class="type">${bonus.bonus_type}</p>
                        <p class="badge">+$${bonus.referral_bonus}</p>
                        <p class="date">${bonus.date}</p>
                    </div>
                `)
            });


        
            

        },
        error: function() {
            $('#uidInfoModal').modal('hide')
            $('#loader').css('padding', '8px 10px 8px 10px')
            $('#loader').html('<p>Server error</p>')
            $('#loader').delay(500).fadeIn(300)
            $('#loader').delay(3000).fadeOut(400)
        }
    })
}


function filterByLevel(level) {
    $('#sortLevelModal').modal('hide')
    $('#selectedLevel').text(level)


    if (level === "All") {
        $('.team-report').html($children)
        return
    }
    
    $('.team-report').html(`<div class="d-flex justify-content-center">
        <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>`)

    $.ajax({
        url: '/filter-by-level/',
        type: 'GET',
        data: {
            'level': level
        },
        success: function(res) {
            filterReferrals(res)           
             
        },
        error: function(err) {
            $('.team-report').html($children)
            showErrorMsg('<p>Server error</p>')
        }

    })
}


function filterByDate() {
    var day = $('#selectedDay').text()
    var month = $('#selectedMonth').text()
    var year = $('#selectedYear').text()

    var date = year + '-' + month + '-' + day
    $('#selectedDate').text(date)

    $('.team-report').html(`<div class="d-flex justify-content-center">
        <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>`)

    $.ajax({
        url: '/filter-by-date/',
        tyoe: 'GET',
        data: {
            'date': date
        },
        success: function(res) {
            filterReferrals(res)
        },
        error: function() {
            $('.team-report').html($children)
            showErrorMsg('<p>Server error</p>')
        }
    })
}


$(document).ready(function() {

    $('#searchBtn').on('click', function() {
        console.log('search clicked')
        let query = $('#searchInput').val()

        if (query === "" || query === null) {
            showErrorMsg('<p>Input the UID</p>')
            $('.team-report').html($children)
            return
        }
        
        $(this).css('pointer-events', 'none')
        $('.team-report').html(`<div class="d-flex justify-content-center">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>`)
        $.ajax({
            url: '/get-uid/',
            type: 'GET',
            data: {
                'query': query
            },
            success: function(res) {
                $('.team-report').html(`
                    <div class="table-responsive">
                        <table class="table table-hover referral-table">
                            <thead>
                            <tr>
                                <th scope="col">UID</th>
                                <th scope="col">Level</th>
                                <th scope="col">Bonus</th>
                                <th scope="col">Date Joined</th>
                            </tr>
                            </thead>
                            <tbody>
                                <tr onclick="uidInfo('${res.uid}')">
                                <th scope="row">${res.uid}</th>
                                <td><span class="badge ${res.slug}"><i class="bi bi-star-fill me-1"></i>${res.level}</span></td>
                                <td>$${res.bonus}</td>
                                <td>${res.date_joined}</td>
                                </tr>                     
                            </tbody>
                        </table>
                    </div>
                `)
                $('#searchBtn').css('pointer-events', '')
            },
            error: function(err) {
                if (err.status == 404) {
                    $('.team-report').html(
                        `
                        <div class="text-center empty">
                            <div class="no-records">
                            <img src="/static/account/img/no-records.webp" alt="">
                            <p class="mt-2">no data</p>
                            </div>
                            <div class="space">
                
                            </div>
                        </div>
                        `
                    )
                } else {
                    showErrorMsg('<p>Server error</p>')
                }
                $('#searchBtn').css('pointer-events', '')
            }
        })

    })


    $('#filterByLevel').on('click', function() {
        $('#sortLevelModal').modal('show')
    })

    $('#filterByDate').on('click', function() {
        $('#sortDateModal').modal('show')
    })
})