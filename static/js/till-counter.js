/**
 * Till Counter & Float Manager
 * JavaScript functionality for real-time calculations and float management
 */

class TillCounter {
    constructor() {
        this.FLOAT_TARGET = 200.00; // £200 target float
        this.totalCash = 0;
        this.floatTotal = 0;
        this.takings = 0;
        this.expectedTakings = 0;
        
        this.initializeEventListeners();
        this.loadSavedData();
        this.updateCalculations();
    }

    /**
     * Initialize all event listeners
     */
    initializeEventListeners() {
        // Denomination input listeners
        const denominationInputs = document.querySelectorAll('.denomination-input');
        denominationInputs.forEach(input => {
            input.addEventListener('input', () => {
                this.updateCalculations();
                this.saveData();
            });
        });

        // Float input listeners
        const floatInputs = document.querySelectorAll('.float-input');
        floatInputs.forEach(input => {
            input.addEventListener('input', () => {
                this.updateFloatCalculations();
                this.saveData();
            });
        });

        // Expected takings listener
        const expectedTakingsInput = document.getElementById('expectedTakings');
        expectedTakingsInput.addEventListener('input', () => {
            this.updateExpectedTakings();
            this.saveData();
        });

        // Button listeners
        document.getElementById('resetBtn').addEventListener('click', () => this.resetAll());
        document.getElementById('suggestFloatBtn').addEventListener('click', () => this.suggestFloat());
        document.getElementById('clearFloatBtn').addEventListener('click', () => this.clearFloat());
        
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
            total += value * quantity;
        });
        
        return Math.round(total * 100) / 100; // Round to 2 decimal places
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
            total += value * quantity;
        });
        
        return Math.round(total * 100) / 100; // Round to 2 decimal places
    }

    /**
     * Update all calculations and display
     */
    updateCalculations() {
        this.totalCash = this.calculateTotalCash();
        this.updateFloatCalculations();
        
        // Update total display
        document.getElementById('totalAmount').textContent = `£${this.totalCash.toFixed(2)}`;
        document.getElementById('summaryTotal').textContent = `£${this.totalCash.toFixed(2)}`;
    }

    /**
     * Update float calculations and validate
     */
    updateFloatCalculations() {
        this.floatTotal = this.calculateFloatTotal();
        this.takings = Math.max(0, this.totalCash - this.floatTotal);
        
        // Update display
        document.getElementById('floatTotal').textContent = `£${this.floatTotal.toFixed(2)}`;
        document.getElementById('summaryFloat').textContent = `£${this.floatTotal.toFixed(2)}`;
        document.getElementById('summaryTakings').textContent = `£${this.takings.toFixed(2)}`;
        
        // Validate float amount
        this.validateFloat();
        
        // Update comparison if expected takings is set
        this.updateComparison();
        
        // Update denomination breakdown
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
            // Show comparison section
            comparisonSection.style.display = 'block';
            
            // Update displays
            document.getElementById('expectedDisplay').textContent = `£${this.expectedTakings.toFixed(2)}`;
            document.getElementById('actualDisplay').textContent = `£${this.takings.toFixed(2)}`;
            
            // Calculate variance
            const variance = this.takings - this.expectedTakings;
            const variancePercent = this.expectedTakings > 0 ? (variance / this.expectedTakings * 100) : 0;
            
            document.getElementById('varianceDisplay').textContent = `${variance >= 0 ? '+' : ''}£${variance.toFixed(2)}`;
            document.getElementById('variancePercent').textContent = `(${variancePercent >= 0 ? '+' : ''}${variancePercent.toFixed(1)}%)`;
            
            // Set comparison card color and message based on variance
            let cardClass = 'border-success';
            let messageClass = 'alert-success';
            let icon = 'bi-check-circle';
            let message = '';
            
            if (Math.abs(variance) <= 5) {
                // Within £5 - excellent
                message = 'Excellent! Takings match expected amount closely.';
                cardClass = 'border-success';
                messageClass = 'alert-success';
                icon = 'bi-check-circle';
            } else {
                // Over £5 difference - needs attention
                message = variance > 0 ? 
                    `Takings exceed expected amount by £${Math.abs(variance).toFixed(2)}. Check for errors.` :
                    `Takings are below expected amount by £${Math.abs(variance).toFixed(2)}. Investigation needed.`;
                cardClass = 'border-danger';
                messageClass = 'alert-danger';
                icon = 'bi-exclamation-triangle';
            }
            
            // Apply styling
            comparisonCard.className = `card ${cardClass}`;
            comparisonMessage.className = `alert mb-0 ${messageClass}`;
            comparisonText.innerHTML = `<i class="bi ${icon} me-2"></i>${message}`;
            
        } else {
            // Hide comparison section if no expected takings
            comparisonSection.style.display = 'none';
        }
    }

    /**
     * Save all input data to localStorage
     */
    saveData() {
        try {
            const data = {
                expectedTakings: document.getElementById('expectedTakings').value,
                denominations: {},
                floats: {},
                timestamp: new Date().toISOString(),
                date: new Date().toDateString() // Add date for reference
            };

            // Save denomination inputs
            document.querySelectorAll('.denomination-input').forEach(input => {
                data.denominations[input.id] = input.value;
            });

            // Save float inputs
            document.querySelectorAll('.float-input').forEach(input => {
                data.floats[input.id] = input.value;
            });

            localStorage.setItem('tillCounterData', JSON.stringify(data));
            // Also save a backup with today's date
            const today = new Date().toISOString().split('T')[0];
            localStorage.setItem(`tillCounterData_${today}`, JSON.stringify(data));
            
            this.showSaveIndicator();
            console.log('Data saved to localStorage at', new Date().toLocaleTimeString());
        } catch (error) {
            console.error('Failed to save data to localStorage:', error);
        }
    }

    /**
     * Load saved data from localStorage
     */
    loadSavedData() {
        try {
            let savedData = localStorage.getItem('tillCounterData');
            
            // If main data doesn't exist, try today's backup
            if (!savedData) {
                const today = new Date().toISOString().split('T')[0];
                savedData = localStorage.getItem(`tillCounterData_${today}`);
            }
            
            if (!savedData) {
                console.log('No saved data found');
                return;
            }

            const data = JSON.parse(savedData);
            console.log('Loading saved data from', data.date || data.timestamp);
            
            // Load expected takings
            if (data.expectedTakings) {
                document.getElementById('expectedTakings').value = data.expectedTakings;
                this.expectedTakings = parseFloat(data.expectedTakings) || 0;
            }

            // Load denomination inputs
            if (data.denominations) {
                Object.entries(data.denominations).forEach(([id, value]) => {
                    const input = document.getElementById(id);
                    if (input && value) {
                        input.value = value;
                    }
                });
            }

            // Load float inputs
            if (data.floats) {
                Object.entries(data.floats).forEach(([id, value]) => {
                    const input = document.getElementById(id);
                    if (input && value) {
                        input.value = value;
                    }
                });
            }
            
            console.log('Data loaded successfully');

        } catch (error) {
            console.warn('Failed to load saved data:', error);
            // Try loading from backup if main data is corrupted
            try {
                const today = new Date().toISOString().split('T')[0];
                const backupData = localStorage.getItem(`tillCounterData_${today}`);
                if (backupData) {
                    console.log('Attempting to load from backup...');
                    const data = JSON.parse(backupData);
                    if (data.expectedTakings) {
                        document.getElementById('expectedTakings').value = data.expectedTakings;
                    }
                }
            } catch (backupError) {
                console.warn('Failed to load backup data:', backupError);
            }
        }
    }

    /**
     * Clear saved data from localStorage
     */
    clearSavedData() {
        localStorage.removeItem('tillCounterData');
    }







    /**
     * Load selected date from date picker
     */


    /**
     * Format date for display
     */
    formatDate(dateStr) {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-GB', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        }
    }

    /**
     * Show save indicator briefly
     */
    showSaveIndicator() {
        const indicator = document.getElementById('saveIndicator');
        indicator.style.display = 'inline-block';
        
        // Hide after 2 seconds
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
        
        // Only show breakdown if there's cash in the till
        if (this.totalCash <= 0) {
            breakdownSection.style.display = 'none';
            return;
        }
        
        breakdownSection.style.display = 'block';
        
        // Define all denominations in order
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
            if (totalQuantity === 0) return; // Skip if no quantity
            
            // Get float quantity (0 if no float input for this denomination)
            const floatInput = denom.floatId ? document.getElementById(denom.floatId) : null;
            const floatQuantity = floatInput ? (parseInt(floatInput.value) || 0) : 0;
            const removeQuantity = Math.max(0, totalQuantity - floatQuantity);
            
            // Add to remove list if there's something to remove
            if (removeQuantity > 0) {
                const removeValue = removeQuantity * denom.value;
                removeHTML += `<div class="d-flex justify-content-between border-bottom py-1">
                    <span>${denom.label}:</span>
                    <span><strong>${removeQuantity} × ${this.formatDenomination(denom.value)} = £${removeValue.toFixed(2)}</strong></span>
                </div>`;
                hasRemovalItems = true;
            }
            
            // Add to leave list if there's something in float
            if (floatQuantity > 0) {
                const floatValue = floatQuantity * denom.value;
                leaveHTML += `<div class="d-flex justify-content-between border-bottom py-1">
                    <span>${denom.label}:</span>
                    <span><strong>${floatQuantity} × ${this.formatDenomination(denom.value)} = £${floatValue.toFixed(2)}</strong></span>
                </div>`;
                hasFloatItems = true;
            }
        });
        
        // Display results or empty messages
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
        // Clear current float
        this.clearFloat();
        
        let remaining = this.FLOAT_TARGET;
        const suggestions = {};
        
        // Define realistic float composition based on coin bag amounts and practical needs
        const floatStrategy = [
            { id: 'floatNote20', tillId: 'note20', value: 20, target: 4, maxBag: 1 }, // £80 in £20s
            { id: 'floatNote10', tillId: 'note10', value: 10, target: 4, maxBag: 1 }, // £40 in £10s  
            { id: 'floatNote5', tillId: 'note5', value: 5, target: 6, maxBag: 1 },   // £30 in £5s
            { id: 'floatCoin200', tillId: 'coin200', value: 2, target: 8, maxBag: 1 }, // £16 in £2s
            { id: 'floatCoin100', tillId: 'coin100', value: 1, target: 20, maxBag: 20 }, // £20 in £1s (1 bag = £20)
            { id: 'floatCoin50', tillId: 'coin50', value: 0.5, target: 20, maxBag: 20 }, // £10 in 50p (half bag = £10)
            { id: 'floatCoin20', tillId: 'coin20', value: 0.2, target: 25, maxBag: 25 }, // £5 in 20p (1 bag = £5)
            { id: 'floatCoin10', tillId: 'coin10', value: 0.1, target: 30, maxBag: 50 }, // £3 in 10p (partial bag)
            { id: 'floatCoin5', tillId: 'coin5', value: 0.05, target: 20, maxBag: 100 }, // £1 in 5p (partial bag)
            { id: 'floatCoin2', tillId: 'coin2', value: 0.02, target: 25, maxBag: 50 }, // 50p in 2p (half bag)
            { id: 'floatCoin1', tillId: 'coin1', value: 0.01, target: 50, maxBag: 100 }  // 50p in 1p (half bag)
        ];
        
        // Apply strategy based on availability and practical bag amounts
        floatStrategy.forEach(item => {
            if (remaining <= 0) return;
            
            const available = parseInt(document.getElementById(item.tillId).value) || 0;
            
            // For coins, prefer using complete or reasonable portions of bags
            let smartTarget = item.target;
            if (item.maxBag > 1) {
                // For coins that come in bags, be more conservative
                if (available >= item.maxBag) {
                    // We have at least a full bag, use the target amount
                    smartTarget = item.target;
                } else if (available >= item.maxBag / 2) {
                    // We have at least half a bag, use a smaller amount
                    smartTarget = Math.min(item.target, Math.floor(available * 0.7));
                } else {
                    // Very few coins available, use sparingly
                    smartTarget = Math.min(item.target, Math.floor(available * 0.5));
                }
            }
            
            const needed = Math.min(smartTarget, available, Math.floor(remaining / item.value));
            
            if (needed > 0) {
                suggestions[item.id] = needed;
                remaining -= needed * item.value;
                remaining = Math.round(remaining * 100) / 100; // Handle floating point precision
            }
        });
        
        // Apply suggestions to inputs
        Object.entries(suggestions).forEach(([id, quantity]) => {
            document.getElementById(id).value = quantity;
        });
        
        // If we couldn't reach exactly £200, try harder to adjust with any available denominations
        if (remaining > 0) {
            this.adjustFloatForRemaining(remaining);
        }
        
        // If we're over £200, reduce denominations to get exactly £200
        if (this.calculateFloatFromSuggestions(suggestions) > this.FLOAT_TARGET) {
            this.reduceFloatToTarget(suggestions);
        }
        
        this.updateFloatCalculations();
        
        // Show detailed feedback
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
        // Try all denominations, starting with largest that fit
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
        
        // Keep trying until we reach exactly £200 or run out of options
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
            
            if (!progress) break; // No more adjustments possible
            attempts++;
        }
    }

    /**
     * Reduce float amounts to reach exactly £200 when over target
     */
    reduceFloatToTarget(suggestions) {
        let currentTotal = this.calculateFloatTotal();
        let excess = currentTotal - this.FLOAT_TARGET;
        
        // Remove denominations starting with largest values to reduce excess
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
        // Create or update feedback element
        let feedback = document.getElementById('floatFeedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.id = 'floatFeedback';
            feedback.className = 'alert mt-3';
            document.querySelector('#floatSelection').appendChild(feedback);
        }
        
        feedback.className = `alert alert-${type} mt-3`;
        feedback.innerHTML = `<i class="bi bi-info-circle me-2"></i>${message}`;
        
        // Auto-hide after 3 seconds
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
        // Reset denomination inputs
        const denominationInputs = document.querySelectorAll('.denomination-input');
        denominationInputs.forEach(input => {
            input.value = '';
        });
        
        // Reset expected takings
        document.getElementById('expectedTakings').value = '';
        this.expectedTakings = 0;
        
        // Reset float inputs
        this.clearFloat();
        
        // Clear saved data
        this.clearSavedData();
        
        // Update calculations
        this.updateCalculations();
        
        // Hide comparison section
        document.getElementById('comparisonSection').style.display = 'none';
        
        // Hide breakdown section
        document.getElementById('breakdownSection').style.display = 'none';
        
        // Hide any error messages
        document.getElementById('floatError').classList.add('d-none');
        
        // Remove any feedback messages
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

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TillCounter();
});
