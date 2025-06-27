$(document).ready(function() {
  function changeStats(package, reward, safe, rate) { 
    $('#packageUpgrade').html(`
      <span class="mini-icons me-2"><i class="bi bi-wallet2"></i></span> ${package}
      `)

    $('#rewardMonthly').html(`
      <span class="mini-icons me-2"><i class="bi bi-wallet2"></i></span>${reward}
    `)

    $('#safe').html(`
      <span class="max-icons me-2"><i class="bi bi-safe-fill"></i></span>${safe}%
    `)

    $('#rateRecharge').html(`
      <span class="max-icons me-2"><i class="bi bi-cash"></i></span>${rate}%
    `)
   }
  
  var owl = $('.owl-carousel');

  // Event listener for when the slide changes
  owl.on('changed.owl.carousel', function(event) {
    // Get the current index of the slide (this will start from 0)
    var currentIndex = event.item.index - event.relatedTarget._clones.length / 2;
    var slideNumber = currentIndex >= 0 ? currentIndex + 1 : currentIndex + 11; // To handle the circular effect in loop


    if (slideNumber == 1) {
        changeStats(60, 2.5, 0.2, 0.6)
    }

    if (slideNumber == 2) {
        changeStats(180, 13, 0.25, 0.6)
    }

    if (slideNumber == 3) {
        changeStats(690, 38, 0.25, 0.6)
    }

    if (slideNumber == 4) {
      changeStats(1690, 108, 0.25, 0.65)
    }

    if (slideNumber == 5) {
      changeStats(6900, 268, 0.3, 0.65)
    }

    if (slideNumber == 6) {
      changeStats(16900, 700, 0.3, 0.65)
    }

    if (slideNumber == 7) {
        changeStats(69000, 1500, 0.325, 0.7)
    }

    if (slideNumber == 8) {
        changeStats(169000, 3000, 0.35, 0.7)
    }

    if (slideNumber == 9) {
      changeStats(690000, 8000, 0.35, 0.7)
    }

    if (slideNumber == 10) {
      changeStats(1690000, 14000, 0.4, 0.8)
    }
  });
 
  $('.vip1').on('click', function() {
    console.log('hello')
  })

})