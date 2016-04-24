# pop2json
A nodejs web service to query an email account via pop3 and return json of it's contents

Work in progress

This is slow but works.

## usage
 git clone https://github.com/carlpwilliams/pop2json.git
 npm install
 node server.js

  Make a post request to localhost:3000 with the following body format
  <code>{"username":"usernme","password":"password", "host":"host","port":110}</code>