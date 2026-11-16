ChatSweeperTheme.mount(document.documentElement, document.getElementById('theme'), undefined, {key:'chatsweeper:start-theme'});

document.getElementById('about').onclick = ChatSweeperDialogs.anchor(document.getElementById('aboutDialog'), document.getElementById('about'));
document.getElementById('aboutClose').onclick = () => document.getElementById('aboutDialog').close();

const carousel = document.getElementById('screenshotCarousel');
const slides = [...carousel.querySelectorAll('.carousel-slide')];
const screenshotDialog = document.getElementById('screenshotDialog');
let selectedSlide = 1;

function selectSlide(index) {
  selectedSlide = (index + slides.length) % slides.length;
  slides.forEach((slide, slideIndex) => {
    const offset = (slideIndex - selectedSlide + slides.length) % slides.length;
    slide.dataset.position = offset === 0 ? 'current' : offset === 1 ? 'next' : offset === slides.length - 1 ? 'previous' : 'hidden';
    slide.hidden = slide.dataset.position === 'hidden';
    slide.setAttribute('aria-label', (offset === 0 ? 'Expand ' : 'Show ') + slide.dataset.caption + ' screenshot');
    if (offset === 0) slide.setAttribute('aria-current', 'true');
    else slide.removeAttribute('aria-current');
  });
  document.getElementById('carouselCaption').textContent = slides[selectedSlide].dataset.caption + ' · ' + (selectedSlide + 1) + ' of ' + slides.length;
}

function expandSlide() {
  const selectedImage = slides[selectedSlide].querySelector('img');
  const expandedImage = document.getElementById('screenshotImage');
  expandedImage.src = selectedImage.src;
  expandedImage.alt = selectedImage.alt;
  document.getElementById('screenshotTitle').textContent = slides[selectedSlide].dataset.caption;
  screenshotDialog.showModal();
  document.getElementById('screenshotClose').focus({preventScroll:true});
}

slides.forEach((slide, index) => {
  slide.onclick = () => index === selectedSlide ? expandSlide() : selectSlide(index);
});
document.getElementById('carouselPrevious').onclick = () => selectSlide(selectedSlide - 1);
document.getElementById('carouselNext').onclick = () => selectSlide(selectedSlide + 1);
document.getElementById('carouselExpand').onclick = expandSlide;
carousel.addEventListener('keydown', event => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  selectSlide(selectedSlide + (event.key === 'ArrowRight' ? 1 : -1));
});
document.getElementById('screenshotClose').onclick = () => screenshotDialog.close();
screenshotDialog.addEventListener('click', event => {
  if (event.target !== screenshotDialog) return;
  const bounds = screenshotDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) screenshotDialog.close();
});
