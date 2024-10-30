class FourierSeriesComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.multinomialData = null;
        this.minSmoothness = Infinity;
        this.maxSmoothness = -Infinity;
        this.minKL = Infinity;
        this.maxKL = -Infinity;
    }

    connectedCallback() {
        const dataTitle = this.getAttribute('title') || 'Example: Learning a Function Using the Fourier Head';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    font-family: Arial, sans-serif;
                    text-align: center;
                }
                .container {
                    padding: 10px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .slider-container {
                    width: 300px;
                    padding: 15px;
                    margin: 10px auto;
                    touch-action: none;
                    background: #f5f5f5;
                    border-radius: 10px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                .slider-label {
                    white-space: nowrap;
                    font-size: 16px;
                    font-weight: bold;
                    min-width: fit-content;
                    display: flex;
                    align-items: center;
                }
                .term-value {
                    min-width: 2ch;
                    text-align: right;
                    display: inline-block;
                    margin-left: 0.5em;  /* Add consistent spacing after the colon */
                }
                .slider-wrapper {
                    flex: 1;
                }
                input[type="range"] {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 100%;
                    height: 30px;
                    background: transparent;
                    cursor: pointer;
                }
                input[type="range"]::-webkit-slider-runnable-track {
                    width: 100%;
                    height: 10px;
                    background: #ddd;
                    border-radius: 5px;
                    border: 1px solid #ccc;
                }
                input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 30px;
                    height: 30px;
                    background: #b07aa1;
                    border-radius: 50%;
                    border: none;
                    margin-top: -10px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                input[type="range"]::-moz-range-track {
                    width: 100%;
                    height: 10px;
                    background: #ddd;
                    border-radius: 5px;
                    border: 1px solid #ccc;
                }
                input[type="range"]::-moz-range-thumb {
                    width: 30px;
                    height: 30px;
                    background: #b07aa1;
                    border-radius: 50%;
                    border: none;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                /* Rest of your existing styles remain the same */
                canvas {
                    border: 1px solid #000;
                }
                .scale-container {
                    display: flex;
                    flex-direction: column;
                    padding: 10px;
                    justify-content: center;
                }
                .scale-header {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }
                .scale-label {
                    font-size: 13px;
                }
                .scale-value {
                    font-size: 12px;
                }
                .scale-canvas {
                    margin: auto;
                }
                .graph-canvas {
                    margin: auto;
                    max-width: 100%;
                }
                .visualization-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                }
                .scales-wrapper {
                    display: flex;
                    justify-content: center;
                    margin-top: 20px;
                }
                .scale-caption {
                    padding: 0 5px;
                    font-size: 12px;
                    color: #666;
                }
                
                @media (min-width: 768px) {
                    .visualization-container {
                        flex-direction: row;
                        justify-content: center;
                        align-items: flex-end;
                        gap: 0;
                        width: 100%;
                    }
                    .graph-canvas {
                        max-width: 600px;
                        margin: 0;
                    }
                    .scales-wrapper {
                        margin-top: 0;
                        margin-left: 20px;
                        display: flex;
                        align-items: flex-end;
                        height: auto;
                    }
                    .scale-container {
                        padding: 0 20px;
                        height: auto;
                        display: flex;
                        flex-direction: column;
                        justify-content: flex-end;
                    }
                    .scale-header {
                        margin-bottom: 10px;
                    }
                    .scale-canvas {
                        margin: 0;
                    }
                }
            </style>
            <div class="slider-container">
                <label class="slider-label">Frequencies:  <span class="term-value" id="termValue">1</span></label>
                <div class="slider-wrapper">
                    <input type="range" id="terms" min="1" max="64" value="1">
                </div>
            </div>
            <div class="container">
                <div class="visualization-container">
                    <canvas id="mainCanvas" class="graph-canvas"></canvas>
                    <div class="scales-wrapper">
                        <div class="scale-container">
                            <div class="scale-header">
                                <div class="scale-label">Smoothness (&#8595;)</div>
                                <div class="scale-value" id="smoothnessValue"></div>
                            </div>
                            <canvas id="smoothnessCanvas" class="scale-canvas" width="80" height="320"></canvas>
                        </div>
                        <div class="scale-container">
                            <div class="scale-header">
                                <div class="scale-label">KL Divergence (&#8595;)</div>
                                <div class="scale-value" id="klValue"></div>
                            </div>
                            <canvas id="klCanvas" class="scale-canvas" width="80" height="320"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupCanvases();
        this.setupEventListeners();
        this.loadData();
    }

    setupCanvases() {
        this.mainCanvas = this.shadowRoot.getElementById('mainCanvas');
        this.setResponsiveCanvasSize();
        this.ctx = this.mainCanvas.getContext('2d');
        this.smoothnessCanvas = this.shadowRoot.getElementById('smoothnessCanvas');
        this.klCanvas = this.shadowRoot.getElementById('klCanvas');
        this.smoothnessCtx = this.smoothnessCanvas.getContext('2d');
        this.klCtx = this.klCanvas.getContext('2d');
        
        // Set scale canvas heights based on viewport
        this.setScaleCanvasHeights();
    }

    setScaleCanvasHeights() {
        const isMobile = window.innerWidth <= 768;
        if (!isMobile) {
            // Make the scale canvases exactly equal heights
            const mainHeight = Math.floor(this.mainCanvas.getBoundingClientRect().height);
            const scaleHeight = Math.floor(mainHeight * 0.8);
            
            // Set dimensions for both canvases exactly the same
            const dimensions = {
                width: 80,
                height: scaleHeight
            };

            // Apply to both canvas elements and their styles
            [this.smoothnessCanvas, this.klCanvas].forEach(canvas => {
                // Set canvas dimensions
                canvas.width = dimensions.width;
                canvas.height = dimensions.height;
                
                // Force dimensions through CSS as well
                canvas.style.width = `${dimensions.width}px`;
                canvas.style.height = `${dimensions.height}px`;
            });

            // Debug log
            console.log('Scale canvas dimensions:', {
                smoothness: {
                    width: this.smoothnessCanvas.width,
                    height: this.smoothnessCanvas.height,
                    styleWidth: this.smoothnessCanvas.style.width,
                    styleHeight: this.smoothnessCanvas.style.height,
                    clientHeight: this.smoothnessCanvas.clientHeight
                },
                kl: {
                    width: this.klCanvas.width,
                    height: this.klCanvas.height,
                    styleWidth: this.klCanvas.style.width,
                    styleHeight: this.klCanvas.style.height,
                    clientHeight: this.klCanvas.clientHeight
                }
            });
        } else {
            // On mobile, keep original height but ensure equal dimensions
            const dimensions = {
                width: 80,
                height: 200
            };

            [this.smoothnessCanvas, this.klCanvas].forEach(canvas => {
                canvas.width = dimensions.width;
                canvas.height = dimensions.height;
                canvas.style.width = `${dimensions.width}px`;
                canvas.style.height = `${dimensions.height}px`;
            });
        }
    }

    setResponsiveCanvasSize() {
        const isMobile = window.innerWidth <= 768;
        const maxWidth = Math.min(window.innerWidth, 1200);
        
        if (isMobile) {
            this.mainCanvas.width = window.innerWidth * 0.7;
        } else {
            this.mainCanvas.width = Math.min(500, maxWidth * 0.45);
        }
        this.mainCanvas.height = this.mainCanvas.width * 0.57;
    }

    setupEventListeners() {
        this.slider = this.shadowRoot.getElementById('terms');
        this.termValue = this.shadowRoot.getElementById('termValue');
        this.smoothnessValue = this.shadowRoot.getElementById('smoothnessValue');
        this.klValue = this.shadowRoot.getElementById('klValue');
        this.sliderContainer = this.shadowRoot.querySelector('.slider-container');

        // Prevent carousel swipe when interacting with slider
        this.sliderContainer.addEventListener('touchstart', (e) => {
            e.stopPropagation();
        }, { passive: false });

        this.sliderContainer.addEventListener('touchmove', (e) => {
            e.stopPropagation();
        }, { passive: false });

        this.sliderContainer.addEventListener('touchend', (e) => {
            e.stopPropagation();
        }, { passive: false });

        this.slider.addEventListener('input', (e) => {
            e.stopPropagation();
            const numTerms = parseInt(e.target.value);
            this.termValue.textContent = numTerms;
            this.drawFunction(numTerms);
        });

        this.slider.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
        
        window.addEventListener('resize', () => {
            this.setResponsiveCanvasSize();
            this.setScaleCanvasHeights();
            this.drawFunction(parseInt(this.slider.value));
        });
    }

    loadData() {
        const dataSource = this.getAttribute('data-source');
        if (dataSource) {
            fetch(dataSource)
                .then(response => response.json())
                .then(data => {
                    this.multinomialData = data;
                    this.drawFunction(1);
                });
        }
    }

    calculateRanges() {
        if (!this.multinomialData) return;
        
        this.minSmoothness = Infinity;
        this.maxSmoothness = -Infinity;
        this.minKL = Infinity;
        this.maxKL = -Infinity;
        
        for (const key in this.multinomialData) {
            // Skip the pdf key as it doesn't contain smoothness/kl values
            if (key === 'pdf') continue;
            
            const smoothness = this.multinomialData[key].smoothness;
            const kl = this.multinomialData[key].kl;
            
            if (smoothness !== undefined) {
                this.minSmoothness = Math.min(this.minSmoothness, smoothness);
                this.maxSmoothness = Math.max(this.maxSmoothness, smoothness);
            }
            
            if (kl !== undefined) {
                this.minKL = Math.min(this.minKL, kl);
                this.maxKL = Math.max(this.maxKL, kl);
            }
        }

        // Add console logs to debug
        console.log('Smoothness range:', this.minSmoothness, '-', this.maxSmoothness);
        console.log('KL range:', this.minKL, '-', this.maxKL);
    }

    drawScale(ctx, value, min, max, colorStop1, colorStop2) {
        const canvas = ctx.canvas;
        
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Calculate margins proportionally
        const topMargin = Math.min(15, canvas.height * 0.05);
        const sideMargin = Math.min(25, canvas.width * 0.3);
        
        // Draw gradient background
        const gradient = ctx.createLinearGradient(0, topMargin, 0, canvas.height - topMargin);
        gradient.addColorStop(0, colorStop1);
        gradient.addColorStop(1, colorStop2);
        
        // Scale background with gradient
        ctx.fillStyle = gradient;
        ctx.fillRect(sideMargin, topMargin, 30, canvas.height - (2 * topMargin));
    
        // Scale borders
        ctx.strokeStyle = '#000';
        ctx.strokeRect(sideMargin, topMargin, 30, canvas.height - (2 * topMargin));
    
        // Current value marker
        const markerY = this.mapValueToY(value, min, max, canvas);
        
        // Save the current context state
        ctx.save();
        
        // Draw triangle marker
        ctx.beginPath();
        ctx.fillStyle = 'red';
        ctx.moveTo(sideMargin - 1, markerY);
        ctx.lineTo(sideMargin - 15, markerY - 5);
        ctx.lineTo(sideMargin - 15, markerY + 5);
        ctx.closePath();
        ctx.fill();
        
        // Restore the context state
        ctx.restore();
    }
    
    mapValueToY(value, min, max, canvas) {
        // Ensure we have valid values
        if (min === max) return canvas.height - canvas.height * 0.05;  // Default to bottom if min equals max
        
        const topMargin = Math.min(15, canvas.height * 0.05);
        const scaleHeight = canvas.height - (2 * topMargin);
        const normalizedValue = (value - min) / (max - min);
        // Ensure the value is within bounds
        const clampedValue = Math.max(0, Math.min(1, normalizedValue));
        return canvas.height - topMargin - (clampedValue * scaleHeight);
    }

    drawAxis() {
        this.ctx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
        this.ctx.beginPath();

        // Y-axis at x = 0
        const xAxisCenter = this.mapX(0);
        this.ctx.moveTo(xAxisCenter, 0);
        this.ctx.lineTo(xAxisCenter, this.mainCanvas.height);

        // X-axis
        let y_offset = 20;
        this.ctx.moveTo(0, this.mainCanvas.height - y_offset);
        this.ctx.lineTo(this.mainCanvas.width, this.mainCanvas.height - y_offset);

        this.ctx.strokeStyle = '#000';
        this.ctx.stroke();

        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = '#000';
        this.ctx.textAlign = 'left';

        // X-axis label
        // this.ctx.fillText('x', xAxisCenter + 30, this.mainCanvas.height - 10 - y_offset);

        // Y-axis label
        // this.ctx.fillText('y', xAxisCenter + 10, 20);a

        // X-axis ticks (-1 to 1)
        for (let i = -1.0; i <= 2; i += 2.0) {
            const x = this.mapX(i);
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.mainCanvas.height - y_offset);
            this.ctx.lineTo(x, this.mainCanvas.height - 10 - y_offset);
            this.ctx.stroke();
            this.ctx.fillText(i.toFixed(1), x - 10, this.mainCanvas.height - 15 - y_offset);
        }

        // Y-axis ticks (0 to 0.06)
        for (let i = 0; i <= 0.02; i += 0.02) {
            if (i != 0){
                const y = this.mapY(i);
                this.ctx.beginPath();
                this.ctx.moveTo(xAxisCenter - 5, y);
                this.ctx.lineTo(xAxisCenter + 5, y);
                this.ctx.stroke();
                this.ctx.fillText(i.toFixed(2), xAxisCenter + 10, y + 5);
            }
        }
    }

    mapX(x, padding = 0.1) {
        return (padding/2 * this.mainCanvas.width) + ((x + 1) / 2) * (this.mainCanvas.width * (1-padding));
    }

    mapY(y, offset = 20) {
        return this.mainCanvas.height - (y * this.mainCanvas.height / 0.026) - offset;
    }

    drawPDF() {
        if (!this.multinomialData || !this.multinomialData.pdf) {
            console.error('No PDF data available');
            return;
        }

        this.ctx.beginPath();
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = 'rgb(44,160,44)';

        // Move to the first point
        const firstPoint = this.multinomialData.pdf[0];
        this.ctx.moveTo(this.mapX(firstPoint[0]), this.mapY(firstPoint[1]));

        // Draw lines to each subsequent point
        for (let i = 1; i < this.multinomialData.pdf.length; i++) {
            const point = this.multinomialData.pdf[i];
            this.ctx.lineTo(this.mapX(point[0]), this.mapY(point[1]));
        }

        this.ctx.stroke();
    }

    drawBackgroundSquareWave() {
        this.ctx.beginPath();

        this.ctx.lineWidth = 2;
        
        // Draw the zero parts
        this.ctx.moveTo(this.mapX(-1), this.mapY(0));
        this.ctx.lineTo(this.mapX(-0.5), this.mapY(0));
        
        // Draw the 1/32 height part
        this.ctx.lineTo(this.mapX(-0.5), this.mapY(1/64));
        this.ctx.lineTo(this.mapX(0.5), this.mapY(1/64));
        
        // Complete with zero parts
        this.ctx.lineTo(this.mapX(0.5), this.mapY(0));
        this.ctx.lineTo(this.mapX(1), this.mapY(0));
        
        this.ctx.strokeStyle = 'rgb(44,160,44)';
        this.ctx.stroke();
    }

    drawFunction(numTerms) {
        // Calculate ranges if first time
        if (this.minSmoothness === Infinity) {
            this.calculateRanges();
        }

        // Draw basic elements
        this.drawAxis();

        if (!this.multinomialData) {
            console.log('No multinomial data available yet');
            return;
        }

        const frequencyData = this.multinomialData[numTerms.toString()];
        if (!frequencyData) {
            console.error(`No data for ${numTerms} terms`);
            return;
        }

        const values = frequencyData.multinomial;
        const smoothness = frequencyData.smoothness;
        const kl = frequencyData.kl;

        // Update value displays
        this.smoothnessValue.textContent = smoothness.toFixed(4);
        this.klValue.textContent = kl.toFixed(4);

        // Draw the scales
        this.drawScale(this.smoothnessCtx, smoothness, this.minSmoothness, this.maxSmoothness, `#b07aa1`, '#4CAF50');
        this.drawScale(this.klCtx, kl, this.minKL, this.maxKL, `#b07aa1`,'#4CAF50');

        // Draw rectangles for the approximation
        const rectWidth = 2 / values.length;
        values.forEach((height, i) => {
            const xStart = -1 + (i * rectWidth);
            const rectX = this.mapX(xStart);
            const nextX = this.mapX(xStart + rectWidth);
            const width = nextX - rectX;
            const yHeight = this.mapY(height);
            const rectHeight = this.mapY(0) - yHeight;

            this.ctx.fillStyle = 'rgba(98, 160, 202, 1.0)';
            this.ctx.fillRect(rectX, yHeight, width, rectHeight);
        });

        // Draw the PDF line instead of the square wave
        this.drawPDF();
    }
}

customElements.define('fourier-series-component', FourierSeriesComponent);