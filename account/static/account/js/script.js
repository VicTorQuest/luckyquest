if (document.querySelector('.news-container ul')) {

    const newswidth = document.querySelector('.news-container ul').scrollWidth
    const translateWidth = newswidth - 46
}
const newsBar = document.getElementById('newsBar')



function getRandomDomain() {
    const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'icloud.com'];
    const randomIndex = Math.floor(Math.random() * domains.length);
    return domains[randomIndex];
}


function getRandomStage() {
    const stages = ['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4','Stage 5', 'Stage 6', 'Stage 7', 'Stage 8', 'Stage 9', 'Stage 10']
    const randomIndex = Math.floor(Math.random() * stages.length);
    return stages[randomIndex]
}

function generateRandomEmail() {
    const randomString = Math.random().toString(36).substr(2, 4);
    const domain = getRandomDomain();
    return `${randomString}******@${domain}`;
}



function generateRandomAmount() {
    const stage = getRandomStage()
    let amount;
    switch (stage) {
        case 'Stage 1':
            amount = (Math.random() * (179 - 110) + 110).toFixed(2);
            break;
    
        case 'Stage 2':
            amount = (Math.random() * (379 - 190) + 190).toFixed(2);
            break
    
        case 'Stage 3':
            amount = (Math.random() * (879 - 390) + 390).toFixed(2);
            break

        case 'Stage 4':
            amount = (Math.random() * (2000 - 890) + 890).toFixed(2);
            break

        case 'Stage 5':
            amount = (Math.random() * (5000 - 2100) + 2100).toFixed(2);
            break

        case 'Stage 6':
            amount = (Math.random() * (10000 - 5100) + 5100).toFixed(2);
            break

        case 'Stage 7':
            amount = (Math.random() * (20000 - 10100) + 10100).toFixed(2);
            break

        case 'Stage 8':
            amount = (Math.random() * (50000 - 20100) + 20100).toFixed(2);
            break

        case 'Stage 9':
            amount = (Math.random() * (80000 - 50100) + 50100).toFixed(2);
            break

        case 'Stage 10':
            amount = (Math.random() * (160000 - 80100) + 80100).toFixed(2);
            break

        default:
            amount = (Math.random() * (179 - 110) + 110).toFixed(2);
            break;
    }
    const values = {"amount": `+$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'stage': stage};
    return values;
}

function createRecord() {
    const record = document.createElement('div');
    const values = generateRandomAmount()
    record.classList.add('member-list', 'shadow');

    const email = generateRandomEmail();
    const amount = values.amount;
    const stage = values.stage;

    record.innerHTML = `<p class="user-email"><span class="badge">${stage}</span>${email}</p>
    <p class="amount">${amount}</p>`;
    record.style.opacity = 0;

    return record;
}

function updateRecords() {
    if (document.getElementById('listItems')) {
        const container = document.getElementById('listItems');
        const record = createRecord();

        container.appendChild(record);

        if (container.childElementCount > 3) {
            container.removeChild(container.firstElementChild);
        }

        // Trigger reflow and set opacity to 1 to animate the transition
        container.scrollTop = container.scrollHeight;
        record.style.opacity = 1;
    }
    
}

function getCookie(name) {
    let value = `; ${document.cookie}`;
    let parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}


function deleteCookie(name) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'; 
}


$(document).ready(function() {
    if (getCookie('new_registeration')) {
        $('#announcementModal').modal('show')
        deleteCookie('new_registeration')
    }

    $('#backdrop').on('click', function(){
        $('#supportPopUp').css('bottom', '-350px')
        $('#backdrop').fadeOut(300)
    })

    $('#supportIcon').on('click', function() {
        $('#supportPopUp').css('bottom', '0')
        $('#backdrop').fadeIn(300)
    })

    $('#closeSuPopUp').on('click', function() {
        $('#supportPopUp').css('bottom', '-350px')
        $('#backdrop').fadeOut(300)
    })
})


// Call updateRecords initially to have 3 records from the start
for (let i=0;i<3;i++) {
    updateRecords();
}

setInterval(updateRecords, 3000); // Add a new record every 3 seconds


// newsBar.addEventListener('touchstart', function() {
//     alert('clicked')
// })