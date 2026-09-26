// Runs before the first paint (loaded in <head>): applies the saved theme so a visitor who chose
// the light theme never sees a dark flash. Dark is the default. Kept tiny on purpose.
try {
    if (localStorage.getItem('theme') === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    }
} catch (err) {
    // storage can be blocked (private mode, strict privacy settings): keep the dark default
}
