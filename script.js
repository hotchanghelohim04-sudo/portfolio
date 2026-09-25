// DOM Elements
const header = document.querySelector('header');
const navLinks = document.querySelector('.nav-links');
const hamburger = document.querySelector('.hamburger');
const navLinksItems = document.querySelectorAll('.nav-links li');
const themeToggle = document.querySelector('.theme-toggle');
const moonIcon = document.querySelector('.fa-moon');
const sunIcon = document.querySelector('.fa-sun');
const contactForm = document.getElementById('contact-form');

// Header scroll effect (guarded)
if (header) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('header-scroll');
        } else {
            header.classList.remove('header-scroll');
        }
    });
}

// Mobile Navigation
if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('nav-active');
        hamburger.classList.toggle('active');
        document.body.classList.toggle('no-scroll'); // Prevent body scrolling when menu is open
    });
}

// Close mobile menu when clicking on a link
if (navLinksItems && navLinksItems.length && navLinks) {
    navLinksItems.forEach(item => {
        item.addEventListener('click', () => {
            if (navLinks.classList.contains('nav-active')) {
                navLinks.classList.remove('nav-active');
                if (hamburger) hamburger.classList.remove('active');
                document.body.classList.remove('no-scroll');
            }
        });
    });
}

// Theme toggle functionality
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');

        // Toggle icons if available
        if (moonIcon) moonIcon.style.display = document.body.classList.contains('light-theme') ? 'none' : 'block';
        if (sunIcon) sunIcon.style.display = document.body.classList.contains('light-theme') ? 'block' : 'none';

        // Save theme preference to localStorage
        const theme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
        try {
            localStorage.setItem('theme', theme);
        } catch (err) {
            // ignore storage errors (e.g., private mode)
        }
    });
}

// Load saved theme preference
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        if (moonIcon) moonIcon.style.display = 'none';
        if (sunIcon) sunIcon.style.display = 'block';
    }

    // Add animations with delay for elements
    const animateElements = () => {
        const sections = document.querySelectorAll('section');

        sections.forEach(section => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('section-animate');
                    }
                });
            }, { threshold: 0.1 });

            observer.observe(section);
        });
    };

    animateElements();
});

// Handle contact form submission (Netlify Forms)
if (contactForm) {
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const formStatus = document.getElementById('form-status');
    const submitLabel = submitButton ? submitButton.textContent : '';

    // Built with DOM APIs only, so what the visitor typed is never parsed as HTML
    const showStatus = (type, iconClass, text) => {
        const icon = document.createElement('i');
        icon.className = iconClass;
        icon.setAttribute('aria-hidden', 'true');

        const message = document.createElement('p');
        message.textContent = text;

        formStatus.className = `form-status form-status-${type}`;
        formStatus.replaceChildren(icon, message);
    };

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = new FormData(contactForm);
        const name = String(data.get('name')).trim();

        // Native validation covers empty fields; this catches whitespace-only input
        const isBlank = ['name', 'email', 'subject', 'message']
            .some(field => !String(data.get(field)).trim());
        if (isBlank) {
            showStatus('error', 'fas fa-exclamation-circle', 'Please fill out all fields.');
            return;
        }

        formStatus.className = 'form-status';
        formStatus.replaceChildren();
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';

        try {
            const response = await fetch('/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(data).toString()
            });

            if (!response.ok) {
                throw new Error(`Form submission failed (${response.status})`);
            }

            contactForm.reset();
            showStatus('success', 'fas fa-check-circle',
                `Thank you, ${name}! Your message has been sent and I'll get back to you soon.`);
        } catch (err) {
            showStatus('error', 'fas fa-exclamation-circle',
                'Sorry, your message could not be sent. Please try again in a moment, or use the contact details next to this form.');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = submitLabel;
        }
    });
}

// Add smooth scrolling to all links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        const targetId = this.getAttribute('href');
        if (targetId === '#') return; // Skip if href is just "#"

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80, // Adjust for header height
                behavior: 'smooth'
            });
        }
    });
});

// Add typing effect to the binary in hero section
const binaryElement = document.querySelector('.binary');
if (binaryElement) {
    const originalText = binaryElement.innerText;
    binaryElement.innerText = '';

    let i = 0;
    const typeWriter = () => {
        if (i < originalText.length) {
            binaryElement.innerText += originalText.charAt(i);
            i++;
            setTimeout(typeWriter, 50);
        }
    };

    // Start typing effect when page loads
    setTimeout(typeWriter, 1000);
}
