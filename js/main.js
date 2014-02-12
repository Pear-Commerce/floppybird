var debugmode = true;

var states = Object.freeze({
   SplashScreen: 0,
   GameScreen: 1,
   ScoreScreen: 2
});

var currentstate;

var gravity = 0.25;
var velocity = -5.5;
var position = 180;
var rotation = 0;
var jump = -4.6;

var score = 0;

var pipeheight = 90;
var pipewidth = 52;
var pipes = new Array();

//sounds
var volume = 30;
var soundJump = new buzz.sound("assets/sounds/sfx_wing.ogg");
var soundScore = new buzz.sound("assets/sounds/sfx_point.ogg");
var soundHit = new buzz.sound("assets/sounds/sfx_hit.ogg");
var soundDie = new buzz.sound("assets/sounds/sfx_die.ogg");
buzz.all().setVolume(volume);

//loops
var loopMainloop;
var loopPipeloop;

$(document).ready(function() {
   //update the big score
   setBigScore();
   currentstate = states.GameScreen;
   //debug mode?
   if(debugmode)
   {
      //show the bounding box
      $(".boundingbox").show();
   }
   var updaterate = 1000.0 / 60.0 ; //60 times a second
   loopMainloop = setInterval(mainloop, updaterate);
   loopPipeloop = setInterval(updatePipes, 1500);
});

function mainloop() {
   var player = $("#player");
   
   //update the player speed/position
   velocity += gravity;
   position += velocity;
   
   //rotation
   rotation = Math.min((velocity / 10) * 90, 90);
   
   //apply it
   player.css({ rotate: rotation, top: position });
   
   //create the bounding box
   var box = document.getElementById('player').getBoundingClientRect();
   var origwidth = 34.0;
   var origheight = 24.0;
   
   var boxwidth = origwidth - (Math.sin(Math.abs(rotation) / 90) * 8);
   var boxheight = (origheight + box.height) / 2;
   var boxleft = ((box.width - boxwidth) / 2) + box.left;
   var boxtop = ((box.height - boxheight) / 2) + box.top;
   var boxright = boxleft + boxwidth;
   var boxbottom = boxtop + boxheight;
   
   //if we're in debug mode, draw the bounding box
   if(debugmode)
   {
      var boundingbox = $("#playerbox");
      boundingbox.css('left', boxleft);
      boundingbox.css('top', boxtop);
      boundingbox.css('height', boxheight);
      boundingbox.css('width', boxwidth);
      
      //bounce
      if(box.bottom + velocity >= $("#land").offset().top)
         velocity = -velocity;
   }
   
   //have they tried to escape through the ceiling? :o
   var ceiling = $("#ceiling");
   if(boxtop <= (ceiling.offset().top + ceiling.height()))
      position = 0;
   
   //we can't go any further without a pipe
   if(pipes[0] == null)
      return;
   
   //determine the bounding box of the next pipes inner area
   var nextpipe = pipes[0];
   var nextpipeupper = nextpipe.children(".pipe_upper");
   
   var pipetop = nextpipeupper.offset().top + nextpipeupper.height();
   var pipeleft = nextpipeupper.offset().left - 2; // for some reason it starts at the inner pipes offset, not the outer pipes.
   var piperight = pipeleft + pipewidth;
   var pipebottom = pipetop + pipeheight;
   
   if(debugmode)
   {
      //$("#debug").text(pipeupper + " - " + pipelower);
      var boundingbox = $("#pipebox");
      boundingbox.css('left', pipeleft);
      boundingbox.css('top', pipetop);
      boundingbox.css('height', pipeheight);
      boundingbox.css('width', pipewidth);
   }
   
   //have we gotten inside the pipe yet?
   if(boxright > pipeleft)
   {
      //we're within the pipe, have we passed between upper and lower pipes?
      if(boxtop > pipetop && boxbottom < pipebottom)
      {
         //yeah! we're within bounds
         
      }
      else
      {
         //no! we touched the pipe
         playerDead();
      }
   }
   
   
   //have we passed the imminent danger?
   if(boxleft > piperight)
   {
      //yes, remove it
      pipes.splice(0, 1);
      
      //and score a point
      playerScore();
   }
}

//Handle space bar
$(document).keydown(function(e){
   //space bar!
   if(e.keyCode == 32)
       playerJump();
});

//Handle mouse down OR touch start
if("ontouchstart" in window)
   $(document).on("touchstart", playerJump);
else
   $(document).on("mousedown", playerJump);

function playerJump()
{
   if(currentstate == states.GameScreen)
   {
      velocity = jump;
      //play jump sound
      soundJump.stop();
      soundJump.play();
   }
}

function setBigScore(num)
{
   var elemscore = $("#bigscore");
   elemscore.empty();
   
   var digits = score.toString().split('');
   for(var i = 0; i < digits.length; i++)
      elemscore.append("<img src='assets/font_big_" + digits[i] + ".png' alt='" + digits[i] + "'>");
}

function playerDead()
{
   //end the game!
   currentstate = states.ScoreScreen;
   
   //destroy our gameloops
   clearInterval(loopMainloop);
   clearInterval(loopPipeloop);
   
   //clear out all the pipes
   $(".pipe").remove();
   
   //drop the bird to the floor
   var playerbottom = $("#player").position().top + $("#player").width(); //we use width because he'll be rotated 90 deg
   var floor = $("#flyarea").height();
   var movey = Math.max(0, floor - playerbottom);
   $("#player").transition({ x: movey + 'px', rotate: 90}, 1000, 'easeInOutCubic');
   
   //play the hit sound (then the dead sound)
   soundHit.play().bind("ended", function() { soundDie.play(); } );
}

function playerScore()
{
   score += 1;
   //play score sound
   soundScore.stop();
   soundScore.play();
   setBigScore();
}

function updatePipes()
{
   //Do any pipes need removal?
   $(".pipe").filter(function() { return $(this).position().left <= -100; }).remove()
   
   //add a new pipe (top height + bottom height == 330) and put it in our tracker
   var topheight = Math.floor((Math.random()*170) + 80); //generate random int between 80 - 250
   var bottomheight = 330 - topheight;
   var newpipe = $('<div class="pipe"><div class="pipe_upper" style="height: ' + topheight + 'px;"></div><div class="pipe_lower" style="height: ' + bottomheight + 'px;"></div></div>');
   $("#flyarea").append(newpipe);
   pipes.push(newpipe);
}