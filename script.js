document.addEventListener('DOMContentLoaded', () => {
    // Handle loading screen
    const loadingScreen = document.getElementById('loading-screen');
    
    // Simulate loading time for better UX
    setTimeout(() => {
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.visibility = 'hidden';
                // Play welcome animation
                playWelcomeAnimation();
            }, 500);
        }
    }, 1500);
    
    // Game variables
    let currentPlayer = 'x';
    let gameActive = true;
    let gameState = ['', '', '', '', '', '', '', '', ''];
    let moves = 0;
    let gameMode = 'player'; // Default game mode: 'player' or 'computer'
    let difficulty = 'medium'; // Default AI difficulty: 'easy', 'medium', 'hard'
    
    // Statistics tracking
    let stats = {
        gamesPlayed: 0,
        xWins: 0,
        oWins: 0,
        ties: 0
    };
    
    // Load stats from localStorage if available
    loadStats();
    
    // DOM elements
    const statusMessage = document.getElementById('status-message');
    const resetButton = document.getElementById('reset-btn');
    const playAgainButton = document.getElementById('play-again-btn');
    const cells = document.querySelectorAll('.cell');
    const winModal = document.getElementById('win-modal');
    const winnerMessage = document.getElementById('winner-message');
    const winAnimation = document.getElementById('win-animation');
    const playerX = document.getElementById('player-x');
    const playerO = document.getElementById('player-o');
    const vsPlayerBtn = document.getElementById('vs-player-btn');
    const vsComputerBtn = document.getElementById('vs-computer-btn');
    const gameContainer = document.querySelector('.game-container');
    const difficultySelector = document.getElementById('difficulty-selector');
    const easyBtn = document.getElementById('easy-btn');
    const mediumBtn = document.getElementById('medium-btn');
    const hardBtn = document.getElementById('hard-btn');
    
    // Stats elements
    const gamesPlayedEl = document.getElementById('games-played');
    const xWinsEl = document.getElementById('x-wins');
    const oWinsEl = document.getElementById('o-wins');
    const tiesEl = document.getElementById('ties');
    
    // Update stats display
    updateStatsDisplay();
    
    // Winning combinations
    const winningConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    
    // Event listeners
    cells.forEach(cell => cell.addEventListener('click', cellClicked));
    resetButton.addEventListener('click', resetGame);
    playAgainButton.addEventListener('click', resetGame);
    vsPlayerBtn.addEventListener('click', () => setGameMode('player'));
    vsComputerBtn.addEventListener('click', () => setGameMode('computer'));
    
    // Difficulty buttons event listeners
    easyBtn.addEventListener('click', () => setDifficulty('easy'));
    mediumBtn.addEventListener('click', () => setDifficulty('medium'));
    hardBtn.addEventListener('click', () => setDifficulty('hard'));
    
    // Add ripple effect to buttons
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(button => {
        button.addEventListener('click', createRippleEffect);
    });
    
    // Function to set difficulty
    function setDifficulty(level) {
        difficulty = level;
        
        // Update UI
        easyBtn.classList.remove('active');
        mediumBtn.classList.remove('active');
        hardBtn.classList.remove('active');
        
        switch(level) {
            case 'easy':
                easyBtn.classList.add('active');
                break;
            case 'medium':
                mediumBtn.classList.add('active');
                break;
            case 'hard':
                hardBtn.classList.add('active');
                break;
        }
        
        // Save preference to localStorage
        localStorage.setItem('ticTacToeDifficulty', level);
        
        // If in the middle of a game against computer, reset
        if (gameMode === 'computer' && gameActive && !allFieldsFilled()) {
            setTimeout(resetGame, 300);
        }
    }
    
    // Check if all fields are filled
    function allFieldsFilled() {
        return !gameState.includes('');
    }
    
    // Load saved difficulty if it exists
    if (localStorage.getItem('ticTacToeDifficulty')) {
        setDifficulty(localStorage.getItem('ticTacToeDifficulty'));
    }
    
    // Game mode selection
    function setGameMode(mode) {
        gameMode = mode;
        resetGame();
        
        // Add transition effect to game container
        gameContainer.classList.add('theme-transition');
        setTimeout(() => {
            gameContainer.classList.remove('theme-transition');
        }, 500);
        
        // Update UI
        if (mode === 'player') {
            vsPlayerBtn.classList.add('active');
            vsComputerBtn.classList.remove('active');
            playerX.querySelector('.player-name').textContent = 'Player X';
            playerO.querySelector('.player-name').textContent = 'Player O';
            
            // Hide difficulty selector
            difficultySelector.style.display = 'none';
            
            // Remove computer-mode class
            gameContainer.classList.remove('computer-mode');
        } else {
            vsPlayerBtn.classList.remove('active');
            vsComputerBtn.classList.add('active');
            playerX.querySelector('.player-name').textContent = 'You';
            playerO.querySelector('.player-name').textContent = 'Computer';
            
            // Show difficulty selector with animation
            difficultySelector.style.display = 'block';
            difficultySelector.style.animation = 'none';
            void difficultySelector.offsetWidth; // Force reflow
            difficultySelector.style.animation = 'fadeInDown 0.5s forwards';
            
            // Add computer-mode class for height adjustment
            gameContainer.classList.add('computer-mode');
        }
        
        // Ensure consistent colors - always use same colors regardless of game mode
        playerX.querySelector('.player-icon').style.color = 'var(--x-color)';
        playerO.querySelector('.player-icon').style.color = 'var(--o-color)';
        
        // No animation for buttons
        const activeBtn = mode === 'player' ? vsPlayerBtn : vsComputerBtn;
        activeBtn.style.animation = 'none';
        
        // Save preference to localStorage
        localStorage.setItem('ticTacToeGameMode', mode);
    }
    
    // Load saved game mode if it exists
    if (localStorage.getItem('ticTacToeGameMode')) {
        setGameMode(localStorage.getItem('ticTacToeGameMode'));
    } else {
        // Hide difficulty selector initially if in player mode
        if (gameMode === 'player') {
            difficultySelector.style.display = 'none';
        }
    }
    
    // Main game logic
    function cellClicked() {
        const cellIndex = parseInt(this.getAttribute('data-cell-index'));
        
        if (gameState[cellIndex] !== '' || !gameActive) {
            // Add shake effect if cell is already taken
            this.classList.add('shake');
            setTimeout(() => {
                this.classList.remove('shake');
            }, 500);
            return;
        }
        
        updateCell(this, cellIndex);
        
        // Check game status after player move
        if (checkGameStatus()) {
            return; // Game ended
        }
        
        // If computer mode and game still active, make computer move
        if (gameMode === 'computer' && gameActive && currentPlayer === 'o') {
            // Show "thinking" indicator
            statusMessage.textContent = 'Computer is thinking...';
            statusMessage.style.animation = 'thinking-pulse 1.5s infinite alternate';
            
            setTimeout(() => {
                makeComputerMove();
                // Reset animation
                statusMessage.style.animation = '';
            }, 700); // Delay for better UX
        }
    }
    
    function updateCell(cell, index) {
        gameState[index] = currentPlayer;
        
        // Clear cell content before adding new content
        cell.innerHTML = '';
        
        // Add the current player's mark
        cell.textContent = currentPlayer.toUpperCase();
        
        // Apply proper styling class
        cell.classList.add(currentPlayer);
        
        // Ensure consistent coloring with enhanced visibility
        // Always use the same colors for X and O regardless of player or computer
        if (currentPlayer === 'x') {
            cell.style.color = 'var(--x-color)';
            cell.style.textShadow = '0 0 15px var(--x-color)';
            cell.style.fontSize = '60px';
            cell.style.fontWeight = '800';
            cell.style.background = 'rgba(40, 20, 60, 0.9)'; // Darker background for X
            cell.style.border = '1px solid rgba(255, 77, 136, 0.5)'; // Colored border
        } else {
            cell.style.color = 'var(--o-color)';
            cell.style.textShadow = '0 0 15px var(--o-color)';
            cell.style.fontSize = '60px';
            cell.style.fontWeight = '800';
            cell.style.background = 'rgba(20, 40, 60, 0.9)'; // Darker background for O
            cell.style.border = '1px solid rgba(0, 191, 255, 0.5)'; // Colored border
        }
        
        // Add stronger border glow
        cell.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.5), inset 0 0 25px ' + 
            (currentPlayer === 'x' ? 'rgba(255, 77, 136, 0.3)' : 'rgba(0, 191, 255, 0.3)');
        
        // Increase cell content visibility with a background halo
        const circle = document.createElement('div');
        circle.style.position = 'absolute';
        circle.style.width = '85%';
        circle.style.height = '85%';
        circle.style.borderRadius = '50%';
        circle.style.background = currentPlayer === 'x' 
            ? 'radial-gradient(circle, rgba(255, 77, 136, 0.15) 0%, transparent 70%)' 
            : 'radial-gradient(circle, rgba(0, 191, 255, 0.15) 0%, transparent 70%)';
        circle.style.zIndex = '-1';
        
        // Add a subtle pulsing animation to the halo
        circle.style.animation = 'pulse-glow 2s infinite alternate';
        cell.appendChild(circle);
        
        moves++;
        
        // Add animation effect
        cell.style.animation = '';
        void cell.offsetWidth; // Force reflow
        cell.style.animation = `flip-in 0.5s forwards`;
        
        // Add particles on click with consistent colors
        createClickParticles(cell, currentPlayer);
    }
    
    function createClickParticles(cell, player) {
        const rect = cell.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        // Always use consistent colors for X and O: X = pink/red, O = blue
        const color = player === 'x' ? '#ff4d88' : '#00bfff';
        
        // Create more particles and make them more dynamic
        for (let i = 0; i < 30; i++) { // Increased from 20 to 30 particles
            const particle = document.createElement('div');
            particle.classList.add('click-particle');
            
            // Position at center of cell
            particle.style.position = 'fixed';
            particle.style.left = `${centerX}px`;
            particle.style.top = `${centerY}px`;
            
            // Create varied particle styles
            const size = Math.random() * 12 + 6; // Larger particles
            const opacity = Math.random() * 0.8 + 0.4; // Higher opacity
            const isCircle = Math.random() > 0.3;
            
            // Style
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.backgroundColor = color;
            particle.style.borderRadius = isCircle ? '50%' : `${Math.random() * 4 + 2}px`;
            particle.style.zIndex = '10';
            particle.style.opacity = opacity.toString();
            particle.style.boxShadow = `0 0 ${size * 2}px ${color}`; // Stronger glow
            
            // Set animation
            const angle = (i / 30) * 2 * Math.PI + (Math.random() * 0.5);
            const distance = 40 + Math.random() * 80; // Greater distance
            const duration = 700 + Math.random() * 500; // Longer duration
            
            document.body.appendChild(particle);
            
            // Create more dynamic animations
            particle.animate(
                [
                    { 
                        transform: 'translate(-50%, -50%) scale(1.2) rotate(0deg)', // Start slightly larger
                        opacity: opacity
                    },
                    { 
                        transform: `translate(
                            calc(-50% + ${Math.cos(angle) * distance}px), 
                            calc(-50% + ${Math.sin(angle) * distance}px)
                        ) scale(${Math.random() * 0.7}) rotate(${Math.random() * 360}deg)`,
                        opacity: 0 
                    }
                ], 
                {
                    duration: duration,
                    easing: 'cubic-bezier(0.1, 0.8, 0.2, 1)'
                }
            );
            
            // Remove after animation
            setTimeout(() => {
                particle.remove();
            }, duration);
        }
        
        // Add a pulsing flash effect to the cell
        const flash = document.createElement('div');
        flash.style.position = 'absolute';
        flash.style.width = '100%';
        flash.style.height = '100%';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.borderRadius = 'inherit';
        flash.style.backgroundColor = player === 'x' ? 'rgba(255, 77, 136, 0.3)' : 'rgba(0, 191, 255, 0.3)';
        flash.style.zIndex = '1';
        cell.appendChild(flash);
        
        // Animate and remove the flash
        flash.animate(
            [
                { opacity: 0.7 },
                { opacity: 0 }
            ],
            {
                duration: 600,
                easing: 'ease-out'
            }
        );
        
        setTimeout(() => {
            flash.remove();
        }, 600);
    }
    
    function checkGameStatus() {
        if (checkWin()) {
            gameActive = false;
            return true;
        }
        
        if (checkTie()) {
            gameActive = false;
            return true;
        }
        
        changePlayer();
        return false;
    }
    
    function checkWin() {
        let gameWon = false;
        let winningCombination = null;
        
        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];
            
            if (
                gameState[a] !== '' &&
                gameState[a] === gameState[b] &&
                gameState[a] === gameState[c]
            ) {
                gameWon = true;
                winningCombination = winningConditions[i];
                break;
            }
        }
        
        if (gameWon) {
            highlightWinningCells(winningCombination);
            
            // Update statistics
            stats.gamesPlayed++;
            if (currentPlayer === 'x') {
                stats.xWins++;
            } else {
                stats.oWins++;
            }
            saveStats();
            updateStatsDisplay();
            
            // Change message based on game mode
            let winMessage;
            if (gameMode === 'computer' && currentPlayer === 'o') {
                winMessage = 'Computer Wins!';
            } else if (gameMode === 'computer' && currentPlayer === 'x') {
                winMessage = 'You Win!';
            } else {
                winMessage = `Player ${currentPlayer.toUpperCase()} Wins!`;
            }
            
            showWinModal(winMessage);
            return true;
        }
        
        return false;
    }
    
    function checkTie() {
        if (moves === 9) {
            // Update statistics
            stats.gamesPlayed++;
            stats.ties++;
            saveStats();
            updateStatsDisplay();
            
            showWinModal('It\'s a Tie!');
            return true;
        }
        return false;
    }
    
    function changePlayer() {
        // Update player indicators
        playerX.classList.toggle('active');
        playerO.classList.toggle('active');
        
        // Add transition effect
        const prevActive = currentPlayer === 'x' ? playerX : playerO;
        const nextActive = currentPlayer === 'x' ? playerO : playerX;
        
        prevActive.style.transition = 'all 0.3s ease';
        nextActive.style.transition = 'all 0.3s ease';
        
        // Update current player
        currentPlayer = currentPlayer === 'x' ? 'o' : 'x';
        
        // Update status message based on game mode
        if (gameMode === 'computer' && currentPlayer === 'o') {
            statusMessage.textContent = 'Computer\'s Turn';
            playerO.querySelector('.player-name').textContent = 'Computer';
            playerO.querySelector('.player-icon').style.color = 'var(--o-color)';
        } else if (gameMode === 'computer' && currentPlayer === 'x') {
            statusMessage.textContent = 'Your Turn';
            playerX.querySelector('.player-name').textContent = 'You';
            playerX.querySelector('.player-icon').style.color = 'var(--x-color)';
        } else {
            statusMessage.textContent = `Player ${currentPlayer.toUpperCase()}'s Turn`;
            playerX.querySelector('.player-name').textContent = 'Player X';
            playerO.querySelector('.player-name').textContent = 'Player O';
            playerX.querySelector('.player-icon').style.color = 'var(--x-color)';
            playerO.querySelector('.player-icon').style.color = 'var(--o-color)';
        }
        
        // Add animation to status message
        statusMessage.style.animation = 'none';
        void statusMessage.offsetWidth; // Force reflow
        statusMessage.style.animation = 'status-update 0.5s ease';
    }
    
    function highlightWinningCells(combination) {
        combination.forEach(index => {
            cells[index].classList.add('win');
        });
        
        // Create connecting line for winning cells
        drawWinningLine(combination);
    }
    
    function drawWinningLine(combination) {
        // Get the first and last cells in the winning combination
        const firstCell = cells[combination[0]];
        const lastCell = cells[combination[2]];
        
        // Get positions
        const firstRect = firstCell.getBoundingClientRect();
        const lastRect = lastCell.getBoundingClientRect();
        
        // Calculate center points
        const startX = firstRect.left + firstRect.width / 2;
        const startY = firstRect.top + firstRect.height / 2;
        const endX = lastRect.left + lastRect.width / 2;
        const endY = lastRect.top + lastRect.height / 2;
        
        // Create line element
        const line = document.createElement('div');
        line.classList.add('winning-line');
        
        // Calculate angle and length
        const dx = endX - startX;
        const dy = endY - startY;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const length = Math.sqrt(dx * dx + dy * dy);
        
        // Get the winning player symbol from game state
        const winningPlayer = gameState[combination[0]];
        // Set color based on the symbol (X=red, O=blue) regardless of who's playing
        const lineColor = winningPlayer === 'x' ? '#ff4d88' : '#00bfff';
        
        // Set styles
        line.style.position = 'fixed';
        line.style.width = `${length}px`;
        line.style.height = '5px';
        line.style.top = `${startY}px`;
        line.style.left = `${startX}px`;
        line.style.transformOrigin = 'left center';
        line.style.transform = `rotate(${angle}deg)`;
        line.style.background = `linear-gradient(90deg, ${lineColor}, ${lineColor})`;
        line.style.boxShadow = `0 0 10px ${lineColor}`;
        line.style.opacity = '0';
        line.style.zIndex = '1';
        
        document.body.appendChild(line);
        
        // Animate line
        setTimeout(() => {
            line.style.transition = 'all 0.5s ease';
            line.style.opacity = '0.7';
        }, 100);
    }
    
    function showWinModal(message) {
        winnerMessage.textContent = message;
        
        // Create player symbol for win animation with consistent coloring
        if (message.includes('Wins')) {
            const winningSymbol = message.includes('X') ? 'x' : 'o';
            winAnimation.textContent = winningSymbol.toUpperCase();
            winAnimation.className = 'win-animation ' + winningSymbol;
            
            // Ensure consistent coloring
            if (winningSymbol === 'x') {
                winAnimation.style.color = 'var(--x-color)';
                winAnimation.style.textShadow = '0 0 20px var(--x-color)';
                
                // Add trophy icon for winner
                const trophy = document.createElement('div');
                trophy.innerHTML = '🏆';
                trophy.style.position = 'absolute';
                trophy.style.fontSize = '30px';
                trophy.style.top = '-20px';
                trophy.style.right = '-10px';
                trophy.style.animation = 'bounce 1s infinite alternate';
                winAnimation.appendChild(trophy);
                
                // Add extra glow effect
                winAnimation.style.boxShadow = `0 0 30px var(--x-color)`;
                winAnimation.style.animation = 'winner-pulse 1.5s infinite alternate, rotate-winner 8s linear infinite';
            } else {
                winAnimation.style.color = 'var(--o-color)';
                winAnimation.style.textShadow = '0 0 20px var(--o-color)';
                
                // Add trophy icon for winner
                const trophy = document.createElement('div');
                trophy.innerHTML = '🏆';
                trophy.style.position = 'absolute';
                trophy.style.fontSize = '30px';
                trophy.style.top = '-20px';
                trophy.style.right = '-10px';
                trophy.style.animation = 'bounce 1s infinite alternate';
                winAnimation.appendChild(trophy);
                
                // Add extra glow effect
                winAnimation.style.boxShadow = `0 0 30px var(--o-color)`;
                winAnimation.style.animation = 'winner-pulse 1.5s infinite alternate, rotate-winner 8s linear infinite';
            }
        } else {
            // Enhanced tie animation
            winAnimation.innerHTML = '';
            
            // Create a handshake animation with animated hands
            const leftHand = document.createElement('div');
            leftHand.textContent = '👊';
            leftHand.style.fontSize = '40px';
            leftHand.style.position = 'absolute';
            leftHand.style.left = '15px';
            leftHand.style.transform = 'rotate(-45deg)';
            leftHand.style.animation = 'hand-shake-left 1s infinite alternate';
            
            const rightHand = document.createElement('div');
            rightHand.textContent = '👊';
            rightHand.style.fontSize = '40px';
            rightHand.style.position = 'absolute';
            rightHand.style.right = '15px';
            rightHand.style.transform = 'rotate(45deg)';
            rightHand.style.animation = 'hand-shake-right 1s infinite alternate';
            
            // Create a tie text
            const tieText = document.createElement('div');
            tieText.textContent = 'TIE';
            tieText.style.fontSize = '32px';
            tieText.style.fontWeight = 'bold';
            tieText.style.background = 'linear-gradient(45deg, var(--x-color), var(--o-color))';
            tieText.style.WebkitBackgroundClip = 'text';
            tieText.style.backgroundClip = 'text';
            tieText.style.color = 'transparent';
            tieText.style.animation = 'pulse-text 1.5s infinite alternate';
            
            winAnimation.appendChild(leftHand);
            winAnimation.appendChild(rightHand);
            winAnimation.appendChild(tieText);
            winAnimation.className = 'win-animation tie';
        }
        
        // Show modal with delay
        setTimeout(() => {
            winModal.classList.add('show');
            createConfetti();
            
            // Play success sound effect (visual animation if sound not available)
            playSuccessEffect();
        }, 800);
    }
    
    function playSuccessEffect() {
        // Create visual effect instead of sound
        const container = document.querySelector('.modal-content');
        container.style.animation = 'none';
        void container.offsetWidth; // Force reflow
        container.style.animation = 'success-pulse 0.5s ease forwards, modal-glow 2s infinite alternate';
        
        // Add burst effect particles around the modal
        const colors = ['var(--x-color)', 'var(--o-color)', 'var(--primary-color)'];
        const burstCount = 30;
        
        for (let i = 0; i < burstCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'success-particle';
            const size = 5 + Math.random() * 15;
            const angle = (i / burstCount) * 360;
            const distance = 100 + Math.random() * 100;
            const delay = Math.random() * 0.3;
            const duration = 0.6 + Math.random() * 0.8;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.backgroundColor = color;
            particle.style.position = 'absolute';
            particle.style.borderRadius = '50%';
            particle.style.top = '50%';
            particle.style.left = '50%';
            particle.style.transform = 'translate(-50%, -50%)';
            particle.style.boxShadow = `0 0 ${size/2}px ${color}`;
            particle.style.zIndex = '5';
            
            container.appendChild(particle);
            
            // Animate the particle
            particle.animate([
                { 
                    transform: 'translate(-50%, -50%) scale(0)',
                    opacity: 1
                },
                { 
                    transform: `translate(calc(-50% + ${Math.cos(angle * Math.PI / 180) * distance}px), 
                               calc(-50% + ${Math.sin(angle * Math.PI / 180) * distance}px)) scale(1)`,
                    opacity: 0
                }
            ], {
                duration: duration * 1000,
                delay: delay * 1000,
                easing: 'cubic-bezier(0.1, 0.8, 0.2, 1)',
                fill: 'forwards'
            });
            
            // Remove particles after animation
            setTimeout(() => {
                particle.remove();
            }, (duration + delay) * 1000 + 100);
        }
    }
    
    function resetGame() {
        gameActive = true;
        currentPlayer = 'x';
        gameState = ['', '', '', '', '', '', '', '', ''];
        moves = 0;
        
        // Update status message based on game mode
        if (gameMode === 'computer') {
            statusMessage.textContent = 'Your Turn';
            playerX.querySelector('.player-name').textContent = 'You';
            playerO.querySelector('.player-name').textContent = 'Computer';
        } else {
            statusMessage.textContent = 'Player X\'s Turn';
            playerX.querySelector('.player-name').textContent = 'Player X';
            playerO.querySelector('.player-name').textContent = 'Player O';
        }
        
        // Update player indicators
        playerX.classList.add('active');
        playerO.classList.remove('active');
        
        // Ensure consistent colors
        playerX.querySelector('.player-icon').style.color = 'var(--x-color)';
        playerO.querySelector('.player-icon').style.color = 'var(--o-color)';
        
        // Reset all cells
        cells.forEach(cell => {
            cell.classList.remove('x', 'o', 'win');
            cell.textContent = '';
            cell.style.animation = '';
        });
        
        // Hide modal
        winModal.classList.remove('show');
        
        // Clear confetti
        document.querySelectorAll('.confetti-piece').forEach(piece => piece.remove());
        
        // Remove winning lines
        document.querySelectorAll('.winning-line').forEach(line => line.remove());
        
        // Play reset animation
        cells.forEach((cell, index) => {
            cell.style.animation = `reset-pulse 0.5s ${index * 0.05}s ease both`;
        });
        
        // Add transition effect to game container
        gameContainer.classList.add('theme-transition');
        setTimeout(() => {
            gameContainer.classList.remove('theme-transition');
        }, 500);
    }
    
    // Computer AI logic
    function makeComputerMove() {
        // Prevent any actions if the game is not active
        if (!gameActive) return;
        
        let bestMove;
        
        // Different AI behavior based on difficulty
        switch(difficulty) {
            case 'easy':
                // Easy: Random moves
                bestMove = makeRandomMove();
                break;
                
            case 'medium':
                // Medium: Mix of smart and random moves
                if (Math.random() < 0.6) { // 60% chance of making a smart move
                    bestMove = findBestMove('o');
                    if (bestMove === -1) {
                        bestMove = makeRandomMove();
                    }
                } else {
                    bestMove = makeRandomMove();
                }
                break;
                
            case 'hard':
            default:
                // Hard: Always makes the best move
                bestMove = findBestMove('o');
                if (bestMove === -1) {
                    bestMove = makeRandomMove();
                }
                break;
        }
        
        // Safety check - if no best move is found (shouldn't happen), pick a random open cell
        if (bestMove === undefined || bestMove === -1) {
            bestMove = makeRandomMove();
        }
        
        // Add a thinking delay based on difficulty
        let thinkingTime = 300; // Default medium thinking time
        
        if (difficulty === 'easy') {
            thinkingTime = 400 + Math.random() * 400; // Slower for easy
        } else if (difficulty === 'hard') {
            thinkingTime = 200 + Math.random() * 200; // Faster for hard
        }
        
        // Delay the computer's move slightly for better UX
        setTimeout(() => {
            // Add a "preview" effect before making the move
            const targetCell = document.querySelector(`[data-cell-index="${bestMove}"]`);
            if (targetCell) {
                // Preview effect
                targetCell.setAttribute('data-preview', 'true');
                targetCell.classList.add('o-preview');
                
                // Make the actual move after a brief preview
                setTimeout(() => {
                    targetCell.removeAttribute('data-preview');
                    targetCell.classList.remove('o-preview');
                    makeMove(bestMove);
                }, 300);
            }
        }, thinkingTime);
    }
    
    // Function to make a random move
    function makeRandomMove() {
        const emptyCells = gameState.reduce((acc, cell, index) => {
            if (cell === '') acc.push(index);
            return acc;
        }, []);
        
        if (emptyCells.length > 0) {
            return emptyCells[Math.floor(Math.random() * emptyCells.length)];
        }
        return -1;
    }
    
    function findBestMove(player) {
        // Check for potential win or block
        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];
            
            // Check if two cells are filled with the same symbol and the third is empty
            if (gameState[a] === player && gameState[b] === player && gameState[c] === '') {
                return c;
            }
            if (gameState[a] === player && gameState[c] === player && gameState[b] === '') {
                return b;
            }
            if (gameState[b] === player && gameState[c] === player && gameState[a] === '') {
                return a;
            }
        }
        
        return -1; // No winning/blocking move found
    }
    
    function makeMove(cellIndex) {
        const cell = document.querySelector(`[data-cell-index="${cellIndex}"]`);
        updateCell(cell, cellIndex);
        checkGameStatus();
    }
    
    // Confetti animation
    function createConfetti() {
        const confettiContainer = document.querySelector('.confetti');
        // Use consistent theme colors for confetti
        const colors = ['#ff4d88', '#00bfff', '#9966ff', '#ff66cc', '#33ccff'];
        
        // Clean previous confetti
        confettiContainer.innerHTML = '';
        
        // Create confetti pieces
        for (let i = 0; i < 100; i++) {
            const piece = document.createElement('div');
            piece.classList.add('confetti-piece');
            
            // Random properties
            const size = Math.random() * 10 + 5;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const left = Math.random() * 100;
            const delay = Math.random() * 3;
            const duration = Math.random() * 3 + 3;
            
            // Apply styles
            piece.style.width = `${size}px`;
            piece.style.height = `${size}px`;
            piece.style.background = color;
            piece.style.left = `${left}%`;
            piece.style.animationDelay = `${delay}s`;
            piece.style.animationDuration = `${duration}s`;
            
            // Random shape
            if (Math.random() > 0.5) {
                piece.style.borderRadius = '50%';
            } else if (Math.random() > 0.5) {
                piece.style.borderRadius = '2px';
                piece.style.transform = `rotate(${Math.random() * 360}deg)`;
            }
            
            // Add animation
            piece.style.animation = `confetti-fall ${duration}s ease-in-out ${delay}s forwards`;
            
            confettiContainer.appendChild(piece);
        }
    }
    
    // Define animations
    const styleSheet = document.createElement('style');
    styleSheet.innerHTML = `
        @keyframes confetti-fall {
            0% {
                transform: translateY(-20px) rotate(0deg);
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            100% {
                transform: translateY(300px) rotate(720deg);
                opacity: 0;
            }
        }
        
        @keyframes status-update {
            0% {
                transform: scale(0.95);
                opacity: 0.7;
            }
            50% {
                transform: scale(1.05);
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }
        
        @keyframes thinking-pulse {
            0% {
                opacity: 0.7;
            }
            100% {
                opacity: 1;
            }
        }
        
        @keyframes success-pulse {
            0% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.05);
            }
            100% {
                transform: scale(1);
            }
        }
        
        @keyframes reset-pulse {
            0% {
                transform: scale(0.9);
                opacity: 0.5;
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }
        
        @keyframes shake {
            0%, 100% {
                transform: translateX(0);
            }
            20%, 60% {
                transform: translateX(-5px);
            }
            40%, 80% {
                transform: translateX(5px);
            }
        }
        
        .shake {
            animation: shake 0.5s;
        }
        
        .ripple {
            position: absolute;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple-effect 0.6s linear;
        }
        
        @keyframes ripple-effect {
            to {
                transform: scale(2.5);
                opacity: 0;
            }
        }
        
        @keyframes flip-in {
            0% {
                transform: scale(0) rotate(180deg);
                opacity: 0;
            }
            50% {
                transform: scale(1.2) rotate(90deg);
                opacity: 1;
            }
            100% {
                transform: scale(1) rotate(0deg);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(styleSheet);
    
    // Initialize game hover effects
    cells.forEach(cell => {
        cell.addEventListener('mouseenter', () => {
            if (gameState[cell.getAttribute('data-cell-index')] === '' && gameActive) {
                // Enhanced hover effect
                cell.style.boxShadow = '0 0 20px var(--glow-color), inset 0 0 15px var(--glow-color)';
                cell.style.transform = 'translateY(-5px)';
                cell.style.background = 'rgba(40, 40, 80, 0.9)'; // Darker background on hover
                
                // Preview current player's symbol with consistent coloring
                if (!cell.dataset.preview) {
                    cell.dataset.preview = 'true';
                    cell.textContent = currentPlayer.toUpperCase();
                    
                    // Always use consistent colors regardless of who's playing
                    if (currentPlayer === 'x') {
                        cell.classList.add('x-preview');
                        cell.style.color = 'var(--x-color)';
                        cell.style.textShadow = '0 0 10px var(--x-color)';
                        cell.style.opacity = '0.8'; // More visible preview
                        cell.style.fontSize = '58px'; // Larger preview text
                    } else {
                        cell.classList.add('o-preview');
                        cell.style.color = 'var(--o-color)';
                        cell.style.textShadow = '0 0 10px var(--o-color)';
                        cell.style.opacity = '0.8'; // More visible preview
                        cell.style.fontSize = '58px'; // Larger preview text
                    }
                    
                    // Add subtle background glow for preview
                    const previewGlow = document.createElement('div');
                    previewGlow.classList.add('preview-glow');
                    previewGlow.style.position = 'absolute';
                    previewGlow.style.width = '80%';
                    previewGlow.style.height = '80%';
                    previewGlow.style.borderRadius = '50%';
                    previewGlow.style.background = currentPlayer === 'x' 
                        ? 'radial-gradient(circle, rgba(255, 77, 136, 0.1) 0%, transparent 70%)' 
                        : 'radial-gradient(circle, rgba(0, 191, 255, 0.1) 0%, transparent 70%)';
                    previewGlow.style.zIndex = '-1';
                    cell.appendChild(previewGlow);
                }
            }
        });
        
        cell.addEventListener('mouseleave', () => {
            if (gameState[cell.getAttribute('data-cell-index')] === '' && gameActive) {
                cell.style.boxShadow = '';
                cell.style.transform = '';
                cell.style.background = 'rgba(30, 30, 60, 0.8)'; // Reset background
                
                if (cell.dataset.preview) {
                    delete cell.dataset.preview;
                    cell.textContent = '';
                    cell.classList.remove('x-preview', 'o-preview');
                    
                    // Remove the preview glow
                    const previewGlow = cell.querySelector('.preview-glow');
                    if (previewGlow) {
                        previewGlow.remove();
                    }
                }
            }
        });
    });
    
    // Start game animations
    playWelcomeAnimation();
    
    function playWelcomeAnimation() {
        // Create a more dramatic entrance for the game
        const gameContainer = document.querySelector('.game-container');
        const cells = document.querySelectorAll('.cell');
        const buttons = document.querySelectorAll('button');
        const header = document.querySelector('header');
        const gameInfo = document.querySelector('.game-info');
        const footer = document.querySelector('footer');
        
        // Initial state - hide everything
        gameContainer.style.opacity = '0';
        header.style.opacity = '0';
        gameInfo.style.opacity = '0';
        footer.style.opacity = '0';
        cells.forEach(cell => {
            cell.style.opacity = '0';
            cell.style.transform = 'scale(0.8) rotate(-5deg)';
        });
        buttons.forEach(button => {
            button.style.opacity = '0';
            button.style.transform = 'translateY(20px)';
        });
        
        // Start the animation sequence
        setTimeout(() => {
            // Animate the container
            gameContainer.style.transition = 'opacity 1s ease-out';
            gameContainer.style.opacity = '1';
            
            // Create the cosmic dust effect
            createCosmicDust();
            
            // Animate the header
            setTimeout(() => {
                header.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
                header.style.opacity = '1';
                header.style.transform = 'translateY(0)';
            }, 200);
            
            // Animate the game board cells with a sequential effect
            setTimeout(() => {
                cells.forEach((cell, index) => {
                    setTimeout(() => {
                        cell.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
                        cell.style.opacity = '1';
                        cell.style.transform = 'scale(1) rotate(0)';
                    }, index * 50);
                });
            }, 500);
            
            // Animate the game info section
            setTimeout(() => {
                gameInfo.style.transition = 'opacity 0.8s ease-out';
                gameInfo.style.opacity = '1';
            }, 900);
            
            // Animate the buttons
            setTimeout(() => {
                buttons.forEach((button, index) => {
                    setTimeout(() => {
                        button.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
                        button.style.opacity = '1';
                        button.style.transform = 'translateY(0)';
                    }, index * 100);
                });
            }, 1000);
            
            // Animate the footer
            setTimeout(() => {
                footer.style.transition = 'opacity 0.8s ease-out';
                footer.style.opacity = '1';
            }, 1300);
            
            // Add ambient particle effects
            setTimeout(() => {
                createBackgroundParticles();
                createFloatingParticles();
            }, 1500);
            
        }, 100);
    }
    
    // Add cosmic dust particles
    createCosmicDust();
    
    function createCosmicDust() {
        const particleCount = 20;
        // Use consistent theme colors for cosmic dust
        const colors = ['#ff4d88', '#00bfff', '#9966ff', '#ff66cc', '#33ccff', '#a239ea'];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('cosmic-dust');
            
            // Random size between 2-6px
            const size = Math.random() * 4 + 2;
            
            // Random color
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            // Position randomly on screen
            particle.style.width = particle.style.height = `${size}px`;
            particle.style.background = color;
            particle.style.position = 'fixed';
            particle.style.borderRadius = '50%';
            particle.style.boxShadow = `0 0 ${size * 2}px ${color}`;
            particle.style.left = `${Math.random() * 100}vw`;
            particle.style.top = `${Math.random() * 100}vh`;
            particle.style.opacity = `${Math.random() * 0.5 + 0.2}`;
            particle.style.zIndex = '-1';
            particle.style.pointerEvents = 'none';
            
            // Generate random animation parameters
            const duration = Math.random() * 60 + 30;  // 30-90s
            const delay = Math.random() * 10;
            
            // Set animation
            particle.style.animation = `cosmic-float ${duration}s infinite linear ${delay}s`;
            
            // Add to body
            document.body.appendChild(particle);
        }
        
        // Add cosmic float animation keyframes
        if (!document.getElementById('cosmic-keyframes')) {
            const style = document.createElement('style');
            style.id = 'cosmic-keyframes';
            style.innerHTML = `
                @keyframes cosmic-float {
                    0% {
                        transform: translate(0, 0) rotate(0deg) scale(1);
                    }
                    25% {
                        transform: translate(-20vw, -15vh) rotate(90deg) scale(0.8);
                    }
                    50% {
                        transform: translate(-10vw, 20vh) rotate(180deg) scale(1.2);
                    }
                    75% {
                        transform: translate(15vw, -10vh) rotate(270deg) scale(0.7);
                    }
                    100% {
                        transform: translate(0, 0) rotate(360deg) scale(1);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    function saveStats() {
        localStorage.setItem('cosmicTicTacToeStats', JSON.stringify(stats));
    }
    
    function loadStats() {
        const savedStats = localStorage.getItem('cosmicTicTacToeStats');
        if (savedStats) {
            stats = JSON.parse(savedStats);
        }
    }
    
    function updateStatsDisplay() {
        if (gamesPlayedEl) gamesPlayedEl.textContent = stats.gamesPlayed;
        if (xWinsEl) xWinsEl.textContent = stats.xWins;
        if (oWinsEl) oWinsEl.textContent = stats.oWins;
        if (tiesEl) tiesEl.textContent = stats.ties;
        
        // Add animation to updated stats
        const statValues = document.querySelectorAll('.stat-value');
        statValues.forEach(stat => {
            stat.style.animation = 'none';
            void stat.offsetWidth; // Force reflow
            stat.style.animation = 'stats-update 0.5s ease-out';
        });
    }
    
    // Add keyframe animation for stats update if not exists
    if (!document.getElementById('stats-keyframes')) {
        const style = document.createElement('style');
        style.id = 'stats-keyframes';
        style.innerHTML = `
            @keyframes stats-update {
                0% { transform: scale(1); }
                50% { transform: scale(1.3); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Create ripple effect
    function createRippleEffect(event) {
        const button = event.currentTarget;
        const circle = document.createElement('span');
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;
        
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
        circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
        circle.classList.add('ripple');
        
        // Remove existing ripples
        const ripple = button.querySelector('.ripple');
        if (ripple) {
            ripple.remove();
        }
        
        button.appendChild(circle);
        
        // Remove ripple after animation completes
        setTimeout(() => {
            if (circle) {
                circle.remove();
            }
        }, 600);
    }
    
    // Add background particles
    createBackgroundParticles();
    
    function createBackgroundParticles() {
        // Clear any existing particles
        document.querySelectorAll('.particle').forEach(p => p.remove());
        
        const particleCount = 30;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            
            // Set random position
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            
            // Set random animation delay and duration
            const duration = 10 + Math.random() * 20;
            particle.style.animation = `float-particle ${duration}s linear infinite`;
            particle.style.animationDelay = `${Math.random() * duration}s`;
            
            document.body.appendChild(particle);
        }
    }
    
    // Add floating particles
    createFloatingParticles();
    
    function createFloatingParticles() {
        const container = document.querySelector('.game-container');
        const particleCount = 15;
        const colors = ['#ff4d88', '#00bfff', '#9966ff'];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('quantum-particle');
            
            // Set random properties
            const size = Math.random() * 6 + 2;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            // Apply styles
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.backgroundColor = color;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.opacity = '0.7';
            particle.style.position = 'absolute';
            particle.style.borderRadius = '50%';
            particle.style.boxShadow = `0 0 ${size}px ${color}`;
            particle.style.zIndex = '-1';
            
            // Create animation
            const duration = 15 + Math.random() * 15;
            particle.style.animation = `float-particle ${duration}s linear infinite`;
            particle.style.animationDelay = `${Math.random() * duration}s`;
            
            container.appendChild(particle);
        }
        
        // Add keyframes for floating animation if they don't exist
        if (!document.getElementById('particle-keyframes')) {
            const style = document.createElement('style');
            style.id = 'particle-keyframes';
            style.innerHTML = `
                @keyframes float-particle {
                    0% {
                        transform: translate(0, 0) rotate(0deg);
                    }
                    25% {
                        transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) rotate(90deg);
                    }
                    50% {
                        transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) rotate(180deg);
                    }
                    75% {
                        transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) rotate(270deg);
                    }
                    100% {
                        transform: translate(0, 0) rotate(360deg);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Minimax algorithm for optimal play in endgame positions
    function minimax(board, depth, isMaximizing) {
        // Base cases: check for win, loss, or tie
        const result = checkWinState(board);
        
        if (result === 'o') return 10 - depth; // Computer wins (o)
        if (result === 'x') return depth - 10; // Player wins (x)
        if (result === 'tie') return 0;       // Tie game
        
        if (isMaximizing) {
            // Computer's turn (maximize)
            let bestScore = -Infinity;
            for (let i = 0; i < board.length; i++) {
                if (board[i] === '') {
                    board[i] = 'o';
                    const score = minimax(board, depth + 1, false);
                    board[i] = '';
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            // Player's turn (minimize)
            let bestScore = Infinity;
            for (let i = 0; i < board.length; i++) {
                if (board[i] === '') {
                    board[i] = 'x';
                    const score = minimax(board, depth + 1, true);
                    board[i] = '';
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }
    
    // Helper function to check win state for minimax
    function checkWinState(board) {
        // Check for win
        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];
            
            if (
                board[a] !== '' &&
                board[a] === board[b] &&
                board[a] === board[c]
            ) {
                return board[a]; // Return the winner ('x' or 'o')
            }
        }
        
        // Check for tie
        if (!board.includes('')) {
            return 'tie';
        }
        
        // Game still in progress
        return null;
    }
}); 