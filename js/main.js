var contents = new Array();
var score = -1;
var currentScore = -1;
const circle = [];
circle.push({x:40,y:40,radius:50});

(function () {
  // DOM
  var wrapper = document.getElementById("wrapper");
  var inner = document.getElementById("inner");

  // 顔のワイヤーフレームが表示されるcanvas
  var wireframe = document.getElementById("wireframe");
  var wireframeContext = wireframe.getContext("2d");

  var decoCanvas = document.getElementById("deco");
  var decoCanvasContext = decoCanvas.getContext("2d");

  // video
  var video = document.getElementById("video");

  //
  var Trigger = false;
  var isMeasurementSuccess = false;
  var isMeasurementFailed = false;
  var isCountingScore = false;
  var isFacewireDisplayed = false;

  //debug
  var noseX = 0;
  var noseY = 0;

  // Stats
  var stats;

  // clmtrackr
  var ctrack;

  // 描画用RequestAnimationFrame
  var drawRequest;

  //ベンダープリフィックスの有無を吸収
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

  // 処理開始
  start();
  /**
   * 処理開始
   */
  function start() {
    // Stats
    stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);


    // clmtrackrをインスタンス化
    ctrack = new clm.tracker();

    // MediaStream APIでWebカメラへアクセス
    navigator.getUserMedia({
        video: true,
        audio: false
      },
      function (mediaStream) {
        // videoのメタデータの取得が成功
        video.addEventListener("loadedmetadata", function (event) {
          // videoのサイズを取得
          var videoW = video.clientWidth;
          var videoH = video.clientHeight;
          // windowの横幅を取得
          var windowW = inner.clientWidth;
          // windowの横幅と動画の横幅の比率を算出
          var videoRate = windowW / videoW;

          // サイズを設定
          video.width = wireframe.width = decoCanvas.width = windowW;
          video.height = wireframe.height = decoCanvas.height = videoH * videoRate;


          // 繰り返し処理開始
          loop();

          // 顔を検出できたときのEvent
          document.addEventListener("clmtrackrConverged", clmtrackrConvergedHandler);
          // 顔を検出できなかったときのEvent
          document.addEventListener("clmtrackrLost", clmtrackrLostHandler);
          decoCanvas.addEventListener("click",OnclickFunc);
          // 顔のモデルデータを設定
          ctrack.init(pModel);
          // 顔の検出を開始
          ctrack.start(video);
        });

        // videoでWebカメラの映像を表示
        video.src = URL.createObjectURL(mediaStream);
      },
      function (error) {
        console.log("error", error);
      });
  }

  /**
   * 繰り返し処理
   */
  function loop() {
    // requestAnimationFrame
    drawRequest = requestAnimationFrame(loop);

    // Stats計測開始
    stats.begin();

    // canvasの描画をクリア
    wireframeContext.clearRect(0, 0, wireframe.width, wireframe.height);
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
      ctrack.draw(wireframe);

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
        decoCanvasContext.font= 'bold 20px FontScouter';
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
        decoCanvasContext.font= 'bold 20px FontScouter';
        decoCanvasContext.fillStyle = 'rgba(0,255,0,0.8)';

        if(y > 50)  decoCanvasContext.fillText(currentScore,x,y);
        else{
          y = FacePos[7][1];
          decoCanvasContext.fillText(currentScore,x,y+50);
        } 
      }

    }

    // Stats計測終了
    stats.end();
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

  $("#facewire").on("click touch",function(){
    if(isFacewireDisplayed){
      $("#wireframe").css('visibility','hidden');
      isFacewireDisplayed = false;      
    }
    else{
      $("#wireframe").css('visibility','visible');
      isFacewireDisplayed = true;      
    }
  });


  //計測アニメーション
  // 円の描画
  function drawCircle(x,y,r) {
    if ( ! decoCanvas || ! wireframe.getContext ) { return false; }
    decoCanvasContext.beginPath();
    decoCanvasContext.lineWidth = 5;
    decoCanvasContext.strokeStyle = 'rgba(0,255,0,0.2)';
    decoCanvasContext.arc(x, y, r, 0, 2* Math.PI, true);
    decoCanvasContext.stroke();
  }

  function drawText(label){
    decoCanvasContext.font= 'bold 15px FontScouter';
    decoCanvasContext.fillStyle = 'rgba(0,255,0,0.8)';
    switch(label){
      case 1:
        decoCanvasContext.fillText('Measuring. . .',decoCanvas.width*1/5,(9*decoCanvas.height)/10);
      break;
      case 2:
        decoCanvasContext.fillText('Success.',decoCanvas.width*1/5,(9*decoCanvas.height)/10);
      break;
      case 3:
        decoCanvasContext.fillText('Failed. . .',decoCanvas.width*1/5,(9*decoCanvas.height)/10);
      break;
      case 4:
        decoCanvasContext.fillText('Touch!this!screen',decoCanvas.width*1/5,(9*decoCanvas.height)/10);
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

        //var EyeInnerWidth = 0.268908722;
        //var EyeHeight = 0.082402819;
        //var EyeWidth = 0.189933187;
        //鼻の特徴量
        var NoseHeight = CalculateLength(37,62,FacePos)/faceHeight;
        var NoseWidth = CalculateLength(39,35,FacePos)/faceWidth;

        //var NoseHeight = 0.452630242;
        //var NoseWidth = 0.29478691;

        //口の特徴量
        var mouthHeight = CalculateLength(53,47,FacePos)/faceHeight;
        var mouthWidth = CalculateLength(50,44,FacePos)/faceWidth;

        //var mouthHeight = 0.138241292;
        //var mouthWidth = 0.379091406;

        //眉の特徴量
        var EyeBrow1_X = FacePos[22][0] - FacePos[21][0];
        var EyeBrow1_Y = FacePos[22][1] - FacePos[21][1];

        var EyeBrow2_X = FacePos[18][0] - FacePos[17][0];
        var EyeBrow2_Y = FacePos[18][1] - FacePos[17][1];

        var NoseLine_X = FacePos[33][0] - FacePos[62][0];
        var NoseLine_Y = FacePos[33][1] - FacePos[62][1];

        var EyeBrow1 = (EyeBrow1_X*NoseLine_X + EyeBrow1_Y*NoseLine_Y)/(Math.sqrt(EyeBrow1_X*EyeBrow1_X+EyeBrow1_Y*EyeBrow1_Y)*Math.sqrt(NoseLine_X*NoseLine_X+NoseLine_Y*NoseLine_Y));
        var EyeBrow2 = (EyeBrow2_X*NoseLine_X + EyeBrow2_Y*NoseLine_Y)/(Math.sqrt(EyeBrow2_X*EyeBrow2_X+EyeBrow2_Y*EyeBrow2_Y)*Math.sqrt(NoseLine_X*NoseLine_X+NoseLine_Y*NoseLine_Y));

        //var EyeBrow1 = 0.38456291;
        //var EyeBrow2 = -0.999834092;

        //顎の特徴量 5,7,9
        var line1 = CalculateLength(5,7,FacePos);
        var line2 = CalculateLength(7,9,FacePos);
        var line3 = CalculateLength(9,5,FacePos);
        var Radius = (line1*line2*line3)/(Math.sqrt((line1+line2+line3)+(line2+line3-line1)+(line3+line1-line2)+(line1+line2-line3)));
        var chin = 1/Radius;
        //var chin = 0.031228493;
        score = Math.floor(-208035872351.522 + 7231623155616.85*EyeInnerWidth + 7782927625.34857*EyeHeight + 508060866818.232*EyeWidth + (-417157547954.439)*NoseHeight + (-16716610061729.6)*NoseWidth + (-1475015553658.31)*mouthHeight + 5650045751884.23*mouthWidth + (-145648699134.646)*EyeBrow1 + (-1378158592850.59)*EyeBrow2 + 993058938884.308*chin); 
        score = Math.abs(score);
      }

    }
  }

  function CalculateLength(i,j,FaceCurrentPos){
    return Math.sqrt((FaceCurrentPos[i][0]-FaceCurrentPos[j][0])*(FaceCurrentPos[i][0]-FaceCurrentPos[j][0]) + (FaceCurrentPos[i][1]-FaceCurrentPos[j][1])*(FaceCurrentPos[i][1]-FaceCurrentPos[j][1]));
  }
})();