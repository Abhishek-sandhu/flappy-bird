// Game variables
let bird = document.getElementById('bird');
let birdShadow = document.getElementById('bird-shadow');
let particlesContainer = document.getElementById('particles');
let gameArea = document.getElementById('game-area');
let pipesContainer = document.getElementById('pipes');
let scoreDisplay = document.getElementById('score');
let startScreen = document.getElementById('start-screen');
let gameOverScreen = document.getElementById('game-over-screen');
let finalScoreDisplay = document.getElementById('final-score');
let highScoreDisplay = document.getElementById('high-score');
let bgMusic = document.getElementById('bg-music');

let gameWidth = window.innerWidth;
let gameHeight = window.innerHeight;
let birdY = gameHeight / 2;
let birdVelocity = 0;
let gravity = 0.6;
let jumpStrength = -12;
let score = 0;
let highScore = localStorage.getItem('flappyBirdHighScore') || 0;
let gameRunning = false;
let pipes = [];
let pipeSpeed = 2;
let pipeGap = 150;
let pipeWidth = 60;
let pipeSpawnRate = 120; // frames
let frameCount = 0;

// Audio context for sounds
let audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Function to play sound
function playSound(frequency, duration, type = 'sine', volume = 0.3) {
    let oscillator = audioContext.createOscillator();
    let gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

// Function to fade out background music
function fadeOutMusic(duration = 2000) {
    if (!bgMusic) return;
    let startVolume = bgMusic.volume;
    let fadeStep = startVolume / (duration / 100);
    let fadeInterval = setInterval(() => {
        if (bgMusic.volume > 0.01) {
            bgMusic.volume -= fadeStep;
        } else {
            bgMusic.pause();
            bgMusic.volume = startVolume; // Reset for next play
            clearInterval(fadeInterval);
        }
    }, 100);
}

// Start game
startScreen.addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', restartGame);

// Controls
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        jump();
    }
});

document.addEventListener('touchstart', jump);
document.addEventListener('click', (e) => {
    if (e.target.id !== 'restart-btn') jump();
});

function jump() {
    if (!gameRunning) return;
    birdVelocity = jumpStrength;
    bird.classList.remove('falling');
    playSound(400, 0.1); // Jump sound
    createParticles(birdY);
}

function createParticles(y) {
    for (let i = 0; i < 5; i++) {
        let particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = (50 + Math.random() * 20) + 'px';
        particle.style.top = (y + Math.random() * 20) + 'px';
        particlesContainer.appendChild(particle);
        setTimeout(() => particlesContainer.removeChild(particle), 500);
    }
}

function startGame() {
    startScreen.style.display = 'none';
    gameRunning = true;
    birdY = gameHeight / 2;
    birdVelocity = 0;
    score = 0;
    scoreDisplay.textContent = score;
    pipes = [];
    pipesContainer.innerHTML = '';
    pipeSpeed = 2;
    frameCount = 0;
    try {
        bgMusic.play();
    } catch (e) {
        console.log('Music not available');
    }
    gameLoop();
}

function restartGame() {
    gameOverScreen.style.display = 'none';
    startGame();
}

function gameLoop() {
    if (!gameRunning) return;

    // Update bird
    birdVelocity += gravity;
    birdY += birdVelocity;
    bird.style.top = birdY + 'px';
    birdShadow.style.top = (birdY + 35) + 'px';

    if (birdVelocity > 0) {
        bird.classList.add('falling');
    }

    // Check boundaries
    if (birdY < 0 || birdY + 30 > gameHeight - 50) { // Ground at gameHeight - 50
        gameOver();
        return;
    }

    // Spawn pipes
    frameCount++;
    if (frameCount % pipeSpawnRate === 0) {
        spawnPipe();
    }

    // Update pipes
    pipes.forEach((pipe, index) => {
        pipe.x -= pipeSpeed;
        pipe.element.style.left = pipe.x + 'px';

        // Check collision
        if (checkCollision(pipe)) {
            gameOver();
            return;
        }

        // Check if passed
        if (!pipe.passed && pipe.x + pipeWidth < 90) { // Bird left + width
            pipe.passed = true;
            score++;
            scoreDisplay.textContent = score;
            playSound(600, 0.1); // Point sound

            // Increase difficulty
            if (score % 10 === 0) {
                pipeSpeed += 0.2;
            }
        }

        // Remove off-screen pipes
        if (pipe.x < -pipeWidth) {
            pipesContainer.removeChild(pipe.element);
            pipes.splice(index, 1);
        }
    });

    requestAnimationFrame(gameLoop);
}

function spawnPipe() {
    let minGapTop = 50;
    let maxGapTop = gameHeight - pipeGap - 100; // Leave space for ground and some margin
    let gapTop = Math.random() * (maxGapTop - minGapTop) + minGapTop;

    let pipeTop = document.createElement('div');
    pipeTop.className = 'pipe pipe-top';
    pipeTop.style.height = gapTop + 'px';
    pipeTop.style.top = '0px';
    pipeTop.style.left = gameWidth + 'px';

    let pipeBottom = document.createElement('div');
    pipeBottom.className = 'pipe pipe-bottom';
    pipeBottom.style.height = (gameHeight - gapTop - pipeGap - 50) + 'px';
    pipeBottom.style.top = (gapTop + pipeGap) + 'px';
    pipeBottom.style.left = gameWidth + 'px';

    pipesContainer.appendChild(pipeTop);
    pipesContainer.appendChild(pipeBottom);

    pipes.push({ element: pipeTop, x: gameWidth, height: gapTop, passed: false });
    pipes.push({ element: pipeBottom, x: gameWidth, height: gameHeight - gapTop - pipeGap - 50, passed: false });
}

function checkCollision(pipe) {
    let birdRect = bird.getBoundingClientRect();
    let pipeRect = pipe.element.getBoundingClientRect();

    return !(birdRect.right < pipeRect.left ||
             birdRect.left > pipeRect.right ||
             birdRect.bottom < pipeRect.top ||
             birdRect.top > pipeRect.bottom);
}

function gameOver() {
    gameRunning = false;
    playSound(200, 0.5, 'sawtooth'); // Crash sound

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flappyBirdHighScore', highScore);
    }

    finalScoreDisplay.textContent = score;
    highScoreDisplay.textContent = highScore;
    fadeOutMusic();
    gameOverScreen.style.display = 'flex';
}

// Initialize high score display
highScoreDisplay.textContent = highScore;

// Handle window resize
window.addEventListener('resize', () => {
    gameWidth = window.innerWidth;
    gameHeight = window.innerHeight;
    if (!gameRunning) {
        birdY = gameHeight / 2;
        bird.style.top = birdY + 'px';
        birdShadow.style.top = (birdY + 35) + 'px';
    }
});