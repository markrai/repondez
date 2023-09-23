// Declare global variables so they can be accessed by both admin.js and utils.js
let eventModal, inviteModal, currentEditingEventId, deleteEventButton, addEventButton, addInviteButton, closeButtonEvent, closeButtonInvite;

document.addEventListener('DOMContentLoaded', () => {
  // Initialize the variables here so they are accessible after the DOM is loaded
  closeButtonEvent = document.querySelector('.close-button-event');
  closeButtonInvite = document.querySelector('.close-button-invite');
  addEventButton = document.getElementById('addEventButton');
  addInviteButton = document.getElementById('addInviteButton');
  eventModal = document.getElementById('eventModal');
  inviteModal = document.getElementById('inviteModal');
  deleteEventButton = document.getElementById('deleteEventButton');

  // Escape key to close invite & event modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (eventModal && eventModal.style.display === 'block') {
        closeEventsModal();
      } else if (inviteModal && inviteModal.style.display === 'block') {
        closeInviteModal();
      }
    }
  });

  // Add event button
  if (addEventButton) {
    addEventButton.addEventListener('click', () => {
      console.log("Opening the event modal.");
      currentEditingEventId = null;
      if (deleteEventButton) {
        deleteEventButton.style.display = 'none';
      }
      if (eventModal) {
        eventModal.style.display = 'block';
      }
    });
  }

  // Add invite button
  if (addInviteButton) {
    addInviteButton.addEventListener('click', () => {
      console.log("Opening the invite modal.");
      if (inviteModal) {
        inviteModal.style.display = 'block';
      }
    });
  }

  // Close events modal
  if (closeButtonEvent) {
    closeButtonEvent.addEventListener('click', closeEventsModal);
  }

  // Close invite modal
  if (closeButtonInvite) {
    closeButtonInvite.addEventListener('click', closeInviteModal);
  }
});

// Function to close the events modal
function closeEventsModal() {
  console.log("Closing the event modal.");
  if (eventModal) {
    eventModal.style.display = 'none';
  }
  resetForm();
}

// Function to close the invite modal
function closeInviteModal() {
  console.log("Closing the invite modal.");
  if (inviteModal) {
    inviteModal.style.display = 'none';
  }
}

// Function to reset the events form
function resetForm() {
  if (document.getElementById('eventName')) {
    document.getElementById('eventName').value = '';
  }
  if (document.getElementById('eventStartTime')) {
    document.getElementById('eventStartTime').value = '';
  }
  if (document.getElementById('eventEndTime')) {
    document.getElementById('eventEndTime').value = '';
  }
  if (document.getElementById('eventLocation')) {
    document.getElementById('eventLocation').value = '';
  }
  currentEditingEventId = null;
}
