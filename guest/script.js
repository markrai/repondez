function showErrorPopup() {
  document.getElementById("errorPopup").style.display = "flex";
  document.querySelector(".rsvp-buttons").style.display = "none";
}

// Function to populate the dynamic fields
function populateEventDetails(guestId, title, startTime, endTime, location) {
  console.log("Populating details with: ", guestId, title, startTime, endTime, location);
  document.getElementById('guestId').innerText = guestId;
  document.getElementById('eventTitle').innerText = title;
  document.getElementById('eventStartTime').innerText = `${formatDate(startTime)}`;

  if (endTime && endTime.trim() !== '') {
    document.getElementById('eventEndTime').innerText = `${formatDate(endTime)}`;
    document.getElementById('eventEndTime').style.display = 'block'; // Show the element
  } else {
    document.getElementById('eventEndTime').innerText = ''; // Clear the text
    document.getElementById('eventEndTime').style.display = 'none'; // Hide the element
  }

  document.getElementById('eventLocation').innerText = `${location}`;

  const formattedDate = formatDate(startTime);
  document.getElementById('eventStartTime').innerText = formattedDate;

  const calendarLink = generateCalendarLink(title, startTime, endTime, location);
  console.log(document.getElementById('calendarLink'));
  document.getElementById('calendarLink').setAttribute('href', calendarLink);


  const navigateLink = `https://maps.apple.com/?q=${encodeURIComponent(location)}`;
  document.getElementById('navigateLink').setAttribute('href', navigateLink);
}

// Function to fetch event details 
async function fetchEventDetails(eventId) {
  const url = `https://u462dh5p03.execute-api.us-east-1.amazonaws.com/prod/event/${eventId}`;
  const response = await fetch(url);
  const details = await response.json();
  return details;
}

// Function to make a server request to update the RSVP status
async function setAcceptanceInDatabase(accepted, inviteId) {
  const url = `https://8zx75wxov5.execute-api.us-east-1.amazonaws.com/prod/invitation/${inviteId}`;
  const status = accepted ? "accepted" : "declined";

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invitationId: inviteId,
        status: status
      })
    });

    const data = await response.json();

    if (response.status === 200) {
      updateButtonState(accepted);
    } else {
      console.error('Failed to update the status:', data.message);
    }
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// Function to update the button state based on the server response
function updateButtonState(accepted) {
  document.getElementById('acceptButton').classList.toggle('accepted', accepted === true);
  document.getElementById('declineButton').classList.toggle('declined', accepted === false);
  updateCalendarLinkVisibility(accepted);

}

// Fetch Invite and Event Details
async function fetchInviteAndEventDetails(inviteId, initialFormat) {
  if (!inviteId) {
    showErrorPopup();
    console.error("Invalid invite link.");
    return;
  }

  try {
    const inviteResponse = await fetch(`https://8zx75wxov5.execute-api.us-east-1.amazonaws.com/prod/invitation/${inviteId}`);
    const inviteDataRaw = await inviteResponse.json();
    console.log("Raw Invite Data:", inviteDataRaw);

    if (!inviteDataRaw.body) {
      showErrorPopup();
      console.error("Invite data is undefined or incomplete.");
      return;
    }

    const inviteData = JSON.parse(inviteDataRaw.body);
    console.log("Parsed Invite Data:", inviteData);

    const eventResponse = await fetch(`https://u462dh5p03.execute-api.us-east-1.amazonaws.com/prod/event/${inviteData.event_id}`);
    const eventDataRaw = await eventResponse.json();

    if (!eventDataRaw.body) {
      showErrorPopup();
      console.error("Event data is undefined or incomplete.");
      return;
    }

    const eventData = JSON.parse(eventDataRaw.body);
    console.log("Parsed Event Data:", eventData);

    if (!eventData.eventName || !eventData.eventStartTime || !eventData.eventLocation) {
      showErrorPopup();
      console.error("Event data is incomplete.");
      return;
    }

    populateEventDetails(
      inviteData.guest_id,
      eventData.eventName,
      eventData.eventStartTime,
      eventData.eventEndTime,
      eventData.eventLocation
    );

    document.getElementById("loading").style.display = "none";
    setInitialButtonState(inviteData.status);

  } catch (error) {
    showErrorPopup();
    console.error("An error occurred:", error);
  }
}



function setInitialButtonState(status) {
  if (status === "accepted") {
    updateButtonState(true);
  } else if (status === "declined") {
    updateButtonState(false);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const url = new URL(window.location.href);
  const queryString = url.search.substring(1);
  let inviteId = null;
  let initialFormat = 'slash';  // By default, assume slash format

  if (queryString !== '') {
    initialFormat = 'question';
    const parts = queryString.split('&');
    for (const part of parts) {
      if (part !== '') {
        inviteId = part;
        break;
      }
    }
  }

  // Fetch invite and event details if inviteId exists
  fetchInviteAndEventDetails(inviteId, initialFormat)
    .catch((error) => {
      console.error("Failed to fetch invite and event details:", error);
    });

  document.getElementById('acceptButton').addEventListener('click', (event) => {
    event.preventDefault();
    setAcceptanceInDatabase(true, inviteId);
  });

  document.getElementById('declineButton').addEventListener('click', (event) => {
    event.preventDefault();
    setAcceptanceInDatabase(false, inviteId);
  });

  console.log("Script loaded");
});


function formatDate(dateString) {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const date = new Date(dateString);

  let hours = date.getHours();
  let minutes = date.getMinutes();
  let ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0' + minutes : minutes;

  const strTime = hours + ':' + minutes + ' ' + ampm;

  return `${date.toLocaleDateString("en-US", options)} @ ${strTime}`;
}

// Generate iCalendar Link
function generateCalendarLink(title, startTime, endTime, location) {
  try {
    console.log("Generating calendar link with Start Time:", startTime, "End Time:", endTime);

    if (!startTime || isNaN(Date.parse(startTime))) {
      console.error("Invalid start time:", startTime);
      return '';
    }

    let start = new Date(startTime).toISOString().replace(/-|:|\.\d\d\d/g, "");
    let end;

    if (endTime && !isNaN(Date.parse(endTime))) {
      end = new Date(endTime).toISOString().replace(/-|:|\.\d\d\d/g, "");
    } else {
      // Use start time as end time if end time is not provided or invalid
      end = start;
    }

    const details = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${start}
DTEND:${end}
SUMMARY:${encodeURIComponent(title)}
LOCATION:${encodeURIComponent(location)}
END:VEVENT
END:VCALENDAR`;

    return `data:text/calendar;charset=utf8,${details}`;
  } catch (error) {
    console.error("An error occurred in generateCalendarLink:", error);
    return '';
  }
}


function updateCalendarLinkVisibility(accepted) {
  const calendarLinkElement = document.getElementById('calendarLink');
  const navigateLinkElement = document.getElementById('navigateLink');
  const whatsappLinkElement = document.getElementById('whatsappLink');

  // If accepted, show calendar and navigation links, hide WhatsApp link
  if (accepted === true) {
    calendarLinkElement.style.display = 'block';
    navigateLinkElement.style.display = 'block';
    whatsappLinkElement.style.display = 'none';
  } 
  // If declined, hide calendar and navigation links, show WhatsApp link
  else {
    calendarLinkElement.style.display = 'none';
    navigateLinkElement.style.display = 'none';
    whatsappLinkElement.style.display = 'block';
  }
}