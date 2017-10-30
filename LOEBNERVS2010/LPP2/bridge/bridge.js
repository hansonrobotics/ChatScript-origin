/*
A simple bridge between the old protocol and new.
Limitations:
- We don't handle backspace characters
- We don't delete subdirs after they have been processed due to a limitation with the underlying fsWatch object (could delete based on message id and two handlers, but synchronisation might then be required)
*/
console.info("Loading File System...");
var fs=require('fs');
console.info('Loading Paths...');
var path=require('path');
//var chokidar=require('chokidar');
console.info('Loading Socket.io Client...');
var io=require('socket.io-client');
console.info('Loading Config...');
var config=require('./config.js');

var LPPMAP={};
LPPMAP['braceleft']=      '{';
LPPMAP['braceright']=     '}';
LPPMAP['bracketleft']=    '[';
LPPMAP['bracketright']=   ']';
LPPMAP['parenleft']=      '(';
LPPMAP['parenright']=     ')';
LPPMAP['space']=          ' ';
LPPMAP['comma']=          ',';
LPPMAP['period']=         '.';
LPPMAP['greater']=        '>';
LPPMAP['less']=           '<';
LPPMAP['slash']=          '/';
LPPMAP['backslash']=      '\\';
LPPMAP['bar']=            '|';
LPPMAP['quotedbl']=       '"';
LPPMAP['quoteright']=     "'";
LPPMAP['tab']=            "\t";
LPPMAP['equal']=          '=';
LPPMAP['underscore']=     '_';
LPPMAP['plus']=           '+';
LPPMAP['minus']=          '-';
LPPMAP['exclam']=         '!';
LPPMAP['at']=             '@';
LPPMAP['numbersign']=     '#';
LPPMAP['dollar']=         '$';
LPPMAP['percent']=        '%';
LPPMAP['asterisk']=       '*';
LPPMAP['asciicircum']=    '^';
LPPMAP['asciitilde']=     '~';
LPPMAP['quoteleft']=      '`';
LPPMAP['ampersand']=      '&';
//LPPMAP['return']=         "Return";
LPPMAP['colon']=          ":";
LPPMAP['semicolon']=      ";";
LPPMAP['question']=       "?";
//LPPMAP['backspace']=      "Backspace";

//////////UTILITY FUNCTIONS

function getLPKeyByValue(v) //This is incredibly lazy, I should just define a reverse map, but given the speed at which things should occur, this is no big deal.
{
	for (k in LPPMAP)
		if (LPPMAP[k]==v)
			return k;
	return v;
}

function getValueByLPKey(v)
{
	if (LPPMAP[v]!=undefined)
		return LPPMAP[v];
	else
		return v;
}

function toJSON(map) {
    map["id"]=config.NAME;
    map["secret"]=config.SECRET;
    return JSON.stringify(map);
}

////////IMPORTANT GLOBAL VARIABLES

console.info('Initializing socket...');
var socket=io.connect(config.URL);
var partner; //track who the current partner is
var c=0; //a counter which increments based on messages sent according to LPP

/////////PRIMITIVE CONTROL MESSAGE HANDLING, IGNORES NEWROUND ETC
socket.emit('control', toJSON({"status":"register"}));

socket.emit('control', toJSON({"status":"roundInformation"}));

socket.on('control',function(data){
	var d=JSON.parse(data);
    console.warn('Control data =', d);
	if (d.status=="newRound")
		partner=d.partners[config.NAME][0];
});
socket.on('roundInformation',function(data){
	var d=JSON.parse(data);
	if (d.roundNumber>=0) partner=d.partners[config.NAME][0];
});

//////////THIS WRITES SERVER MESSAGES TO THE FILE SYSTEM

socket.on('message',function(data){
  dt=JSON.parse(data);
    console.info('incoming message:', dt.content);
  for (var i=0;i<dt.content.length;i++)
  {
    var d=(c++)+"."+getLPKeyByValue(dt.content[i])+".judge";
    console.warn('filename =',d);
    fs.mkdir(config.OUTPUTDIR+"/"+d);
  }  
  fs.mkdir(config.OUTPUTDIR+"/"+(c++)+".return.judge");
});

/////////STUFF BELOW HERE WATCHES THE FILE SYSTEM TO SEND TO THE SERVER
var buffer=""; //buffer of text to send

fs.watch(config.INPUTDIR,function(e,f){
  if (f==null) return;
  console.log('new folders! e=', e, ': f =', f);
  var o=f.split("."); //f should be of the form NUMBER.CHARACTER.other
  if (o[2]=="other")
	  if (o[1].toLowerCase() != "return")
	    buffer+=getValueByLPKey(o[1])
	  else
	  {
            socket.emit('message',toJSON({"content":buffer,"to":partner}));
            console.info('Sent to judge:', buffer);
	    buffer="";
	  }
});

