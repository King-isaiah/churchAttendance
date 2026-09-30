
function showError(message) {
    showToastify(message, 'error');
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
// Utility functions


function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}
function formatTime(timeString) {
    if (!timeString) return 'N/A';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

function formatDateTime(dateTimeString) {
    if (!dateTimeString) return 'N/A';
    return new Date(dateTimeString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

function handleApiError(response, context = 'operation') {
    console.error(`API Error in ${context}:`, response);
    
    switch (response.errorType) {
        case 'validation':
            showError(response.message);
            break;
            
        case 'not_found':            
            showError(response.message);
            break;
            
        case 'server':
        default:
            showError('A server error occurred. Please try again.');
            
            // Log detailed error for developers
            if (response.debugInfo) {
                console.error('Debug Info:', response.debugInfo);
            }
            break;
    }
}
function showSuccess(message) {
    // alert('fucking work you fucking bastard')
    showToastify(message, 'success');
}

// Enhanced toastify function with more options
function showToastify(message, type = 'info', duration = 5000) {
    // alert('i am in the showTiastify fuunction ')
    const container = document.getElementById('toastifyContainer');
    if (!container) {
        console.error('Toastify container not found');
        alert('is this where the problem is')
        return;
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toastify ${type}`;
    
    // Set icons for different types
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'i'
    };
    
    // Set titles for different types
    const titles = {
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        info: 'Information'
    };

    toast.innerHTML = `
        <div class="toastify-content">
            <div class="toastify-icon">${icons[type]}</div>
            <div class="toastify-message">
                <strong>${titles[type]}:</strong> ${message}
            </div>
        </div>
        <button class="toastify-close">&times;</button>
        <div class="toastify-progress">
            <div class="toastify-progress-bar"></div>
        </div>
    `;

    // Add to container
    container.appendChild(toast);

    // Show animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Close button functionality
    const closeBtn = toast.querySelector('.toastify-close');
    closeBtn.onclick = () => {
        removeToast(toast);
    };

    // Auto remove after duration
    const autoRemove = setTimeout(() => {
        removeToast(toast);
    }, duration);

    // Pause progress bar on hover
    toast.addEventListener('mouseenter', () => {
        const progressBar = toast.querySelector('.toastify-progress-bar');
        if (progressBar) {
            progressBar.style.animationPlayState = 'paused';
        }
        clearTimeout(autoRemove);
    });

    // Resume progress bar on mouse leave
    toast.addEventListener('mouseleave', () => {
        const progressBar = toast.querySelector('.toastify-progress-bar');
        if (progressBar) {
            progressBar.style.animationPlayState = 'running';
        }
        setTimeout(() => {
            removeToast(toast);
        }, duration - 1000);
    });

    // Limit number of toasts to 5
    const toasts = container.querySelectorAll('.toastify');
    if (toasts.length > 5) {
        removeToast(toasts[0]);
    }
}

// Remove toast with animation
function removeToast(toast) {
    toast.classList.remove('show');
    toast.classList.add('hide');
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 400);
}

// Additional utility functions
function showWarning(message) {
    showToastify(message, 'warning');
}

function showInfo(message) {
    showToastify(message, 'info');
}

// Quick show functions for common use cases
function toastSuccess(message) {
    showToastify(message, 'success');
}

function toastError(message) {
    showToastify(message, 'error');
}

function toastWarning(message) {
    showToastify(message, 'warning');
}

function toastInfo(message) {
    showToastify(message, 'info');
}

// Universal Pagination System
class PaginationSystem {
    constructor(config = {}) {
        this.currentPage = 1;
        this.itemsPerPage = config.itemsPerPage || 5;
        this.allData = [];
        this.filteredData = [];
        this.currentSearchTerm = '';
        this.currentFilter = '';
        this.renderTableCallback = null;
        this.updateResultsCallback = null;
        
        // Default configuration
        this.config = {
            containerId: 'pagination',
            pageInfoId: 'page-info',
            resultsCountId: 'results-count',
            totalCountId: 'total-count',
            ...config
        };
    }
    
    initialize(data, renderTableCallback, updateResultsCallback = null) {
        this.allData = data;
        this.filteredData = [...data];
        this.renderTableCallback = renderTableCallback;
        this.updateResultsCallback = updateResultsCallback;
        this.currentPage = 1;
        this.render();
    }
    
    filterData(searchTerm = '', filterValue = '', customFilterFn = null) {
        this.currentSearchTerm = searchTerm.toLowerCase();
        this.currentFilter = filterValue;
        this.currentPage = 1;
        
        if (this.currentSearchTerm === '' && this.currentFilter === '' && !customFilterFn) {
            this.filteredData = [...this.allData];
        } else {
            this.filteredData = this.allData.filter(item => {
                const matchesSearch = this.currentSearchTerm === '' || 
                    Object.values(item).some(value => 
                        String(value).toLowerCase().includes(this.currentSearchTerm)
                    );
                
                const matchesFilter = this.currentFilter === '' || 
                    this.matchesFilterCondition(item, this.currentFilter);
                
                const matchesCustom = customFilterFn ? customFilterFn(item) : true;
                
                return matchesSearch && matchesFilter && matchesCustom;
            });
        }
        
        this.render();
    }
    
    matchesFilterCondition(item, filterValue) {
        // Default implementation - can be overridden
        if (item.department_id !== undefined) {
            return String(item.department_id) === filterValue;
        }
        return true;
    }
    
    render() {
        if (this.renderTableCallback) {
            const startIndex = (this.currentPage - 1) * this.itemsPerPage;
            const endIndex = Math.min(startIndex + this.itemsPerPage, this.filteredData.length);
            const pageData = this.filteredData.slice(startIndex, endIndex);
            
            this.renderTableCallback(pageData, startIndex);
        }
        
        this.renderPagination();
        this.updateResultsCount();
    }
    
    renderPagination() {
        const pagination = document.getElementById(this.config.containerId);
        const pageInfo = document.getElementById(this.config.pageInfoId);
        
        if (!pagination) return;
        
        pagination.innerHTML = '';
        
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        
        if (totalPages <= 1) {
            if (pageInfo) pageInfo.textContent = '';
            return;
        }
        
        // Previous button
        const prevButton = document.createElement('button');
        prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevButton.disabled = this.currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.render();
            }
        });
        pagination.appendChild(prevButton);
        
        // Page buttons
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.classList.toggle('active', i === this.currentPage);
            pageButton.addEventListener('click', () => {
                this.currentPage = i;
                this.render();
            });
            pagination.appendChild(pageButton);
        }
        
        // Next button
        const nextButton = document.createElement('button');
        nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextButton.disabled = this.currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.render();
            }
        });
        pagination.appendChild(nextButton);
        
        // Page info
        if (pageInfo) {
            pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
        }
    }
    
    updateResultsCount() {
        const resultsCount = document.getElementById(this.config.resultsCountId);
        const totalCount = document.getElementById(this.config.totalCountId);
        
        if (resultsCount && totalCount) {
            const startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
            const endIndex = Math.min(startIndex + this.itemsPerPage - 1, this.filteredData.length);
            
            resultsCount.textContent = this.filteredData.length === 0 ? '0' : `${startIndex}-${endIndex}`;
            totalCount.textContent = this.filteredData.length;
        }
        
        if (this.updateResultsCallback) {
            this.updateResultsCallback(this.filteredData.length);
        }
    }
    
    getCurrentPageData() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.filteredData.length);
        return this.filteredData.slice(startIndex, endIndex);
    }
    
    setItemsPerPage(count) {
        this.itemsPerPage = count;
        this.currentPage = 1;
        this.render();
    }
    
    refreshData(newData) {
        this.allData = newData;
        this.filteredData = [...newData];
        this.currentPage = 1;
        this.render();
    }
}

// Create global pagination instance
window.pagination = new PaginationSystem();

// Helper function to quickly initialize pagination
function initializePagination(data, renderTableCallback, config = {}) {
    const pagination = new PaginationSystem(config);
    pagination.initialize(data, renderTableCallback);
    return pagination;
}

function truncateString(str, maxLength) {
    if (str.length > maxLength) {
        return str.slice(0, maxLength) + '...';
    }
    return str;
}