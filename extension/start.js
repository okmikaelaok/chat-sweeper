ChatSweeperTheme.mount(document.documentElement, document.getElementById('theme'));

document.getElementById('about').onclick = ChatSweeperDialogs.anchor(document.getElementById('aboutDialog'), document.getElementById('about'));
document.getElementById('aboutClose').onclick = () => document.getElementById('aboutDialog').close();
