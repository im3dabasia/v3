$(function() {
  const body = document.querySelector('body');
  const toggle = document.getElementById('toggle');
  const input = document.getElementById('switch');

  // Every block below is guarded: these scripts load on every page, and only
  // the home page has all of these elements.
  if (input && toggle) {
    input.checked = false;

    toggle.addEventListener('click', function() {
      const isChecked = input.checked;
      if (isChecked) {
        body.classList.remove('night');
      } else {
        body.classList.add('night');
      }
    });
  }

  const intro = document.querySelector('.intro');
  const topButton = document.getElementById('top-button');

  if (topButton) {
    const $topButton = $('#top-button');
    // Without a hero to scroll past, reveal the button after a screenful.
    const revealAfter = intro ? intro.offsetHeight : window.innerHeight;

    window.addEventListener(
      'scroll',
      function() {
        if (window.scrollY > revealAfter) {
          $topButton.fadeIn();
        } else {
          $topButton.fadeOut();
        }
      },
      false
    );

    topButton.addEventListener('click', function() {
      $('html, body').animate({ scrollTop: 0 }, 500);
    });
  }

  const hand = document.querySelector('.emoji.wave-hand');

  if (hand) {
    function waveOnLoad() {
      hand.classList.add('wave');
      setTimeout(function() {
        hand.classList.remove('wave');
      }, 2000);
    }

    setTimeout(function() {
      waveOnLoad();
    }, 1000);

    hand.addEventListener('mouseover', function() {
      hand.classList.add('wave');
    });

    hand.addEventListener('mouseout', function() {
      hand.classList.remove('wave');
    });
  }

  if (typeof ScrollReveal === 'function' && document.querySelector('.section')) {
    window.sr = ScrollReveal({
      reset: false,
      duration: 600,
      easing: 'cubic-bezier(.694,0,.335,1)',
      scale: 1,
      viewFactor: 0.3,
    });

    sr.reveal('.background');
    sr.reveal('.skills');
    sr.reveal('.experience', { viewFactor: 0.2 });
    sr.reveal('.featured-projects', { viewFactor: 0.1 });
    sr.reveal('.other-projects', { viewFactor: 0.05 });
  }
});
