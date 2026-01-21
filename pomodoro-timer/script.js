class PomodoroTimer {
    constructor() {
        this.timeLeft = 25 * 60; // 25 minutes in seconds
        this.totalTime = 25 * 60;
        this.timerId = null;
        this.isRunning = false;

        // DOM Elements
        this.timeDisplay = document.getElementById('time-display');
        this.startBtn = document.getElementById('start-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.ringProgress = document.querySelector('.ring-progress');
        this.statusLabel = document.getElementById('status-label');
        this.body = document.body;

        // Constants for SVG Ring
        this.ringCircumference = 2 * Math.PI * 140; // r=140

        // Bind events
        this.startBtn.addEventListener('click', () => this.toggleTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());

        // Initialize display
        this.updateDisplay();

        // Custom Minutes Input
        this.customMinInput = document.getElementById('custom-minutes');
        this.customMinInput.addEventListener('input', () => this.updateCustomTime());

        // Custom Seconds Input
        this.customSecInput = document.getElementById('custom-seconds');
        this.customSecInput.addEventListener('input', () => this.updateCustomTime());
    }

    updateCustomTime() {
        const mins = parseInt(this.customMinInput.value) || 0;
        const secs = parseInt(this.customSecInput.value) || 0;

        const totalSeconds = (mins * 60) + secs;

        if (totalSeconds > 0) {
            this.totalTime = totalSeconds;
            if (!this.isRunning) {
                this.timeLeft = this.totalTime;
                this.updateDisplay();
            }
        }
    }

    toggleTimer() {
        if (!this.audioCtx) {
            this.initAudio();
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    initAudio() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            this.audioCtx = new AudioContext();
        }
    }

    startTimer() {
        if (this.timeLeft <= 0) return;

        this.isRunning = true;
        this.body.classList.add('timer-active');
        this.statusLabel.textContent = "Focusing...";
        this.updateControls(true);

        this.timerId = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();

            if (this.timeLeft <= 0) {
                this.completeTimer();
            }
        }, 1000);
    }

    pauseTimer() {
        this.isRunning = false;
        this.body.classList.remove('timer-active');
        this.statusLabel.textContent = "Paused";
        this.updateControls(false);
        clearInterval(this.timerId);
    }

    resetTimer() {
        this.pauseTimer();
        this.timeLeft = this.totalTime;
        this.statusLabel.textContent = "Ready to Focus";
        this.updateDisplay();
    }

    completeTimer() {
        this.pauseTimer();
        this.timeLeft = 0;
        this.updateDisplay();
        this.statusLabel.textContent = "Time's Up!";
        this.playNotificationSound();
        this.triggerConfetti();
    }

    triggerConfetti() {
        if (typeof confetti === 'function') {
            const count = 200;
            const defaults = {
                origin: { y: 0.7 }
            };

            function fire(particleRatio, opts) {
                confetti(Object.assign({}, defaults, opts, {
                    particleCount: Math.floor(count * particleRatio)
                }));
            }

            fire(0.25, {
                spread: 26,
                startVelocity: 55,
            });
            fire(0.2, {
                spread: 60,
            });
            fire(0.35, {
                spread: 100,
                decay: 0.91,
                scalar: 0.8
            });
            fire(0.1, {
                spread: 120,
                startVelocity: 25,
                decay: 0.92,
                scalar: 1.2
            });
            fire(0.1, {
                spread: 120,
                startVelocity: 45,
            });
        }
    }

    updateDisplay() {
        // Format MM:SS
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        this.timeDisplay.textContent = formattedTime;
        document.title = `${formattedTime} - Focus Timer`;

        // Update Ring
        const progressOffset = this.ringCircumference - (this.timeLeft / this.totalTime) * this.ringCircumference;
        this.ringProgress.style.strokeDashoffset = progressOffset;
    }

    updateControls(isPlaying) {
        const iconSpan = this.startBtn.querySelector('.icon');
        const textSpan = this.startBtn.querySelector('.text');

        if (isPlaying) {
            iconSpan.textContent = '||';
            textSpan.textContent = 'Pause';
            this.startBtn.classList.add('active'); // Optional styling hook
        } else {
            iconSpan.textContent = '▶';
            textSpan.textContent = 'Start';
            this.startBtn.classList.remove('active');
        }
    }

    playNotificationSound() {
        if (!this.audioCtx) return;

        const playNote = (freq, startTime, duration, type = 'sine') => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = type;
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0.1, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start(startTime);
            osc.stop(startTime + duration);
        };

        // Play a pleasant chime chord (Cmaj7ish)
        const now = this.audioCtx.currentTime;
        playNote(523.25, now, 1.5);      // C5
        playNote(659.25, now + 0.1, 1.5); // E5
        playNote(783.99, now + 0.2, 1.5); // G5
        playNote(987.77, now + 0.3, 2.0); // B5
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
});
