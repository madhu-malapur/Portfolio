document.addEventListener('DOMContentLoaded', () => {
    // Initialize contact form if it exists
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        console.log('Contact form found, attaching listener');
        contactForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Initialize projects if container exists
    const projectsContainer = document.getElementById('projects-container');
    if (projectsContainer) {
        loadProjects();
    }
    
    // Initialize certificates if container exists
    const certificatesContainer = document.getElementById('certificates-container');
    if (certificatesContainer) {
        loadCertificates();
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Initialize navbar scroll effect
    initNavbarScroll();

    // Initialize stats animation
    initStatsAnimation();
});

async function loadProjects() {
    try {
        const response = await fetch('My Projects/projects.json');
        const projects = await response.json();
        const projectsContainer = document.getElementById('projects-container');
        
        projects.forEach(project => {
            const projectCard = createProjectCard(project);
            projectsContainer.appendChild(projectCard);
        });
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

async function loadCertificates() {
    try {
        const response = await fetch('My all Certificates/certificates.json');
        const certificates = await response.json();
        const certificatesContainer = document.getElementById('certificates-container');
        
        certificates.forEach(certificate => {
            const certificateCard = createCertificateCard(certificate);
            certificatesContainer.appendChild(certificateCard);
        });
    } catch (error) {
        console.error('Error loading certificates:', error);
    }
}

function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    
    card.innerHTML = `
        <div class="project-info">
            <h3>${project.title}</h3>
            <p>${project.description}</p>
            <div class="project-links">
                <a href="${project.github}" target="_blank"><i class="fab fa-github"></i></a>
                <a href="${project.demo}" target="_blank"><i class="fas fa-external-link-alt"></i></a>
            </div>
        </div>
    `;
    
    return card;
}

function createCertificateCard(certificate) {
    const card = document.createElement('div');
    card.className = 'certificate-card';
    
    card.innerHTML = `
        <div class="certificate-info">
            <h3>${certificate.title}</h3>
            <p>${certificate.issuer}</p>
            <p>${certificate.date}</p>
            <a href="${certificate.link}" target="_blank">View Certificate</a>
        </div>
    `;
    
    return card;
}

function handleFormSubmit(event) {
    event.preventDefault();
    console.log('Form submitted');
    
    const formData = new FormData(event.target);
    const formObject = {
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message'),
        created_at: new Date().toISOString(),
        status: 'unread'
    };
    
    console.log('Form data:', formObject);
    
    // Store contact in localStorage
    const contacts = JSON.parse(localStorage.getItem('contacts') || '[]');
    contacts.push(formObject);
    localStorage.setItem('contacts', JSON.stringify(contacts));
    console.log('Updated contacts:', contacts);
    
    // Show success message
    alert('Thank you for your message! I will get back to you soon.');
    event.target.reset();
}

// Navbar scroll effect
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        // Add/remove background when scrolling
        if (currentScroll > 50) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
        
        // Hide/show navbar on scroll up/down
        if (currentScroll > lastScroll && currentScroll > 100) {
            navbar.classList.add('navbar-hidden');
        } else {
            navbar.classList.remove('navbar-hidden');
        }
        
        lastScroll = currentScroll;
    });
}

// Stats animation
function initStatsAnimation() {
    const stats = document.querySelectorAll('.stat-number');
    if (stats.length === 0) return;

    const animationDuration = 2000; // 2 seconds

    const animateStats = () => {
        stats.forEach(stat => {
            const target = parseInt(stat.textContent);
            const increment = target / (animationDuration / 16); // 60fps
            let current = 0;

            const updateCount = () => {
                if (current < target) {
                    current += increment;
                    stat.textContent = Math.round(current) + (stat.textContent.includes('%') ? '%' : '');
                    requestAnimationFrame(updateCount);
                } else {
                    stat.textContent = target + (stat.textContent.includes('%') ? '%' : '');
                }
            };

            updateCount();
        });
    };

    // Intersection Observer for stats animation
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStats();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const statsContainer = document.querySelector('.stats-container');
    if (statsContainer) {
        observer.observe(statsContainer);
    }
} 