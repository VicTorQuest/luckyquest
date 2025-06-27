$(document).ready(function() {
    var currentDate = new Date();
    var currentYear = currentDate.getFullYear();
    var currentMonth = currentDate.getMonth() + 1; // Current month (1-12)
    var currentDay = currentDate.getDate();

    var startYear = 2024;

    // Populate years
    for (var year = startYear; year <= currentYear; year++) {
        $('#year').append('<li data-value="' + year + '">' + year + '</li>');
    }

    // Populate months based on the selected year
    function populateMonths(year) {
        $('#month').empty();
        var maxMonth = year === currentYear ? currentMonth : 12;
        for (var month = 1; month <= maxMonth; month++) {
            var monthValue = month < 10 ? '0' + month : month;
            $('#month').append('<li data-value="' + monthValue + '">' + monthValue + '</li>');
        }
    }

    // Populate days
    function populateDays(year, month) {
        var daysInMonth = new Date(year, month, 0).getDate();
        $('#day').empty();
        for (var day = 1; day <= daysInMonth; day++) {
            var dayValue = day < 10 ? '0' + day : day;
            $('#day').append('<li data-value="' + dayValue + '">' + dayValue + '</li>');
        }
    }

    // Initial population based on current date
    populateMonths(currentYear);
    populateDays(currentYear, currentMonth);
    selectValue('#year', currentYear);
    selectValue('#month', currentMonth < 10 ? '0' + currentMonth : currentMonth);
    selectValue('#day', currentDay < 10 ? '0' + currentDay : currentDay);

    // Update months and days when the year is changed
    $('#year').on('click', 'li', function() {
        var selectedYear = $(this).data('value');
        populateMonths(selectedYear);

        var selectedMonth = $('#month li.selected').data('value') || '01';
        if (selectedYear === currentYear) {
            selectedMonth = Math.min(selectedMonth, currentMonth < 10 ? '0' + currentMonth : currentMonth);
        }
        populateDays(selectedYear, selectedMonth);

        selectValue('#month', selectedMonth);
        selectValue('#day', '01');
    });

    // Dropdown interaction
    $('.dropdown-label').on('click', function() {
        $(this).siblings('.dropdown-list').toggle();
    });

    $('.dropdown-list').on('click', 'li', function() {
        var $dropdown = $(this).closest('.dropdown');
        $dropdown.find('.dropdown-label').text($(this).text());
        $dropdown.find('li').removeClass('selected');
        $(this).addClass('selected');
        $(this).parent().hide();

        var selectedYear = $('#year li.selected').data('value');
        var selectedMonth = $('#month li.selected').data('value');
        if ($(this).parent().attr('id') === 'month' || $(this).parent().attr('id') === 'year') {
            populateDays(selectedYear, selectedMonth);
            selectValue('#day', '01');
        }
    });

    // Utility function to set the initial selected value
    function selectValue(selector, value) {
        $(selector + ' li[data-value="' + value + '"]').addClass('selected');
        $(selector).siblings('.dropdown-label').text(value);
    }
});
