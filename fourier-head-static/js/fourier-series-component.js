import { multinomialData } from './data.js';

class FourierSeriesComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.multinomialData = multinomialData;
        this.minSmoothness = Infinity;
        this.maxSmoothness = -Infinity;
        this.minKL = Infinity;
        this.maxKL = -Infinity;
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: Arial, sans-serif;
                    text-align: center;
                }
                .container {
                    display: inline-flex;
                    align-items: flex-start;
                    gap: 20px;
                    margin-top: 20px;
                }
                canvas {
                    border: 1px solid #000;
                }
                .scale-container {
                    display: flex;
                    flex-direction: column;
                    height: 400px;  /* Match mainCanvas height */
                }
                .scale-header {
                    height: 40px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }
                .scale-label {
                    font-size: 13px;
                    margin-bottom: 2px;
                }
                .scale-value {
                    font-size: 12px;
                }
                .scale-canvas {
                    height: 360px;  /* 400px - 40px header */
                }
                .scale-caption {
                    display: flex;
                    justify-content: space-between;
                    padding: 0 5px;
                    font-size: 12px;
                    color: #666;
                }
                .scales-wrapper {
                    display: flex;
                    gap: 20px;
                }
            </style>
            <h2>Example: Learning a Square Wave Using the Fourier Head</h2>
            <div>
                <label for="terms">Frequencies: <span id="termValue">1</span></label>
                <input type="range" id="terms" min="1" max="64" value="1">
            </div>
            <div class="container">
                <canvas id="mainCanvas" width="600" height="400"></canvas>
                <div class="scales-wrapper">
                    <div class="scale-container">
                        <div class="scale-header">
                            <div class="scale-label">Smoothness (&#8595;)</div>
                            <div class="scale-value" id="smoothnessValue"></div>
                        </div>
                        <canvas id="smoothnessCanvas" class="scale-canvas" width="80" height="360"></canvas>
                    </div>
                    <div class="scale-container">
                        <div class="scale-header">
                            <div class="scale-label">KL Divergence (&#8595;)</div>
                            <div class="scale-value" id="klValue"></div>
                        </div>
                        <canvas id="klCanvas" class="scale-canvas" width="80" height="360"></canvas>
                    </div>
                </div>
            </div>
        `;

        this.mainCanvas = this.shadowRoot.getElementById('mainCanvas');
        this.smoothnessCanvas = this.shadowRoot.getElementById('smoothnessCanvas');
        this.klCanvas = this.shadowRoot.getElementById('klCanvas');
        this.ctx = this.mainCanvas.getContext('2d');
        this.smoothnessCtx = this.smoothnessCanvas.getContext('2d');
        this.klCtx = this.klCanvas.getContext('2d');
        this.slider = this.shadowRoot.getElementById('terms');
        this.termValue = this.shadowRoot.getElementById('termValue');
        this.smoothnessValue = this.shadowRoot.getElementById('smoothnessValue');
        this.klValue = this.shadowRoot.getElementById('klValue');

        this.slider.addEventListener('input', (e) => {
            const numTerms = parseInt(e.target.value);
            this.termValue.textContent = numTerms;
            this.drawFunction(numTerms);
        });

        if (this.multinomialData) {
            this.drawFunction(1);
        }
        this.drawFunction(1);
    }

    calculateRanges() {
        if (!this.multinomialData) return;
        
        this.minSmoothness = Infinity;
        this.maxSmoothness = -Infinity;
        this.minKL = Infinity;
        this.maxKL = -Infinity;
        
        for (const key in this.multinomialData) {
            const smoothness = this.multinomialData[key].smoothness;
            const kl = this.multinomialData[key].kl;
            
            this.minSmoothness = Math.min(this.minSmoothness, smoothness);
            this.maxSmoothness = Math.max(this.maxSmoothness, smoothness);
            this.minKL = Math.min(this.minKL, kl);
            this.maxKL = Math.max(this.maxKL, kl);
        }
    }

    mapValueToY(value, min, max, canvas) {
        const scaleHeight = canvas.height - 30;
        const normalizedValue = (value - min) / (max - min);
        return canvas.height - 15 - (normalizedValue * scaleHeight);
    }

    drawScale(ctx, value, min, max, colorStop1, colorStop2) {
        const canvas = ctx.canvas;
        
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // (x, y, width, height)

        // Draw gradient background
        const gradient = ctx.createLinearGradient(0, 15, 0, canvas.height - 15);
        gradient.addColorStop(0, colorStop1);
        gradient.addColorStop(1, colorStop2);
        
        // Scale background with gradient
        ctx.fillStyle = gradient;
        ctx.fillRect(25, 15, 30, canvas.height - 30);

        // Scale borders
        ctx.strokeStyle = '#000';
        ctx.strokeRect(25, 15, 30, canvas.height - 30);

        // Current value marker
        const markerY = this.mapValueToY(value, min, max, canvas);
        
        // Draw triangle marker
        ctx.beginPath();
        ctx.fillStyle = 'red';
        ctx.moveTo(24, markerY);
        ctx.lineTo(10, markerY - 5);
        ctx.lineTo(10, markerY + 5);
        ctx.closePath();
        ctx.fill();
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
        this.ctx.fillText('x', xAxisCenter + 30, this.mainCanvas.height - 10 - y_offset);

        // Y-axis label
        this.ctx.fillText('y', xAxisCenter + 10, 20);

        // X-axis ticks (-1 to 1)
        for (let i = -2; i <= 2; i += 1.0) {
            const x = this.mapX(i);
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.mainCanvas.height - y_offset);
            this.ctx.lineTo(x, this.mainCanvas.height - 10 - y_offset);
            this.ctx.stroke();
            this.ctx.fillText(i.toFixed(2), x - 10, this.mainCanvas.height - 15 - y_offset);
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
        return this.mainCanvas.height - (y * this.mainCanvas.height / 0.025) - offset;
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
        this.drawScale(this.smoothnessCtx, smoothness, this.minSmoothness, this.maxSmoothness, '#ff9999', '#99ff99');
        this.drawScale(this.klCtx, kl, this.minKL, this.maxKL, '#ff9999', '#99ff99');

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

        this.drawBackgroundSquareWave();
    }
}

customElements.define('fourier-series-component', FourierSeriesComponent);