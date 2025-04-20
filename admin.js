// Constants
const CONTACTS_PER_PAGE = 10;
const API_BASE_URL = 'http://localhost:3000/api';

// State
let contacts = [];
let currentPage = 1;
let currentFilter = 'all';
let currentSearch = '';
let selectedContact = null;

// DOM Elements
const contactsTableBody = document.getElementById('contactsTableBody');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const currentPageSpan = document.getElementById('currentPage');
const totalPagesSpan = document.getElementById('totalPages');
const logoutBtn = document.getElementById('logoutBtn');

// Modal Elements
const viewModal = document.getElementById('viewModal');
const replyModal = document.getElementById('replyModal');
const previewModal = document.getElementById('previewModal');
const closeViewModal = document.getElementById('closeViewModal');
const closeReplyModal = document.getElementById('closeReplyModal');
const closePreviewModal = document.getElementById('closePreviewModal');

// View Modal Elements
const viewName = document.getElementById('viewName');
const viewEmail = document.getElementById('viewEmail');
const viewMessage = document.getElementById('viewMessage');
const viewDate = document.getElementById('viewDate');
const replyBtn = document.getElementById('replyBtn');
const deleteBtn = document.getElementById('deleteBtn');

// Reply Modal Elements
const replyForm = document.getElementById('replyForm');
const replyMessage = document.getElementById('replyMessage');
const previewBtn = document.getElementById('previewBtn');
const sendReplyBtn = document.getElementById('sendReplyBtn');

// Preview Modal Elements
const previewEmail = document.getElementById('previewEmail');
const previewMessage = document.getElementById('previewMessage');
const backToEditBtn = document.getElementById('backToEditBtn');
const confirmSendBtn = document.getElementById('confirmSendBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadContacts();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Search and Filter
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    statusFilter.addEventListener('change', handleFilterChange);

    // Pagination
    prevPageBtn.addEventListener('click', () => changePage(currentPage - 1));
    nextPageBtn.addEventListener('click', () => changePage(currentPage + 1));

    // Modals
    closeViewModal.addEventListener('click', () => hideModal(viewModal));
    closeReplyModal.addEventListener('click', () => hideModal(replyModal));
    closePreviewModal.addEventListener('click', () => hideModal(previewModal));

    // Actions
    replyBtn.addEventListener('click', showReplyModal);
    deleteBtn.addEventListener('click', handleDelete);
    previewBtn.addEventListener('click', showPreviewModal);
    backToEditBtn.addEventListener('click', () => {
        hideModal(previewModal);
        showModal(replyModal);
    });
    confirmSendBtn.addEventListener('click', sendReply);
    sendReplyBtn.addEventListener('click', sendReply);
    logoutBtn.addEventListener('click', handleLogout);

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === viewModal) hideModal(viewModal);
        if (e.target === replyModal) hideModal(replyModal);
        if (e.target === previewModal) hideModal(previewModal);
    });
}

// API Functions
async function loadContacts() {
    try {
        const response = await fetch(`${API_BASE_URL}/contacts?page=${currentPage}&limit=${CONTACTS_PER_PAGE}&status=${currentFilter}&search=${currentSearch}`);
        const data = await response.json();
        
        contacts = data.contacts;
        const totalPages = Math.ceil(data.total / CONTACTS_PER_PAGE);
        
        displayContacts();
        updatePagination(totalPages);
    } catch (error) {
        showNotification('Error loading contacts', 'error');
        console.error('Error loading contacts:', error);
    }
}

async function sendReply() {
    if (!selectedContact || !replyMessage.value.trim()) return;

    try {
        const response = await fetch(`${API_BASE_URL}/contacts/${selectedContact.id}/reply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: replyMessage.value.trim()
            })
        });

        if (response.ok) {
            hideModal(replyModal);
            hideModal(previewModal);
            replyMessage.value = '';
            showNotification('Reply sent successfully', 'success');
            loadContacts();
        } else {
            throw new Error('Failed to send reply');
        }
    } catch (error) {
        showNotification('Error sending reply', 'error');
        console.error('Error sending reply:', error);
    }
}

async function deleteContact() {
    if (!selectedContact) return;

    try {
        const response = await fetch(`${API_BASE_URL}/contacts/${selectedContact.id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            hideModal(viewModal);
            showNotification('Contact deleted successfully', 'success');
            loadContacts();
        } else {
            throw new Error('Failed to delete contact');
        }
    } catch (error) {
        showNotification('Error deleting contact', 'error');
        console.error('Error deleting contact:', error);
    }
}

// Display Functions
function displayContacts() {
    contactsTableBody.innerHTML = '';
    
    contacts.forEach(contact => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${contact.name}</td>
            <td>${contact.email}</td>
            <td>${truncateText(contact.message, 50)}</td>
            <td><span class="status-badge status-${contact.status}">${contact.status}</span></td>
            <td>${formatDate(contact.date)}</td>
            <td>
                <button class="action-btn view-btn" data-id="${contact.id}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn reply-btn" data-id="${contact.id}">
                    <i class="fas fa-reply"></i>
                </button>
                <button class="action-btn delete-btn" data-id="${contact.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        // Add event listeners to action buttons
        const viewBtn = row.querySelector('.view-btn');
        const replyBtn = row.querySelector('.reply-btn');
        const deleteBtn = row.querySelector('.delete-btn');

        viewBtn.addEventListener('click', () => showContactDetails(contact));
        replyBtn.addEventListener('click', () => {
            selectedContact = contact;
            showReplyModal();
        });
        deleteBtn.addEventListener('click', () => {
            selectedContact = contact;
            showDeleteConfirmation();
        });

        contactsTableBody.appendChild(row);
    });
}

function updatePagination(totalPages) {
    currentPageSpan.textContent = currentPage;
    totalPagesSpan.textContent = totalPages;
    
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
}

// Modal Functions
function showModal(modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function hideModal(modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

function showContactDetails(contact) {
    selectedContact = contact;
    viewName.textContent = contact.name;
    viewEmail.textContent = contact.email;
    viewMessage.textContent = contact.message;
    viewDate.textContent = formatDate(contact.date);
    showModal(viewModal);
}

function showReplyModal() {
    if (!selectedContact) return;
    replyMessage.value = '';
    showModal(replyModal);
}

function showPreviewModal() {
    if (!selectedContact || !replyMessage.value.trim()) return;
    
    previewEmail.textContent = selectedContact.email;
    previewMessage.textContent = replyMessage.value.trim();
    showModal(previewModal);
}

function showDeleteConfirmation() {
    if (confirm('Are you sure you want to delete this contact?')) {
        deleteContact();
    }
}

// Helper Functions
function handleSearch(e) {
    currentSearch = e.target.value.trim();
    currentPage = 1;
    loadContacts();
}

function handleFilterChange(e) {
    currentFilter = e.target.value;
    currentPage = 1;
    loadContacts();
}

function changePage(page) {
    currentPage = page;
    loadContacts();
}

function handleLogout() {
    // Clear any stored authentication data
    localStorage.removeItem('adminToken');
    // Redirect to login page
    window.location.href = 'login.html';
}

function truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
} 