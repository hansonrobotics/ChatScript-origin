var app=require('express')();
var serveStatic = require('serve-static');
app.use(serveStatic(__dirname));
var http=require('http').Server(app);
var io=require('socket.io')(http);
var client=require('socket.io-client');
var fs=require('fs');
io.set('origins','*:*');

var config={};

config.judge=[];
config.ai=[];
config.confederate=[];

config.judge[0]="judge0";
config.judge[1]="judge1";
config.judge[2]="judge2";
config.judge[3]="judge3";

config.ai[0]="ai0";
config.ai[1]="ai1";
config.ai[2]="ai2";
config.ai[3]="ai3";
config.confederate[0]="conf0";
config.confederate[1]="conf1";
config.confederate[2]="conf2";
config.confederate[3]="conf3";

config.secret={};
config.secret["CONTROLLER"]="abv123";

config.secret["judge0"]="alice";
config.secret["judge1"]="alice";
config.secret["judge2"]="alice";
config.secret["judge3"]="alice";
config.secret["conf0"]="abc123";
config.secret["conf1"]="abc123";
config.secret["conf2"]="abc123";
config.secret["conf3"]="abc123";
config.secret["ai0"]="abc123";
config.secret["ai1"]="abc123";
config.secret["ai2"]="abc123";
config.secret["ai3"]="abc123";

//each round stores the confederate
//number and ai number for judge 0,1,2,3 respectively
config.rounds=[]
config.rounds[0]=[[0,1,2,3],[0,1,2,3]];
config.rounds[1]=[[3,0,1,2],[1,2,3,0]];
config.rounds[2]=[[2,3,0,1],[3,0,1,2]];
config.rounds[3]=[[1,2,3,0],[2,3,0,1]];

function getJudge(name)
{
  return config.judge.indexOf(name);
}
function getAI(name)
{
  return config.ai.indexOf(name);
}
function getConfederate(name)
{
  return config.confederate.indexOf(name);
}

function isJudge(name)
{
  return getJudge(name)!=-1;
}

function isAI(name)
{
  return getAI(name)!=-1;
}

function isConfederate(name)
{
  return getConfederate(name)!=-1;
}

function getConfederateForJudge(judgeNumber,round)
{
  return config.rounds[round][0][judgeNumber];
}

function getAIForJudge(judgeNumber,round)
{
  return config.rounds[round][1][judgeNumber];
}

function getJudgeForConfederate(confederateNumber,round)
{
  return config.rounds[round][0].indexOf(confederateNumber);
}

function getJudgeForAI(aiNumber,round)
{
  return config.rounds[round][1].indexOf(aiNumber);
}

function getConfederateForJudgeByName(judgeNumber,round)
{ //TODO: catch appropriate exception if judgeNumber or round is incorrect
  return config.confederate[getConfederateForJudge(judgeNumber,round)];
}

function getJudgeForConfederateByName(judgeNumber,round)
{ //TODO: catch appropriate exception if judgeNumber or round is incorrect
  return config.judge[getJudgeForConfederate(judgeNumber,round)];
}

function getAIForJudgeByName(judgeNumber,round)
{ //TODO: catch appropriate exception if judgeNumber or round is incorrect
  return config.ai[getAIForJudge(judgeNumber,round)];
}

function getJudgeForAIByName(judgeNumber,round)
{
  return config.judge[getJudgeForAI(judgeNumber,round)]
}

RUNNING="Running";
NOTSTARTED="Not Started";
FINISHED="Finished";
var currentRound=-1;
var clients={};
var roundStatus=FINISHED;
//scores: for each round, a judge decides which partner is human and which ai.
//So we have a hash of judgename->[confederate,mark] in each round.
//The mark is used at the end as the score given to the confederate
//for "humanness".
var scores=[{},{},{},{}];
//messages is an array of maps storing all messages sent to/from the client.
//In turn, each map is a client -> messages (array) entry storing the ordered
//list of messages sent to/from the client.
var messages=[{},{},{},{}];

//webcast client list; stores clients by round and judge
var webcasts=[]
/*initialize webcast with arrays for rounds and judges*/
for (i=0;i<4;i++)
{
	webcasts[i]=[];
	for (j=0;j<4;j++)
		webcasts[i][j]={};
}
//////////////////////////////////////////////////////////////////////////
function validate(socket,data)
{
  var o=JSON.parse(data);
  if (config.secret[o["id"]]==o["secret"])
    return true;
  socket.emit("AuthError","Invalid secret");
  return false;
}

function handleDisconnect(socket,data)
{
  var toRemove;
  for (var c in clients){
    if (clients[c]==socket)
    {
      toRemove=c;
      break;
    }
  }
  if (toRemove!=undefined)
    delete clients[toRemove];
  
  for (var i=0;i<4;i++)
	  for (var j=0;j<4;j++)
		  delete webcasts[i][j][socket];  
}

//messages from the controller
function handleControllerMessage(socket,data)
{
  if (!validate(socket,data))
    return;
  var o=JSON.parse(data);
  switch(o["status"]){
    case "statusUpdate": emitStatusUpdate(socket);
                         break;
    case "endRound": broadcast('control','{"status":"endRound"}');
                     roundStatus=FINISHED;
                     break;
    case "newRound": currentRound+=1;
                     var partners=JSON.stringify(informPartners());
                     broadcast('control','{"status":"newRound","partners": '+partners+'}');
                     roundStatus=NOTSTARTED;
                     break;
    case "startRound": broadcast('control','{"status":"startRound"}');
                       roundStatus=RUNNING;
                       break;
  }
}

//control messages from the clients
function handleControlMessage(socket,data)
{
  if (!validate(socket,data))
    return;
  var o=JSON.parse(data);
  switch(o["status"]){
    case "register": clients[o["id"]]=socket;break;
    case "roundInformation":var i=JSON.stringify(informPartners());
                            socket.emit('roundInformation','{"roundNumber":'+currentRound+', "status":"'+roundStatus+'", "partners":'+i+'}');
                            break;
    case "recap": var c=o.id;
                  socket.emit('recap',JSON.stringify(messages[currentRound][c]));
                  break;

  }
}


function handleCommunicationMessage(socket,data)
{
  if (!validate(socket,data))
    return;
  var o=JSON.parse(data);
  var c=o.id;
  if (roundStatus==RUNNING &&
      ((isAI(c) && o.to==getJudgeForAIByName(getAI(c),currentRound)) ||
      (isConfederate(c) && o.to==getJudgeForConfederateByName(getConfederate(c),currentRound)) ||
      (isJudge(c) && (o.to==getConfederateForJudgeByName(getJudge(c),currentRound) ||
                     o.to==getAIForJudgeByName(getJudge(c),currentRound)))) &&
      clients[o.to]!=undefined
     )
  {
    o.secret="";
    //initialise the message array as needed.
    if (messages[currentRound][o.id]==undefined)
      messages[currentRound][o.id]=[];
    if (messages[currentRound][o.to]==undefined)
        messages[currentRound][o.to]=[];

    messages[currentRound][o.id].push(o);
    messages[currentRound][o.to].push(o);
    clients[o.to].emit("message",JSON.stringify(o));
    //TODO: serialise the messages to disk for future playback

    //Now handle webcast by checking if getting index for judge
    var j=config.judge.indexOf(o.to);
    if (isJudge(o.id)){
       j=config.judge.indexOf(o.id);
    }
    var keys=Object.keys(webcasts[currentRound][j]);   
    for (w in keys)
    {
	    webcasts[currentRound][j][keys[w]].emit("message",JSON.stringify(o)); 
    }
  }
  else
  {
    clients[c].emit("TargetError",'{"status":"Wrong Client or not connected"}');
  }
}

function handleScoreMessage(socket,data)
{
  if (!validate(socket,data))
    return;
  var o=JSON.parse(data);
  var c=o.id;
  scores[currentRound][c]=o.robot;
}




//computes who needs to talk to who in this round.
function informPartners()
{
  var p={}
  if (currentRound<0)
    return p;

  for (var i=0;i<config.judge.length;i++)
    p[config.judge[i]]=[getConfederateForJudgeByName(i,currentRound),
                        getAIForJudgeByName(i,currentRound)];

  for (var i=0;i<config.ai.length;i++)
    p[config.ai[i]]=[getJudgeForAIByName(i,currentRound)];

  for (var i=0;i<config.confederate.length;i++)
    p[config.confederate[i]]=[getJudgeForConfederateByName(i,currentRound)];
  return p;
}

//send something to everyone
function broadcast(msgType,data)
{
  for (c in clients)
    clients[c].emit(msgType,data);
}

//used to inform the controller as to what's going on.
function emitStatusUpdate(socket)
{
  var response={};
  response["roundNumber"]=currentRound;
  response["roundStatus"]=roundStatus;
  //create connected clients
  var cc=[{},{},{}];
  for (var i=0;i<config.judge.length;i++)
  {
      c=config.judge[i]
      cc[0][c]=(c in clients);
  }
  for (var i=0;i<config.ai.length;i++)
  {
      c=config.ai[i]
      cc[1][c]=(c in clients);
  }
  for (var i=0;i<config.confederate.length;i++)
  {
      c=config.confederate[i]
      cc[2][c]=(c in clients);
  }
  response["connectedClients"]=cc;
  var sr=[];
  for (var i=0;i<config.judge.length;i++)
  {
    var j= config.judge[i];
      if (currentRound>-1 && scores[currentRound][j]!=undefined)
        sr.push(j)
  }
  response["scoredClients"]=sr;
  response["scores"]=scores;

  socket.emit('statusUpdate',JSON.stringify(response));
}

////////////////////////////////////WEBCAST STUFF

//on joining webcast and setting the view, the name of the judge and participants will be sent, followed by a recap of the messages so far. We will also store the socket in the webcasts map so that we can send messages as appropriate
function handleWebcastMessage(socket,data){
	try
	{
	var o=JSON.parse(data);
	switch (o["status"]){
		case "setView":var wround=parseInt(o["round"]);
			       var wjudge=parseInt(o["judge"]);
			       if (isNaN(wround) || isNaN(wjudge))
				       break;
		        webcasts[wround][wjudge][socket]=socket;
		        var wRoundInfo={};
			wRoundInfo["judge"]=config.judge[wjudge];
			wRoundInfo["participant1"]=config.confederate[getConfederateForJudge(wjudge,wround)];
			wRoundInfo["participant2"]=config.ai[getAIForJudge(wjudge,wround)];
			socket.emit('participants',JSON.stringify(wRoundInfo));
			socket.emit('recap',JSON.stringify(messages[o["round"]][config.judge[parseInt(o["judge"])]]));
	}
	} catch (err) {console.log(err);}
}
////////////////////////////////////END WEBCAST

//launch the Server
http.listen(8080,function(){console.log('listening');});
//TODO: add serving of jquery and webcast
io.on('connection',function(socket){
  socket.on('disconnect',function(data){handleDisconnect(socket,data);});
  socket.on('controller',function(data){handleControllerMessage(socket,data);});
  socket.on('control',function(data){handleControlMessage(socket,data);});
  socket.on('score',function(data){handleScoreMessage(socket,data);});
  socket.on('message',function(data){handleCommunicationMessage(socket,data);});

  socket.on('webcast',function(data){handleWebcastMessage(socket,data);});
});
