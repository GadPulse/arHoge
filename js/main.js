var vid = document.getElementById('videoel');
var vid_width = vid.width;
var vid_height = vid.height;
var content = document.getElementById('content');
var overlay = document.getElementById('overlay');
var overlayCC = overlay.getContext('2d');


var contents = new Array();
var score = -1;
var currentScore = -1;
const circle = [];
circle.push({x:40,y:40,radius:50});

var Trigger = false;
var isMeasurementSuccess = false;
var isMeasurementFailed = false;
var isCountingScore = false;
var isFacewireDisplayed = false;

/*********** Setup of video/webcam and checking for webGL support *********/
function enablestart() {
   var startbutton = document.getElementById('startbutton');
   startbutton.value = "start";
   startbutton.disabled = null;
}

function adjustVideoProportions() {
   // videoのサイズを取得
   var videoW = vid.clientWidth;
   var videoH = vid.clientHeight;
   // windowの横幅を取得
   var windowW = content.clientWidth;
   // windowの横幅と動画の横幅の比率を算出
   var videoRate = windowW / videoW;

   // サイズを設定
   vid.width = overlay.width = deco.width = windowW;
   vid.height = overlay.height = deco.height = videoH * videoRate;
}

function gumSuccess( stream ) {
        // add camera stream if getUserMedia succeeded
        if ("srcObject" in vid) {
                vid.srcObject = stream;
        } else {
                vid.src = (window.URL && window.URL.createObjectURL(stream));
        }

        vid.onloadedmetadata = function() {
                adjustVideoProportions();
                vid.play();
        }
        vid.onresize = function() {
                adjustVideoProportions();
                if (trackingStarted) {
                        ctrack.stop();
                        ctrack.reset();
                        ctrack.start(vid);
                }
        }
}

function gumFail() {
        alert("There was some problem trying to fetch video from your webcam, using a fallback video instead.");
}

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
window.URL = window.URL || window.webkitURL || window.msURL || window.mozURL;

// set up video
if (navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia({video : true}).then(gumSuccess).catch(gumFail);
} else if (navigator.getUserMedia) {
        navigator.getUserMedia({video : true}, gumSuccess, gumFail);
} else {
        alert("Your browser does not seem to support getUserMedia, using a fallback video instead.");
}

vid.addEventListener('canplay', enablestart, false);
/*********** Code for face tracking *********/
var ctrack = new clm.tracker();
ctrack.init();
var trackingStarted = false;

//
// 顔を検出できたときのEvent
document.addEventListener("clmtrackrConverged", clmtrackrConvergedHandler);
// 顔を検出できなかったときのEvent
document.addEventListener("clmtrackrLost", clmtrackrLostHandler);

var decoCanvas = document.getElementById("deco");
var decoCanvasContext = decoCanvas.getContext("2d");
decoCanvas.addEventListener("click",OnclickFunc);

function OnclickFunc(e){
    Trigger = true;
    score = -1;
    currentScore=-1;
    setTimeout(function(){
      if(Trigger){
        isMeasurementFailed = true;
        isMeasurementSuccess = false;
        Trigger = false;

        for(const c of circle){
          c.x=40;  c.y=40;
        }

        //計測失敗ログの表示
        console.log("計測失敗");
        drawText(3);

        setTimeout(function(){
          isMeasurementFailed = false;
          drawText(4);
        },3000);
      }
    },5000);
}


/**
* 顔検出失敗
*/
function clmtrackrLostHandler() {
        score = -1;
}

/**
* 顔検出成功
*/
function clmtrackrConvergedHandler() {
       
        if(Trigger){
                console.log("計測成功");
                isMeasurementFailed = false;
                isMeasurementSuccess = true;
                isCountingScore = true;

                var num = Math.floor( Math.random() * (9999 + 1 - 1) ) + 0;
                score = num;

                //計測成功ログ
                drawText(2);
                //
                CalculatePower();
                Trigger = false;
                
                setTimeout(function(){
                        isMeasurementSuccess = false;
                },5000);
        }
}

function startVideo() {
        // start video
        vid.play();
        // start tracking
        ctrack.start(vid);
        trackingStarted = true;

        // start loop to draw face
        drawLoop();
}

$("#facewire").on("click touch",function(){
 if(isFacewireDisplayed){
  $("#overlay").css('visibility','hidden');
  isFacewireDisplayed = false;      
 }
 else{
  $("#overlay").css('visibility','visible');
  isFacewireDisplayed = true;      
 }
});

function drawLoop() {
    requestAnimFrame(drawLoop);
    overlayCC.clearRect(0, 0, overlay.width, overlay.height);
    decoCanvasContext.clearRect(0, 0, decoCanvas.width, decoCanvas.height);

    //テキスト表示部
    //計測中
    if(Trigger && !isMeasurementSuccess && !isMeasurementFailed){
      drawText(1);
    }
    //計測後 -成功-
    else if(!Trigger && isMeasurementSuccess){
      drawText(2);
    }
    //計測後 -失敗-
    else if(!Trigger && isMeasurementFailed){
      drawText(3);
    }
    else{
      drawText(4);
    }

    // 座標が取得できたかどうか
    if (ctrack.getCurrentPosition()) {
      // ワイヤーフレームを描画
      ctrack.draw(overlay);

      if(Trigger){
        var FacePos = ctrack.getCurrentPosition();

        for(const c of circle){
          c.x = FacePos[13][0] + ((FacePos[1][0] - FacePos[13][0])/2);
          c.y = FacePos[13][1] + ((FacePos[1][1] - FacePos[13][1])/2);
          if( c.radius > (CalculateLength(1,13,FacePos)/2)*1.0) c.radius-=5;
          else c.radius = (CalculateLength(1,13,FacePos)/2)*2.0;
          drawCircle(c.x,c.y,c.radius);        

          /* 三角形を描く */
          decoCanvasContext.beginPath();
          decoCanvasContext.moveTo(c.x-c.radius, c.y);
          decoCanvasContext.lineTo(c.x-c.radius-20, c.y-10);
          decoCanvasContext.lineTo(c.x-c.radius-20, c.y+10);
          decoCanvasContext.closePath();
          decoCanvasContext.fill();
          /* 三角形を描く */
          decoCanvasContext.beginPath();
          decoCanvasContext.moveTo(c.x, c.y+c.radius);
          decoCanvasContext.lineTo(c.x+10, c.y+c.radius+20);
          decoCanvasContext.lineTo(c.x-10, c.y+c.radius+20);
          decoCanvasContext.closePath();
          decoCanvasContext.fill();
          /* 三角形を描く */
          decoCanvasContext.beginPath();
          decoCanvasContext.moveTo(c.x+c.radius, c.y);
          decoCanvasContext.lineTo(c.x+c.radius+20, c.y-10);
          decoCanvasContext.lineTo(c.x+c.radius+20, c.y+10);
          decoCanvasContext.closePath();
          decoCanvasContext.fill();
          /* 三角形を描く */
          decoCanvasContext.beginPath();
          decoCanvasContext.moveTo(c.x, c.y-c.radius);
          decoCanvasContext.lineTo(c.x+10, c.y-c.radius-20);
          decoCanvasContext.lineTo(c.x-10, c.y-c.radius-20);
          decoCanvasContext.closePath();
          decoCanvasContext.fill();

        }

        var x = FacePos[33][0];       var y = FacePos[33][1]-100;
        var num = Math.floor( Math.random() * (9999 + 1 - 1) ) + 0;
        decoCanvasContext.font= 'bold 5vw FontScouter';
        decoCanvasContext.fillStyle = 'rgba(0,255,0,0.8)';

        if(y > 50)  decoCanvasContext.fillText(num,x,y);
        else{
          y = FacePos[7][1];
          decoCanvasContext.fillText(num,x,y+50);
        }
      }
      else if(score>=0){
        if(isCountingScore) currentScore+=Math.floor(score/30);

        if(currentScore>=score){
          currentScore=score; isCountingScore=false;
        } 

        var FacePos = ctrack.getCurrentPosition();
        var x = FacePos[33][0];       var y = FacePos[33][1]-100;
        decoCanvasContext.font= 'bold 5vw FontScouter';
        decoCanvasContext.fillStyle = 'rgba(0,255,0,0.8)';

        if(y > 50)  decoCanvasContext.fillText(currentScore,x,y);
        else{
          y = FacePos[7][1];
          decoCanvasContext.fillText(currentScore,x,y+50);
        } 
      }

    }

}
/*********** Code for stats **********/
  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  document.getElementById('container').appendChild( stats.domElement );
  // update stats on every iteration
  document.addEventListener('clmtrackrIteration', function(event) {
    stats.update();
  }, false);

  //処理用関数
  //計測アニメーション
  // 円の描画
function drawCircle(x,y,r) {
    if ( ! decoCanvas || ! overlay.getContext ) { return false; }
    decoCanvasContext.beginPath();
    decoCanvasContext.lineWidth = 5;
    decoCanvasContext.strokeStyle = 'rgba(0,255,0,0.2)';
    decoCanvasContext.arc(x, y, r, 0, 2* Math.PI, true);
    decoCanvasContext.stroke();
}

function drawText(label){
    decoCanvasContext.font= 'bold 3vw FontScouter';
    decoCanvasContext.fillStyle = 'rgba(0,255,0,0.8)';
    switch(label){
      case 1:
        decoCanvasContext.fillText('Measuring. . .',decoCanvas.width*7/10,(9*decoCanvas.height)/10);
      break;
      case 2:
        decoCanvasContext.fillText('Success.',decoCanvas.width*4/5,(9*decoCanvas.height)/10);
      break;
      case 3:
        decoCanvasContext.fillText('Failed. . .',decoCanvas.width*4/5,(9*decoCanvas.height)/10);
      break;
      case 4:
        decoCanvasContext.fillText('Touch!this!screen',decoCanvas.width*2/5,(9*decoCanvas.height)/10);
        decoCanvasContext.fillText('to!measure!the!power. . .',decoCanvas.width*2/5,30+(9*decoCanvas.height)/10);
      break;
      default:
      break;
    }
}

function CalculatePower(){
    var FacePos = ctrack.getCurrentPosition(); 
    if(FacePos){

      var faceWidth = CalculateLength(1,13,FacePos);
      var faceHeight = CalculateLength(7,37,FacePos);

      if(faceWidth!=0 && faceHeight!=0){
        //目の特徴量
        var EyeInnerWidth = CalculateLength(30,25,FacePos)/faceWidth;
        var EyeHeight = ((CalculateLength(26,24,FacePos) + CalculateLength(31,29,FacePos))/2)/faceHeight;
        var EyeWidth = ((CalculateLength(25,23,FacePos) + CalculateLength(30,28,FacePos))/2)/faceWidth;

        //鼻の特徴量
        var NoseHeight = CalculateLength(37,62,FacePos)/faceHeight;
        var NoseWidth = CalculateLength(39,35,FacePos)/faceWidth;

        //口の特徴量
        var mouthHeight = CalculateLength(53,47,FacePos)/faceHeight;
        var mouthWidth = CalculateLength(50,44,FacePos)/faceWidth;

        //眉の特徴量
        var EyeBrow1_X = FacePos[22][0] - FacePos[21][0];
        var EyeBrow1_Y = FacePos[22][1] - FacePos[21][1];

        var EyeBrow2_X = FacePos[18][0] - FacePos[17][0];
        var EyeBrow2_Y = FacePos[18][1] - FacePos[17][1];

        var NoseLine_X = FacePos[33][0] - FacePos[62][0];
        var NoseLine_Y = FacePos[33][1] - FacePos[62][1];

        var EyeBrow1 = (EyeBrow1_X*NoseLine_X + EyeBrow1_Y*NoseLine_Y)/(Math.sqrt(EyeBrow1_X*EyeBrow1_X+EyeBrow1_Y*EyeBrow1_Y)*Math.sqrt(NoseLine_X*NoseLine_X+NoseLine_Y*NoseLine_Y));
        var EyeBrow2 = (EyeBrow2_X*NoseLine_X + EyeBrow2_Y*NoseLine_Y)/(Math.sqrt(EyeBrow2_X*EyeBrow2_X+EyeBrow2_Y*EyeBrow2_Y)*Math.sqrt(NoseLine_X*NoseLine_X+NoseLine_Y*NoseLine_Y));

        //顎の特徴量 5,7,9
        var line1 = CalculateLength(5,7,FacePos);
        var line2 = CalculateLength(7,9,FacePos);
        var line3 = CalculateLength(9,5,FacePos);
        var Radius = (line1*line2*line3)/(Math.sqrt((line1+line2+line3)+(line2+line3-line1)+(line3+line1-line2)+(line1+line2-line3)));
        var chin = 1/Radius;

        score = Math.floor(-208035872351.522 + 7231623155616.85*EyeInnerWidth + 7782927625.34857*EyeHeight + 508060866818.232*EyeWidth + (-417157547954.439)*NoseHeight + (-16716610061729.6)*NoseWidth + (-1475015553658.31)*mouthHeight + 5650045751884.23*mouthWidth + (-145648699134.646)*EyeBrow1 + (-1378158592850.59)*EyeBrow2 + 993058938884.308*chin); 
        score = Math.abs(Math.floor(score/10000000));
      }

    }
}

function CalculateLength(i,j,FaceCurrentPos){
    return Math.sqrt((FaceCurrentPos[i][0]-FaceCurrentPos[j][0])*(FaceCurrentPos[i][0]-FaceCurrentPos[j][0]) + (FaceCurrentPos[i][1]-FaceCurrentPos[j][1])*(FaceCurrentPos[i][1]-FaceCurrentPos[j][1]));
}
