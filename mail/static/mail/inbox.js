document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector('#compose-form').onsubmit = send_mail;

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  if (mailbox === 'archive' || mailbox === 'inbox' || mailbox === 'sent') {
    fetch_mails(mailbox);
  }
}

function fetch_mails(mailbox) {
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(mails => {
    mails.forEach(mail => {
      mailtag = document.createElement('div');
      newDiv = document.createElement('div');
      mailtag.classList.add('mail');

      if (mailbox === 'sent') {
        newDiv.innerHTML = `<div style="text-align:left">To: ${mail.recipients}</div> <div style="font-weight:bold; font-size:large">${mail.subject}</div>
      <div style="text-align:right;">${mail.timestamp}</div>`;
      }
      else {
        newDiv.innerHTML = `<div style="text-align:left">${mail.sender}</div> <div style="font-weight:bold; font-size:large">${mail.subject}</div>
      <div style="text-align:right;">${mail.timestamp}</div>`;
      }
      newDiv.addEventListener('click', () => {
        view_mail(mail.id);
      });

      if (mail.read === true) {
        mailtag.style.background = 'gray';
      }

      mailtag.append(newDiv);

      if (mailbox === 'inbox' || mailbox === 'archive') {
        let archiveForm = document.createElement('form');
        let archiveButton = createArchiveButton(mail);
        archiveForm.append(archiveButton);
        let mailid = document.createElement('input');
        mailid.name = 'mailid';
        mailid.type = 'hidden';
        mailid.value = `${mail.id}`;
        archiveForm.append(mailid);
        archiveForm.onsubmit = archive_mail;
        mailtag.append(archiveForm);
      }
      document.querySelector('#emails-view').append(mailtag);
    });
  });
}

function message(status, text) {
  let response = document.createElement('div');
  response.id = 'response-text';
  console.log(text);
  if (status === 201) {
    response.innerHTML = text.message;
  }
  else {
    response.innerHTML = text.error;
  }
  document.querySelector('#emails-view').prepend(response);

  setTimeout(() => {
    document.querySelector('#response-text').remove();
  }
  , 7500);
}

function send_mail(){
  let status = 0;
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value,
    })
  })
  .then(response => {
    status = response.status;
    return response.json();
  })
  .then(result => {
    message(status, result);
  })
  setTimeout(500);
  load_mailbox('sent');
  return false;
}

function view_mail(id) {
  document.querySelector('#emails-view').innerHTML = '';
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(mail => {
    console.log(mail);
    let archiveForm = document.createElement('form');
    let archiveButton = createArchiveButton(mail);
    archiveForm.append(archiveButton);
    let mailid = document.createElement('input');
    mailid.name = 'mailid';
    mailid.type = 'hidden';
    mailid.value = `${mail.id}`;
    archiveForm.append(mailid);
    archiveForm.onsubmit = archive_mail;

    let replyButton = createReplyButton(mail);
    let buttons = document.createElement('div');
    let newDiv = document.createElement('div');
    let details = document.createElement('div');
    let body = document.createElement('div');
    let upperBody = document.createElement('div');
    buttons.classList.add('view-page-buttons');
    buttons.append(replyButton, archiveForm);
    upperBody.append(buttons);

    details.innerHTML = `<p>Sender: ${mail.sender}</p>
                        <p>Recipient: ${mail.recipients}</p>
                        <p>Subject: ${mail.subject}</p>
                        <p>Time: ${mail.timestamp}</p>`;
    upperBody.append(details);

    body.innerHTML = `<p><b>Body:</b></p>${mail.body}`;

    newDiv.append(upperBody, body);
    newDiv.classList.add('viewMail');
    document.querySelector('#emails-view').append(newDiv);
  });

  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read:true
    })
  });
}

function archive_mail() {
  if (this.archiveButton.value === 'Archive') {
    fetch(`/emails/${this.mailid.value}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: true
      })
    });
    setTimeout(500);
    load_mailbox('inbox');
  }
  else {
    fetch(`/emails/${this.mailid.value}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: false
      })
    });
    setTimeout(500);
    load_mailbox('archive');
  }
  return false;
}

function createArchiveButton(mail) {
  let archiveButton = document.createElement('input');
  archiveButton.type = 'submit';
  if (mail.archived === true) {
    archiveButton.value = 'Unarchive';
  }
  else {
    archiveButton.value = 'Archive';
  }
  archiveButton.classList.add('btn', 'btn-sm', 'btn-primary');
  archiveButton.name = 'archiveButton';
  return archiveButton;
}

function createReplyButton(mail) {
  let replyForm = document.createElement('form');
  let submitButton = document.createElement('input');
  submitButton.type = 'submit';
  submitButton.value = 'Reply';
  submitButton.classList.add('btn', 'btn-sm', 'btn-primary');
  replyForm.append(submitButton);
  replyForm.onsubmit = () => {
    console.log('Replying to: ', mail);
    compose_email();
    document.querySelector('#compose-recipients').value = mail.sender;
    if (mail.subject.slice(0,4) === 'Re: ') {
      document.querySelector('#compose-subject').value = mail.subject;
    }
    else {
      document.querySelector('#compose-subject').value = `Re: ${mail.subject}`;
    }
    document.querySelector('#compose-body').value = `\nOn ${mail.timestamp} ${mail.sender} wrote:\n${mail.body}`;
    return false;
  }
  return replyForm;
}