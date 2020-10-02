const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

/***
 * Run this with command node . and copy the code from the URL and paste it in the terminal.
 */

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly','https://www.googleapis.com/auth/gmail.send'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Gmail API.
  authorize(JSON.parse(content), listLabels);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const  redirect_uris = credentials.installed.redirect_uris;
  const client_id = credentials.installed.client_id;
  const client_secret = credentials.installed.client_secret;

  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listLabels(auth) {
  const gmail = google.gmail({version: 'v1', auth});

  let encoded= 'SGVsbG8gd29ybGRl'
 
   gmail.users.labels.list({
    userId: 'me',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const labels = res.data.labels;
    if (labels.length) {
      console.log('Labels:');
      labels.forEach((label) => {
        console.log(`- ${label.name}`);
      });
    } else {
      console.log('No labels found.');
    }
  });

  // Making email body
  const makeBody = (params) => {
    params.subject = new Buffer.from(params.subject).toString("base64");
    const str = [
        'Content-Type: text/plain; charset=\"UTF-8\"\n',
        'MINE-Version: 1.0\n',
        'Content-Transfer-Encoding: 7bit\n',
        `to: ${params.to} \n`,
        `from: ${params.from} \n`,
        `subject: =?UTF-8?B?${params.subject}?= \n\n`,
        params.message
    ].join('');
    return new Buffer.from(str).toString('base64').replace(/\+/g,'-').replace(/\//g,'_');
}


// Drafting your message
const messageBody = `
  this is a test message
  `;

  const raw = makeBody({
      to : 'bezosjhef@gmail.com', //recepients email Id
      from : 'princesinha7072@gmail.com',
      subject : 'test title',
      message:messageBody
  });


  gmail.users.messages.send({
    userId:"me",
    resource:{
      raw:raw
    }
  }).then(res => {
    console.log(res);
  });
}
// [END gmail_quickstart]
