# Getting Started
The clients directory contains a sample confederate (identical to an AI), and a sample judge. The controller directory has a html file which can be used to run the competition, while the server directory has the actual server, written in javascript. The html files utilise jquery and the socket-io client, while the server program is built on top of express and also uses the socket-io library.

## Configuration
Edit the names and secrets in the `server.js` file, and the names, secrets and urls in the HTML files.

## Running
To run, install node, and the dependencies for the server (socket.io, socket.io-client and express, e.g., via `npm install socket.io` etc.), and run `node server.js`. You should then be able to open the html files in your browser.

# Message Types
Below, we break down messages by topic. An AI client will send messages to the server on the following topics:
1. __control__
2. __message__

The client will receive messages on the following topics:
1. __AuthError__
2. __roundInformation__
3. __recap__
4. __message__
5. __TargetError__

## Sending Messages

The messages sent and received by a client are JSON strings, and more precisely, JSON maps (hashes). All messages _from a client_ contain authentication information within the JSON map. This authentication information uses the pair
```javascript
"id": <client ID>,
"secret": <a secret>
```
The _client ID_ and _secret_ will be given to the client at the start of the competition and are used to uniquely identify it. In addition, the client will be provided with the server's URL.

### Control messages
A control message sent by a client has one more entry in the map, namely a `"status"` entry, which can take on the following values
1. `register`
2. `roundInformation`
3. `recap`
4. `endRound`
5. `newRound`
6. `startRound`

The `register` message is used when connecting, to inform the server that the client is present. The server will not provide a response to such a message.

The `roundInformation` message requests information about the round status, the round number, and the partners assigned to the client in this round. The server will thus respond to this message with a message on the __roundInformation__ topic of the form
```javascript
"roundNumber":<an integer between 0 and 3 (inclusive)>,
"status":<one of "Running"|"Not Started"|"Finished">,
"partners":["<a string representing the name of the partner the client should be talking to"]
```

___Note___: rounds run from 0 to 3. Before the competition starts, roundNumber will be -1.

Example:
```
{"roundNumber":3,"status":"Running","partners":["judge3"]}
```

The `recap` message will send all messages sent so far in the round to the client, on the __recap__ topic. These form an array of messages (see the next section).

The `endRound`,`startRound` and `newRound` messages are all sent on the __control__ topic. These messages are not sent in response to a message from the client, but rather inform the client of a change in round status.

The `endRound` message is used to signal the fact that communication for the round is finished (i.e., judges and clients must stop communicating). The `startRound` message on the other hand tells judges and clients that they may start talking to each other. The `newRound` message tells clients that a new round is about to begin. This message also has another element in its map, namely the partner the client should talk to during this round, stored in a map with the name `"partners"`. The key for this map is the client name, while the value is an array of partners.

Example:
```javascript
{"status":"newRound","partners": {"judge0":["conf0","ai0"],"judge1":["conf1","ai1"],"judge2":["conf2","ai2"],"judge3":["conf3","ai3"],"ai0":["judge0"],"ai1":["judge1"],"ai2":["judge2"],"ai3":["judge3"],"conf0":["judge0"],"conf1":["judge1"],"conf2":["judge2"],"conf3":["judge3"]}}
```


### Communication messages
Standard messages are sent along the __message__ topic. Apart from the validation information, they contain two more entries: a `"to":<partner name>` entry - identifying who the message is for; and a `"content":<string>` containing the actual message.
Example:
```javascript
{"id":"ai0","secret":"slkgj!sg1","content":"hello world","to":"judge0"}
```

The client will also receive communication messages on the __message__ topic, with the same format, but with the `secret` stripped out.

### Errors
Messages along the __AuthError__ topic indicate an authentication error, and contain a string saying "Invalid Secret".

Messages on the __TargetError__ topic indicate that the client attempted to send a message to someone they're not supposed to be in communication with, or during the wrong phase of the competition (e.g., before the current round was Running).

# Protocol
The client should connect to the server's URL using a socket.io client, and immediately send a `register` message.

They can then send control messages at any time to the server (e.g., if they get disconnected and wish to determine what the current round status is on reconnecting).

The server can also send control messages to the client at any time (see above as to which control messages the server may send).

Communication messages should only be sent when the round is Running, doing so at other stages will result in an error (TargetError or AuthError) being sent to the client.

# Mapping from the old protocol
With thanks to Robert Denis, an interface between the old and new protocol can be obtained at [http://www.vixia.fr/mylene/download/ai_old_protocol.zip]

Another (node based) implementation of a bridge between the two protocols is available in the `bridge` subdirectory. To use it, edit the `config.js` file.
