/**
 * Till Counter & Float Manager
 * JavaScript functionality for real-time calculations and float management
 * Updated to use a backend API for data persistence and date selection
 */

class TillCounter {
    constructor() {
        this.FLOAT_TARGET = 200.00; // £200 target float
        this.totalCash = 0;
        this.floatTotal = 0;
        this.takings = 0;
        this.expectedTakings = 0;

        this.initializeEventListeners();
        this.setInitialDate();
        this.loadSavedData();
    }

    /**
     * Set the date input to today's date by default.
     */
    setInitialDate() {
        const dateInput = document.getElementById('recordDate');
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${yyyy}-${mm}-${dd}`;
    }

    /**
     * Initialize all event listeners
     */
    initializeEventListeners() {
        // Denomination input listeners - calls saveData() on every change
        const denominationInputs = document.querySelectorAll('.denomination-input');
        denominationInputs.forEach(input => {
            input.addEventListener('input', () => {
                this.updateCalculations();
                this.saveData();
            });
        });

        // Float input listeners - calls saveData() on every change
        const floatInputs = document.querySelectorAll('.float-input');
        floatInputs.forEach(input => {
            input.addEventListener('input', () => {
                this.updateFloatCalculations();
                this.saveData();
            });
        });

        // Expected takings listener - calls saveData() on every change
        const expectedTakingsInput = document.getElementById('expectedTakings');
        expectedTakingsInput.addEventListener('input', () => {
            this.updateExpectedTakings();
            this.saveData();
        });

        // Date input listener - calls loadSavedData() when the date is changed
        const dateInput = document.getElementById('recordDate');
        dateInput.addEventListener('change', () => {
            this.loadSavedData(dateInput.value);
        });

        // Button listeners
        document.getElementById('resetBtn').addEventListener('click', () => this.resetAll());
        document.getElementById('suggestFloatBtn').addEventListener('click', () => this.suggestFloat());
        document.getElementById('clearFloatBtn').addEventListener('click', () => this.clearFloat());
        
        // Gemini API button listener
        document.getElementById('generateSummaryBtn').addEventListener('click', () => this.generateSummary());
    }

    /**
     * Calculate total cash from denomination inputs
     */
    calculateTotalCash() {
        let total = 0;
        const inputs = document.querySelectorAll('.denomination-input');
        
        inputs.forEach(input => {
            const value = parseFloat(input.dataset.value);
            const quantity = parseInt(input.value) || 0;
            total = total + value * quantity;
        });
        
        return Math.round(total * 100) / 100;
    }

    /**
     * Calculate float total from float inputs
     */
    calculateFloatTotal() {
        let total = 0;
        const inputs = document.querySelectorAll('.float-input');
        
        inputs.forEach(input => {
            const value = parseFloat(input.dataset.value);
            const quantity = parseInt(input.value) || 0;
            total = total + value * quantity;
        });
        
        return Math.round(total * 100) / 100;
    }

    /**
     * Update all calculations and display
     */
    updateCalculations() {
        this.totalCash = this.calculateTotalCash();
        this.updateFloatCalculations();

        document.getElementById('totalAmount').textContent = `£${this.totalCash.toFixed(2)}`;
        document.getElementById('summaryTotal').textContent = `£${this.totalCash.toFixed(2)}`;
    }

    /**
     * Update float calculations and validate
     */
    updateFloatCalculations() {
        this.floatTotal = this.calculateFloatTotal();
        this.takings = Math.max(0, this.totalCash - this.floatTotal);

        document.getElementById('floatTotal').textContent = `£${this.floatTotal.toFixed(2)}`;
        document.getElementById('summaryFloat').textContent = `£${this.floatTotal.toFixed(2)}`;
        document.getElementById('summaryTakings').textContent = `£${this.takings.toFixed(2)}`;

        this.validateFloat();
        this.updateComparison();
        this.updateBreakdown();
    }

    /**
     * Validate float amount - must be exactly £200
     */
    validateFloat() {
        const errorDiv = document.getElementById('floatError');
        const errorMessage = document.getElementById('floatErrorMessage');

        if (this.floatTotal > this.totalCash) {
            errorMessage.textContent = 'Float cannot exceed total cash available';
            errorDiv.classList.remove('d-none');
        } else if (this.floatTotal !== this.FLOAT_TARGET && this.floatTotal > 0) {
            if (this.floatTotal > this.FLOAT_TARGET) {
                errorMessage.textContent = `Float must be exactly £${this.FLOAT_TARGET.toFixed(2)}. Remove £${(this.floatTotal - this.FLOAT_TARGET).toFixed(2)}`;
            } else {
                errorMessage.textContent = `Float must be exactly £${this.FLOAT_TARGET.toFixed(2)}. Add £${(this.FLOAT_TARGET - this.floatTotal).toFixed(2)}`;
            }
            errorDiv.classList.remove('d-none');
        } else if (this.floatTotal === this.FLOAT_TARGET) {
            errorDiv.classList.add('d-none');
        } else {
            errorDiv.classList.add('d-none');
        }
    }

    /**
     * Update expected takings
     */
    updateExpectedTakings() {
        const expectedInput = document.getElementById('expectedTakings');
        this.expectedTakings = parseFloat(expectedInput.value) || 0;
        this.updateComparison();
    }

    /**
     * Update comparison between expected and actual takings
     */
    updateComparison() {
        const comparisonSection = document.getElementById('comparisonSection');
        const comparisonCard = document.getElementById('comparisonCard');
        const comparisonMessage = document.getElementById('comparisonMessage');
        const comparisonText = document.getElementById('comparisonText');

        if (this.expectedTakings > 0) {
            comparisonSection.style.display = 'block';

            document.getElementById('expectedDisplay').textContent = `£${this.expectedTakings.toFixed(2)}`;
            document.getElementById('actualDisplay').textContent = `£${this.takings.toFixed(2)}`;

            const variance = this.takings - this.expectedTakings;
            const variancePercent = this.expectedTakings > 0 ? (variance / this.expectedTakings * 100) : 0;

            document.getElementById('varianceDisplay').textContent = `${variance >= 0 ? '+' : ''}£${variance.toFixed(2)}`;
            document.getElementById('variancePercent').textContent = `(${variancePercent >= 0 ? '+' : ''}${variancePercent.toFixed(1)}%)`;

            let cardClass = 'border-success';
            let messageClass = 'alert-success';
            let icon = 'bi-check-circle';
            let message = '';

            if (Math.abs(variance) <= 5) {
                message = 'Excellent! Takings match expected amount closely.';
                cardClass = 'border-success';
                messageClass = 'alert-success';
                icon = 'bi-check-circle';
            } else {
                message = variance > 0 ?
                    `Takings exceed expected amount by £${Math.abs(variance).toFixed(2)}. Check for errors.` :
                    `Takings are below expected amount by £${Math.abs(variance).toFixed(2)}. Investigation needed.`;
                cardClass = 'border-danger';
                messageClass = 'alert-danger';
                icon = 'bi-exclamation-triangle';
            }

            comparisonCard.className = `card ${cardClass}`;
            comparisonMessage.className = `alert mb-0 ${messageClass}`;
            comparisonText.innerHTML = `<i class="bi ${icon} me-2"></i>${message}`;

        } else {
            comparisonSection.style.display = 'none';
        }
    }

    /**
     * Save data to the backend API.
     */
    async saveData() {
        const dateInput = document.getElementById('recordDate');

        const payload = {
            date: dateInput.value,
            totalCash: this.totalCash,
            floatTotal: this.floatTotal,
            takings: this.takings,
            expectedTakings: this.expectedTakings,
            denominations: {},
            floats: {}
        };

        document.querySelectorAll('.denomination-input').forEach(input => {
            const count = parseInt(input.value) || 0;
            payload.denominations[input.id] = count;
        });

        document.querySelectorAll('.float-input').forEach(input => {
            const count = parseInt(input.value) || 0;
            payload.floats[input.id] = count;
        });

        try {
            const response = await fetch('/api/records', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Record saved successfully:', data);
                this.showSaveIndicator();
            } else {
                const errorData = await response.json();
                console.error('Failed to save record:', errorData.error);
                // Note: using a custom modal for this in a real app would be better than alert()
                // alert(`Error: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error saving record:', error);
            // alert('An unexpected error occurred while saving the record.');
        }
    }

    /**
     * Load saved data from the backend API for a given date.
     */
    async loadSavedData(selectedDate = null) {
        this.resetAllForms();

        let url;
        if (selectedDate) {
            url = `/api/records?date=${selectedDate}`;
        } else {
            url = '/api/records/latest';
        }

        try {
            const response = await fetch(url);

            if (response.ok) {
                const data = await response.json();
                console.log('Loading saved data from backend:', data);

                document.getElementById('expectedTakings').value = data.expected_takings || '';
                this.expectedTakings = parseFloat(data.expected_takings) || 0;

                Object.entries(data.denominations).forEach(([id, value]) => {
                    const input = document.getElementById(id);
                    if (input && value) {
                        input.value = value;
                    }
                });

                Object.entries(data.float_denominations).forEach(([id, value]) => {
                    const input = document.getElementById(id);
                    if (input && value) {
                        input.value = value;
                    }
                });

                this.updateCalculations();
                this.showSaveIndicator();
            } else if (response.status === 404) {
                console.log('No existing record found for the selected date.');
                this.resetAllForms();
            } else {
                console.error('Failed to load data:', response.statusText);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }
    
    /**
     * Generates a summary of the till count using the Gemini API.
     */
    async generateSummary() {
        const button = document.getElementById('generateSummaryBtn');
        const outputDiv = document.getElementById('summaryOutput');
        const summaryTextSpan = document.getElementById('summaryText');
        const spinner = document.getElementById('summarySpinner');
        
        button.disabled = true;
        outputDiv.classList.remove('d-none');
        spinner.classList.remove('d-none');
        summaryTextSpan.textContent = 'Generating summary...';

        const payload = {
            totalCash: this.totalCash,
            takings: this.takings,
            expectedTakings: this.expectedTakings,
            floatTotal: this.floatTotal
        };

        try {
            const response = await fetch('/api/generate-summary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            
            const data = await response.json();

            if (response.ok) {
                summaryTextSpan.textContent = data.summary;
            } else {
                summaryTextSpan.textContent = `Error: ${data.error}`;
                outputDiv.classList.remove('alert-secondary');
                outputDiv.classList.add('alert-danger');
            }
        } catch (error) {
            console.error('Error generating summary:', error);
            summaryTextSpan.textContent = 'An unexpected error occurred while generating the summary.';
            outputDiv.classList.remove('alert-secondary');
            outputDiv.classList.add('alert-danger');
        } finally {
            button.disabled = false;
            spinner.classList.add('d-none');
        }
    }

    /**
     * Clear all form inputs.
     */
    resetAllForms() {
        document.querySelectorAll('.denomination-input').forEach(input => input.value = '');
        document.querySelectorAll('.float-input').forEach(input => input.value = '');
        document.getElementById('expectedTakings').value = '';
        this.updateCalculations(); // Recalculate totals after resetting
    }

    /**
     * Show save indicator briefly
     */
    showSaveIndicator() {
        const indicator = document.getElementById('saveIndicator');
        indicator.style.display = 'inline-block';

        setTimeout(() => {
            indicator.style.display = 'none';
        }, 2000);
    }

    /**
     * Update denomination breakdown showing what to remove vs keep
     */
    updateBreakdown() {
        const breakdownSection = document.getElementById('breakdownSection');
        const removeBreakdown = document.getElementById('removeBreakdown');
        const leaveBreakdown = document.getElementById('leaveBreakdown');

        if (this.totalCash <= 0) {
            breakdownSection.style.display = 'none';
            return;
        }

        breakdownSection.style.display = 'block';

        const denominations = [
            { id: 'note50', floatId: null, label: '£50 Notes', value: 50 },
            { id: 'note20', floatId: 'floatNote20', label: '£20 Notes', value: 20 },
            { id: 'note10', floatId: 'floatNote10', label: '£10 Notes', value: 10 },
            { id: 'note5', floatId: 'floatNote5', label: '£5 Notes', value: 5 },
            { id: 'coin200', floatId: 'floatCoin200', label: '£2 Coins', value: 2 },
            { id: 'coin100', floatId: 'floatCoin100', label: '£1 Coins', value: 1 },
            { id: 'coin50', floatId: 'floatCoin50', label: '50p Coins', value: 0.5 },
            { id: 'coin20', floatId: 'floatCoin20', label: '20p Coins', value: 0.2 },
            { id: 'coin10', floatId: 'floatCoin10', label: '10p Coins', value: 0.1 },
            { id: 'coin5', floatId: 'floatCoin5', label: '5p Coins', value: 0.05 },
            { id: 'coin2', floatId: 'floatCoin2', label: '2p Coins', value: 0.02 },
            { id: 'coin1', floatId: 'floatCoin1', label: '1p Coins', value: 0.01 }
        ];

        let removeHTML = '';
        let leaveHTML = '';
        let hasRemovalItems = false;
        let hasFloatItems = false;

        denominations.forEach(denom => {
            const totalInput = document.getElementById(denom.id);
            if (!totalInput) return;

            const totalQuantity = parseInt(totalInput.value) || 0;
            if (totalQuantity === 0) return;

            const floatInput = denom.floatId ? document.getElementById(denom.floatId) : null;
            const floatQuantity = floatInput ? (parseInt(floatInput.value) || 0) : 0;
            const removeQuantity = Math.max(0, totalQuantity - floatQuantity);

            if (removeQuantity > 0) {
                const removeValue = Math.round(removeQuantity * denom.value * 100) / 100;
                removeHTML += `<p class="mb-1"><span>${denom.label}:</span> <span class="float-end"><strong>${removeQuantity} × ${this.formatDenomination(denom.value)} = £${removeValue.toFixed(2)}</strong></span></p>`;
                hasRemovalItems = true;
            }

            if (floatQuantity > 0) {
                const floatValue = Math.round(floatQuantity * denom.value * 100) / 100;
                leaveHTML += `<p class="mb-1"><span>${denom.label}:</span> <span class="float-end"><strong>${floatQuantity} × ${this.formatDenomination(denom.value)} = £${floatValue.toFixed(2)}</strong></span></p>`;
                hasFloatItems = true;
            }
        });

        if (hasRemovalItems) {
            removeHTML += `<div class="mt-2 p-2 bg-success text-white rounded">
                <strong>Total to Remove: £${this.takings.toFixed(2)}</strong>
            </div>`;
            removeBreakdown.innerHTML = removeHTML;
        } else {
            removeBreakdown.innerHTML = '<div class="text-muted fst-italic">Nothing to remove</div>';
        }

        if (hasFloatItems) {
            leaveHTML += `<div class="mt-2 p-2 bg-warning text-dark rounded">
                <strong>Total to Leave: £${this.floatTotal.toFixed(2)}</strong>
            </div>`;
            leaveBreakdown.innerHTML = leaveHTML;
        } else {
            leaveBreakdown.innerHTML = '<div class="text-muted fst-italic">No float set</div>';
        }
    }

    /**
     * Format denomination value for display
     */
    formatDenomination(value) {
        if (value >= 1) {
            return `£${value}`;
        } else {
            return `${Math.round(value * 100)}p`;
        }
    }

    /**
     * Check if denomination is available in sufficient quantity
     */
    checkAvailability(denominationId, requestedQuantity) {
        const tillInput = document.getElementById(denominationId.replace('float', ''));
        if (!tillInput) return false;

        const availableQuantity = parseInt(tillInput.value) || 0;
        return availableQuantity >= requestedQuantity;
    }

    /**
     * Suggest optimal float distribution
     */
    suggestFloat() {
        this.clearFloat();

        let remaining = this.FLOAT_TARGET;
        const suggestions = {};

        const floatStrategy = [
            { id: 'floatNote20', tillId: 'note20', value: 20, target: 4, maxBag: 1 },
            { id: 'floatNote10', tillId: 'note10', value: 10, target: 4, maxBag: 1 },
            { id: 'floatNote5', tillId: 'note5', value: 5, target: 6, maxBag: 1 },
            { id: 'floatCoin200', tillId: 'coin200', value: 2, target: 8, maxBag: 1 },
            { id: 'floatCoin100', tillId: 'coin100', value: 1, target: 20, maxBag: 20 },
            { id: 'floatCoin50', tillId: 'coin50', value: 0.5, target: 20, maxBag: 20 },
            { id: 'floatCoin20', tillId: 'coin20', value: 0.2, target: 25, maxBag: 25 },
            { id: 'floatCoin10', tillId: 'coin10', value: 0.1, target: 30, maxBag: 50 },
            { id: 'floatCoin5', tillId: 'coin5', value: 0.05, target: 20, maxBag: 100 },
            { id: 'floatCoin2', tillId: 'coin2', value: 0.02, target: 25, maxBag: 50 },
            { id: 'floatCoin1', tillId: 'coin1', value: 0.01, target: 50, maxBag: 100 }
        ];

        floatStrategy.forEach(item => {
            if (remaining <= 0) return;

            const available = parseInt(document.getElementById(item.tillId).value) || 0;

            let smartTarget = item.target;
            if (item.maxBag > 1) {
                if (available >= item.maxBag) {
                    smartTarget = item.target;
                } else if (available >= item.maxBag / 2) {
                    smartTarget = Math.min(item.target, Math.floor(available * 0.7));
                } else {
                    smartTarget = Math.min(item.target, Math.floor(available * 0.5));
                }
            }

            const needed = Math.min(smartTarget, available, Math.floor(remaining / item.value));

            if (needed > 0) {
                suggestions[item.id] = needed;
                remaining -= needed * item.value;
                remaining = Math.round(remaining * 100) / 100;
            }
        });

        Object.entries(suggestions).forEach(([id, quantity]) => {
            document.getElementById(id).value = quantity;
        });

        if (remaining > 0) {
            this.adjustFloatForRemaining(remaining);
        }

        if (this.calculateFloatFromSuggestions(suggestions) > this.FLOAT_TARGET) {
            this.reduceFloatToTarget(suggestions);
        }

        this.updateFloatCalculations();
        this.saveData();
        
        if (this.floatTotal === this.FLOAT_TARGET) {
            this.showFloatFeedback('Perfect! Exactly £200.00 float achieved.', 'success');
        } else {
            const shortage = this.FLOAT_TARGET - this.floatTotal;
            if (shortage > 0) {
                this.showFloatFeedback(`Float suggested: £${this.floatTotal.toFixed(2)}. Not enough cash available to reach exact £200.00 target. Need £${shortage.toFixed(2)} more.`, 'danger');
            } else {
                this.showFloatFeedback(`Float suggested: £${this.floatTotal.toFixed(2)}. Exceeds £200.00 target. Remove £${Math.abs(shortage).toFixed(2)}.`, 'danger');
            }
        }
    }

    /**
     * Calculate float total from current suggestions object
     */
    calculateFloatFromSuggestions(suggestions) {
        let total = 0;
        Object.entries(suggestions).forEach(([id, quantity]) => {
            const input = document.getElementById(id);
            if (input) {
                const value = parseFloat(input.dataset.value);
                total += value * quantity;
            }
        });
        return Math.round(total * 100) / 100;
    }

    /**
     * Aggressively adjust float suggestion to reach exactly £200
     */
    adjustFloatForRemaining(remaining) {
        const allDenominations = [
            { id: 'floatNote20', tillId: 'note20', value: 20 },
            { id: 'floatNote10', tillId: 'note10', value: 10 },
            { id: 'floatNote5', tillId: 'note5', value: 5 },
            { id: 'floatCoin200', tillId: 'coin200', value: 2 },
            { id: 'floatCoin100', tillId: 'coin100', value: 1 },
            { id: 'floatCoin50', tillId: 'coin50', value: 0.5 },
            { id: 'floatCoin20', tillId: 'coin20', value: 0.2 },
            { id: 'floatCoin10', tillId: 'coin10', value: 0.1 },
            { id: 'floatCoin5', tillId: 'coin5', value: 0.05 },
            { id: 'floatCoin2', tillId: 'coin2', value: 0.02 },
            { id: 'floatCoin1', tillId: 'coin1', value: 0.01 }
        ];

        let attempts = 0;
        while (remaining > 0 && attempts < 10) {
            let progress = false;

            allDenominations.forEach(item => {
                if (remaining <= 0) return;

                const currentFloat = parseInt(document.getElementById(item.id).value) || 0;
                const available = parseInt(document.getElementById(item.tillId).value) || 0;
                const needed = Math.floor(remaining / item.value);
                const canAdd = Math.min(needed, available - currentFloat);

                if (canAdd > 0) {
                    document.getElementById(item.id).value = currentFloat + canAdd;
                    remaining -= canAdd * item.value;
                    remaining = Math.round(remaining * 100) / 100;
                    progress = true;
                }
            });

            if (!progress) break;
            attempts++;
        }
    }

    /**
     * Reduce float amounts to reach exactly £200 when over target
     */
    reduceFloatToTarget(suggestions) {
        let currentTotal = this.calculateFloatTotal();
        let excess = currentTotal - this.FLOAT_TARGET;

        const reductionOrder = [
            { id: 'floatNote20', value: 20 },
            { id: 'floatNote10', value: 10 },
            { id: 'floatNote5', value: 5 },
            { id: 'floatCoin200', value: 2 },
            { id: 'floatCoin100', value: 1 },
            { id: 'floatCoin50', value: 0.5 },
            { id: 'floatCoin20', value: 0.2 },
            { id: 'floatCoin10', value: 0.1 },
            { id: 'floatCoin5', value: 0.05 },
            { id: 'floatCoin2', value: 0.02 },
            { id: 'floatCoin1', value: 0.01 }
        ];

        reductionOrder.forEach(item => {
            if (excess <= 0) return;

            const current = parseInt(document.getElementById(item.id).value) || 0;
            const toRemove = Math.min(Math.floor(excess / item.value), current);

            if (toRemove > 0) {
                document.getElementById(item.id).value = current - toRemove;
                excess -= toRemove * item.value;
                excess = Math.round(excess * 100) / 100;
            }
        });
    }

    /**
     * Show temporary feedback message
     */
    showFloatFeedback(message, type = 'info') {
        let feedback = document.getElementById('floatFeedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.id = 'floatFeedback';
            feedback.className = 'alert mt-3';
            document.querySelector('#floatSelection').appendChild(feedback);
        }

        feedback.className = `alert alert-${type} mt-3`;
        feedback.innerHTML = `<i class="bi bi-info-circle me-2"></i>${message}`;

        setTimeout(() => {
            if (feedback && feedback.parentNode) {
                feedback.remove();
            }
        }, 3000);
    }

    /**
     * Clear all float inputs
     */
    clearFloat() {
        const floatInputs = document.querySelectorAll('.float-input');
        floatInputs.forEach(input => {
            input.value = '';
        });
        this.updateFloatCalculations();
    }

    /**
     * Reset all inputs
     */
    resetAll() {
        document.querySelectorAll('.denomination-input').forEach(input => {
            input.value = '';
        });

        document.getElementById('expectedTakings').value = '';
        this.expectedTakings = 0;
        this.clearFloat();
        this.setInitialDate();
        this.loadSavedData();
        this.updateCalculations();

        document.getElementById('comparisonSection').style.display = 'none';
        document.getElementById('breakdownSection').style.display = 'none';
        document.getElementById('floatError').classList.add('d-none');
        const feedback = document.getElementById('floatFeedback');
        if (feedback) {
            feedback.remove();
        }
    }

    /**
     * Format currency for display
     */
    formatCurrency(amount) {
        return `£${amount.toFixed(2)}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TillCounter();
});

