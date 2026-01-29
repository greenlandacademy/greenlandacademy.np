// Greenland Academy Interactive JavaScript

// Open Gallery Page with Facility Filter
// Contact Form Handler
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const submitButton = this.querySelector('button[type="submit"]');
            const messageDiv = document.getElementById('form-message');
            
            // Show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sending...';
            
            // Hide previous messages
            messageDiv.classList.add('hidden');
            
            // Try multiple endpoints for better reliability
            const endpoints = [
                'simple-contact-handler.php',    // Try simple file-based handler first
                'contact-form-handler-v2.php',  // Then enhanced handler
                'contact-form-handler.php'       // Finally original handler
            ];
            
            let currentEndpoint = 0;
            
            function tryNextEndpoint() {
                if (currentEndpoint >= endpoints.length) {
                    // All endpoints failed
                    showError('All email services are currently unavailable. Please try again later or call us directly.');
                    return;
                }
                
                const endpoint = endpoints[currentEndpoint];
                console.log('Trying endpoint:', endpoint);
                
                // Send form data via AJAX
                fetch(endpoint, {
                    method: 'POST',
                    body: formData
                })
                .then(response => {
                    console.log('Response status:', response.status);
                    return response.json();
                })
                .then(data => {
                    console.log('Response data:', data);
                    
                    if (data.success) {
                        // Show success message
                        messageDiv.className = 'mt-4 p-4 rounded-lg bg-green-100 text-green-800 border border-green-300';
                        messageDiv.innerHTML = `
                            <div class="flex items-center">
                                <i class="fas fa-check-circle mr-3 text-green-600"></i>
                                <div>
                                    <strong>Success!</strong> ${data.message}
                                    ${data.debug_info ? '<br><small>Debug: ' + JSON.stringify(data.debug_info) + '</small>' : ''}
                                </div>
                            </div>
                        `;
                        
                        // Reset form
                        contactForm.reset();
                        
                        // Show notification
                        showNotification('Message sent successfully! We will contact you soon.', 'success');
                    } else {
                        // Try next endpoint if this one failed
                        if (currentEndpoint < endpoints.length - 1) {
                            currentEndpoint++;
                            tryNextEndpoint();
                        } else {
                            // All endpoints failed
                            showError(data.message || 'Failed to send message. Please try again.');
                        }
                    }
                })
                .catch(error => {
                    console.error('Error with endpoint', endpoint, ':', error);
                    
                    // Try next endpoint
                    if (currentEndpoint < endpoints.length - 1) {
                        currentEndpoint++;
                        tryNextEndpoint();
                    } else {
                        // All endpoints failed
                        showError('Network error. Please check your connection and try again.');
                    }
                })
                .finally(() => {
                    // Reset button state
                    submitButton.disabled = false;
                    submitButton.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Send Message';
                    
                    // Scroll to message if visible
                    if (!messageDiv.classList.contains('hidden')) {
                        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        
                        // Hide message after 10 seconds
                        setTimeout(() => {
                            messageDiv.classList.add('hidden');
                        }, 10000);
                    }
                });
            }
            
            function showError(message) {
                messageDiv.className = 'mt-4 p-4 rounded-lg bg-red-100 text-red-800 border border-red-300';
                messageDiv.innerHTML = `
                    <div class="flex items-center">
                        <i class="fas fa-exclamation-circle mr-3 text-red-600"></i>
                        <div>
                            <strong>Error!</strong> ${message}
                            <br><small>Please try again or contact us directly at:</small>
                            <br><small>📞 9819304211 / 9842155795</small>
                            <br><small>📧 greenlandacademy12345@gmail.com</small>
                        </div>
                    </div>
                `;
                
                showNotification('Failed to send message. Please try again.', 'error');
            }
            
            // Start trying endpoints
            tryNextEndpoint();
        });
    }
});

function scrollToGallery(facilityType) {
    // Open gallery page with facility filter
    window.open(`gallery.html?facility=${facilityType}`, '_blank');
    
    // Show notification
    const facilityMessages = {
        'science': 'Opening Science Laboratory gallery...',
        'library': 'Opening Library gallery...',
        'bus': 'Opening Bus Transportation gallery...',
        'computer': 'Opening Computer Laboratory gallery...'
    };
    
    showNotification(facilityMessages[facilityType] || 'Opening gallery...', 'info');
}

// Enhanced Enrollment Action Handler
function handleEnrollmentAction() {
    // Scroll down to enrollment form section
    const enrollmentSection = document.getElementById('enrollmentSection');
    if (enrollmentSection) {
        // Make the enrollment section visible by removing hidden class
        enrollmentSection.classList.remove('hidden');
        
        // Smooth scroll to the enrollment section
        enrollmentSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
        });
        
        // Add highlight effect
        enrollmentSection.classList.add('ring-4', 'ring-blue-400', 'ring-opacity-50');
        
        // Remove highlight after animation
        setTimeout(() => {
            enrollmentSection.classList.remove('ring-4', 'ring-blue-400', 'ring-opacity-50');
        }, 2000);
        
        // Show notification
        showNotification('Please complete the enrollment form below', 'info');
    }
}

// Close enrollment section
function closeEnrollmentSection() {
    const enrollmentSection = document.getElementById('enrollmentSection');
    if (enrollmentSection) {
        enrollmentSection.classList.add('hidden');
        showNotification('Enrollment form closed', 'info');
    }
}

// Show enrollment options modal (Desktop)
function showEnrollmentOptionsModal(options) {
    // Create modal HTML
    const modalHTML = `
        <div id="enrollmentOptionsModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-fade-in">
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
                    <div class="flex justify-between items-center">
                        <h3 class="text-2xl font-bold">
                            <i class="fas fa-graduation-cap mr-2"></i>${options.title}
                        </h3>
                        <button onclick="closeEnrollmentOptionsModal()" class="text-white hover:text-gray-200 transition">
                            <i class="fas fa-times text-2xl"></i>
                        </button>
                    </div>
                    <p class="mt-2 text-blue-100">Select how you'd like to proceed with enrollment</p>
                </div>
                <div class="p-6 space-y-4">
                    ${options.options.map(option => `
                        <div class="border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all duration-300 cursor-pointer group" onclick="executeEnrollmentAction('${option.id}')">
                            <div class="flex items-start space-x-4">
                                <div class="text-2xl">${option.title.split(' ')[0]}</div>
                                <div class="flex-1">
                                    <h4 class="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">${option.title.split(' ').slice(1).join(' ')}</h4>
                                    <p class="text-sm text-gray-600 mt-1">${option.description}</p>
                                </div>
                                <i class="fas fa-chevron-right text-gray-400 group-hover:text-blue-600 transition-colors"></i>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
}

// Show mobile enrollment actions (Mobile)
function showMobileEnrollmentActions(options) {
    const actionSheetHTML = `
        <div id="mobileEnrollmentActions" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
            <div class="bg-white rounded-t-2xl w-full max-h-[70vh] overflow-y-auto animate-slide-up">
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl">
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-bold">
                            <i class="fas fa-graduation-cap mr-2"></i>${options.title}
                        </h3>
                        <button onclick="closeMobileEnrollmentActions()" class="text-white hover:text-gray-200 transition">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                </div>
                <div class="p-4 space-y-2">
                    ${options.options.map(option => `
                        <button onclick="executeEnrollmentAction('${option.id}')" class="w-full text-left p-4 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors group">
                            <div class="flex items-center space-x-3">
                                <span class="text-xl">${option.title.split(' ')[0]}</span>
                                <div class="flex-1">
                                    <div class="font-semibold text-gray-800 group-hover:text-blue-600">${option.title.split(' ').slice(1).join(' ')}</div>
                                    <div class="text-xs text-gray-600 mt-1">${option.description}</div>
                                </div>
                            </div>
                        </button>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', actionSheetHTML);
    document.body.style.overflow = 'hidden';
}

// Execute enrollment action
function executeEnrollmentAction(actionId) {
    const options = {
        'new-enrollment': () => {
            closeEnrollmentOptionsModal();
            closeMobileEnrollmentActions();
            openEnrollmentModal();
        },
        'inquiry': () => {
            closeEnrollmentOptionsModal();
            closeMobileEnrollmentActions();
            document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
            showNotification('Please fill out the contact form for admission inquiries.', 'info');
        },
        'download-form': () => {
            closeEnrollmentOptionsModal();
            closeMobileEnrollmentActions();
            showNotification('Application form download feature coming soon!', 'info');
        },
        'virtual-tour': () => {
            closeEnrollmentOptionsModal();
            closeMobileEnrollmentActions();
            document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });
            showNotification('Welcome to our virtual gallery tour!', 'success');
        }
    };
    
    if (options[actionId]) {
        options[actionId]();
    }
}

// Close enrollment options modal
function closeEnrollmentOptionsModal() {
    const modal = document.getElementById('enrollmentOptionsModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

// Close mobile enrollment actions
function closeMobileEnrollmentActions() {
    const actionSheet = document.getElementById('mobileEnrollmentActions');
    if (actionSheet) {
        actionSheet.remove();
        document.body.style.overflow = 'auto';
    }
}

// Close modals on escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeEnrollmentOptionsModal();
        closeMobileEnrollmentActions();
    }
});

// Close modals on background click
document.addEventListener('click', function(e) {
    if (e.target.id === 'enrollmentOptionsModal') {
        closeEnrollmentOptionsModal();
    }
    if (e.target.id === 'mobileEnrollmentActions') {
        closeMobileEnrollmentActions();
    }
});

// Enrollment Modal Functions
function openEnrollmentModal() {
    const modal = document.getElementById('enrollmentModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
}

function closeEnrollmentModal() {
    const modal = document.getElementById('enrollmentModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = 'auto';
}

// Enrollment Form Handling
function initEnrollmentForm() {
    const enrollmentForm = document.getElementById('enrollmentForm');
    
    if (enrollmentForm) {
        enrollmentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });
            
            // Validation
            if (!validateEnrollmentForm(data)) {
                return;
            }
            
            // Show loading state
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;
            submitButton.innerHTML = '<div class="loading-spinner inline-block w-4 h-4 mr-2"></div>Processing...';
            submitButton.disabled = true;
            
            // Simulate form submission
            setTimeout(() => {
                // Reset form
                this.reset();
                
                // Restore button
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
                
                // Close modal
                closeEnrollmentModal();
                
                // Show success message
                showNotification('Enrollment form submitted successfully! We will contact you soon.', 'success');
            }, 2000);
        });
    }
}

// Enrollment Form Validation
function validateEnrollmentForm(data) {
    // Required field validation
    const requiredFields = ['studentName', 'dateOfBirth', 'gender', 'grade', 'parentName', 'relationship', 'phone', 'email', 'address', 'city', 'terms'];
    
    for (let field of requiredFields) {
        if (!data[field] || data[field].trim() === '') {
            showNotification(`Please fill in all required fields.`, 'error');
            return false;
        }
    }
    
    // Email validation
    if (!isValidEmail(data.email)) {
        showNotification('Please enter a valid email address.', 'error');
        return false;
    }
    
    // Phone validation (Nepal format)
    const phoneRegex = /^(\+977)?[9][6-9]\d{8}$/;
    if (!phoneRegex.test(data.phone.replace(/\s/g, ''))) {
        showNotification('Please enter a valid phone number (e.g., +9779842155795 or 9842155795).', 'error');
        return false;
    }
    
    // Date of birth validation (should be at least 3 years old)
    const dob = new Date(data.dateOfBirth);
    const today = new Date();
    const age = Math.floor((today - dob) / (365.25 * 24 * 60 * 60 * 1000));
    
    if (age < 3) {
        showNotification('Student must be at least 3 years old for enrollment.', 'error');
        return false;
    }
    
    if (age > 18) {
        showNotification('Student age should not exceed 18 years.', 'error');
        return false;
    }
    
    return true;
}

// Toggle Gallery View Function
function toggleGalleryView() {
    const hiddenItems = document.getElementById('hiddenGalleryItems');
    const viewMoreBtn = document.getElementById('viewMoreBtn');
    
    if (hiddenItems.classList.contains('hidden')) {
        // Show hidden items
        hiddenItems.classList.remove('hidden');
        hiddenItems.classList.add('animate-fade-in');
        viewMoreBtn.innerHTML = '<i class="fas fa-images mr-2"></i>View Less Photos';
        
        // Scroll to the newly revealed items
        setTimeout(() => {
            hiddenItems.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    } else {
        // Hide items
        hiddenItems.classList.add('hidden');
        hiddenItems.classList.remove('animate-fade-in');
        viewMoreBtn.innerHTML = '<i class="fas fa-images mr-2"></i>View More Photos';
        
        // Scroll back to gallery section
        document.getElementById('gallery').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Image Lightbox Functions
let currentImageIndex = 0;
let galleryImages = [];

function initLightbox() {
    // Collect all gallery images
    galleryImages = Array.from(document.querySelectorAll('.gallery-item img')).map((img, index) => {
        const galleryItem = img.closest('.gallery-item');
        const title = galleryItem.querySelector('h3').textContent;
        const description = galleryItem.querySelector('p').textContent;
        
        // Add click event to each gallery image
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => openLightbox(index));
        
        return {
            src: img.src,
            alt: img.alt,
            title: title,
            description: description
        };
    });
}

function openLightbox(index) {
    currentImageIndex = index;
    const lightbox = document.getElementById('imageLightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxTitle = document.getElementById('lightboxTitle');
    const lightboxDescription = document.getElementById('lightboxDescription');
    
    // Update lightbox content
    const imageData = galleryImages[index];
    lightboxImage.src = imageData.src;
    lightboxImage.alt = imageData.alt;
    lightboxTitle.textContent = imageData.title;
    lightboxDescription.textContent = imageData.description;
    
    // Show lightbox
    lightbox.classList.remove('hidden');
    lightbox.classList.add('flex');
    document.body.style.overflow = 'hidden';
    
    // Add fade-in animation
    lightbox.classList.add('animate-fade-in');
}

function closeLightbox() {
    const lightbox = document.getElementById('imageLightbox');
    lightbox.classList.add('hidden');
    lightbox.classList.remove('flex');
    document.body.style.overflow = 'auto';
}

function navigateLightbox(direction) {
    if (direction === 'next') {
        currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
    } else if (direction === 'prev') {
        currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
    }
    
    // Update lightbox with new image
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxTitle = document.getElementById('lightboxTitle');
    const lightboxDescription = document.getElementById('lightboxDescription');
    
    const imageData = galleryImages[currentImageIndex];
    lightboxImage.src = imageData.src;
    lightboxImage.alt = imageData.alt;
    lightboxTitle.textContent = imageData.title;
    lightboxDescription.textContent = imageData.description;
    
    // Add transition effect
    lightboxImage.style.opacity = '0';
    setTimeout(() => {
        lightboxImage.style.opacity = '1';
    }, 100);
}

// Keyboard navigation for lightbox
document.addEventListener('keydown', function(e) {
    const lightbox = document.getElementById('imageLightbox');
    if (!lightbox.classList.contains('hidden')) {
        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowLeft') {
            navigateLightbox('prev');
        } else if (e.key === 'ArrowRight') {
            navigateLightbox('next');
        }
    }
});

// Close lightbox when clicking on background
document.addEventListener('click', function(e) {
    const lightbox = document.getElementById('imageLightbox');
    if (e.target === lightbox && !e.target.closest('#lightboxImage')) {
        closeLightbox();
    }
});

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('enrollmentModal');
    if (e.target === modal) {
        closeEnrollmentModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('enrollmentModal');
        if (!modal.classList.contains('hidden')) {
            closeEnrollmentModal();
        }
    }
});

// Scroll to specific section
function scrollToSection(sectionId) {
    const targetElement = document.getElementById(sectionId);
    if (targetElement) {
        const offsetTop = targetElement.offsetTop - 80; // Account for fixed navbar
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all features
    initMobileMenu();
    initSmoothScrolling();
    initScrollAnimations();
    initGalleryFiltering();
    initContactForm();
    initScrollToTop();
    initNavbarScroll();
    initCounterAnimation();
    initLazyLoading();
    initKeyboardNavigation();
    initAccessibilityFeatures();
    initEnrollmentForm();
    initLightbox();
});

// Mobile Menu Toggle
function initMobileMenu() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('show');
            mobileMenu.classList.toggle('hidden');
            
            // Toggle icon
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });
        
        // Close mobile menu when clicking on links
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.remove('show');
                mobileMenu.classList.add('hidden');
                const icon = mobileMenuButton.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-bars');
                    icon.classList.remove('fa-times');
                }
            });
        });
    }
}

// Smooth Scrolling for Navigation Links
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 80; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Scroll Animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
                
                // Add stagger animation for cards
                const cards = entry.target.querySelectorAll('.card-hover, .faculty-card, .gallery-item');
                cards.forEach((card, index) => {
                    setTimeout(() => {
                        card.classList.add('animate-fade-in');
                    }, index * 100);
                });
            }
        });
    }, observerOptions);
    
    // Observe all sections
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        observer.observe(section);
    });
}

// Gallery Filtering
function initGalleryFiltering() {
    const filterButtons = document.querySelectorAll('.gallery-filter');
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    if (filterButtons.length > 0 && galleryItems.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                const filter = this.getAttribute('data-filter');
                
                galleryItems.forEach(item => {
                    const category = item.getAttribute('data-category');
                    
                    if (filter === 'all' || category === filter) {
                        item.style.display = 'block';
                        setTimeout(() => {
                            item.classList.add('animate-fade-in');
                        }, 100);
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }
}

// Contact Form Validation and Submission
function initContactForm() {
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const name = this.querySelector('input[type="text"]').value.trim();
            const email = this.querySelector('input[type="email"]').value.trim();
            const message = this.querySelector('textarea').value.trim();
            
            // Validation
            let isValid = true;
            let errorMessage = '';
            
            if (name.length < 2) {
                errorMessage = 'Please enter your name (at least 2 characters)';
                isValid = false;
            } else if (!isValidEmail(email)) {
                errorMessage = 'Please enter a valid email address';
                isValid = false;
            } else if (message.length < 10) {
                errorMessage = 'Please enter a message (at least 10 characters)';
                isValid = false;
            }
            
            if (!isValid) {
                showNotification(errorMessage, 'error');
                return;
            }
            
            // Show loading state
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;
            submitButton.innerHTML = '<div class="loading-spinner"></div> Sending...';
            submitButton.disabled = true;
            
            // Simulate form submission (replace with actual endpoint)
            setTimeout(() => {
                // Reset form
                this.reset();
                
                // Restore button
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
                
                // Show success message
                showNotification('Thank you for your message! We will get back to you soon.', 'success');
            }, 2000);
        });
    }
}

// Email Validation Helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        margin-left: 16px;
    `;
    
    closeBtn.addEventListener('click', () => {
        notification.remove();
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Scroll to Top Button
function initScrollToTop() {
    const scrollTopButton = document.createElement('button');
    scrollTopButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
    scrollTopButton.className = 'scroll-top';
    document.body.appendChild(scrollTopButton);
    
    // Show/hide button based on scroll position
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollTopButton.classList.add('show');
        } else {
            scrollTopButton.classList.remove('show');
        }
    });
    
    // Scroll to top when clicked
    scrollTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Navbar Scroll Effect
function initNavbarScroll() {
    const navbar = document.querySelector('nav');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// Counter Animation for Statistics
function initCounterAnimation() {
    const counters = document.querySelectorAll('.stat-number');
    const speed = 200;
    
    const observerOptions = {
        threshold: 0.5
    };
    
    const counterObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-target'));
                const increment = target / speed;
                
                let current = 0;
                counter.classList.add('counting');
                const updateCounter = () => {
                    current += increment;
                    if (current < target) {
                        // Add special formatting for specific counters
                        if (counter.getAttribute('data-target') === '500') {
                            counter.innerText = Math.ceil(current) + '+';
                        } else if (counter.getAttribute('data-target') === '20') {
                            counter.innerText = Math.ceil(current) + '+';
                        } else {
                            counter.innerText = Math.ceil(current);
                        }
                        requestAnimationFrame(updateCounter);
                    } else {
                        // Set final values with proper formatting
                        if (counter.getAttribute('data-target') === '500') {
                            counter.innerText = '500+';
                        } else if (counter.getAttribute('data-target') === '20') {
                            counter.innerText = '20+';
                        } else {
                            counter.innerText = '26';
                        }
                        counter.classList.remove('counting');
                    }
                };
                
                updateCounter();
                counterObserver.unobserve(counter);
            }
        });
    }, observerOptions);
    
    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}

// Lazy Loading for Images
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => {
        imageObserver.observe(img);
    });
}

// Keyboard Navigation
function initKeyboardNavigation() {
    // Tab navigation enhancement
    const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    
    document.addEventListener('keydown', function(e) {
        // ESC key to close mobile menu
        if (e.key === 'Escape') {
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
                mobileMenu.classList.remove('show');
            }
        }
    });
}

// Accessibility Features
function initAccessibilityFeatures() {
    // Add ARIA labels dynamically
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        if (!button.getAttribute('aria-label') && !button.textContent.trim()) {
            const icon = button.querySelector('i');
            if (icon) {
                const iconClass = icon.className;
                if (iconClass.includes('fa-bars')) {
                    button.setAttribute('aria-label', 'Toggle mobile menu');
                } else if (iconClass.includes('fa-arrow-up')) {
                    button.setAttribute('aria-label', 'Scroll to top');
                }
            }
        }
    });
    
    // Focus management for mobile menu
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            const isExpanded = !mobileMenu.classList.contains('hidden');
            this.setAttribute('aria-expanded', isExpanded);
            
            if (isExpanded) {
                // Focus first menu item
                const firstMenuItem = mobileMenu.querySelector('a');
                if (firstMenuItem) {
                    setTimeout(() => firstMenuItem.focus(), 100);
                }
            }
        });
    }
}

// Utility Functions
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

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Performance optimization for scroll events
const optimizedScroll = throttle(function() {
    // Scroll-related optimizations
    const scrolled = window.pageYOffset;
    
    // Parallax effect for hero section
    const heroSection = document.getElementById('home');
    if (heroSection) {
        const speed = 0.5;
        heroSection.style.transform = `translateY(${scrolled * speed}px)`;
    }
}, 10);

window.addEventListener('scroll', optimizedScroll);

// Error handling
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
    // You could send this to an error tracking service
});

// Service Worker Registration (for PWA capabilities)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // Uncomment and create service-worker.js file for PWA functionality
        // navigator.serviceWorker.register('/service-worker.js')
        //     .then(function(registration) {
        //         console.log('SW registered: ', registration);
        //     })
        //     .catch(function(registrationError) {
        //         console.log('SW registration failed: ', registrationError);
        //     });
    });
}

// Initialize tooltips and popovers if needed
function initTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = this.getAttribute('data-tooltip');
            tooltip.style.cssText = `
                position: absolute;
                background: #1f2937;
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 14px;
                z-index: 1000;
                pointer-events: none;
                white-space: nowrap;
            `;
            
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
            tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
        });
        
        element.addEventListener('mouseleave', function() {
            const tooltip = document.querySelector('.tooltip');
            if (tooltip) {
                tooltip.remove();
            }
        });
    });
}

// Call tooltips initialization
initTooltips();

// Console welcome message
console.log('%c🎓 Welcome to Greenland Academy Website! 🎓', 'font-size: 20px; color: #2563eb; font-weight: bold;');
console.log('%cBuilt with ❤️ for educational excellence', 'font-size: 14px; color: #7c3aed;');
