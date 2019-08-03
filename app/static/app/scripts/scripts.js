'use-strict';

(function () {
  // Home page animation values.
  const MAX_FAIL_SAFE_DELAY = 1000;
  const LOGO_ANIMATION_INITIAL_WIDTH = 3200;
  const LOGO_ANIMATION_INITIAL_HEIGHT = 2400;
  const IMG_GROWTH = 200;
  const MAX_DAILY_LOGO_ANIMATION_RUNS = 2;
  // Galery lazy loading values.
  const GALERY_LAZY_LOADING_BATCH_SIZE = 9;
  const GALERY_LAZY_LOADING_AZURE_BLOB_ACCOUNT = 'https://solaro.blob.core.windows.net';
  const GALERY_LAZY_LOADING_AZURE_BLOB_CONTAINER = 'fed';
  // Home page image colorizing
  const IMG_COLORIZING_URL_PATTERN = '/static/images/mainImg_0';
  const IMG_COLORIZING_FILE_EXT = '.jpg';

  // Referencing HTML elements for usage in JS.
  const menuToggle = document.getElementById('spinner-form');
  const menuNav = document.getElementById('menu-nav');
  const logoImg = document.getElementById('logo');
  const animatedLogoImg = document.getElementById('animated-logo');
  const scrollRoot = document.getElementById('scroll-root');
  const container = document.getElementById('container');
  const loader = document.getElementById('loader');
  const homeImg1 = document.getElementById('small-img-1');
  const homeImg2 = document.getElementById('small-img-2');
  const homeImg3 = document.getElementById('small-img-3');
  
  // Variables.
  let logoAnimationDailyRunCountStored = localStorage.getItem('logo-animation-daily-run-count');
  let logoAnimationLastRunDateStored = localStorage.getItem('logo-animation-last-run-date');
  let runLogoAnomation = true;
  let lazyLoadingNextMarker = '';
  // xhr object to handle the API call.
  let xhr = new XMLHttpRequest();

  // Event listeners.
  window.addEventListener('resize', positionAnimationLogo);
  menuToggle.addEventListener('click', toggleMenu);
  if (homeImg1 != null && homeImg2 != null && homeImg3 != null) {
    homeImg1.addEventListener('mouseover', function(e) { swapColorizationImage(e, true); }); 
    homeImg1.addEventListener('mouseout', function(e) { swapColorizationImage(e, false); }); 
    homeImg2.addEventListener('mouseover', function(e) { swapColorizationImage(e, true); }); 
    homeImg2.addEventListener('mouseout', function(e) { swapColorizationImage(e, false); }); 
    homeImg3.addEventListener('mouseover', function(e) { swapColorizationImage(e, true); }); 
    homeImg3.addEventListener('mouseout', function(e) { swapColorizationImage(e, false); }); 
  }

  // Mobile menu toggeling function.
  function toggleMenu() {
    menuNav.classList.toggle('menu-toggle');
  }

  // Clolorizing main page images.
  function swapColorizationImage(event, colorize) {
    let imgUrl = IMG_COLORIZING_URL_PATTERN;
    
    // Add image identification as a part of image URL (last character e.g. 'small-img-1').
    imgUrl += event.currentTarget.id[event.currentTarget.id.length -1];

    // Compse image URL in the way so it points to coloured image.
    if (colorize) {
      imgUrl += 'c';
    }
    // Add file extention to the image URL.
    imgUrl += IMG_COLORIZING_FILE_EXT;

    event.currentTarget.setAttribute('src', imgUrl)
  }

  // Home page logo animation functions.
  if(animatedLogoImg && animatedLogoImg.style) {
    // Animation is only to run couple of times, then it should be disabled.
    runLogoAnomation = checkForLogoAnimationRun();

    if (runLogoAnomation) {
      positionAnimationLogo();
      animateLogo();
    }
    else {
      animatedLogoImg.style.opacity = 0;
    }
  }

  function  positionAnimationLogo() {
    const rect = logoImg.getBoundingClientRect();
    if(animatedLogoImg && animatedLogoImg.style) {
      animatedLogoImg.style.position = 'absolute';

      // Calculate and set initial position of animated logo
      let midPoint = (rect.left + rect.right) / 2;
      animatedLogoImg.style.left = (midPoint - LOGO_ANIMATION_INITIAL_WIDTH / 2)  + 'px';
      animatedLogoImg.style.top = '0px';
      animatedLogoImg.style.width = LOGO_ANIMATION_INITIAL_WIDTH + 'px';
      animatedLogoImg.style.height = LOGO_ANIMATION_INITIAL_HEIGHT + 'px';
    }
  }

  async function animateLogo() {
    if(animatedLogoImg && animatedLogoImg.style) {
      animatedLogoImg.style.opacity = .05;

      let growthFactor = 1;

      for (let index = 0; index < 20; index++) {
        await sleep(50);

        // Retrieve positions and sizes of the main logo and animated logo images.
        const animaterImgRect = animatedLogoImg.getBoundingClientRect();
        const logoImgRect = logoImg.getBoundingClientRect();

        // Animate until animated image is greater that main logo image (8-15 iterations depending on screen size).
        if (animaterImgRect.height < logoImgRect.height) {
          animatedLogoImg.style.opacity = 0;
          break;
        }

        // Slow down animation speed when animated image gets smaller.
        if (logoImgRect.width * 2 > animaterImgRect.width) {
          growthFactor = .5;
        }

        // Change aniomated logo image size.
        animatedLogoImg.style.position = 'absolute';
        animatedLogoImg.style.left = animaterImgRect.left + (IMG_GROWTH * growthFactor / 2) + 'px';
        animatedLogoImg.style.top = animaterImgRect.top + 'px';
        animatedLogoImg.style.height = animaterImgRect.height - IMG_GROWTH * growthFactor / (4 / 3) + 'px';
        animatedLogoImg.style.width = animaterImgRect.width - IMG_GROWTH * growthFactor + 'px';

        // Gradually increase animated logo image opacity until it gets close to value 1
        if (animatedLogoImg.style.opacity < 1) {
          let currentOpacity = parseFloat(animatedLogoImg.style.opacity);
          animatedLogoImg.style.opacity = currentOpacity + .015;
        }
      }
    }
  }

  function checkForLogoAnimationRun() {
    let today = (new Date()).getDate();  // Day 1-31.
  
    if(logoAnimationDailyRunCountStored && logoAnimationLastRunDateStored) {
      // If desired animation run amout had exceeded, return false.
      if (today == logoAnimationLastRunDateStored && logoAnimationDailyRunCountStored >= MAX_DAILY_LOGO_ANIMATION_RUNS) {
        logoAnimationDailyRunCountStored = 0;
  
        return false;
      }
      else {
        // If we have new day, reset counter to 1, else increment it.
        if (today != logoAnimationLastRunDateStored) {
          logoAnimationDailyRunCountStored = 1;
        }
        else {
          logoAnimationDailyRunCountStored = parseInt(logoAnimationDailyRunCountStored) + 1;
        }
  
        // Persist animation count and date in local browser storage.
        localStorage.setItem('logo-animation-daily-run-count', logoAnimationDailyRunCountStored);
        localStorage.setItem('logo-animation-last-run-date', today);
      }
    }
    else {
      // Persist animation count and date in local browser storage when run first time.
      localStorage.setItem('logo-animation-daily-run-count', 1);
      localStorage.setItem('logo-animation-last-run-date', today);
    }
  
    return true;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms || MAX_FAIL_SAFE_DELAY));
  }

  // Functions for lazy loading of gallery images on scrolling down the page
  if (window.location.pathname.includes('/gallery')) {
    initLazyLoading();
  }

  async function initLazyLoading() {
    // The conditional event stream.
    let eventIterator = events(document, 'scroll', () => scrollRoot.scrollHeight <= scrollRoot.scrollTop + scrollRoot.clientHeight);

    // Iterating over the items stream, appending items as they arrive.
    for await (const page of items(GALERY_LAZY_LOADING_BATCH_SIZE)) {
      append(page);

      // Await the next emission of the conditional event.
      await eventIterator.next();
    }
  }
  
  function getContent(offset, num) {
    let arr = [];
    // Request url.
    let blobUrl = GALERY_LAZY_LOADING_AZURE_BLOB_ACCOUNT + '/' + GALERY_LAZY_LOADING_AZURE_BLOB_CONTAINER + '?restype=container&comp=list&maxresults=' + num;

    // Append Next marker information if not requesting first batch
    if (lazyLoadingNextMarker != '') {
      blobUrl += '&marker=' + lazyLoadingNextMarker;
    }

    // open API connection
    xhr.open('GET', blobUrl, true);
    // set user agent header
    xhr.setRequestHeader('Api-User-Agent', 'Solaro/1.0');
    // send the request
    xhr.send();
    // if the response was ok, handle the response data using the gatherData function
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        // Get XML document from response.
        let xmlDoc = xhr.responseXML;

        // Deal with the XML data.
        arr = processBlobData(xmlDoc);
      }
    };

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(arr);
      }, 500);
    });
  }
  
  function processBlobData(xmlData) {
    let arr = [];

    // Next marker is used to maintain correct paging
    lazyLoadingNextMarker = xmlData.getElementsByTagName('NextMarker')[0].innerHTML;
    let blobs = xmlData.getElementsByTagName('Blobs')[0].childNodes;

    // Extract image file names, add them to blob storage URL and store them in an array.
    blobs.forEach(element => {
      let imgFileName = element.getElementsByTagName('Name')[0].innerHTML;
      arr.push(GALERY_LAZY_LOADING_AZURE_BLOB_ACCOUNT + '/' + GALERY_LAZY_LOADING_AZURE_BLOB_CONTAINER + '/' + imgFileName);
    });

    return arr;
  }

  // Returns a generator which returns the items as a stream.
  async function* items(batchSize) {
    let offset = 0;
    while (true) {
      yield await getContent(offset, batchSize);
      offset += batchSize;
    }
  }
  
  async function* events(el, name, condition) {
    let resolve;
    el.addEventListener(name, e => {
      if (condition(e)) {
        // Resolve the promise whenever the supplied condition is true.
        resolve(e);
      }
    });

    // Emitting when the conditional event promise resolves.
    while (true) {
      yield await new Promise(_resolve => resolve = _resolve);
    }
  }

  function append(items) {
    let dom = items.map(item => `<div class='gallery-item'><div class='scale'><img class='gallery-item-img' src='${item}' alt='another gallery item'></div></div>`).join('');
    container.insertAdjacentHTML('beforeend', dom);
    container.append(loader);
  }
})();

// Google maps
let map;
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 52.4867111, lng: -1.956712},
    zoom: 19
  });
}
