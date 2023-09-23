document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM is fully loaded. Starting the script.");

  const addEventButton = document.getElementById('addEventButton');
  const deleteEventButton = document.getElementById('deleteEventButton');
  const eventForm = document.getElementById('eventForm');
  const eventModal = document.getElementById('eventModal');
  let currentEditingEventId = null;

  const inviteModal = document.getElementById('inviteModal');

  loadGuestNames();
  loadInvites();
  loadEvents();

  async function loadInvites() {
    console.log("Attempting to load invites.");
    try {
      const response = await fetch('https://8zx75wxov5.execute-api.us-east-1.amazonaws.com/prod/invitation', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      closeInviteModal();

      if (!response.ok) {
        console.error("API call failed with status", response.status);
        return;
      }

      const result = await response.json();
      let parsedBody = result.body;
      if (typeof result.body === 'string') {
        parsedBody = JSON.parse(result.body);
      }

      if (parsedBody.success && Array.isArray(parsedBody.data)) {

        const sortedInvites = parsedBody.data.sort((a, b) => a.event_name.localeCompare(b.event_name));

        const inviteTableBody = document.getElementById('inviteTable').getElementsByTagName('tbody')[0];
        inviteTableBody.innerHTML = '';

        sortedInvites.forEach((invite) => {
          const newRow = inviteTableBody.insertRow();

          const cell1 = newRow.insertCell(0);
          const cell2 = newRow.insertCell(1);
          const cell3 = newRow.insertCell(2);
          const cell4 = newRow.insertCell(3);

          cell1.innerText = invite.guest_name;
          cell2.innerText = invite.event_name;

          // Create hyperlink for Invite ID
          const inviteIdLink = document.createElement('a');
          inviteIdLink.href = `https://oyehoy.net/invite/?${invite.invite_id}`;
          inviteIdLink.innerText = invite.invite_id;
          cell3.appendChild(inviteIdLink);

          cell4.innerText = invite.status;

          // Apply background color based on status
          switch (invite.status) {
            case 'unopened':
              cell4.style.backgroundColor = 'lightgray';
              break;
            case 'opened':
              cell4.style.backgroundColor = 'white';
              break;
            case 'accepted':
              cell4.style.backgroundColor = 'green';
              break;
            case 'declined':
              cell4.style.backgroundColor = 'red';
              break;
            default:
              break;
          }
        });
      } else {
        console.error("Parsed body is missing or its 'data' field is not an array.");
      }
    } catch (error) {
      console.error('Failed to load invites:', error);
    }
  }

  async function loadGuestNames() {
    console.log("Attempting to load guest names.");

    try {
      const response = await fetch('https://2q2ur5efk0.execute-api.us-east-1.amazonaws.com/prod/guest', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      const parsedBody = JSON.parse(result.body);
      console.log("Received names:", parsedBody);  // Log the names as received

      if (parsedBody && Array.isArray(parsedBody)) {
        const sortedGuestNames = parsedBody.sort((a, b) => a.localeCompare(b));
        console.log("Sorted names:", sortedGuestNames);  // Log the sorted names

        const guestNameDropdown = document.getElementById('guestNameDropdown');

        // Clear existing options
        guestNameDropdown.innerHTML = '';

        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.text = '-- Select a Guest --';
        defaultOption.value = '';
        guestNameDropdown.add(defaultOption);

        // Adding guest names to dropdown
        sortedGuestNames.forEach((guest) => {
          const optionElement = document.createElement('option');
          optionElement.text = guest;
          optionElement.value = guest;  // Using the name itself as the value
          guestNameDropdown.add(optionElement);
        });
      }
    } catch (error) {
      console.error('Failed to load guest names:', error);
    }
  }

  async function loadEvents() {
    console.log("Attempting to load events.");
    try {
      const response = await fetch('https://u462dh5p03.execute-api.us-east-1.amazonaws.com/prod/event', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      const parsedBody = JSON.parse(result.body);

      const eventDropdown = document.getElementById('eventNameDropdown');
      eventDropdown.innerHTML = '';

      const defaultOption = document.createElement('option');
      defaultOption.text = '-- Select an Event --';
      defaultOption.value = '';
      eventDropdown.add(defaultOption);

      if (parsedBody && parsedBody.events) {
        const eventTableBody = document.getElementById('eventTable').getElementsByTagName('tbody')[0];
        eventTableBody.innerHTML = '';

        parsedBody.events.forEach((event) => {
          const newRow = eventTableBody.insertRow();
          newRow.innerHTML = `
            <td>${event.eventName}</td>
            <td>${new Date(event.eventStartTime).toLocaleString()}</td>
            <td>${new Date(event.eventEndTime).toLocaleString()}</td>
            <td>${event.eventLocation}</td>
          `;

          // Add click event listener to the row
          newRow.addEventListener('click', () => editEvent(event));

          // Populate dropdown
          const optionElement = document.createElement('option');
          optionElement.text = event.eventName;
          optionElement.value = event.event_id;
          eventDropdown.add(optionElement);
        });
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  }

  function editEvent(eventData) {
    console.log("Opening the modal for editing.");
    currentEditingEventId = eventData.event_id;
    console.log("Editing Event ID:", currentEditingEventId);
    document.getElementById('eventName').value = eventData.eventName;
    document.getElementById('eventStartTime').value = eventData.eventStartTime;
    document.getElementById('eventEndTime').value = eventData.eventEndTime;
    document.getElementById('eventLocation').value = eventData.eventLocation;

    deleteEventButton.style.display = 'block';
    eventModal.style.display = 'block';
  }

  // Submit Event
  eventForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const eventName = document.getElementById('eventName').value;
    const eventStartTime = document.getElementById('eventStartTime').value;
    const eventEndTime = document.getElementById('eventEndTime').value;
    const eventLocation = document.getElementById('eventLocation').value;

    const eventDetails = {
      name: eventName,
      start: eventStartTime,
      end: eventEndTime,
      location: eventLocation
    };

    if (eventEndTime) {
      eventDetails.end = eventEndTime;
    }

    if (currentEditingEventId) {
      eventDetails.event_id = currentEditingEventId;
    }

    const method = currentEditingEventId ? 'PUT' : 'POST';
    const url = currentEditingEventId ?
      `https://u462dh5p03.execute-api.us-east-1.amazonaws.com/prod/event/${currentEditingEventId}` :
      'https://u462dh5p03.execute-api.us-east-1.amazonaws.com/prod/event';

    console.log("Method:", method);
    console.log("URL:", url);

    try {
      const response = await fetch(url, {
        method: method,  // Use the dynamically set method
        body: JSON.stringify(eventDetails),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const responseData = await response.json();

      if (response.status === 200 || response.status === 201) {  // 201 for created, 200 for OK
        loadEvents();
        currentEditingEventId = null;  // Clear the current editing ID
        eventModal.style.display = 'none';
      } else {
        console.error('Failed to save or update event: Unexpected status code', response.status);
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
  });

  // Delete Event
  deleteEventButton.addEventListener('click', async (e) => {  // Added event object 'e'
    e.preventDefault();  // Prevent form from submitting

    if (currentEditingEventId) {
      console.log("Deleting event with ID:", currentEditingEventId);

      try {
        const response = await fetch(`https://u462dh5p03.execute-api.us-east-1.amazonaws.com/prod/event/${currentEditingEventId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          mode: 'cors'
        });

        if (response.status === 204 || response.status === 200) {
          console.log("Event deleted successfully.");
          loadEvents();
          eventModal.style.display = 'none';
        } else if (response.ok && response.status !== 204) {
          // Handle case when response is OK but not 204
          const responseData = await response.json();
          console.log("Delete response:", responseData);
        } else {
          console.error('Failed to delete event: Unexpected status code', response.status);
        }
      } catch (error) {
        console.error('Failed to delete event:', error);
      }
    }
  });


  // Add an event listener to the inviteForm
  // Add an event listener to the inviteForm
  document.getElementById('inviteForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Fetch selected values from the dropdown
    const guestNameIndex = document.getElementById('guestNameDropdown').value;
    const eventNameIndex = document.getElementById('eventNameDropdown').value;

    console.log(`Selected Guest: ${guestNameIndex}, Selected Event: ${eventNameIndex}`); // Debug line

    // Validate if both the guest and event are selected
    if (!guestNameIndex || !eventNameIndex) {
      alert("Both guest and event must be selected.");
      return;
    }

    // Prepare the data to be sent
    const inviteData = {
      guestIndex: guestNameIndex,
      eventIndex: eventNameIndex
    };

    console.log(`Sending invite data to server: ${JSON.stringify(inviteData)}`); // Debug line

    // Make the POST request to your invite-invitation-api
    try {
      const response = await fetch('https://8zx75wxov5.execute-api.us-east-1.amazonaws.com/prod/invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(inviteData)
      });

      const responseData = await response.json();
      console.log(`Server Response: ${JSON.stringify(responseData)}`); // Debug line

      if (response.status === 200 || response.status === 201) {
        loadInvites();
      } else {
        alert('Failed to create invite. Please try again.');
      }

    } catch (error) {
      console.error('An error occurred:', error);
      alert('An error occurred. Please try again.');
    }
  });

});
