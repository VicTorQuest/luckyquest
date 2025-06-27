let prizes = ["$100", "$1", "$50", "$75", "$0", "$10", "$5", "$20"]; // List of prizes in clockwise order
let value = Math.ceil(Math.random() * 3600);

$(document).ready(function () {
  if (getCookie("daily_login")) {
    $(".spin-wheel").delay(1000).queue(function(next) {
      $(this).css({
          visibility: 'visible',
          display: 'flex', 
          opacity: 0      
      }).animate({ opacity: 1 }, 500); 
      next();
  });
  }

  $(".spinBtn").on("click", function () {
    // Update rotation value for this spin
    value += 3800

    // Spin the wheel
    $(".wheel").css({
      transition: "transform 5s ease-in-out", // Smooth transition
      transform: "rotate(" + value + "deg)", // Rotate to new position
    });

    // Use one-time event listener to handle prize calculation when the spin completes
    $(".wheel").one("transitionend", function () {
      // Normalize the angle to a 0-360 degree range
      const normalizedValue = value % 360;
      const segmentAngle = 360 / prizes.length; // Each segment angle (45 degrees for 8 segments)

      // Adjust the angle to align with the arrow at the top
      const adjustedAngle = (360 - normalizedValue + segmentAngle / 2) % 360;
      const winningIndex = Math.floor(adjustedAngle / segmentAngle); // Calculate the segment index

      var prize_amount = parseInt(prizes[winningIndex].replace("$", ""));

      // Display the winning prize
      if (prize_amount > 0) {
        $("#prizeDisplay").text(`+${prizes[winningIndex]}`);
      } else {
        $("#prizeDisplay").css("background", "#842029");
        $("#prizeDisplay").text(`${prizes[winningIndex]}`);
      }

      $(".spin-wheel").find(".container").fadeOut(1500);
      $("#prizeDisplay").delay(2500).addClass("active");

      $(".spin-wheel").delay(6000).fadeOut(400);

      if (prize_amount > 0) {
        $.ajax({
          url: "/grant-spin-wheel-price/",
          type: "POST",
          contentTyoe: "application/json",
          data: JSON.stringify({
            amount: prize_amount.toString(),
          }),
          headers: {
            "X-CSRFToken": getCookie("csrftoken"),
          },
          success: function(response) {
            deleteCookie('daily_login')
          },
          error: function(error) {
            
          }
        });
      } else {
        deleteCookie('daily_login')
      }
    });
  });
});
