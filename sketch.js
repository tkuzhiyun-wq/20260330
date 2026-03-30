let topPoints = [];
let bottomPoints = [];
let gameState = 'START'; // START, PLAYING, GAMEOVER, WIN

function setup() {
  createCanvas(windowWidth, windowHeight);
  noCursor(); // 隱藏原本的滑鼠游標
  generatePath();
}

function draw() {
  background(30);

  if (gameState === 'START') {
    drawPath();
    fill(255);
    textAlign(CENTER);
    textSize(24);
    text("電流急急棒\n請將滑鼠移到左側起點開始", width / 2, height / 2);
    
    // 起點圓形按鈕判定
    let startX = topPoints[0].x;
    let startY = (topPoints[0].y + bottomPoints[0].y) / 2;
    let startD = bottomPoints[0].y - topPoints[0].y;
    // 判定縮小後的橘色按鈕區域 (配合 0.55 的比例)
    if (mouseIsPressed && dist(mouseX, mouseY, startX, startY) < (startD * 0.55) / 2) {
      gameState = 'PLAYING';
    }
  } else if (gameState === 'PLAYING') {
    drawPath();
    checkCollision();

    // 檢查是否觸碰藍色終點圓形按鈕
    let r = 12;
    let lastIdx = topPoints.length - 1;
    let endX = topPoints[lastIdx].x;
    let endY = (topPoints[lastIdx].y + bottomPoints[lastIdx].y) / 2;
    let endD = bottomPoints[lastIdx].y - topPoints[lastIdx].y;
    
    // 判定縮小後的藍色按鈕區域 (配合 0.55 的比例)
    if (dist(mouseX, mouseY, endX, endY) < (endD * 0.55 / 2 + r)) {
      gameState = 'WIN';
    }
  } else if (gameState === 'GAMEOVER') {
    fill(255, 50, 50);
    textAlign(CENTER);
    textSize(32);
    text("觸電失敗！\n點擊滑鼠重新開始", width / 2, height / 2);
  } else if (gameState === 'WIN') {
    fill(50, 255, 50);
    textAlign(CENTER);
    textSize(32);
    text("恭喜通關！\n點擊滑鼠重新挑戰", width / 2, height / 2);
  }

  drawPlayer(); // 確保白色圓線圈一直存在
}

function generatePath() {
  topPoints = [];
  bottomPoints = [];
  let anchorTop = [];
  let anchorBottom = [];
  let numAnchors = 5;
  let margin = 60; // 加入邊距，確保圓形港灣不會超出畫布
  let spacing = (width - margin * 2) / (numAnchors - 1);
  
  // 1. 先產生 5 個原始控制點
  for (let i = 0; i < numAnchors; i++) {
    let ty = i === 0 || i === numAnchors - 1 ? height / 2 - 25 : random(100, height - 150);
    let gap = random(60, 90); // 加寬路徑
    anchorTop.push({ x: margin + i * spacing, y: ty });
    anchorBottom.push({ x: margin + i * spacing, y: ty + gap });
  }

  // 2. 利用 curvePoint 將 5 個點細分化為平滑曲線點
  let res = 20; // 每個區段細分 20 個點
  for (let i = 0; i < numAnchors - 1; i++) {
    for (let t = 0; t <= res; t++) {
      let percent = t / res;
      // 取得 Catmull-Rom 曲線上的點座標
      let tx = lerp(anchorTop[i].x, anchorTop[i+1].x, percent);
      let ty = curvePoint(
        anchorTop[max(i-1, 0)].y, anchorTop[i].y, 
        anchorTop[i+1].y, anchorTop[min(i+2, numAnchors-1)].y, percent);
      let by = curvePoint(
        anchorBottom[max(i-1, 0)].y, anchorBottom[i].y, 
        anchorBottom[i+1].y, anchorBottom[min(i+2, numAnchors-1)].y, percent);
      
      topPoints.push({ x: tx, y: ty });
      bottomPoints.push({ x: tx, y: by });
    }
  }
}

function drawPath() {
  // 繪製路徑空間
  fill(100);
  stroke(255);
  strokeWeight(4); // 路徑邊緣稍微加粗
  
  let lastIdx = topPoints.length - 1;
  let startY = (topPoints[0].y + bottomPoints[0].y) / 2;
  let startR = (bottomPoints[0].y - topPoints[0].y) / 2;
  let endX = topPoints[lastIdx].x;
  let endY = (topPoints[lastIdx].y + bottomPoints[lastIdx].y) / 2;
  let endR = (bottomPoints[lastIdx].y - topPoints[lastIdx].y) / 2;

  beginShape();
  
  // --- 起點圓形港灣 (半圓弧度) ---
  // Catmull-Rom 曲線控制點
  curveVertex(topPoints[0].x, startY + startR); 
  
  curveVertex(topPoints[0].x, startY + startR);   // 下接合點
  curveVertex(topPoints[0].x - startR, startY);   // 最左側頂點
  curveVertex(topPoints[0].x, startY - startR);   // 上接合點

  // --- 上方路徑 ---
  for (let p of topPoints) {
    curveVertex(p.x, p.y);
  }

  // --- 終點圓形港灣 (半圓弧度) ---
  curveVertex(endX, endY - endR);                 // 上接合點
  curveVertex(endX + endR, endY);                 // 最右側頂點
  curveVertex(endX, endY + endR);                 // 下接合點

  // --- 下方路徑 (反向) ---
  for (let i = lastIdx; i >= 0; i--) {
    curveVertex(bottomPoints[i].x, bottomPoints[i].y);
  }

  // 閉合控制點與結尾
  curveVertex(topPoints[0].x, startY + startR);
  
  endShape(CLOSE);

  // 繪製黃色中心輔助線
  noFill();
  stroke(255, 255, 0, 180); // 黃色，稍微帶點透明度
  strokeWeight(3); // 輔助線加粗
  beginShape();
  if (topPoints.length > 0) {
    let firstMidY = (topPoints[0].y + bottomPoints[0].y) / 2;
    curveVertex(topPoints[0].x, firstMidY); // 起始控制點
    for (let i = 0; i < topPoints.length; i++) {
      let midY = (topPoints[i].y + bottomPoints[i].y) / 2;
      curveVertex(topPoints[i].x, midY);
    }
    let lastIdx = topPoints.length - 1;
    let lastMidY = (topPoints[lastIdx].y + bottomPoints[lastIdx].y) / 2;
    curveVertex(topPoints[lastIdx].x, lastMidY); // 結束控制點
  }
  endShape();

  // 繪製內嵌的起點與終點按鈕
  noStroke();
  let startX = topPoints[0].x;
  let startD = bottomPoints[0].y - topPoints[0].y;
  let endD = bottomPoints[lastIdx].y - topPoints[lastIdx].y;

  // 起點內核 (橘色)
  fill(255, 140, 0);
  ellipse(startX, startY, startD * 0.55, startD * 0.55);
  
  // 終點內核 (藍色)
  fill(0, 102, 255);
  ellipse(endX, endY, endD * 0.55, endD * 0.55);
}

function drawPlayer() {
  noFill();
  stroke(255);
  strokeWeight(2);
  ellipse(mouseX, mouseY, 24, 24); // 加大尺寸的圓線圈
}

function checkCollision() {
  let inSafeZone = false;
  let r = 12; // 圓圈半徑 (直徑 24 的一半)

  // 安全區域判定 1：起點港灣範圍內
  let startX = topPoints[0].x;
  let startY = (topPoints[0].y + bottomPoints[0].y) / 2;
  let startD = bottomPoints[0].y - topPoints[0].y;
  if (dist(mouseX, mouseY, startX, startY) < startD / 2 - 2) return;

  // 安全區域判定 2：終點港灣範圍內
  let lastIdx = topPoints.length - 1;
  let endX = topPoints[lastIdx].x;
  let endY = (topPoints[lastIdx].y + bottomPoints[lastIdx].y) / 2;
  let endD = bottomPoints[lastIdx].y - topPoints[lastIdx].y;
  if (dist(mouseX, mouseY, endX, endY) < endD / 2 - 2) return;

  // 尋找滑鼠當前所在的 X 區間
  for (let i = 0; i < topPoints.length - 1; i++) {
    if (mouseX >= topPoints[i].x && mouseX <= topPoints[i+1].x) {
      // 因為點已經很密集，這裡的線性插值會非常接近平滑曲線
      let t = (mouseX - topPoints[i].x) / (topPoints[i+1].x - topPoints[i].x);
      let currentTopY = lerp(topPoints[i].y, topPoints[i+1].y, t);
      let currentBottomY = lerp(bottomPoints[i].y, bottomPoints[i+1].y, t);

      // 碰撞判定：圓圈必須完全在上下牆壁之間，且不得觸碰邊界
      if (mouseY - r > currentTopY && mouseY + r < currentBottomY) {
        inSafeZone = true;
      }
      break;
    }
  }

  if (!inSafeZone) {
    gameState = 'GAMEOVER';
  }
}

function mousePressed() {
  if (gameState === 'GAMEOVER' || gameState === 'WIN') {
    generatePath();
    gameState = 'START';
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  generatePath();
}