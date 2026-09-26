// DOM Elements
const header = document.querySelector('header');
const navLinks = document.querySelector('.nav-links');
const hamburger = document.querySelector('.hamburger');
const navLinksItems = document.querySelectorAll('.nav-links li');
const themeToggle = document.querySelector('.theme-toggle');
const moonIcon = document.querySelector('.fa-moon');
const sunIcon = document.querySelector('.fa-sun');
const contactForm = document.getElementById('contact-form');
const yearElement = document.getElementById('current-year');

// Footer copyright year: always the current year (the HTML holds a fallback for when JavaScript is off)
if (yearElement) yearElement.textContent = new Date().getFullYear();

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
    // Keeps the menu state, the button label and aria-expanded in sync
    const setMenu = (open) => {
        navLinks.classList.toggle('nav-active', open);
        hamburger.classList.toggle('active', open);
        hamburger.setAttribute('aria-expanded', String(open));
        hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        document.body.classList.toggle('no-scroll', open); // Prevent body scrolling when menu is open
    };

    hamburger.addEventListener('click', () => {
        setMenu(!navLinks.classList.contains('nav-active'));
    });

    // Close mobile menu when clicking on a link
    navLinksItems.forEach(item => {
        item.addEventListener('click', () => {
            if (navLinks.classList.contains('nav-active')) setMenu(false);
        });
    });

    // Escape closes the menu and gives focus back to its button
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks.classList.contains('nav-active')) {
            setMenu(false);
            hamburger.focus();
        }
    });
}

// Theme toggle functionality
const applyTheme = (isLight) => {
    document.body.classList.toggle('light-theme', isLight);

    // Toggle icons if available
    if (moonIcon) moonIcon.style.display = isLight ? 'none' : 'block';
    if (sunIcon) sunIcon.style.display = isLight ? 'block' : 'none';

    // The button's name describes what it will do next
    if (themeToggle) {
        themeToggle.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
    }
};

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const isLight = !document.body.classList.contains('light-theme');
        applyTheme(isLight);

        // Save theme preference to localStorage
        try {
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
        } catch (err) {
            // ignore storage errors (e.g., private mode)
        }
    });
}

// Load saved theme preference
document.addEventListener('DOMContentLoaded', () => {
    let savedTheme = null;
    try {
        savedTheme = localStorage.getItem('theme');
    } catch (err) {
        // storage can be blocked (private mode, strict privacy settings)
    }

    if (savedTheme === 'light') applyTheme(true);

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
