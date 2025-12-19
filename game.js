/* game.js */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Elements
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const hud = document.getElementById('hud');
const scoreDisplay = document.getElementById('score-display');
const distanceDisplay = document.getElementById('distance-display');
const moodDisplay = document.getElementById('mood-display');
const balanceFill = document.getElementById('balance-fill');
const finalScoreText = document.getElementById('final-score');
const finalDistText = document.getElementById('final-distance');

// Buttons
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);

// Game State
let gameState = 'START'; // START, PLAYING, GAMEOVER
let score = 0;
let distance = 0;
let speed = 5;
let balance = 50; // 0 to 100
let frameCount = 0;

// Dimensions
let laneWidth;
let w, h;

function resize() {
    w = canvas.width = canvas.parentElement.clientWidth;
    h = canvas.height = canvas.parentElement.clientHeight;
    laneWidth = w / 3;
}
window.addEventListener('resize', resize);
resize();

// Assets (Procedural Drawing)
const MOODS = {
    HAPPY: '😊',
    NEUTRAL: '🙂',
    SAD: '😟',
    SICK: '🤢'
};

class Player {
    constructor() {
        this.lane = 1; // 0, 1, 2
        this.x = w / 2;
        this.targetX = w / 2;
        this.y = h - 150;
        this.width = 60;
        this.height = 70;
        this.mood = MOODS.HAPPY;
        this.moodTimer = 0;
    }

    update() {
        // Smooth movement (Lerp)
        this.targetX = (this.lane * laneWidth) + (laneWidth / 2);
        this.x += (this.targetX - this.x) * 0.2;

        // Mood reset
        if (this.moodTimer > 0) {
            this.moodTimer--;
        } else {
            this.mood = balance > 30 ? MOODS.HAPPY : MOODS.NEUTRAL;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Tilt animation
        const tilt = (this.x - this.targetX) * 0.05;
        ctx.rotate(tilt * Math.PI / 180);

        // Draw Uterus Mascot
        // Body (Pink)
        ctx.fillStyle = '#F48FB1';
        ctx.beginPath();
        ctx.moveTo(-25, -20);
        ctx.bezierCurveTo(-40, -40, 40, -40, 25, -20); // Top curve
        ctx.bezierCurveTo(35, 10, 15, 50, 0, 50); // Right side to bottom
        ctx.bezierCurveTo(-15, 50, -35, 10, -25, -20); // Left side
        ctx.fill();

        // Tubes/Arms
        ctx.strokeStyle = '#F48FB1';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-25, -25);
        ctx.quadraticCurveTo(-50, -30, -55, -10); // Left tube
        ctx.moveTo(25, -25);
        ctx.quadraticCurveTo(50, -30, 55, -10); // Right tube
        ctx.stroke();

        // Ovaries (Hands/Poms)
        ctx.fillStyle = '#F06292';
        ctx.beginPath();
        ctx.arc(-55, -10, 8, 0, Math.PI*2);
        ctx.arc(55, -10, 8, 0, Math.PI*2);
        ctx.fill();

        // Face
        ctx.fillStyle = '#880E4F';
        
        if (this.mood === MOODS.SAD || this.mood === MOODS.SICK) {
            // Sad Eyes
            ctx.beginPath(); ctx.arc(-10, -10, 3, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(10, -10, 3, 0, Math.PI*2); ctx.fill();
            // Sad Mouth
            ctx.beginPath();
            ctx.arc(0, 5, 8, Math.PI, 0); // Frown
            ctx.stroke();
        } else {
            // Happy Eyes
            ctx.beginPath();
            ctx.arc(-10, -10, 3, 0, Math.PI*2); // Left eye
            ctx.arc(10, -10, 3, 0, Math.PI*2); // Right eye
            ctx.fill();
            // Happy Mouth
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI); // Smile
            ctx.stroke();
            // Blush
            ctx.fillStyle = 'rgba(255,100,100,0.3)';
            ctx.beginPath(); ctx.arc(-18, -2, 5, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(18, -2, 5, 0, Math.PI*2); ctx.fill();
        }

        ctx.restore();
    }
}

class Item {
    constructor() {
        this.lane = Math.floor(Math.random() * 3);
        this.x = (this.lane * laneWidth) + (laneWidth / 2);
        this.y = -50;
        this.size = 40;
        
        // Randomize type
        const rand = Math.random();
        if (rand > 0.4) {
            this.type = 'BAD';
            this.icon = ['🍩', '🥤', '🍟', '🍭'][Math.floor(Math.random()*4)];
            this.color = '#ef9a9a';
        } else {
            this.type = 'GOOD';
            this.icon = ['🥗', '💧', '🍎', '🥑'][Math.floor(Math.random()*4)];
            this.color = '#A5D6A7';
        }
        
        this.markedForDeletion = false;
    }

    update() {
        this.y += speed;
        if (this.y > h + 50) this.markedForDeletion = true;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Halo
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI*2);
        ctx.fill();
        
        // Icon
        ctx.globalAlpha = 1.0;
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.icon, 0, 2);
        
        ctx.restore();
    }
}

let player;
let items = [];
let roadOffset = 0;

function initGame() {
    player = new Player();
    items = [];
    score = 0;
    distance = 0;
    speed = 6;
    balance = 50; // Start middle
    frameCount = 0;
    updateUI();
}

function startGame() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    hud.classList.remove('hidden');
    gameState = 'PLAYING';
    initGame();
    gameLoop();
}

function gameOver() {
    gameState = 'GAMEOVER';
    hud.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    finalScoreText.innerText = "Score: " + score;
    finalDistText.innerText = "Distance: " + Math.floor(distance) + "m";
}

function updateUI() {
    scoreDisplay.innerText = score;
    distanceDisplay.innerText = Math.floor(distance) + "m";
    moodDisplay.innerText = player.mood;
    balanceFill.style.width = balance + '%';
    
    // Balance Color Logic
    if (balance > 50) balanceFill.style.background = '#A5D6A7'; // Green
    else if (balance > 25) balanceFill.style.background = '#FFCC80'; // Orange
    else balanceFill.style.background = '#EF9A9A'; // Red
}

function spawnLogic() {
    if (frameCount % 60 === 0) { // Approx every 1 second
        items.push(new Item());
    }
    // Difficulty ramp
    if (frameCount % 600 === 0) {
        speed += 0.5;
    }
}

function gameLoop() {
    if (gameState !== 'PLAYING') return;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Road
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
    
    // Draw Lanes
    ctx.strokeStyle = '#E1BEE7';
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 20]);
    roadOffset = (roadOffset + speed) % 40;
    
    // Lane 1 divider
    ctx.beginPath();
    ctx.moveTo(laneWidth, -40 + roadOffset);
    ctx.lineTo(laneWidth, h);
    ctx.stroke();
    
    // Lane 2 divider
    ctx.beginPath();
    ctx.moveTo(laneWidth * 2, -40 + roadOffset);
    ctx.lineTo(laneWidth * 2, h);
    ctx.stroke();

    // 2. Logic Updates
    player.update();
    distance += speed / 20;
    frameCount++;
    spawnLogic();

    // 3. Items Loop
    items.forEach(item => {
        item.update();
        item.draw();

        // Collision Check
        const dy = item.y - player.y;
        const dx = item.x - player.targetX; // Check against lane center
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < 50 && !item.markedForDeletion) {
            item.markedForDeletion = true;
            
            if (item.type === 'GOOD') {
                score += 10;
                balance = Math.min(100, balance + 10);
                player.mood = MOODS.HAPPY;
                player.moodTimer = 30;
            } else {
                // Bad item
                balance = Math.max(0, balance - 20);
                player.mood = MOODS.SICK;
                player.moodTimer = 40;
                // Camera shake effect? (Simplifying to mood change)
            }
        }
    });

    // Remove old items
    items = items.filter(i => !i.markedForDeletion);

    // 4. Draw Player
    player.draw();

    // 5. Game Over Check
    balance -= 0.05; // Constant drain (Life decay mechanic)
    if (balance <= 0) {
        balance = 0;
        gameOver();
    }
    
    updateUI();

    requestAnimationFrame(gameLoop);
}

// Input Handling
window.addEventListener('keydown', (e) => {
    if (gameState !== 'PLAYING') return;
    if (e.key === 'ArrowLeft' || e.key === 'a') {
        if (player.lane > 0) player.lane--;
    }
    if (e.key === 'ArrowRight' || e.key === 'd') {
        if (player.lane < 2) player.lane++;
    }
});

// Touch/Click Handling
canvas.addEventListener('touchstart', handleTouch, false);
canvas.addEventListener('mousedown', handleTouch, false);

function handleTouch(e) {
    if (gameState !== 'PLAYING') return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;

    // Simple split screen controls
    if (x < w / 2) {
        if (player.lane > 0) player.lane--;
    } else {
        if (player.lane < 2) player.lane++;
    }
}