class FourierSeriesComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.multinomialData = null;  // Initialize as null instead of importing
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
            <h2>${dataTitle}</h2>
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
        
        // Save the current context state
        ctx.save();
        
        // Draw triangle marker
        ctx.beginPath();
        ctx.fillStyle = 'red';
        ctx.moveTo(24, markerY);
        ctx.lineTo(10, markerY - 5);
        ctx.lineTo(10, markerY + 5);
        ctx.closePath();
        ctx.fill();
        
        // Restore the context state
        ctx.restore();
    }

    mapValueToY(value, min, max, canvas) {
        // Ensure we have valid values
        if (min === max) return canvas.height - 15;  // Default to bottom if min equals max
        
        const scaleHeight = canvas.height - 30;
        const normalizedValue = (value - min) / (max - min);
        // Ensure the value is within bounds
        const clampedValue = Math.max(0, Math.min(1, normalizedValue));
        return canvas.height - 15 - (clampedValue * scaleHeight);
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

        // Draw the PDF line instead of the square wave
        this.drawPDF();
    }
}

customElements.define('fourier-series-component', FourierSeriesComponent);