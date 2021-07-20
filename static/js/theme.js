var theme = window.localStorage.getItem('theme') ?? 'light';

var root = document.documentElement;

var update_theme = () => {
    if (theme == 'dark') {
        root.style.setProperty('--prim', '#202020');
        root.style.setProperty('--prim-shadow', '#101010');
        root.style.setProperty('--prim-shadow-sec', '#000000');
        root.style.setProperty('--sec', '#ffffff');
        root.style.setProperty('--sec-shadow', '#c0c0c0');
        root.style.setProperty('--sec-shadow-sec', '#d0d0d0');
    } else if (theme == 'light') {
        root.style.setProperty('--prim', '#ffffff');
        root.style.setProperty('--prim-shadow', '#c0c0c0');
        root.style.setProperty('--prim-shadow-sec', '#d0d0d0');
        root.style.setProperty('--sec', '#202020');
        root.style.setProperty('--sec-shadow', '#101010');
        root.style.setProperty('--sec-shadow-sec', '#000000');
    }
}

update_theme();