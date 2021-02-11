(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define('UIC', ['exports'], factory) :
  (global = global || self, factory(global.UIC = {}));
}(this, (function (exports) { 'use strict';

  var ddsSpace = "dds";
  var ddsToken = "__";

  // parse the package.json file to get needed variables

  const DOC = document;
  const HTML = DOC.documentElement;
  const globalObject = typeof global !== "undefined" ? global : window;
  const prefix = ddsSpace + ddsToken;
  const supportTransitions =
      "Webkit" + "Transition" in HTML["style"] ||
      "Transition"["toLowerCase"]() in HTML["style"];
  const transitionEndEvent =
      "Webkit" + "Transition" in HTML["style"] ?
          "Webkit"["toLowerCase"]() + "Transition" + "End" :
          "Transition"["toLowerCase"]() + "end";
  const transitionDuration =
      "Webkit" + "Duration" in HTML["style"] ?
          "Webkit"["toLowerCase"]() + "Transition" + "Duration" :
          "Transition"["toLowerCase"]() + "Duration";
  const tipPositions = /\b(top|bottom|left|right)+/;
  const isIPhone = (/(IPhone)/i.test(navigator.platform));
  const isIOS = (/iPad|iPhone|iPod|Macintosh/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) && !window.MSStream; // /(/(IPad)/i.test(navigator.platform)) || (/(IPhone)/i.test(navigator.platform));
  const isIE = (/msie|trident|Windows Phone/i.test(navigator.userAgent));
  const isSafari = (/Version\/[\d.]+.*Safari/i.test(navigator.userAgent));
  const isEdge = (/Edge\/\d./i.test(navigator.userAgent));
  const isFirefox = (/firefox/i.test(navigator.userAgent));
  const isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);
  const direction = {
      UP: 1,
      RIGHT: 2,
      DOWN: 3,
      LEFT: 4,
      NONE: 5
  };

  // selection methods
  function getFullScreenOverlay() {
      var overlay = DOC.getElementById(prefix + "full-screen-overlay");
      if (!overlay) {
          console.warn("OFF-CANVAS: Overlay requested. Corresponding HTML missing. Please apply id 'dds__full-screen-overlay' and class 'dds__overlay' to an empty div");
          return false;
      }
      return overlay;
  }


  function getElementsByClassName(element, classNAME) {
      // returns Array
      return [].slice.call(element["getElementsByClassName"](classNAME));
  }

  function getSibling(element, selector) {

      var firstChar = selector.charAt(0);
      var selectorSubstring = selector.substr(1);

      if (firstChar === ".") {
          if (element.nextElementSibling && element.nextElementSibling.classList) {
              if(element.nextElementSibling.classList.contains(selectorSubstring)) {
                  return element.nextElementSibling;
              } else {
                  return getSibling(element.nextElementSibling, selector);
              }
          }
      }  else if (firstChar === "#") {
          
          if (element.nextElementSibling && element.nextElementSibling.id) {
              if(element.nextElementSibling.id === selectorSubstring) {
                  return element.nextElementSibling;
              } else {
                  return getSibling(element.nextElementSibling, selector);
              }
          }
      } else {
          if (element.nextElementSibling && element.nextElementSibling.tagName) {
              if(element.nextElementSibling.tagName.toLowerCase() === selector.toLowerCase()) {
                  return element.nextElementSibling;
              } else {
                  return getSibling(element.nextElementSibling, selector);
              }
          }
      }
  }

  function getFocusableElements(element) {
      var arr = Array.prototype.slice.call(element.querySelectorAll("*:not([aria-expanded='false']) a[href],*:not([aria-expanded='false']) area[href],*:not([aria-expanded='false']) input:not([disabled]),*:not([aria-expanded='false']) select:not([disabled]),*:not([aria-expanded='false']) textarea:not([disabled]),*:not([aria-expanded='false']) button:not([disabled]):not(.dds__d-none), *:not([aria-expanded='false']) > .dds__accordion-card-body > ul > [tabindex='0']"));
      return arr.filter(filterCollapsedParents);
  }

  function filterCollapsedParents(element) {
      for(;element && element !== DOC; element = element.parentElement) {
          if (element.parentElement) {
              if ((element.parentElement.classList.contains("dds__collapse") && element.parentElement.getAttribute("aria-expanded") == "false") || element.parentElement.classList.contains(prefix + "d-none")) {
                  return false;
              } 
          } else {
              return element; //if scaled entire DOM tree and no parents are collapsed, element is focusable
          }
      }
  }

  function getNextFocusableElement(element) {
      for(;element && element !== DOC; element = element.nextElementSibling) {
          if (element.nextElementSibling) {
              if (window.getComputedStyle(element.nextElementSibling).getPropertyValue("display") != "none") {
                  if (["A","AREA","INPUT","SELECT","TEXTAREA","BUTTON"].indexOf(element.nextElementSibling.tagName) != -1
                  && element.nextElementSibling.tabIndex >= 0) {
                      return element.nextElementSibling;
                  } else {
                      var focusable = getFocusableElements(element.nextElementSibling);
                      if (focusable && focusable.length > 0) {
                          return focusable[0];
                      }
                  }
              }
          } else {
              return getNextFocusableElement(element.parentElement);
          }
      }
  }

  /**
   * Creates a temporary, assertive element to announce a message for text reader clients, then removes that element.
   * @param  {String}   theMessage The short text to announce. Consider translation requirements.
   * @return void
   */
  function ariaAnnounce (theMessage) {
      var msgEl,
          randomNum = Math.floor(Math.random() * 999999999) + 1;
      document.body.appendChild(createElement("div", {
          style: "position:absolute; left:-1000px; width: 0px; height: 0px;",
          id: "ariaAnnouncement" + randomNum,
          "aria-live": "assertive"
      }));
      msgEl = document.getElementById("ariaAnnouncement" + randomNum);
      window.setTimeout(function() {
          msgEl.textContent = theMessage;
      }, 15);
      window.setTimeout(function () {
          msgEl.parentElement.removeChild(msgEl);
      }, 5000);
  }


  /**
   * @method getClosest   Crawls the DOM to find the closest targeted element
   * @param element       {DOM element}   the DOM element from which to start searching
   * @param selector      {string}        the class, ID, or tag name for which to search
   * @param parentsOnly   {boolean}       if false or not set, modifies TAG search to include children elements of the currently-inspected target
   * @return {element} or false
   */
  function getClosest(element, selector, parentsOnly) {
      // source http://gomakethings.com/climbing-up-and-down-the-dom-tree-with-vanilla-javascript/
      var firstChar = selector.charAt(0);

      var selectorSubstring = selector.substr(1);
      if (firstChar === ".") {
          // If selector is a class
          for (; element && element !== DOC; element = element.parentNode) {
              // Get closest match
              if (
                  element["parentNode"].querySelector(selector) !== null &&
                  // hasClass(element, selectorSubstring)) {
                  element.classList["contains"](selectorSubstring)
              ) {
                  return element;
              } else if (parentsOnly === false) {
                  if (element.querySelector(selector)) {
                      return element.querySelector(selector);
                  }
              }
          }
      } else if (firstChar === "#") {
          // If selector is an ID
          for (; element && element !== DOC; element = element.parentNode) {
              // Get closest match
              if (element.id === selectorSubstring) {
                  return element;
              } else if (parentsOnly === false) {
                  if (element.querySelector(selector)) {
                      return element.querySelector(selector);
                  }
              }
          }
      } else {
          // If selector is a tagName
          for (; element && element !== DOC; element = element.parentNode) {
              // Get closest match
              if (element.tagName && element.tagName.toLowerCase() === selector.toLowerCase() ) {
                  return element;
              } else if (element.previousElementSibling && element.previousElementSibling.tagName.toLowerCase() === selector.toLowerCase()) {
                  return element.previousElementSibling;
              } else if (parentsOnly === false) {
                  if (element.querySelector(selector)) {
                      return element.querySelector(selector);
                  }
              }
          }
      }
      return false;

  }

  function one(element, event, handler) {
      element.addEventListener(
          event,
          function handlerWrapper(e) {
              handler(e);
              element.removeEventListener(event, handlerWrapper, false);
          },
          false
      );
  }

  function getTransitionDurationFromElement(element) {
      var duration = supportTransitions ?
          globalObject["getComputedStyle"](element)[transitionDuration] :
          0;
      duration = parseFloat(duration);
      duration =
          typeof duration === "number" && !isNaN(duration) ? duration * 1000 : 0;
      return duration + 50; // we take a short offset to make sure we fire on the next frame after animation
  }

  function getAnimationDurationFromElement(element) {
      var duration = supportTransitions ?
          globalObject["getComputedStyle"](element)["animationDuration"] :
          0;
      duration = parseFloat(duration);
      duration =
          typeof duration === "number" && !isNaN(duration) ? duration * 1000 : 0;
      return duration + 50; // we take a short offset to make sure we fire on the next frame after animation
  }

  function emulateTransitionEnd(element, handler) {
      // emulateTransitionEnd since 2.0.4
      var called = 0;

      var duration = getTransitionDurationFromElement(element);
      supportTransitions &&
          one(element, transitionEndEvent, function (e) {
              handler(e);
              called = 1;
          });
      setTimeout(function () {
          !called && handler();
      }, duration);
  }

  function uicoreCustomEvent(componentName, eventName, related, details) {
      var evt;
      if (isIE){
          evt = document.createEvent("CustomEvent");
          evt.initCustomEvent( "uic" + componentName + eventName, true, true, details );
      }
      else {
          evt = new CustomEvent("uic" + componentName + eventName, {
              bubbles: true,
              detail: details
          });
      }
      evt.relatedTarget = related;
      related.dispatchEvent(evt);
  }


  // tooltip / popover stuff
  function getScroll() {
      // also Affix and ScrollSpy uses it
      return {
          y: globalObject.pageYOffset || HTML["scrollTop"],
          x: globalObject.pageXOffset || HTML["scrollLeft"]
      };
  }

  // set new focus element since 2.0.3
  function setFocus(element) {
      element.focus ? element.focus() : element.setActive();
  }

  function offWindowLeft(element, link) {
      var elementDimensions = {
          w: element["offsetWidth"],
          h: element["offsetHeight"]
      };
      var rect = link["getBoundingClientRect"]();
      if (elementDimensions.w < 50) {
          elementDimensions.w = 50;
      }
      return rect["left"] - elementDimensions.w < 0;
  }

  function styleTip(link, element, position, parent, useArrow) {
      // both popovers and tooltips (target,tooltip,placement,elementToAppendTo)

      // element.style.height = elementDimensions.h + 'px';
      // element.style.width = elementDimensions.w + 'px';
      element.style.maxWidth = "125px";

      useArrow = typeof useArrow === "boolean" ? useArrow : true;

      var windowWidth = HTML["clientWidth"] || DOC["body"]["clientWidth"];

      var windowHeight = HTML["clientHeight"] || DOC["body"]["clientHeight"];

      var rect = link["getBoundingClientRect"]();

      var scroll =
          parent === DOC["body"] ?
              getScroll() :
              {
                  y: parent["offsetTop"] + parent["scrollTop"],
                  x: parent["offsetLeft"] + parent["scrollLeft"]
              };

      var linkDimensions = {
          w: link.offsetWidth,
          h: link.offsetHeight
      };

      var maxWidth = 125;
      while(element["offsetHeight"] >= maxWidth) {
          maxWidth = maxWidth * 1.5;
          element.style.maxWidth = maxWidth + "px";
      }

      var elementDimensions = {
          w: element["offsetWidth"],
          h: element["offsetHeight"]
      };

      var isPopover = element.classList["contains"]("dds__popover");

      var topPosition;

      var leftPosition;

      var arrow = element.querySelector(".dds__arrow");

      var arrowTop;

      var arrowLeft;

      var arrowWidth;

      var arrowHeight;

      var halfTopExceed =
          rect["top"] + linkDimensions.h / 2 - elementDimensions.h / 2 < 0;

      var halfLeftExceed =
          rect["left"] + linkDimensions.w / 2 - elementDimensions.w / 2 < 0;

      var halfRightExceed =
          rect["left"] + elementDimensions.w / 2 + linkDimensions.w / 2 >= windowWidth;

      var halfBottomExceed =
          rect["top"] + elementDimensions.h / 2 + linkDimensions.h / 2 >= windowHeight;

      var topExceed = rect["top"] - elementDimensions.h < 0;

      var leftExceed = rect["left"] - elementDimensions.w < 0;

      var bottomExceed =
          rect["top"] + elementDimensions.h + linkDimensions.h >= windowHeight;

      var rightExceed =
          rect["left"] + elementDimensions.w + linkDimensions.w >= windowWidth;

      // recompute position
      var posChanged;
      if (position === "right"){
          if (!rightExceed && !halfTopExceed && !halfBottomExceed) ; else if (rightExceed && !leftExceed && !halfTopExceed && !halfBottomExceed) { //If exceeds right, but fits on the left
              posChanged = true;
              position = "left";
          } else if ((!halfTopExceed || !halfBottomExceed) && (!halfRightExceed || !halfLeftExceed)) { //If half of top or bottom doesnt fit, try to fit top or bottom
              if (!topExceed) {
                  posChanged = true;
                  position = "top";
              } else if (!bottomExceed) {
                  posChanged = true;
                  position = "bottom"; 
              }
          }
      }
      else if (position === "left") {
          if (!leftExceed && !halfTopExceed && !halfBottomExceed) ; else if (leftExceed && !rightExceed && !halfTopExceed && !halfBottomExceed) {
              posChanged = true;
              position = "right";
          } else if ((!halfTopExceed || !halfBottomExceed) && (!halfRightExceed || !halfLeftExceed)) {
              if (!topExceed) {
                  posChanged = true;
                  position = "top";
              } else if (!bottomExceed) {
                  posChanged = true;
                  position = "bottom"; 
              }
          }
      } else if (position === "top") {
          if (!topExceed && !halfRightExceed && !halfLeftExceed) ;else if (topExceed && !bottomExceed && !halfRightExceed && !halfLeftExceed) {
              posChanged = true;
              position = "bottom";
          } else if ((!halfRightExceed || !halfLeftExceed) && (!halfTopExceed || !halfBottomExceed)) {  //If half of right or left doesnt fit, try to fit right or left
              if (!rightExceed) {
                  posChanged = true;
                  position = "right";
              } else if (!leftExceed) {
                  posChanged = true;
                  position = "left"; 
              }
          }
      }  else if (position === "bottom") {
          if (!bottomExceed && !halfRightExceed && !halfLeftExceed) ; else if (bottomExceed && !topExceed && !halfRightExceed && !halfLeftExceed) {
              posChanged = true;
              position = "top";
          } else if ((!halfRightExceed || !halfLeftExceed) && (!halfTopExceed || !halfBottomExceed)) { //Can't be top
              if (!rightExceed) {
                  posChanged = true;
                  position = "right";
              } else if (!leftExceed) {
                  posChanged = true;
                  position = "left"; 
              }
          }
      }

      // update tooltip/popover class
      element.className["indexOf"](position) === -1 &&
          (element.className = element.className.replace(tipPositions, position));

      // update tooltip/popover dimensions
      if (posChanged) {
          elementDimensions = {
              w: element["offsetWidth"],
              h: element["offsetHeight"]
          };
      }
      // we check the computed width & height and update here
      var elMargin;
      try {
          elMargin = Number(window.getComputedStyle(element).margin.match(/\d+/)[0]); // get the margin value from style as a number
      } catch (e) {
          elMargin = 0;
      }
      arrowWidth = arrow["offsetWidth"] + (elMargin * 2);
      arrowHeight = arrow["offsetHeight"] + (elMargin * 2);

      var rectLeft = rect["left"], rectTop = rect["top"];
      if (!useArrow) {
          if (position === "left") {
              rectLeft = rect["left"] + arrowWidth;
          } else if( position === "right") {
              rectLeft = rect["left"] - arrowWidth;
          } else if (position === "top") {
              rectTop = rect["top"] + arrowHeight;
          } else if (position === "bottom") {
              rectTop = rect["top"] - arrowHeight;
          }
      }

      // apply styling to tooltip or popover
      if (position === "left" || position === "right") {
          // secondary|side positions
          if (position === "left") {
              // LEFT
              leftPosition =
                  rectLeft +
                  scroll.x -
                  elementDimensions.w -
                  (isPopover ? arrowWidth : 3); // subtract to move more left
              window.addEventListener("resize", function () {
                  arrow["style"]["left"] = "initial";
              });
          } else {
              // RIGHT
              leftPosition = rectLeft + linkDimensions.w + (isPopover ? 0 : 3); // add to move more right
          }

          topPosition =
              rect["top"] - elementDimensions.h / 2 + linkDimensions.h / 2 + scroll.y;
          arrowTop =
              elementDimensions.h / 2 - 
              (isPopover ? arrowHeight * 0.9 : arrowHeight / 2);
      } else if (position === "top" || position === "bottom") {
          // primary|vertical positions
          if (position === "top") {
              // TOP
              topPosition =
                  rectTop +
                  scroll.y -
                  elementDimensions.h - 
                  (isPopover ? arrowHeight : 3); // subtract to move more up
          } else {
              // BOTTOM
              topPosition = rectTop + linkDimensions.h + scroll.y + (isPopover ? 0 : 3);
          }
          leftPosition =
              rect["left"] - elementDimensions.w / 2 + linkDimensions.w / 2 + scroll.x;
          arrowLeft = elementDimensions.w / 2 - arrowWidth / 2;
      }

      // apply style to tooltip/popover and its arrow
      element["style"]["top"] = topPosition + "px";
      element["style"]["left"] = leftPosition + "px";

      arrowTop && (arrow["style"]["top"] = arrowTop + "px");
      arrowLeft && (arrow["style"]["left"] = arrowLeft + "px");

  }

  function handleFirstTab(e) {
      if (e.keyCode === 9) {
          document.body.classList.add("user-is-tabbing");

          window.removeEventListener("keydown", handleFirstTab);
          window.addEventListener("mousedown", handleMouseDownOnce);
      }
  }

  function handleMouseDownOnce(e) {
      //NVDA in browse mode swallows the enter key as mouse click: https://github.com/nvaccess/nvda/issues/4903
      //This breaks our visual focus toggle. Enter key event has x,y values of 0,0 whereas click has positive x,y values.
      //Capture enter key when treated as mousedown by NVDA browse mode.
      if (e.x === 0 && e.y === 0) {
          return;
      }
      document.body.classList.remove("user-is-tabbing");

      window.removeEventListener("mousedown", handleMouseDownOnce);
      window.addEventListener("keydown", handleFirstTab);
  }

  /**
   * Check is item is object
   * @return {Boolean}
   */
  function isObject(val) {
      return Object.prototype.toString.call(val) === "[object Object]";
  }

  /**
   * Check is item is array
   * @return {Boolean}
   */
  function isArray(val) {
      return Array.isArray(val);
  }

  /**
   * Check for valid JSON string
   * @param  {String}   str
   * @return {Boolean|Array|Object}
   */
  function isJson(str) {
      var t = !1;
      try {
          t = JSON.parse(str);
      } catch (e) {
          return !1;
      }
      return !(null === t || (!isArray(t) && !isObject(t))) && t;
  }

  /**
   * Iterator helper
   * @param  {(Array|Object)}   arr     Any object, array or array-like collection.
   * @param  {Function}         fn      Callback
   * @param  {Object}           scope   Change the value of this
   * @return {Void}
   */
  function each(arr, fn, scope) {
      var n;
      if (arr) {
          if (isObject(arr)) {
              for (n in arr) {
                  if (Object.prototype.hasOwnProperty.call(arr, n)) {
                      fn.call(scope, arr[n], n);
                  }
              }
          } else if (arr.length > 0) {
              for (n = 0; n < arr.length; n++) {
                  fn.call(scope, arr[n], n);
              }
          } else {
              return false;
          }
      } else {
          return false;
      }
  }

  /**
   * Bubble sort algorithm
   */
  function sortItems(a, b) {
      var c, d;
      if (1 === b) {
          c = 0;
          d = a.length;
      } else {
          if (b === -1) {
              c = a.length - 1;
              d = -1;
          }
      }
      for (var e = !0; e;) {
          e = !1;
          for (var f = c; f != d; f += b) {
              if (a[f + b] && a[f].value > a[f + b].value) {
                  var g = a[f],
                      h = a[f + b],
                      i = g;
                  a[f] = h;
                  a[f + b] = i;
                  e = !0;
              }
          }
      }
      return a;
  }

  /**
   * Create DOM element node
   * @param  {String}   a nodeName
   * @param  {Object}   b properties and attributes
   * @return {Object}
   */
  function createElement(a, b) {
      var d = DOC.createElement(a);
      if (b && "object" == typeof b) {
          var e;
          for (e in b) {
              if ("html" === e) {
                  d.innerHTML = b[e];
              } else {
                  if (e.slice(0,5) === "aria_" || e.slice(0,5) === "data_") {
                      var attr = e.slice(0,4) + "-" + e.slice(5);
                      d.setAttribute(attr, b[e]); 
                  } else {
                      d.setAttribute(e, b[e]);
                  }
              }
          }
      }
      return d;
  }

  function loadURLSVGs(paths, lazyload) {
      var lazyloading = typeof(lazyload) === "boolean" ? lazyload : true,
          execute = function(paths) {
              if (paths.length > 0 && !Array.isArray(paths)) {
                  paths = new Array(paths);
              }
              if (!paths || paths.length < 1) {
                  console.error("The File path(s) supplied were either empty or null.");
                  return false;
              }
              var defs,
                  style,
                  svg,
                  handleSVGResponse = function(response) {
                      if (response.match(/<script|javascript:/g)) {
                          throw Error("Possible malicous scripting code found!\n"+response);
                      } else {
                          var frag = DOC.createRange().createContextualFragment(response);
                          if (DOC["body"].firstChild.tagName != "svg") {
                              DOC["body"].insertBefore(frag, DOC["body"].firstChild);
                          } else {
                              svg = DOC["body"].firstChild;
                              defs = defs ? defs : svg.querySelector("defs");
                              style = style ? style : svg.querySelector("style");
                              var fragSymbol = frag.querySelector("symbol");
                              if (!defs.querySelector("#"+fragSymbol.id)) {
                                  defs.appendChild(fragSymbol);
                                  var fragStyle = frag.querySelector("style");
                                  if (style && fragStyle) {
                                      style.innerHTML += fragStyle.innerHTML;
                                  } else if (fragStyle) {
                                      svg.insertBefore(fragStyle, defs);
                                  }
                              }
                          }
                      }
                  };
              Array.prototype.forEach.call(paths, function(url) {
                  var xhr = new XMLHttpRequest();
                  xhr.addEventListener("error", function() {
                      console.error("The File path supplied [ "+paths+" ] was invalid.");
                  });
                  xhr.addEventListener("load", function() {
                      if (xhr.readyState == 4 && xhr.status == 200) {
                          handleSVGResponse(xhr.responseText);
                      }
                  });
                  xhr.open("GET", url, true);
                  xhr.send();
              });
          };
      if (lazyloading) {
          DOC.addEventListener("DOMContentLoaded", function () {
              execute(paths);
          });
      } else {
          execute(paths);
      }
  }

  /**
   * Function created to support the ability to add classes
   * to an SVG Element / Node. The classList for Elements and
   * Nodes in IE using createElementNS does not support classList  
   * so the class attribute needs to be used
   * @param {Element/Node} elem 
   */
  function classAdd(elem, classes) {
      var classList;
      if (!isArray(classes)) {
          classList = [classes];
      } else {
          classList = classes;
      }
   
      each(classList, function(clazz) {
          if (!elem.classList) { // Element does not support classList
              var newClasses = elem.getAttribute("class");
              if (!newClasses) {
                  elem.setAttribute("class", clazz);
              } else {
                  if (newClasses.indexOf(clazz) == -1)
                      elem.setAttribute("class", newClasses + " " + clazz);
              }
          } else {
              elem.classList.add(clazz);
          }
      });
  }

  /**
   * Function created to support the ability to remove classes
   * to an SVG Element / Node. The classList for Elements and
   * Nodes in IE using createElementNS does not support classList 
   * so the class attribute needs to be used
   * @param {*} elem 
   */
  function classRemove(elem, classes) {
      var classList;
      if (!isArray(classes)) {
          classList = [classes];
      } else {
          classList = classes;
      }
      each(classList, function(clazz) {
          if (!elem.classList) { // Element does not support classList
              var newClasses = elem.getAttribute("class").replace(clazz, "");
              elem.setAttribute("class", newClasses);
          } else {
              elem.classList.remove(clazz);
          }
      }); 
  }

  function debounce(func, wait, immediate) {
      var timeout;
      return function() {
          var context = this, args = arguments;
          var later = function() {
              timeout = null;
              if (!immediate) func.apply(context, args);
          };
          var callNow = immediate && !timeout;
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
          if (callNow) func.apply(context, args);
      };
  }

  function ieMosaicPolyfill(slides) {
      var divTag;
      for (var i = 0; i < slides.length; i++) {
          var imgTag = slides[i].querySelector("img.dds__card-img-top");
          if (imgTag) {
              divTag = slides[i].querySelector("div.dds__card-img-top");
              divTag.style.backgroundImage = "url('" + imgTag.src + "')";
              imgTag.style.display = "none";
              slides[i].parentNode.classList.add("dds__background-img");
          }
      }
  }

  function altFind(arr, callback) {
      var ret;
      each(arr, function(val) {
          var match = callback(val);
          if (match) {
              ret = val;
          }
      });
      return ret;
  }
    
  function validateNum(num, defaultVal) {
      if (num) {
          // check to see if page is a not a number but can be a string
          if ( isNaN(num) && typeof num != "string") {
              return defaultVal ? defaultVal : false;
          // if it is a string can it be converted to a number
          } else if (typeof num === "string") {
              if(isNaN(parseInt(num, 10))) {
                  return defaultVal ? defaultVal : false;
              }
              num = parseInt(num, 10);
          }
          
          return num;
      }
      else {
          return defaultVal;
      }
  }

  function jsonOptionsInit(element, options) {
      var jsonParams = element.dataset.options;
      if (jsonParams) {
          var jsonOptions = JSON.parse(jsonParams);
          return jsonOptions;
      }
      else {
          return options;
      }
      
  }

  function swipeInit(el, callback) {
      var swipe = new Object();
      swipe.start = {
          x: 0,
          y: 0
      };
      swipe.end = {
          x: 0,
          y: 0
      };
      swipe.params = {
          min: {
              x: 50,
              y: 90
          },
          max: {
              x: 95,
              y: 100
          }
      };
      var getTouch = function (e) {
              if (isEdge || isIE) {
                  return {
                      screenX: e.screenX,
                      screenY: e.screenY
                  };
              } else {
                  return e.touches[0];
              }
          },
          downListener = function (e) {
              var touch = getTouch(e);
              swipe.start.x = swipe.end.x = touch.screenX;
              swipe.start.y = swipe.end.y = touch.screenY;
          },
          moveListener = function (e) {
              // preventDefault if you want to completely stop default touch behavior
              // e.preventDefault();
              var touch = getTouch(e);
              swipe.end.x = touch.screenX;
              swipe.end.y = touch.screenY;
          },
          upListener = function () {
              if (
                  ((swipe.end.x - swipe.params.min.x > swipe.start.x) || (swipe.end.x + swipe.params.min.x < swipe.start.x)) &&
                  ((swipe.end.y < swipe.start.y + swipe.params.max.y) && (swipe.start.y > swipe.end.y - swipe.params.max.y))
              ) {
                  if (swipe.end.x > swipe.start.x) {
                      swipe.direction = direction.RIGHT;
                  } else {
                      swipe.direction = direction.LEFT;
                  }
              }
              if (
                  ((swipe.end.y - swipe.params.min.y > swipe.start.y) || (swipe.end.y + swipe.params.min.y < swipe.start.y)) &&
                  ((swipe.end.x < swipe.start.x + swipe.params.max.x) && (swipe.start.x > swipe.end.x - swipe.params.max.x))
              ) {
                  if (swipe.end.y > swipe.start.y) {
                      swipe.direction = direction.DOWN;
                  } else {
                      swipe.direction = direction.UP;
                  }
              }
              if (swipe.direction !== direction.NONE) {
                  if (typeof callback === "function") {
                      callback(el, swipe.direction);
                  }
              }
              swipe.direction = direction.NONE;
          };
      if (isEdge) {
          el.addEventListener("mousedown", downListener);
          el.addEventListener("mousemove", moveListener);
          el.addEventListener("mouseup", upListener);
      } else if (isIE) {
          el.addEventListener("pointerdown", downListener);
          el.addEventListener("pointermove", moveListener);
          el.addEventListener("pointerup", upListener);
      } else {
          el.addEventListener("touchstart", downListener);
          el.addEventListener("touchmove", moveListener);
          el.addEventListener("touchend", upListener);
      }
  }
  function renderSvg(svg, attributes) {
      var svgWrapper = DOC.createElementNS("http://www.w3.org/2000/svg", "svg");
      svgWrapper.setAttribute("focusable", false);
      classAdd(svgWrapper, prefix + "svg-icons");
      classAdd(svgWrapper, prefix + "icon-svg");
      if (!isArray(svg)) {
          svg = [svg];
      }
      each(svg, function(elm) {
          var svgElem = DOC.createElementNS("http://www.w3.org/2000/svg", "use");

          svgElem.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#" + prefix + elm.name);
          classAdd(svgElem, [prefix + "svg-icons-item"]); //are these two classes the same
          classAdd(svgElem, prefix + "icon-svg-item");
          svgElem.setAttribute("tabindex", "-1"); //does this do anything
          if (elm.show) {
              classAdd(svgElem, [ prefix + "show"]);
          }

          svgWrapper.appendChild(svgElem);
      });

      for (var key in attributes) {
          if (Object.prototype.hasOwnProperty.call(attributes, key)) {
              svgWrapper.setAttribute(key, attributes[key]);
          }
      }
      return svgWrapper;
  }

  function flush(el, ie) {
      if (el instanceof NodeList) {
          each(el, function (e) {
              flush(e, ie);
          });
      } else {
          if (ie) {
              while (el.hasChildNodes()) {
                  el.removeChild(el.firstChild);
              }
          } else {
              el.innerHTML = "";
          }
      }
  }

  function getText(value) {
      var text, div = DOC.createElement("div");
      div.innerHTML = value;

      function findText(div) {
          each(div.childNodes, function(cNode) {
              if (cNode.nodeType === 3) {
                  text = cNode.data;
              }
              findText(cNode);
          }, this);
      }
      findText(div);
      return text;
  }

  function Alert(element) {
      // initialization element
      element = element instanceof HTMLElement ? element : (function() {
          return false;
      })();

      // bind, target alert, duration and stuff
      var self = this,
          stringAlert = "Alert",
          closeButton = element.querySelector("."+prefix+"close-x"),
          dismissMessage = element.querySelector("."+prefix+"dismiss"),
     
          // handlers
          clickHandler = function(e) {
              if ((closeButton === e.target || closeButton.contains(e.target)) || 
              (dismissMessage === e.target || dismissMessage.contains(e.target))){
                  self.toggle();
              }
          };

      // public method
      this.toggle = function() {
          if (element) {
              if (element.getAttribute("aria-expanded") === "true") {
                  element.setAttribute("aria-expanded", "false");
                  dismissMessage.focus();
                  uicoreCustomEvent("Alert", "DismissEvent", element);
              } else {
                  element.setAttribute("aria-expanded", "true");
                  closeButton.focus();
                  uicoreCustomEvent("Alert", "OpenEvent", element);
              }
             
          }
      };

      // init
      if (!(stringAlert in element)) {
          // prevent adding event handlers twice
          closeButton.addEventListener("click", clickHandler, false);
          dismissMessage.addEventListener("click", clickHandler, false);
      }

      element[stringAlert] = self;
  }

  function InputMask( element ) { //, opts ) {
      // initialization element
      element = element instanceof HTMLElement ? element : (function() {
          return false;
      })();

      var wrap,
          stringInputMask = "InputMask",
          mNum = "XdDmMyY9",
          mChar = "_",
          spacing = 0,
          hasValue = false,
          charSet = element.dataset.charset,
          cursorMin = 0,
          createShell = function(t) {
              wrap = createElement("span", {
                  class: prefix + "input-shell",
              });
              spacing = !t.getAttribute("set-cursor") ? spacing : isNaN(parseInt(t.getAttribute("set-cursor"))) ? spacing : parseInt(t.getAttribute("set-cursor")) !=1 ? spacing : 1;
              var mask = createElement("span", {
                      aria_hidden: "true",
                      id: t.getAttribute("id") + "Mask" }),

                  emphasis = createElement("i"),
                  tClass = t.getAttribute("class"),
                  pTxt = hasValue ? t.value: t.getAttribute("placeholder"),
                  placeholder = document.createTextNode(pTxt),
                  errorDiv = getSibling(t, "#"+t.getAttribute("id")+"Feedback");
          
              t.setAttribute("maxlength", placeholder.length);
              t.setAttribute("data-placeholder", pTxt);
              t.removeAttribute("placeholder");
          
          
              if ( !tClass || ( tClass && tClass.indexOf("masked") === -1 ) ) {
                  t.setAttribute( "class", tClass + " masked");
              }
          
              mask.appendChild(emphasis);
              mask.appendChild(placeholder);
          
              wrap.appendChild(mask);
              t.parentNode.insertBefore( wrap, t );
              wrap.appendChild(t);
              if(errorDiv) {
                  wrap.appendChild(errorDiv);
              }
          },
          setValueOfMask = function(e) {
              var value = e.target.value,
                  placeholder = e.target.getAttribute("data-placeholder");
    
              return "<i>" + value + "</i>" + placeholder.substr(value.length);
          },
          handleFocusEvent = function(e) {
              for (var s=0; s<spacing; s++) {
                  var char = e.target.getAttribute("data-placeholder").charAt(s);
                  element.value += char;
                  var evt;
                  if (!isIE) {
                      evt = new KeyboardEvent("keyup", {
                          bubbles : true,
                          cancelable : true,
                          char : char,
                          key : "[",
                          shiftKey : true
                      });
                  } else {
                      evt = document.createEvent("KeyboardEvent");
                      evt.initKeyboardEvent("keyup", true, true, null, char, null, "", false, "" );
                  }
                  element.dispatchEvent(evt);
              }
          },
          handleValueChange = function(e) {
              var id = e.target.getAttribute("id"),
                  mask = wrap.querySelector("#" + id + "Mask"),
                  italic = wrap.querySelector("#" + id + "Mask i"),
                  cursor;
                  
              if(e.target.value == italic.innerHTML) {
                  return; // Continue only if value hasn't changed
              }

              setTimeout(function(){
                  cursor = element.selectionEnd; 
                  e.target.value = handleCurrentValue(e);
                  mask.innerHTML = setValueOfMask(e);
                  
                  if (e.keyCode != 8) {
                      //if the user is backspacing and then switches back to typing forward
                      if(!(charSet.charAt(cursor-1).match(".*["+ mNum + mChar + "].*"))){
                          while(!(charSet.charAt(cursor-1).match(".*["+ mNum + mChar + "].*")) && cursor < charSet.length){
                              cursor++;
                          }
                      }
                      else {
                          //if the user is typing forward
                          while(!(charSet.charAt(cursor).match(".*["+ mNum + mChar + "].*")) && cursor < charSet.length){
                              cursor++;
                          }
                      }
                  }
                  else {
                      //if the user is backspacing
                      while(!(charSet.charAt(cursor-1).match(".*["+ mNum + mChar + "].*")) && cursor > cursorMin){
                          cursor--;
                      }
                      cursor = Math.max(cursor, cursorMin);
                  }
                  element.setSelectionRange(cursor, cursor);
              }, 50);
          },
    
          handleCurrentValue = function(e) {
              var isCharsetPresent = e.target.getAttribute("data-charset"),
                  placeholder = isCharsetPresent || e.target.getAttribute("data-placeholder"),
                  value = e.target.value, l = placeholder.length, newValue = "",
                  i, j, isInt, isLetter, strippedValue;
    
              // strip special characters
              strippedValue = isCharsetPresent ? value.replace(/\W/g, "") : value.replace(/\D/g, "");
    
              for (i = 0, j = 0; i < l; i++) {
                  isInt = !isNaN(parseInt(strippedValue[j]));
                  isLetter = strippedValue[j] ? strippedValue[j].match(/[A-Z]/i) : false;
                  var matchesNumber = mNum.indexOf(placeholder[i]) >= 0;
                  var matchesLetter = mChar.indexOf(placeholder[i]) >= 0;
                  if ((matchesNumber && isInt) || (isCharsetPresent && matchesLetter && isLetter)) {
                      newValue += strippedValue[j++];
                  } else if ((!isCharsetPresent && !isInt && matchesNumber) || (isCharsetPresent && ((matchesLetter && !isLetter) || (matchesNumber && !isInt)))) {
                      return newValue;
                  } else {
                      newValue += placeholder[i];
                  }
                  // break if no characters left and the pattern is non-special character
                  if (strippedValue[j] == undefined) {
                      if(i+1 >= l || charSet.charAt(i+1).match(".*["+ mNum + mChar + "].*") || e.keyCode == 8){
                          break;
                      }
                  }
              }
              if (e.target.getAttribute("data-valid-example")) {
                  return validateProgress(e, newValue);
              }
              return newValue;
          },
    
          validateProgress = function(e, value) {
              var validExample = e.target.getAttribute("data-valid-example"),
                  pattern = new RegExp(e.target.getAttribute("pattern")),
                  placeholder = e.target.getAttribute("data-placeholder"),
                  l = value.length, testValue = "";
    
              //convert to months
              if (l == 1 && placeholder.toUpperCase().substr(0,2) == "MM") {
                  if(value > 1 && value < 10) {
                      value = "0" + value;
                  }
                  return value;
              }
              // test the value, removing the last character, until what you have is a submatch
              for (var i = l; i >= 0; i--) {
                  testValue = value + validExample.substr(value.length);
                  if (pattern.test(testValue)) {
                      return value;
                  } else {
                      value = value.substr(0, value.length-1);
                  }
              }
    
              return value;
          };

      // add event listeners
      // init
      if (!(stringInputMask in element)) {
          var parentNode = element.parentNode;
          element.value ? hasValue = true: hasValue = false;
          if (!charSet){
              throw new Error("Data charset is missing or invalid");
          }
          if(!charSet.charAt(0).match(".*["+ mNum + mChar + "].*")){
              while(!charSet.charAt(cursorMin).match(".*["+ mNum + mChar + "].*")){
                  cursorMin++;
              }
          }
          if ( !parentNode || !parentNode.classList.contains(prefix + "input-shell") ) {
              createShell(element);
              element.addEventListener("change", handleValueChange, false);
              element.addEventListener("keyup", handleValueChange, false);
              if (spacing > 0) {
                  element.addEventListener("focus", handleFocusEvent, false);
              }
          }
      }

      element[stringInputMask] = self;
  }

  function Spinbox(element, options) {

      // initialization element
      element = element instanceof HTMLElement ? element : (function() {
          return false;
      })();

      options = options || {};
      options = jsonOptionsInit(element, options);
      options.spinmin = element.dataset.spinmin ? validateNum(element.dataset.spinmin, 0) : validateNum(options.spinmin, 0);
      options.spindefault = element.dataset.spindefault ? validateNum(element.dataset.spindefault, 0) : validateNum(options.spindefault, 0);
      options.spinmax = element.dataset.spinmax ? validateNum(element.dataset.spinmax, 100) : validateNum(options.spinmax, 100);
      options.spinstep = element.dataset.spinstep ? validateNum(element.dataset.spinstep, 1) : validateNum(options.spinstep, 1);

      var msg= "";
      if (isNaN(options.spinmin)) {
          msg += "Min value is not a number.\n";
      }
      if (isNaN(options.spinmax)) {
          msg += "Max value is not a number.\n";
      }
      if (isNaN(options.spindefault)) {
          msg += "Default value is not a number.\n";
      } else if (options.spindefault < options.spinmin || options.spindefault > options.spinmax) {
          msg += "Default value falls outside of the min max values.\n";
      }
      if (isNaN(options.spinstep)) {
          msg += "Step value is not a number.\n";
      }
      if (msg.length) {
          throw new Error(msg);
      }
      
      var self = this,
          stringSpinbox = "Spinbox",
          input,
          plusCtrl,
          minusCtrl,
          // horizontal,
          // handlers
          handleKeypressEvent = debounce(function(e) {
              var charCode = (e.which) ? e.which : e.keyCode;
              // if not a number
              if ( input.value.length > options.spinmax.length || (charCode > 31 && (charCode < 48 || charCode > 57))) {
                  if (charCode == 13){
                      input.blur();
                  }
                  else if (input.value.length == 0 && (options.spinmin < 0 && charCode == 45)) { // allow minus when input empty and spinmin less than zero
                      return;
                  } else {
                      e.preventDefault();
                  }
              } else {
                  var newInput = input.value;
                  if (parseInt(newInput) > options.spinmax) {
                      input.value = options.spinmax;
                      input.setAttribute("aria-valuenow", options.spinmax);
                      e.preventDefault();
                  } else if (parseInt(newInput) < options.spinmin) {
                      input.value = options.spinmin;
                      input.setAttribute("aria-valuenow", options.spinmin);
                      e.preventDefault();
                  } else {
                      if (input.value == "-" && e.charCode == 48) { // dont allow -0
                          e.preventDefault();
                      } else {
                          if (charCode == 13) { // Enter key
                              if (Math.abs(parseInt(input.value)) % options.spinstep > 0) {
                                  input.value = parseInt(input.value) - (Math.abs(parseInt(input.value)) % options.spinstep);
                              }
                              input.blur();
                          } else {
                              input.setAttribute("aria-valuenow", input.value);
                          }
                      }
                  }
              }
          }, 500),
          handleCtrlClickEvent = function(e, control) {
              var temp;
              if (control === minusCtrl) {
                  temp = parseInt(input.value) - options.spinstep;
              } else {
                  temp = parseInt(input.value) + options.spinstep;
              }
              if (!(temp < options.spinmin) && !(temp > options.spinmax)) {
                  input.value = temp;
                  input.setAttribute("aria-valuenow", temp);
                  handleDisabling();
                  uicoreCustomEvent("Spinbox", "ValueChangeEvent", element, {"value": input.value});
              }
          },
          handleDisabling = function() {
              if (input.value == options.spinmin || (parseInt(input.value) - options.spinstep) < options.spinmin) {
                  minusCtrl.setAttribute("disabled", "");
              } else if (minusCtrl.hasAttribute("disabled")) {
                  minusCtrl.removeAttribute("disabled");
              }
              if (input.value == options.spinmax || (parseInt(input.value) + options.spinstep) > options.spinmax) {
                  plusCtrl.setAttribute("disabled", "");
              } else if (plusCtrl.hasAttribute("disabled")) {
                  plusCtrl.removeAttribute("disabled");
              }
          },
          handleFocusOut = function() {
              // if input is empty, negative, or NaN
              if (input.value.length == 0 || input.value == "-" || !(/^\d+$/.test(input.value))) {
                  input.value = options.spindefault;
              } else if (parseInt(input.value) < options.spinmin) {
                  input.value = options.spinmin;
              } else if (parseInt(input.value) > options.spinmax) {
                  input.value = options.spinmax;
              } else if (Math.abs(parseInt(input.value)) % options.spinstep > 0) {
                  input.value = parseInt(input.value) - (Math.abs(parseInt(input.value)) % options.spinstep);
              } else if(input.value.match(/^0+/g)) {
                  var match = input.value.match(/^0+/g);
                  var temp = input.value.replace(match,"");
                  if (temp.length == 0) {
                      input.value = "0";
                  } else {
                      input.value = temp;
                  }
              }
              handleDisabling();
              uicoreCustomEvent("Spinbox", "ValueChangeEvent", element, {"value": input.value});

          },
          handleArrowEvent = function(e) {
              switch (e.keyCode) {
              case 35: // end
                  e.preventDefault();
                  input.value = options.spinmax;
                  uicoreCustomEvent("Spinbox", "ValueChangeEvent", element, {"value": input.value});
                  break;
              case 36: // home
                  e.preventDefault();
                  input.value = options.spinmin;
                  uicoreCustomEvent("Spinbox", "ValueChangeEvent", element, {"value": input.value});
                  break;
              case 38: // up
                  e.preventDefault();
                  if (input.value.length) {
                      plusCtrl.click();
                  } else {
                      input.value = options.spinmin + options.spinstep;
                      input.setAttribute("aria-valuenow", input.value);
                      uicoreCustomEvent("Spinbox", "ValueChangeEvent", element, {"value": input.value});
                  }
                  break;
              case 40: // down
                  e.preventDefault();
                  minusCtrl.click();
                  break;
              case 37: // left
              case 39: // right 
                  e.preventDefault(); 
                  break;
              }
          };

      // init
      if (!(stringSpinbox in element)) {
          input = element.querySelector("." + prefix + "spinbox-input");
          input.addEventListener("keypress", handleKeypressEvent);
          input.addEventListener("keyup", handleDisabling);
          input.addEventListener("focusout", handleFocusOut);
          element.addEventListener("keydown", handleArrowEvent);

          input.value = options.spindefault;
          input.setAttribute("aria-valuenow", options.spindefault);
          input.setAttribute("aria-valuemin", options.spinmin);
          input.setAttribute("aria-valuemax", options.spinmax);

          var controls = element.querySelectorAll("button." + prefix + "spinbox-btn");
          if (element.classList.contains(prefix + "spinbox-horizontal")) {// horizontal spinbox
              // horizontal = true;
              minusCtrl = controls[0];
              plusCtrl = controls[1];
          } else {
              // horizontal = false;
              minusCtrl = controls[1];
              plusCtrl = controls[0];
          }

          minusCtrl.addEventListener("click", function(e) {
              handleCtrlClickEvent(e, minusCtrl);
          });
          plusCtrl.addEventListener("click", function(e) {
              handleCtrlClickEvent(e, plusCtrl);
          });
          handleDisabling();
      }


      element[stringSpinbox] = self;
  }

  function DatePicker(element, options) {
      // initialization element
      element = element instanceof HTMLElement ? element : (function() {
          return false;
      })();
      
      // set option
      options = options || {};
      options = jsonOptionsInit(element, options);
      options.datesFilter = options.datesFilter ? options.datesFilter : false;
      options.pastDates = options.pastDates ? options.pastDates : false;
      options.availableWeekDays = options.availableWeekDays ? options.availableWeekDays : [{day: "monday"},{day: "tuesday"},{day: "wednesday"},{day: "thursday"},{day: "friday"},{day: "saturday"},{day: "sunday"}];
      options.notBeforeDate = options.notBeforeDate ? new Date(options.notBeforeDate) : null;
      options.notAfterDate = options.notAfterDate ? new Date(options.notAfterDate) : null;
      options.button_prev = options.button_prev ? options.button_prev : null; 
      options.button_next = options.button_next ? options.button_next : null; 

      var self = this,
          stringDatePicker = "DatePicker",
          calendarBtn = element.querySelector("." + prefix + "datepicker-btn"),
          target = element["getAttribute"]("data-target"),
          dateInput = element.querySelector("." + prefix + "form-control"),
          calendar = element.querySelector(target),
          pickerBtn = element.querySelector("." + prefix + "datepicker-btn"),
          form = null,
          monthEl = null,
          focusableEls,
          currentSelected,
          overlay = getFullScreenOverlay(),
          smallMedia = window.matchMedia("(max-width: 767.98px)"),
          calendarWrapper,
          tempSelected = new Date(),
          todaysDate = new Date(),
          monthLabel = null,
          datePtr = new Date(),
          monthsTexts = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
          keyCode = Object.freeze({
              "TAB": 9,
              "ENTER": 13,
              "ESC": 27,
              "SPACE": 32,
              "PAGEUP": 33,
              "PAGEDOWN": 34,
              "END": 35,
              "HOME": 36,
              "LEFT": 37,
              "UP": 38,
              "RIGHT": 39,
              "DOWN": 40
          }),
          setFocusableElements = function() {
              focusableEls = getFocusableElements(calendar);
          },
          toggleCalendar = function() {
              if (calendar.classList.contains(prefix + "d-none")) {
                  calendar.classList.remove(prefix + "d-none");
                  calendarWrapper.classList.remove(prefix+"hide");
                  if (smallMedia.matches) createOverlay();
                  repositionIfNeeded();
                  globalObject.addEventListener("resize", toggleCalendar);
                  //check if calendar is within confines of page
                  var dateText = dateInput.value;
                  if (dateText && dateInput.validity.valid && checkDateValidity(new Date(dateText))) {
                      currentSelected = new Date(dateText);
                      tempSelected = new Date(dateText);
                      if (datePtr.getFullYear() != currentSelected.getFullYear()) {
                          datePtr.setFullYear(currentSelected.getFullYear());
                      }
                      if (datePtr.getMonth() != currentSelected.getMonth()) {
                          datePtr.setMonth(currentSelected.getMonth());
                      }
                      createMonth();
                      var newDateElem = element.querySelector("[data-calendar-date=\"" + currentSelected + "\"]");
                      if(!newDateElem.classList.contains(prefix + "datepicker-date-disabled")) {
                          newDateElem.classList.add(prefix + "datepicker-date-selected");
                          var nextBtn = newDateElem.querySelector("." + prefix + "datepicker-calendar-day");
                          nextBtn.removeAttribute("tabindex");
                          nextBtn.focus();
                      }
                      tempSelected = new Date(currentSelected.getTime());
                  }
                  else {
                      resetToDefaultDate();
                  }
                  calendar.addEventListener("focusout", blurHandler, false);
              } else {
                  calendar.classList.add(prefix + "d-none");
                  calendarWrapper.classList.add(prefix+"hide");
                  globalObject.removeEventListener("resize", toggleCalendar);
                  removeActiveClass();
                  pickerBtn.focus();
                  calendar.removeEventListener("focusout", blurHandler, false);
                  removeOverlay();
              }
          },
          createWrapper = function() {
              var wrapper = createElement("div", {
                  class: prefix + "calendar-wrapper " + prefix + "hide"
              });
              calendar.parentNode.appendChild(wrapper);
              wrapper.appendChild(calendar);
              return wrapper;
          },
          repositionIfNeeded = function() {
              //right+left checking
              calendar.style.right = "";
              calendar.style.top = "";
              if (calendar.getBoundingClientRect().right > document.body.offsetWidth) {
                  calendar.style.right = (document.body.offsetWidth - calendarBtn.getBoundingClientRect().right) +"px";
              }

              //vertical+horizontal checking
              if (calendar.getBoundingClientRect().bottom > window.innerHeight) {
                  var dist = calendar.getBoundingClientRect().bottom - window.innerHeight - window.pageYOffset;
                  calendar.style.top = calendar.getBoundingClientRect().top - dist - 4 + "px"; //4px buffer as to not directly hug browser frame
              }
          },
          blurHandler = function() {
              setTimeout( function() {
                  if(calendar && !calendar.contains(document.activeElement) && !calendarBtn.contains(document.activeElement)) {
                      toggleCalendar();
                      calendarBtn.focus();
                  }
              }, 10);
          },
          getWeekDay = function (day) {
              return ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][day];
          },  
          createDay = function (date) {
              var isAvailable = true;
              var newDayElem = document.createElement("div");
              var dateElem = document.createElement("button");
              dateElem.setAttribute("tabindex", "-1");
              dateElem.setAttribute("type", "button");
              dateElem.innerHTML = date.getDate();
              dateElem.addEventListener("keydown", dateKeydownHandler, false);
              dateElem.className = prefix + "datepicker-calendar-day";
              newDayElem.className = prefix + "datepicker-date";
              newDayElem.setAttribute("data-calendar-date", date);
              
              var available_week_day = options.availableWeekDays.filter(function(f) {
                  return (f.day === date.getDay() || f.day === getWeekDay(date.getDay()));
              });
              if (date.getMonth() != datePtr.getMonth()) {
                  newDayElem.classList.add(prefix + "datepicker-date-outdated");
              }
              if (datePtr.getTime() <= todaysDate.getTime() - 1 && !options.pastDates) {
                  newDayElem.classList.add(prefix + "datepicker-date-disabled");
                  dateElem.setAttribute("disabled", "");
              } else {
                  if (options.datesFilter) {
                      if (options.notBeforeDate && date <= options.notBeforeDate) {
                          isAvailable = false;
                      }
                      if (options.notAfterDate && date > options.notAfterDate) {
                          isAvailable = false;
                      }
                      if (available_week_day.length && isAvailable) {
                          newDayElem.classList.add(prefix + "datepicker-date-active");
                          newDayElem.setAttribute("data-calendar-data", JSON.stringify(available_week_day[0]));
                          newDayElem.setAttribute("data-calendar-status", "active");
                      } else {
                          newDayElem.classList.add(prefix + "datepicker-date-disabled");
                          dateElem.setAttribute("disabled", "");
                      }
                  } else {
                      newDayElem.classList.add(prefix + "datepicker-date-active");
                      newDayElem.setAttribute("data-calendar-status", "active");
                  }
              }
              //set current selected date
              if (currentSelected && date.toString() == currentSelected.toString() && !newDayElem.classList.contains(prefix + "datepicker-date-disabled")) {
                  newDayElem.classList.add(prefix + "datepicker-date-selected");
          
              }
              //if textbox is empty 
              if (date.toString() == tempSelected.toString() && !newDayElem.classList.contains(prefix + "datepicker-date-disabled")) {
                  newDayElem.classList.add(prefix + "datepicker-date-temp-selected");
                  dateElem.removeAttribute("tabindex");
              }
              //add date to the calendar
              newDayElem.appendChild(dateElem);
              monthEl.appendChild(newDayElem);
          },
          createOverlay = function () {
              DOC.body.style.overflow = "hidden";
              if (overlay && !(overlay.classList.contains(prefix + "show"))) {
                  overlay.classList.add(prefix + "show");
                  overlay.removeAttribute("hidden");
                  if( overlay.style.visibility == "hidden"){
                      overlay.style.visibility = "";
                  }
              } else {
                  console.warn("MODAL: Overlay requested. Corresponding HTML missing. Please apply id 'dds__full-screen-overlay' and class 'dds__overlay' to an empty div");
              }

          },
          removeOverlay = function () {
              DOC.body.style.overflow = "";
              if (overlay) {
                  overlay.classList.remove(prefix + "show");
              }
          },
          removeActiveClass = function () {
              each(element.querySelectorAll("." + prefix + "datepicker-date-selected"), function(day) {
                  day.classList.remove(prefix + "datepicker-date-selected");
              });
          },
          removeTempClass = function() {
              each(element.querySelectorAll("." + prefix + "datepicker-date-temp-selected"), function(day) {
                  day.classList.remove(prefix + "datepicker-date-temp-selected");
                  day.firstElementChild.setAttribute("tabindex", "-1");
              });
          },
          resetToDefaultDate = function() {
              currentSelected = null;
              var defaultDate = getNearestAvailableDay(new Date(options.defaultDate));
              todaysDate = getNearestAvailableDay(todaysDate);
              tempSelected = new Date(defaultDate.getTime());
              if (datePtr.getFullYear() != tempSelected.getFullYear()) {
                  datePtr.setFullYear(tempSelected.getFullYear());
              }
              if (datePtr.getMonth() != tempSelected.getMonth()) {
                  datePtr.setMonth(tempSelected.getMonth());
              }
              createMonth();
              var newDateElem = element.querySelector("[data-calendar-date=\"" + tempSelected + "\"]");
              newDateElem.classList.add(prefix + "datepicker-date-temp-selected");
              var nextBtn = newDateElem.querySelector("." + prefix + "datepicker-calendar-day");
              nextBtn.removeAttribute("tabindex");
              nextBtn.focus();
          },
          selectDate = function () {
              var activeDates = element.querySelectorAll("[data-calendar-status=active]");
              each(activeDates, function(date) {
                  date.addEventListener("click", function () {
                      removeActiveClass();
                      removeTempClass();
                      var datas = this.dataset;
                      this.classList.add(prefix + "datepicker-date-selected");
                      currentSelected = new Date(datas.calendarDate);
                      setNewDate();
                  });
              });
          },
          createMonth = function () {
              clearCalendar();
              var currentMonth = datePtr.getMonth();
              monthLabel.innerHTML = monthsTexts[datePtr.getMonth()] + " " + datePtr.getFullYear();
              //check to see if previous month is out of range
              var monthCheckBefore = new Date(datePtr.getTime());
              monthCheckBefore.setDate(monthCheckBefore.getDate() - 1); 
              if ((options.notBeforeDate && monthCheckBefore <= options.notBeforeDate) || (!options.pastDates && monthCheckBefore.getTime() <= todaysDate.getTime() - 1)) {
                  options.button_prev.classList.add(prefix + "disabled");
                  options.button_prev.setAttribute("disabled", "");
              } else {
                  options.button_prev.classList.remove(prefix + "disabled");
                  options.button_prev.removeAttribute("disabled");
              }
              //add previous month days on calendar
              var daysPrev = datePtr.getDay();
              if(daysPrev > 0) {
                  for(var i=daysPrev; i>0; i--) {
                      var prevDate = new Date(datePtr.getTime());
                      prevDate.setDate(datePtr.getDate() - i);
                      createDay(prevDate);
                  }
              }
              //add current month days onto calendar
              while (datePtr.getMonth() === currentMonth) {
                  createDay(datePtr);
                  datePtr.setDate(datePtr.getDate() + 1);
              }
              //check to see if next month is out of range
              var monthCheckAfter = new Date(datePtr.getTime());
              if(options.notAfterDate && monthCheckAfter > options.notAfterDate) {
                  options.button_next.classList.add(prefix + "disabled");
                  options.button_next.setAttribute("disabled", "");
              } else {
                  options.button_next.classList.remove(prefix + "disabled");
                  options.button_next.removeAttribute("disabled");
              }
              //add next month days onto calendar
              datePtr.setDate(datePtr.getDate() - 1);
              var daysAfter = 6 - datePtr.getDay();
              if (daysAfter > 0) {
                  for(var j=1; j<=daysAfter; j++) {
                      var futureDate = new Date(datePtr.getTime());
                      futureDate.setDate(datePtr.getDate() + j);
                      createDay(futureDate);
                  }
              }
              datePtr.setDate(1);
              selectDate();
              setFocusableElements();
          },
          monthPrev = function (e) {
              if (e) {
                  e.preventDefault();
              }
              datePtr.setMonth(datePtr.getMonth() - 1);
              createMonth();
          },
          monthNext = function (e) {
              if (e) {
                  e.preventDefault();
              }
              datePtr.setMonth(datePtr.getMonth() + 1);
              createMonth();
          },
          checkDateValidity = function(date) {
              var available_week_day = options.availableWeekDays.filter(function(f) {
                  return (f.day === date.getDay() || f.day === getWeekDay(date.getDay()));
              });
              //check if valid weekday
              if(available_week_day.length == 0) {
                  return false;
              }
              //check if not before
              if (options.notBeforeDate && date <= options.notBeforeDate) {
                  return false;
              }
              //check if not after
              if (options.notAfterDate && date > options.notAfterDate) {
                  return false;
              }
              // check if before today
              if (!options.pastDates && date.getTime() <= todaysDate.getTime() - 1) {
                  return false;
              }
              return true;
          },
          clearCalendar = function () {
              monthEl.innerHTML = "";
          },
          createCalendar = function () {
              element.querySelector(target).innerHTML = "<div class=\"dds__datepicker-header\"><button type=\"button\" class=\"dds__datepicker-nav-btn\" aria-label=\"previous month\" data-calendar-toggle=\"previous\"><svg focusable=\"false\" class=\"dds__svg-icons\"><use xlink:href=\"#dds__chevron-left\"></use></svg></button><div class=\"dds__datepicker-header__label\" data-calendar-label=\"month\"></div><button type=\"button\" class=\"dds__datepicker-nav-btn\" aria-label=\"next month\"data-calendar-toggle=\"next\"><svg focusable=\"false\" class=\"dds__svg-icons\"><use xlink:href=\"#dds__chevron-right\"></use></svg></button></div><div class=\"dds__datepicker-week\"></div><div class=\"dds__datepicker-body\" data-calendar-area=\"month\"></div><div class=\"dds__calendar-buttons\"></div>";
              element.querySelector("." + prefix + "datepicker-week").innerHTML = "<span>SUN</span><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span>";
              var bottomMenu = element.querySelector("." + prefix + "calendar-buttons");
              bottomMenu.innerHTML = "<button type=\"button\" class=\"dds__btn dds__btn-secondary\" aria-label=\"cancel\">Cancel</button>";
              bottomMenu.querySelector("." + prefix + "btn-secondary").addEventListener("click", toggleCalendar, false);
              bottomMenu.querySelector("." + prefix + "btn-secondary").addEventListener("keydown", buttonKeydownHandler, false);
          },
          setNewDate = function() {
              var deliminator = "/";
              dateInput.value = ("0" + (currentSelected.getMonth() + 1)).slice(-2) + deliminator + ("0" + currentSelected.getDate()).slice(-2) + deliminator + currentSelected.getFullYear();
              var e = document.createEvent("Event");
              e.initEvent("change", false, false);
              dateInput.dispatchEvent(e);
              dateInput.focus();
              uicoreCustomEvent("DatePicker", "SelectedDate", element, { "date": currentSelected});
              toggleCalendar();
          },
          setNewTempDate = function(prevDate, currentDate) {
              //look for the new date
              tempSelected = getNextAvailableDay(prevDate, currentDate);
              //remove current selected
              var oldSelected = element.querySelector("[data-calendar-date=\"" + prevDate + "\"]");
              if (oldSelected) {
                  oldSelected.children[0].setAttribute("tabindex", "-1");
                  oldSelected.classList.remove(prefix + "datepicker-date-temp-selected");
              }
              var newDateElem = element.querySelector("[data-calendar-date=\"" + tempSelected + "\"]");
              var nextBtn = newDateElem.querySelector("." + prefix + "datepicker-calendar-day");
              nextBtn.removeAttribute("tabindex");
              nextBtn.parentElement.classList.add(prefix + "datepicker-date-temp-selected");
              nextBtn.focus();
          },
          getNextAvailableDay = function(prevDate, currentDate) {
              var newDate = element.querySelector(":not(.dds__datepicker-date-disabled):not(.dds__datepicker-date-outdated)[data-calendar-date='" + currentDate + "']");
              var direction = prevDate < currentDate ? 1 : -1;
              //check day
              if (newDate) {
                  return currentDate;
              }
              else {
                  //check if not before
                  if (options.notBeforeDate && currentDate <= options.notBeforeDate) {
                      return prevDate;
                  }
                  //check if not after
                  if (options.notAfterDate && currentDate >= options.notAfterDate) {
                      return prevDate;
                  }
                  // check if before today
                  if (currentDate.getTime() <= todaysDate.getTime() - 1 && !options.pastDates) {
                      return prevDate;
                  }
                  if (currentDate.getMonth() != prevDate.getMonth()) {
                      if (direction == 1) {
                          monthNext();
                      }
                      if (direction == -1) {
                          monthPrev(); 
                      }
                      if (element.querySelector(":not(.dds__datepicker-date-disabled)[data-calendar-date='" + currentDate + "']")) {
                          return currentDate;
                      }
                      else {
                          prevDate = new Date (currentDate.getTime());
                          currentDate.setDate(currentDate.getDate() + direction);
                          return getNextAvailableDay(prevDate, currentDate);
                      }
                  } else {
                      prevDate = new Date (currentDate.getTime());
                      currentDate.setDate(currentDate.getDate() + direction);
                      return getNextAvailableDay(prevDate, currentDate);
                  }
              }
          },
          getNearestAvailableDay = function(currentDate) {
              if (checkDateValidity(currentDate)) {
                  return currentDate;
              } else {
                  var nextDate = new Date(currentDate.getTime());
                  nextDate.setDate(nextDate.getDate() + 1);
                  var prevDate = new Date(currentDate.getTime());
                  prevDate.setDate(prevDate.getDate() - 1); 
                  var nearestRight = getNextAvailableDay(currentDate, nextDate);
                  if (nearestRight.getMonth() > currentDate.getMonth()) {
                      monthPrev();
                      removeTempClass();
                  } 
                  var nearestLeft = getNextAvailableDay(currentDate, prevDate);
                  if (nearestRight.getMonth() > currentDate.getMonth()) {
                      return nearestLeft;
                  } 
                  if (nearestLeft.getMonth() < currentDate.getMonth()) {
                      monthNext();
                      removeTempClass();
                      return nearestRight;
                  }
                  var daysRight = Math.abs(currentDate.getDate() - nearestRight.getDate());
                  var daysLeft = Math.abs(currentDate.getDate() - nearestLeft.getDate());
                  //if getnextavailableday is not in available range
                  if(daysLeft == 0 && daysRight == 0) {
                      var od1 = new Date(currentDate.getTime());
                      var od2 = new Date(currentDate.getTime());
                      while (!checkDateValidity(od1) && !checkDateValidity(od2)) {
                          if(od1.getMonth() == currentDate.getMonth()) {
                              od1.setDate((od1.getDate()-1));
                          }
                          if (od2.getMonth() == currentDate.getMonth()) {
                              od2.setDate((od2.getDate()+1));
                          }
                      }
                      if (checkDateValidity(od1)) {
                          return od1;
                      } else {
                          return od2;
                      }
                  } else if (daysLeft == 0) {
                      return nearestRight;
                  } else if (daysRight == 0) {
                      return nearestLeft;
                  } else if(daysRight < daysLeft) {
                      return nearestRight;
                  } else {
                      return nearestLeft;
                  }
              }
          },
          dateKeydownHandler = function(e) {
              var prevSelected = new Date (tempSelected.getTime());
              switch (e.keyCode) {
              case keyCode.UP: // up key
                  e.preventDefault();
                  tempSelected.setDate(tempSelected.getDate() - 7);
                  setNewTempDate(prevSelected, tempSelected);
                  break;
              case keyCode.DOWN: // down key
                  e.preventDefault();
                  tempSelected.setDate(tempSelected.getDate() + 7);
                  setNewTempDate(prevSelected, tempSelected);
                  break;
              case keyCode.LEFT: // left key
                  e.preventDefault();
                  tempSelected.setDate(tempSelected.getDate() - 1);
                  setNewTempDate(prevSelected, tempSelected);
                  break;
              case keyCode.RIGHT: // right key
                  e.preventDefault();
                  tempSelected.setDate(tempSelected.getDate() + 1);
                  setNewTempDate(prevSelected, tempSelected);
                  break;
              case keyCode.ESC: // esc key
                  var oldSelected = element.querySelector("." + prefix + "datepicker-date-selected");
                  if (oldSelected) {
                      oldSelected.classList.remove(prefix + "datepicker-date-selected");
                      oldSelected.children[0].setAttribute("tabindex", "-1");
                  }
                  toggleCalendar();
                  break;
              case keyCode.TAB: // tab key
                  if ( focusableEls.length === 1 ) {
                      e.preventDefault();
                      break;
                  }
                  if ( e.shiftKey ) {
                      if ( document.activeElement === focusableEls[0] ) {
                          e.preventDefault();
                          focusableEls[ focusableEls.length - 1 ].focus();
                      }
                  } else {
                      if ( document.activeElement === focusableEls[ focusableEls.length - 1 ] ) {
                          e.preventDefault();
                          focusableEls[0].focus();
                      }
                  }
                  break;
              }
          },
          buttonKeydownHandler = function(e) {
              switch (e.keyCode) {
              case keyCode.ESC: // esc key
                  toggleCalendar();
                  break;
              case keyCode.TAB: // tab key
                  if ( focusableEls.length === 1 ) {
                      e.preventDefault();
                      break;
                  }
                  if ( e.shiftKey ) {
                      if ( document.activeElement === focusableEls[0] ) {
                          e.preventDefault();
                          focusableEls[ focusableEls.length - 1 ].focus();
                      }
                  } else {
                      if ( document.activeElement === focusableEls[ focusableEls.length - 1 ] ) {
                          e.preventDefault();
                          focusableEls[0].focus();
                      }
                  }
                  break;
              }
          },
          inputHandler = function() {
              if(checkDateValidity(new Date(dateInput.value)) && getComputedStyle(errorMsg).display == "block") {
                  errorMsg.style.display = "none";
                  dateInput.setCustomValidity("");
              } else if ((!checkDateValidity(new Date(dateInput.value)))) {
                  if (!isEdge || (isEdge && calendar.classList.contains(prefix + "d-none") && document.activeElement !== calendarBtn)) {
                      toggleCalendar();
                  }
                  if (getComputedStyle(errorMsg).display == "none") {
                      errorMsg.style.display = "block";
                      dateInput.setCustomValidity("Invalid Date");
                  }
              }
          },
          submitHandler = function(event) {
              var formValidationErrorSuffix = "Feedback";
              if (form.checkValidity() === false) {
                  each(form, function(el) {
                      if(el.tagName == "INPUT") {
                          var errorMsg = form.querySelector("#"+ el.getAttribute("id")+formValidationErrorSuffix);
                          setTimeout(function() {
                              if (el.classList.contains("dds__datepicker-input")) {
                                  if (checkDateValidity(new Date(el.value))) {
                                      el.setCustomValidity("");
                                  } else {
                                      el.setCustomValidity("Invalid Date");
                                  }
                              }
                              if (!el.validity.valid) {
                                  //if error message has not been turned on yet
                                  if(errorMsg && !(getComputedStyle(errorMsg)["display"] == "block")){
                                      errorMsg.style.display = "block";
                                  }
                                  el.setAttribute("aria-invalid", "true");
                                  el.setAttribute(
                                      "aria-describedby",
                                      el.getAttribute("id") + formValidationErrorSuffix
                                  );
                              } else {
                                  //if error message has not been turned off yet
                                  if(errorMsg && (getComputedStyle(errorMsg)["display"] == "block")){
                                      errorMsg.style.display = "none";
                                  } 
                                  el.setAttribute("aria-invalid", "false");
                                  el.setAttribute("aria-describedby", "");
                              }
                          }, 10);
                      }
                  });
                  event.preventDefault();
                  event.stopPropagation();
              }

              form.classList.add("dds__was-validated");
          };
      //public functions
      this.init = function () {
          createCalendar();
          options.button_prev = document.querySelector(target + " [data-calendar-toggle=previous]");
          options.button_next = document.querySelector(target + " [data-calendar-toggle=next]");
          monthEl = document.querySelector(target + " [data-calendar-area=month]");
          monthLabel = document.querySelector(target + " [data-calendar-label=month]");
          datePtr.setDate(1);
          createMonth();
          calendarWrapper = element.querySelector("."+prefix+"calendar-wrapper") ? element.querySelector("."+prefix+"calendar-wrapper") : createWrapper();
          options.button_prev.addEventListener("click", function() {
              monthPrev();
              removeTempClass();
              var prevMonthDate = new Date(tempSelected.getTime());
              prevMonthDate.setMonth(prevMonthDate.getMonth()-1);
              if (tempSelected.getMonth() === prevMonthDate.getMonth()) {
                  prevMonthDate.setDate(0);
              }
              setNewTempDate(prevMonthDate, getNearestAvailableDay(prevMonthDate));
              if(!options.button_prev.classList.contains(prefix + "disabled")) {
                  options.button_prev.focus();
              }
          }, false);
          options.button_next.addEventListener("click", function() {
              monthNext();
              removeTempClass();
              var nextMonthDate = new Date(tempSelected.getTime());
              nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
              if (nextMonthDate.getMonth() - tempSelected.getMonth() >= 2) {
                  nextMonthDate.setDate(0);
              }
              setNewTempDate(nextMonthDate, getNearestAvailableDay(nextMonthDate));
              if(!options.button_next.classList.contains(prefix + "disabled")) {
                  options.button_next.focus();
              }
          }, false);
          options.button_prev.addEventListener("keydown", buttonKeydownHandler, false);
          options.button_next.addEventListener("keydown", buttonKeydownHandler, false);
      };
      
      this.destroy = function () {
          options.button_prev.removeEventListener("click", monthPrev, false);
          options.button_next.removeEventListener("click", monthNext, false);
          options.button_prev.removeEventListener("keydown", buttonKeydownHandler, false);
          options.button_next.removeEventListener("keydown", buttonKeydownHandler, false);
          clearCalendar();
          document.querySelector(target).innerHTML = "";
      };
      this.reset = function () {
          this.destroy();
          this.init();
      };
      // this.set = function (options) {
      //     for (var k in options) {
      //         if (opts.hasOwnProperty(k)) {
      //             opts[k] = options[k];
      //         } 
      //     }
      //     createMonth();
      // }
      if (!(stringDatePicker in element)) {
          // validate options
          if (calendarBtn == null) {
              throw new Error("There was a problem found with date picker button, please correct and try again");
          }
          if (target == null) {
              throw new Error("There was a problem found with date picker target, please correct and try again");
          }
          if (calendar == null) {
              throw new Error("There was a problem found with calendar, please correct and try again");
          }
          //remove time from date
          datePtr.setHours(0, 0, 0, 0);
          todaysDate.setHours(0, 0, 0, 0);
          calendarBtn.addEventListener("click", toggleCalendar, false);
          if (isEdge) {
              calendarBtn.addEventListener("click", inputHandler, false);
              dateInput.addEventListener("focusout", inputHandler, false);
          }
          if(!dateInput.hasAttribute("placeholder")){
              console.warn("Placeholder was not set. Please set a placeholder value if you plan to use form validation. Setting to default placeholder value.");
              dateInput.setAttribute("placeholder", "__/__/____");
          }
          if (dateInput) {
              new InputMask(dateInput);
              var errorMsg = element.querySelector("." + prefix + "invalid-feedback");
              dateInput.addEventListener("change", inputHandler, false);
          }
          form = getClosest(element, "FORM", false);
          form.addEventListener("submit", submitHandler);
          this.init();
          setFocusableElements();
          // //set input mask
          options.defaultDate = options.defaultDate ? (checkDateValidity(new Date (options.defaultDate)) ? options.defaultDate : "" ) : ""; 
          if (!options.defaultDate) {
              options.defaultDate = new Date();
              options.defaultDate.setHours(0, 0, 0, 0);
          } else {
              var defaultDate = new Date (options.defaultDate);
              var defaultDay = defaultDate.getDate() < 10 ? "0" + defaultDate.getDate() : defaultDate.getDate();
              var defaultMonth = (defaultDate.getMonth() + 1) < 10 ? "0" + (defaultDate.getMonth() + 1) : (defaultDate.getMonth() + 1);

              dateInput.setAttribute("value", defaultMonth + "/" + defaultDay + "/" + defaultDate.getFullYear());
              var e = document.createEvent("Event");
              e.initEvent("change", false, false);
              dateInput.dispatchEvent(e);
              if (isIE || isEdge) {
                  element.style.display = "none"; //IE needs a small timeout or cursor will appear in input box
                  setTimeout(function() {
                      dateInput.blur();
                      element.style.display = "block";
                  }, 300);
              }   
          }
      }
      element[stringDatePicker] = self;
  }

  function BarSelect(element) {
      element = element instanceof HTMLElement ? element : (function() {
          return false;
      })();

      var self = this,
          stringBarSelect = "BarSelect",
          selects = null,
          value = 0,
          clickHandler = function (e) {
              var input = e.target.classList.contains(prefix + "bar-select") ? e.target.querySelector("input") : e.target.tagName == "LABEL" ? e.target.previousElementSibling : e.target;
              value = parseInt(input.getAttribute("value"));
              each(selects, function(select) {
                  if (parseInt(select.querySelector("input").getAttribute("value")) <= value) {
                      select.classList.remove(prefix + "bar-select-hover");
                      select.classList.add(prefix + "bar-select-selected");
                  } else {
                      select.classList.remove(prefix + "bar-select-hover");
                      select.classList.remove(prefix + "bar-select-selected");
                  }
              });
              uicoreCustomEvent("BarSelect", "SelectedValue", element, { "value": value});
          },
          mouseOverHandler = function(e) {
              var input = e.target.classList.contains(prefix + "bar-select") ? e.target.querySelector("input") : e.target.tagName == "LABEL" ? e.target.previousElementSibling : e.target;
              value = parseInt(input.getAttribute("value"));
              each(selects, function(select) {
                  if (parseInt(select.querySelector("input").getAttribute("value")) <= value) {
                      select.classList.add(prefix + "bar-select-hover");
                  } else {
                      select.classList.remove(prefix + "bar-select-hover");
                  }
              });
          },
          mouseOutHandler = function() {
              each(selects, function(select) {
                  select.classList.remove(prefix + "bar-select-hover");
              });
          },
          focusHandler = function(e) {
              var input = e.currentTarget.nextElementSibling;
              if (!isInViewport(input)) {
                  input.scrollIntoView(false);
              }
          },
          isInViewport = function(element) {
              var bounding = element.getBoundingClientRect();
              return (
                  bounding.top >= 0 &&
              bounding.left >= 0 &&
              bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
              bounding.right <= (window.innerWidth || document.documentElement.clientWidth)
              );
          };

      if (!(stringBarSelect in element)) {
          selects = element.querySelectorAll("." + prefix + "bar-select");
          element.addEventListener("mouseout", mouseOutHandler, false);
          each(selects, function(select) {
              select.addEventListener("click", clickHandler, false);
              select.addEventListener("mouseover", mouseOverHandler, false);
              if (isIE || isFirefox) {
                  select.querySelector("input").addEventListener("focusin", focusHandler, false);
              }
          });
      }

      element[stringBarSelect] = self;
  }

  function Button(element) {
      // initialization element
      element = element instanceof HTMLElement ? element : (function() {
          return false;
      })();

      // constant
      var self = this,
          stringButton = "Button",
          toggled = false, // toggled makes sure to prevent triggering twice the change.bs.button events
          pxToMove,
          btnWidth,
          checked = "checked",
          LABEL = "LABEL",
          onEl,
          offEl,
          circleEl,
          btnToggle,
          // private methods
          keyHandler = function(e) {
              var key = e.which || e.keyCode;
              key === 32 && e["target"] === DOC.activeElement && toggle(e);
          },
          preventScroll = function(e) {
              var key = e.which || e.keyCode;
              key === 32 && e["preventDefault"]();
          },
          toggle = function(e) {
              var label =
                  e["target"].tagName === LABEL 
                      ? e["target"] 
                      : e["target"]["parentNode"].tagName === LABEL 
                          ? e["target"]["parentNode"] 
                          : null; // the .btn label

              if (!label) return; //react if a label or its immediate child is clicked

              var eventTarget = e["target"], // the button itself, the target of the handler function
                  labels = getElementsByClassName(eventTarget["parentNode"], "btn"), // all the button group buttons
                  input = label["getElementsByTagName"]("INPUT")[0];
              
              if (!input) return; //return if no input found

              // manage the dom manipulation
              if (input.type === "checkbox") {
                  //checkboxes
                  if (!input[checked]) {
                      label.classList.add(prefix+"active");
                      input["getAttribute"](checked);
                      input["setAttribute"](checked, checked);
                      input[checked] = true;
                  } else {
                      label.classList.remove(prefix+"active");
                      input["getAttribute"](checked);
                      input.removeAttribute(checked);
                      input[checked] = false;
                  }

                  if (!toggled) {
                      // prevent triggering the event twice
                      toggled = true;
                      // bootstrapCustomEvent.call(input, "change", component); //trigger the change for the input
                      // bootstrapCustomEvent.call(element, "change", component); //trigger the change for the btn-group
                  }
              }

              if (input.type === "radio" && !toggled) {
                  // radio buttons
                  if (!input[checked]) {
                  // don't trigger if already active
                      label.classList.add(prefix+"active");
                      input["setAttribute"](checked, checked);
                      input[checked] = true;
                      // bootstrapCustomEvent.call(input, "change", component); //trigger the change for the input
                      // bootstrapCustomEvent.call(element, "change", component); //trigger the change for the btn-group

                      toggled = true;
                      each(labels, function(otherLabel) {
                          var otherInput = otherLabel["getElementsByTagName"]("INPUT")[0];
                          if (otherLabel !== label && otherLabel.classList["contains"](prefix+"active")) {
                              label.classList.remove(prefix+"active");
                              otherInput.removeAttribute(checked);
                              otherInput[checked] = false;
                              // bootstrapCustomEvent.call(otherInput, "change", component); // trigger the change
                          }
                      });
                  }
              }
              setTimeout(function() {
                  toggled = false;
              }, 50);
          },
          clickHandler = function() {
              // going from on to off
              if (btnToggle.getAttribute("aria-checked") === "true") {
                  self.toggleOff();
              // going from off to on
              } else {
                  self.toggleOn();
              }   
          };
      
      // public methods
      this.toggleOff = function() {
          circleEl.style.transform = "translateX(0px)";
          setTimeout(function(){
              btnToggle.setAttribute("aria-checked", "false");
          }, (getTransitionDurationFromElement(circleEl)/2)-25);
          offEl.setAttribute("aria-hidden", "false");
          onEl.setAttribute("aria-hidden", "true");
          uicoreCustomEvent("ButtonToggle", "Off", element);
      };
      this.toggleOn = function() {
          circleEl.style.transform = "translateX(" + pxToMove + "px)";
          setTimeout(function(){
              btnToggle.setAttribute("aria-checked", "true");
          }, (getTransitionDurationFromElement(circleEl)/2)-25);
          offEl.setAttribute("aria-hidden", "true");
          onEl.setAttribute("aria-hidden", "false") ;
          uicoreCustomEvent("ButtonToggle", "On", element);
      };

      // init
      if (!(stringButton in element)) {
          // prevent adding event handlers twice
          if (element.classList.contains(prefix + "btn-toggle-container")) {
              btnToggle = element.firstElementChild.tagName === "LABEL" ? element.querySelector("." + prefix + "btn-toggle") : element;
              
              offEl = btnToggle.querySelector("." + prefix + "toggle-txt-off");
              onEl = btnToggle.querySelector("." + prefix + "toggle-txt-on");
              circleEl = btnToggle.querySelector("." + prefix + "toggle-circle");
              
              if (element.firstElementChild.tagName === "SPAN") {
                  offEl.style.display="block";
                  onEl.style.display="block";
                  var widthOff = offEl.getBoundingClientRect().width;
                  var widthOn = onEl.getBoundingClientRect().width;
                  offEl.removeAttribute("style");
                  onEl.removeAttribute("style");
                  btnWidth = Math.max(widthOff, widthOn);
                  btnToggle.style.width = (btnWidth + 24) + "px";
              }

              pxToMove = btnToggle.getBoundingClientRect().width - 28;
              
              if(btnToggle.getAttribute("aria-checked") === "true"){
                  circleEl.style.transform = "translateX(" + pxToMove + "px)";
              }
              btnToggle.style.visibility = "visible";
              element.addEventListener("click", clickHandler);
          // bootstrap button js that needs to be checked on 
          } else {
              element.addEventListener("click", toggle, false);
              element["hasAttribute"]("tabindex") && 
              element.addEventListener("keyup", keyHandler, false),
              element.addEventListener("keydown", preventScroll, false);
      
              // activate items on load
              each(getElementsByClassName(element, prefix+"btn"), function(label) {
                  !label.classList["contains"](prefix+"active") &&
                  label("hasAttribute")("checked") &&
                  label.classList.add(prefix+"active");
              });
          }
          
      }

      element[stringButton] = self;
  }

  function ButtonFilter(element) {
      // initialization element
      element = element instanceof HTMLElement ? element : (function() {
          return false;
      })();

      var stringButtonFilter = "ButtonFilter",
          lastActiveItem = null,
          inactiveFilterItem,
          activeFilterItem,
          // Event Handlers
          focusInEventHandler = function(e) {
              var filterItem = e["currentTarget"];
              e.preventDefault();
              // Clicking or Tabbing on the active filter item
              var parentFieldset = getClosest(filterItem, "fieldset", false);
              if(filterItem == lastActiveItem || filterItem.classList.contains(prefix+"disabled") || parentFieldset && parentFieldset.hasAttribute("disabled")){
                  return;
              }

              activeFilterItem = filterItem;
              inactiveFilterItem = lastActiveItem;

              if (inactiveFilterItem.label) {
                  inactiveFilterItem.label.classList.remove(prefix + "active");
                  activeFilterItem.label.classList.add(prefix + "active");
              }
              if (inactiveFilterItem.input) {
                  inactiveFilterItem.input.removeAttribute("checked");
                  activeFilterItem.input.setAttribute("checked","");
              }

              inactiveFilterItem.classList.remove(prefix + "active");
              activeFilterItem.classList.add(prefix + "active");
              lastActiveItem = activeFilterItem;

              // TODO
              // Emit filter event typeArg: string, canBubbleArg: boolean, cancelableArg: boolean, detailArg: T
              uicoreCustomEvent("ButtonFilter", "Click", activeFilterItem.label, {"target": activeFilterItem.label.dataset["filterValue"]});
          };

      if (!(stringButtonFilter in element)) {
          var filterItems = element.querySelectorAll("."+ prefix + "filter-item");
          lastActiveItem = element.querySelector("." + prefix + "active");
          for (var f = 0; f < filterItems.length; f++) {
              filterItems[f].addEventListener("focusin", focusInEventHandler, false);
              filterItems[f].label = filterItems[f].querySelector("."+ prefix + "btn-filter");
              filterItems[f].input = filterItems[f].querySelector("."+ prefix + "btn-input");
          }
      }

      element[stringButtonFilter] = self;
  }

  function Overflow(element, options) {

      element = element instanceof HTMLElement ? element : (function () {
          return false;
      })();

      // set options
      options = options || {};
      if (element.dataset["type"]) {
          options.type = element.dataset["type"];
      }
      if (element.dataset["position"]) {
          options.position = element.dataset["position"];
      }
      if (element.dataset["top"]) {
          options.top = parseInt(element.dataset["top"]);
      }
      if (element.dataset["style"]) {
          options.style = element.dataset["style"];
      }

      options.type = options.type ? options.type : "single";
      options.style = options.style ? options.style === "svg" ? options.style = "svg" : "button" : "button";
      options.position = options.position && options.position === "outset" ? "outset" : "inset";
      options.top = options.top && typeof(options.top) === "number" ? options.top : null;
      options.lazyload = options.lazyload ? options.lazyload : false;
      options.responsive = options.responsive ?  options.responsive : false;

      var self = this,
          stringOverflow = "Overflow",
          overflowElement, // The UL container div
          overflowContainer, // The UL element
          overflowChildren,
          overflowChildRight,
          overflowChildLeft,
          centered = false,
          leftCtrl,
          rightCtrl,
          atLeftEnd = true,
          atRightEnd = true,
          ctrlWidth,
          containerLeft,
          containerRight,
          centeredOffset = 0,
          containerHeight = 0,
          containerWidth = 0,
          // handlers
          handleSizeChange = function() {
              if (containerWidth == overflowElement.offsetWidth) return;
              if (containerHeight !== overflowChildren.children[0].offsetHeight) {
                  handleResize();
              }
              setLeftAndRightIndex();
              containerWidth = overflowElement.offsetWidth;

          },
          handleResize = debounce(function() {
              getChildrenWidth();
              setLeftAndRightIndex();
              addHeightStyle([leftCtrl,rightCtrl]);
              if ( (Math.abs(overflowContainer.offsetLeft) + overflowContainer.offsetWidth) > overflowChildren.width) {
                  if(leftCtrl.hasAttribute("active")){
                      var currentOffset = pageRight();
                      overflowContainer.style.left = currentOffset + "px";
                  }
              }
          }, 10),
          handleClickEvent = function(e) {
              var isRight = e.target.classList.contains(prefix+"overflow-control-right") ? true : false;
              controlClick(isRight);
          },
          controlClick = function(isRight) {
              var currentOffset = null;
              if (options.type == "single") {
                  if (isRight) {
                      atLeftEnd = false;
                      var rightChild = overflowChildren.children[overflowChildRight+1];
                      var rightElementEdge = (rightChild.offsetLeft + rightChild.offsetWidth) - (Math.abs(overflowContainer.offsetLeft) + overflowContainer.offsetWidth);
                      if (overflowChildRight+1 >= (overflowChildren.children.length - 1) ) {
                          atRightEnd = true;
                      }
                      currentOffset = (Math.abs(overflowContainer.offsetLeft) + rightElementEdge + (options.position === "inset" && !atRightEnd ? ctrlWidth : 0))*-1;
                  } else {
                      atRightEnd = false;
                      var leftChild = overflowChildren.children[overflowChildLeft-1];
                      if (overflowChildLeft-1 === 0) {
                          atLeftEnd = true;
                          currentOffset = 0;
                      } else {
                          currentOffset = (leftChild.offsetLeft - (options.position === "inset" && !atLeftEnd ? ctrlWidth : 0))*-1;
                      }
                  }
              } else {
                  if (isRight) {
                      currentOffset = pageRight();
                  } else {
                      atRightEnd = false;
                      if (overflowChildren.children[overflowChildLeft].offsetLeft < overflowContainer.offsetWidth) {
                          atLeftEnd = true;
                          currentOffset = 0;
                      } else {
                          var tabLeft = Math.abs(overflowContainer.offsetLeft) - overflowChildren.children[overflowChildLeft-1].offsetLeft;
                          var contSpace = overflowContainer.offsetWidth - (options.position === "inset" ? ctrlWidth : 0) - overflowChildren.children[overflowChildLeft-1].offsetWidth;
                          currentOffset = ( Math.abs(overflowContainer.offsetLeft) - (tabLeft + contSpace))*-1;
                      }
                  }
              }
              overflowContainer.style.left = currentOffset + "px";
              emulateTransitionEnd(overflowContainer, setLeftAndRightIndex);
          },
          pageRight = function() {
              var rightChild;
              atLeftEnd = overflowChildren.width < overflowContainer.offsetWidth ? true : false;
              var currentOffset = null;
              var remainder = overflowChildren.width - (Math.abs(overflowContainer.offsetLeft) + overflowContainer.offsetWidth);
              if (overflowContainer.offsetWidth >= remainder) {
                  atRightEnd = true;
                  rightChild = overflowChildren.children[overflowChildren.children.length-1];
                  var rightElementEdge = (rightChild.offsetLeft + rightChild.offsetWidth) - (Math.abs(overflowContainer.offsetLeft) + overflowContainer.offsetWidth);
                  currentOffset = (Math.abs(overflowContainer.offsetLeft) + rightElementEdge)*-1;
              } else {
                  atRightEnd = false;
                  rightChild = overflowChildren.children[overflowChildRight+1];
                  currentOffset = (rightChild.offsetLeft - (options.position === "inset" && !atRightEnd ? ctrlWidth : 0))*-1;
              }
              return currentOffset;
          },
          setLeftAndRightCtrl = function() {
              if (atRightEnd) {
                  rightCtrl.removeAttribute("active");
                  if(isIE && centered && atLeftEnd) {
                      setMinimumWidth();
                  }
              } else if (!rightCtrl.hasAttribute("active") )  {
                  rightCtrl.setAttribute("active","");
                  if(isIE && centered) {
                      overflowContainer.style.minWidth = "";
                  }
              }
              if (atLeftEnd) {
                  leftCtrl.removeAttribute("active");
              } else if (!leftCtrl.hasAttribute("active") )  {
                  leftCtrl.setAttribute("active","");
              }
          },
          createArrowHtml = function() {
              leftCtrl = createElement("button", {
                  class: prefix+"overflow-control "+prefix+"overflow-control-left "+(options.style === "button" ? prefix+"overflow-control-btn" : prefix+"overflow-control-svg"),
                  tabIndex: "-1"
              });
              leftCtrl.style.left = options.position === "outset" ? "-8px" : "0px";
              leftCtrl.addEventListener("click", handleClickEvent, false);
              rightCtrl = createElement("button", {
                  class: prefix+"overflow-control "+prefix+"overflow-control-right "+(options.style === "button" ? prefix+"overflow-control-btn" : prefix+"overflow-control-svg"),
                  tabIndex: "-1"
              });
              rightCtrl.style.right = options.position === "outset" ? "-8px" : "0px";
              rightCtrl.addEventListener("click", handleClickEvent, false);
              if (options.top) {
                  rightCtrl.style.top = options.top+"px";
                  leftCtrl.style.top = options.top+"px";
              }
              var controls = [leftCtrl,rightCtrl];
              if (!options.responsive) {
                  each(controls, function(control) {
                      control.classList.add(prefix + "overflow-unresponsive");
                  });
              }
              addHeightStyle(controls);
              
              var leftSvg = renderSvg([{name:"chevron-left", show: true}], {"aria-hidden": true});
              classAdd(leftSvg, prefix+"overflow-control-left");
              var rightSvg = renderSvg([{name:"chevron-right", show: true}], {"aria-hidden": true});
              classAdd(rightSvg, prefix+"overflow-control-right");
              leftCtrl.appendChild(leftSvg);
              rightCtrl.appendChild(rightSvg);
              
              element.insertBefore(leftCtrl, element.children[0]);
              element.insertBefore(rightCtrl, element.children[1]);
              setCtrlWidth();
          },
          getChildrenWidth = function() {
              overflowChildren.width = 0;
              overflowChildren.children = [];
              each(overflowContainer.children, function(child) {
                  overflowChildren.width += child.offsetWidth+getMargin(child);
                  overflowChildren.children.push(child);
              });
              overflowChildren.width -= (isEdge ? overflowChildren.children.length - 1 : 0);
          },
          getMargin = function(child) {
              var style = child.currentStyle || window.getComputedStyle(child),
                  margin;
              if (isIE) {
                  margin = convertRemToPixels(style.getPropertyValue("margin-left")) + convertRemToPixels(style.getPropertyValue("margin-right"));
              } else {
                  margin = parseInt(style.marginLeft) + parseInt(style.marginRight);
              }
              return margin;
          },
          addHeightStyle = function(els) {
              if (!isArray(els)) {
                  els = [els];
              }
              each(els, function(el) {
                  if (options.style === "button") {
                      el.style.height = overflowChildren.children[0].offsetHeight +"px";
                      containerHeight = overflowChildren.children[0].offsetHeight;
                  }
              });
          },
          toggleCentered = function(offSet) {
              if (offSet < 0) {
                  if (overflowContainer.parentElement.classList.contains(prefix+"tabs-centered-container")) {
                      overflowContainer.parentElement.classList.remove(prefix+"tabs-centered-container");
                  }
                  if (overflowContainer.classList.contains(prefix+"tab-centered")) {
                      overflowContainer.classList.remove(prefix+"tab-centered");
                  }
                  return false;
              } else {
                  if (!overflowContainer.parentElement.classList.contains(prefix+"tabs-centered-container")) {
                      overflowContainer.parentElement.classList.add(prefix+"tabs-centered-container");
                  }
                  if (!overflowContainer.classList.contains(prefix+"tab-centered")) {
                      overflowContainer.classList.add(prefix+"tab-centered");
                  }
                  overflowContainer.style.left = "0px"; 
                  return true;    
              }
          },
          setContainerLeftRight = function(useCentered, offSet) {
              if (useCentered) {
                  containerLeft = offSet > 0 ? 0 : offSet;
                  containerRight = overflowElement.offsetWidth;
                  centeredOffset = Math.floor(offSet);
              } else {
                  containerLeft = Math.abs(overflowContainer.offsetLeft);
                  containerLeft += options.position === "inset" && !atLeftEnd ? ctrlWidth : 0;
                  containerRight = containerLeft + overflowContainer.offsetWidth;
              }
          },
          setLeftAndRightIndex = function() {
              overflowChildLeft = null;
              overflowChildRight = null;
              var overflowChildLeftSet = false,
                  offSet = (overflowElement.offsetWidth - overflowChildren.width)/2,
                  useCentered = false;
              if (centered) {
                  useCentered = toggleCentered(offSet);
              }
              setContainerLeftRight(useCentered, offSet);
              each(overflowChildren.children, function(child, idx) {
                  var childLeft;
                  if (useCentered) {
                      childLeft = centeredOffset + (Math.floor(overflowChildren.width/overflowChildren.children.length)*idx);
                  } else {
                      childLeft = child.offsetLeft;
                  }
                  if (!overflowChildLeftSet && childLeft >= containerLeft) {
                      overflowChildLeft = idx;
                      overflowChildLeftSet = true;
                  }
                  if (childLeft+child.offsetWidth <= containerRight) {
                      overflowChildRight = idx;
                  }
              });
              if (overflowChildLeft > 0 ) {
                  atLeftEnd = false;
              } else {
                  atLeftEnd = true;
              }
              if (overflowChildRight < (overflowChildren.children.length-1)) {
                  atRightEnd = false;
              } else {
                  atRightEnd = true;
              }
              setLeftAndRightCtrl();
              uicoreCustomEvent("Overflow", "ChangeEvent", element, {
                  "left": overflowChildLeft, 
                  "right": overflowChildRight, 
                  "totalItems": overflowChildren.children.length,
                  "hasRightControl": rightCtrl.hasAttribute("active"),
                  "hasLeftControl": leftCtrl.hasAttribute("active")
              });
          },
          convertRemToPixels = function(rem) {  
              if (rem.indexOf("rem") > 0) { 
                  rem = rem.split("rem")[0];
                  var computed = rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
                  if (computed < 0) {
                      return Math.floor(computed);
                  } else {
                      return Math.ceil(computed);
                  }
              } else {
                  return 0;
              }
          },
          setCtrlWidth = function() {
              var style = rightCtrl.currentStyle || window.getComputedStyle(rightCtrl, null);
              if (isIE) {
                  ctrlWidth = convertRemToPixels(style.getPropertyValue("width"));
              } else {
                  ctrlWidth = parseInt(style.getPropertyValue("width").match(/^\d.?/g)[0]);
              }
          },
          setMinimumWidth = function() {
              var width = 0;
              each(overflowContainer.querySelectorAll("LI"), function(child) {
                  width += 120+getMargin(child);
              });
              overflowContainer.style.minWidth = (width-5) + "px";
          },
          frameListener = function() {
              handleSizeChange();
              window.requestAnimationFrame(frameListener);
          },
          init = function(){
              getChildrenWidth();
              createArrowHtml();
              setLeftAndRightIndex();
              if (overflowChildRight < overflowChildren.children.length-1) {
                  rightCtrl.setAttribute("active","");
              }
              if (isIE && centered && atLeftEnd && atRightEnd) {
                  setMinimumWidth();
              }
              window.addEventListener("resize", handleResize, false);
              containerWidth = overflowElement.offsetWidth;
              window.requestAnimationFrame(frameListener);
          };
      
      this.lazyLoad = function() {
          if (stringOverflow in element) {
              init();
          }
      };

      this.getCurrentDetails = function() {
          return {"left": overflowChildLeft, 
              "right": overflowChildRight,
              "totalItems": overflowChildren.children.length,
              "hasRightControl": rightCtrl.hasAttribute("active"),
              "hasLeftControl": leftCtrl.hasAttribute("active")
          };
      };
      this.clickRight = function() {
          controlClick(true);
      };

      this.clickLeft = function() {
          controlClick(false);
      };

      this.clickEnd = function() {
          atLeftEnd = overflowChildren.width < overflowContainer.offsetWidth ? true : false;
          atRightEnd = true;
          if(rightCtrl.hasAttribute("active")){
              overflowContainer.style.left = ((overflowChildren.width - overflowContainer.offsetWidth + (options.position === "inset" && !atRightEnd ? ctrlWidth : 0))*-1)+"px";
          }
          rightCtrl.removeAttribute("active");
          emulateTransitionEnd(overflowContainer, setLeftAndRightIndex);
      };

      this.clickHome = function() {
          atLeftEnd = true;
          atRightEnd = false;
          if(leftCtrl.hasAttribute("active")){
              overflowContainer.style.left = "0px";
          }
          leftCtrl.removeAttribute("active");
          emulateTransitionEnd(overflowContainer, setLeftAndRightIndex);
      };

      //init
      if (!(stringOverflow in element)) {
          overflowElement = element;
          if (element.children[0].classList.contains(prefix + "tabs-centered-container")) {
              centered = true;
          }

          overflowElement.style.overflow = "hidden";
          overflowContainer = overflowElement.querySelector("UL");
          overflowContainer.classList.add(prefix + "overflow-transition");
          overflowContainer.setAttribute("style","position: relative; flex-wrap: nowrap; white-space: nowrap; left: 0px");
          overflowChildren = {};
          // Some child elements contain images so wait for page load to initialize.
          if (!options.lazyload) {
              init();
          }
          
      }

      element[stringOverflow] = self;
  }

  function Carousel(element, options) {
      // initialization element
      element = element instanceof HTMLElement ? element : (function() {
          return false;
      })();

      // set options
      options = options || {};
      options = jsonOptionsInit(element, options);
      options.interval = element.dataset.interval ? validateNum(element.dataset.interval, 5000) : validateNum(options.interval, 5000);
      options.pause = element.dataset.pause ? element.dataset.pause === "hover" ? element.dataset.pause : false : options.pause === "hover" ? options.pause : false;
      options.keyboard = element.dataset.keyboard ? element.dataset.keyboard === "true" ? true: false : options.keyboard === "true" ? true : false;
      options.mosaic = false;
      
      // DATA API
      var stringCarousel = "Carousel",
          visibilityState = "visible",
          smallMediaSize = window.matchMedia("(max-width: 767.98px)"),
          // strings
          paused = "paused",
          dataSlideTo = "data-slide-to",
          mouseHover = "onmouseleave" in DOC ? ["mouseenter", "mouseleave"] : ["mouseover", "mouseout"];

      // bind, event targets
      var self = this,
          stopAutoRotate = false,
          index = (element.index = 0),
          timer = (element.timer = 0),
          isSliding = false, // isSliding prevents click event handlers when animation is running
          slides = getElementsByClassName(element, prefix+"carousel-item"),
          total = slides["length"],
          slideDirection = (this["direction"] = "left"),
          // Arrow capability
          leftArrow = getElementsByClassName(
              element,
              prefix+"carousel-control-prev"
          )[0],
          rightArrow = getElementsByClassName(
              element,
              prefix+"carousel-control-next"
          )[0],
          // SVG indicators
          svgIndicator = element.querySelector("." + prefix+"carousel-indicators"),
          svgIndicators = (svgIndicator && svgIndicator["getElementsByTagName"]("LI")) || [],
          // Button indicatos
          btnIndicator = element.querySelector("." + prefix+"carousel-indicators-btn"),
          btnIndicators = (btnIndicator && btnIndicator["getElementsByTagName"]("LI")) || [],
          indicator = svgIndicator ? svgIndicator : btnIndicator,
          indicators = svgIndicators["length"] > 0 ? svgIndicators : btnIndicators;

      // invalidate when not enough items
      if (total < 2) {
          return;
      }

      // handlers
      var pauseHandler = function() {
              if (options.interval !== false && !element.classList["contains"](paused)) {
                  element.classList.add(paused);
                  !isSliding && clearTimer(timer);
              }
          },
          resumeHandler = function() {
              if (options.interval !== false && element.classList["contains"](paused)) {
                  element.classList.remove(paused);
                  !isSliding && clearTimer(timer);
                  !isSliding && self.cycle();
              }
          },
          indicatorHandler = function(e) {
              e["preventDefault"]();
              if (isSliding) return;

              var eventTarget = e["target"]; // event target | the current active item

              if (eventTarget && !eventTarget.classList["contains"](prefix+"active") && eventTarget["getAttribute"](dataSlideTo)) {
                  index = parseInt(eventTarget["getAttribute"](dataSlideTo), 10);
                  stopAutoRotate = true;
              } else {
                  return false;
              }

              self.slideTo(index); //Do the slide
          },
          controlsHandler = function(e) {
              e["preventDefault"]();
              if (isSliding) return;

              var eventTarget = e.currentTarget || e.srcElement;

              if (eventTarget === rightArrow) {
                  index++;
              } else if (eventTarget === leftArrow) {
                  index--;
              }

              self.slideTo(index); //Do the slide
          },
          keyHandler = function(e) {
              if (isSliding) return;
              switch (e.which) {
              case 39: index++; break; 
              case 37: index--; break;
              default: return;
              }
              self.slideTo(index); //Do the slide
          },
          swipeHandler =  function (el, d) {
              switch (d) {
              case direction.LEFT:
                  self.slideTo(index+1);
                  break;
              case direction.RIGHT:
                  self.slideTo(index-1);
                  break;                    
              }
          },
          // private methods
          isElementInScrollRange = function() {
              var rect = element["getBoundingClientRect"](),
                  viewportHeight = globalObject[innerHeight] || HTML["clientHeight"];
              return rect["top"] <= viewportHeight && rect["bottom"] >= 0; // bottom && top
          },
          setActivePage = function(pageIndex) {
              //indicators
              each (indicators, function(indicator) {
                  indicator.classList.remove(prefix+"active");
              });
              if (indicators[pageIndex]) indicators[pageIndex].classList.add(prefix+"active");
          },
          clearTimer = function(timer) {
              clearInterval(timer);
              timer = null;
          },
          toggleMosaic = function(e) {
              pauseHandler();
              if (e.matches) {
                  stopAutoRotate = false;
                  element.addEventListener(mouseHover[0], pauseHandler, false);
                  element.addEventListener(mouseHover[1], resumeHandler, false);
                  element.addEventListener("touchstart", pauseHandler, false);
                  element.addEventListener("touchend", resumeHandler, false);
                  resumeHandler();
              } else {
                  stopAutoRotate = true;
                  element.removeEventListener(mouseHover[0], pauseHandler, false);
                  element.removeEventListener(mouseHover[1], resumeHandler, false);
                  element.removeEventListener("touchstart", pauseHandler, false);
                  element.removeEventListener("touchend", resumeHandler, false);
              }
          };

      // public methods
      this.cycle = function() {
          if(!stopAutoRotate) {
              if (timer) {
                  clearTimer(timer);
              }
              timer = setInterval(function() {
                  isElementInScrollRange() && (index++, self.slideTo(index));
              }, options.interval);
          } else {
              if (timer) {
                  clearTimer(timer);
              }
          }
      };
      this.slideTo = function(next) {
          if (isSliding) return; // when controled via methods, make sure to check again

          var activeItem = this.getActiveIndex(); // the current active
          // orientation;
          // chaeck to see if we need to reset carousel
          
          // first return if we're on the same item #227
          if (activeItem === next) {
              return;
          }

          // determine slide direction
          if (activeItem < next) {
              slideDirection = "right";
          } else {
              slideDirection = "left";
          }

          // find the right next index
          if (next < 0) {
              next = total - 1;
          } else if (next >= total) {
              next = 0;
          }

          // update index
          index = next;

          uicoreCustomEvent("Carousel", "SlideEvent", element, { "direction": slideDirection, "slide-to" : next });

          isSliding = true;
          clearTimer(timer);
          setActivePage(next);

          if (supportTransitions && element.classList["contains"]("slide")) {
              // apply appropriate animation
              if (slideDirection === "right") {
                  slides[next].classList.add(prefix+"carousel-item-next");
                  slides[next]["offsetWidth"];
                  slides[next].classList.add(prefix+"carousel-item-left");
                  slides[activeItem].classList.add(prefix+"carousel-item-left");
              } else {
                  slides[next].classList.add(prefix+"carousel-item-prev");
                  slides[next]["offsetWidth"];
                  slides[next].classList.add(prefix+"carousel-item-right");
                  slides[activeItem].classList.add(prefix+"carousel-item-right");
              }
              var timeout = getTransitionDurationFromElement(slides[next]);

              isSliding &&
              setTimeout(function() {
                  isSliding = false;

                  slides[next].classList.add(prefix+"active");
                  slides[activeItem].classList.remove(prefix+"active");

                  slides[next].classList.remove(prefix+"carousel-item-next");
                  slides[next].classList.remove(prefix+"carousel-item-prev");
                  slides[next].classList.remove(prefix+"carousel-item-left");
                  slides[next].classList.remove(prefix+"carousel-item-right");
                  slides[activeItem].classList.remove(prefix+"carousel-item-left");
                  uicoreCustomEvent("Carousel", "SlideEvent", element, { "direction": slideDirection, "slide-to" : next });
                  
                  if (!(visibilityState === "hidden") && options.interval && !element.classList["contains"](paused)) {
                      self.cycle();
                  } else {
                      if(visibilityState === "hidden") {
                          pauseHandler();
                      }
                  }
              }, timeout);

          } else {
              slides[next].classList.add(prefix+"active");
              slides[next]["offsetWidth"];
              slides[activeItem].classList.remove(prefix+"active");
              setTimeout(function() {
                  isSliding = false;
                  if (options.interval && !element.classList["contains"](paused)) {
                      self.cycle();
                  }
                  uicoreCustomEvent("Carousel", "SlideEvent", element, { "direction": slideDirection, "slide-to" : next });
              }, 100);
          }
      };
      this.getActiveIndex = function() {
          return (
              slides["indexOf"](
                  getElementsByClassName(element, prefix+"carousel-item" + " " + prefix + "active")[0]
              ) || 0
          );
      };

      // init
      if (!(stringCarousel in element)) {
          
          if (element.classList.contains(prefix + "mosaic")){
              options.mosaic = true;
          }
        
          DOC.addEventListener("visibilitychange", function(){
              if (visibilityState === "hidden" && document.visibilityState === "visible") {
                  resumeHandler();
              }
              visibilityState = document.visibilityState;
          });

          if (options.pause && options.interval) {
              if (!options.mosaic || (options.mosaic && smallMediaSize.matches)) {
                  element.addEventListener(mouseHover[0], pauseHandler, false);
                  element.addEventListener(mouseHover[1], resumeHandler, false);
                  element.addEventListener("touchstart", pauseHandler, false);
                  element.addEventListener("touchend", resumeHandler, false);
              } 
              if (options.mosaic) {
                  if (isIE) {
                      ieMosaicPolyfill(slides);
                  }
                  if (!smallMediaSize.matches) {
                      stopAutoRotate = true;
                  }
                  smallMediaSize.addListener(toggleMosaic);
              }
          }

          swipeInit(element, swipeHandler);

          rightArrow && rightArrow.addEventListener("click", controlsHandler, false);
          leftArrow && leftArrow.addEventListener("click", controlsHandler, false);

          indicator && indicator.addEventListener("click", indicatorHandler, false);

          if (!svgIndicator) {
              each (indicators, function(indicator) {
                  each (indicator.children, function(childIndicator) {
                      childIndicator.addEventListener("click", indicatorHandler);
                  });
                  indicator.addEventListener("click", indicatorHandler);
              });
          }

          options.keyboard === true && globalObject.addEventListener("keydown", keyHandler, false);
          if (self.getActiveIndex() < 0) {
              slides[length] && slides[0].classList.add(prefix+"active");
              indicators[length] && setActivePage(0);
          }
      
          if (options.interval) {
              self.cycle();
          }
      }
      element[stringCarousel] = self;
  }

  function FilmstripCarousel(element, options) {
      element = element instanceof HTMLElement ? element : (function() {
          return false;
      })();

      options = options || {};
      options = jsonOptionsInit(element, options);
      options.lazyload = typeof options.lazyload === "boolean" ? options.lazyload : false;

      var stringFilmstrip = "Filmstrip",
          activeElement,
          itemsView,
          overflow = {},
          overflowContainer,
          // handlers
          handleOverflowChange = function(e) {
              overflow.detail = e.detail;
              updateItemsView();
          },
          clickEventHandler = function(e) {
              e.preventDefault();
              var target = e.target;
              if (target && target.parentElement.tagName === "BUTTON") {
                  target = target.parentElement;
              }
              if (activeElement) {
                  activeElement.classList.remove(prefix + "active");
                  activeElement.setAttribute("aria-pressed","false");
              }
              target.classList.add(prefix + "active");
              target.setAttribute("aria-pressed","true");
              activeElement = target;
              // Emit filter event
              uicoreCustomEvent("FilmstripCarousel", "ItemClick", element, {"target": target.dataset["filterValue"]});
          },
          updateItemsView = function() {
              if(itemsView){
                  var rightNumber = overflow.detail.hasRightControl ? overflow.detail.right+1 : overflow.detail.totalItems,
                      leftNumber = overflow.detail.hasLeftControl ? overflow.detail.left+1 : 1;
                  itemsView.innerHTML = "<span>Viewing " + (leftNumber) + (leftNumber < rightNumber ? " - " + (rightNumber) : "") + " of "+ overflow.detail.totalItems +" items </span>";
              }
          };

      this.lazyLoad = function() {
          if (options.lazyload && overflow) {
              overflow.lazyLoad();
              overflow.detail = overflow.getCurrentDetails();
              updateItemsView();
              overflowContainer.addEventListener("uicOverflowChangeEvent", handleOverflowChange, false);
              uicoreCustomEvent("FilmstripCarousel", "LazyLoadEvent", element, {"success": true});
          }
          else {
              uicoreCustomEvent("FilmstripCarousel", "LazyLoadEvent", element, {"success": false, "msg": "Carousel cannot be lazy loaded. Check usage or avoid mulitple lazy loads."});
          }
      };

      // prevent adding event handlers twice
      if (!(stringFilmstrip in element)) {
          itemsView = element.parentElement.querySelector("DIV.dds__items-view");
          each(element.querySelector("UL").querySelectorAll("LI BUTTON"), function(el) {
              if (el.classList.contains(prefix + "active")) {
                  activeElement = el;
              }
              el.addEventListener("click", clickEventHandler, false);
          });

          overflowContainer = getClosest(element, "." + prefix + "container-overflow");
          if (overflowContainer) {
              overflow = new Overflow(overflowContainer, {
                  position: "outset",
                  style: "svg",
                  top: 50,
                  lazyload: options.lazyload
              });
              if (!options.lazyload) {
                  overflow.detail = overflow.getCurrentDetails();
                  updateItemsView();
                  overflowContainer.addEventListener("uicOverflowChangeEvent", handleOverflowChange, false);
              }
          }
          
      }

      element[stringFilmstrip] = self;

  }

  function Collapse(element, options) {
      // initialization element
      element = element instanceof HTMLElement ? element : (function() {
          return false;
      })();

      // set options
      options = options || {};
      options = jsonOptionsInit(element, options);
      options.target = element.dataset.target ? element.dataset.target
          : options.target ? options.target : element.href && element.getAttribute("href") ? element.getAttribute("href") : false;
      options.parent = element.dataset.parent ? element.dataset.parent : options.parent ? options.parent : false;

      // validate options
      (function () {
          if(!options.target || !(options.target.charAt(0) === "#")) {
              throw new Error("There was a problem found with target value, please correct and try again");
          }
      })();

      // event targets and constants
      var self = this,
          accordion = null,
          stringCollapse = "Collapse",
          collapse = null,
          activeCollapse,
          activeElement,
          showAllBtn,
          hideAllBtn,
          isClickable = true, 
          // private methods
          openAction = function(collapseElement, toggle) {
              uicoreCustomEvent("ShowHide", "ShowEvent", collapseElement);
              collapseElement.isAnimating = true;
              collapseElement.classList.add(prefix + "collapsing");
              collapseElement.classList.remove(prefix+"collapse");
              collapseElement.style.height = collapseElement.scrollHeight + "px";
              collapseElement.children[0].focus();
              toggle.setAttribute("aria-expanded", "true");

              emulateTransitionEnd(collapseElement, function() {
                  if (!toggle.classList.contains(prefix+"collapsed")) {
                      collapseElement.isAnimating = false;
                      collapseElement.setAttribute("aria-expanded", "true");
                      collapseElement.classList.remove(prefix + "collapsing");
                      collapseElement.classList.add(prefix + "collapse");
                      collapseElement.classList.add(prefix + "show");
                      collapseElement.style.height = "";
                      uicoreCustomEvent("ShowHide", "Shown", collapseElement);
                  }
              });
          },
          closeAction = function(collapseElement, toggle) {
              uicoreCustomEvent("ShowHide", "HideEvent", collapseElement);
              collapseElement.isAnimating = true;
              collapseElement.style.height = collapseElement.scrollHeight + "px"; // set height first
              collapseElement.classList.remove(prefix + "collapse");
              collapseElement.classList.remove(prefix+"show");
              collapseElement.classList.add(prefix + "collapsing");
              collapseElement.offsetWidth; // force reflow to enable transition
              collapseElement.style.height = "0rem";
              toggle.setAttribute("aria-expanded", "false");

              emulateTransitionEnd(collapseElement, function() {
                  collapseElement.isAnimating = false;
                  collapseElement.setAttribute("aria-expanded", "false");
                  collapseElement.classList.remove(prefix + "collapsing");
                  collapseElement.classList.add(prefix + "collapse");
                  collapseElement.style.height = "";
                  uicoreCustomEvent("ShowHide", "Hidden", collapseElement);
              });
          },
          showAll = function() {
              // this function will be called by all the sub accordions individually
              // thus, achieve the goal to show all
              if (element.classList.contains(prefix + "collapsed")){
                  self.show();
              }
          },
          hideAll = function() {
              if (!element.classList.contains(prefix + "collapsed")){
                  self.hide();
              }
          }, 
          handleBeginShow = function() {
              isClickable = false;
          },
          handleEndShow = function() {
              isClickable = true;
          };

      // public methods
      this.toggle = function(e) {
          if (!isClickable) {
              return;
          }
          if (e) {
              e.preventDefault();
          }
          if (!collapse.classList.contains(prefix+"show")) {
              self.show();
          } else {
              self.hide();
          }
      };
      this.hide = function() {
          if (collapse.isAnimating) return;
          closeAction(collapse, element);
          element.classList.add(prefix + "collapsed");
      };
      this.show = function() {
          if (accordion && options.parent) {
              activeCollapse = accordion.querySelector("." + prefix + "collapse" + "." + prefix+"show")  || accordion.querySelector("."+prefix+"collapsing");
              activeElement =
              activeCollapse &&
              (accordion.querySelector("[data-toggle='" + prefix + "collapse" + "'][data-target='#" + activeCollapse.id + "']") ||
              accordion.querySelector("[data-toggle='" +prefix + "collapse" + "'][href='#" + activeCollapse.id + "']"));
          }

          if (
              !collapse.isAnimating || (activeCollapse && !activeCollapse.isAnimating)) {
              if (activeElement && activeCollapse !== collapse) {
                  closeAction(activeCollapse, activeElement);
                  activeElement.classList.add(prefix + "collapsed");
              }
              openAction(collapse, element);
              element.classList.remove(prefix + "collapsed");
          }
      };

      // init
      if (!(stringCollapse in element)) {
          element.addEventListener("click", self.toggle, false);

          collapse = DOC.getElementById(options.target.substr(1));
          if (collapse) {
              collapse.isAnimating = false; //// when true it will prevent click handlers
          }
          accordion = options.parent && getClosest(element, options.parent)
                      || getClosest(element, "." + prefix + "accordion");

          if (accordion) {
              var showHideAll = accordion.querySelector(".dds__show-hide-container");
              if (showHideAll) {
                  showAllBtn = showHideAll.querySelector(".dds__show-all");
                  if(showAllBtn) {
                      showAllBtn.addEventListener("click", showAll, false);
                  }
                  hideAllBtn = showHideAll.querySelector(".dds__hide-all");
                  if(hideAllBtn) {
                      hideAllBtn.addEventListener("click", hideAll, false);
                  }
              }
          }
          document.addEventListener("uicShowHideShowEvent", handleBeginShow);
          document.addEventListener("uicShowHideShown", handleEndShow);
      }
      
      element[stringCollapse] = self;

  }

  function ContactDrawer(element, options) {
      // initialization element
      element = element instanceof HTMLElement ? element : (function() {
          return false;
      })();

      // set options
      options = options || {};
      options = jsonOptionsInit(element, options);
      options.openTime =  options.openTime ? options.openTime : 5000; // milliseconds
      options.closedTime = options.closedTime ? options.closedTime : 7000;  // milliseconds
      options.transitionTime = options.transitionTime ? options.transitionTime : 500;  // milliseconds

      // bind, elements
      var self = this,
          stringContactDrawer = "ContactDrawer",
          tab = element.querySelector("." + prefix + "drawer-tab"),
          closeButton = element.querySelector("." + prefix + "close-x"),
          content = element.querySelector("." + prefix + "drawer-content"),
          visible = true,
          cancelAutomation = false;

      // handlers
      var clickHandler = function (e) {
          e.preventDefault();
          if (!cancelAutomation) {
              cancelAutomation = true;
          }
          toggleAction();
      };

      // private methods
      var openAction = function() {
              visible = true;
              element.classList.add(prefix + "drawer-open");
              uicoreCustomEvent("ContactDrawer", "OpenEvent", element);
              content.hidden = false;
              content.setAttribute("aria-hidden", false);
          },
          closeAction = function() {
              visible = false;
              element.classList.remove(prefix + "drawer-open");
              uicoreCustomEvent("ContactDrawer", "CloseEvent", element);
              setTimeout(function() {
                  content.hidden = true;
              }, options.transitionTime);
              content.setAttribute("aria-hidden", true);
          },
          toggleAction = function() {
              if (visible) {
                  closeAction();
              } else {
                  openAction();
              }
          },
          setDrawerToggleOptions =  function() {
              var toggleOptionsStr = content.dataset.contactDrawer;
              if (toggleOptionsStr) {
                  var toggleOptions = JSON.parse(toggleOptionsStr);

                  if (toggleOptions) {
                      if (toggleOptions.OpenTimeInSeconds)
                          options.openTime = toggleOptions.OpenTimeInSeconds * 1000;
                      if (toggleOptions.CloseTimeInSeconds)
                          options.closedTime = toggleOptions.CloseTimeInSeconds * 1000;
                      if (toggleOptions.TransitionTimeInMilliseconds)
                          options.transitionTime = toggleOptions.TransitionTimeInMilliseconds;
                  }
              }
          },
          setTransitionTime = function() {
              if (
                  options.transitionTime > options.openTime ||
                  options.transitionTime > options.closedTime
              ) {
                  //console.warn("contact drawer transition time is too large");
                  return;
              }

              if (element) {
                  element.style.transition = "all " + options.transitionTime + "ms ease";
              }
          };

      // public methods
      this.timerAction = function() {
          if (!cancelAutomation) {
              if (visible) {
                  closeAction();
                  if (options.closedTime) {
                      setTimeout(function() {
                          return self.timerAction();
                      }, options.closedTime);
                  }
              } else {
                  openAction();
                  if (options.openTime) {
                      setTimeout(function() {
                          return self.timerAction();
                      }, options.openTime);
                  }
              }
          }
      };

      // init
      if (!(stringContactDrawer in element)) {

          tab.addEventListener("click", clickHandler, false);
          closeButton.addEventListener("click", clickHandler, false);

          setDrawerToggleOptions();
          setTransitionTime();
      }

      if(!cancelAutomation) {
          self.timerAction();
      }
      element[stringContactDrawer] = self;
  }

  function Dropdown(element, options) {
      // initialization element
      element = element instanceof HTMLElement ? element : (function() {
          return false;
      })();

      // set option
      options = options || {};
      options = jsonOptionsInit(element, options);
      options.persist = element.dataset.persist ? element.dataset.persist : options.persist ? options.persist : false;
      // constants, event targets, strings
      var self = this,
          stringDropdown = "Dropdown",
          parent = element.parentNode,
          isMultiSelect = false,
          relatedTarget = null,
          menu = parent.querySelector("."+prefix+"button-dropdown-container"),
          menuItems,
          itemsChecked,
          currentText,
          filters,
          // preventDefault on empty anchor links
          preventEmptyAnchor = function (anchor) {
              if ((anchor && anchor.tagName === "A" && anchor.href && anchor.href.slice(-1) === "#") ||
                  (anchor && anchor.parentNode && anchor.parentNode.tagName === "A" && anchor.parentNode.href && anchor.parentNode.href.slice(-1) === "#")) {
                  this.preventDefault();
              }
          },
          // toggle dismissible events
          toggleDismiss = function () {
              if (element.open) {
                  element.addEventListener("click", dismissHandler, false);
                  element.addEventListener("keydown", preventScroll, false);
                  menu.addEventListener("keydown", preventScroll, false);
                  menu.addEventListener("click", dismissHandler, false);
                  window.addEventListener("click", windowClickHandler, true);
              } else {
                  element.removeEventListener("click", dismissHandler, false);
                  element.removeEventListener("keydown", preventScroll, false);
                  menu.removeEventListener("keydown", preventScroll, false);
                  menu.removeEventListener("click", dismissHandler, false);
                  window.removeEventListener("click", windowClickHandler, true);
              }
          },
          // handlers
          dismissHandler = function (e) {
              var eventTarget = e.target, 
                  hasData = eventTarget && (stringDropdown in eventTarget || stringDropdown in eventTarget.parentNode);
              if ((eventTarget === menu || menu.contains(eventTarget))
                  && (options.persist || hasData)) {
                  return;
              } else {
                  relatedTarget =
                      eventTarget === element || element.contains(eventTarget)
                          ? element
                          : null;
                  
                  if (!eventTarget.classList.contains(prefix + "disabled")) {
                      hide();
                  }
              }
              element.focus();
              preventEmptyAnchor.call(e, eventTarget);
          },
          formatDisplayCount = function() {
              var displayTxt;
              if (itemsChecked > 0) {
                  displayTxt = " (" + itemsChecked +")";
              } else {
                  displayTxt = " ";
              }
              var checkedCounter = element.querySelector("." + prefix + "checked-presentation");
              if (checkedCounter != null) {
                  checkedCounter.innerHTML = checkedCounter.innerHTML.replace(currentText, displayTxt);
                  currentText = displayTxt;
              } else {
                  checkedCounter = createElement("span", {
                      class: prefix + "checked-presentation " + prefix + "ml-1",
                      html: displayTxt
                  });
                  currentText = checkedCounter.innerHTML;
                  // element.insertBefore(checkedCounter,element.querySelector("svg." + prefix + "arrow-tri-solid-right"));
                  element.querySelector(".dds__text-truncate").appendChild(checkedCounter);
              }
              
          },
          clickHandler = function (e) {
              relatedTarget = element;

              if (isMultiSelect && e.target.tagName === "INPUT") {
                  if (e.target.checked) {
                      filters.push(e.target.name);
                      e.target.parentElement.parentElement.setAttribute("aria-checked", "true");
                      uicoreCustomEvent("Dropdown", "AddEvent", element, { "filters": filters, "filter": e.target.name, "filterInput": e.target});
                  } else {
                      var index = filters.indexOf(e.target.name);
                      filters.splice(index, 1);
                      e.target.parentElement.parentElement.setAttribute("aria-checked", "false");
                      uicoreCustomEvent("Dropdown", "RemoveEvent", element, { "filters": filters, "filter": e.target.name, "filterInput": e.target});
                  }
                  self.recountChecked();

                  // element.innerHTML = element.innerHTML.replace(currentText, displayTxt);
                  // currentText = displayTxt;
                  element.focus();
              }
              else if (e.target.tagName == "BUTTON"  || e.target.parentElement.tagName == "BUTTON" || e.target.parentElement.parentElement.tagName == "BUTTON"){
                  self.toggle();
                  preventEmptyAnchor.call(e, e.target);
              }
          },
          preventScroll = function (e) {
              var key = e.which || e.keyCode;
              if (key === 38 || key === 40) {
                  e.preventDefault();
              }
          },
          keyHandler = function (e) {
              var key = e.which || e.keyCode,
                  activeItem = DOC.activeElement,
                  isMenuOpen = menu.classList.contains(prefix + "show"),
                  isSameElement = (activeItem === element) || (activeItem.parentNode === menu),
                  isInsideMenu = menu.contains(activeItem),
                  isMenuItem = activeItem.parentNode === menu || activeItem.parentNode.parentNode === menu;

              if ((isMenuItem) || (isMenuOpen && isSameElement)) {
                  // checking element with enter or spacebar
                  if (isInsideMenu && (key === 13 || key === 32)) {
                      activeItem.firstElementChild.click();
                  }

                  // navigate up | down
                  var idx = menuItems.indexOf(activeItem);
                  idx = 
                      key === 38
                          ? idx >= 1 
                              ? idx - 1 
                              : 0 
                          : key === 40 
                              ? idx < menuItems.length - 1 
                                  ? idx + 1 
                                  : menuItems.length - 1
                              : idx;
                  menuItems[idx] && setFocus(menuItems[idx]);
              }
              if (
                  ((menuItems.length && isMenuItem) || // menu has items
                      (!menuItems.length && (isInsideMenu || isSameElement)) || // menu might be a form
                      !isInsideMenu) && // or the focused element is not in the menu at all
                  element.open &&
                  key === 27 // menu must be open
              ) {
                  self.toggle();
                  relatedTarget = null;
                  element.focus();
              }
              if (!isMenuOpen && !isMenuItem && (key === 40|| key === 13 || key === 32)) { //if menu is closed and hit enter or space on arrow btn, open menu and set focus to first item
                  e.preventDefault();
                  self.toggle();
                  menuItems[0] && setFocus(menuItems[0]);
                  relatedTarget = null;
              }
              if (isMenuOpen && (key === 9 || (e.shiftKey && e.keyCode == 9))) { //if menu is open then close menu on tab
                  e.preventDefault();
                  self.toggle();
                  element.focus();
              }
              
          },
          // private methods
          show = function () {
              if (element.classList.contains(prefix + "btn-split-arrow")) {
                  menu.style.minWidth = parent.offsetWidth+"px";
              } else if (element.classList.contains(prefix + "btn")) {
                  menu.style.minWidth = element.offsetWidth +"px";
              }
              uicoreCustomEvent("DropDown", "ShowEvent", element);
              menu.classList.add(prefix + "show");
              parent.classList.add(prefix + "show");
              element.setAttribute("aria-expanded", true);
              uicoreCustomEvent("DropDown", "Shown", element);
              element.open = true;

              setTimeout(function () {
                  toggleDismiss();
              }, 100);
          },
          hide = function () {
              uicoreCustomEvent("DropDown", "HideEvent", element);
              menu.classList.remove(prefix + "show");
              parent.classList.remove(prefix + "show");
              element.setAttribute("aria-expanded", false);
              uicoreCustomEvent("DropDown", "Hidden", element);
              element.open = false;

              setTimeout(function () {
                  toggleDismiss();
                  element.addEventListener("click", clickHandler, false);
              }, 100);
          },
          focusOutHandler = function(e) {
              var target = e.relatedTarget ? e.relatedTarget : e.target ? e.target : DOC.activeElement;
              if(!(e.currentTarget.contains(target))) {
                  if(e.currentTarget.classList.contains(prefix + "btn-dropdown")) {
                      relatedTarget = parent = e.currentTarget;
                  } else {
                      relatedTarget = parent = e.currentTarget.parentNode;
                  }
              } else {
                  return;
              }
              hide();
              preventEmptyAnchor.call(e, relatedTarget);
          },
          windowClickHandler = function(e) {
              if (!parent.contains(e.target) || parent === e.target){
                  hide();
                  preventEmptyAnchor.call(e, relatedTarget);
              }
          };

      // public methods
      this.toggle = function () {
          if (parent.classList.contains(prefix + "show") && element.open) {
              hide();
          } else {
              show();
          }
      };

      this.recountChecked = function() {
          itemsChecked = element.parentElement.querySelectorAll("." + prefix + "form-check-input:checked").length;
          formatDisplayCount();
      };

      // init
      if (!(stringDropdown in element)) {
          // set initial state to closed
          element.open = false;
          // prevent adding event handlers twice
          !("tabIndex" in menu) && menu.setAttribute("tabindex", "0"); // Fix onblur on Chrome | Safari
          element.addEventListener("click", clickHandler, false);
          parent.addEventListener("focusout", focusOutHandler, true);
          element.addEventListener("keydown", keyHandler, false);
          menu.addEventListener("keydown", keyHandler, false);
          if (element.parentElement.classList.contains("dds__multi-select")){
              isMultiSelect = true;
          }

          var dropdownEls = menu.children;
          menuItems = [];
          each (dropdownEls, function(dropdownEl) {
              if (dropdownEl.children.length && dropdownEl.children[0].tagName === "LI" && !dropdownEl.children[0].firstElementChild.classList.contains(prefix + "disabled")) {
                  menuItems.push(dropdownEl.children[0]);
              } 
              else if (dropdownEl.tagName === "LI" && !dropdownEl.firstElementChild.classList.contains(prefix + "disabled")) {
                  menuItems.push(dropdownEl);
              }        
          });
          if (isMultiSelect){
              each (menuItems, function(menuItem) {
                  menuItem.firstElementChild.addEventListener("click", clickHandler, true);
              });
              itemsChecked = 0;
              filters = [];
          }
      }

      element[stringDropdown] = self;
  }

  function Modal(element, options) {
      // element can be the modal/triggering button

      // the modal (both JavaScript / DATA API init) / triggering button element (DATA API)
      element = element instanceof HTMLElement ? element : (function () {
          return false;
      })();

      // set options
      options = options || {};
      options = jsonOptionsInit(element, options);
      options.static = options.backdrop === "static" ? true : false;
      options.target = element.dataset.target ? DOC.getElementById(element.dataset["target"].substr(1)) : 
          options.target ? DOC.getElementById(options.target.substr(1)) : null;
      // determine modal, triggering element
      var self = this,
          stringModal = "Modal",
          focusableEls,
          header,
          origRightPadding,
          scrollbarWidth,
          modalElement = options.target,
          overlayDelay,
          overlay = getFullScreenOverlay(),
          // private methods
          setFocusableElements = function() {
              focusableEls = getFocusableElements(modalElement);
              modalElement.firstFocusableEl = focusableEls[0];
              modalElement.lastFocusableEl = focusableEls[ focusableEls.length - 1 ];

          },
          focusFirstDescendant = function () {
              if (modalElement.loading) {
                  //if loading indicator modal- trap focus so can't tab out
                  modalElement.focus();
              } else {
                  setFocusableElements();
                  if (focusableEls.length > 0)  {
                      //if there is something to focus
                      setFocus(focusableEls[0]);
                  }
              }
          },
          handleKeyDown = function(e) {

              if (!modalElement.loading) {
                  setFocusableElements();

                  var KEY_TAB = 9;
                  var KEY_ESC = 27;

                  // For loading modal which has no focusable elements
                  if(focusableEls.length == 0){
                      e.preventDefault();
                  }

                  switch(e.keyCode) {
                  case KEY_TAB:
                      if ( focusableEls.length === 1 ) {
                          e.preventDefault();
                          break;
                      }
                      if ( e.shiftKey ) {
                          handleBackwardTab(e);
                      } else {
                          handleForwardTab(e);
                      }
                      break;
                  case KEY_ESC: self.hide(); break;
                  }
              }
          },
          handleBackwardTab = function (e) {
              if ( document.activeElement === modalElement.firstFocusableEl ) {
                  e.preventDefault();
                  setFocus(modalElement.lastFocusableEl);
              }
              if (header) focusVisibilityHandler();
          },
          handleForwardTab = function (e) {
              if (header) focusVisibilityHandler();

              if ( document.activeElement === modalElement.lastFocusableEl ) {
                  e.preventDefault();
                  setFocus(modalElement.firstFocusableEl);
              }
          },
          createOverlay = function() {
              if (overlay && !(overlay.classList.contains(prefix + "show"))) {
                  overlayDelay = getTransitionDurationFromElement(overlay);
                  overlay.classList.add(prefix + "show");
                  overlay.removeAttribute("hidden");
                  if( overlay.style.visibility == "hidden"){
                      overlay.style.visibility = "";
                  }
              } else {
                  console.warn("MODAL: Overlay requested. Corresponding HTML missing. Please apply id 'dds__full-screen-overlay' and class 'dds__overlay' to an empty div");
              }
             
              if (!options.static) {
                  window.addEventListener("click", function(e) {
                      if (modalElement.classList.contains(prefix + "show") && e.target != modalElement && !modalElement.contains(e.target)) {
                          self.hide();
                      }
                  }, false);
              }
              DOC.body.style.paddingRight = (scrollbarWidth + origRightPadding) + "px";
              DOC.body.style.overflow = "hidden";
          },
          removeOverlay = function () {
              if (overlay) {
                  overlay.classList.remove(prefix + "show");
                  overlay.setAttribute("hidden","");
              }
              
              if (!options.static) {
                  modalElement.removeEventListener("click", function(e) {
                      if (e.target == modalElement) {
                          self.hide();
                      }
                  }, false);
              }
              if (origRightPadding == 0) {
                  DOC.body.style.paddingRight = "";
              } else {
                  DOC.body.style.paddingRight = origRightPadding + "px";
              }
              DOC.body.style.overflow = "";
              if (DOC.body.style.length == 0) {
                  DOC.body.removeAttribute("style");
              }
              uicoreCustomEvent("Modal", "Hidden", modalElement);
          },
          keydownHandlerToggle = function () {
              if (modalElement.classList.contains(prefix + "show")) {
                  DOC.addEventListener("keydown", keyHandler, false);
              } else {
                  DOC.removeEventListener("keydown", keyHandler, false);
              }
          },
          triggerShow = function () {
              //resizeHandlerToggle();
              keydownHandlerToggle();
              setFocus(modalElement);
              focusFirstDescendant();
              uicoreCustomEvent("Modal", "Shown", modalElement);
          },
          triggerHide = function () {
              setTimeout( function() {
                  modalElement.style.display = "";
              }, getTransitionDurationFromElement(modalElement));
              //check if parent is dropdown, and set focus on appropriate element
              var isInDropdown = getClosest(element, "."+prefix+"btn-dropdown", true);
              var isInSplitBtn = isInDropdown && isInDropdown.classList.contains(prefix+"btn-group");
              element && (isInDropdown ? (isInSplitBtn ? setFocus(isInDropdown.querySelector("."+prefix +"btn-split-arrow")): setFocus(isInDropdown.querySelector("."+prefix+"btn"))) : setFocus(element));
          
              if (modalElement.classList.contains(prefix + "show")) {
                  keydownHandlerToggle();
              }
          },
          // handlers
          clickHandler = function (e) {
              if ((e.target === element || e.target.parentElement === element) && !(modalElement.classList.contains(prefix + "show"))) {
                  self.show();
                  e.preventDefault();
              }
          },
          keyHandler = function (e) {
              if (self.keyboard && e.which == 27 && modalElement.classList.contains(prefix + "show")) {
                  self.hide();
              }
          },
          dismissHandler = function (e) {
              if (modalElement.classList.contains(prefix + "show")) {
                  self.hide();
                  e.preventDefault();
              }
          },
          focusVisibilityHandler = function () {
              // minimum distance from "to be focused" element to the bottom of fixed header
              var minDistance = header.parentElement.clientHeight;
              var activeElementIdx = focusableEls.indexOf(document.activeElement);
              
              // handles shift tab loop, and get next element to receive focus - going back
              var prevFocusableEl = activeElementIdx === 0 ? focusableEls[focusableEls.length -1] : focusableEls[activeElementIdx - 1] ;
              
              // handles tab loop, and get next element to receive focus - going forward 
              var nextFocusableEl = activeElementIdx === (focusableEls.length -1) ? focusableEls[0] : focusableEls[activeElementIdx + 1];
              
              if(event.shiftKey && event.keyCode === 9) {
                  scrollToElement(prevFocusableEl, minDistance, header);
              } else if(!event.shiftKey && event.keyCode === 9) {
                  scrollToElement(nextFocusableEl, minDistance, header);
              }
          },
          scrollToElement = function (element, minDistance, header) {
              if((!header.contains(element)) && // prevents scroll if header will receive focus
              element.getBoundingClientRect().top < minDistance) { // element is behind fixed header
                  
                  // scroll to top of "to be focused" element
                  modalElement.scrollTop = (element.getBoundingClientRect().top - (minDistance*2)) + modalElement.scrollTop;
              }
          };

      // public methods
      this.toggle = function () {
          if (modalElement.classList.contains(prefix + "show")) {
              this.hide();
          } else {
              this.show();
          }
      };
      this.show = function () {
          uicoreCustomEvent("Modal", "ShowEvent", modalElement);

          createOverlay();

          modalElement.style.display = "block";

          if (isSafari && isIOS) {
              modalElement.classList.add(prefix + "is-safari");
          }

          setTimeout( function() {
              modalElement.classList.add(prefix + "show");
          }, 5);
          modalElement.setAttribute("aria-hidden", false);
          modalElement.classList.contains(prefix + "fade")
              ? emulateTransitionEnd(modalElement, triggerShow)
              : triggerShow();

          supportTransitions && modalElement.loading ? overlayDelay : 0;
      };
      this.hide = function () {
          uicoreCustomEvent("Modal", "HideEvent", modalElement);

          modalElement.classList.remove(prefix + "show");
          modalElement.setAttribute("aria-hidden", true);

          if (isSafari && isIOS && modalElement.classList.contains(prefix + "is-safari")) {
              modalElement.classList.remove(prefix + "is-safari");
          }
          
          setTimeout( function() {
              removeOverlay();
          }, getTransitionDurationFromElement(modalElement));
          
          modalElement.classList.contains(prefix + "fade")
              ? emulateTransitionEnd(modalElement, triggerHide)
              : triggerHide();
      };

      //init
      if (!(stringModal in element)) {
          if (!modalElement) {
              return false;
          } else {
              origRightPadding = DOC.body.style.paddingRight ? DOC.body.style.paddingRight.split("px")[0] : 0;
              scrollbarWidth = window.innerWidth - DOC.documentElement.clientWidth;
              modalElement.loading = modalElement.classList.contains(prefix + "loading-modal") ? true : false;
          
              if (!modalElement.loading) {
                  element.addEventListener("click", clickHandler, false);
                  modalElement.addEventListener("keydown", handleKeyDown);
                  each(modalElement.querySelectorAll("[data-dismiss='"+prefix+"modal']"), function(dissmissEl) {
                      dissmissEl.addEventListener("click", dismissHandler, false);
                  });
                  var modalContent = modalElement.querySelector("." + prefix + "modal-content");
                  var potentialHeader = modalContent.firstElementChild;
                  if (potentialHeader.classList.contains(prefix + "container-fluid") && !potentialHeader.classList.contains(prefix + "modal-body")) {
                      potentialHeader.firstElementChild.classList.add(prefix + "offcanvas-modal-topbar");
                  }
                  header = modalElement.querySelector("."+prefix+"offcanvas-modal-topbar");



              }
          }
      }

      element[stringModal] = self;
  }

  function FilterKeyword(element) {
      element = element instanceof HTMLElement ? element : (function () {
          return false;
      })();

      // bind, target alert, duration and stuff
      var self = this,
          stringFilterKeyword = "FilterKeyword",
          addButton,
          filterInput,
          filterCntr,

          // handlers
          handleClickEvent = function (e) {
              if ((e.target == addButton || addButton.contains(e.target)) && filterInput.value.trim() != "") {
                  uicoreCustomEvent("FilterKeyword", "CreateEvent", element, { "filter": filterInput.value } );
                  filterInput.value = "";
                  filterInput.focus();
                  window.removeEventListener("click", clickOutHandler, true);
              }
          },

          handleKeyEvent = debounce(function (e){
              window.addEventListener("click", clickOutHandler, true);
              if (e.keyCode == 13){
                  uicoreCustomEvent("FilterKeyword", "CreateEvent", element, { "filter": filterInput.value } );
                  filterInput.value = "";
                  filterInput.focus();
              }
          }, 50),

          clickOutHandler = function(e)  {
              if (filterCntr.contains(e.target)) {
                  return; 
              }
              filterInput.value = "";
              window.removeEventListener("click", clickOutHandler, true);
          };

      // init
      if (!(stringFilterKeyword in element)) {
          addButton = element.querySelector("." + prefix + "filter-btn");
          filterInput = element.querySelector("." + prefix + "filter-input");
          filterCntr = element.querySelector("." + prefix + "filter-container");

          addButton.addEventListener("click", handleClickEvent, true);
          filterInput.addEventListener("keydown", handleKeyEvent, false);
      }

      element[stringFilterKeyword] = self;

  }

  function FilterCollection(element) {
      element = element instanceof HTMLElement ? element : (function () {
          return false;
      })();

      var horizontal = true;

      // bind, target alert, duration and stuff
      var self = this,
          stringFilterCollection = "FilterCollection",
          filterResults,
          filterOffCanvasResults,
          clearAllItem,
          clearAllOffCanvas,
          resultsLabelDesktop,
          filters = [],
          filtersTemp = [],
          filterOffCanvas,
          keywordFilter,
          visibileIdx,
          mediaIncrementforDropdowns,
          showMoreDiv,
          mobileModal,
          dropdownObjects = [],
          accordionObjects = [],
          digit = "digit",
          collectionInputsContainer,
          dropdowns,
          collectionInputs,
          targetCollection,
          filterCollection,
          isOffCanvasState = false,
          isApplyingState = false,
          smallWindow,
          smallMediaSize = window.matchMedia("(max-width: 767.98px)"),
          mediumMediaSize = window.matchMedia("(max-width: 991.98px)"),

          // handlers 
          handleAddEvent = function (e) {
              if (e.type === "uicDropdownAddEvent" || e.type === "uicFilterKeywordCreateEvent") {
                  if(!isOffCanvasState){
                      createDesktopFilterItem(e.detail.filter, e.detail.filterInput);
                  } else {
                      createOffCanvasFilterItem(e.detail.filter, e.detail.filterInput);
                  }
              } else {
                  var checkbox = e.srcElement;    
                  if (checkbox.tagName != "INPUT") {
                      if (checkbox.tagName === "SPAN" && checkbox.previousElementSibling.tagName === "INPUT") {
                          checkbox = checkbox.previousElementSibling;
                      } else {
                          checkbox = checkbox.querySelector("input");
                      }
                  }
                  createDesktopFilterItem(checkbox.nextElementSibling.innerText, checkbox);
                  if (!horizontal && 
                      (element.getBoundingClientRect().y && element.getBoundingClientRect().y< 0) 
                          || (element.getBoundingClientRect().top && element.getBoundingClientRect().top < 0 )) { //Edge FF use top, not y
                      element.scrollIntoView({behavior: "smooth"});
                  }
              }
          },

          handleClearAllEvent = function (e) {
              if (e.target == clearAllOffCanvas || clearAllOffCanvas.contains(e.target) || e.target === clearAllItem || clearAllItem.contains(e.target)) {
                  toggleClearAllButtons(false);
                  ariaAnnounce(
                      document.querySelector("." + prefix + "filter-btn-clear").innerText // will say "Clear all"
                  );
              } else {
                  ariaAnnounce(
                      getClosest(e.target, "." + prefix + "svg-close-x", false).getAttribute("aria-label") // will say filter-close
                  );
              }
              each(filterResults.querySelectorAll("button."+prefix + "filter-item"), function(filter) {
                  clearFilter(filter);
              });
              resultsLabelDesktop.classList.add(prefix + "d-none");
              if (horizontal) { clearMultiSelects(); }
              updateFiltersCount();
              uicoreCustomEvent("FilterCollection", "RemoveAllEvent", element, { "filters": filtersAsStrings()} );
          },
          
          handleDesktopCheckboxClick = function (e){

              if ( e.type === "uicDropdownAddEvent" || e.type === "uicDropdownRemoveEvent") {
                  if (e.detail.filterInput.checked === true){
                      handleAddEvent(e);
                  }  else {
                      var deselected = filterResults.querySelector("#" + e.detail.filter.replace(/\s/g, "").toLowerCase());
                      clearFilter(deselected);
                      if(filters && filters.length === 0) {
                          toggleClearAllButtons(false);
                          uicoreCustomEvent("FilterCollection", "RemoveAllEvent", element, { "filters": filtersAsStrings()} );
                      }
                  }
              } else if (e.type === "click") {
                  e.preventDefault();
                  var checkbox = e.srcElement;
                  if (checkbox.tagName != "INPUT") {
                      if (checkbox.tagName === "SPAN" && checkbox.previousElementSibling.tagName === "INPUT") {
                          checkbox = checkbox.previousElementSibling;
                      } else {
                          checkbox = checkbox.querySelector("input");
                      }
                  }
                  if (!checkbox.hasAttribute("disabled") && !checkbox.classList.contains(prefix+"disabled")) {
                      setTimeout(function() {
                          if (checkbox.checked) {
                              checkbox.checked = false;
                              getClosest(checkbox, "li", true).setAttribute("aria-checked", "false");
                          } else {
                              checkbox.checked = true;
                              getClosest(checkbox, "li", true).setAttribute("aria-checked", "true");
                          }
                          if (checkbox.checked === true) {
                              handleAddEvent(e); 
                          } else {
                              var value = checkbox.name.toLowerCase();
                              var deselected = filterResults.querySelector("[value=\"" + value + "\"]");
                              clearFilter(deselected);
                              if(filters && filters.length === 0) {
                                  toggleClearAllButtons(false);
                                  uicoreCustomEvent("FilterCollection", "RemoveAllEvent", element, { "filters": filtersAsStrings()} );
                              }
                          }
                      },25);
                  }
              }
          },

          handleFilterItemClickEvent = function (e) {
              var target = e.target.classList.contains("." + prefix + "filter-item") ? e.target : getClosest(e.target, "." + prefix + "filter-item");
              if(filters.length && filters.length === 1) {
                  handleClearAllEvent(e);
                  resultsLabelDesktop.classList.add(prefix + "d-none");
                  accordionObjects[0] ? setFocus(accordionObjects[0]) : setFocus(collectionInputs[0]);
              } else {
                  ariaAnnounce(
                      getClosest(e.target, "." + prefix + "svg-close-x", false).getAttribute("aria-label") // will say filter-close
                  );
                  var nextFocusableEl = target.previousElementSibling && target.previousElementSibling.classList.contains(prefix+"filter-item") ?
                      target.previousElementSibling :
                      target.nextElementSibling && target.nextElementSibling.classList.contains(prefix+"filter-item") ? 
                          target.nextElementSibling :
                          accordionObjects ?
                              accordionObjects[0] :
                              collectionInputs[0];
                  setTimeout(function() {
                      clearFilter(target);
                      uicoreCustomEvent("FilterCollection", "RemoveEvent", element, { "filters": filtersAsStrings(), "removedFilter": target.innerText } );
                      setFocus(nextFocusableEl);
                  }, 50);
              }
          },
          
          handleOffCanvasApplyEvent = function () {
              isApplyingState = true;
              isOffCanvasState = false;
              
              // add label
              if (filtersTemp.length > 1) {
                  resultsLabelDesktop.classList.remove(prefix + "d-none");
              }
              // if temp filter isn't in filters (create)
              each(filtersTemp, function(filterTemp){
                  if (!arrayOfObjectsContains(filters, filterTemp.value.toLowerCase())) {
                      var newFilter = filterTemp.cloneNode(true);
                      newFilter.origin = filterTemp.origin;
                      newFilter.offCanvasOrigin = filterTemp.offCanvasOrigin;
                      newFilter.value = filterTemp.value;
                      newFilter.addEventListener("click", handleFilterItemClickEvent, false);
                      horizontal ? filterResults.insertBefore(newFilter, clearAllItem) : filterResults.appendChild(newFilter);
                      if(newFilter.origin){
                          newFilter.origin.checked = true;
                          getClosest(newFilter.origin, "li", true).setAttribute("aria-checked", "true");
                      }
                  }
              });

              // if filter is no longer in temp filters (delete)
              each(filters.slice(), function(temp) {
                  if (!arrayOfObjectsContains(filtersTemp, temp.value.toLowerCase())) {
                      var filterToRemove = altFind(filters, function(result) {
                          return result.value === temp.value;
                      });
                      clearFilter(filterToRemove);
                  }
              });
              filters = filtersTemp.slice();
              
              // reset
              isApplyingState = false;

              if (filters.length > 0) {
                  resultsLabelDesktop.classList.remove(prefix + "d-none");
                  toggleClearAllButtons(true);
              } else {
                  resultsLabelDesktop.classList.add(prefix + "d-none");
                  toggleClearAllButtons(false);
              }

              // update html filter count values
              updateFiltersCount();
              if (horizontal) {
                  each(dropdownObjects, function(dropdown) {
                      dropdown.recountChecked();
                  });
              } else {
                  updateVerticalDesktopAccordionCount();
              }

              mobileModal.hide();
              uicoreCustomEvent("FilterCollection", "UpdateEvent", element, { "filters": filtersAsStrings()} );
          },

          handleOffCanvasCancelEvent = function(){
              //clear off canvas and reset to filters
              handleOffCanvasClearAllEvent();
              each(filters, function(filter){
                  if (filter.offCanvasOrigin) {
                      filter.offCanvasOrigin.click();
                  } 
                  else {
                      createOffCanvasFilterItem(filter, filter.origin);
                  }
              });
              if (filters.length === 0) {
                  toggleClearAllButtons(false);
              }

              isOffCanvasState = false;
          },

          handleOffCanvasCheckboxClick = function(e){
              var checkboxId = e.target.id.replace("OffCanvas", "");
              var desktopCheckbox = document.getElementById(checkboxId);
              getClosest(e.target, "li", true).setAttribute("aria-checked", e.target.checked);
              if (!e.target.hasAttribute("disabled") && !e.target.classList.contains(prefix+"disabled")) {
                  //create new off canvas filter
                  if(e.target.checked) {
                      createOffCanvasFilterItem(e.target.name, desktopCheckbox);
                      toggleClearAllButtons(true);
                  }
                  // remove off canvas filter
                  else {
                      var checkboxFilter;
                      var value = e.target.name.toLowerCase();
                      checkboxFilter = filterOffCanvasResults.querySelector("[value=\"" + value + "\"]");
                      var currentFilter = altFind(filtersTemp, function(result) {
                          var check = result.innerText.toLowerCase().replace(/\s/g, "") == checkboxFilter.innerText.toLowerCase().replace(/\s/g, "");
                          return check;
                      });
                      // remove from temp array
                      var index = filtersTemp.indexOf(currentFilter);
                      filtersTemp.splice(index, 1);
      
                      if (checkboxFilter) {
                          setTimeout(function() {
                              filterOffCanvasResults.removeChild(checkboxFilter);
                              setTimeout(function() {
                                  //if no more filters turn off Clear All Item
                                  if (self.numOfFilters(true) < 1) {
                                      toggleClearAllButtons(false);
                                  }
                              },10);
                          }, 1);
                      }
                  }
                  updateOffCanvasAccordionCount(e.target); //horizontal multi-selects don't have updated count at this point
              }
          },

          handleOffCanvasClearAllClick = function () {
              var focusableEls = getFocusableElements(filterOffCanvas);
              // after hitting "offcanvas" clear all button set focus on the previous focusable element 
              if(focusableEls.indexOf(clearAllOffCanvas) > 0) {
                  focusableEls[focusableEls.indexOf(clearAllOffCanvas) - 1].focus();
              }
              handleOffCanvasClearAllEvent();
          },

          handleOffCanvasClearAllEvent = function(){
              each(element.querySelectorAll("." + prefix + "modal-offcanvas input." + prefix + "form-check-input"), function(checkbox) {
                  checkbox.checked = false;
                  getClosest(checkbox, "li", true).setAttribute("aria-checked", "false");
                  updateOffCanvasAccordionCount(checkbox);
              });
              each(element.querySelectorAll("." + prefix + "modal-offcanvas button." + prefix + "filter-item"), function(filter) {
                  filterOffCanvasResults.removeChild(filter);
              });
              filtersTemp = [];
              toggleClearAllButtons(false);
          },

          handleOffCanvasFilterItemClickEvent = function(e){
              var target = e.target.classList.contains("." + prefix + "filter-item") ? e.target : getClosest(e.target, "." + prefix + "filter-item"),
                  currentFilter = altFind(filtersTemp, function(result) {
                      return result.value.toLowerCase().replace(/\s+/g, "") === target.innerText.toLowerCase().replace(/\s+/g, "");
                  });
              
              // uncheck the corresponding checkbox
              if (currentFilter.offCanvasOrigin) {
                  currentFilter.offCanvasOrigin.checked = false;
                  getClosest(currentFilter.offCanvasOrigin, "li", true).setAttribute("aria-checked", "false");
                  updateOffCanvasAccordionCount(currentFilter.offCanvasOrigin);
              }

              // remove from temp array
              var index = filtersTemp.indexOf(currentFilter);
              filtersTemp.splice(index, 1);

              //set focus on next element if it exists
              target.nextElementSibling ? 
                  target.nextElementSibling.focus() : 
                  target.previousElementSibling && target.previousElementSibling.classList.contains(prefix + "filter-item") ?
                      target.previousElementSibling.focus() :
                      setFocus(getFocusableElements(filterOffCanvas)[0]);
              // getFocusableElements(filterOffCanvas)[0].focus();
              
              // remove filter button from DOM
              if (filterOffCanvasResults.contains(target)){
                  setTimeout(function() {
                      filterOffCanvasResults.removeChild(target);
                      setTimeout(function() {
                          //if no more filters turn off Clear All Item
                          if (self.numOfFilters(true) < 1) {
                              toggleClearAllButtons(false);
                          }
                      },10);
                  }, 1);
              }
          },
      
          handleOffCanvasOpen = function() {
              isOffCanvasState = true;
              filtersTemp = filters.slice();
          },

          handleResizeSmall = function (e) {
              //change vertical clear all button
              if (!e.matches) {
                  //going from small to big
                  mobileModal.hide();
                  smallWindow = false;
                  if (!horizontal) {
                      if (clearAllItem.classList.contains("dds__d-flex")) {
                          clearAllItem.classList.remove("dds__d-flex");
                          clearAllItem.classList.add("dds__d-none");
                          clearAllItem = element.querySelector("."+prefix+"filter-collector-accordion ."+prefix+"filter-btn-clear");
                          clearAllItem.classList.remove("dds__d-none");
                          clearAllItem.classList.add("dds__d-flex");
                      } else {
                          clearAllItem = element.querySelector("."+prefix+"filter-collector-accordion ."+prefix+"filter-btn-clear");
                      }
                      clearAllItem.addEventListener("click", handleClearAllEvent, false);
                      clearAllItem.addEventListener("touchstart", handleClearAllEvent, false);
                  }
              } else if (e.matches && !horizontal) {
                  smallWindow = true;
                  if (clearAllItem.classList.contains("dds__d-flex")) {
                      clearAllItem.classList.remove("dds__d-flex");
                      clearAllItem.classList.add("dds__d-none");
                      clearAllItem = element.querySelector(".dds__filter-label-results .dds__filter-btn-clear");
                      clearAllItem.classList.remove("dds__d-none");
                      clearAllItem.classList.add("dds__d-flex");
                  } else {
                      clearAllItem = element.querySelector(".dds__filter-label-results .dds__filter-btn-clear");
                  }
                  clearAllItem.addEventListener("click", handleClearAllEvent, false);
                  clearAllItem.addEventListener("touchstart", handleClearAllEvent, false);
              }
              updateFiltersCount();
          },

          handleResizeMedium = function (e) {
              var numOfDropdowns, rows;
              if (e.matches) {
                  mediaIncrementforDropdowns = 3;
                  
                  rows = Math.max(Math.ceil((visibileIdx + 1) / 4), 2);
                  numOfDropdowns = rows * 3 - 2;
                  if (numOfDropdowns < dropdowns.length - 1) {
                      showMoreDiv.classList.remove(prefix + "d-none");
                  }
                  visibileIdx = numOfDropdowns - 1;
                  toggleDropdown(visibileIdx);
              } else {
                  mediaIncrementforDropdowns = 4;
                  if (visibileIdx === dropdowns.length) {
                      return;
                  }
                  rows = Math.max(Math.ceil((visibileIdx + 1) / 3), 2);
                  numOfDropdowns = rows * 4 - 2;
                  if (numOfDropdowns > dropdowns.length - 1) {
                      numOfDropdowns = dropdowns.length;
                      showMoreDiv.classList.add(prefix + "d-none");
                  }
                  visibileIdx = numOfDropdowns - 1;
                  toggleDropdown(visibileIdx);
              }
          },

          handleShowMore = function () {
              visibileIdx = Math.min(visibileIdx + mediaIncrementforDropdowns, dropdowns.length - 1);
              if (visibileIdx === dropdowns.length - 1) {
                  showMoreDiv.classList.add(prefix + "d-none");
              }
              toggleDropdown(visibileIdx);
              setTimeout(function() {
                  setFocus(dropdowns[visibileIdx].querySelector("."+prefix+"btn-secondary"));
              },1);
          },

          arrayOfObjectsContains = function (arr, value) {
              var results = arr.filter(function(obj) {
                  return obj.value === value;
              });
              return results.length > 0;
          },

          clearMultiSelects = function () {
              each(collectionInputs, function(input) {
                  if (input.querySelector("." + prefix + "checked-presentation")) {
                      input.firstElementChild.removeChild(input.querySelector("." + prefix + "checked-presentation"));
                  }

                  var typeofInput = input["getAttribute"]("data-filter");
                  if (typeofInput == prefix + "multi-select") {
                      var ul = input["getAttribute"]("data-target");
                      each(element.querySelector(ul).children, function(option) {
                          option.setAttribute("aria-checked", false);
                          option.querySelector("input").checked = false;
                      });
                  }
              });
          },

          clearFilter = function(filter) {
              if (filter === null || filter === undefined) {
                  return;
              }

              // finder filter, if found no match in the filters, return
              var targetValue = filter.innerText,
                  results = filters.filter(function(obj) {
                      targetValue = targetValue.toLowerCase().replace(/\n/g, "");
                      return obj.value === targetValue;
                  });

              if (results.length < 1) {
                  return;
              }
              
              // if it's a checkbox, uncheck
              var deselectTarget = results[0];            
              if(deselectTarget.origin.tagName === "INPUT" && deselectTarget.origin.checked === true){
                  deselectTarget.origin.checked = false;
                  getClosest(deselectTarget.origin, "li", true).setAttribute("aria-checked", "false");
              }
              if(deselectTarget.offCanvasOrigin && deselectTarget.offCanvasOrigin.tagName === "INPUT" && deselectTarget.offCanvasOrigin.checked === true){
                  deselectTarget.offCanvasOrigin.checked = false;
                  getClosest(deselectTarget.offCanvasOrigin, "li", true).setAttribute("aria-checked", "false");
                  updateOffCanvasAccordionCount(deselectTarget.offCanvasOrigin);
              }
              if (!horizontal) {
                  updateVerticalDesktopAccordionCount(deselectTarget.origin);
              }

              var value = filter.value.toLowerCase();
              var index;

              if (filterResults.contains(filter)) {
                  var filterOffCanvas;        

                  filterResults.removeChild(filter);
                  filterOffCanvas = filterOffCanvasResults.querySelector("[value=\"" + value + "\"]");
                  if (filterOffCanvasResults.contains(filterOffCanvas)) {
                      filterOffCanvasResults.removeChild(filterOffCanvas);
                      
                      //remove from filter temp
                      var offCanvasFilterObj = altFind(filtersTemp, function(result) {
                          return result.value === targetValue.toLowerCase().replace(/\n/g, "");
                      });
                      index = filtersTemp.indexOf(offCanvasFilterObj);
                      filtersTemp.splice(index, 1);
                  }
              }

              //if selecting an offcanvas filter
              else if (filterOffCanvasResults.contains(filter) || filterResults.querySelector("#" +filter.id ) != null){
                  // filterOffCanvasResults.removeChild(filter);
                  var filterDesktop = filterResults.querySelector("#" +filter.id );
                  filterResults.removeChild(filterDesktop);
              }
              
              index = filters.indexOf(results[0]);
              filters.splice(index, 1);
              if (!horizontal && 
                  (element.getBoundingClientRect().y && element.getBoundingClientRect().y< 0) 
                      || (element.getBoundingClientRect().top && element.getBoundingClientRect().top < 0 )) { //Edge FF use top, not y
                  element.scrollIntoView({behavior: "smooth"});
              }
              if (filters.length === 0) {
                  toggleClearAllButtons(false);
              }
              // reset text (count) values in dropdowns
              each(dropdownObjects, function(dropdown) {
                  dropdown.recountChecked();
              });

          },

          createShowMoreButton = function(){
              showMoreDiv = createElement("div", {
                  class: prefix + "col-xs-12 " + prefix + "col-sm-6 " + prefix + "col-md-4 " + prefix + "col-lg-3",
              });
              var showMore = createElement("button", {
                  class: prefix + "filter-btn-show " + prefix + "btn " + prefix + "btn-secondary " + prefix + "d-flex " + prefix + "text-truncate",
                  id: "showMorefilters",
                  html: "Show More Filters"
              });
              showMore.addEventListener("click", handleShowMore, false);
              showMoreDiv.appendChild(showMore);
              collectionInputsContainer.appendChild(showMoreDiv);
          },

          createOffCanvasFilterItem = function (filterItem, origin) {
              if (filterAlreadyExists(filterItem.value ? filterItem.value : filterItem, true)) {
                  return;
              }

              var filterOffCanvasItem;
              var isDigit = false;
              if (origin === null || origin === undefined) {
                  origin = "";
              }
              if (typeof filterItem === "object") {
                  // it's an object so clone it
                  filterOffCanvasItem = filterItem.cloneNode(true);
              } else {
                  // id's can't have a digit as first number
                  if (filterItem[0].match(/\d/)){
                      filterItem = digit.concat(filterItem);
                      isDigit = true;
                  }
                  filterItem = filterItem.replace(/\s+/g," ").trim();
                  // need to create an object
                  filterOffCanvasItem = createFilter(filterItem, true, isDigit);
              }           
              if (!isApplyingState) {
                  filterOffCanvasItem.addEventListener("click", handleOffCanvasFilterItemClickEvent, false);
                  filterOffCanvasResults.appendChild(filterOffCanvasItem); // DOM Add New Filter to OffCanvas
              }
              var filterValue = filterItem.value ? filterItem.value : filterItem.replace(/^digit/, "") ;
              if (isOffCanvasState){
                  var offCanvasOriginId = origin.id + "OffCanvas";
                  var offCanvasOrigin = document.getElementById(offCanvasOriginId);
                  filterOffCanvasItem.value = origin.name ? origin.name.toLowerCase() : filterValue.toLowerCase();
                  filterOffCanvasItem.origin = origin;
                  filterOffCanvasItem.offCanvasOrigin = offCanvasOrigin;
                  filtersTemp.push(filterOffCanvasItem);
              }

              if (clearAllOffCanvas.classList.contains(prefix + "d-none")) {
                  toggleClearAllButtons(true);
              }

          },

          createDesktopFilterItem = function (filter, origin) {
              var isDigit = false;
              if (origin === null || origin === undefined) {
                  origin = "";
              }
              // id's can't have a digit as first number
              if (filter[0].match(/\d/)){
                  filter = digit.concat(filter);
                  isDigit = true;
              }
              filter = filter.replace(/\s+/g," ").trim();
   
              if (filterAlreadyExists(filter, false)) {
                  return;
              }

              if (filters.length <= 0) {
                  resultsLabelDesktop.classList.remove(prefix + "d-none");
              }
      
              if (clearAllItem.classList.contains(prefix + "d-none")) {
                  toggleClearAllButtons(true);
              }
              
              var filterItem = createFilter(filter, true, isDigit);
              var offCanvasOriginId = origin.id + "OffCanvas";
              var offCanvasOrigin = document.getElementById(offCanvasOriginId);

              filterItem.origin = origin;
              filterItem.offCanvasOrigin = offCanvasOrigin,
              filterItem.value = origin.name ? origin.name.toLowerCase() : filter.replace(/^digit/, "").toLowerCase();
              filterItem.addEventListener("click", handleFilterItemClickEvent, false);

              if(!isOffCanvasState){
                  filters.push(filterItem);
                  if (offCanvasOrigin) {
                      offCanvasOrigin.checked = true; // Keep offCanvas checkbox in sync
                      getClosest(offCanvasOrigin, "li", true).setAttribute("aria-checked", "true");
                      updateOffCanvasAccordionCount(offCanvasOrigin);
                  }
                  if (horizontal) {
                      filterResults.insertBefore(filterItem, clearAllItem);
                  } else {
                      filterResults.appendChild(filterItem); // DOM Add new filter to Desktop
                      updateVerticalDesktopAccordionCount(origin);
                  }
                  if (!isApplyingState){
                      createOffCanvasFilterItem(filterItem, filterItem.origin);
                  }
                  updateFiltersCount();
                  uicoreCustomEvent("FilterCollection", "CreateEvent", filterItem, { "filters": filtersAsStrings(), "addedFilter": filterItem.innerText } );
              }
          },

          // creates the HTML filterItem button
          createFilter = function (filter, useX, isDigit) {
              var filterText = filter;
              if(isDigit){
                  filterText = filter.replace(/^digit/, "");
              }
              var filterId = filter.replace(/([^A-Za-z0-9._:/-])/g,""); // =need to delete instances of special characters
              var filterItem = createElement("button", {
                  class: prefix + "filter-item " + prefix + "btn " + prefix +"btn-secondary " + prefix + "btn-sm " + prefix + "text-truncate",
                  id: filterId.toLowerCase().replace(/\s/g, "").trim()
              });

              var filterLabel = createElement("label", {
                  html: filterText,
                  class: prefix + "text-truncate"
              });

              filterItem.appendChild(filterLabel);

              // create filterItem SVG
              if(useX) {
                  var filterIcon = renderSvg([{name:"close-x", show:true}]);
                  classAdd(filterIcon, prefix + "svg-close-x");
                  classAdd(filterIcon, prefix + "align-self-center");
                  classAdd(filterIcon, prefix + "m1-1");
                  filterIcon.setAttribute("tabindex", "-1");
                  filterIcon.setAttribute("focusable", "false");
                  filterIcon.setAttribute("aria-label", "filter-close");
          
                  // put everything together
                  filterItem.appendChild(filterIcon);
              } 
              return filterItem;            
          },
                  
          filterAlreadyExists = function(filter, isOffCanvasFilter) {
              var whichFilters = isOffCanvasFilter ? filtersTemp : filters;
              var whichParent = isOffCanvasFilter ? filterOffCanvas : element;
              
              if (filter === null || filter === undefined || filter == "") {
                  console.warn("Not a valid filter tag");
                  return true;
              }
              if(arrayOfObjectsContains(whichFilters, filter.toLowerCase())){
                  
                  each(whichParent.querySelectorAll(".dds__filter-item"), function(htmlFilter) {
                      if (htmlFilter.value.toLowerCase() == filter.toLowerCase()){
                          htmlFilter.classList.add(prefix + "shakey");
                          
                          setTimeout(function(){
                              htmlFilter.classList.remove(prefix + "shakey");
                          }, getAnimationDurationFromElement(htmlFilter));
                      }
                  });
                  console.warn("This filter has already been added");
                  return true;
              }

              return false;
          },

          updateOffCanvasAccordionCount = function(origin){
              var accordionParent = getClosest(origin, "." + prefix + "collapse").id;
              var accordionBtn = element.querySelector("[data-target='#"+accordionParent+"']");//[data-target='#" + activeCollapse.id + "']"
              var accordionBody = getClosest(origin, "." + prefix + "accordion-card-body");
              var itemsChecked = accordionBody.querySelectorAll("." + prefix + "form-check-input:checked").length;

              var displayTxt;
              if (itemsChecked > 0) {
                  displayTxt = "(" + itemsChecked +")";
              } else {
                  displayTxt = " ";
              }

              var checkedCounter = accordionBtn.querySelector("." + prefix + "checked-presentation");
              if (checkedCounter != null) {
                  checkedCounter.innerHTML = displayTxt;
                  // currentText = displayTxt;
              } else {
                  checkedCounter = createElement("span", {
                      class: prefix + "checked-presentation " + prefix + "ml-1",
                      html: displayTxt
                  });
                  accordionBtn.appendChild(checkedCounter);
              }
          },

          updateVerticalDesktopAccordionCount = function(origin) {
              if (origin) {
                  var accordionParent = getClosest(origin, "." + prefix + "collapse").id;
                  var accordionBtn = element.querySelector("[data-target='#"+accordionParent+"']");//[data-target='#" + activeCollapse.id + "']"
                  var accordionBody = getClosest(origin, "." + prefix + "secondary-accordion");
                  var itemsChecked = accordionBody.querySelectorAll("." + prefix + "form-check-input:checked").length;
                  
                  var displayTxt;
                  if (itemsChecked > 0) {
                      displayTxt = "(" + itemsChecked +")";
                  } else {
                      displayTxt = " ";
                  }
      
                  var checkedCounter = accordionBtn.querySelector("." + prefix + "checked-presentation");
                  if (checkedCounter != null) {
                      checkedCounter.innerHTML = displayTxt;
                  } else {
                      checkedCounter = createElement("span", {
                          class: prefix + "checked-presentation " + prefix + "ml-1 " + prefix + "font-weight-bold",
                          html: displayTxt
                      });
                      accordionBtn.insertBefore(checkedCounter, accordionBtn.querySelector("." + prefix + "arrow-tri-solid-right"));
                  }
              } else {
                  accordionObjects.forEach(function(accordion) {
                      var itemsChecked = accordion.parentNode.querySelectorAll("." + prefix + "form-check-input:checked").length;
                      
                      var displayTxt;
                      if (itemsChecked > 0) {
                          displayTxt = "(" + itemsChecked +")";
                      } else {
                          displayTxt = " ";
                      }

                      var checkedCounter = accordion.querySelector("." + prefix + "checked-presentation");
                      if (checkedCounter != null) {
                          checkedCounter.innerHTML = displayTxt;
                      } else {
                          checkedCounter = createElement("span", {
                              class: prefix + "checked-presentation " + prefix + "ml-1",
                              html: displayTxt
                          });
                          accordion.querySelector("span").appendChild(checkedCounter);
                      }
                  });
              }
          },

          updateFiltersCount = function() {
              var itemsChecked = filters.length;
              var filteringMobileBtn = element.querySelectorAll("." + prefix + "filter-btn-mobile")[0];

              var displayTxt;
              if (itemsChecked > 0) {
                  displayTxt = "(" + itemsChecked +")";
              } else {
                  displayTxt = " ";
              }
              var checkedCounter = filteringMobileBtn.querySelector("." + prefix + "checked-presentation");
              if (checkedCounter != null) {
                  checkedCounter.innerHTML = displayTxt;
              } else {
                  checkedCounter = createElement("span", {
                      class: prefix + "checked-presentation " + prefix + "ml-1",
                      html: displayTxt
                  });
                  filteringMobileBtn.appendChild(checkedCounter);
              }
          },

          filtersAsStrings = function() {
              var stringArray = [];
              each(filters, function(filter) {
                  stringArray.push(filter.value);
              });
              return stringArray;
          },

          toggleClearAllButtons = function (onState) {
              if (smallWindow && !horizontal) {
                  clearAllItem = element.querySelector("."+prefix+"filter-label-results ."+prefix+"filter-btn-clear");
              }
              if (onState == true && clearAllItem.classList.contains(prefix + "d-none")) {
                  clearAllOffCanvas.classList.remove(prefix + "d-none");
                  clearAllItem.classList.add(prefix + "d-flex");
                  clearAllItem.classList.remove(prefix + "d-none");
                  clearAllItem.addEventListener("click", handleClearAllEvent, false);
                  clearAllItem.addEventListener("touchstart", handleClearAllEvent, false);
              } else if (onState == false & !clearAllItem.classList.contains(prefix + "d-none")) {
                  clearAllOffCanvas.classList.add(prefix + "d-none");
                  clearAllItem.classList.remove(prefix + "d-flex");
                  clearAllItem.classList.add(prefix + "d-none");
                  clearAllItem.removeEventListener("click", handleClearAllEvent, false);
                  clearAllItem.removeEventListener("touchstart", handleClearAllEvent, false);
              }
          },

          toggleDropdown = function (index) {
              var i;
              if (dropdowns[index].classList.contains(prefix + "d-none")) {
                  for (i = 0; i <= index; i++) {
                      dropdowns[i].classList.remove(prefix + "d-none");
                  }
              }
              else {
                  for (i = index + 1; i < dropdowns.length; i++) {
                      dropdowns[i].classList.add(prefix + "d-none");
                  }
              }
          };

      this.numOfFilters = function(OffCanvas) {
          if (OffCanvas) {
              return filterOffCanvasResults.querySelectorAll("." + prefix + "filter-item").length;
          }
      };
      
      this.updateResultsLabel = function(resultCount) {
          if (!resultCount || typeof resultCount !== "string" ) {
              console.warn("This is not a valid input for updateResultsLabel.");
              return;
          }
          element.querySelector("." + prefix + "resultCount").innerText = resultCount;
      };

      // init
      if (!(stringFilterCollection in element)) {
          if (element.classList.contains(prefix + "filter-collection-vertical")) {
              horizontal = false;
          }
          if (horizontal) {
              clearAllItem = element.querySelector("."+prefix+"filter-collection-wrapper ."+prefix+"filter-btn-clear");
          } else if (smallMediaSize.matches) {
              clearAllItem = element.querySelector("."+prefix+"filter-label-results ."+prefix+"filter-btn-clear");
          } else {
              clearAllItem = element.querySelector("."+prefix+"filter-collector-accordion ."+prefix+"filter-btn-clear");
          }
      
          collectionInputsContainer = element.querySelector("." + prefix + "filter-input-container");
          dropdowns = collectionInputsContainer.querySelectorAll("div." + prefix + "btn-dropdown");
          collectionInputs = element.querySelectorAll("[data-filter]");
          targetCollection = element["getAttribute"]("data-target");
          filterCollection = element.querySelector(targetCollection);

          if (filterCollection == null) {
              console.error("Found no filter collection to output results to.");
              return false;
          }
          if (collectionInputs == null) {
              console.error("Found no data-filter element(s) available to use");
              return false;
          }

          //off canvas inits
          if (element.querySelector("." + prefix + "filter-btn-mobile")) {
              var modalBtn = element.querySelector("." + prefix + "filter-btn-mobile");
              mobileModal = new Modal(modalBtn);
              modalBtn.addEventListener("click", handleOffCanvasOpen);
              filterOffCanvas = element.querySelector("." + prefix + "modal-offcanvas");

              if (element.querySelectorAll("[data-toggle='" + prefix + "collapse" + "']")) {
                  each(element.querySelectorAll("[data-toggle='" + prefix + "collapse" + "']"), function(accordion) {
                      new Collapse(accordion);
                  });
              }
              if (filterOffCanvas.querySelector("." + prefix + "text-right ." + prefix + "btn-primary")) {
                  var applyBtn = filterOffCanvas.querySelector("." + prefix + "text-right ." + prefix + "btn-primary");
                  applyBtn.addEventListener("click", handleOffCanvasApplyEvent);
              }
              if (filterOffCanvas.querySelector("." + prefix + "text-right ." + prefix + "dds__btn-secondary-primary")) {
                  var clearAllBtn = filterOffCanvas.querySelector("." + prefix + "text-right ." + prefix + "dds__btn-secondary");
                  clearAllBtn.addEventListener("click", handleClearAllEvent);
              }
              if (filterOffCanvas.querySelector("." + prefix + "text-right ." + prefix + "btn-secondary")) {
                  clearAllOffCanvas = filterOffCanvas.querySelector("." + prefix + "text-right ." + prefix + "btn-secondary");
                  clearAllOffCanvas.addEventListener("click", handleOffCanvasClearAllClick, false);
              }
              if (filterOffCanvas.querySelector("[data-dismiss]")) {
                  var backOffCanvas = filterOffCanvas.querySelector("[data-dismiss]");
                  backOffCanvas.addEventListener("click", handleOffCanvasCancelEvent, false);
              }
              each(filterOffCanvas.querySelectorAll("." + prefix + "form-check-input"), function(checkbox){
                  checkbox.addEventListener("click", handleOffCanvasCheckboxClick, false);
              });
          }
          if (horizontal) {
              if (!mediumMediaSize.matches) {
                  if (collectionInputs.length > 8){
                      visibileIdx = 5;
                      mediaIncrementforDropdowns = 4;
                      for (var i = visibileIdx + 1; i < dropdowns.length; i++ ) {
                          dropdowns[i].classList.add(prefix + "d-none");
                      }
                      createShowMoreButton();
                  }
              }
              else if (mediumMediaSize.matches) {
                  if (collectionInputs.length > 6) {
                      visibileIdx = 3;
                      mediaIncrementforDropdowns = 3;
                      for (i = visibileIdx + 1; i < dropdowns.length; i++ ) {
                          dropdowns[i].classList.add(prefix + "d-none");
                      }
                      createShowMoreButton();
                  }
              }
          }

          each(collectionInputs, function(input) {
              var typeofInput = input["getAttribute"]("data-filter");
              if (typeofInput == prefix + "keyword-filter") {
                  keywordFilter = input;
                  new FilterKeyword(keywordFilter);
                  keywordFilter.addEventListener("uicFilterKeywordCreateEvent", handleAddEvent, false);
              }
              else if (typeofInput == prefix + "multi-select") {
                  var multiSelect = input;
                  dropdownObjects.push(new Dropdown(input));
                  multiSelect.addEventListener("uicDropdownAddEvent", handleDesktopCheckboxClick, false);
                  multiSelect.addEventListener("uicDropdownRemoveEvent", handleDesktopCheckboxClick, false);
              } else if (typeofInput == prefix + "secondary-accordion") {
                  accordionObjects.push(input);
                  var checkboxes = input.parentNode.querySelectorAll("." + prefix + "form-check");
                  each(checkboxes, function(checkbox) {
                      checkbox.addEventListener("click", handleDesktopCheckboxClick, true);
                  });
              }
          });
          
          filterResults = filterCollection.querySelector("div." + prefix + "filter-results");
          filterOffCanvasResults = element.querySelector("div." + prefix + "modal-offcanvas div." + prefix + "filter-results");
          resultsLabelDesktop = element.querySelector("label." + prefix + "filter-label-results");

          if (horizontal) { mediumMediaSize.addListener(handleResizeMedium);}
          smallMediaSize.addListener(handleResizeSmall);
          
      }

      element[stringFilterCollection] = self;
  }

  function Forms(element, options) {
      element = element instanceof HTMLElement ? element : (function() {
          return false;
      })();

      
      options = options || {};
      options = jsonOptionsInit(element, options);
      options.validate = element.dataset.validate ? element.dataset.validate  === "true" ? true: false : options.validate ? options.validate : true;

      var self = this,
          stringForm = "Form",
          togglePassword = function (e) {
              var passwordState = DOC.getElementById(e.target.dataset["target"]);
              if (passwordState) {
                  if (passwordState.type === "password") {
                      passwordState.type = "text";
                  } else {
                      passwordState.type = "password";
                  }
              } else {
                  console.warn("The target password field does not exist.");
              }
          },
          submitHandler = function(event) {
              var formValidationErrorSuffix = "Feedback";
              if (element.checkValidity() === false) {
                  each(element, function(el) {
                      if(el.tagName == "INPUT"){
                          var errorMsg = element.querySelector("#"+ el.getAttribute("id")+formValidationErrorSuffix);
                          setTimeout(function(){
                              if (!el.validity.valid) {
                                  //if error message has not been turned on yet
                                  if(errorMsg && !(getComputedStyle(errorMsg)["display"] == "block")){
                                      errorMsg.style.display = "block";
                                  }
                                  el.setAttribute("aria-invalid", "true");
                                  el.setAttribute(
                                      "aria-describedby",
                                      el.getAttribute("id") + formValidationErrorSuffix
                                  );
                              } else {
                                  //if error message has not been turned off yet
                                  if(errorMsg && (getComputedStyle(errorMsg)["display"] == "block")){
                                      errorMsg.style.display = "none";
                                  } 
                                  el.setAttribute("aria-invalid", "false");
                                  el.setAttribute("aria-describedby", "");
                              }
                          }, 10);
                      }
                  });
                  event.preventDefault();
                  event.stopPropagation();
              }

              element.classList.add("dds__was-validated");
          };
      
      //init
      if (!(stringForm in element)) {
          if (element.querySelectorAll("input")) {
              each(element.querySelectorAll("input"), function(child) {
                  if (child.classList.contains(prefix + "input-masked")) {
                      new InputMask(child);
                  }
              });
          }
          if  (!element.hasAttribute("novalidate")) {
              element.setAttribute("novalidate", "");
          } 
          if (options.validate) {
              element.addEventListener("submit", submitHandler);
          }

          var checkboxValidators = getElementsByClassName(element, prefix + "form-check-input");
          each(checkboxValidators, function(checkboxValidator) {
              if (checkboxValidator && !!checkboxValidator.dataset["target"]) {
                  checkboxValidator.addEventListener("click", togglePassword);
              }
          });
      }
      element[stringForm] = self;
  }

  function LinkPicker(element) {
      // initialization element
      element = element instanceof HTMLElement ? element : (function() {
          return false;
      })();

      // constants, event targets, strings
      var self = this,
          stringLinkPicker = "LinkPicker",
          interestName = "Interest",
          touseName = "ToUse",
          interest = element.querySelector("select[name=\""+stringLinkPicker+"_"+interestName+"\"]"),
          touse = element.querySelector("select[name=\""+stringLinkPicker+"_"+touseName+"\"]"),
          interestData = JSON.parse(interest.getAttribute("data-select")),
          touseData = JSON.parse(touse.getAttribute("data-select")),
          findName = "Find",
          find = element.querySelector("button[name=\""+stringLinkPicker+"_"+findName+"\"]"),
          // handlers
          onChangeHandler = function(e) {
              var eventTarget = e["target"];
              if(eventTarget === interest) {
                  if(interest.selectedIndex === 0) {
                      touse.disabled = true;
                      touse.classList.add("dds__disabled"); //disabled attribute doesn't work on FF
                  } else {
                      touse.disabled = false;
                      touse.classList.remove("dds__disabled");
                  }
                  var obj = touseData[ touseName ][ interest.value ];
                  removeAllOptions(touse, true);
                  appendDataToSelect(touse, obj);
                  find.classList.add("dds__disabled");
              } else {
                  if(touse.selectedIndex === 0)
                  {
                      find.disabled = true;
                      find.classList.add("dds__disabled");
                  }
                  else {
                      find.disabled = false;
                      find.classList.remove("dds__disabled");
                  }
              }
          },
          clickHandler = function() {
              var link = touse.options[touse.selectedIndex].value;
              find["setAttribute"]("href",link);
              find.click();
          },
          removeAllOptions = function(sel, removeGrp) {
              var len, groups, par;
              if (removeGrp) {
                  groups = sel.getElementsByTagName("optgroup");
                  len = groups.length;
                  for (var i=len; i; i--) {
                      sel.removeChild( groups[i-1] );
                  }
              }

              len = sel.options.length;
              for (i=len; i; i--) {
                  par = sel.options[i-1].parentNode;
                  par.removeChild( sel.options[i-1] );
              }
          },
          appendDataToSelect = function(sel, obj) {
              var f = document.createDocumentFragment();
              var labels = [], group, opts;

              function addOptions(obj) {
                  var f = document.createDocumentFragment();
                  var o;

                  for (var i=0, len=obj.text.length; i<len; i++) {
                      o = createElement("option");
                      o.appendChild( document.createTextNode( obj.text[i] ) );

                      if ( obj.value ) {
                          o.value = obj.value[i];
                      }

                      f.appendChild(o);
                  }
                  return f;
              }

              if ( obj.text ) {
                  opts = addOptions(obj);
                  f.appendChild(opts);
              } else {
                  for ( var prop in obj ) {
                      if ( Object.prototype.hasOwnProperty.call(obj, prop) ) {
                          labels.push(prop);
                      }
                  }
                  
                  each (labels, function(label) {
                      group = createElement("optgroup", {
                          label: label
                      });
                      f.appendChild(group);
                      opts = addOptions(obj[ label ] );
                      group.appendChild(opts);
                  });
              }
              sel.appendChild(f);
          };


      // init
      if (!(stringLinkPicker in element)) {
          appendDataToSelect(interest, interestData);
          interest.selectedIndex = 0;
          interest.addEventListener("change", onChangeHandler, false);
          touse.addEventListener("change", onChangeHandler, false);
          find.addEventListener("click", clickHandler, false);
          var data = touseData[ touseName ][ interest.value ];
          appendDataToSelect(touse, data);
      }

      element[stringLinkPicker] = self;
  }

  function Masthead(element) {
      // initialization element
      element = element instanceof HTMLElement ? element : (function() {
          return false;
      })();

      var self = this,
          stringMasthead = "Masthead",
          bottomMenu = element.querySelector("." + prefix + "msthd-bottom"),
          mouseHover = ["mouseenter", "mouseleave"],
          activeContainerId,
          offCanvasMenuBtn,
          fullScreenOverlay,
          overlay,
          signInText = element.querySelector("[data-target=msthd-signin-ctnr] ."+prefix+"msthd-label") ? element.querySelector("[data-target=msthd-signin-ctnr] ."+prefix+"msthd-label").innerHTML : "Sign In",
          mediaSize = window.matchMedia("(max-width: 991.98px)"),
          // validate with Search Story
          // searchClass = "." + prefix + "msthd-search",
          // searchCtnrClass = "." + prefix + "msthd-search-ctnr",
          // search = element.querySelector(searchClass),
          // searchCtnr = element.querySelector(searchCtnrClass),
          // searchIconCtnr = element.querySelector("div[data-toggle='dds__msthd-search']"),
          ////////////////////////////
          // handlers
          handleMenuItemEvent = function(e) {
              e.preventDefault();
              var target = e.target.tagName === "LI" ? e.target : getClosest(e.target, "LI", false);
              // openOverLay();
              updateMenuHeights(target);
              e.stopPropagation();
          },
          handleMenuCntrEvent = function(e) {
              e.preventDefault();
              var currentMenu =  e.target.tagName === "UL" ? e.target : getClosest(e.target, "UL", false);
              updateMenuHeights(currentMenu);
              e.stopPropagation();
          },
          handleMenuCtnrBlurEvent = function(e) {
              var target = e.currentTarget;
              var relatedTarget = e.relatedTarget ? e.relatedTarget : DOC.activeElement;
              if (!e.currentTarget.contains(relatedTarget)) {
                  closeMenu(target);
                  if (!relatedTarget.classList.contains(prefix + "msthd-menu-link") && !relatedTarget.classList.contains(prefix + "msthd-menu-top-link")) {
                      closeOverLay();
                  }
              }
          },
          handleMenuHoverInEvent = function(e) {
              e.preventDefault();
              openOverLay();
              e.stopPropagation();
          },
          handleMenuHoverOutEvent = function(e) {
              e.preventDefault();
              closeOverLay();
              e.stopPropagation();
          },
          handleMenuItemKeyEvent = function(e) {
              var anchor = e.target ? e.target : DOC.activeElement,
                  item = anchor.parentNode,
                  menu = item.querySelector("ul") ? item.querySelector("ul") : undefined,
                  isTop = item.classList.contains(prefix + "msthd-menu-top-item"),
                  nextItem;
              switch (e.keyCode) {
              case 37: // left key
                  e.preventDefault();
                  if (isTop) {
                      if (item.previousElementSibling && (nextItem = item.previousElementSibling.querySelector("a"))) {
                          nextItem.focus();
                      }
                  }
                  else if (item.classList.contains(prefix + "msthd-menu-item-img") && item.previousElementSibling) {
                      item.previousElementSibling.querySelector("a").focus();
                  } else {
                      previousItem = closeMenu(item);
                      
                      if (previousItem.classList.contains(prefix + "msthd-menu-top-item")) {
                          closeOverLay();
                          if(previousItem.previousElementSibling) {
                              previousItem.previousElementSibling.querySelector("a").focus();
                          }
                          else {
                              previousItem.querySelector("a").focus();
                          } 
                      }
                      else {
                          previousItem.querySelector("a").focus();
                          updateMenuHeights(previousItem);
                      }
                  }
                  break;
              case 38: // up key
                  e.preventDefault();
                  if (!isTop) {
                      if (item.previousElementSibling && (nextItem = item.previousElementSibling.querySelector("a"))) {
                          nextItem.focus();
                      } else {
                          item.parentNode.lastElementChild.querySelector("a").focus();
                      }
                  } 
                  break;
              case 39: // right key
                  e.preventDefault();
                  if (isTop) {
                      if (item.nextElementSibling && (nextItem = item.nextElementSibling.querySelector("a"))) {
                          nextItem.focus();
                      }
                  } else {
                      if (anchor.querySelector("svg")) {
                          openMenu([item, menu, anchor]);
                          if (!isTop) {
                              updateMenuHeights(item);
                          }
                          menu.querySelector("a").focus();
                      } else if (item.classList.contains(prefix + "msthd-menu-item-img") && item.nextElementSibling) {
                          item.nextElementSibling.querySelector("a").focus();
                      } else {
                          do {
                              previousItem = closeMenu(item);
                              item = previousItem;
                          } while(!item.classList.contains(prefix + "msthd-menu-top-item"));
                          closeOverLay();
                          if(item.nextElementSibling) {
                              item.nextElementSibling.querySelector("a").focus();
                          } else {
                              item.querySelector("a").focus();
                          }
                      }
                  }
                  break;
              case 40: // down key
                  e.preventDefault();
                  if (isTop) {
                      if(!menu){
                          item.focus();
                      } else {
                          openMenu([item, menu, anchor]);
                          menu.querySelector("a").focus();
                          openOverLay();
                      }
                  } else {
                      if (item.nextElementSibling && (nextItem = item.nextElementSibling.querySelector("a"))) {
                          nextItem.focus();
                      } else {
                          item.parentNode.firstElementChild.querySelector("a").focus();
                      }
                  }
                  break;
              case 27: // escape key
                  if (!item.classList.contains(prefix + "msthd-menu-top-item")) {
                      do {
                          var previousItem = closeMenu(item);
                          item = previousItem;
                      } while(!item.classList.contains(prefix + "msthd-menu-top-item"));
                      item.querySelector("a").focus();
                  }
                  closeOverLay();
                  break;
              case 13:
              case 32: // enter and spacebar keys
                  e.preventDefault();
                  if (menu) {
                      if (item.hasAttribute("active")) {
                          closeMenu(item);
                          updateMenuHeights(menu);
                      } else {
                          openMenu([item, menu, anchor]);
                          openOverLay();
                          if (!isTop) {
                              updateMenuHeights(item);
                          }
                      }
                      menu.querySelector("a").focus();
                  }
                  break;
              case 9: //TAB
                  if (e.shiftKey) {
                      closeOverLay();
                  }
                  break;
              }
          },
          handleIconClickEvent = function(e) {
              var button = e.target.tagName === "BUTTON" || e.target.tagName === "A"? e.target : e.target.parentNode,
                  target = button.dataset.target,
                  container = DOC.getElementById(target),
                  origContainerId;

              if (activeContainerId) {
                  origContainerId = activeContainerId;
                  var activeContainer = DOC.getElementById(activeContainerId);
                  var activeButton = getClosest(activeContainer, "BUTTON", false);
                  closeContainer(activeButton, activeContainer);
              }
              if (origContainerId != target) {
                  openContainer(target, button, container);
              }
          },
          handleWindowClickEvent = function(e) {
              if (activeContainerId) {
                  var container = DOC.getElementById(activeContainerId),
                      button = getClosest(container, "button", false);
                  if (!container.contains(e.target) && !button.contains(e.target)) {
                      closeContainer(button, container);
                  }
              }
          },
          handleFocusOutEvent = function(e) {
              var target = e.relatedTarget ? e.relatedTarget : e.target;
              if (activeContainerId) {
                  var container = DOC.getElementById(activeContainerId),
                      button = getClosest(container, "button", false);
                  if (target === button) {
                      return;
                  } else if (!container.contains(target)) { 
                      closeContainer(button, container);
                  } else {
                      window.addEventListener("click", handleWindowClickEvent, false);
                  }
              }
          },
          handleKeyDownEvent = function(e) {
              if(activeContainerId) {
                  var container = DOC.getElementById(activeContainerId);
                  var button = getClosest(container, "button", false);

                  switch (e.keyCode) {
                  case 9: //TAB
                      if (e.shiftKey) {
                          if (e.target === container.querySelectorAll("a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex='0']")[0]) {
                              closeContainer(button, container);
                              break;
                          } 
                      } 
                      setTimeout(function() {
                          if (!container.contains(document.activeElement)) {
                              closeContainer(button, container);
                          }
                      },200);
                      break;
                  case 27: //ESC
                      closeContainer(button, container);
                      button.focus();
                      break;
                  case 37:
                  case 38:
                  case 39:
                  case 40:
                      e.preventDefault();
                      break;
                  }
              }
          },
          openOverLay = function() {
              if (overlay) {
                  if (!overlay.classList.contains(prefix + "show")) {
                      overlay.classList.add(prefix + "show");
                  }
              } else {
                  console.error("Please put the overlay in place!");
              }
          },
          closeOverLay = function() {
              if (overlay) {
                  if (overlay.classList.contains(prefix + "show")) {
                      overlay.classList.remove(prefix + "show");
                  }
              } else {
                  console.error("Please put the overlay in place!");
              }
          },
          closeMenu = function(item){
              var previousMenu = item.tagName === "LI" ? item.parentNode : item,
                  previousItem = previousMenu.parentNode,
                  previousLink = previousItem.querySelector("a");

              if (previousMenu.hasAttribute("style")) {
                  previousMenu.removeAttribute("style");
              }

              previousItem.removeAttribute("active");
              previousMenu.removeAttribute("active");
              previousLink.removeAttribute("active");
              previousLink.setAttribute("aria-expanded","false");

              return previousItem;
          },
          openMenu = function(items) {
              each(items, function(item) {
                  item.setAttribute("active","");
                  if(item.tagName === "A") item.setAttribute("aria-expanded","true");
              });
              
          },
          updateMenuHeights = function(target) {
              var currentMenu, 
                  nextMenu, 
                  previousMenu, 
                  prePreviousMenu,
                  heights = [],
                  max;

              // do not do logic on a list item image
              if (!target.classList.contains(prefix + "msthd-menu-item-img")) {
                  // if a list item is passed
                  if (target.tagName === "LI") {
                      currentMenu = target.parentNode;
                      nextMenu = target.querySelector("ul") ? target.querySelector("ul") : undefined;
                  // if a unordered list is passed
                  } else {
                      currentMenu = target;
                  }         

                  previousMenu = currentMenu.parentNode.parentNode.classList.contains(prefix + "msthd-menu-top") ? undefined : currentMenu.parentNode.parentNode;
                  prePreviousMenu = previousMenu ? previousMenu.parentNode.parentNode.classList.contains(prefix + "msthd-menu-top") ? undefined : previousMenu.parentNode.parentNode : undefined;

                  if (!previousMenu) {
                      if (currentMenu.hasAttribute("style")) {
                          currentMenu.removeAttribute("style");
                      }
                  }

                  if (!nextMenu || !nextMenu.classList.contains(prefix + "msthd-menu-tier-img")) {
                      // resst any height style
                      if (currentMenu.hasAttribute("style")) {
                          currentMenu.removeAttribute("style");
                      }
                      if (nextMenu && nextMenu.hasAttribute("style")) {
                          nextMenu.removeAttribute("style");
                      }
                      if (previousMenu && previousMenu.hasAttribute("style")) {
                          previousMenu.removeAttribute("style");
                      }
                      if (prePreviousMenu && prePreviousMenu.hasAttribute("style")) {
                          prePreviousMenu.removeAttribute("style");
                      }

                      // find max height
                      if (currentMenu) heights.push(currentMenu.offsetHeight);
                      if (nextMenu) heights.push(nextMenu.offsetHeight);
                      if (previousMenu) heights.push(previousMenu.offsetHeight);
                      if (prePreviousMenu) heights.push(prePreviousMenu.offsetHeight);
                      max = Math.max.apply(this, heights);

                      // update height style
                      if (max > 0) {
                          currentMenu.setAttribute("style","height: "+max+"px");
                          if (nextMenu) {
                              nextMenu.setAttribute("style","height: "+max+"px");
                          }
                          if (previousMenu) {
                              previousMenu.setAttribute("style","height: "+max+"px");
                          }
                          if (prePreviousMenu) {
                              prePreviousMenu.setAttribute("style","height: "+max+"px");
                          }
                      }
                  } else {
                      var cBottom = currentMenu.getBoundingClientRect().bottom,
                          cHeight =  currentMenu.offsetHeight,
                          nBottom = nextMenu.getBoundingClientRect().bottom,
                          nHeight = nextMenu.offsetHeight;
                          
                      if (cHeight < nHeight) {   
                          if (currentMenu.hasAttribute("style")) {
                              currentMenu.removeAttribute("style");
                          }
                          currentMenu.setAttribute("style","height: "+nHeight+"px");
                      }
                      if (cBottom < nBottom) {
                          if (nextMenu.hasAttribute("style")) {
                              nextMenu.removeAttribute("style");
                          }
                          nextMenu.setAttribute("style","bottom: -4px");
                      }
                  }
              } 
          },
          // Top navigation methods
          openContainer = function(target, button, container) {
              activeContainerId = target;
              button.classList.add(prefix + "active");
              button.setAttribute("aria-expanded","true");
              container.classList.add(prefix + "active");  
              if (container.classList.contains(prefix + "msthd-offcanvas-menu")) {
                  toggleFullScreen(container, true);
                  uicoreCustomEvent("Masthead", "OffCanvasOpen", element);
                  setTimeout(function() {
                      setFocus(getFocusableElements(container)[0]);
                  }, 200);
              } else {
                  container.querySelectorAll("a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex='0']")[0].focus();
                  container.addEventListener("focusout", handleFocusOutEvent, true);
              }
              container.addEventListener("keydown", handleKeyDownEvent, false);          
              
          },
          closeContainer = function(button, container) {
              activeContainerId = null;
              window.removeEventListener("click", handleWindowClickEvent, false);
              button.classList.remove(prefix + "active");
              button.setAttribute("aria-expanded","false");
              if (container.classList.contains(prefix + "msthd-offcanvas-menu")) {
                  toggleFullScreen(container, false);
                  uicoreCustomEvent("Masthead", "OffCanvasClose", element);
              } else {
                  container.removeEventListener("focusout", handleFocusOutEvent, true);
                  container.removeEventListener("keydown", handleKeyDownEvent, false);
              }
              container.classList.remove(prefix + "active");
          },
          toggleFullScreen = function(container, show) {
              if (show) {
                  if (container) {
                      container.hidden = false;
                  }
                  DOC.body.classList.add(prefix + "active");
                  
                  // container.addEventListener("keydown", handle)
               
                  if(fullScreenOverlay && !(fullScreenOverlay.classList["contains"](prefix + "show"))) {
                      fullScreenOverlay.classList.add(prefix + "show");
                      fullScreenOverlay.hidden = false;
                  }
                  window.addEventListener("click", handleWindowClickEvent, false);
                  window.addEventListener("touchstart", handleWindowClickEvent, false);
              } else {
                  if (container) {
                      container.hidden = true;
                  }
                  DOC.body.classList.remove(prefix + "active");
                  if (fullScreenOverlay && fullScreenOverlay.classList["contains"](prefix + "show")) {
                      fullScreenOverlay.classList.remove(prefix + "show");
                      fullScreenOverlay.hidden = true;
                  }
                  window.removeEventListener("touchstart", handleWindowClickEvent, false);
              }
          },
          touchHandler = function(e) {
              if (!document.querySelector("." + prefix + "msthd-menu-top").contains(e.target)) {
                  closeOverLay();
              }
          };
          
      this.logIn = function(displayname) {
          var signInCtnr = element.querySelector("." + prefix + "msthd-icon-ctnr"+"[data-target='msthd-signin-ctnr']"),
              signInBadge = signInCtnr.querySelector("." + prefix + "badge"),
              label = signInCtnr.querySelector("." + prefix + "msthd-label");

          if (signInBadge.hidden) {
              signInBadge.hidden = false;
          }
          
          if (label) {
              label.innerHTML = displayname;
          }
          signInCtnr.setAttribute("data-target","msthd-signout-ctnr");
      };
      this.logOut = function() {
          var signInCtnr = element.querySelector("." + prefix + "msthd-icon-ctnr"+"[data-target='msthd-signout-ctnr']"),
              signInBadge = signInCtnr.querySelector("." + prefix + "badge"),
              label = signInCtnr.querySelector("." + prefix + "msthd-label");

          if (!signInBadge.hidden) {
              signInBadge.hidden = true;
          }
          
          if (label) {
              label.innerHTML = signInText;
          }
          signInCtnr.setAttribute("data-target","msthd-signin-ctnr");
      };
      this.cartCount = function(count) {
          var cartCtnr = element.querySelector("." + prefix + "msthd-icon-ctnr"+"[data-target='msthd-cart-ctnr']"),
              cartBadge = cartCtnr.querySelector("." + prefix + "badge");
          if (count && count > 0) {
              if (cartBadge.hidden) {
                  cartBadge.hidden = false;
              }
              cartBadge.innerHTML = count;
          } else {
              cartBadge.hidden = true;
              cartBadge.innerHTML = 0;
          }
      };

      // init
      if (!(stringMasthead in element)) {
          document.addEventListener("uicLeftNavCloseEvent", function(e) {
              closeContainer(e.detail.button, e.detail.container);
          });

          each(element.querySelectorAll("button."+ prefix +"msthd-icon-ctnr", "a."+ prefix +"msthd-icon-ctnr"),function(button) {
              if (button.dataset.toggle && button.dataset.toggle === (prefix + "msthd-offcanvas")) {
                  offCanvasMenuBtn = button;
              }
              if (button.dataset.target === "msthd-country-ctnr") {
                  new Dropdown(button);
              } else {
                  button.addEventListener("click", handleIconClickEvent, false);
              }
          });
          if (offCanvasMenuBtn) {
              fullScreenOverlay = getFullScreenOverlay();
              if (!DOC.body.classList.contains(prefix + "body-off-canvas")) {
                  DOC.body.classList.add(prefix + "body-off-canvas");
              }
              if (isIPhone && isSafari) {
                  element.querySelector("." + prefix + "msthd-offcanvas-menu").classList.add(prefix + "safari-fix");
              }
              each(element.querySelectorAll("[data-toggle='dds__collapse']"), function(collapse) {
                  new Collapse(collapse);
              });
              mediaSize.addListener(function() {
                  if (!mediaSize.matches) {
                      if (activeContainerId) {
                          var container = DOC.getElementById(activeContainerId),
                              button = getClosest(container, "BUTTON", false);
                          closeContainer(button, container);
                      }
                      if (bottomMenu) {
                          each(bottomMenu.querySelectorAll("." + prefix + "msthd-menu-top-item"), function(topMenuItem){
                              if (topMenuItem.matches(":hover")) {
                                  openOverLay();
                              }
                          });
                      }
                  } else {
                      closeOverLay();
                  }
              });
          }
          if (bottomMenu) {
              
              overlay = DOC.getElementById(prefix + "msthd-overlay");

              each(bottomMenu.querySelectorAll("." + prefix + "msthd-menu-ctnr"), function(menuCtnr) {
                  if (!menuCtnr.classList.contains(prefix+"msthd-menu-tier-img")) {
                      if(window.matchMedia("(any-hover: hover)").matches || isIE) { //Device capable of hover + IE (IE Doesn't support media features)
                          menuCtnr.addEventListener(mouseHover[0], handleMenuCntrEvent, false);
                          menuCtnr.addEventListener(mouseHover[1], handleMenuCntrEvent, false);
                      } else { //Device only capable of touch
                          menuCtnr.addEventListener("touchstart", handleMenuCntrEvent, false);
                      }
                  }
                  menuCtnr.addEventListener("blur", handleMenuCtnrBlurEvent, true);
              });
              each(bottomMenu.querySelectorAll("." + prefix + "msthd-menu-top-item > a"), function(topMenuItem){
                  topMenuItem.addEventListener("keydown", handleMenuItemKeyEvent, false);
              });
              each(bottomMenu.querySelectorAll("." + prefix + "msthd-menu-item , ." + prefix + "msthd-menu-item-img"), function(menuItem) {
                  
                  menuItem.querySelector("a").addEventListener("keydown", handleMenuItemKeyEvent, false);
                  if(window.matchMedia("(any-hover: hover)").matches || isIE) { //Device capable of hover + IE (IE Doesn't support media features)
                      menuItem.addEventListener(mouseHover[0], handleMenuItemEvent, false);
                      menuItem.addEventListener(mouseHover[1], handleMenuItemEvent, false);
                  } else { //Device only capable of touch
                      menuItem.addEventListener("touchstart", handleMenuItemEvent, false);
                  }
              });

              bottomMenu = element.querySelector("." + prefix + "msthd-menu-top");
              if(window.matchMedia("(any-hover: hover)").matches || isIE) { //Device capable of hover + IE (IE Doesn't support media features)
                  bottomMenu.addEventListener(mouseHover[0], handleMenuHoverInEvent, false);
                  bottomMenu.addEventListener(mouseHover[1], handleMenuHoverOutEvent, false);
              } else { //Device only capable of touch
                  bottomMenu.addEventListener("touchstart", handleMenuHoverInEvent, false);
              }

              if (isIOS) {
                  window.addEventListener("touchstart", touchHandler, false);
              }

          }
      }

      element[stringMasthead] = self;
  }

  /**
  * Detect Element Resize
  *
  * https://github.com/sdecima/javascript-detect-element-resize
  * Sebastian Decima
  *
  * version: 0.5.3
  **/
  function ResizeElement() {
      (function () {
          var attachEvent = document.attachEvent,
              stylesCreated = false;
      
          if (!attachEvent) {
              var requestFrame = (function(){
                  var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame ||
                    function(fn){ return window.setTimeout(fn, 20); };
                  return function(fn){ return raf(fn); };
              })();
        
              var cancelFrame = (function(){
                  var cancel = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame ||
                       window.clearTimeout;
                  return function(id){ return cancel(id); };
              })();
    
              var resetTriggers = function(element){
                  var triggers = element.__resizeTriggers__,
                      expand = triggers.firstElementChild,
                      contract = triggers.lastElementChild,
                      expandChild = expand.firstElementChild;
                  contract.scrollLeft = contract.scrollWidth;
                  contract.scrollTop = contract.scrollHeight;
                  expandChild.style.width = expand.offsetWidth + 1 + "px";
                  expandChild.style.height = expand.offsetHeight + 1 + "px";
                  expand.scrollLeft = expand.scrollWidth;
                  expand.scrollTop = expand.scrollHeight;
              };
    
              var checkTriggers = function(element){
                  return element.offsetWidth != element.__resizeLast__.width ||
                 element.offsetHeight != element.__resizeLast__.height;
              };
        
              var scrollListener = function(e){
                  var element = this;
                  resetTriggers(this);
                  if (this.__resizeRAF__) cancelFrame(this.__resizeRAF__);
                  this.__resizeRAF__ = requestFrame(function(){
                      if (checkTriggers(element)) {
                          element.__resizeLast__.width = element.offsetWidth;
                          element.__resizeLast__.height = element.offsetHeight;
                          element.__resizeListeners__.forEach(function(fn){
                              fn.call(element, e);
                          });
                      }
                  });
              };
        
              /* Detect CSS Animations support to detect element display/re-attach */
              var animation = false,
                  // animationstring = "animation",
                  keyframeprefix = "",
                  animationstartevent = "animationstart",
                  domPrefixes = "Webkit Moz O ms".split(" "),
                  startEvents = "webkitAnimationStart animationstart oAnimationStart MSAnimationStart".split(" "),
                  pfx  = "";
              {
                  var elm = document.createElement("fakeelement");
                  if( elm.style.animationName !== undefined ) { animation = true; }    
          
                  if( animation === false ) {
                      for( var i = 0; i < domPrefixes.length; i++ ) {
                          if( elm.style[ domPrefixes[i] + "AnimationName" ] !== undefined ) {
                              pfx = domPrefixes[ i ];
                              // animationstring = pfx + "Animation";
                              keyframeprefix = "-" + pfx.toLowerCase() + "-";
                              animationstartevent = startEvents[ i ];
                              animation = true;
                              break;
                          }
                      }
                  }
              }
        
              var animationName = "resizeanim";
              var animationKeyframes = "@" + keyframeprefix + "keyframes " + animationName + " { from { opacity: 0; } to { opacity: 0; } } ";
              var animationStyle = keyframeprefix + "animation: 1ms " + animationName + "; ";
          }
      
          var createStyles = function() {
              if (!stylesCreated) {
                  //opacity:0 works around a chrome bug https://code.google.com/p/chromium/issues/detail?id=286360
                  var css = (animationKeyframes ? animationKeyframes : "") +
              ".resize-triggers { " + (animationStyle ? animationStyle : "") + "visibility: hidden; opacity: 0; } " +
              ".resize-triggers, .resize-triggers > div, .contract-trigger:before { content: \" \"; display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; } .resize-triggers > div { background: #eee; overflow: auto; } .contract-trigger:before { width: 200%; height: 200%; }",
                      head = document.head || document.getElementsByTagName("head")[0],
                      style = document.createElement("style");
          
                  style.type = "text/css";
                  if (style.styleSheet) {
                      style.styleSheet.cssText = css;
                  } else {
                      style.appendChild(document.createTextNode(css));
                  }
    
                  head.appendChild(style);
                  stylesCreated = true;
              }
          };
      
          window.addResizeListener = function(element, fn){
              if (attachEvent) element.attachEvent("onresize", fn);
              else {
                  if (!element.__resizeTriggers__) {
                      if (getComputedStyle(element).position == "static") element.style.position = "relative";
                      createStyles();
                      element.__resizeLast__ = {};
                      element.__resizeListeners__ = [];
                      (element.__resizeTriggers__ = document.createElement("div")).className = "resize-triggers";
                      element.__resizeTriggers__.innerHTML = "<div class=\"expand-trigger\"><div></div></div>" +
                                                "<div class=\"contract-trigger\"></div>";
                      element.appendChild(element.__resizeTriggers__);
                      resetTriggers(element);
                      element.addEventListener("scroll", scrollListener, true);
            
                      /* Listen for a css animation to detect element display/re-attach */
                      animationstartevent && element.__resizeTriggers__.addEventListener(animationstartevent, function(e) {
                          if(e.animationName == animationName)
                              resetTriggers(element);
                      });
                  }
                  element.__resizeListeners__.push(fn);
              }
          };
      
          window.removeResizeListener = function(element, fn){
              if (attachEvent) element.detachEvent("onresize", fn);
              else {
                  element.__resizeListeners__.splice(element.__resizeListeners__.indexOf(fn), 1);
                  if (!element.__resizeListeners__.length) {
                      element.removeEventListener("scroll", scrollListener);
                      element.__resizeTriggers__ = !element.removeChild(element.__resizeTriggers__);
                  }
              }
          };
      })();
  }

  function NavAnchored(element) {
      // initialization element, the element we spy on
      element = element instanceof HTMLElement ? element : (function() {
          return false;
      })();

      var self = this,
          items,
          tabs,
          modalElement,
          backButton,
          activeTab = null,
          focusableEls,
          stringNav = "Nav",
          sticky,
          isSticky = false,
          targetItems,
          tabbing = false,
          targetNav,
          modalSize = window.matchMedia("(max-width: 767.98px)"),
          exitFocus,
          // Event Handlers
          handleClickEvent = function(e) {
              activeTab = e.target;
              tabbing = false;
              if (modalSize.matches && modalElement && !(modalElement.classList.contains(prefix + "show"))) {
                  showModal(activeTab);
                  for (var index = 0; index < items["length"]; index++) {
                      var item = items[index];
                      if(index == activeTab.idx) {
                          activateTab(item);
                      } else {
                          deactivateTab(item);
                      }
                  }
                  e.preventDefault();
              } else {
                  window.addEventListener("scroll", handleScrollEvent, false);
                  if (!isSticky) {
                      if (isIE) {
                          element.scrollIntoView(true);
                      } else {
                          element.scrollIntoView({behavior: "smooth"});
                      }
                  } 
                  if (isIE) {
                      targetItems[activeTab.idx].scrollIntoView(true);
                  } else {
                      targetItems[activeTab.idx].scrollIntoView({behavior: "smooth"});
                  }
              }
          },
          handleScrollEvent = function() {
              var last_known_scroll_position = window.pageYOffset;
              stickNav(last_known_scroll_position);
              if (!tabbing) {
                  window.requestAnimationFrame(updateItems);
              }
          },
          stickNav = function(itemTop) {
              var targetBottom = targetNav.getBoundingClientRect().bottom,
                  spacer;
              if (itemTop > sticky && 0 <= targetBottom) {
                  if (!isSticky) {
                      if(isIE) { // bug fix for position fixed on IE
                          spacer = createElement("div", {
                              class: prefix + "nav-spacer"
                          });
                          spacer.style.height = element.offsetHeight+"px";
                          setElementWidth(element);
                          element.parentElement.insertBefore(spacer, element);
                      }
                      element.style.zIndex = 1030;
                      element.classList.add(prefix + "active");
                      isSticky = true;
                  }
              } else {
                  if (isSticky) {
                      if (isIE) {
                          spacer = element.parentElement.querySelector("." + prefix + "nav-spacer");
                          if (spacer) {
                              element.parentElement.removeChild(spacer);
                          }
                          removeElementWidth();
                      }
                      element.style.zIndex = "";
                      element.classList.remove(prefix + "active");
                      isSticky = false;
                  }
              }
          },
          dismissHandler = function(e) {
              if (modalElement.classList.contains(prefix + "show")) {
                  hideModal();
                  e.preventDefault();
                  setFocus(activeTab);
              }
          },
          handleModalKeydown = function(e) {            
              var KEY_TAB = 9;
              var KEY_ESC = 27;
      
              switch(e.keyCode) {
              case KEY_TAB:
                  if ( focusableEls.length === 1 ) {
                      e.preventDefault();
                      break;
                  }
                  if ( e.shiftKey ) {
                      handleBackwardTab(e);
                  } else {
                      handleForwardTab(e);
                  }
                  break;
              case KEY_ESC: 
                  hideModal();
                  setFocus(activeTab);
                  break;
              }
          },
          showModal = function(item) {
              createModal(item);
              modalElement.style.display = "block";
              modalElement.setAttribute("aria-hidden", false);
              triggerShow();
              modalElement.classList.add(prefix + "show");

              if (isSafari && isIOS) {
                  modalElement.classList.add(prefix + "is-safari");
              }

              DOC.body.classList.add(prefix + "modal-open");

              backButton = modalElement && modalElement.querySelector("[data-dismiss='"+prefix+"modal']");
              backButton.addEventListener("click", dismissHandler, false);
              setFocusableElements();
              setTimeout(function() {
                  setFocus(backButton);
              }, 50);
              modalElement.addEventListener("keydown", handleModalKeydown);
          },
          hideModal = function() {
              modalElement.classList.add(prefix + "slide-right");
              modalElement.classList.remove(prefix + "show");
              modalElement.setAttribute("aria-hidden", true);
              if (isSafari && isIOS && modalElement.classList.contains(prefix + "is-safari")) {
                  modalElement.classList.remove(prefix + "is-safari");
              }
              setTimeout(function() {
                  triggerHide();
                  
                  DOC.body.classList.remove(prefix + "modal-open");
                  if (backButton) {
                      backButton.removeEventListener("click", dismissHandler, false);
                  }
              }, 200);
          },
          createModal = function(tab) {
              var controls = tab.getAttribute("aria-controls");
              var isIconElement =
                  (tab === tab.parentElement
                      .querySelector(".dds__icons.dds__chevron-right.dds__tab-icon"));

              if (!controls && isIconElement) {
                  controls = tab.parentElement.getAttribute("aria-controls");
              }

              var tabContent = document.getElementById(controls).innerHTML;
      
              var modalBody = modalElement.querySelector("." + prefix+ "modal-body");
              modalBody.innerHTML = tabContent;
          },
          // triggers
          triggerShow = function() {
              setFocus(modalElement);
          },
          triggerHide = function() {
              modalElement.style.display = "";
          },
          setFocusableElements = function() {
              focusableEls = getFocusableElements(modalElement);
              modalElement.firstFocusableEl = focusableEls[0];
              modalElement.lastFocusableEl = focusableEls[ focusableEls.length - 1 ];
          },
          handleBackwardTab = function (e) {
              if ( document.activeElement === modalElement.firstFocusableEl ) {
                  e.preventDefault();
                  setFocus(modalElement.lastFocusableEl);
              }
          },
          handleForwardTab = function (e) {
              if ( document.activeElement === modalElement.lastFocusableEl ) {
                  e.preventDefault();
                  setFocus(modalElement.firstFocusableEl);
              }
          },
          setElementWidth = function(el) {
              element.style.width = el.offsetWidth+"px";
          },
          removeElementWidth = function() {
              element.style.width = "";
          },
          toggleElementWidth = debounce(function() {
              if (isSticky) {
                  setElementWidth(element.parentElement);
              } else {
                  removeElementWidth();
              }
          }, 10),
          // takes a number to slighly adjust scroll offset if needed        
          determineSection = function(scrollOffset) {
              scrollOffset = scrollOffset || 0;
              for (var i = 0; i < targetItems.length; i++) {
                  if (targetItems[i].getBoundingClientRect().top + scrollOffset > 0) {
                      return i;
                  }
              }
              return targetItems.length >= 1 ? targetItems.length : 1;
          },
          handleEnterEvent = function(e) {
              var target = e.target;
              tabbing = true;
              if (e.keyCode == 9) {
                  if (!modalSize.matches) {
                      var currentSection = (determineSection(-5) -1);
                      currentSection = currentSection < 0 ? 0 : currentSection;
                      if (isIE) {
                          targetItems[target.idx].scrollIntoView(true);
                      } else {
                          targetItems[target.idx].scrollIntoView({behavior: "smooth"});
                      }
                      toggleTab(tabs[currentSection],tabs[target.idx]);
                  }
              }
              tabbing = false;
          },
          handleKeydownEvent = function(e) {
              var key = e.keyCode,
                  idx = e.target.idx;
              
              switch(key) {
              case 9: if (!e.shiftKey) {
                  if (modalSize.matches) {
                      e.preventDefault(); 
                      setFocus(exitFocus);
                  } else {
                      tabbing = true;
                      var focusEl;
                      each(targetItems, function(target, iter) {
                          if (iter >= idx && target.focusableEls.length > 0 && !focusEl) {
                              focusEl = target.focusableEls;
                          }
                      });
                      if (focusEl) { e.preventDefault(); setFocus(focusEl[0]); }
                      else if (exitFocus) { e.preventDefault(); setFocus(exitFocus); }
                  }
              }
                  break;
              case 13:
              case 32: // enter and spacebar keys
                  e.preventDefault();
                  tabbing = false;
                  setFocus(e.target);
                  e.target.click();
                  break;
              case 35:    e.preventDefault();
                  setFocus(items[tabs.length-1]);
                  items[tabs.length-1].click();
                  break;
              case 36:    e.preventDefault();
                  setFocus(items[0]);
                  items[0].click();
                  break;
              case 39:    e.preventDefault();
                  if (idx === items.length-1) {
                      setFocus(items[0]);
                  } else {
                      setFocus(items[idx+1]);
                  }
                  break;
              case 37:    e.preventDefault();
                  if (idx === 0) {
                      setFocus(items[items.length-1]);
                  } else {
                      setFocus(items[idx-1]);
                  }
                  break;
              }
          },
          updateItems = function() {
              var section = (determineSection(-5) -1);
              section = section < 0 ? 0 : section;
              for (var index = 0; index < items["length"]; index++) {
                  var item = items[index];
                  if (isSticky) {
                      if(index == section) {
                          activateTab(item);
                      } else {
                          deactivateTab(item);
                      }
                  } else {
                      if (index == 0) {
                          activateTab(item);
                      } else {
                          deactivateTab(item);
                      }
                  }
              }
              return item;
          },
          toggleTab = function(oldItem, newItem) {
              deactivateTab(oldItem);
              activateTab(newItem);
          },
          activateTab = function(item) {
              item.setAttribute("tabindex","0");
              item.classList.add(prefix + "active");
              item.setAttribute("aria-selected","true");
          },
          deactivateTab = function(item) {
              item.setAttribute("tabindex","-1");
              item.classList.remove(prefix + "active");
              item.setAttribute("aria-selected","false");
          },
          activateItems = function() {
              element.setAttribute("style", "display: none !important;");
              each(targetItems, function(item) {
                  item.setAttribute("style", "display: block;");
              });
          };
          
      // init - prevent adding event handlers twice
      if (!(stringNav in element)) {

          modalElement = element.dataset["target"] && DOC.getElementById(element.dataset["target"].substr(1));

          targetNav = element.nextElementSibling;
          
          tabs = element.querySelectorAll("li button");

          sticky = element.getBoundingClientRect().top;
          items = [];
          targetItems = [];
          
          if (isIE) {
              window.addEventListener("resize", toggleElementWidth, false);
          }
          
          // populate items and targets
          for (var i=0; i < tabs.length; i++) {
              tabs[i].idx = i;
              items.push(tabs[i]);
              items[i].addEventListener("click", handleClickEvent, false);
              items[i].addEventListener("keydown", handleKeydownEvent, false);
              var panel = document.getElementById(tabs[i].dataset["target"].slice(1));
              panel.scrollTop += element.offsetHeight;
              panel.focusableEls = getFocusableElements(panel);
              each(panel.focusableEls, function(field) {
                  field.addEventListener("keyup", handleEnterEvent, false);
                  field.idx = i;
              });
              targetItems.push(panel);
          }
          if (targetItems[targetItems.length-1].focusableEls.length == 0) { // last panel and no focusable items
              DOC.addEventListener("DOMContentLoaded", function() { // make sure all HTML is available prior to checking
                  exitFocus = getNextFocusableElement(panel);
              });
          }

          if (modalSize.matches) {
              window.removeEventListener("scroll", handleScrollEvent, false);
              if (!modalElement) {
                  activateItems();
              }
          } else {
              window.addEventListener("scroll", handleScrollEvent, false);
          }
          modalSize.addListener(function() {
              if (!modalSize.matches) {
                  element.removeAttribute("style");
                  window.addEventListener("scroll", handleScrollEvent, false);
                  if (modalElement) {
                      hideModal();
                  }
              } else {
                  element.classList.remove(prefix + "active");
                  var spacer = element.parentElement.querySelector("." + prefix + "nav-spacer");
                  if (spacer) {
                      element.parentElement.removeChild(spacer);
                  }
                  window.removeEventListener("scroll", handleScrollEvent, false);
                  if (!modalElement) {
                      activateItems();
                  }
              }
          });

      }

      element[stringNav] = self;
  }

  function NavSkip(element) {

      // initialization element
      element = element instanceof HTMLElement ? element : (function() {
          return false;
      })();

      var self = this,
          stringNavSkip = "NavSkip",
          hiddenZindex = "-1000",
          visibleZindex = "1080",
          tabindex,
          borderStyle,
          dataInset,
     
          // handlers
          focusInHandler = function(e) {
              if (element === e.target || element.contains(e.target)) {
                  element.style.zIndex = visibleZindex;
                  element.style.opacity = "1";
                  each(element.querySelectorAll("a." + prefix + "btn"), function(button) {
                      button.addEventListener("click", clickHandler, false);
                  });
              }
              element.addEventListener("focusout", focusOutHandler);
          },

          focusOutHandler = function(e) {
              var target = e.relatedTarget ? e.relatedTarget : DOC.activeElement;
              if (!element.contains(target) && !(element === target)) {
                  toggleZindex();
              }
          },    
          
          toggleZindex = function() {
              element.style.zIndex = hiddenZindex;
              element.style.opacity = "0";
              each(element.querySelectorAll("a." + prefix + "btn"), function(button) {
                  button.removeEventListener("click", clickHandler, false);
              });
              element.removeEventListener("focusout", focusOutHandler);

          },

          clickHandler = function(e) {
              // element.style.zIndex = hiddenZindex;
              toggleZindex();
              var focusElement = document.getElementById(e.target.getAttribute("href").substr(1));
              tabindex = focusElement.getAttribute("tabIndex");
              if (tabindex !== 0) {
                  focusElement.setAttribute("tabIndex", "0"); 
              } 
              focusElement.addEventListener("focusout", blurHandler, false);
              setTimeout( function() {
                  focusElement.focus();
              }, 100); //firefox needs a little timeout to register tabindex
              if (e.target.getAttribute("data-inset") === "true") { //only add special border if pass in this attr
                  dataInset = true;
                  borderStyle = focusElement.style.border;
                  setTimeout( function() {  
                      focusElement.style.border = "2px inset #000000";
                  }, 10);
              } else {
                  dataInset = false;
              }
          },

          blurHandler = function(e) { 
              if (dataInset) {
                  e.target.style.border = borderStyle;
              }
              if (tabindex !== 0) {
                  tabindex == null ? e.target.removeAttribute("tabIndex") : e.target.setAttribute("tabIndex", tabindex);
              }
              e.target.removeEventListener("focusout", blurHandler, false); //once one blur event occurs, we want to remove the event listener
          };

      // init
      if (!(stringNavSkip in element)) {
          // prevent adding event handlers twice
          element.addEventListener("focusin", focusInHandler);
          // window.addEventListener("keyup", keydownZindexHandler);
          // var focusableEls = document.querySelectorAll("a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex='0']");
          // focusableEls[0].addEventListener("keyup", keydownZindexHandler);
          // if using Mac, keyboard accessbility  will only work if you set up this setting: https://stackoverflow.com/questions/11704828/how-to-allow-keyboard-focus-of-links-in-firefox
          // On Mac: In System Preferences → Keyboard, in the Shortcuts pane, check the “all controls” radio at the bottom.
          // Safari on Mac: additionally, go to safari preferences-> Advanced -> Accessibility "Press Tab to highlight each item on a webpage"
          // Firefox on Mac: additionally, type "about:config" in the URL bar. There is no accessibility.tabfocus preference on the mac, so you'll have to make one. Right click in the window, create a new "integer" pref, and set it to 7.
      }


      element[stringNavSkip] = self;
  }

  function NavAnchoredVertical(element, options) { 
      // initialization element, the element we spy on
      element = element instanceof HTMLElement ? element : (function () {
          return false;
      })();

      var opt = {};

      if (options && Object.keys(options).length) {
          opt.showModal = typeof options.showModal === "boolean" && options.showModal;
      }

      var self = this,
          activeCSSClassName = prefix + "active",
          activeTab = null,
          backButton,
          exitFocus,
          focusableEls,
          modalElement,
          modalSize = window.matchMedia("(max-width: 767.98px)"),
          isSticky = false,
          items,
          stringNav = "Nav",
          sticky,
          tabs,
          targetItems,
          tabbing = false,
          targetNav,
          // Event Handlers
          handleClickEvent = function (e) {
              var scrollViewType = !isIE ? { behavior: "smooth" } : true;
              var shouldShowModal = opt.showModal && 
                  modalSize.matches &&
                  modalElement && 
                  !(modalElement.classList.contains(prefix + "show"));

              var isClickOnIconElement = (e.target === e.target.parentElement
                  .querySelector(".dds__icons.dds__chevron-right.dds__tab-icon"));

              activeTab = isClickOnIconElement ? e.target.parentElement : e.target;
              tabbing = false;

              if (shouldShowModal) {
                  showModal(activeTab);
                  for (var index = 0; index < items["length"]; index++) {
                      var item = items[index];
                      if (index == activeTab.idx) {
                          activateTab(item);
                      } else {
                          deactivateTab(item);
                      }
                  }
                  return e.preventDefault();
              } 

              window.addEventListener("scroll", handleScrollEvent, false);
              
              if (!isSticky) {
                  element.scrollIntoView(scrollViewType);
              }

              targetItems[activeTab.idx].scrollIntoView(scrollViewType);
          },
          handleScrollEvent = function () {
              var lastKnownScrollPosition = window.pageYOffset;
              stickNav(lastKnownScrollPosition);
              if (!tabbing) {
                  window.requestAnimationFrame(updateItems);
              }
          },
          stickNav = function (lastKnownScrollPosition) {
              // var lastTargetContent = targetItems[targetItems.length - 1];

              var target = targetNav.getBoundingClientRect();
              var navPositionCoords = element.parentElement.getBoundingClientRect();

              var navOnTopScreen = (navPositionCoords.top <= 0);
              var elemClassList = element.classList;

              if (lastKnownScrollPosition > sticky && 0 <= target.bottom) {
                  elemClassList.add(activeCSSClassName);
                  element.style.zIndex = 1030;
                  isSticky = true;
              } else if (isSticky) {
                  elemClassList.remove(activeCSSClassName);
                  element.style.zIndex = "";
                  isSticky = false;
              }

              if (isIE) {
                  var navItem = element.querySelectorAll(".dds__nav-anchored-vertical-item");
                  var lastNavItem = navItem[navItem.length - 1];
                  
                  var positionOflastNavItemBottom = lastNavItem.getBoundingClientRect().bottom;
                  var negativeTop = target.bottom - lastNavItem.parentElement.getBoundingClientRect().height;
                  var isNavAfterLastContentBottom = (target.bottom >= positionOflastNavItemBottom);

                  if (navOnTopScreen) {
                      element.style.top = isNavAfterLastContentBottom ? "0px" : negativeTop + "px";
                      element.style.position = "fixed";
                      element.style.height = target.bottom +"px";

                      targetNav.style.marginLeft ="270px";
                      return;
                  }

                  element.style.height ="auto";
                  element.style.position ="relative";
                  targetNav.style.marginLeft ="0";
              }
          },
          dismissHandler = function (e) {
              if (modalElement.classList.contains(prefix + "show")) {
                  hideModal();
                  e.preventDefault();
                  setFocus(activeTab);
              }
          },
          handleModalKeydown = function (e) {
              var KEY_TAB = 9;
              var KEY_ESC = 27;

              switch (e.keyCode) {
              case KEY_TAB:
                  if (focusableEls.length === 1) {
                      e.preventDefault();
                      break;
                  }
                  if (e.shiftKey) {
                      handleBackwardTab(e);
                  } else {
                      handleForwardTab(e);
                  }
                  break;
              case KEY_ESC:
                  hideModal();
                  setFocus(activeTab);
                  break;
              }
          },
          showModal = function (item) {
              createModal(item);
              modalElement.style.display = "block";
              modalElement.setAttribute("aria-hidden", false);
              triggerShow();
              modalElement.classList.add(prefix + "show");

              if (isSafari && isIOS) {
                  modalElement.classList.add(prefix + "is-safari");
              }

              DOC.body.classList.add(prefix + "modal-open");

              backButton = modalElement && modalElement.querySelector("[data-dismiss='" + prefix + "modal']");
              backButton.addEventListener("click", dismissHandler, false);
              setFocusableElements();
              setTimeout(function () {
                  setFocus(backButton);
              }, 50);
              modalElement.addEventListener("keydown", handleModalKeydown);
          },
          hideModal = function () {
              modalElement.classList.add(prefix + "slide-right");
              modalElement.classList.remove(prefix + "show");
              modalElement.setAttribute("aria-hidden", true);
              if (isSafari && isIOS && modalElement.classList.contains(prefix + "is-safari")) {
                  modalElement.classList.remove(prefix + "is-safari");
              }
              setTimeout(function () {
                  triggerHide();

                  DOC.body.classList.remove(prefix + "modal-open");
                  if (backButton) {
                      backButton.removeEventListener("click", dismissHandler, false);
                  }
              }, 200);
          },
          createModal = function (tab) {
              var controls = tab.getAttribute("aria-controls");
              var isIconElement = 
                  (tab === tab.parentElement
                      .querySelector(".dds__icons.dds__chevron-right.dds__tab-icon"));

              if (!controls && isIconElement) {
                  controls = tab.parentElement.getAttribute("aria-controls");
              }

              var tabContent = document.getElementById(controls).innerHTML;

              var modalBody = modalElement.querySelector("." + prefix + "modal-body");
              modalBody.innerHTML = tabContent;
          },
          // triggers
          triggerShow = function () {
              setFocus(modalElement);
          },
          triggerHide = function () {
              modalElement.style.display = "";
          },
          setFocusableElements = function () {
              focusableEls = getFocusableElements(modalElement);
              modalElement.firstFocusableEl = focusableEls[0];
              modalElement.lastFocusableEl = focusableEls[focusableEls.length - 1];
          },
          handleBackwardTab = function (e) {
              if (document.activeElement === modalElement.firstFocusableEl) {
                  e.preventDefault();
                  setFocus(modalElement.lastFocusableEl);
              }
          },
          handleForwardTab = function (e) {
              if (document.activeElement === modalElement.lastFocusableEl) {
                  e.preventDefault();
                  setFocus(modalElement.firstFocusableEl);
              }
          },
          setElementWidth = function (el) {
              element.style.width = el.offsetWidth + "px";
          },
          removeElementWidth = function () {
              element.style.width = "";
          },
          toggleElementWidth = debounce(function () {
              if (isSticky) {
                  setElementWidth(element.parentElement);
              } else {
                  removeElementWidth();
              }
          }, 10),
          toogleContent = debounce(function () {
              each(targetItems, function (panel) {
                  if (opt.showModal && !modalSize.matches) {
                      panel.classList.remove("modal-off");
                      panel.classList.remove("modal-on");
                  } else {
                      panel.classList.add("modal-off");
                      panel.classList.add("modal-on");
                  }
              });
          }, 10),
          // takes a number to slighly adjust scroll offset if needed        
          determineSection = function (scrollOffset) {
              scrollOffset = scrollOffset || 0;
              for (var i = 0; i < targetItems.length; i++) {
                  if (targetItems[i].getBoundingClientRect().top + scrollOffset > 0) {
                      return i;
                  }
              }

              return targetItems.length >= 1 ? targetItems.length : 1;
          },
          handleEnterEvent = function (e) {
              var target = e.target;
              tabbing = true;
              if (e.keyCode == 9) {
                  if (!modalSize.matches) {
                      var currentSection = (determineSection(-5) - 1);
                      currentSection = currentSection < 0 ? 0 : currentSection;
                      if (isIE) {
                          targetItems[target.idx].scrollIntoView(true);
                      } else {
                          targetItems[target.idx].scrollIntoView({ behavior: "smooth" });
                      }
                      toggleTab(tabs[currentSection], tabs[target.idx]);
                  }
              }
              tabbing = false;
          },
          handleKeydownEvent = function (e) {
              var key = e.keyCode,
                  idx = e.target.idx;

              switch (key) {
              case 9: if (!e.shiftKey) {
                  if (modalSize.matches) {
                      e.preventDefault();
                      setFocus(exitFocus);
                  } else {
                      tabbing = true;
                      var focusEl;
                      each(targetItems, function (target, iter) {
                          if (iter >= idx && target.focusableEls.length > 0 && !focusEl) {
                              focusEl = target.focusableEls;
                          }
                      });
                      if (focusEl) { e.preventDefault(); setFocus(focusEl[0]); }
                      else if (exitFocus) { e.preventDefault(); setFocus(exitFocus); }
                  }
              }
                  break;
              case 13:
              case 32: // enter and spacebar keys
                  e.preventDefault();
                  tabbing = false;
                  setFocus(e.target);
                  e.target.click();
                  break;
              case 35: e.preventDefault();
                  setFocus(items[tabs.length - 1]);
                  items[tabs.length - 1].click();
                  break;
              case 36: e.preventDefault();
                  setFocus(items[0]);
                  items[0].click();
                  break;
              case 39: e.preventDefault();
                  if (idx === items.length - 1) {
                      setFocus(items[0]);
                  } else {
                      setFocus(items[idx + 1]);
                  }
                  break;
              case 37: e.preventDefault();
                  if (idx === 0) {
                      setFocus(items[items.length - 1]);
                  } else {
                      setFocus(items[idx - 1]);
                  }
                  break;
              }
          },
          updateItems = function () {
              var section = (determineSection(-5) - 1);
              section = section < 0 ? 0 : section;
              for (var index = 0; index < items["length"]; index++) {
                  var item = items[index];
                  if (isSticky) {
                      if (index == section) {
                          activateTab(item);
                      } else {
                          deactivateTab(item);
                      }
                  } else {
                      if (index == 0) {
                          activateTab(item);
                      } else {
                          deactivateTab(item);
                      }
                  }
              }
              return item;
          },
          toggleTab = function (oldItem, newItem) {
              deactivateTab(oldItem);
              activateTab(newItem);
          },
          activateTab = function (item) {
              item.setAttribute("tabindex", "0");
              item.classList.add(prefix + "active");
              item.setAttribute("aria-selected", "true");
          },
          deactivateTab = function (item) {
              item.setAttribute("tabindex", "-1");
              item.classList.remove(prefix + "active");
              item.setAttribute("aria-selected", "false");
          },
          activateItems = function () {
              element.setAttribute("style", "display: none !important;");
              each(targetItems, function (item) {
                  item.setAttribute("style", "display: none;");
              });
          };

      // init - prevent adding event handlers twice
      if (!(stringNav in element)) {

          modalElement = element.dataset["target"] && DOC.getElementById(element.dataset["target"].substr(1));

          targetNav = element.nextElementSibling;

          tabs = element.querySelectorAll("li button");
          sticky = element.getBoundingClientRect().top;
          items = [];
          targetItems = [];

          // populate items and targets
          for (var i = 0; i < tabs.length; i++) {
              tabs[i].idx = i;
              items.push(tabs[i]);
              items[i].addEventListener("click", handleClickEvent, false);
              items[i].addEventListener("keydown", handleKeydownEvent, false);

              var panel = document.getElementById(tabs[i].dataset["target"].slice(1));
              panel.scrollTop += element.offsetHeight;
              panel.focusableEls = getFocusableElements(panel);

              each(panel.focusableEls, function (field) {
                  field.addEventListener("keyup", handleEnterEvent, false);
                  field.idx = i;
              });

              targetItems.push(panel);
              
              if (opt.showModal && modalSize.matches) {
                  panel.classList.add("modal-on");
                  panel.classList.remove("modal-off");
              } else {
                  panel.classList.add("modal-off");
                  panel.classList.remove("modal-off");
              }
          }

          if (targetItems[targetItems.length - 1].focusableEls.length == 0) { // last panel and no focusable items
              DOC.addEventListener("DOMContentLoaded", function () { // make sure all HTML is available prior to checking
                  exitFocus = getNextFocusableElement(panel);
              });
          }

          if (modalSize.matches && !opt.showModal) {    
              window.removeEventListener("scroll", handleScrollEvent, false);

              if (!modalElement) {
                  activateItems();
              }

              element
                  .setAttribute("style", "display: none !important;");
          } else {
              window.addEventListener("scroll", handleScrollEvent, false);
          }

          window.addEventListener("resize", function () {
              if (modalSize.matches && !opt.showModal) {
                  return element
                      .setAttribute("style", "display: none !important;");
              }

              opt.showModal && toogleContent();

              if (isIE) {
                  opt.showModal && stickNav(window.pageYOffset);
                  toggleElementWidth();
              }
          }, false);

          modalSize.addListener(function () {
              if (!modalSize.matches) {
                  element.removeAttribute("style");
                  window.addEventListener("scroll", handleScrollEvent, false);
                  if (modalElement) {
                      hideModal();
                  }
              } else {
                  element.classList.remove(prefix + "active");
                  var spacer = element.parentElement.querySelector("." + prefix + "nav-spacer");
                  if (spacer) {
                      element.parentElement.removeChild(spacer);
                  }
                  window.removeEventListener("scroll", handleScrollEvent, false);
                  if (!modalElement) {
                      activateItems();
                  }
              }
          });
      }

      element[stringNav] = self;
  }

  function NavLeft(element, options) {
      // initialization element, the element we spy on
      element = element instanceof HTMLElement ? element : (function () {
          return false;
      })();

      // set options
      options = options || {};
      options = jsonOptionsInit(element, options);
      options.menu = element.dataset.menu ? element.dataset.menu : options.menu ? options.menu : "navLeft-list";
      options.main = element.dataset.main ? element.dataset.main : options.main ? options.main : null;
      options.suffix = element.dataset.suffix ? element.dataset.suffix : options.suffix ? options.suffix : null;
      options.arrows = element.dataset.arrows ? element.dataset.arrows : options.arrows ? options.arrows : "right"; // can be "left", "right", or "center"
      options.selected = element.dataset.selected ? element.dataset.selected : options.selected ? options.selected : null;
      options.altmenu = element.dataset.altmenu ? element.dataset.altmenu : options.altmenu ? options.altmenu : null; 
      options.replace = element.dataset.replace ? element.dataset.replace == "true" : options.replace ? options.replace == "true" : false; 

      // warn if required options are not provided
      if (!options.main) {
          throw new Error("Left Nav 'main' option must be set.");
      }

      var self = this,
          stringNavLeft = "NavLeft",
          masthead,
          desktopLeftNav,
          siteBody,
          offCanvas,
          suffix,
          footer,
          buttonToggle,
          footerHeight,
          mastheadHeight,
          visibleFooter,
          parentAccordions = [],
          focusableElms,
          KEY_TAB = 9,
          KEY_ESC = 27,
          defaultMain = options.menu === "navLeft-list",
          adjustHeightForFooter = function () {
              if (!footer) {
                  return;
              }
              visibleFooter = (document.documentElement.clientHeight - footer.getBoundingClientRect().top);
              visibleFooter = visibleFooter < 0 ? 0 : visibleFooter;
              var calcHeight = (document.documentElement.clientHeight - visibleFooter);
              if (visibleFooter > 0) {
                  buttonToggle.style.height = element.style.height = calcHeight + "px";
              }
              if (suffix) {
                  if (visibleFooter > 0) {
                      suffix.style.bottom = visibleFooter + "px";
                  }
                  desktopLeftNav.style.maxHeight = (document.documentElement.clientHeight - suffix.getBoundingClientRect().height - footerHeight) + "px";
              }
          },
          adjustHeightForMasthead = function () {
              if (!masthead) {
                  return;
              }
              var calcHeight;
              mastheadHeight = masthead.getBoundingClientRect().height;
              if (window.pageYOffset > mastheadHeight) {
                  // if masthead not is visible
                  element.style.top = "0px";
                  if (!isFooterVisible()) {
                      buttonToggle.style.height = element.style.height = document.documentElement.clientHeight + "px";
                  } else {
                      buttonToggle.style.height = element.style.height = (document.documentElement.clientHeight  - visibleFooter)+ "px";
                  }
              } else {
                  element.style.top = (mastheadHeight - window.pageYOffset) + "px";
                  if (isFooterVisible()) {
                      calcHeight = (parseInt(window.getComputedStyle(element).height, 10) - (mastheadHeight - window.pageYOffset));
                      buttonToggle.style.height = element.style.height = calcHeight + "px";
                  } else {
                      calcHeight = (document.documentElement.clientHeight - mastheadHeight + window.pageYOffset);
                      buttonToggle.style.height = element.style.height = calcHeight + "px";
                  }
              }
          },
          alignChevrons = function(accordionButtons) {
              if (accordionButtons) {
                  if (options.arrows === "right") {
                      each(accordionButtons, function (accordionButton) {
                          classAdd(accordionButton, prefix + "navLeft-button-optionRight");
                      });
                  } else if (options.arrows === "center") {
                      each(accordionButtons, function (accordionButton) {
                          classAdd(accordionButton, prefix + "navLeft-button-optionCenter");
                          accordionButton.children[1].after(accordionButton.children[0]);
                      });
                  }
              }
          },
          cloneLeftNavToOffCanvas = function () {
              if (defaultMain && !options.altmenu) {
                  return;
              }
              var offCanvasCloneSuffix = "-offCanvas";
              if (options.altmenu) {
                  each(DOC.getElementById(options.altmenu).children, function (li) {
                      offCanvas.leftMenu.querySelector("ul").appendChild(li.cloneNode(true));
                  });
                  DOC.getElementById(options.altmenu).parentElement.removeChild(DOC.getElementById(options.altmenu));
              } else {
                  each(element.querySelectorAll("." + prefix + "navLeft-list>li"), function (li) {
                      offCanvas.leftMenu.querySelector("ul").appendChild(li.cloneNode(true));
                  });
              }
              each(offCanvas.leftMenu.querySelectorAll("." + prefix + "accordion"), function(lnAccordion) {
                  lnAccordion.id = lnAccordion.id + offCanvasCloneSuffix;
                  lnAccordion.querySelector("." + prefix + "accordion-btn").setAttribute("data-parent", 
                      lnAccordion.querySelector("." + prefix + "accordion-btn").getAttribute("data-parent").substr(1) + offCanvasCloneSuffix);
              });
              each(offCanvas.leftMenu.querySelectorAll("." + prefix + "accordion-card-header"), function(lnCardHeader) {
                  lnCardHeader.id = lnCardHeader.id + offCanvasCloneSuffix;
                  lnCardHeader.nextElementSibling.setAttribute("aria-labelledby", 
                      lnCardHeader.nextElementSibling.getAttribute("aria-labelledby") + offCanvasCloneSuffix);
              });
              each(offCanvas.leftMenu.querySelectorAll("." + prefix + "collapse"), function(lnCollapse) {
                  lnCollapse.id = lnCollapse.id + offCanvasCloneSuffix;
                  if (lnCollapse.previousElementSibling.querySelector("." + prefix + "accordion-btn")) {
                      lnCollapse.previousElementSibling.querySelector("." + prefix + "accordion-btn").setAttribute("data-target", 
                          lnCollapse.previousElementSibling.querySelector("." + prefix + "accordion-btn").getAttribute("data-target") + offCanvasCloneSuffix);
                      lnCollapse.previousElementSibling.querySelector("." + prefix + "accordion-btn").setAttribute("aria-controls", 
                          lnCollapse.previousElementSibling.querySelector("." + prefix + "accordion-btn").getAttribute("aria-controls") + offCanvasCloneSuffix);
                  }
              });
              each(offCanvas.leftMenu.querySelectorAll("a"), function(lnAnchor) {
                  if(lnAnchor.id) {
                      lnAnchor.id = lnAnchor.id + offCanvasCloneSuffix;
                  }
              });
              
              // define focusable offcanvas elements
              focusableElms = getFocusableElements(DOC.querySelector("." + prefix + "msthd-top ." + prefix + "navLeft"));

              
              // reinit offcanvas collapses
              each(offCanvas.leftMenu.querySelectorAll("[data-toggle='" + prefix + "collapse']"), function (collapse) {
                  new Collapse(collapse);
              });
          },
          createOffCanvasMenu = function () {
              if (defaultMain && !options.altmenu) {
                  return;
              }
              // remove header menu
              offCanvas = {
                  mastheadMend: masthead.querySelectorAll("." + prefix + "msthd-offcanvas-menu")[0],
                  parent: undefined,
                  storedId: undefined,
                  leftMenu: element.querySelectorAll("." + prefix + "msthd-offcanvas-menu")[0]
              };
              if (offCanvas.mastheadMend) {
                  offCanvas.parent = offCanvas.mastheadMend.parentElement;
                  offCanvas.storedId = offCanvas.mastheadMend.id;
                  offCanvas.parent.removeChild(offCanvas.mastheadMend);
              } else {
                  throw new Error("Left Nav cannot initialize without a masthead component in the header element.");
              }

              // reassign ID to leftNav's offCanvas
              offCanvas.leftMenu.id = offCanvas.storedId;
              if (offCanvas.parent) {
                  offCanvas.parent.appendChild(offCanvas.leftMenu);
              }
          },
          expandSelection = function () {
              if (!options.selected) {
                  return;
              }
              each(parentAccordions, function(stepAccord) {
                  var aButton = stepAccord.querySelector("." + prefix + "accordion-btn"),
                      aChevron = stepAccord.querySelector("." + prefix + "accordion-btn i"),
                      aCollapse = stepAccord.querySelector("." + prefix + "collapse");
                  aButton.setAttribute("aria-expanded", true);
                  classAdd(aChevron, prefix + "navLeft-icon-rotate");
                  one(aButton, "click", function(event) {
                      each(getClosest(event.target, "." + prefix + "accordion", true).querySelectorAll("." + prefix + "accordion-btn i"), function(thisChevron) {
                          classRemove(thisChevron, prefix + "navLeft-icon-rotate");
                      });
                  });
                  aCollapse.setAttribute("aria-expanded", true);
                  classAdd(aCollapse, prefix + "show");
              });

              setTimeout(function() {
                  each(element.querySelectorAll("." + prefix + "navLeft-list"), function(list) {
                      var selectedLink = list.querySelector("." + prefix + "navLeft-link-selected");
                      if (selectedLink) {
                          selectedLink.scrollIntoView();
                      }
                  });
              }, 500);
          },
          handleAdjustmentEvent = function () {
              adjustHeightForFooter();
              adjustHeightForMasthead();
          },
          handleBackClick = function () {
              var activeContainer = masthead.querySelector("." + prefix + "msthd-offcanvas-menu");
              var activeButton = masthead.querySelector("[data-toggle='" + prefix + "msthd-offcanvas']");
              uicoreCustomEvent("LeftNav", "CloseEvent", element, {"button": activeButton, "container": activeContainer});
          },
          handleOffCanvasKeyDown = function (e) {
              switch(e.keyCode) {
              case KEY_TAB:
                  if ( focusableElms.length === 1 ) {
                      e.preventDefault();
                      break;
                  }
                  if ( e.shiftKey ) {
                      handleBackwardTab(e);
                  } else {
                      handleForwardTab(e);
                  }
                  break;
              case KEY_ESC: {
                  handleBackClick();
                  break;   
              }
              }
          },
          handleBackwardTab = function (e) {
              if ( DOC.activeElement === focusableElms[0] ) {
                  e.preventDefault();
                  focusableElms[focusableElms.length-1].focus();
              }
          },
          handleForwardTab = function (e) {
              if ( DOC.activeElement === focusableElms[focusableElms.length-1] ) {
                  e.preventDefault();
                  focusableElms[0].focus();
              }
          },
          handleOffCanvasItemEsc = function (e) {
              switch(e.keyCode) {
              case KEY_ESC: {
                  handleBackClick();
                  break;   
              }
              }    
          },
          handleOffCanvasOpenEvent = function () {
              each(focusableElms, function(fElement) { // top level categories
                  fElement.addEventListener("keydown", handleOffCanvasKeyDown, false);
              });
              // add eventListener to offCanvas menu choices, but not categories
              each(offCanvas.leftMenu.querySelectorAll("li a"), function(aItem) {
                  aItem.addEventListener("keydown", handleOffCanvasItemEsc);
                  aItem.addEventListener("click", handleBackClick);
              });
              each(offCanvas.leftMenu.querySelectorAll("li button"), function(aItem) {
                  aItem.addEventListener("keydown", handleOffCanvasItemEsc);
              });
              if (DOC.body.classList.contains("user-is-tabbing")) {
                  setTimeout(function() {
                      setFocus(focusableElms[0]);
                  }, 200);
              }
          },
          handleOffCanvasCloseEvent = function () {
              each(focusableElms, function(fElement) {
                  fElement.removeEventListener("keydown", handleOffCanvasKeyDown, false);
              });
              each(offCanvas.leftMenu.querySelectorAll("li a"), function(aItem) {
                  aItem.removeEventListener("keydown", handleOffCanvasItemEsc);
                  aItem.removeEventListener("click", handleBackClick);
              });
              each(offCanvas.leftMenu.querySelectorAll("li button"), function(aItem) {
                  aItem.removeEventListener("keydown", handleOffCanvasItemEsc);
              });
              if (DOC.body.classList.contains("user-is-tabbing")) {
                  setTimeout(function() {
                      setFocus(masthead.querySelector("[data-toggle='" + prefix + "msthd-offcanvas']"));
                  }, 200);
              }
              ariaAnnounce(
                  masthead.querySelector("[data-toggle='" + prefix + "msthd-offcanvas']").getAttribute("aria-label") + " " + 
                  masthead.querySelector("[data-toggle='" + prefix + "msthd-offcanvas']").getAttribute("aria-expanded")
              );
          },
          handleToggleClick = function () { // active in this case means the site body is fully expanded, or that the leftnav has been altered from its initial state (thus, collapsed)
              if (element.classList["contains"](prefix + "active")) {
                  classRemove(element, prefix + "active");
                  classRemove(siteBody, prefix + "active");
                  classRemove(buttonToggle.querySelector("svg"), prefix + "rotate-180");
                  buttonToggle.setAttribute("aria-expanded", "true");
                  element.querySelector("#navLeft-list").style.display = "";
              } else {
                  classAdd(element, prefix + "active");
                  classAdd(siteBody, prefix + "active");
                  classAdd(buttonToggle.querySelector("svg"), prefix + "rotate-180");
                  buttonToggle.setAttribute("aria-expanded", "false");
                  element.querySelector("#navLeft-list").style.display = "none";
              }
              setTimeout(function () {
                  adjustHeightForFooter();
                  adjustHeightForMasthead();
              }, 200);
          },
          highlightSelection = function () {
              if (!options.selected) {
                  return;
              }
              var anchortags = DOC.querySelectorAll("a[href*='" + options.selected + "']");
              each(anchortags, function (tag) {
                  var ps = tag.parentElement.previousElementSibling;
                  if (ps && ps.tagName.toLowerCase() === "li") {
                      classAdd(ps, prefix + "navLeft-link-selectedPrev");
                  }
                  classAdd(tag.parentElement, prefix + "navLeft-link-selected");
                  // take note of parent accordions
                  var parentAccordion = getClosest(tag, "." + prefix + "accordion", true);
                  do {
                      parentAccordions.push(parentAccordion);
                      parentAccordion = getClosest(parentAccordion.parentElement, "." + prefix + "accordion", true);
                  } while (parentAccordion);
                  parentAccordions = parentAccordions.reverse();
              });
          },
          isFooterVisible = function () {
              return footer ? DOC.body.offsetHeight >= footer.getBoundingClientRect().top : false;
          };

      // init
      if (!(stringNavLeft in element)) { // prevents adding event handlers twice
          var pageReadyCount = 0,
              pageReadyInterval = 50,
              maxPageReadyTry = 5000;
          // assign global variables
          desktopLeftNav = element.querySelector("." + prefix + "navLeft");
          siteBody = DOC.getElementById(options.main);
          buttonToggle = element.querySelector("." + prefix + "navLeft-btn-toggle");

          // add event handlers
          window.addEventListener("scroll", handleAdjustmentEvent);
          window.addEventListener("resize", handleAdjustmentEvent);
          if (options.menu.length > 0 || options.altmenu.length > 0) { // otherwise let masthead continue to manage offcanvas
              DOC.addEventListener("uicMastheadOffCanvasOpen", handleOffCanvasOpenEvent, false);
              DOC.addEventListener("uicMastheadOffCanvasClose", handleOffCanvasCloseEvent, false);
          }
          buttonToggle.addEventListener("click", handleToggleClick);

          // adjust initial page elements
          if (!defaultMain) {
              if (DOC.getElementById(options.menu)) {
                  DOC.getElementById(options.menu).hidden = true;
              } else {
                  throw new Error("Element not found by ID ('" + options.menu + "') for left nav menu choices.");
              }
          }
          if (options.altmenu) {
              if (DOC.getElementById(options.altmenu)) {
                  DOC.getElementById(options.altmenu).hidden = true;
              } else {
                  throw new Error("Element not found by ID ('" + options.altmenu + "') for left nav (offcanvas) menu choices.");
              }
          }
          classAdd(siteBody, prefix + "body-ml-20");
          if (options.suffix) {
              suffix = DOC.getElementById(options.suffix);
              element.querySelector("nav").appendChild(suffix);
              classAdd(suffix, prefix + "navLeft-suffix");
          }

          // move user's leftNav options into our HTML structure
          if (!defaultMain) {
              each(DOC.getElementById("navLeft-list").querySelectorAll("li"), function(oneLi) {
                  oneLi.parentElement.removeChild(oneLi);
              });
              var developerLinks = DOC.querySelectorAll("#" + options.menu + ">ul>li").length ? 
                  DOC.querySelectorAll("#" + options.menu + ">ul>li") : 
                  DOC.querySelectorAll("#" + options.menu + ">li");
              each(developerLinks, function(thisLi) {
                  element.querySelector("." + prefix + "navLeft-list").appendChild(thisLi);
              });
              DOC.getElementById(options.menu).parentElement.removeChild(DOC.getElementById(options.menu));
          }

          // Remove masthead horizontal menu if it exists
          if (options.replace) {
              var headerHorizontalMenu = DOC.querySelector("." + prefix + "msthd-navbar-bottom");
              if (headerHorizontalMenu) {
                  headerHorizontalMenu.parentElement.removeChild(headerHorizontalMenu);
              }
          }

          // align accordion chevrons
          alignChevrons(element.querySelectorAll("." + prefix + "accordion button"));
          if (options.altmenu) {
              alignChevrons(document.getElementById(options.altmenu).querySelectorAll("." + prefix + "accordion button"));
          }

          // assign global variables that have dependencies
          var pageReady = function() {
              footer = DOC.querySelector("footer");
              masthead = DOC.querySelector("header");
              footerHeight = footer.getBoundingClientRect().height;
              createOffCanvasMenu();
              cloneLeftNavToOffCanvas();
              // set initial heights of elements
              adjustHeightForFooter();
              adjustHeightForMasthead();
              element.style.top = mastheadHeight;
              if (!isIE) { // this is a bonus check for guaranteed initial display. IE doesn't Promise, so it's skip IE, or use a polyfill.
                  Promise.all(Array.from(DOC.images).filter(function (img) { !img.complete; }).map(function (img) { new Promise(function (resolve) { { img.onload = img.onerror = resolve; } }); })).then(function () {
                      adjustHeightForFooter();
                      adjustHeightForMasthead();
                  });
              }
              highlightSelection();
              expandSelection();
              ResizeElement();
          };

          // wait for header and footer. Will be instant unless page load time is abnormally lengthy
          var waitForLeftNav = function() {
              if (pageReadyCount < maxPageReadyTry) {
                  if (DOC.querySelector("footer") && DOC.querySelector("header")) {
                      setTimeout(pageReady, pageReadyInterval);
                  } else {
                      setTimeout(waitForLeftNav, pageReadyInterval);
                  }
                  pageReadyCount += pageReadyInterval;
              } else {
                  throw new Error("Unable to initialize Left Nav component due to page load timeout.");
              }
          };

          waitForLeftNav();
      }


      element[stringNavLeft] = self;
  }

  function Pagination(element, options) {

      element = element instanceof HTMLElement ? element : (function () {
          return false;
      })();

      var jsonParams = element.dataset.page;
      if (jsonParams) {
          options = JSON.parse(jsonParams);
      }

      // set options
      options = options || {};
      options.items =  validateNum(options.items, 1);
      options.filter = element.classList.contains(prefix + "pagination-justified-filter") ? true : false;
      options.pageText = typeof options.pageText === "string" ? options.pageText : "Page";
      options.itemsPerPageText = typeof options.itemsPerPageText === "string" ? options.itemsPerPageText : "Items per page";
      options.perPageSelect = options.perPageSelect ? options.perPageSelect : [12, 24, 48, 96];
      if (isArray(options.perPageSelect)) {
          if (typeof options.perPageSelect[0] === "number") {
              options.perPageSelect = options.perPageSelect.map(function(i) { 
                  i = Math.abs(parseInt(i));
                  return i;
              });
          } else if (validateNum(options.perPageSelect[0])) {
              options.perPageSelect = options.perPageSelect.map(function(i) { 
                  i = Math.abs(parseInt(i));
                  return i;
              });
          } else {
              throw new Error("Invalid perPageSelect. Should be a non-empty array of integer");
          }
      } else {
          options.perPageSelect = [12,24,28,96];
      }
      options.perPage = options.perPageSelect.indexOf(options.perPage) > -1 ? validateNum(options.perPage) : options.perPageSelect[0];
      options.hidePages = options.hidePages && typeof options.hidePages === "boolean" ? options.hidePages : false;
      options.external = options.external != null && typeof options.external === "boolean" ? options.external : false;
      options.buttonLabelLeft = options.buttonLabelLeft ? options.buttonLabelLeft : "Previous";
      options.buttonLabelRight = options.buttonLabelRight ? options.buttonLabelRight : "Next";
      options.disablePaginationInput = options.disablePaginationInput != null && typeof options.disablePaginationInput === "boolean" ? options.disablePaginationInput : false;
      options.showTotal = options.showTotal && typeof options.showTotal === "string" ? options.showTotal : false;

      var self = this,
          stringPagination = "Pagination",
          template = "{total}{pager}{select}",
          pagination,
          prevText = options.buttonLabelLeft,
          nextText = options.buttonLabelRight,
          currentPage,
          origPerPage = options.perPage,
          previousPerPage,
          newPage,
          totalPages,
          newTotalPages,
          lastPage,
          onFirstPage,
          onLastPage,
          links,
          // handlers
          handlePaginationEvent = function(e) {
              var target;
              if (e.target.dataset["page"]) {
                  target = e.target;
              } else {
                  target = e.target.parentNode;
              }
              var name = target.getAttribute("aria-label");
              var focusBtn;

              var buttons = pagination.querySelectorAll("button");
              for (var idx = 0;idx < buttons.length;idx++) {
                  if (target === buttons[idx]) {
                      focusBtn = buttons[idx];
                      break;
                  } 
              }

              if (!options.external) {
                  if (target.dataset["page"]) {
                      self.page(target.dataset["page"]);
                  }
              } else {
                  uicoreCustomEvent("Pagination", "PageChangeEvent", element, { "page": target.dataset["page"], "perPage" : options.perPage, "pages" : totalPages });
              }

              focusBtn = pagination.querySelector("[aria-label=\""+name+"\"]"),
              focusBtn.focus();

          },
          handleKeydownEvent = function(e) {
              if(e.keyCode == 13) {
                  if(e.target.value <= totalPages && e.target.value > 0) {
                      if (!options.external) {
                          self.page(e.target.value);
                      } else {
                          uicoreCustomEvent("Pagination", "PageChangeEvent", element, { "page": e.target.value, "perPage" : options.perPage, "pages" : totalPages });
                      }
                  } else {
                      e.target.value = currentPage;
                  }
                  var queryStr = e.target.tagName;
                  each(e.target.classList, function(clazz) {
                      queryStr += "." + clazz;
                  });
                  pagination.querySelector(queryStr).focus();
              }
          },
          handleFocusoutEvent = function(e) {
              if(e.target.value != currentPage) {
                  e.target.value = currentPage;
              } else {
                  e.preventDefault();
              }
          },
          handleChangeEvent = function(e) {
              if (e.target.value != options.perPage) {
                  previousPerPage = options.perPage;
                  options.perPage = parseInt(e.target.value);
                  if (!options.external) {
                      update();
                  } else {
                      renderPage(); 
                      uicoreCustomEvent("Pagination", "PerPageChangeEvent", element, { "page": currentPage, "perPage" : options.perPage, "pages" : totalPages });
                  }
                  var queryStr = e.target.tagName;
                  each(e.target.classList, function(clazz) {
                      queryStr += "." + clazz;
                  });
                  element.querySelector(queryStr).focus();
              }
          },
          // dynamic ui
          render = function() {
              if (options.showTotal) {
                  var totalItems = createElement("div", {
                      class: prefix + "pagination-total-items"
                  });
                  var spanItems = createElement("span", {
                      html: options.items + " " + options.showTotal
                  });
                  totalItems.appendChild(spanItems);
                  template = template.replace("{total}", totalItems.outerHTML);
              } else {
                  template = template.replace("{total}", "");
              }

              var paginator = createElement("ul", {
                  class: prefix + "pagination-list",
                  role: "presentation"
              });
      
              // Pager placement
              template = template.replace("{pager}", paginator.outerHTML);

              // Per Page Select placement
              if (options.filter) {
                  var wrap = "<div class='" + prefix + "perpage'></div>";
      
                  // Selector placement
                  template = template.replace("{select}", wrap);
              } else {
                  template = template.replace("{select}", "");
              }

              element.innerHTML = template;

              pagination = element.querySelector("." + prefix + "pagination-list");

              if (options.items < options.perPage) {
                  pagination.classList.add(prefix + "pagination-hidden");
              }

              update();
          },
          renderPage = function () {
              var origCurrentPage = currentPage;

              if (newPage) {
                  currentPage = newPage;
                  newPage = null;
              } else if (previousPerPage) {
                  var firstItemOnPage = ( (origCurrentPage - 1) * previousPerPage) + 1;
                  currentPage = Math.ceil(firstItemOnPage / options.perPage);
                  previousPerPage = null;
              } else if (newTotalPages && currentPage > newTotalPages) {
                  currentPage = newTotalPages;
              }

              onFirstPage = currentPage === 1;
              onLastPage = currentPage === lastPage;

              if (origCurrentPage != currentPage) {
                  uicoreCustomEvent("Pagination", "PageUpdateEvent", element, { "page": currentPage, "perPage" : options.perPage, "pages" : totalPages });
              }
          },
          renderPageInput = function() {
              var pageInputWrapper = createElement("li", {
                  class: prefix + "pagination-input-ctnr"
              });
              if (options.hidePages) {
                  pageInputWrapper.classList.add(prefix + "d-none");
              }
              var pageInputTextBefore = createElement("label", {
                  html: options.pageText
              });
              var pageInputField = createElement("input", {
                  class: prefix + "form-control " + prefix + "text-center" ,
                  type: "text",
                  value: currentPage,
                  "aria-label": "Page " + currentPage + " of " +  (newTotalPages ? newTotalPages : totalPages)
              });
              pageInputField.disabled = options.disablePaginationInput;
              var pageInputTextAfter = createElement("label", {
                  html: "of " +  (newTotalPages ? newTotalPages : totalPages)
              });
              
              pageInputWrapper.appendChild(pageInputTextBefore);
              pageInputWrapper.appendChild(pageInputField);
              pageInputWrapper.appendChild(pageInputTextAfter);
              return pageInputWrapper;
          },
          renderPager = function () {
              var origTotalPages = totalPages,
                  pages = newTotalPages ? newTotalPages : totalPages;

              flush(pagination, isIE);
      
              if (pages > 1) {
                  var frag = DOC.createDocumentFragment(),
                      prev = onFirstPage ? 1 : currentPage - 1,
                      next = onLastPage ? pages : currentPage + 1;
      
                  frag.appendChild(button("dds__btn dds__btn-secondary dds__page-item", prev, prevText));
      
                  each(links, function(p) {
                      frag.appendChild(p);
                  });
      
                  frag.appendChild(button("dds__btn dds__btn-secondary dds__page-item", next, nextText));
              
                  pagination.appendChild(frag.cloneNode(true));
                  // add in click and keydown listeners
                  each(pagination.querySelectorAll("li"), function(el) {
                      var hasInput = el.querySelector("input");
                      var hasButton = el.querySelector("button");
                      if(hasButton) {
                          el.addEventListener("click", handlePaginationEvent, true);
                      }
                      if(hasInput) {
                          hasInput.addEventListener("keydown", handleKeydownEvent, false);
                          hasInput.addEventListener("focusout", handleFocusoutEvent, false);
                      }
                  });
              }

              if (pages != origTotalPages || newTotalPages) {
                  totalPages = pages;
                  newTotalPages = null;
                  uicoreCustomEvent("Pagination", "PerPageUpdateEvent", element, { "page": currentPage, "perPage" : options.perPage, "pages" : totalPages });
              }
          },
          renderSelect = function() {
              var el = element.querySelector("." + prefix + "perpage");
              if (el) { flush(el, isIE); }
              var select = createElement("select",{
                  class: prefix + "form-control"
              });

              // Create the options
              each(options.perPageSelect, function(val) {
                  var option;
                  if (val == options.perPage) {
                      option = new Option(val, val, true, true);
                  } else {
                      option = new Option(val, val, false, false);
                  }
                  select.add(option);
              });

              var label = createElement("label", {
                  html: options.itemsPerPageText
              });

              // Custom label
              el.innerHTML = "";
              el.appendChild(select);
              el.appendChild(label);

              select.addEventListener("change", handleChangeEvent, false);

          },
          renderTotalItems = function() {
              var totalItemsWrapper = element.querySelector("." + prefix + "pagination-total-items");
              flush(totalItemsWrapper, isIE);
              totalItemsWrapper.appendChild(createElement("span", {html: options.items + " " + options.showTotal}));
          },
          button = function (c, p, t) {
              var el = createElement("li");

              var bEl = createElement("button", {
                  class: c + " " + prefix + "pager-link",

                  "aria-label": t,
                  "data-page": p
              });
              
              var span = createElement("span", {
                  html: t
              });
              bEl.appendChild(span);
              var svgElem;
              if (t === prevText) {
                  svgElem = renderSvg([{name:"chevron-left", show:true}]);
                  svgElem.setAttribute("name","chevron-left");
                  bEl.insertBefore(svgElem, span);
                  if (onFirstPage) {
                      bEl.setAttribute("disabled","");
                  }
              } else if (t === nextText) {
                  svgElem = renderSvg([{name:"chevron-right", show:true}]);
                  svgElem.setAttribute("name","chevron-right");
                  bEl.appendChild(svgElem);
                  if (onLastPage) {
                      bEl.setAttribute("disabled","");
                  }
              }
              el.appendChild(bEl);

              return el;
          },
          paginate = function () {
              var pages;

              if (options.items < options.perPage) {
                  pages = 1;
              } else {
                  pages = Math.ceil( (options.items / options.perPage) );
              }
              if (!totalPages) {
                  totalPages = lastPage = pages;
              } else {
                  newTotalPages = lastPage = pages;
              }
          },
          update = function() {

              if (options.items < options.perPage) {
                  pagination.classList.add(prefix + "pagination-hidden");
              } else if (pagination.classList.contains(prefix + "pagination-hidden")) {
                  pagination.classList.remove(prefix + "pagination-hidden");
              }

              paginate(); 

              renderPage();
      
              links = [renderPageInput()];
      
              renderPager();

              if(options.filter) {
                  renderSelect();
              }

              if (options.showTotal) {
                  renderTotalItems();
              }
          };



      /**
       * Changes the page to the number passed in
       * @param  {int} num
       * @return {void}
       */
      this.page = function(num) {
          
          newPage = validateNum(num);

          if (!newPage
              || newPage == currentPage 
              || newPage > totalPages 
              || newPage < 0
          ) {
              return false;
          }

          update();
      };

      /**
       * Changes the value chosen in the per-page selection input
       * @param  {int} num
       * @return {void}
       */
      this.perPage = function(num) {
          var newPerPage = validateNum(num);

          if (!newPerPage) {
              return false;
          } else {
              options.perPage = newPerPage;
          }

          update();
      };
      
      /**
       * Adds the amount of items passed in
       * @param  {int} num
       * @return {void}
       */
      this.addItems = function(num) {
          
          var addItems = validateNum(num);

          if (!addItems) {
              return false;
          } else {
              options.items += addItems;
          }

          update();
      };

      /**
       * Removes the amount of items passed in
       * @param  {int} num
       * @return {void}
       */
      this.removeItems = function(num) {
          
          var remItems = validateNum(num);

          if (!remItems) {
              return false;
          } else {
              options.items -= remItems;
          }

          update();
      };

      /**
       * Sets the total number of items to the number passed in
       * @param  {int} num
       * @return {void}
       */
      this.setItems = function(num) {
          
          var newItems = validateNum(num);
          if (newItems == undefined || newItems == null) {
              if (num === 0) options.items = 0;
              pagination.classList.add(prefix + "pagination-hidden");
              return false;
          } else {
              options.items = newItems;
              if (options.items === 0) {
                  options.perPage = origPerPage;
                  previousPerPage = null;
              }
          }

          update();
      };

      /**
       * Return the calculated pages
       * @return {int} totalPages
       */
      this.pages = function() {
          return totalPages;
      };

      //init
      if (!(stringPagination in element)) {
          currentPage = 1;
          render();
      }

      element[stringPagination] = self;
  }

  function Popover(element, options) {
      // initialization element
      element = element instanceof HTMLElement ? element : (function () {
          return false;
      })();

      options = options || {};
      options = jsonOptionsInit(element, options);
      options.delay = element.dataset.delay ? parseInt(element.dataset.delay) : options.delay ? parseInt(options.delay) : 10;
      options.title = element.dataset.title ? element.dataset.title : options.data_title ? options.data_title : null;
      options.content = element.dataset.content ? element.dataset.content : options.data_content ? options.data_content : null;
      options.placement = element.dataset.placement ? element.dataset.placement : options.data_placement ? options.data_placement : null;
      options.container = element.dataset.container ? element.dataset.container : options.container ? options.container : DOC.body;

      // validate options
      (function () {
          if (options.title == null || options.title === "") {
              throw new Error("There was a problem found with title value, please correct and try again");
          }
          if (options.content == null || options.content === "") {
              throw new Error("There was a problem found with content value, please correct and try again");
          }
          if (options.placement == null) {
              throw new Error("There was a problem found with placement value, please correct and try again");
          }
          var inOffCanvas = getClosest(element, "." + prefix + "modal-offcanvas");
          if(inOffCanvas) {
              options.container = inOffCanvas;
          } else {
              var inFixedTop = getClosest(element, ".fixed-top");
              if(inFixedTop) {
                  options.container = inFixedTop;
              } else {
                  var inFixedBottom = getClosest(element, ".fixed-bottom");
                  if(inFixedBottom) {
                      options.container = inFixedBottom;
                  }
              }
          }
      })();

      // DATA API
      var self = this,
          popoverString = "Popover",
          container = DOC.body,
          overlay = getFullScreenOverlay(),
          popoverArrow = null,
          popoverCloseBtn = null,
          positionCalc = true,
          smallMedia = window.matchMedia("(max-width: 767.98px)"),
          popover = null,
          popoverModal = null,
          // handlers
          triggerHandler = function(e) {
              setTimeout( function() {
                  self.toggle();
                  e.preventDefault();
              }, options.delay);
          },
          blurHandler = function(e) {
              setTimeout( function() {
                  if(popover && !popover.contains(DOC.activeElement)) {
                      self.hide();
                      element.focus();
                      DOC.activeElement.removeEventListener("focusout", blurHandler, false);
                      e.preventDefault();
                  } else {
                      DOC.activeElement.addEventListener("focusout", blurHandler, false);
                  }
              }, options.delay);
          },
          clickHandler = function(e) {
              if (popover && popover.contains(e.target)) {
                  if(e.target === popoverCloseBtn || popoverCloseBtn.contains(e.target)) {
                      self.hide();
                      element.focus();
                      e.preventDefault();
                  }
              } 
          },
          keyHandler = function (e) {
              if (e.keyCode === 27 && e.type === "keydown") { //esc
                  element.focus();
                  self.hide();
                  e.preventDefault();
              } else if (e.keyCode === 13 && e.type === "keydown") { //enter
                  if (e.currentTarget.classList.contains(prefix + "close")) {
                      self.hide();
                      element.focus();
                      e.preventDefault();
                  }
              } else if (e.keyCode === 9 & e.type === "keydown") { //tab out
                  if (e.shiftKey && e.srcElement.classList.contains(prefix + "popover")) {
                      self.hide();
                      element.focus();
                      e.preventDefault();
                  }
              }
          },
          createPopover = function () {
              //create popover divs
              var popoverDialog = null,
                  popoverTitleDiv = null,
                  popoverTitle = null,
                  popoverContent = null,
                  popoverParagraph = null;

              popover = createElement("div", {
                  class: prefix + "modal-dialog",
                  tabindex: "0",
                  role: "dialog"
              });


              popoverDialog = createElement("div", {
                  class: prefix + "popover-dialog",
              });
              popover.appendChild(popoverDialog);

              //create popover arrow
              popoverArrow = createElement("div", {
                  class: prefix + "arrow"
              });
              popover.appendChild(popoverArrow);

              //set popover title container
              popoverTitleDiv = createElement("div", {
                  class: prefix + "popover-title-container " + prefix + "d-flex"
              });

              popoverDialog.appendChild(popoverTitleDiv);

              popoverTitle = createElement("h3", {
                  class: prefix + "popover-header " + prefix + "bold-16",
                  html: options.title
              });
              popoverTitleDiv.appendChild(popoverTitle);

              //set popover body content
              popoverContent = createElement("div", {
                  class: prefix + "popover-body"
              });

              popoverParagraph = createElement("p", {
                  html: options.content
              });

              popoverDialog.appendChild(popoverContent);
              popoverContent.appendChild(popoverParagraph);
              
              //create close button
              popoverCloseBtn = createElement("button", {
                  class: prefix + "close" + " " +  prefix + "icons " + prefix + "close-x " + prefix + "position-absolute",
                  tabindex: "0",
                  aria_label: "Close Popover",
                  data_dismiss: prefix + "popover"
              });

              popoverTitleDiv.appendChild(popoverCloseBtn);
          
              //append to the container
              if (smallMedia.matches) {
                  popoverModal = createElement("div", {
                      class: prefix + "modal"
                  });
                  popoverModal.style.display = "block";
              
                  DOC.body.classList.add(prefix + "modal-open");
                  popoverModal.appendChild(popover);
                  element.parentNode.insertBefore(popoverModal, element);
              } else {
                  container.insertBefore(popover, container.firstChild);
              }
              popover.style.display = "block";
              popover.setAttribute("class", prefix + "popover" + " " + prefix + "bs-popover-" + options.placement + " " + prefix + "fade"+ " " + prefix + "show " + prefix + "rounded-0");
          },
          createOverlay = function () {
              if (overlay) {
                  overlay.classList.add(prefix + "show");
                  overlay.removeAttribute("hidden");
                  overlay.style.visibility = "hidden";
              } else {
                  console.warn("POPOVER: Overlay requested. Corresponding HTML missing. Please apply 'dds__overlay' to a div");
              }

          },
          removeOverlay = function () {
              if (overlay) {
                  overlay.classList.remove(prefix + "show");
              }
          },
          removePopover = function () {
              var popoverParent = popover.parentNode;

              // if popover has the dds__modal, then access it's parent to remove the whole node
              if (popoverParent.getAttribute('class') === prefix + "modal") {
                  popoverParent.parentNode.removeChild(popoverParent);
              } else {
                  container.removeChild(popover);
              }
              popover = null;
              DOC.body.classList.remove(prefix + "modal-open");
          },
          showPopover = function () {
              !(popover.classList.contains(prefix + "show")) && popover.classList.add(prefix + "show");
              popover.focus();
          },
          updatePopover = function () {
              if (positionCalc) {
                  styleTip(element, popover, options.placement, container);
              }
              else {
                  popover.style.cssText = "";
              }
          },
          // triggers
          showTrigger = function() {
              popover.addEventListener("blur", blurHandler, false);
              uicoreCustomEvent("Popver", "Shown", element);
          },
          hideTrigger = function() {
              popover.removeEventListener("blur", blurHandler, false);
              removePopover();
              uicoreCustomEvent("Popover", "Hidden", element);
          },
          positionCalculation = function(e) {
              if (e.matches) {
                  positionCalc = false;
              }
              else {
                  positionCalc = true;
              }
          };

      // public methods / handlers
      this.toggle = function() {
          if (popover === null) {
              self.show();
          } else {
              self.hide();
          }
      };
      this.show = function() {
          setTimeout(function () {
              if (popover === null) {
                  createPopover();
                  createOverlay();
                  updatePopover();
                  showPopover();

                  element.removeEventListener("click", triggerHandler, false);
                  window.addEventListener("click", clickHandler, false);
                  popover.addEventListener("keydown", keyHandler, false);
                  globalObject.addEventListener("resize", self.toggle, false);
                  uicoreCustomEvent("Popover", "ShowEvent", element);

                  emulateTransitionEnd(popover, showTrigger);
              }
          }, options.delay);
      };
      this.hide = function() {
          removeOverlay();
          setTimeout(function () {
              if (popover && popover !== null && popover.classList.contains(prefix + "show")) {

                  uicoreCustomEvent("Popover", "HideEvent", element);
                  window.removeEventListener("click", clickHandler, false);
                  popover.removeEventListener("keydown", keyHandler, false);
                  globalObject.removeEventListener("resize", self.toggle, false);
                  popover.classList.remove(prefix + "show");

                  emulateTransitionEnd(popover, hideTrigger);
                  element.addEventListener("click", triggerHandler, false);
              }
          }, options.delay);
      };
      this.update = function () {
          updatePopover();
      };

      // init
      if (!(popoverString in element)) {
          // prevent adding event handlers twice
          element.addEventListener("click", triggerHandler, false);
          positionCalculation(smallMedia);
          smallMedia.addListener(positionCalculation);
      }

      element[popoverString] = self;
  }

  function ProductStack(element, options) {
      element = element instanceof HTMLElement ? element : (function() {
          return false;
      })();

      options = options || {};
      options = jsonOptionsInit(element, options);
      options.lazyload = typeof options.lazyload === "boolean" ? options.lazyload : false;
      options.type = options.type ? options.type : "single";

      var stringProductStack = "ProductStack",
          itemsView,
          currentOffset,
          overflowContainer,
          childrenWidth,
          productStacks,
          rightCtrls,
          leftCtrls,
          productStackID,
          // handlers
          resizeHandler = function() {
              updateSectionHeights();
              updateItemsView();
          },
          controlClick = function(e) {
              var increment = childrenWidth;
              if (options.type == "page") {
                  // increment = overflowContainer.offsetWidth;
                  var leftNumber = Math.ceil((overflowContainer.scrollLeft - 5) / childrenWidth) + 1;
                  var rightNumber = Math.floor((overflowContainer.scrollLeft + overflowContainer.offsetWidth + 5) / childrenWidth);
                  if (rightNumber - leftNumber <= 0){
                      increment = childrenWidth;
                  } else {
                      increment = childrenWidth * (rightNumber - leftNumber + 1);
                  }
              }
              
              var isRight = (e.target.classList.contains(prefix + "overflow-control-right") || e.target.parentElement.classList.contains(prefix + "overflow-control-right")) ? true : false;
              
              if (isRight) {
                  if ((currentOffset + increment) < childrenWidth * productStacks.length - overflowContainer.offsetWidth - 1) {
                      currentOffset += increment;
                  }
                  else {
                      currentOffset = childrenWidth * productStacks.length - overflowContainer.offsetWidth;
                  }
              } else {
                  if ((currentOffset - increment) > 1) {
                      currentOffset -= increment;
                  }
                  else {
                      currentOffset = 0;
                  }
              }
              if(isIE || isSafari || isEdge) {
                  overflowContainer.scrollLeft = currentOffset;
              }
              else {
                  overflowContainer.scroll({ top: 0, left: currentOffset, behavior: "smooth" });
              }
              updateItemsView();
          },
          updateSectionHeights = function() {
              element.getElementsByTagName("style")[0].innerHTML = "";
              childrenWidth = productStacks[0].parentElement.offsetWidth;
              // tallestSections can be used in the future to optimize the performace on resize
              // var tallestSections = [];
              each(productStacks[0].sections, function(section) {
                  // to optimize, we can extract querySelectorAll outside and save it somewhere instead of doing it over and over
                  var sectionName = "." + section.className.replace(/\s/g, ".");
                  var sectionMatches = element.querySelectorAll(sectionName);         
                  if(sectionMatches.length > 1){
                      var maxHeight = 0;
                      each(sectionMatches, function(sectionMatch) {
                          if (sectionMatches.style){
                              sectionMatches.removeAttribute("style");
                          }
                          if (sectionMatch.offsetHeight > maxHeight) {
                              maxHeight = sectionMatch.offsetHeight;
                          }
                          else if (sectionMatch.offsetHeight == 0) {
                              sectionMatch.nextElementSibling.style.visibility = "hidden";
                          }
                      });
                      var styleTag = element.getElementsByTagName("style")[0].innerHTML;
                      element.getElementsByTagName("style")[0].innerHTML = styleTag + "#"+ productStackID + " " + sectionName + "{ height: " + maxHeight + "px }";
                  }
              }); 
          },
          updateItemsView = function() {
              //can be optimized later on to avoid cycling through all sections to generate stylesheet 
              // adding and subtracting 5 pixels for flexibility on non-integer scrollLeft
              if (itemsView) {
                  var leftNumber = Math.ceil((overflowContainer.scrollLeft - 5) / childrenWidth) + 1;
                  var rightNumber = Math.floor((overflowContainer.scrollLeft + overflowContainer.offsetWidth + 5) / childrenWidth);
                  each(itemsView, function(view){
                      view.innerHTML = "<span>" + (leftNumber) + (leftNumber < rightNumber ? " - " + (Math.min(rightNumber, productStacks.length)) : "") + " of "+ productStacks.length +"</span>";
                  });
                  uicoreCustomEvent("ProductStack", "ChangeEvent", element, {"left": leftNumber, "right": rightNumber, "totalItems": productStacks.length});
                  if(leftNumber <= 1){
                      each(leftCtrls, function(leftCtrl){
                          leftCtrl.setAttribute("disabled", "");
                      });
                  } else {
                      each(leftCtrls, function(leftCtrl){
                          leftCtrl.removeAttribute("disabled");
                      });
                  }
                  if (rightNumber >= productStacks.length) {
                      each(rightCtrls, function(rightCtrl){
                          rightCtrl.setAttribute("disabled", "");
                      });
                  } else {
                      each(rightCtrls, function(rightCtrl){
                          rightCtrl.removeAttribute("disabled");
                      });
                  }
                  if(rightCtrls[0].disabled && leftCtrls[0].disabled){
                      each(rightCtrls, function(rightCtrl){
                          rightCtrl.style.display = "none";
                      });
                      each(leftCtrls, function(leftCtrl){
                          leftCtrl.style.display = "none";
                      });
                      each(itemsView, function(viewDiv){
                          viewDiv.style.display = "none";
                      });
                  } else {
                      each(rightCtrls, function(rightCtrl){
                          rightCtrl.style.display = "block";
                      });
                      each(leftCtrls, function(leftCtrl){
                          leftCtrl.style.display = "block";
                      });
                      each(itemsView, function(viewDiv){
                          viewDiv.style.display = "block";
                      });
                  }
              }
          };


      this.lazyLoad = function() {
          if (options.lazyload) {
              updateSectionHeights();
              updateItemsView();
              uicoreCustomEvent("ProductStack", "LazyLoadEvent", element, {"success": true});
          }
          else {
              uicoreCustomEvent("ProductStack", "LazyLoadEvent", element, {"success": false, "msg": "Carousel cannot be lazy loaded. Check usage or avoid mulitple lazy loads."});
          }
      };

      // prevent adding event handlers twice
      if (!(stringProductStack in element)) {
          productStackID = element.id ? element.id : "product-stack";
          var style = createElement("style");
          style.type = "text/css"; 
          element.insertBefore(style, element.firstElementChild);
          productStacks = element.querySelectorAll("UL." + prefix + "product-stack");
          each(productStacks, function(productStack) {
              productStack.sections = [];
              var i = 0;
              each(productStack.children, function(section) {
                  if (section.tagName =="LI") {
                      section.classList.add(prefix + "ps-row-"+ i++);
                      productStack.sections.push(section);
                  }
              });  
          });
          itemsView = element.parentElement.querySelectorAll("DIV." + prefix + "items-view");
          overflowContainer = element.querySelector("." + prefix + "product-stack-wrapper");
          overflowContainer.addEventListener("scroll", debounce(function() {
              if (overflowContainer.scrollLeft != currentOffset) {
                  updateItemsView();
                  currentOffset = overflowContainer.scrollLeft;
              }
          }), 15);
          window.addEventListener("load", updateSectionHeights, false); 
          window.addEventListener("resize", debounce(resizeHandler, 15));
          childrenWidth = element.querySelector("." + prefix + "product-stack").parentElement.offsetWidth;
          rightCtrls = element.querySelectorAll("[data-toggle='" + prefix + "product-stack-control-right']");
          each(rightCtrls, function(rightCtrl){
              rightCtrl.addEventListener("click", controlClick, true);
          });
          leftCtrls = element.querySelectorAll("[data-toggle='" + prefix + "product-stack-control-left']");
          each(leftCtrls, function(leftCtrl){
              leftCtrl.addEventListener("click", controlClick, true);
              leftCtrl.setAttribute("disabled", "");
          });
          if (isEdge) {
              rightCtrls[0].addEventListener("keydown", function(e){
                  setTimeout(function(){
                      if ((e.keyCode == 13 || e.keyCode == 32) && rightCtrls[0].disabled) {
                          e.preventDefault();
                          leftCtrls[0].focus();
                      }
                  }, 100);
              }, false);
              leftCtrls[0].addEventListener("keydown", function(e){
                  setTimeout(function(){
                      if ((e.keyCode == 13 || e.keyCode == 32) && leftCtrls[0].disabled) {
                          e.preventDefault();
                          rightCtrls[0].focus();
                      }
                  }, 100);
              }, false);
              leftCtrls[1].addEventListener("keydown", function(e){
                  setTimeout(function(){
                      if ((e.keyCode == 13 || e.keyCode == 32) && leftCtrls[1].disabled) {
                          e.preventDefault();
                          rightCtrls[1].focus();
                      }
                  }, 100);
              }, false);
              rightCtrls[1].addEventListener("keydown", function(e){
                  setTimeout(function(){
                      if ((e.keyCode == 13 || e.keyCode == 32) && rightCtrls[1].disabled) {
                          e.preventDefault();
                          leftCtrls[1].focus();
                      }
                  }, 100);
              }, false);
          }
          currentOffset = overflowContainer.scrollLeft;
          updateItemsView();
      }

      element[stringProductStack] = self;
  }

  function Progress(element, options) {
      element = element instanceof HTMLElement ? element : (function () {
          return false;
      })();

      // set options
      options = options || {};
      options = jsonOptionsInit(element, options);
      options.showText = element.dataset.showtext ? element.dataset.showtext == "true" ? true : false : options.showtext == "true" ? true : false;
      options.timeToComplete = element.dataset.timeToComplete ? validateNum(element.dataset.timeToComplete, 10000) : validateNum(options.timeToComplete, 10000);


      // this defines how chunky you want the increment block to be the smaller the increment, the smoother it is,
      // however, it will impact minimum time to complete depending on client's machine's performance
      var increment = 0.25,
          timeToComplete = options.timeToComplete,
          millisecondPerTick = timeToComplete / (100.0 / increment),
          width = 0,
          id,
          stringProgress = "Progress",
          frame = function() {
              if (width < 100.0) {
                  width += increment;
                  element.style.width = width + "%";
                  element.setAttribute("aria-valuenow", Math.round(width));
              } else {
                  element.style.width = "100%";
                  clearInterval(id);
              }
              if (options.showText) {
                  element.innerHTML = width < 100 ? Math.round(width) + "%" : "100%";
              }
          };

      // init
      if (!(stringProgress in element)) {
          setInterval(frame, millisecondPerTick);
      }

      element[stringProgress] = self;
  }

  function Slider(element, optionsInput) {
      element = element instanceof HTMLElement ? element : (function() {
          return false;
      })();

      var isJson = false,
          jsonParams = element.dataset.slider;
      if (jsonParams) {
          optionsInput = JSON.parse(jsonParams);
          isJson = true;
      }
      var options = optionsInput || {};
      

      // User supplied
      options.animate = typeof options.animate == "boolean" ? options.animate : true;
      options.animationDuration = typeof options.animationDuration == "number" ? options.animationDuration : 300;
      options.ort = options.orientation ? options.orientation === "vertical" ? 1 : 0 : 0;
      options.dir = options.direction ? options.direction === "rtl" ? 1 : 0 : options.ort == 1 ? 1 : 0;
      options.singleStep = typeof options.step == "number" ? options.step : undefined;
      options.percision = typeof options.percision == "number" ? options.percision > 2 ? 2 : options.percision : 0;
      // User supplied but heeds more calculations at see validateOptions
      options.behaviour = options.behaviour ? options.behaviour : "tap";
      options.margin = typeof options.margin == "number" ? options.margin : 1;
      options.limit = typeof options.limit == "number" ? options.limit : 0;
      options.padding = options.padding ? options.padding : 0;
      options.tooltips = typeof options.tooltips == "boolean" ? options.tooltips : true;
      options.content = typeof options.content == "string" ? options.content : false;
      options.showRange = typeof options.showRange == "boolean" ? options.showRange : false;
      // Formats at see validateOptions
      options.format = typeof options.format == "object" ? options.format : undefined;
      options.ariaFormat = typeof options.ariaFormat == "object" ? options.ariaFormat : undefined;

      var stringSlider = "Slider",
          slider, 
          container,
          spectrum,
          optEvents = {},
          events = {},
          connects,
          handles,
          handleNumbers,
          sliderBase,
          parsed,
          actions,
          supportsPassive = isIE ? false : true,
          locations = [],
          values = [],
          tooltips,
          activeHandlesCount = 0,
          minContainers = [],
          maxContainers = [],
          // For horizontal sliders in standard ltr documents,
          // make .dds__slider-origin overflow to the left so the document doesn't scroll.
          dirOffset = options.dir == 1 || options.ort == 1 ? 0 : 100,
          msPrefix = element.style.msTransform !== undefined,
          noPrefix = element.style.transform !== undefined,
          transformRule = noPrefix ? "transform" : msPrefix ? "msTransform" : "webkitTransform",
          // Default formatter uses numbers only and supplies percision/decimal places
          defaultFormatter = { to: function(value) { return value !== undefined && value.toFixed(options.percision); }, from: Number },
          // Validation
          validateMargin = function(entry) {
              if (options.margin === 0) {
                  return;
              }
      
              options.margin = spectrum.getMargin(entry);
      
              if (!options.margin) {
                  throw new Error("Slider 'margin' option is only supported on linear sliders.");
              }
          },
          validateOptions = function() {
              // Range always first initiates Spectrum
              if (options.range) {
                  // Filter incorrect input.
                  if (typeof options.range !== "object" || isArray(options.range)) {
                      throw new Error("Slider 'range' is not an object.");
                  }

                  // Update if only one handle
                  if (options.range.min === undefined) {
                      options.range.min = 0;
                  }

                  // Catch missing end.
                  if (options.range.max === undefined) {
                      throw new Error("Slider Missing 'max' in 'range'.");
                  }

                  // Catch equal start or end.
                  if (options.range.min === options.range.max) {
                      throw new Error("Slider 'range' 'min' and 'max' cannot be equal.");
                  }

                  spectrum = new Spectrum(options.range, options.snap, options.singleStep);
              } else {
                  throw new RangeError("There was a problem found with the range option values, please correct and try again!");
              }
              // Start
              if (options.start) {
                  var entry = asArray(options.start);

                  // Validate input. Values aren't tested, as the public .val method
                  // will always provide a valid location.
                  if (!Array.isArray(entry) || !entry.length) {
                      throw new Error("Slider 'start' option is incorrect.");
                  }

                  // Store the number of handles.
                  options.handles = entry.length;

                  // When the slider is initialized, the .val method will
                  // be called with the start options.
                  options.start = entry;
              } else {
                  if (options.range.min && options.range.max) {
                      options.start = [options.range.min,options.range.max];
                      options.handles = 2;
                  } else {
                      options.start = options.range.max;
                      options.handles = 1;
                  }
              }
              // Events
              if (options.behaviour) {
                  // Make sure the input is a string.
                  if (typeof options.behaviour !== "string") {
                      throw new Error("Slider 'behaviour' must be a string containing options.");
                  }

                  // Check if the string contains any keywords.
                  // None are required.
                  var tap = options.behaviour.indexOf("tap") >= 0;
                  var drag = options.behaviour.indexOf("drag") >= 0;
                  var fixed = options.behaviour.indexOf("fixed") >= 0;
                  var snap = options.behaviour.indexOf("snap") >= 0;
                  var hover = options.behaviour.indexOf("hover") >= 0;
                  var unconstrained = options.behaviour.indexOf("unconstrained") >= 0;

                  if (fixed) {
                      if (parsed.handles !== 2) {
                          throw new Error("Slider 'fixed' behaviour must be used with 2 handles");
                      }
                  }

                  if (unconstrained && (parsed.margin || parsed.limit)) {
                      throw new Error(
                          "Slider 'unconstrained' behaviour cannot be used with margin or limit"
                      );
                  }

                  optEvents = {
                      tap: tap || snap,
                      drag: drag,
                      fixed: fixed,
                      snap: snap,
                      hover: hover,
                      unconstrained: unconstrained
                  };
              }
              // Margin
              if (optEvents.fixed == 0) { // at see validateBehaviour
                  validateMargin(options.margin);
              }
              // Limit
              options.limit = spectrum.getMargin(options.limit);
              // Padding
              if (options.padding) {
                  if (typeof options.padding == "number" && !Array.isArray(options.padding)) {
                      throw new Error(
                          "Slider 'padding' option must be numeric or array of exactly 2 numbers."
                      );
                  }
          
                  if (Array.isArray(options.padding) 
                      && !(   options.padding.length == 2 
                              || typeof options.padding[0] != "number" 
                              || typeof options.padding[1] != "number"
                      )
                  )
                  {
                      throw new Error(
                          "Slider 'padding' option must be numeric or array of exactly 2 numbers."
                      );
                  }
          
                  if (options.padding === 0) {
                      return;
                  }
          
                  if (!Array.isArray(options.padding)) {
                      options.padding = [options.padding];
                  }
          
                  // 'getMargin' returns false for invalid values.
                  options.padding = [spectrum.getMargin(options.padding[0]), spectrum.getMargin(options.padding[1])];
          
                  if (options.padding[0] === false || options.padding[1] === false) {
                      throw new Error("Slider 'padding' option is only supported on linear sliders.");
                  }
          
                  if (options.padding[0] < 0 || options.padding[1] < 0) {
                      throw new Error("Slider 'padding' option must be a positive number(s).");
                  }
          
                  if (options.padding[0] + options.padding[1] > 100) {
                      throw new Error("Slider 'padding' option must not exceed 100% of the range.");
                  }
              }
              // Tooltips
              if (options.tooltips) {
                  var tooltips;
                  if (options.tooltips === false) {
                      return;
                  }
          
                  if (options.tooltips === true) {
                      tooltips = [];
          
                      for (var i = 0; i < options.handles; i++) {
                          tooltips.push(true);
                      }
                  } else {
                      tooltips = asArray(options.tooltips);
          
                      if (tooltips.length !== handles) {
                          throw new Error("Slider must pass a formatter for all handles.");
                      }
          
                      tooltips.forEach(function(formatter) {
                          if (
                              typeof formatter !== "boolean" &&
                              (typeof formatter !== "object" || typeof formatter.to !== "function")
                          ) {
                              throw new Error("Slider 'tooltips' must be passed a formatter or 'false'.");
                          }
                      });
                  }
                  options.tooltips = tooltips;
              }
              // Formats
              if (!options.format) {
                  if (isJson) {
                      var inputs = JSON.parse(jsonParams);
                      if (inputs.format) {
                          var testJs;
                          if (inputs.format.indexOf("(") > -1) {
                              testJs = inputs.format.substring(0, inputs.format.indexOf("(")).trim();
                          } else {
                              testJs = inputs.format;
                          }
                          if (!window[testJs]) {
                              throw new Error("The supplied format function "+inputs.format+" could not be accessed, please verify and try again!");
                          } else {
                              options.format = window[testJs];
                          }
                      } else {
                          options.format = defaultFormatter;
                      }
                  } else {
                      options.format = defaultFormatter;
                  }
              }
              if (!options.ariaFormat) {
                  if (isJson) {
                      inputs = JSON.parse(jsonParams);
                      if (inputs.ariaFormat) {
                          if (inputs.ariaFormat.indexOf("(") > -1) {
                              testJs = inputs.ariaFormat.substring(0, inputs.ariaFormat.indexOf("(")).trim();
                          } else {
                              testJs = inputs.ariaFormat;
                          }
                          if (!window[testJs]) {
                              throw new Error("The supplied format function "+inputs.ariaFormat+" could not be accessed, please verify and try again!");
                          } else {
                              options.ariaFormat = window[testJs];
                          }
                      } else {
                          options.ariaFormat = options.format;
                      }
                  } else {
                      options.ariaFormat = options.format;
                  }
              }
              if (options.format) {
                  if (!options.format.to || !options.format.from) {
                      throw new Error("The supplied format function "+options.format+" is missing required method to or from, please verify and try again!");
                  }
              }
              if (options.ariaFormat) {
                  if (!options.ariaFormat.to || !options.ariaFormat.from) {
                      throw new Error("The supplied format function "+options.format+" is missing required method to or from, please verify and try again!");
                  }
              }
          },
          // Event Handlers
          endEventHandler = function() {
              var data = get();
              if (!Array.isArray(data)) {
                  data = asArray(data);
              }
              for (var d = 0; d < data.length; d++) {
                  data[d] = typeof data[d] == "string" ? data[d] : options.format.to(data[d]);
              }
              var containers = null;
              if (handles.length == 1) {
                  containers = maxContainers;
              } else {
                  containers = minContainers;
              }
              
              for (var c = 0; containers.length > c; c++) {
                  containers[c].innerHTML = data[0];
              }
              if (handles.length > 1) {
                  for (var max = 0; maxContainers.length > max; max++) {
                      maxContainers[max].innerHTML = data[1];
                  }
              }
              var details = {};
              if (data[1]) {
                  details.min = data[0];
                  details.max = data[1];
              } else {
                  details.value = data[0];
              }
              uicoreCustomEvent("Slider", "SlideEnd", element, details);
          },
          focusEventHandler = function(e) {
              e["currentTarget"].classList.add(prefix + "slider-active");
          },
          blurEventHandler = function(e) {
              e["currentTarget"].classList.remove(prefix + "slider-active");
          },
          
          // Handles keydown on focused handles
          // Don't move the document when pressing arrow keys on focused handles
          eventKeydown = function(event, handleNumber) {
              if (isSliderDisabled() || isHandleDisabled(handleNumber)) {
                  return false;
              }

              var horizontalKeys = ["Left", "Right"];
              var verticalKeys = ["Down", "Up"];
              var largeStepKeys = ["PageDown", "PageUp"];
              var edgeKeys = ["Home", "End"];

              if (options.dir && !options.ort) {
                  // On an right-to-left slider, the left and right keys act inverted
                  horizontalKeys.reverse();
              } else if (options.ort && !options.dir) {
                  // On a top-to-bottom slider, the up and down keys act inverted
                  verticalKeys.reverse();
                  largeStepKeys.reverse();
              }

              // Strip "Arrow" for IE compatibility. https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
              var key = event.key.replace("Arrow", "");

              var isLargeDown = key === largeStepKeys[0];
              var isLargeUp = key === largeStepKeys[1];
              var isDown = key === verticalKeys[0] || key === horizontalKeys[0] || isLargeDown;
              var isUp = key === verticalKeys[1] || key === horizontalKeys[1] || isLargeUp;
              var isMin = key === edgeKeys[0];
              var isMax = key === edgeKeys[1];

              if (!isDown && !isUp && !isMin && !isMax) {
                  return true;
              }

              event.preventDefault();

              var to;

              if (isUp || isDown) {
                  var multiplier = 5;
                  var direction = isDown ? 0 : 1;
                  var steps = getNextStepsForHandle(handleNumber);
                  var step = steps[direction];

                  // At the edge of a slider, do nothing
                  if (step === null) {
                      return false;
                  }

                  // No step set, use the default of 10% of the sub-range
                  if (step === false) {
                      step = Spectrum.getDefaultStep(locations[handleNumber], isDown, 10);
                  }

                  if (isLargeUp || isLargeDown) {
                      step *= multiplier;
                  }

                  // Step over zero-length ranges (#948);
                  step = Math.max(step, 0.0000001);

                  // Decrement for down steps
                  step = (isDown ? -1 : 1) * step;

                  to = values[handleNumber] + step;
              } else if (isMax) {
                  // End key
                  to = options.spectrum.xVal[options.spectrum.xVal.length - 1];
              } else {
                  // Home key
                  to = options.spectrum.xVal[0];
              }

              setHandle(handleNumber, spectrum.toStepping(to), true, true);

              fireEvent("slide", handleNumber);
              fireEvent("update", handleNumber);
              fireEvent("change", handleNumber);
              fireEvent("set", handleNumber);

              return false;
          },
          getNextStepsForHandle = function(handleNumber) {
              var location = locations[handleNumber];
              var nearbySteps = spectrum.getNearbySteps(location);
              var value = values[handleNumber];
              var increment = nearbySteps.thisStep.step;
              var decrement = null;

              // If snapped, directly use defined step value
              if (options.snap) {
                  return [
                      value - nearbySteps.stepBefore.startValue || null,
                      nearbySteps.stepAfter.startValue - value || null
                  ];
              }

              // If the next value in this step moves into the next step,
              // the increment is the start of the next step - the current value
              if (increment !== false) {
                  if (value + increment > nearbySteps.stepAfter.startValue) {
                      increment = nearbySteps.stepAfter.startValue - value;
                  }
              }

              // If the value is beyond the starting point
              if (value > nearbySteps.thisStep.startValue) {
                  decrement = nearbySteps.thisStep.step;
              } else if (nearbySteps.stepBefore.step === false) {
                  decrement = false;
              }

              // If a handle is at the start of a step, it always steps back into the previous step first
              else {
                  decrement = value - nearbySteps.stepBefore.highestStep;
              }

              // Now, if at the slider edges, there is no in/decrement
              if (location === 100) {
                  increment = null;
              } else if (location === 0) {
                  decrement = null;
              }

              // As per #391, the comparison for the decrement step can have some rounding issues.
              var stepDecimals = spectrum.countStepDecimals();

              // Round per #391
              if (increment !== null && increment !== false) {
                  increment = Number(increment.toFixed(stepDecimals));
              }

              if (decrement !== null && decrement !== false) {
                  decrement = Number(decrement.toFixed(stepDecimals));
              }

              return [decrement, increment];
          },
          // Attach events to several slider parts.
          bindSliderEvents = function(behaviour) {
              // Attach the standard drag event to the handles.
              if (!behaviour.fixed) {
                  handles.forEach(function(handle, index) {
                      // These events are only bound to the visual handle
                      // element, not the 'real' origin element.
                      attachEvent(actions.start, handle.children[0], eventStart, {
                          handleNumbers: [index]
                      });
                  });
              }

              // Attach the tap event to the slider base.
              if (behaviour.tap) {
                  attachEvent(actions.start, sliderBase, eventTap, {});
              }

              // Fire hover events
              if (behaviour.hover) ;

              // Make the range draggable.
              if (behaviour.drag) {
                  connects.forEach(function(connect, index) {
                      if (connect === false || index === 0 || index === connects.length - 1) {
                          return;
                      }

                      var handleBefore = handles[index - 1];
                      var handleAfter = handles[index];
                      var eventHolders = [connect];

                      connect.classList.add(prefix + "slider-draggable");

                      // When the range is fixed, the entire range can
                      // be dragged by the handles. The handle in the first
                      // origin will propagate the start event upward,
                      // but it needs to be bound manually on the other.
                      if (behaviour.fixed) {
                          eventHolders.push(handleBefore.children[0]);
                          eventHolders.push(handleAfter.children[0]);
                      }

                      eventHolders.forEach(function(eventHolder) {
                          attachEvent(actions.start, eventHolder, eventStart, {
                              handles: [handleBefore, handleAfter],
                              handleNumbers: [index - 1, index]
                          });
                      });
                  });
              }
          },
          // Attach an event to this slider, possibly including a namespace
          bindEvent = function(namespacedEvent, callback) {
              events[namespacedEvent] = events[namespacedEvent] || [];
              events[namespacedEvent].push(callback);

              // If the event bound is 'update,' fire it immediately for all handles.
              if (namespacedEvent.split(".")[0] === "update") {
                  handles.forEach(function(a, index) {
                      fireEvent("update", index);
                  });
              }
          },
          // Helpers
          addNodeTo = function(addTarget, className) {
              var div = createElement("div", {
                  class: className ? className : ""
              });

              addTarget.appendChild(div);

              return div;
          },
          // Round a value to the closest 'to'.
          closest = function(value, to) {
              return Math.round(value / to) * to;
          },
          // Current position of an element relative to the document.
          offset = function(elem, orientation) {
              var rect = elem.getBoundingClientRect();
              var doc = elem.ownerDocument;
              var docElem = doc.documentElement;
              var pageOffset = getPageOffset(doc);

              // getBoundingClientRect contains left scroll in Chrome on Android.
              // I haven't found a feature detection that proves this. Worst case
              // scenario on mis-match: the 'tap' feature on horizontal sliders breaks.
              if (/webkit.*Chrome.*Mobile/i.test(navigator.userAgent)) {
                  pageOffset.x = 0;
              }
              return orientation
                  ? rect.top + pageOffset.y - docElem.clientTop
                  : rect.left + pageOffset.x - docElem.clientLeft;
          },
          // Fire 'end' when a mouse or pen leaves the document.
          documentLeave = function(event, data) {
              if (event.type === "mouseout" && event.target.nodeName === "HTML" && event.relatedTarget === null) {
                  eventEnd(event, data);
              }
          },
          // Handle movement on document for handle and range drag.
          eventMove = function(event, data) {
              // Check if we are moving up or down
              var movement = (options.dir ? -1 : 1) * (event.calcPoint - data.startCalcPoint);

              // Convert the movement into a percentage of the slider width/height
              var proposal = (movement * 100) / data.baseSize;

              moveHandles(movement > 0, proposal, data.locations, data.handleNumbers);
          },
          // Unbind move events on document, call callbacks.
          eventEnd = function(event, data) {
              // The handle is no longer active, so remove the class.
              if (data.handle) {
                  data.handle.classList.remove(prefix + "slider-active");
                  activeHandlesCount -= 1;
              }

              // Unbind the move and end events, which are added on 'start'.
              data.listeners.forEach(function(c) {
                  DOC.removeEventListener(c[0], c[1]);
              });

              if (activeHandlesCount === 0) {
                  // Remove dragging class.
                  slider.classList.remove(prefix + "slider-drag");
                  setZindex();

                  // Remove cursor styles and text-selection events bound to the element.
                  if (event.cursor) {
                      element.style.cursor = "";
                  }
              }

              data.handleNumbers.forEach(function(handleNumber) {
                  fireEvent("change", handleNumber);
                  fireEvent("set", handleNumber);
                  fireEvent("end", handleNumber);
              });
          },
          // Bind move events on document.
          eventStart = function(event, data) {
              // Ignore event if any handle is disabled
              if (data.handleNumbers.some(isHandleDisabled)) {
                  return false;
              }

              var handle;

              if (data.handleNumbers.length === 1) {
                  var handleOrigin = handles[data.handleNumbers[0]];

                  handle = handleOrigin.children[0];
                  activeHandlesCount += 1;

                  // Mark the handle as 'active' so it can be styled.
                  handle.classList.add(prefix + "slider-active");
              }

              // A drag should never propagate up to the 'tap' event.
              event.stopPropagation();

              // Record the event listeners.
              var listeners = [];

              // Attach the move and end events.
              var moveEvent = attachEvent(actions.move, DOC, eventMove, {
                  // The event target has changed so we need to propagate the original one so that we keep
                  // relying on it to extract target touches.
                  target: event.target,
                  handle: handle,
                  listeners: listeners,
                  startCalcPoint: event.calcPoint,
                  baseSize: baseSize(),
                  pageOffset: event.pageOffset,
                  handleNumbers: data.handleNumbers,
                  buttonsProperty: event.buttons,
                  locations: locations.slice()
              });

              var endEvent = attachEvent(actions.end, DOC, eventEnd, {
                  target: event.target,
                  handle: handle,
                  listeners: listeners,
                  doNotReject: true,
                  handleNumbers: data.handleNumbers
              });

              var outEvent = attachEvent("mouseout", DOC, documentLeave, {
                  target: event.target,
                  handle: handle,
                  listeners: listeners,
                  doNotReject: true,
                  handleNumbers: data.handleNumbers
              });

              // We want to make sure we pushed the listeners in the listener list rather than creating
              // a new one as it has already been passed to the event handlers.
              listeners.push.apply(listeners, moveEvent.concat(endEvent, outEvent));

              // Text selection isn't an issue on touch devices,
              // so adding cursor styles can be skipped.
              if (event.cursor) {
                  // Prevent the 'I' cursor and extend the range-drag cursor.
                  element.style.cursor = getComputedStyle(event.target).cursor;

                  // Mark the target with a dragging state.
                  if (handles.length > 1) {
                      slider.classList.add(prefix + "slider-drag");
                  }
              }

              data.handleNumbers.forEach(function(handleNumber) {
                  fireEvent("start", handleNumber);
              });
          },
          // Move closest handle to tapped location.
          eventTap = function(event) {
              // The tap event shouldn't propagate up
              event.stopPropagation();

              var proposal = calcPointToPercentage(event.calcPoint);
              var handleNumber = getClosestHandle(proposal);

              // Tackle the case that all handles are 'disabled'.
              if (handleNumber === false) {
                  return false;
              }

              // Flag the slider as it is now in a transitional state.
              // Transition takes a configurable amount of ms (default 300). Re-enable the slider after that.
              if (!events.snap) {
                  addClassFor(slider, prefix +"slider-tap", options.animationDuration);
              }

              setHandle(handleNumber, proposal, true, true);

              setZindex();

              fireEvent("slide", handleNumber, true);
              fireEvent("update", handleNumber, true);
              fireEvent("change", handleNumber, true);
              fireEvent("set", handleNumber, true);

              if (events.snap) {
                  eventStart(event, { handleNumbers: [handleNumber] });
              }
          },

          addTooltip = function(handle, handleNumber) {
              if (!options.tooltips[handleNumber]) {
                  return false;
              }

              return addNodeTo(handle.firstChild, prefix + "slider-tooltip");
          },
          isSliderDisabled = function() {
              return slider.hasAttribute("disabled");
          },
          // Disable the slider dragging if any handle is disabled
          isHandleDisabled = function(handleNumber) {
              var handleOrigin = handles[handleNumber];
              return handleOrigin.hasAttribute("disabled");
          },
          // Append a origin to the base
          addOrigin = function(handleNumber) {
              var origin = addNodeTo(sliderBase, prefix + "slider-origin");
              var handle = addNodeTo(origin, prefix + "slider-handle");
              
              addNodeTo(handle, prefix + "slider-touch-area");
              
              handle.setAttribute("data-handle", handleNumber);
              
              // keyboard support
              handle.setAttribute("tabindex", "0");
              handle.addEventListener("keydown", function(event) {
                  return eventKeydown(event, handleNumber);
              });
                          
              handle.setAttribute("role", "slider");
              handle.setAttribute("aria-orientation", options.ort ? "vertical" : "horizontal");
              
              if (options.handles == 1) {
                  handle.classList.add(prefix + "slider-handle-upper");
              } else if (handleNumber === 0) {
                  handle.classList.add(prefix + "slider-handle-lower");
              } else {
                  handle.classList.add(prefix + "slider-handle-upper");
              }
              
              return origin;
          },
          // nsert nodes for connect elements
          addConnect = function(base, add) {
              if (!add) {
                  return false;
              }
              
              return addNodeTo(base, prefix + "slider-connect");
          },
          addLabels = function() {
              var min, max, minLabel, maxLabel;
              var minValue = options.format.to(options.range.min);
              var maxValue = options.format.to(options.range.max);
              if (handles.length == 1) {
                  max = createElement("div", {
                      class: prefix + "slider-max"
                  });
                  maxLabel = addNodeTo(max);
                  maxLabel.innerHTML = maxValue;
                  maxContainers.push(maxLabel);
              } else {
                  min = createElement("div", {
                      class: prefix + "slider-min"
                  });
                  minLabel = addNodeTo(min);
                  minLabel.innerHTML = minValue;
                  minContainers.push(minLabel);
                  max = createElement("div", {
                      class: prefix + "slider-max"
                  });
                  maxLabel = addNodeTo(max);
                  maxLabel.innerHTML = maxValue;
                  maxContainers.push(maxLabel);
              }
              if (options.ort === 0) {
                  if (min) { container.insertBefore(min, container.childNodes[0]); }
                  container.appendChild(max);
              } else {
                  if (min) { container.appendChild(min); }
                  container.insertBefore(max, container.childNodes[0]);
              }
          },
          addContent = function() {
              var label = createElement("div", {
                  class: prefix + "text-no-wrap "+prefix+"mb-3" + (options.ort == 1 ? " "+prefix+"d-flex "+prefix+"flex-column "+prefix+"align-items-center" : "")
              });
              var text = DOC.createTextNode(options.content);
              label.appendChild(text);
              element.insertBefore(label, element.firstChild);
              if (options.showRange) {
                  var span = createElement("span", {
                      html: " ( " + options.format.to(options.range.min) + " - " + options.format.to(options.range.max) + " )"
                  });
                  label.appendChild(span);
              }
          },
          addContainer = function() {
              container = element.querySelector("." + prefix + "slider-container");
          
              // if vertical add class to parent
              if(options.ort == 1) {
                  container.classList.add(prefix + "slider-container-vertical");
              }
              
              // update wrapper to singe with one handle
              if (options.handles == 1) {
                  var wrapper = container.querySelector("." + prefix + "slider-wrapper");
                  wrapper.classList.remove(prefix + "slider-wrapper");
                  wrapper.classList.add(prefix + "slider-wrapper-single");
              }
          },
          addElements = function() {

              var connectBase = addNodeTo(sliderBase, prefix + "slider-connects");

              handles = [];
              connects = [];
              handleNumbers = [];
              var optConnects;

              if (options.handles === 1) {
                  optConnects = [true,false];
              } else {
                  optConnects = [false,options.range,false];
              }
              connects.push(addConnect(connectBase, optConnects[0]));

              for (var i = 0; i < options.handles; i++) {
                  // Keep a list of all added handles.
                  handles.push(addOrigin(i));
                  handleNumbers[i] = i;
                  connects.push(addConnect(connectBase, optConnects[i + 1]));
              }
          },
          // Initialize a single slider.
          addSlider = function() {

              if (options.dir === 0) {
                  slider.classList.add(prefix + "slider-ltr");
              } else {
                  slider.classList.add(prefix + "slider-rtl");
              }

              if (options.ort === 0) {
                  slider.classList.add(prefix + "slider-horizontal");
              } else {
                  slider.classList.add(prefix + "slider-vertical");
              }

              var base = addNodeTo(slider, prefix + "slider-base");
              base.setAttribute("tabindex", "0");
              base.setAttribute("aria-label", (options.content ? options.content : "Slider") + " "  + options.format.to(options.range.min) + " to " + options.format.to(options.range.max));
                      
              return base;
          },
          valueSet = function(input, fireSetEvent) {
              var values = asArray(input);
              var isInit = locations[0] === undefined;

              // Event fires by default
              fireSetEvent = fireSetEvent === undefined ? true : !!fireSetEvent;

              // Animation is optional.
              // Make sure the initial values were set before using animated placement.
              if (options.animate && !isInit) {
                  addClassFor(slider, prefix + "slider-tap", options.animationDuration);
              }

              // First pass, without lookAhead but with lookBackward. Values are set from left to right.
              handleNumbers.forEach(function(handleNumber) {
                  setHandle(handleNumber, resolveToValue(values[handleNumber], handleNumber), true, false);
              });

              // Second pass. Now that all base values are set, apply constraints
              handleNumbers.forEach(function(handleNumber) {
                  setHandle(handleNumber, locations[handleNumber], true, true);
              });

              setZindex();

              handleNumbers.forEach(function(handleNumber) {
                  fireEvent("update", handleNumber);

                  // Fire the event only for handles that received a new value, as per #579
                  if (values[handleNumber] !== null && fireSetEvent) {
                      fireEvent("set", handleNumber);
                  }
              });
          },

          asArray = function(a) {
              return Array.isArray(a) ? a : [a];
          },
          addClassFor = function(element, className, duration) {
              if (duration > 0) {
                  element.classList.add(className);
                  setTimeout(function() {
                      element.classList.remove(className);
                  }, duration);
              }
          },
          // Counts decimals
          countDecimals = function(numStr) {
              numStr = String(numStr);
              var pieces = numStr.split(".");
              return pieces.length > 1 ? pieces[1].length : 0;
          },
          // Limits a value to 0 - 100
          limit = function(a) {
              return Math.max(Math.min(a, 100), 0);
          },
          // Moves handle(s) by a percentage
          // (bool, % to move, [% where handle started, ...], [index in handles, ...])
          moveHandles = function(upward, proposal, locations, handleNumbers) {
              var proposals = locations.slice();

              var b = [!upward, upward];
              var f = [upward, !upward];

              // Copy handleNumbers so we don't change the dataset
              handleNumbers = handleNumbers.slice();

              // Check to see which handle is 'leading'.
              // If that one can't move the second can't either.
              if (upward) {
                  handleNumbers.reverse();
              }

              // Step 1: get the maximum percentage that any of the handles can move
              if (handleNumbers.length > 1) {
                  handleNumbers.forEach(function(handleNumber, o) {
                      var to = checkHandlePosition(
                          proposals,
                          handleNumber,
                          proposals[handleNumber] + proposal,
                          b[o],
                          f[o],
                          false
                      );

                      // Stop if one of the handles can't move.
                      if (to === false) {
                          proposal = 0;
                      } else {
                          proposal = to - proposals[handleNumber];
                          proposals[handleNumber] = to;
                      }
                  });
              }

              // If using one handle, check backward AND forward
              else {
                  b = f = [true];
              }

              var state = false;

              // Step 2: Try to set the handles with the found percentage
              handleNumbers.forEach(function(handleNumber, o) {
                  state = setHandle(handleNumber, locations[handleNumber] + proposal, b[o], f[o]) || state;
              });

              // Step 3: If a handle moved, fire events
              if (state) {
                  handleNumbers.forEach(function(handleNumber) {
                      fireEvent("update", handleNumber);
                      fireEvent("slide", handleNumber);
                  });
              }
          },
          // Takes a base value and an offset. This offset is used for the connect bar size.
          // In the initial design for this feature, the origin element was 1% wide.
          // Unfortunately, a rounding bug in Chrome makes it impossible to implement this feature
          // in this manner: https://bugs.chromium.org/p/chromium/issues/detail?id=798223
          transformDirection = function(a, b) {
              return options.dir ? 100 - a - b : a;
          },
          // Updates locations and values, updates visual state
          updateHandlePosition = function(handleNumber, to) {
              // Update locations.
              locations[handleNumber] = to;

              // Convert the value to the slider stepping/range.
              values[handleNumber] = spectrum.fromStepping(to);

              var rule = "translate(" + inRuleOrder(transformDirection(to, 0) - dirOffset + "%", "0") + ")";
              handles[handleNumber].style[transformRule] = rule;

              updateConnect(handleNumber);
              updateConnect(handleNumber + 1);
          },
          // Test suggested values and apply margin, step.
          setHandle = function(handleNumber, to, lookBackward, lookForward) {
              to = checkHandlePosition(locations, handleNumber, to, lookBackward, lookForward, false);

              if (to === false) {
                  return false;
              }

              updateHandlePosition(handleNumber, to);

              return true;
          },
          // Updates style attribute for connect nodes
          updateConnect = function(index) {
              // Skip connects set to false
              if (!connects[index]) {
                  return;
              }

              var l = 0;
              var h = 100;

              if (index !== 0) {
                  l = locations[index - 1];
              }

              if (index !== connects.length - 1) {
                  h = locations[index];
              }

              // We use two rules:
              // 'translate' to change the left/top offset;
              // 'scale' to change the width of the element;
              // As the element has a width of 100%, a translation of 100% is equal to 100% of the parent (.noUi-base)
              var connectWidth = h - l;
              var translateRule = "translate(" + inRuleOrder(transformDirection(l, connectWidth) + "%", "0") + ")";
              var scaleRule = "scale(" + inRuleOrder(connectWidth / 100, "1") + ")";

              connects[index].style[transformRule] = translateRule + " " + scaleRule;
          },
          setZindex = function() {
              handleNumbers.forEach(function(handleNumber) {
                  var dir = locations[handleNumber] > 50 ? -1 : 1;
                  var zIndex = 3 + (handles.length + dir * handleNumber);
                  handles[handleNumber].style.zIndex = zIndex;
              });
          },
          // Undo attachment of event
          removeEvent = function(namespacedEvent) {
              var event = namespacedEvent && namespacedEvent.split(".")[0];
              var namespace = event && namespacedEvent.substring(event.length);

              Object.keys(events).forEach(function(bind) {
                  var tEvent = bind.split(".")[0];
                  var tNamespace = bind.substring(tEvent.length);

                  if ((!event || event === tEvent) && (!namespace || namespace === tNamespace)) {
                      delete events[bind];
                  }
              });
          },
          // External event handling
          fireEvent = function(eventName, handleNumber, tap) {
              Object.keys(events).forEach(function(targetEvent) {
                  var eventType = targetEvent.split(".")[0];

                  if (eventName === eventType) {
                      events[targetEvent].forEach(function(callback) {
                          callback.call(
                              // Use the slider public API as the scope ('this')
                              self,
                              // Return values as array, so arg_1[arg_2] is always valid.
                              values.map(options.format.to),
                              // Handle index, 0 or 1
                              handleNumber,
                              // Un-formatted slider values
                              values.slice(),
                              // Event is fired by tap, true or false
                              tap || false,
                              // Left offset of the handle, in relation to the slider
                              locations.slice()
                          );
                      });
                  }
              });
          },
          // Split out the handle positioning logic so the Move event can use it, too
          checkHandlePosition = function(reference, handleNumber, to, lookBackward, lookForward, getValue) {
              // For sliders with multiple handles, limit movement to the other handle.
              // Apply the margin option by adding it to the handle positions.
              if (handles.length > 1 && !optEvents.unconstrained) {
                  if (lookBackward && handleNumber > 0) {
                      to = Math.max(to, reference[handleNumber - 1] + options.margin);
                  }

                  if (lookForward && handleNumber < handles.length - 1) {
                      to = Math.min(to, reference[handleNumber + 1] - options.margin);
                  }
              }

              // The limit option has the opposite effect, limiting handles to a
              // maximum distance from another. Limit must be > 0, as otherwise
              // handles would be unmovable.
              if (handles.length > 1 && options.limit) {
                  if (lookBackward && handleNumber > 0) {
                      to = Math.min(to, reference[handleNumber - 1] + options.limit);
                  }

                  if (lookForward && handleNumber < handles.length - 1) {
                      to = Math.max(to, reference[handleNumber + 1] - options.limit);
                  }
              }

              // The padding option keeps the handles a certain distance from the
              // edges of the slider. Padding must be > 0.
              if (options.padding) {
                  if (handleNumber === 0) {
                      to = Math.max(to, options.padding[0]);
                  }

                  if (handleNumber === handles.length - 1) {
                      to = Math.min(to, 100 - options.padding[1]);
                  }
              }

              to = spectrum.getStep(to);

              // Limit percentage to the 0 - 100 range
              to = limit(to);

              // Return false if handle can't move
              if (to === reference[handleNumber] && !getValue) {
                  return false;
              }

              return to;
          },
          // Uses slider orientation to create CSS rules. a = base value;
          inRuleOrder = function(v, a) {
              var o = options.ort;
              return (o ? a : v) + ", " + (o ? v : a);
          },
          // Parses value passed to .set method. Returns current value if not parse-able.
          resolveToValue = function(to, handleNumber) {
              // Setting with null indicates an 'ignore'.
              // Inputting 'false' is invalid.
              if (to === null || to === false || to === undefined) {
                  return locations[handleNumber];
              }

              // If a formatted number was passed, attempt to decode it.
              if (typeof to === "number") {
                  to = String(to);
              }

              to = options.format.from(to);
              to = spectrum.toStepping(to);

              // If parsing the number failed, use the current value.
              if (to === false || isNaN(to)) {
                  return locations[handleNumber];
              }

              return to;
          },
          toStepping = function(xVal, xPct, value) {
              if (value >= xVal.slice(-1)[0]) {
                  return 100;
              }
      
              var j = getJ(value, xVal);
              var va = xVal[j - 1];
              var vb = xVal[j];
              var pa = xPct[j - 1];
              var pb = xPct[j];
      
              return pa + toPercentage([va, vb], value) / subRangeRatio(pa, pb);
          },
          // (value) Input a percentage, find where it is on the specified range.
          fromStepping = function(xVal, xPct, value) {
              // There is no range group that fits 100
              if (value >= 100) {
                  return xVal.slice(-1)[0];
              }

              var j = getJ(value, xPct);
              var va = xVal[j - 1];
              var vb = xVal[j];
              var pa = xPct[j - 1];
              var pb = xPct[j];

              return isPercentage([va, vb], (value - pa) * subRangeRatio(pa, pb));
          },
          subRangeRatio = function(pa, pb) {
              return 100 / (pb - pa);
          },
          // (percentage) How many percent is this value of this range?
          fromPercentage = function(range, value) {
              return (value * 100) / (range[1] - range[0]);
          },
          // (percentage) Where is this value on this range?
          toPercentage = function(range, value) {
              return fromPercentage(range, range[0] < 0 ? value + Math.abs(range[0]) : value - range[0]);
          },
          // (percentage) Get the step that applies at a certain value.
          getStep = function(xPct, xSteps, snap, value) {
              
              if (value === 100) {
                  return value;
              }

              var j = getJ(value, xPct);
              var a = xPct[j - 1];
              var b = xPct[j];

              // If 'snap' is set, steps are used as fixed points on the slider.
              if (snap) {
                  // Find the closest position, a or b.
                  if (value - a > (b - a) / 2) {
                      return b;
                  }

                  return a;
              }

              if (!xSteps[j - 1]) {
                  return value;
              }

              return xPct[j - 1] + closest(value - xPct[j - 1], xSteps[j - 1]);
          },
          handleEntryPoint = function(index, value, that) {
              var percentage;
      
              // Wrap numerical input in an array.
              if (typeof value === "number") {
                  value = [value];
              }
      
              // Reject any invalid input, by testing whether value is an array.
              if (!isArray(value)) {
                  throw new Error("Slider 'range' contains invalid value.");
              }
      
              // Covert min/max syntax to 0 and 100.
              if (index === "min") {
                  percentage = 0;
              } else if (index === "max") {
                  percentage = 100;
              } else {
                  percentage = parseFloat(index);
              }
      
              // Check for correct input.
              if (!isNumeric(percentage) || !isNumeric(value[0])) {
                  throw new Error("Slider 'range' value isn't numeric.");
              }
      
              // Store values.
              that.xPct.push(percentage);
              that.xVal.push(value[0]);
      
              // NaN will evaluate to false too, but to keep
              // logging clear, set step explicitly. Make sure
              // not to override the 'step' setting with false.
              if (!percentage) {
                  if (!isNaN(value[1])) {
                      that.xSteps[0] = value[1];
                  }
              } else {
                  that.xSteps.push(isNaN(value[1]) ? false : value[1]);
              }
      
              that.xHighestCompleteStep.push(0);
          },
          handleStepPoint = function(i, n, that) {
              // Ignore 'false' stepping.
              if (!n) {
                  return;
              }
      
              // Step over zero-length ranges (#948);
              if (that.xVal[i] === that.xVal[i + 1]) {
                  that.xSteps[i] = that.xHighestCompleteStep[i] = that.xVal[i];
      
                  return;
              }
      
              // Factor to range ratio
              that.xSteps[i] =
                  fromPercentage([that.xVal[i], that.xVal[i + 1]], n) / subRangeRatio(that.xPct[i], that.xPct[i + 1]);
      
              var totalSteps = (that.xVal[i + 1] - that.xVal[i]) / that.xNumSteps[i];
              var highestStep = Math.ceil(Number(totalSteps.toFixed(3)) - 1);
              var step = that.xVal[i] + that.xNumSteps[i] * highestStep;
      
              that.xHighestCompleteStep[i] = step;
          },
          // Checks whether a value is numerical.
          isNumeric = function(a) {
              return typeof a === "number" && !isNaN(a) && isFinite(a);
          },
          // (value) How much is this percentage on this range?
          isPercentage = function(range, value) {
              return (value * (range[1] - range[0])) / 100 + range[0];
          },
          getJ = function(value, arr) {
              
              var j = 1;
      
              while (value >= arr[j]) {
                  j += 1;
              }
      
              return j;
          },
          // Shorthand for base dimensions.
          baseSize = function() {
              var rect = sliderBase.getBoundingClientRect();
              var alt = "offset" + ["Width", "Height"][options.ort];
              return options.ort === 0 ? rect.width || sliderBase[alt] : rect.height || sliderBase[alt];
          },
          // Handler for attaching events trough a proxy.
          attachEvent = function(events, element, callback, data) {
              // This function can be used to 'filter' events to the slider.
              // element is a node, not a nodeList

              var method = function(e) {
                  e = fixEvent(e, data.pageOffset, data.target || element);

                  // fixEvent returns false if this event has a different target
                  // when handling (multi-) touch events;
                  if (!e) {
                      return false;
                  }

                  // doNotReject is passed by all end events to make sure released touches
                  // are not rejected, leaving the slider "stuck" to the cursor;
                  if (isSliderDisabled() && !data.doNotReject) {
                      return false;
                  }

                  // Stop if an active 'tap' transition is taking place.
                  if (slider.classList.contains(prefix + "slider-tap") && !data.doNotReject) {
                      return false;
                  }

                  // Ignore right or middle clicks on start #454
                  if (events === actions.start && e.buttons !== undefined && e.buttons > 1) {
                      return false;
                  }

                  // Ignore right or middle clicks on start #454
                  if (data.hover && e.buttons) {
                      return false;
                  }

                  // 'supportsPassive' is only true if a browser also supports touch-action: none in CSS.
                  // iOS safari does not, so it doesn't get to benefit from passive scrolling. iOS does support
                  // touch-action: manipulation, but that allows panning, which breaks
                  // sliders after zooming/on non-responsive pages.
                  // See: https://bugs.webkit.org/show_bug.cgi?id=133112
                  if (!supportsPassive) {
                      e.preventDefault();
                  }

                  e.calcPoint = e.points[options.ort];

                  // Call the event handler with the event [ and additional data ].
                  callback(e, data);
              };

              var methods = [];

              // Bind a closure on the target for every event type.
              events.split(" ").forEach(function(eventName) {
                  element.addEventListener(eventName, method, supportsPassive ? { passive: true } : false);
                  methods.push([eventName, method]);
              });

              return methods;
          },
          // Provide a clean event with standardized offset values.
          fixEvent = function(e, pageOffset, eventTarget) {
              // Filter the event to register the type, which can be
              // touch, mouse or pointer. Offset changes need to be
              // made on an event specific basis.
              var touch = e.type.indexOf("touch") === 0;
              var mouse = e.type.indexOf("mouse") === 0;
              var pointer = e.type.indexOf("pointer") === 0;

              var x;
              var y;

              // The only thing one handle should be concerned about is the touches that originated on top of it.
              if (touch) {
                  // Returns true if a touch originated on the target.
                  var isTouchOnTarget = function(checkTouch) {
                      return checkTouch.target === eventTarget || eventTarget.contains(checkTouch.target);
                  };

                  // In the case of touchstart events, we need to make sure there is still no more than one
                  // touch on the target so we look amongst all touches.
                  if (e.type === "touchstart") {
                      var targetTouches = Array.prototype.filter.call(e.touches, isTouchOnTarget);

                      // Do not support more than one touch per handle.
                      if (targetTouches.length > 1) {
                          return false;
                      }

                      x = targetTouches[0].pageX;
                      y = targetTouches[0].pageY;
                  } else {
                      // In the other cases, find on changedTouches is enough.
                      var targetTouch = Array.prototype.find.call(e.changedTouches, isTouchOnTarget);

                      // Cancel if the target touch has not moved.
                      if (!targetTouch) {
                          return false;
                      }

                      x = targetTouch.pageX;
                      y = targetTouch.pageY;
                  }
              }

              pageOffset = pageOffset || getPageOffset(DOC);

              if (mouse || pointer) {
                  x = e.clientX + pageOffset.x;
                  y = e.clientY + pageOffset.y;
              }

              e.pageOffset = pageOffset;
              e.points = [x, y];
              e.cursor = mouse || pointer; // Fix #435

              return e;
          },
          // Translate a coordinate in the document to a percentage on the slider
          calcPointToPercentage = function(calcPoint) {
              var location = calcPoint - offset(sliderBase, options.ort);
              var proposal = (location * 100) / baseSize();

              // Clamp proposal between 0% and 100%
              proposal = limit(proposal);

              return options.dir ? 100 - proposal : proposal;
          },
          // Find handle closest to a certain percentage on the slider
          getClosestHandle = function(proposal) {
              var closest = 100;
              var handleNumber = false;

              handles.forEach(function(handle, index) {
                  // Disabled handles are ignored
                  if (isHandleDisabled(index)) {
                      return;
                  }

                  var pos = Math.abs(locations[index] - proposal);

                  if (pos < closest || (pos === 100 && closest === 100)) {
                      handleNumber = index;
                      closest = pos;
                  }
              });

              return handleNumber;
          },
          removeTooltips = function() {
              if (tooltips) {
                  removeEvent("update.tooltips");
                  tooltips.forEach(function(tooltip) {
                      if (tooltip) {
                          removeElement(tooltip);
                      }
                  });
                  tooltips = null;
              }
          },
          // The tooltips option is a shorthand for using the 'update' event.
          setTooltips = function() {
              removeTooltips();

              // Tooltips are added with options.tooltips in original order.
              tooltips = handles.map(addTooltip);

              bindEvent("update.tooltips", function(values, handleNumber, unencoded) {
                  if (!tooltips[handleNumber]) {
                      return;
                  }

                  var formattedValue = values[handleNumber];

                  if (options.tooltips[handleNumber] !== true) {
                      formattedValue = options.tooltips[handleNumber].to(unencoded[handleNumber]);
                  }

                  tooltips[handleNumber].innerHTML = formattedValue;
              });

              // Fix for vertical sliders, if tooltip flows off the window move it the right side.
              if (options.ort == 1 &&
                  offWindowLeft(handles[0].querySelector("." + prefix + "slider-tooltip"), handles[0].querySelector("div."+prefix+"slider-handle"))) {
                  each(handles, function(handle) {
                      handle.querySelector("." + prefix + "slider-tooltip").style.right = "auto";
                      handle.querySelector("." + prefix + "slider-tooltip").style.left = "120%";
                  });
              }
          },
          aria = function() {
              bindEvent("update", function(values, handleNumber, unencoded, tap, positions) {
                  // Update Aria Values for all handles, as a change in one changes min and max values for the next.
                  handleNumbers.forEach(function(index) {
                      var handle = handles[index];

                      var min = checkHandlePosition(locations, index, 0, true, true, true);
                      var max = checkHandlePosition(locations, index, 100, true, true, true);

                      var now = positions[index];

                      // Formatted value for display
                      var text = options.ariaFormat.to(unencoded[index]);

                      // Map to slider range values
                      min = spectrum.fromStepping(min).toFixed(options.percision);
                      max = spectrum.fromStepping(max).toFixed(options.percision);
                      now = spectrum.fromStepping(now).toFixed(options.percision);
                      
                      handle.children[0].setAttribute("aria-valuemin", min);
                      handle.children[0].setAttribute("aria-valuemax", max);
                      handle.children[0].setAttribute("aria-valuenow", now);
                      handle.children[0].setAttribute("aria-valuetext", text);
                  });
              });
          },
          // Get the slider value.
          get = function() {
              var v = values.map(options.format.to);

              // If only one handle is used, return a single value.
              if (v.length === 1) {
                  return values[0];
              }

              return v;
          },
          removeElement = function(el) {
              el.parentElement.removeChild(el);
          },
          getPageOffset = function(doc) {
              var supportPageOffset = window.pageXOffset !== undefined;
              var isCSS1Compat = (doc.compatMode || "") === "CSS1Compat";
              var x = supportPageOffset
                  ? window.pageXOffset
                  : isCSS1Compat
                      ? doc.documentElement.scrollLeft
                      : doc.body.scrollLeft;
              var y = supportPageOffset
                  ? window.pageYOffset
                  : isCSS1Compat
                      ? doc.documentElement.scrollTop
                      : doc.body.scrollTop;

              return {
                  x: x,
                  y: y
              };
          },
          // we provide a function to compute constants instead
          // of accessing window.* as soon as the module needs it
          // so that we do not compute anything if not needed
          getActions = function() {
              // Determine the events to bind. IE11 implements pointerEvents without
              // a prefix, which breaks compatibility with the IE10 implementation.
              return window.navigator.pointerEnabled
                  ? {
                      start: "pointerdown",
                      move: "pointermove",
                      end: "pointerup"
                  }
                  : window.navigator.msPointerEnabled
                      ? {
                          start: "MSPointerDown",
                          move: "MSPointerMove",
                          end: "MSPointerUp"
                      }
                      : {
                          start: "mousedown touchstart",
                          move: "mousemove touchmove",
                          end: "mouseup touchend"
                      };
          };
          
      function Spectrum(entry, snap, singleStep) {
          this.xPct = [];
          this.xVal = [];
          this.xSteps = [singleStep || false];
          this.xNumSteps = [false];
          this.xHighestCompleteStep = [];
      
          this.snap = snap;
      
          var index;
          var ordered = []; // [0, 'min'], [1, '50%'], [2, 'max']
      
          // Map the object keys to an array.
          for (index in entry) {
              if (Object.prototype.hasOwnProperty.call(entry, index)) {
                  ordered.push([entry[index], index]);
              }
          }
      
          // Sort all entries by value (numeric sort).
          if (ordered.length && typeof ordered[0][0] === "object") {
              ordered.sort(function(a, b) {
                  return a[0][0] - b[0][0];
              });
          } else {
              ordered.sort(function(a, b) {
                  return a[0] - b[0];
              });
          }
      
          // Convert all entries to subranges.
          for (index = 0; index < ordered.length; index++) {
              handleEntryPoint(ordered[index][1], ordered[index][0], this);
          }
      
          // Store the actual step values.
          // xSteps is sorted in the same order as xPct and xVal.
          this.xNumSteps = this.xSteps.slice(0);
      
          // Convert all numeric steps to the percentage of the subrange they represent.
          for (index = 0; index < this.xNumSteps.length; index++) {
              handleStepPoint(index, this.xNumSteps[index], this);
          }
      }

      Spectrum.prototype.getMargin = function(value) {
          var step = this.xNumSteps[0];
      
          if (step && (value / step) % 1 !== 0) {
              throw new Error("Slider 'limit', 'margin' and 'padding' must be divisible by step.");
          }
      
          return this.xPct.length === 2 ? fromPercentage(this.xVal, value) : false;
      };
      
      Spectrum.prototype.toStepping = function(value) {
          value = toStepping(this.xVal, this.xPct, value);
      
          return value;
      };
      
      Spectrum.prototype.fromStepping = function(value) {
          return fromStepping(this.xVal, this.xPct, value);
      };
      
      Spectrum.prototype.getStep = function(value) {
          value = getStep(this.xPct, this.xSteps, this.snap, value);
      
          return value;
      };
      
      Spectrum.prototype.getDefaultStep = function(value, isDown, size) {
          var j = getJ(value, this.xPct);
      
          // When at the top or stepping down, look at the previous sub-range
          if (value === 100 || (isDown && value === this.xPct[j - 1])) {
              j = Math.max(j - 1, 1);
          }
      
          return (this.xVal[j] - this.xVal[j - 1]) / size;
      };
      
      Spectrum.prototype.getNearbySteps = function(value) {
          var j = getJ(value, this.xPct);
      
          return {
              stepBefore: {
                  startValue: this.xVal[j - 2],
                  step: this.xNumSteps[j - 2],
                  highestStep: this.xHighestCompleteStep[j - 2]
              },
              thisStep: {
                  startValue: this.xVal[j - 1],
                  step: this.xNumSteps[j - 1],
                  highestStep: this.xHighestCompleteStep[j - 1]
              },
              stepAfter: {
                  startValue: this.xVal[j],
                  step: this.xNumSteps[j],
                  highestStep: this.xHighestCompleteStep[j]
              }
          };
      };
      
      Spectrum.prototype.countStepDecimals = function() {
          var stepDecimals = this.xNumSteps.map(countDecimals);
          return Math.max.apply(null, stepDecimals);
      };
      
      // Outside testing
      Spectrum.prototype.convert = function(value) {
          return this.getStep(this.toStepping(value));
      };

      // init
      if (!(stringSlider in element)) {
          validateOptions();
          
          if (options.ort == 1) {
              element.classList.add(prefix+"align-items-center");
          }
          if (options.content) {
              addContent();
          }
          
          addContainer();

          actions = getActions();

          slider = element.querySelector("." + prefix + "slider-target");
          sliderBase = addSlider();
          addElements();

          // Attach user events.
          bindSliderEvents(optEvents);

          // Use the public value method to set the start values.
          valueSet(options.start);

          if (options.tooltips) {
              setTooltips();
          }

          aria();

          bindEvent("end", endEventHandler);

          addLabels();

          for (var i = 0; i < handles.length; i++) {
              handles[i].firstChild.addEventListener("focus", focusEventHandler, false);
              handles[i].firstChild.addEventListener("blur", blurEventHandler, false);
              handles[i].addEventListener("keyup", endEventHandler, false);
          }
          element.addEventListener("click", endEventHandler, false);
      }

      element[stringSlider] = self;

  }

  function Tab(element, options) {

      element = element instanceof HTMLElement ? element : (function() {
          return false;
      })();

      options = options || {};
      options = jsonOptionsInit(element, options);
      options.lazyload = typeof options.lazyload === "boolean" ? options.lazyload : false;

      var self = this,
          stringTab = "Tab",
          tablist,
          activeTab = null,
          modalElement,
          withinModal,
          tabs,
          backButton,
          panels,
          delay,
          nested = false,
          focusableEls,
          thresholdMediaSize,
          tabContainer,
          accordionWrapper,
          smallMediaSize = window.matchMedia("(max-width: 767.98px)"),
          overflow,
          overflowContainer;

      // Key mappings for easy reference
      var keys = {
          end: 35,
          home: 36,
          left: 37,
          up: 38,
          right: 39,
          down: 40,
          delete: 46
      };

      // Add or substract depending on key pressed
      var direction = {
              37: -1,
              38: -1,
              39: 1,
              40: 1
          },
          handleOverflowEvent = function(e) {
              overflow.detail = e.detail;
          },
          setFocusableElements = function() {
              focusableEls = getFocusableElements(modalElement);
              modalElement.firstFocusableEl = focusableEls[0];
              modalElement.lastFocusableEl = focusableEls[ focusableEls.length - 1 ];
          },
          handleBackwardTab = function (e) {
              if ( document.activeElement === modalElement.firstFocusableEl ) {
                  e.preventDefault();
                  setFocus(modalElement.lastFocusableEl);
              }
          },
          handleForwardTab = function (e) {
              if ( document.activeElement === modalElement.lastFocusableEl ) {
                  e.preventDefault();
                  setFocus(modalElement.firstFocusableEl);
              }
          },
          handleModalKeydown = function(e) {
              var KEY_TAB = 9;
              var KEY_ESC = 27;
              switch(e.keyCode) {
              case KEY_TAB:
                  if ( focusableEls.length === 1 ) {
                      e.preventDefault();
                      break;
                  }
                  if ( e.shiftKey ) {
                      handleBackwardTab(e);
                  } else {
                      handleForwardTab(e);
                  }
                  break;
              case KEY_ESC: 
                  self.hide();
                  setFocus(activeTab);
                  break;
              }
          },
          // When a tab is clicked, activateTab is fired to activate it
          clickEventListener = function(e) {
              var target = e.target;
              if (target === element && modalElement && !(modalElement.classList.contains(prefix + "show"))) {
                  e.preventDefault();
              }
              self.show();
              activeTab = getClosest(target, "." + prefix + "tab-link");
              activateTab(activeTab, false);
          },
          // Handle keydown on tabs
          keydownEventListener = function(e) {
              var key = e.keyCode;

              switch (key) {
              case keys.end:
                  e.preventDefault();
                  // Activate last tab
                  if (overflow) {
                      overflow.clickEnd();
                  }
                  activateTab(tabs[tabs.length - 1]);
                  break;
              case keys.home:
                  e.preventDefault();
                  if (overflow) {
                      overflow.clickHome();
                  }
                  // Activate first tab
                  activateTab(tabs[0]);
                  break;

              // Up, down, left, and right keys are in keydown
              // because we need to prevent page scroll
              case keys.up:
              case keys.down:
                  determineOrientation(e);
                  break;
              case keys.left:
              case keys.right:
                  determineOrientation(e);
                  break;
              }
          },
          // Handle keyup on tabs
          keyupEventListener = function(e) {
              var key = e.keyCode;

              switch (key) {
              case keys.delete:
                  determineDeletable(e);
                  break;
              }
          },
          // When a tablist's aria-orientation is set to vertical,
          // only up and down arrow should function.
          // In all other cases only left and right arrow function.
          determineOrientation = function(e) {
              var key = e.keyCode;
              var vertical = tablist.getAttribute("aria-orientation") == "vertical";
              var proceed = false;

              if (vertical) {
                  if (key === keys.up || key === keys.down) {
                      e.preventDefault();
                      proceed = true;
                  }
              }
              else {
                  if (key === keys.left || key === keys.right) {
                      e.preventDefault();
                      proceed = true;
                  }
              }

              if (proceed) {
                  switchTabOnArrowPress(e);
              }
          },
          // Find first parent of el with role="tablist"
          getParentTablist = function(el) {
              var role = "tablist";
              while (el && el.parentNode) {
                  el = el.parentNode;
                  if (el.getAttribute("role") && el.getAttribute("role") == role) {
                      return el;
                  }
              }
              return null;
          },
          // Get all siblings of el with class="dds__tab-link"
          getSiblingTabs = function() {
              var siblingTabs = tablist.querySelectorAll("." + prefix + "tab-link");
              for (var i = 0; i < siblingTabs.length; i++) {
                  siblingTabs[i].index = i;
              }
              return siblingTabs;
          },
          getTablistPanels = function(tab) {
              var controls = tab.getAttribute("aria-controls");
              var panelGroup = document.getElementById(controls).parentElement;
              var siblingPanels = panelGroup.children;

              return siblingPanels;

          },
          // Either focus the next, previous, first, or last tab
          // depening on key pressed
          switchTabOnArrowPress = function(e) {
              var pressed = e.keyCode;
              each (tabs, function(tab) {
                  tab.addEventListener("focus", focusEventHandler);
              });

              if (direction[pressed]) {
                  var target = e.target;
                  if (target.index !== undefined) {
                  
                      if (tabs[target.index + direction[pressed]]) {
                          var targetTab = target.index + direction[pressed];
                          if (overflow) {
                              if (targetTab < overflow.detail.left) {
                                  overflow.clickLeft();
                              } else if (targetTab > overflow.detail.right) {
                                  overflow.clickRight();
                              }
                          } 
                          setTimeout(function() {
                              setFocus(tabs[targetTab]);
                          }, 125);
                      }
                      else if (pressed === keys.left || pressed === keys.up) {
                          if (overflow) overflow.clickEnd();
                          focusLastTab();
                      }
                      else if (pressed === keys.right || pressed == keys.down) {
                          if (overflow) overflow.clickHome();
                          focusFirstTab();
                      }
                  }
              }
          },
          // Activates any given tab panel
          activateTab = function(tab, needsFocus) {
              needsFocus = needsFocus || true;

              // Deactivate all other tabs
              deactivateTabs(tab);

              // Remove tabindex attribute
              tab.removeAttribute("tabindex");

              // Set the tab as selected
              tab.setAttribute("aria-selected", "true");

              // Get the value of aria-controls (which is an ID)
              var controls = tab.getAttribute("aria-controls");

              tab.classList.add(prefix + "active");

              // Remove hidden attribute from tab panel to make it visible
              // document.getElementById(controls).removeAttribute('hidden');
              document.getElementById(controls).classList.add(prefix + "active");
              document.getElementById(controls).classList.add(prefix + "show");

              // Set focus when required
              if (needsFocus) {
                  setFocus(tab);
              }
          },
          // Deactivate all tabs and tab panels
          deactivateTabs = function(tab) {
              panels = getTablistPanels (tab);
              each (tabs, function(tab) {
                  tab.setAttribute("tabindex", "-1");
                  tab.setAttribute("aria-selected", "false");
                  tab.removeEventListener("focus", focusEventHandler);
                  tab.classList.remove(prefix + "active");
                  tab.classList.remove(prefix + "show");
              });

              each (panels, function(panel) {
                  // panel.setAttribute('hidden', 'hidden');
                  panel.classList.remove(prefix + "active");
                  panel.classList.remove(prefix + "show");
              });
          },
          // Make a guess
          focusFirstTab = function() {
              setFocus(tabs[0]);
          },
          // Make a guess
          focusLastTab = function() {
              setFocus(tabs[tabs.length - 1]);
          },
          // Detect if a tab is deletable
          determineDeletable = function(e) {
              var target = e.target;

              if (target.getAttribute("data-deletable") !== null) {
                  // Delete target tab
                  deleteTab(e);

                  // Update arrays related to tabs widget
                  // generateArrays();

                  // Activate the closest tab to the one that was just deleted
                  if (target.index - 1 < 0) {
                      activateTab(tabs[0]);
                  }
                  else {
                      activateTab(tabs[target.index - 1]);
                  }
              }
          },
          // Deletes a tab and its panel
          deleteTab = function(e) {
              var target = e.target;
              var panel = document.getElementById(target.getAttribute("aria-controls"));

              target.parentElement.removeChild(target);
              panel.parentElement.removeChild(panel);
          },
          // Determine whether there should be a delay
          // when user navigates with the arrow keys
          determineDelay = function() {
              var hasDelay = tablist.hasAttribute("data-delay");
              var delay = 0;

              if (hasDelay) {
                  var delayValue = tablist.getAttribute("data-delay");
                  if (delayValue) {
                      delay = delayValue;
                  }
                  else {
                      // If no value is specified, default to 300ms
                      delay = 300;
                  }
              }

              return delay;
          },
          //
          focusEventHandler = function(e) {
              var target = e.target;

              setTimeout(checkTabFocus, delay, target);
          },
          // Only activate tab on focus if it still has focus after the delay
          checkTabFocus = function(target) {
              var focused = document.activeElement;

              if (target === focused) {
                  activateTab(target, false);
              }
          },
          // triggers
          triggerShow = function() {
              setFocus(modalElement);
          },
          triggerHide = function() {
              modalElement.style.display = "";
          },
          createModal = function() {
              var modalBody = modalElement.querySelector("." + prefix+ "modal-body");
              
              tabContainer = getClosest(tablist, "." + prefix + "tabs-container");
              var tabContentContainer;
              if (overflowContainer) {
                  tabContentContainer = getClosest(tabContainer,"." + prefix + "tab-content", false);
              } else {
                  tabContentContainer = tabContainer.querySelector("." + prefix + "tab-content");
              }

              if (modalBody.firstElementChild) {
                  tabContentContainer.appendChild(modalBody.firstElementChild);
              }
              var tab = getClosest(event.target, "." + prefix+ "tab-link");
              var controls = tab.getAttribute("aria-controls");
              var tabContent = document.getElementById(controls);

              setTimeout(function() {
                  modalBody.appendChild(tabContent);
              }, 50);
          },
          dismissHandler = function(e) {
              if (modalElement.classList.contains(prefix + "show")) {
                  self.hide();
                  e.preventDefault();
                  setFocus(activeTab);
              }
          },
          resizeHandler = function(){
              if (!smallMediaSize.matches && modalElement.classList.contains(prefix + "show")) {
                  self.hide();
              }
          }, 
          createAccordions = function() {
              accordionWrapper = createElement("div", {
                  class: prefix + "accordion " + prefix + "mb-3",
                  id: tabs[0].id + "parent"
              });
              tabContainer.parentElement.insertBefore(accordionWrapper, tabContainer);
              each(tabs, function(tab) {
                  var card = createElement("div", {
                      class: prefix + "accordion-card"
                  });
                  var cardHeader = createElement("div", {
                      class: prefix + "accordion-card-header"
                  });
                  var h5 = createElement("h5", {
                      class: prefix + "mb-0"
                  });
                  var accordionBtn = createElement("button", {
                      class: prefix + "accordion-btn " + prefix + "collapsed " + prefix + "d-flex",
                      type: "button",
                      role: "button",
                      data_toggle: prefix + "collapse",
                      data_target: "#" + tab.id + "accord", //Need to create IDs
                      data_parent: "#" + tabs[0].id + "parent",
                      aria_controls: tab.id + "accord",
                      aria_expanded: "false"
                  });
                  var chevron = createElement("i", {
                      class: prefix + "icons " + prefix + "chevron-right",
                      aria_hidden: "true"
                  });
                  var accordionSpan = createElement("span", {
                      class: prefix + "mx-2",
                      html: tab.innerText,
                      id: tab.id + "header"
                  });

                  accordionBtn.appendChild(chevron);
                  accordionBtn.appendChild(accordionSpan);
                  h5.appendChild(accordionBtn);
                  cardHeader.appendChild(h5);
                  card.appendChild(cardHeader);
                  accordionWrapper.appendChild(card);
                  var cardBodyWrapper = createElement("div", {
                      id: tab.id + "accord",
                      class: prefix + "collapse",
                      aria_labelledby: tab.id + "header",
                      role: "region",
                      aria_expanded: "false"
                  });
                  var cardBody = createElement("div", {
                      class: prefix + "accordion-card-body",
                      html: document.getElementById(tab.getAttribute("aria-controls")).innerHTML
                  });
                  card.appendChild(cardBodyWrapper);
                  cardBodyWrapper.appendChild(cardBody);
              });
              each(withinModal.querySelectorAll("[data-toggle='" + prefix + "collapse" + "']"), function(accordion) {
                  new Collapse(accordion);
              });
          },
          handleResizeSmall = function() {
              if (thresholdMediaSize.matches) {
                  var activeTab = tabContainer.querySelector("[aria-selected='true']");
                  var sisterCollapseStr = activeTab.getAttribute("id") + "accord";
                  var activateCollapse = accordionWrapper.querySelector("[data-target='#" + sisterCollapseStr + "']");
                  if (activateCollapse && activateCollapse.classList.contains(prefix + "collapsed")) { //Need to Activate the collapse
                      var prevActivated = accordionWrapper.querySelector("button[aria-expanded='true']");
                      var showBlock;
                      if (prevActivated) {
                          prevActivated.setAttribute("aria-expanded", false);
                          prevActivated.classList.add(prefix + "collapsed");
                          showBlock = getClosest(prevActivated, ".dds__collapse", false);
                          showBlock.classList.remove(prefix + "show");
                          showBlock.setAttribute("aria-expanded", "false");
                      }
                      activateCollapse.setAttribute("aria-expanded", true);
                      activateCollapse.classList.remove(prefix + "collapsed");
                      showBlock = getClosest(activateCollapse, ".dds__collapse", false);
                      showBlock.classList.add(prefix + "show");
                      showBlock.setAttribute("aria-expanded", "true");
                  }
                  accordionWrapper.classList.remove(prefix + "d-none");
                  tabContainer.classList.add(prefix + "d-none");

              } else {
                  var activeCollapse = accordionWrapper.querySelector("button[aria-expanded='true']");
                  if (activeCollapse) {
                      var sisterTabStr = activeCollapse.getAttribute("aria-controls").slice(0,-6);
                      var tabToActivate = document.getElementById(sisterTabStr);
                      activateTab(tabToActivate);
                  }
                  accordionWrapper.classList.add(prefix + "d-none");
                  tabContainer.classList.remove(prefix + "d-none");
              }
          };

      this.show = function() {
          if (window.innerWidth > 767.98) {
              return;
          }
          createModal();
          modalElement.style.display = "block";
          //modalElement.classList.remove(prefix + "slide-right");
          modalElement.setAttribute("aria-hidden", false);
          triggerShow();
          modalElement.classList.add(prefix + "show");

          if (isSafari && isIOS) {
              modalElement.classList.add(prefix + "is-safari");
          }

          if (DOC.body.classList.contains(prefix + "modal-open")) {
              nested = true;
          } else {
              DOC.body.classList.add(prefix + "modal-open");
              nested = false;
          }

          backButton = modalElement && modalElement.querySelector("[data-dismiss='"+prefix+"modal']");
          backButton.addEventListener("click", dismissHandler, false);
          smallMediaSize.addListener(resizeHandler);
          setTimeout(function() {
              setFocusableElements();
              setFocus(backButton);
          }, 50);
          modalElement.addEventListener("keydown", handleModalKeydown);
      };

      this.hide = function() {
          //Need to append tab content back to tabContentContainer
          var modalBody = modalElement.querySelector("." + prefix+ "modal-body");
          // var tabContainer = getClosest(tablist, "." + prefix + "tabs-container", true);
          var tabContainer = getClosest(tablist, "." + prefix + "tabs-container");
          var tabContentContainer;
          if (overflowContainer) {
              tabContentContainer = getClosest(tabContainer,"." + prefix + "tab-content", false);
          } else {
              tabContentContainer = tabContainer.querySelector("." + prefix + "tab-content");
          }
          if (modalBody.firstElementChild) {
              tabContentContainer.appendChild(modalBody.firstElementChild);
          }
          modalElement.classList.add(prefix + "slide-right");
          modalElement.classList.remove(prefix + "show");
          modalElement.setAttribute("aria-hidden", true);
          if (isSafari && isIOS && modalElement.classList.contains(prefix + "is-safari")) {
              modalElement.classList.remove(prefix + "is-safari");
          }
          smallMediaSize.removeListener(resizeHandler);
          setTimeout(function() {
              triggerHide();
              if (!nested) {
                  DOC.body.classList.remove(prefix + "modal-open");
              } 
              backButton.removeEventListener("click", dismissHandler, false);
          }, 200);
          modalElement.removeEventListener("keydown", handleModalKeydown);
      };

      this.lazyLoad = function() {
          if (options.lazyload && overflow && !overflow.detail) {
              overflow.lazyLoad();
              overflow.detail = overflow.getCurrentDetails();
              overflowContainer.addEventListener("uicOverflowChangeEvent", handleOverflowEvent, false);
              uicoreCustomEvent("Tab", "LazyLoadEvent", element, {"success": true});
          }
          else {
              uicoreCustomEvent("Tab", "LazyLoadEvent", element, {"success": false, "msg": "Tab cannot be lazy loaded. Check usage or avoid mulitple lazy loads."});
          }
      };

      // init
      if (!(stringTab in element)) {
          tablist = getParentTablist(element);
          modalElement = element.dataset["target"] && DOC.getElementById(element.dataset["target"].substr(1));
          delay = determineDelay();
          tabs = getSiblingTabs();
          // prevent adding event handlers twice
          element.addEventListener("keydown", keydownEventListener);
          element.addEventListener("keyup", keyupEventListener);
          element.addEventListener("click", clickEventListener);
          overflowContainer = getClosest(element, "." + prefix + "container-overflow");
          if (overflowContainer) {
              if (!("overflow" in tablist)) {
                  overflow = new Overflow(overflowContainer, {
                      lazyload: options.lazyload
                  });
                  if (!options.lazyload) {
                      overflow.detail = overflow.getCurrentDetails();
                      overflowContainer.addEventListener("uicOverflowChangeEvent", handleOverflowEvent);
                  }
                  tablist["overflow"] = overflow;
              } else {
                  overflow = tablist["overflow"];
              }
          }
          tabContainer = getClosest(tablist, "." + prefix + "tabs-container");
          withinModal = getClosest(element, "." + prefix + "modal-offcanvas", true);
          if (withinModal) { //check if tabs are within Modal
              var accordionExist = withinModal.querySelector("#" + element.id + "accord"); //check if accordions already been made
              if (!accordionExist) {
                  createAccordions();
                  if (withinModal.classList.contains(prefix + "modal-width-25")) {
                      thresholdMediaSize = window.matchMedia("(max-width: 3071.92px)"); //3071.92*0.25 = 767.98
                  } else if (withinModal.classList.contains(prefix + "modal-width-50")) {
                      thresholdMediaSize = window.matchMedia("(max-width: 1535.96px)"); //1535.96*0.5 = 767.98
                  } else if (withinModal.classList.contains(prefix + "modal-width-75")) {
                      thresholdMediaSize = window.matchMedia("(max-width: 1023.97px)"); //3071.92*0.25 = 767.98
                  } else {
                      thresholdMediaSize = window.matchMedia("(max-width: 767.98px)");
                  }
                  thresholdMediaSize.addListener(handleResizeSmall);
                  handleResizeSmall();
              }
          }
      }
      
      element[stringTab] = self;
  }

  /**
   * Columns API
   * @param {Object} instance DataTable instance
   * @param {Mixed} columns  Column index or array of column indexes
   */
  function Columns(dt) {
      /**
       * Swap two columns
       * @return {Void}
       */
      this.swap = function(columns) {
          if (columns.length && columns.length === 2) {
              var cols = [];

              // Get the current column indexes
              each(dt.headings, function (h, i) {
                  cols.push(i);
              });

              var x = columns[0];
              var y = columns[1];
              var b = cols[y];
              cols[y] = cols[x];
              cols[x] = b;

              this.order(cols);
          }
      };

      /**
       * Reorder the columns
       * @return {Array} columns  Array of ordered column indexes
       */
      this.order = function(columns) {
              
          var a, b, c, d, h, s, cell,
              temp = [
                  [],
                  [],
                  [],
                  []
              ];

          // Order the headings
          each(columns, function (column, x) {
              h = dt.headings[column];
              s = h.getAttribute("data-sortable") !== "false";
              a = h.cloneNode(true);
              a.originalCellIndex = x;
              a.sortable = s;

              temp[0].push(a);

              if (dt.hiddenColumns.indexOf(column) < 0) {
                  b = h.cloneNode(true);
                  b.originalCellIndex = x;
                  b.sortable = s;

                  temp[1].push(b);
              }
          });

          // Order the row cells
          each(dt.data, function (row, i) {
              c = row.cloneNode();
              d = row.cloneNode();

              c.dataIndex = d.dataIndex = i;
              if(dt.expandable){
                  c.details = d.details = row.details;
              }

              
              if (row.searchIndex !== null && row.searchIndex !== undefined) {
                  c.searchIndex = d.searchIndex = row.searchIndex;
              }

              // Append the cell to the fragment in the correct order
              each(columns, function (column) {
                  cell = row.cells[column].cloneNode(true);
                  cell.data = row.cells[column].data;
                  c.appendChild(cell);
                  
                  if (dt.hiddenColumns.indexOf(column) < 0) {
                      cell = row.cells[column].cloneNode(true);
                      cell.data = row.cells[column].data;
                      d.appendChild(cell);
                  }
              });
              
              temp[2].push(c);
              temp[3].push(d);
          });

          dt.headings = temp[0];
          dt.activeHeadings = temp[1];

          each(dt.headings, function(header) {
              if (header.classList.contains("desc") || header.classList.contains("asc")) {
                  dt.lastTh = header;
              }
          });

          dt.data = temp[2];
          dt.activeRows = temp[3];
      };

      /**
       * Hide columns
       * @return {Void}
       */
      this.hide = function(columns) {
          if (columns.length) {
              each(columns, function (column) {
                  if (dt.hiddenColumns.indexOf(column) < 0) {
                      dt.hiddenColumns.push(column);
                  }
              });

              this.rebuild();
          }
      };

      /**
       * Show columns
       * @return {Void}
       */
      this.show = function(columns) {
          if (columns.length) {
              var index;

              each(columns, function (column) {
                  index = dt.hiddenColumns.indexOf(column);
                  if (index > -1) {
                      dt.hiddenColumns.splice(index, 1);
                  }
              });

              this.rebuild();
          }
      };

      /**
       * Check column(s) visibility
       * @return {Boolean}
       */
      this.visible = function(columns) {
          var cols;

          columns = columns || dt.headings.map(function (th) {
              return th.originalCellIndex;
          });

          if (!isNaN(columns)) {
              cols = dt.hiddenColumns.indexOf(columns) < 0;
          } else if (isArray(columns)) {
              cols = [];
              each(columns, function (column) {
                  cols.push(dt.hiddenColumns.indexOf(column) < 0);
              });
          }

          return cols;
      };

      /**
       * Add a new column
       * @param {Object} data
       */
      this.add = function(data) {
          var that = this,
              td, th = createElement("th");

          if (!dt.headings.length) {
              dt.insert({
                  headings: [data.heading],
                  rows: data.rows.map(function (i) {
                      return [i];
                  })
              });
              this.rebuild();
              return;
          }

          {
              if (data.heading.nodeName) {
                  th.appendChild(data.heading);
              } else {
                  th.innerHTML = data.heading;
              }
          }

          dt.headings.push(th);

          each(dt.data, function (row, i) {
              if (data.data[i]) {
                  td = createElement("td");

                  if (data.data[i].nodeName) {
                      td.appendChild(data.data[i]);
                  } else {
                      td.innerHTML = data.data[i];
                  }

                  td.data = td.innerHTML;

                  if (data.render) {
                      td.innerHTML = data.render.call(that, td.data, td, row);
                  }

                  row.appendChild(td);
              }
          });

          if (data.type) {
              th.setAttribute("data-type", data.type);
          }
          if (data.format) {
              th.setAttribute("data-format", data.format);
          }
          if (Object.prototype.hasOwnProperty.call(data, "sortable")) {
              th.sortable = data.sortable;
              th.setAttribute("data-sortable", data.sortable === true ? "true" : "false");
          }

          this.rebuild();

          dt.renderHeader();
      };

      /**
       * Remove column(s)
       * @param  {Array|Number} select
       * @return {Void}
       */
      this.remove = function(select) {
          if (isArray(select)) {
              // Remove in reverse otherwise the indexes will be incorrect
              select.sort(function (a, b) {
                  return b - a;
              });

              each(select, function (column) {
                  this.remove(column);
              }, this);
          } else {
              dt.headings.splice(select, 1);

              each(dt.data, function (row) {
                  row.removeChild(row.cells[select]);
              });
          }

          this.rebuild();
      };

      /**
       * Sort by column
       * @param  {int} column - The column no.
       * @param  {string} direction - asc or desc
       * @return {void}
       */
      this.sort = function(column, direction) {
          // Check column is present
          if (dt.hasHeadings && (column < 0 || column > dt.activeHeadings.length - 1 )) {
              return false;
          }
          
          dt.sorting = true;
          
          var rows = [],
              alpha = [],
              numeric = [],
              a = 0,
              n = 0,
              th = dt.activeHeadings[column];

          rows = dt.data;
          column = th.originalCellIndex;
          
          each(rows, function (tr) {
              var num, content;
              
              var cell = tr.cells[column];
              content = cell.hasAttribute("data-content") ? cell.getAttribute("data-content") : cell.data;
              num = content.replace(/(\$|,|\s|%)/g, "");
              
              if (th.getAttribute("data-type") === "date") {                
                  num = Date.parse(content);
                  if (num.isNaN) {
                      num = 0;
                  }
              }
              
              if (parseFloat(num) == num) {
                  numeric[n++] = {
                      value: Number(num),
                      row: tr
                  };
              } else {
                  alpha[a++] = {
                      value: content.toLowerCase(),
                      row: tr
                  };
              }

          });
          
          /* Sort according to direction (ascending or descending) */
          var top, btm;
          if (th.classList.contains("asc") || direction == "desc") {
              top = sortItems(alpha, -1);
              btm = sortItems(numeric, -1);
          } else {
              top = sortItems(numeric, 1);
              btm = sortItems(alpha, 1);

          }
          this.updateSortDirection(th, direction);
          
          dt.lastTh = th;
          
          /* Reorder the table */
          rows = top.concat(btm);
          dt.data = [];
          dt.selectedRows = [];
          var indexes = [];
              
          each(rows, function (v, i) {
              dt.data.push(v.row);

              if (v.row.searchIndex !== null && v.row.searchIndex !== undefined) {
                  indexes.push(i);
              }

          }, dt);
          
          dt.searchData = indexes;

          this.rebuild();
      };

      this.updateSortDirection = function(th, direction){
          if (th.classList.contains("asc") || direction == "desc") {
              // top = sortItems(alpha, -1);
              // btm = sortItems(numeric, -1);
              th.classList.remove("asc");
              th.classList.add( "desc");
              th.setAttribute("aria-sort","descending");
          } else {
              // top = sortItems(numeric, 1);
              // btm = sortItems(alpha, 1);
              th.classList.remove("desc");
              th.classList.add("asc");
              th.setAttribute("aria-sort","ascending");
          }

          if (dt.lastTh && th != dt.lastTh) {
              dt.lastTh.classList.remove("desc");
              dt.lastTh.classList.remove("asc");
          }
      };

      /**
       * Rebuild the columns
       * @return {Void}
       */
      this.rebuild = function() {
          var a, b, c, d, temp = [];

          dt.activeRows = [];
          dt.activeHeadings = [];

          each(dt.headings, function (th, i) {
              th.originalCellIndex = i;
              th.sortable = th.getAttribute("data-sortable") !== "false";
              if (dt.hiddenColumns.indexOf(i) < 0) {
                  dt.activeHeadings.push(th);
              
              } 
          });
          // Loop over the rows and reorder the cells
          each(dt.data, function (row, i) {
              a = row.cloneNode();
              b = row.cloneNode();

              a.dataIndex = b.dataIndex = i;
              a.details = b.details =  row.details;

              if (row.searchIndex !== null && row.searchIndex !== undefined) {
                  a.searchIndex = b.searchIndex = row.searchIndex;
              }

              // Append the cell to the fragment in the correct order
              each(row.cells, function (cell) {
                  c = cell.cloneNode(true);
                  c.data = cell.data;
                  a.appendChild(c);

                  if (dt.hiddenColumns.indexOf(cell.cellIndex) < 0) {
                      d = cell.cloneNode(true);
                      d.data = cell.data;
                      b.appendChild(d);
                  
                  }
              });

              // Append the fragment with the ordered cells
              temp.push(a);
              dt.activeRows.push(b);
          });
          
          dt.data = temp;
      };
  }

  /**
   * Rows API
   * @param {Object} instance DataTable instance
   * @param {Array} rows
   */
  function Rows(dt) {
      /**
       * Build a new row
       * @param  {Array} row
       * @return {HTMLElement}
       */
      this.build = function(row) {
          var td, tr = createElement("tr");

          var headings = dt.headings;

          if (!headings.length) {
              headings = row.map(function () {
                  return "";
              });
          }

          each(row, function(tdx) {
              if (tdx.indexOf("table-cmplx-accordion-btn") > -1 || tdx.indexOf("table-cmplx-row-select") > -1) {
                  td = createElement("tr");
                  td.innerHTML = tdx;
                  tr.appendChild(td.firstChild);
              } else {
                  td = createElement("td");
                  td.innerHTML = tdx;
                  td.data = tdx;
                  td.setAttribute("data-content", getText(tdx));
                  tr.appendChild(td);
              }
          });

          if (row.details) {
              tr.details = row.details;
          }
          return tr;
      };

      this.render = function(row) {
          return row;
      };

      /**
       * Add new row
       * @param {Array} select
       */
      this.add = function(data, details) {

          if (isArray(data)) {
              // Check for multiple rows
              if (isArray(data[0])) {
                  each(data, function (row, i) {
                      // append details is supplied
                      if (details[i]) {
                          row.details = details[i];
                      }
                      dt.data.push(this.build(row));
                  }, this);
              } else {
                  // append details is supplied
                  if (details) {
                      data.details = details[0];
                  }
                  dt.data.push(this.build(data));
              }

              // We may have added data to an empty table
              if ( dt.data.length ) {
                  dt.hasRows = true;
              }

              this.update();

              // Needs to be called after the return of add
          }
      };

      /**
       * Remove row(s)
       * @param  {Array|Number} select
       * @return {Void}
       */
      this.remove = function(select) {

          if (isArray(select)) {
              // Remove in reverse otherwise the indexes will be incorrect
              select.sort(function (a, b) {
                  return b - a;
              });

              each(select, function (row) {
                  dt.data.splice(row, 1);
              });
          } else {
              dt.data.splice(select, 1);
          }

          this.update();
      };

      /**
       * Update row indexes
       * @return {Void}
       */
      this.update = function() {
          var idx = 0;
          each(dt.data, function (row) {
              if(row.children.length != 1) {
                  row.dataIndex = idx++;
              }
          });
      };
  }

  function TableComplex(element, params) {
      element = element instanceof HTMLElement ? element : (function() {
          return;
      })();

      function validateRow(row, name) {
          var hasErrors = "";
          var rowCount = row.match(/\{((\w*|\d*):?)+\}/g);
          if (rowCount.length < 1 || rowCount.length > 3) {
              hasErrors += "Custom layout for row "+name+" was delared with an incorrect set of elements!\n";
          }
          var rowLength = 0;
          var localFunctions = ["placeholder","actions","settings","search"];
          each(rowCount, function(temp) {
              var subElements = temp.replace(/\{|\}/g, "").split(":");
              if (subElements.indexOf("placeholder") === -1 && !temp.match(/\{[A-Z,a-z]+:[1,2,3](:(start|center|end))*\}/g) ) {
                  hasErrors += "Custom layout for row "+name+" has an element "+ temp +", which has been declared incorrectly!\n";
              }
              if (layoutOptions.indexOf(subElements[0]) === -1 && !window[subElements[0]] && localFunctions.indexOf(subElements[0]) < 0) { // does custom function exist
                  hasErrors += "Custom layout for row "+name+" has an element with custom function '"+ subElements[0] +"' that is not accessible or dosen't exist!\n";
              }
              if (!isNaN(subElements[1].substring(0,1))) {
                  rowLength += +subElements[1].substring(0,1);
              }
          });
          if (rowLength != 3) {
              hasErrors += "Custom layout for row "+name+" is configured with grid length '"+ rowLength +"', which needs to add up to '3'!\n";
          }
          return hasErrors;
      }

      var jsonParams = element.dataset.tableData;
      if (jsonParams) {
          params = JSON.parse(jsonParams);
      }

      // init options
      var options = {};
      var layoutOptions = ["{actions:1:start}","{search:1:center}","{settings:1:end}"];
      
      // Check to see what Javascript options are set or are missing from table element classes
      options.sort = typeof params.sort === "boolean" ? params.sort : false;
      options.expand = typeof params.expand === "boolean" ? params.expand : false;
      if (options.expand) {
          options.expandIcon = params.expandIcon && typeof params.expandIcon === "string" ? params.expandIcon : "arrow-tri-solid-right";
          if (options.expandIcon.indexOf(prefix) > -1) {
              options.expandIcon = options.expandIcon.split(prefix)[1];
          }
      }
      options.showTotal = typeof params.showTotal === "string" ? params.showTotal : false;
      options.condensed = typeof params.condensed === "boolean" ? params.condensed : false;
      options.fixedColumns = typeof params.fixedColumns === "boolean" ? params.fixedColumns : false;
      options.rearrangeableColumns = typeof params.rearrangeableColumns === "boolean" ? params.rearrangeableColumns : false;
      options.fixedHeight = typeof params.fixedHeight === "boolean" ? params.fixedHeight : false;
      options.header = typeof params.header === "boolean" ? params.header : true;
      //Set Default Batch Actions
      options.defaultBatchActions = {};
      options.defaultBatchActions.exportCsv = params.defaultBatchActions && typeof params.defaultBatchActions.exportCsv === "boolean" ? params.defaultBatchActions.exportCsv : true ;
      options.defaultBatchActions.exportJson = params.defaultBatchActions && typeof params.defaultBatchActions.exportJson === "boolean" ? params.defaultBatchActions.exportJson : true ;
      options.defaultBatchActions.deleteRow = params.defaultBatchActions && typeof params.defaultBatchActions.delete === "boolean" ? params.defaultBatchActions.delete : true ;

      // Set all table text to variables
      options.text = {};
      options.text.apply = params.text && params.text.apply && typeof params.text.apply === "string"? params.text.apply : "Apply";
      options.text.cancel = params.text && params.text.cancel && typeof params.text.cancel === "string" ? params.text.cancel : "Cancel";
      options.text.exportCsv = params.text && params.text.exportCsv && typeof params.text.exportCsv === "string" ? params.text.exportCsv : "Export as csv";
      options.text.exportJson = params.text && params.text.exportJson && typeof params.text.exportJson === "string" ? params.text.exportJson : "Export as json";
      options.text.deleteRow = params.text && params.text.delete && typeof params.text.delete === "string" ? params.text.delete : "Delete";
      options.text.noEntries = params.text && params.text.noEntries && typeof params.text.noEntries === "string" ? params.text.noEntries: "No entries found";
      options.text.import = params.text && params.text.import && typeof params.text.import === "string" ? params.text.import: "Import";
      options.text.print = params.text && params.text.print && typeof params.text.print === "string" ? params.text.print: "Print";
      options.text.columns = params.text && params.text.columns && typeof params.text.columns === "string" ? params.text.columns: "Columns";
      options.text.batchActions = params.text && params.text.batchActions && typeof params.text.batchActions === "string" ? params.text.batchActions: "Batch Actions";
      options.text.chooseActions = params.text && params.text.chooseAction && typeof params.text.chooseAction === "string" ? params.text.chooseAction: "Choose Actions";
      
      // Remove the data from the Table element
      options.showData = jsonParams && typeof params.showData === "boolean" ? params.showData : true;
      // Search is either on by default or can be truned off
      options.search = typeof params.search === "boolean" ? params.search : true;
      if (options.search) {
          options.text.search  = {};
          options.text.search.label = params.text && params.text.search && typeof params.text.search.label === "string" ? params.text.search.label : false;
          options.text.search.placeholder = params.text && params.text.search && typeof params.text.search.placeholder === "string" ? params.text.search.placeholder : false;
      }
      // Settings is either on by default or can be turned off
      options.settings = typeof params.settings === "boolean" ? params.settings : true;
      // Import either on by default or can be turned off
      options.import = typeof params.import === "boolean" ? params.import : true;
      // Printing is either on by default or can be turned off
      options.print = typeof params.print === "boolean" ? params.print : true;
      // Column Management is either on by default or can be turned off
      options.column = typeof params.column === "boolean" ? params.column : true;
      // Export details roww is either on by default or can be turned off
      options.exportDetails = typeof params.exportDetails === "boolean" ? params.exportDetails : true;

      var allowedExtensions = [".csv", ".json", ".js"];
      options.allowedImportExtensions = [];
      //is it just one or is it an array 
      each(params.allowedImportExtensions, function(ext) {
          if (typeof ext  === "string" && allowedExtensions.indexOf(ext) >= -1) {
              options.allowedImportExtensions.push(ext); 
          }
      });
      if (options.allowedImportExtensions.length === 0) options.allowedImportExtensions = allowedExtensions;
      // Bulk Actions
      options.actionsSelectFilters = [];
      each(params.additionalActions, function(additionalAction) {
          if (additionalAction.js) {
              var testJs = additionalAction.js;
              if (additionalAction.js.indexOf("(") > -1) {
                  testJs = additionalAction.js.substring(0, additionalAction.js.indexOf("(")).trim();
              } else {
                  additionalAction.js += "()";
              }
              if (!window[testJs]) {
                  throw new Error("The additional action function "+additionalAction.js+" could not be accessed, please verify and try again!");
              } else {
                  options.actionsSelectFilters.splice(additionalAction.pos, 0, additionalAction);
              }
          } else {
              options.actionsSelectFilters.splice(additionalAction.pos, 0, additionalAction);
          }
      });
      for (var action in options.defaultBatchActions) {
          if (options.defaultBatchActions[action]) {
              if (action === "deleteRow" && options.actionsSelectFilters[0]) { //place divider above `delete` action only when other actions are present
                  options.actionsSelectFilters.push("hr");
              }
              options.actionsSelectFilters.push(options.text[action]);
          }
      }
      options.select = typeof params.select === "boolean" ? params.select : true;
      if (!options.select) layoutOptions.splice(layoutOptions.indexOf("{actions:1:start}"),1,"{placeholder:1:start}");
      if (!options.search) layoutOptions.splice(layoutOptions.indexOf("{search:1:center}"),1,"{placeholder:1:center}");
      if (!options.settings) layoutOptions.splice(layoutOptions.indexOf("{settings:1:end}"),1,"{placeholder:1:end}");
      // Customise the layout
      if (params.layout) {
          var rowCount = 0;
          var hasErrors = "";
          if (params.layout.row1) {
              hasErrors += validateRow(params.layout.row1, "one");
              rowCount++;
          }
          if (params.layout.row2) {
              hasErrors += validateRow(params.layout.row2, "two");
              rowCount++;
          }
          if (rowCount === 0) {
              hasErrors += "Custom layout was configured to have no Rows, which it needs to have at least 1!\n";
          }
          if (hasErrors.length > 0) {
              throw new Error(hasErrors);
          }
      }
      options.layout = params.layout ? params.layout : {row2:layoutOptions.join("")};

      if (isArray(params.perPageSelect)) {
          if (typeof params.perPageSelect[0] === "number") {
              options.perPageSelect = params.perPageSelect.map(function(i) { 
                  i = Math.abs(parseInt(i));
                  return i;
              });
          } else if (validateNum(params.perPageSelect[0])) {
              options.perPageSelect = params.perPageSelect.map(function(i) { 
                  i = Math.abs(parseInt(i));
                  return i;
              });
          } else {
              throw new Error("Invalid perPageSelect. Should be a non-empty array of integer");
          }
      } else {
          options.perPageSelect = [12,24,48,96];
      }
      options.perPage = options.perPageSelect.indexOf(params.perPage) > -1 ? validateNum(params.perPage) : options.perPageSelect[0];
      options.origPerPage = options.perPage;
      options.items = validateNum(params.items, 0);
      options.buttonLabelLeft = params.buttonLabelLeft && typeof params.buttonLabelLeft === "string" ? params.buttonLabelLeft : "Previous";
      options.buttonLabelRight = params.buttonLabelRight && typeof params.buttonLabelRight === "string" ? params.buttonLabelRight : "Next";
      options.disablePaginationInput = params.disablePaginationInput !== null && typeof params.disablePaginationInput === "boolean" ? params.disablePaginationInput : false;

      // transfer data
      options.data = {};
      if(!params.data) {
          var msg = "Missing data parameters for table!";
          console.error(msg);
          uicoreCustomEvent("Table", "Error", table, {"msg": msg});
          return false;
      }
      if (!params.data.headings) {
          msg = "Missing data.headings parameters for table!";
          console.error(msg);
          uicoreCustomEvent("Table", "Error", table, {"msg": msg});
          return false;
      }
      options.data.headings = params.data.headings;
      if (!params.data.columns) {
          msg = "Missing data.columns parameters for table!";
          console.error(msg);
          uicoreCustomEvent("Table", "Error", table, {"msg": msg});
          return false;
      }
      options.data.columns = params.data.columns;
      if (!params.data.rows) {
          msg = "Missing data.rows parameters for table!";
          console.error(msg);
          uicoreCustomEvent("Table", "Error", table, {"msg": msg});
          return false;
      }
      options.data.rows = params.data.rows;
      
      options.labels = {
          noRows: options.text.noEntries, // Message shown when there are no search results
      };

      if (!options.showData) {
          delete element.dataset.tableData;
      }

      var self = this,
          stringTable = "Table",
          table = element,
          body,
          head,
          header,
          wrapper,
          container,
          bottom,
          columnBox,
          isIE,
          pages,
          currentPage,
          totalPages,
          paginationElement,
          pagination,
          columnRenderers,
          selectedColumns,
          labels,
          rect,
          input,
          searching = false,
          dragSrcEl,
          sortedColumnIdx,
          metHeight = true,
          batchId,
          searchId,
          columnsFixed = false,
          initialY,
          begOffsetTop,
          currentY,
          moveableCols = [],
          colMoved = false,
          // Handlers
          handleTouchEvent = function(e) {
              if (e.pointerType === "mouse") {
                  return false; //If mouse touch on IE, cancel and use handleDragEvent
              } else {
                  e.preventDefault(); //else prevent default actions, like scrolling
              }
              var yOffset = 0;
              var finOffsetTop;
              if (e.type === "touchstart" || e.type === "pointerdown") {
                  if (e.type === "pointerdown") {
                      initialY = e.clientY - yOffset;
                  } else {
                      initialY = e.touches[0].clientY - yOffset;
                  }
                  dragSrcEl = e["target"];
                  if (dragSrcEl.tagName != "LI" ) {
                      dragSrcEl = getClosest(dragSrcEl, "." + prefix + "table-cmplx-drag-li");
                  }
                  dragSrcEl.dataTransfer = {};
                  dragSrcEl.dataTransfer.data = dragSrcEl.outerHTML;
                  begOffsetTop = dragSrcEl.offsetTop;
              }
              if (e.type === "touchmove" || e.type === "pointermove") {
                  e.preventDefault();
                  var before = false;
                  if (isIE || isEdge) {
                      currentY = e.clientY - initialY;
                      dragSrcEl.addEventListener("pointerleave", handlePointerLeave);
                  } else {
                      currentY = e.touches[0].clientY - initialY; //difference btn start and end if you move up it is negative
                  }
                  yOffset = currentY;
                  if (yOffset === 0) {
                      return false;
                  }

                  if (!dragSrcEl) {
                      dragSrcEl = e["target"];
                      if (dragSrcEl.tagName != "LI" ) {
                          dragSrcEl = getClosest(dragSrcEl, "." + prefix + "table-cmplx-drag-li");
                      }
                  }

                  finOffsetTop = begOffsetTop + currentY;
                  dragSrcEl.style.transform = "translate3d(0, " + yOffset + "px, 0)";
                  dragSrcEl.style.opacity = 0.5;
                  colMoved = true;
                  each(moveableCols, function(col) {
                      var startedBelow = col.offsetTop < dragSrcEl.offsetTop;
                      var startedAbove = col.offsetTop > dragSrcEl.offsetTop;
                      var endedBelow = col.offsetTop < finOffsetTop;
                      var endedAbove = col.offsetTop > finOffsetTop;
                      if (endedAbove && startedBelow  //if started from below and moved above column
                          || endedBelow && startedAbove) { //if started from above and moved below column
                          if (endedAbove) { //if item is being moved before col
                              if (col.previousElementSibling) { //if not the first column
                                  if (finOffsetTop > col.previousElementSibling.offsetTop) { //if moving up, but not above predecessor
                                      if (col.classList.contains(prefix + "border-bottom-black")) {
                                          col.classList.remove(prefix + "border-bottom-black");
                                      } 
                                      col.classList.add(prefix + "border-top-black");
                                  } else if (col.classList.contains(prefix + "border-top-black")) {
                                      col.classList.remove(prefix + "border-top-black");
                                  } else if (col.classList.contains(prefix + "border-bottom-black")) {
                                      col.classList.remove(prefix + "border-bottom-black");
                                  }
                              } else if (finOffsetTop < 0) { //if being placed before first column
                                  col.classList.add(prefix + "border-top-black");
                              }
                          } else if (endedBelow) { //if item is being moved below
                              if (col.nextElementSibling) {
                                  if (finOffsetTop < col.nextElementSibling.offsetTop) {
                                      if (col.classList.contains(prefix + "border-top-black")) {
                                          col.classList.remove(prefix + "border-top-black");
                                      }
                                      col.classList.add(prefix + "border-bottom-black");
                                  } else  if (col.classList.contains(prefix + "border-bottom-black")) { //either should get the styling or should not
                                      col.classList.remove(prefix + "border-bottom-black");
                                  } else if (col.classList.contains(prefix + "border-top-black")) {
                                      col.classList.remove(prefix + "border-top-black");
                                  }
                              } else if (finOffsetTop > col.offsetTop) {
                                  col.classList.add(prefix + "border-bottom-black");
                              }
      
                          }
                      } else if (startedBelow && col.nextElementSibling && col.nextElementSibling.offsetTop > finOffsetTop && !col.nextElementSibling.classList.contains(prefix + "table-cmplx-drag-li")) { // started from below + moved below a draggable but above a fixed column
                          col.classList.add(prefix + "border-bottom-black");
                      } else if (endedAbove && startedAbove && finOffsetTop > col.previousElementSibling.offsetTop && col.previousElementSibling.classList.contains(prefix + "table-cmplx-li")) { //if started from above + moved above but below a fixed 
                          col.classList.add(prefix + "border-top-black");
                      } else if (col.classList.contains(prefix + "border-top-black")) { //If it has a border but doesmn't fall into above category, remove it
                          col.classList.remove(prefix + "border-top-black");
                      } else if (col.classList.contains(prefix + "border-bottom-black")) { //If it has a border but doesmn't fall into above category, remove it
                          col.classList.remove(prefix + "border-bottom-black");
                      }
                  });
              }
              if (e.type ==="touchend" || e.type === "pointerup") {
                  initialY = currentY;
                  before = false;
                  if (!dragSrcEl) {
                      dragSrcEl = e["target"];
                      if (dragSrcEl.tagName != "LI" ) {
                          dragSrcEl = getClosest(dragSrcEl, "." + prefix + "table-cmplx-drag-li");
                      }
                  }
                  finOffsetTop = begOffsetTop + currentY;
                  if (colMoved) {
                      each(moveableCols, function(col) {
                          if (col != dragSrcEl) {
                              var startedBelow = col.offsetTop < dragSrcEl.offsetTop;
                              var startedAbove = col.offsetTop > dragSrcEl.offsetTop;
                              var endedBelow = col.offsetTop < finOffsetTop;
                              var endedAbove = col.offsetTop > finOffsetTop;
                              if (endedAbove && startedBelow 
                                  || endedBelow && startedAbove 
                                      || col.nextElementSibling && startedBelow && col.nextElementSibling.offsetTop > finOffsetTop && !col.nextElementSibling.classList.contains(prefix + "table-cmplx-drag-li") //if moving from bottom coming up: starting top is lower than above's starting top but ending top is higher 
                                          || endedAbove && startedAbove && finOffsetTop > col.previousElementSibling.offsetTop && col.previousElementSibling.classList.contains(prefix + "table-cmplx-li") ) {          
                                  if (endedAbove && startedBelow 
                                                  || endedAbove && startedAbove && finOffsetTop > col.previousElementSibling.offsetTop && col.previousElementSibling.classList.contains(prefix + "table-cmplx-li")) {
                                      before = true;
                                      if (col.previousElementSibling) { //if not the first column
                                          if (finOffsetTop > col.previousElementSibling.offsetTop) {
                                              handleTouchEnd(dragSrcEl, before, col);
                                          } 
                                      } else if (!col.previousElementSibling && finOffsetTop < 0) { //if being placed before the first column
                                          handleTouchEnd(dragSrcEl, before, col);
                                      }
                                  } else if (endedBelow && startedAbove 
                                                  || startedBelow && col.nextElementSibling && col.nextElementSibling.offsetTop > finOffsetTop && !col.nextElementSibling.classList.contains(prefix + "table-cmplx-drag-li")) { //if moving column down
                                      if (col.nextElementSibling && finOffsetTop < col.nextElementSibling.offsetTop) {
                                          handleTouchEnd(dragSrcEl, before, col);
                                      } else if (!col.nextElementSibling && finOffsetTop > col.offsetTop) { //if being placed below last column
                                          handleTouchEnd(dragSrcEl, before, col);
                                      }
                                  }

                                  col.classList.remove(prefix + "border-top-black");
                                  col.classList.remove(prefix + "border-bottom-black");

                                  columnBox.orderChanged = true;
                              }
                          }
                      });
                      if (dragSrcEl.hasAttribute("style")) { //set back to origin if doesn't get moved into available slot
                          dragSrcEl.removeAttribute("style");
                      }
                      colMoved = false; //once touch end is over, set colMoved back to false 
                  } else {
                      if (dragSrcEl.querySelector("input").checked) {
                          dragSrcEl.querySelector("input").checked = false;
                      } else {
                          dragSrcEl.querySelector("input").checked = true;
                      }
                  }
                  var applyButton = columnBox.querySelector("."+prefix+"btn-primary");
                  if (applyButton.disabled) {
                      applyButton.removeAttribute("disabled");
                  }
                  if (isIE || isEdge) {
                      dragSrcEl.removeEventListener("pointerleave", handlePointerLeave);
                  }
              }
          },
          handleTouchEnd = function(dragSrcEl, before, col) {
              var input = dragSrcEl.querySelector("input");
              var checked = input && input.checked;
              setTimeout(function() {
                  var dropElem;
                  var dropHTML = dragSrcEl.dataTransfer.data;
      
                  dragSrcEl.parentNode.removeChild(dragSrcEl);
                  if (before) {
                      col.insertAdjacentHTML("beforebegin", dropHTML);
                      dropElem = col.previousSibling;
                  } else {
                      col.insertAdjacentHTML("afterend", dropHTML);
                      dropElem = col.nextSibling;
                  }
                  
                  moveableCols.push(dropElem);
                  moveableCols = moveableCols.filter( function(value) {
                      return value != dragSrcEl;
                  });
                  if (checked) {
                      dropElem.querySelector("input").checked = true;
                  }
                  setupDragEvents(dropElem);
              }, 50);
          },
          handlePointerLeave = function(e) {
              setTimeout(function() {
                  dragSrcEl = e["relatedTarget"];
                  if (dragSrcEl.tagName != "LI" ) {
                      dragSrcEl = getClosest(dragSrcEl, "." + prefix + "table-cmplx-drag-li");
                  }
                  if (dragSrcEl.hasAttribute("style")) {
                      dragSrcEl.removeAttribute("style");
                  }
                  each(moveableCols, function(col) {
                      if (col.classList.contains(prefix + "border-top-black")) {
                          col.classList.remove(prefix + "border-top-black");
                      } else if (col.classList.contains(prefix + "border-bottom-black")) {
                          col.classList.remove(prefix + "border-bottom-black");
                      }
                  });
              },50);
          },
          handleDragEvent = function(e) {
              e.stopPropagation();
              if (e.type === "dragstart") {
                  dragSrcEl = e["target"];

                  dragSrcEl.dataTransfer = {};
                  dragSrcEl.dataTransfer.data = dragSrcEl.outerHTML;
              }
              if (e.type === "dragover") {
                  var overEl = e["target"];
                  if (overEl.tagName != "LI" ) {
                      overEl = getClosest(overEl, "." + prefix + "table-cmplx-drag-li");
                  }
                  if (dragSrcEl != overEl) {
                      if (e.preventDefault) {
                          e.preventDefault(); // Necessary. Allows us to drop.
                      }
                      overEl.classList.add(prefix + "border-bottom-black");
                      if (overEl.previousElementSibling && overEl.previousElementSibling.classList.contains(prefix + "border-bottom-black")) {
                          overEl.previousElementSibling.classList.remove(prefix + "border-bottom-black");
                      }
                      if (overEl.nextElementSibling && overEl.nextElementSibling.classList.contains(prefix + "border-bottom-black")) {
                          overEl.nextElementSibling.classList.remove(prefix + "border-bottom-black");
                      }
                      return false;
                  }
                 
              }
                
              if (e.type === "dragleave") {
                  
                  var leaveEl = e["target"];
                  if (leaveEl.tagName != "LI" ) {
                      leaveEl = getClosest(leaveEl, "." + prefix + "table-cmplx-drag-li");
                  }
                  if (dragSrcEl != leaveEl) {
                      if (e.preventDefault) {
                          e.preventDefault(); // Necessary. Allows us to drop.
                      }
                      
                      leaveEl.classList.remove(prefix + "border-bottom-black");
                      return false;
                  }
                  
              }
                
              if (e.type === "drop") {
                
                  if (e.stopPropagation) {
                      e.stopPropagation(); // Stops some browsers from redirecting.
                  }
                
                  var dropTarget = e["target"];    
                  if (dropTarget.tagName != "LI") {
                      dropTarget = getClosest(dropTarget, "." + prefix + "table-cmplx-drag-li");
                  }
                  // Don't do anything if dropping the same column we're dragging.
                  if (dragSrcEl != dropTarget) {
                      var checkbox = dragSrcEl.querySelector("input");
                      var checked = checkbox ? checkbox.checked : false;
                      var dropHTML = dragSrcEl.dataTransfer.data;
                      dragSrcEl.parentNode.removeChild(dragSrcEl);
                      
                      dropTarget.insertAdjacentHTML("afterend",dropHTML);
                      var dropElem = dropTarget.nextSibling;
                      if (checked) {
                          dropElem.querySelector("input").checked = true;
                      }
                      setupDragEvents(dropElem);
                      dropTarget.classList.remove(prefix + "border-bottom-black");

                      columnBox.orderChanged = true;
                      var applyButton = columnBox.querySelector("."+prefix+"btn-primary");
                      // eanble Apply and Cancel
                      if (applyButton.disabled) {
                          applyButton.removeAttribute("disabled");
                      }
                  }
                  return false;
              }
          },
          handleImportActionEvent = function(e) {
              var t = e.target;
              var reader = new FileReader();
              var output = ""; //placeholder for text output
              var type = ""; //placeholder for file type
              if(t.files && t.files[0]) {
                  if (!t.files[0].type || 
                      t.files[0].type === "application/json") {
                      type = "json";
                  } else if(t.files[0].type && 
                      (t.files[0].type === "application/vnd.ms-excel" ||
                      t.files[0].type === "text/csv")) {
                      type = "csv";
                  } else {
                      var msg = "The file type for the file selected was not recognizable!";
                      console.error(msg);
                      uicoreCustomEvent("Table", "Error", table, {"msg": msg});
                  }     
                  reader.onload = function (e) {
                      output = e.target.result;
                      if(type === "json") {
                          if(!isJson(output)) {
                              msg = "The file type for the supplied file was not recognizable!";
                              console.error(msg);
                              uicoreCustomEvent("Table", "Error", table, {"msg": msg});
                          }
                      }
                      var inputOptions = {type: type,
                          data: output,
                          headings: true};
                      self.import(inputOptions);
                      t.value = "";
                      
                  };//end onload()
                  reader.readAsText(t.files[0]);
              }//end if html5 filelist support
              e.preventDefault();
          },
          handleExportActionEvent = function(t) {
              var exportFileOptions = { };
              if (options.expand && options.select) {
                  exportFileOptions.skipColumn = [0,1];
              } else if (options.expand || options.select) {
                  exportFileOptions.skipColumn = [0];
              }

              if (t.innerHTML === options.text.exportCsv) {
                  exportFileOptions.type = "csv";
              } else {
                  exportFileOptions.type = "json";
              }
              self.export(exportFileOptions);
          },
          handleDeleteActionEvent = function() {
              self.delete();
          },
          handleSelectAllChange = function(state) {
              if (options.select) {
                  var actions = wrapper.querySelector("[data-target='#cmplxTablesActions']");
                  if (state === "checked" || state === "indeterminate" && actions.disabled) {
                      actions.removeAttribute("disabled");
                  } else if (state === "unchecked" && !actions.disabled && table.selectedRows.length < 1) {
                      actions.setAttribute("disabled","");
                  }
              }
          },
          handleCheckBoxEvent = function(t) {
              if(options.select && t.classList.contains(prefix + "table-cmplx-select-all")) { // Header Select All
                  if (table.hasRows) {
                      var cellIdx = getHeaderCellIndex(prefix + "table-cmplx-select-all");
                      var check = t.checked;
                      if (!check || t.state === "indeterminate") {
                          check = false;
                          t.checked = false;
                          t.state = "unchecked";
                      } else {
                          t.state = "checked";
                          check = true;
                      }
                      each(pages[currentPage-1], function(row) {
                          if(row.cells.length != 1) {
                              var cell = row.cells[cellIdx];
                              var input = cell.querySelector("input[type='checkbox']");
                              var dataInput = table.data[row.dataIndex].cells[cellIdx].querySelector("input[type='checkbox']");

                              if (check) {
                                  dataInput.checked = input.checked = true;
                                  table.selectedRows.push(row.dataIndex);
                                  row.classList.add("selected");
                                  if (options.expand) {
                                      row.nextElementSibling.classList.add("selected");
                                  }
                                  t.state = "checked";
                              } else {
                                  dataInput.checked = input.checked = false;
                                  table.selectedRows.pop(row.dataIndex);
                                  row.classList.remove("selected");
                                  if (options.expand) {
                                      row.nextElementSibling.classList.remove("selected");
                                  }
                              }
                          }
                      });
                      pages[currentPage-1].selected = t.checked;
                      handleSelectAllChange(t.state);
                  } else {
                      t.checked = false;
                  }
              } else if(options.select && t.parentNode.classList.contains(prefix + "table-cmplx-row-select")) { // Table Cell Select
                  cellIdx = getHeaderCellIndex(prefix + "table-cmplx-select-all");
                  var tr = getClosest(t, "tr", false);
                  if (t.checked) {
                      table.data[tr.dataIndex].cells[cellIdx].querySelector("input[type='checkbox']").checked = true;
                      tr.classList.add("selected");
                      if (options.expand) {
                          tr.nextElementSibling.classList.add("selected");
                      }
                      if (table.selectedRows.length === 0) {
                          table.selectedRows.push(tr.dataIndex);
                      } else {
                          var newRows = [];
                          for (var idx = 0; idx < table.selectedRows.length; idx++) {
                              
                              var value = table.selectedRows[idx];
                              var less = table.selectedRows[idx-1];
                              var more = table.selectedRows[idx+1];
                              if (tr.dataIndex < value 
                                  && (less === undefined || tr.dataIndex > less)
                                  && newRows.indexOf(tr.dataIndex) === -1) {
                                  newRows.push(tr.dataIndex);
                                  newRows.push(value);
                              } else if (tr.dataIndex > value 
                                  && (more === undefined || tr.dataIndex < more)
                                  && newRows.indexOf(tr.dataIndex) === -1) {
                                  newRows.push(value);
                                  newRows.push(tr.dataIndex);
                              } else {
                                  newRows.push(value);
                              }
                          }
                          if (newRows.length > 0) {
                              table.selectedRows = newRows;
                          }
                      }
                  } else {
                      table.data[tr.dataIndex].cells[cellIdx].querySelector("input[type='checkbox']").checked = false;
                      tr.classList.remove("selected");
                      if (options.expand) {
                          tr.nextElementSibling.classList.remove("selected");
                      }
                      table.selectedRows = table.selectedRows.filter( function(value) {
                          if (value != tr.dataIndex) {
                              return "" + value;
                          }
                      });
                      each(table.activeHeadings[cellIdx].children, function(el) {
                          if (el && el.classList.contains(prefix + "table-cmplx-select-all")) {
                              el.checked = false;
                          }
                      });
                  }
                  var selectAll = wrapper.querySelector("." + prefix + "table-cmplx-select-all");
                  if (table.selectedRows.length === options.perPage || table.selectedRows.length === pages[currentPage-1].length) {
                      selectAll.indeterminate = false;
                      selectAll.state = "checked";
                      selectAll.checked = true;
                  } else if (table.selectedRows.length > 0) {
                      selectAll.state = "indeterminate";
                      selectAll.indeterminate = true;
                  } else {
                      selectAll.state = "unchecked";
                      selectAll.indeterminate = false;
                  }
                  handleSelectAllChange(selectAll.state);
              }
          },
          handleButtonEvent =  function(t) {
              if (t.innerHTML === options.text.cancel) {
                  columnBox.classList.remove(prefix + "show");
              }
              else if (t.innerHTML === options.text.apply) {
                  if(columnBox.orderChanged) {
                      var order = [];
                      // Make sure we pick up cells for Expandable, Selectable and Labels
                      for (var h = 0; h < baseCellIdx(); h++) {
                          order.push(h);
                      }
                      each (columnBox.getElementsByTagName("ul"), function(unOderedList) {
                          each(unOderedList.children, function(li) {
                              each(table.headings, function(header) {
                                  if(li.querySelectorAll("label")[0].textContent === header.textContent) {
                                      order.push(header.originalCellIndex);
                                  }
                              });
                          });
                      });
                      columnBox.orderChanged = false;
                      columns().order(order);
                      table.hiddenColumns = [];
                      self.update();
                  }

                  each (columnBox.getElementsByTagName("ul"), function(unOderedList) {
                      each(unOderedList.children, function(li) {
                          var liCheckbox = li.querySelector("input[type='checkbox']");
                          if (liCheckbox && liCheckbox.checked) {
                              each(table.headings, function(header) {
                                  if(li.querySelectorAll("label")[0].textContent === header.textContent) {
                                      columns().show([header.originalCellIndex]);
                                      self.update();
                                  }
                              });
                          } else if (liCheckbox && !liCheckbox.checked) {
                              each(table.headings, function(header) {
                                  if(li.querySelectorAll("label")[0].textContent === header.textContent) {
                                      columns().hide([header.originalCellIndex]);
                                      self.update();
                                  }
                              });
                          }
                      });

                      if (searching) {
                          self.search(input.value);
                      }
                  });
                  columnsFixed = false;
                  renderHeader();
                  columnBox.classList.remove(prefix + "show");
              }
          },
          handleTableHeaderEvent = function(e,t) {
              if (
                  options.sort &&
                  t.hasAttribute("data-sortable")
              ) {
                  if ( options.items > 0 && (options.items != table.activeRows.length)) {
                      self.deleteAll();
                      //change column to asc or desc
                      columns().updateSortDirection(table.activeHeadings[table.activeHeadings.indexOf(t)], t.classList.contains("asc") ? "asc":"desc");
                  }
                  else {
                      columns().sort(table.activeHeadings.indexOf(t));
                      sortedColumnIdx = t.originalCellIndex;
                      self.update();
                      e.preventDefault();
                  }
                  uicoreCustomEvent("Table", "SortEvent", table, { "column" : table.activeHeadings.indexOf(t), "direction" : (t.classList.contains("asc") ? "ascending":"descending"), "currentPage": currentPage, "perPage": options.perPage });
              }
              t.focus();
          },
          handleAccordionEvent = function(t) {
              if(t.classList.contains(prefix + "table-cmplx-accordion-btn")) {
                  var htmlRow = t.parentNode.parentNode,
                      currentRow = table.data[htmlRow.dataIndex];
                  if (currentRow.details) {
                      var detailsRow = htmlRow.nextElementSibling.children[0];
                      if (detailsRow.classList.contains(prefix + "show")) {
                          detailsRow.classList.remove(prefix + "show");
                          t.classList.add(prefix + "collapsed");
                          t.setAttribute("aria-expanded",false);
                      } else {
                          detailsRow.classList.add(prefix + "show");
                          t.classList.remove(prefix + "collapsed");
                          t.setAttribute("aria-expanded",true);
                      }
                  } else {
                      each(t.querySelector("svg").childNodes, function(use) {
                          if (use.getAttribute("class").indexOf(prefix + "show") > -1) {
                              classRemove(use, prefix + "show");
                              if (use.getAttribute("xlink:href").indexOf(prefix + "loading-sqrs") != -1) {
                                  var row = getClosest(use, "tr", false);
                                  table.activeRows[row.dataIndex].event = "ExpandCancelEvent";
                                  uicoreCustomEvent("Table", "ExpandCancelEvent", table, {"rowId": row.dataIndex});
                              }
                          } else {
                              classAdd(use, prefix + "show");
                              if (use.getAttribute("xlink:href").indexOf(prefix + "loading-sqrs") != -1) {
                                  row = getClosest(use, "tr", false);
                                  table.activeRows[row.dataIndex].event = "ExpandStartEvent";
                                  var content = [];
                                  each(table.data[row.dataIndex].cells, function(cell, idx) {
                                      if (options.expand && options.select) {
                                          if (idx >= 2) {
                                              var dt = "\""+labels[idx]+"\": \""+ ( (cell.hasAttribute("data-content") ? cell.getAttribute("data-content") : cell.textContent )+"\"" );
                                              content.push(dt);
                                          }
                                      } else if (options.expand ||  options.select) {
                                          if (idx >= 1) {
                                              dt = "\""+labels[idx]+"\": \""+ ( (cell.hasAttribute("data-content") ? cell.getAttribute("data-content") : cell.textContent )+"\"" );
                                              content.push(dt);
                                          }
                                      } else {
                                          dt = "\""+labels[idx]+"\": \""+ ( (cell.hasAttribute("data-content") ? cell.getAttribute("data-content") : cell.textContent )+"\"" );
                                          content.push(dt);
                                      }
                                  });
                                  uicoreCustomEvent("Table", "ExpandStartEvent", table, {"rowId": row.dataIndex, "content": content});
                              }
                          }
                      });
                  }
              }
          },
          setupDragEvents = function(el) {
              el.addEventListener("dragstart", handleDragEvent, false);
              el.addEventListener("dragover", handleDragEvent, false);
              el.addEventListener("dragleave", handleDragEvent, false);
              el.addEventListener("drop", handleDragEvent, false);
              if (isIE || isEdge) {
                  el.addEventListener("pointerdown", handleTouchEvent, false);
                  el.addEventListener("pointerup", handleTouchEvent, false);
                  el.addEventListener("pointermove", handleTouchEvent, false);
                  if (isEdge) {
                      el.addEventListener("click", function(e) {
                          if (e.pointerType === "touch") {
                              e.preventDefault();
                          }
                      });
                  }
              } else {
                  el.addEventListener("touchstart", handleTouchEvent, false);
                  el.addEventListener("touchend", handleTouchEvent, false);
                  el.addEventListener("touchmove", handleTouchEvent, false);
              }

          },
          extend = function (src, props) {
              for (var prop in props) {
                  if (Object.prototype.hasOwnProperty.call(props, prop)) {
                  // if (props.hasOwnProperty(prop)) {
                      var val = props[prop];
                      if (val && isObject(val)) {
                          src[prop] = src[prop] || {};
                          extend(src[prop], val);
                      } else {
                          src[prop] = val;
                      }
                  }
              }
              return src;
          },
          baseCellIdx = function() {
              var baseIdx = 0;
              if (table.expand) {
                  baseIdx++;
              }
              if (table.select) {
                  baseIdx++;
              }
              return baseIdx;
          },
          columns = function (columns) {
              return new Columns(table, columns);
          },
          rows = function (rows) {
              return new Rows(table, rows);
          },
          // Function used to convert options data to thead and tbody
          dataToTable = function() {
              var thead = false,
                  tbody = false;

              table.data = table.data || options.data;

              if (table.data.headings) {
                  thead = createElement("thead");
                  var tr = createElement("tr");

                  // Add the expandable header for row details
                  if (options.expand) {
                      var th = createElement("th", {
                          title: "expand details"
                      });
                      tr.appendChild(th);
                      table.expand = options.expand;
                  }
                  if (options.select) {
                      th = createElement("th");
                      th.appendChild(createElement("input", {
                          type: "checkbox",
                          class: prefix + "table-cmplx-select-all",
                          title: "select all rows"
                      }));
                      tr.appendChild(th);
                      table.select = options.select;
                  }
                  each(table.data.headings, function (col) {
                      var th = createElement("th", {
                          scope: "col",
                          html: col
                      });
                      tr.appendChild(th);
                  });
                  thead.appendChild(tr);
              }

              if (table.data.rows && table.data.rows.length) {
                  tbody = createElement("tbody");
                 
                  each(table.data.rows, function (row, idx) {
                      row.dataIndex = idx;
                      if (table.data.headings) {
                          if (options.data.headings.length !== row.data.length) {
                              throw new Error(
                                  "Row found at index, [ "+idx+" ] that does not match the number of headings supplied."
                              );
                          }
                      }

                      var tr = createElement("tr");
                      //Add secondary accordion arrow for details
                      if(options.expand) {
                          tr.appendChild(renderExpand());
                      }
                      //Add selectable checkboxes
                      if(options.select) {
                          tr.appendChild(renderSelect());
                      }
                      each(row.data, function (value) {
                          var td = createElement("td", {
                              html: value
                          });
                          td.setAttribute("data-content", getText(value));
                          tr.appendChild(td);
                      });
                      
                      tbody.appendChild(tr);

                      if (row.details) {
                          tr.details = row.details;
                      }

                      // Secondary accordion html for details
                      if (options.expand){
                          tbody.appendChild(renderDetails(tr, table.headings.length));
                      }
                      
                  });
              }

              if (thead) {
                  if (table.tHead !== null) {
                      table.removeChild(table.tHead);
                  }
                  table.appendChild(thead);
              }

              if (tbody) {
                  if (table.tBodies.length) {
                      table.removeChild(table.tBodies[0]);
                  }
                  table.appendChild(tbody);
              }
          },
          setRenderColumns = function() {
              if (selectedColumns.length) {
                  each(table.data, function (row) {
                      each(row.cells, function (cell, i) {
                          if (selectedColumns.indexOf(i) > -1) {
                              each(columnRenderers, function (renderers) {
                                  if (renderers.columns === cell.cellIndex) {
                                      cell.innerHTML = renderers.renderer.call(self, cell.data, cell, row);
                                  }
                              });
                          }
                      });
                  });
              }
          },
          renderDetails = function(row, length, stripeClass, selected) {

              var clazz = prefix + "table-cmplx-row-details";
              if (stripeClass) {
                  clazz = stripeClass + " " + clazz;
              }
              if (selected) {
                  clazz += " " + "selected";
              }
             
              var detailsRow = createElement("tr", {
                  class: clazz
              });
              var detailsCell = createElement("td", {
                  class :  prefix + "table-complx-details",
                  colspan: length
              });
              var accordionBody = createElement("div",{
                  class : prefix + "table-complx-details-body"
              });
              if (row.details) {
                  accordionBody.innerHTML = row.details;
              } else {
                  row.details = false;
              }
              detailsCell.appendChild(accordionBody);
              detailsRow.appendChild(detailsCell);
              return detailsRow;
          },
          renderExpand = function() {
              var td = createElement("td");
              var showButton = createElement("button", {
                      class: prefix + "table-cmplx-accordion-btn " + prefix + "collapsed", 
                      "aria-expanded": false,
                      "aria-label": "expand details"
                  }),
                  svgElem = renderSvg([{name:options.expandIcon, show:true},{name:"loading-sqrs", show:false}]);
              showButton.appendChild(svgElem);
              td.appendChild(showButton);
              return td;
          },
          renderSelect = function() {
              var td = createElement("td", {
                  class: prefix + "table-cmplx-row-select"
              });
              var inputCheckbox = createElement("input", {
                  type: "checkbox",
                  title: "row select"
              });
              td.appendChild(inputCheckbox);
              return td;
          },
          renderCustomRow = function(row) {
              var template = "<div class='" + prefix + "table-cmplx-top'>";
              template += row;
              template += "</div>";

              each(row.match(/\{((\w*|\d*):?)+\}/g), function(el) {
                  var replace = el;
                  var clean = el.replace(/[{,}]/g, "").split(":");
                  switch(clean[0]) {
                  case "actions": template = template.replace(replace, renderActions(clean[1], clean[2])); break;
                  case "search": template = template.replace(replace, renderSearch(clean[1], clean[2])); break;
                  case "settings": template = template.replace(replace, renderSettings(clean[1], clean[2])); break;
                  case "placeholder": template = template.replace(replace, renderPlaceholder(clean[1])); break;
                  default : 
                      var topCtnr = "<div class='" + prefix + "table-cmplx-top-cntr " + prefix + "justify-content-" + clean[2] + "' style='flex-grow: " + clean[1] +";'>";
                      topCtnr += window[clean[0]]()+"</div>";
                      template = template.replace(replace, topCtnr);
                      
                  }
              });
              return template;
          },
          createActionButton = function(html, js, dataToggle, dataTarget) {
              var button;
              if (dataToggle && dataTarget) {
                  button = createElement("button", {
                      class: prefix + "dropdown-item",
                      role :"menuitem",
                      onclick: js ? js : "javascript: void(0);",
                      html: html,
                      tabindex: "-1",
                      data_toggle: dataToggle,
                      data_target: dataTarget
                  });
              } else {
                  button = createElement("button", {
                      class: prefix + "dropdown-item",
                      role :"menuitem",
                      onclick: js ? js : "javascript: void(0);",
                      html: html,
                      tabindex: "-1"
                  });
              }
              return button;
          },
          createActionLi = function () {
              return createElement("li", {
                  class: prefix + "dropdown-list-item",
                  role: "none presentation",
                  tabindex: "0"
              });
          },
          renderActions = function(flexGrow, justifyContent) {
              var topCtnr;
              if (options.select) {
                  topCtnr = "<div class='" + prefix + "table-cmplx-top-cntr " + prefix + "justify-content-" + justifyContent +"'";
                  flexGrow ? topCtnr += " style='flex-grow: " + flexGrow + ";'>" :  +">";
                  var cmplxAction = createElement("div", {
                      class: prefix + "table-cmplx-action"
                  });
                  var cmplxActionLabel = createElement("label", {
                      class: prefix + "table-cmplx-action-label",
                      html: options.text.batchActions,
                      for: batchId+"BatchActions"
                  });
                  cmplxAction.appendChild(cmplxActionLabel);

                  var cmplxActionDropdown = createElement("div", {
                      class: prefix + "mb-0 " + prefix + "btn-dropdown"
                  });
                  var anchor = createElement("button", {
                      id: batchId+"BatchActions",
                      class: prefix + "btn " + prefix + "btn-secondary " + prefix + "table-cmplx-action-button" ,
                      tabindex: "0",
                      "data-toggle": prefix + "dropdown",
                      "data-target": "#cmplxTablesActions",
                      "aria-expanded": "false",
                      "aria-controls": "cmplxTablesActions",
                      html: options.text.chooseActions
                  });
                  
                  var svgElem = renderSvg([{name:"arrow-tri-solid-right", show:true}]);
                  var svgClass= svgElem.getAttribute("class");
                  svgElem.setAttribute("class", svgClass + " " + prefix + "arrow-tri-solid-right");
                  anchor.appendChild(svgElem);
                  cmplxActionDropdown.appendChild(anchor);

                  var unordered = createElement("ul", {
                      id: "cmplxTablesActions",
                      class: prefix + "button-dropdown-container " + prefix + "collapse",
                      role: "menu"
                  });

                  each(options.actionsSelectFilters, function(action) {
                      if ("hr" === action) {
                          unordered.appendChild(createElement(action,{class: prefix+"dropdown-divider"}));
                      } else {
                          var actionLI = createActionLi();
                          var actionLabel;
                          if (typeof action === "string") {
                              if (action === options.text.exportCsv) { 
                                  actionLabel = createActionButton(action, null, "dds__modal", "#"+prefix+"csvSpecialChars");
                              } else {
                                  actionLabel = createActionButton(action);
                              }
                          } else {
                              actionLabel = createActionButton(action.html, action.js);
                          }
                          actionLI.appendChild(actionLabel);
                          unordered.appendChild(actionLI);
                      }
                  });
                  
                  anchor.setAttribute("disabled","");

                  cmplxActionDropdown.appendChild(unordered);
                  cmplxAction.appendChild(cmplxActionDropdown);

                  topCtnr += cmplxAction.outerHTML + "</div>";
              } else {
                  topCtnr = "<div class='" + prefix + "table-cmplx-top-cntr'></div>";
              }

              return topCtnr;
          },
          renderSearch = function(flexGrow, justifyContent) {
              var topCtnr;
              if (options.search) {
                  topCtnr = "<div class='" + prefix + "table-cmplx-top-cntr " + prefix + "justify-content-" + justifyContent +"'";
                  flexGrow ? topCtnr += " style='flex-grow: " + flexGrow + ";'>" :  +">";
                  var inputGroup = createElement("div", {
                      class: prefix + "table-cmplx-input-group"
                  });
                  var searchCtnr = createElement("div", {
                      class: prefix + "table-cmplx-search"
                  });
                  var searchIcon = renderSvg([{name:"search", show:true}]);
                  var searchInput = createElement("input", {
                      type: "search",
                      class: prefix + "form-control ",
                      "aria-label": "search"
                  });
                  if (options.search && options.text.search.placeholder) {
                      searchInput.setAttribute("placeholder", options.text.search.placeholder);
                  }
                  searchCtnr.appendChild(searchInput);
                  searchCtnr.appendChild(searchIcon);
                  if (options.search && options.text.search.label) {
                      var searchLabel = createElement("label", {
                          for: searchId + "Search",
                          html: options.text.search.label
                      });
                      searchInput.setAttribute("id",searchId+"Search");
                      inputGroup.appendChild(searchLabel);
                      inputGroup.appendChild(searchCtnr);
                      topCtnr += inputGroup.outerHTML + "</div>";
                  } else {
                      topCtnr += searchCtnr.outerHTML + "</div>";
                  }
              } else {
                  topCtnr = "<div class='" + prefix + "table-cmplx-top-cntr'></div>";
              }

              return topCtnr;
          },
          renderSettings = function(flexGrow, justifyContent) {
              var topCtnr;
              if (options.settings) {
                  topCtnr = "<div class='" + prefix + "table-cmplx-top-cntr " + prefix + "justify-content-" + justifyContent +"'";
                  flexGrow ? topCtnr += " style='flex-grow: " + flexGrow + ";'>" :  +">";
                  var optGear = "<div class='" + prefix + "table-cmplx-settings'>";
                  
                  if (options.import) {
                      optGear += "<button class='"+prefix+"table-cmplx-settings-button dds__text-truncate' aria-label='table settings import'>";
                      var svgElem = renderSvg([{name:"import-alt", show:true}]);
                      optGear += svgElem.outerHTML || new XMLSerializer().serializeToString(svgElem);
                      optGear += " " + options.text.import +"</button>";
                      optGear += "<input class='dds__table-cmplx-file-import' type='file' hidden accept='" + options.allowedImportExtensions + "'/>";
                  }
                  if (options.print) {
                      optGear += "<button class='"+prefix+"table-cmplx-settings-button dds__text-truncate' aria-label='table settings print'>";
                      svgElem = renderSvg([{name:"printer", show:true}]);
                      optGear += svgElem.outerHTML || new XMLSerializer().serializeToString(svgElem);
                      optGear += " " + options.text.print +"</button>";
                  }
                  if (options.column) {
                      optGear += "<button class='"+prefix+"table-cmplx-settings-button dds__text-truncate' aria-label='table settings columns'>";
                      svgElem = renderSvg([{name:"gear", show:true}]);
                      optGear += svgElem.outerHTML || new XMLSerializer().serializeToString(svgElem);
                      optGear += " " + options.text.columns +"</button>";
                  }
                  
                  optGear += columnBox = "<div class=\"" + prefix + "column-box";
                  optGear += "\" data-toggle=\"data-column-box\"></div>";
                  optGear += "</div>";
                  topCtnr += optGear + "</div>";
              } else {
                  topCtnr = "<div class='" + prefix + "table-cmplx-top-cntr'></div>";
              }

              return topCtnr;
          },
          renderPlaceholder = function (flexGrow) {
              return "<div class='" + prefix + "table-cmplx-top-cntr " + prefix + "table-cmplx-placeholder' style='flex-grow: " + flexGrow + ";'></div>";
          },
          render = function() {
   
              var template = "";

              // Convert data to HTML
              if (options.data) {
                  dataToTable();
              }

              body = table.tBodies[0];
              head = table.tHead;
      
              // Should move this to dataToTable method
              if (!body) {
                  body = createElement("tbody");
                  table.appendChild(body);
              }
      

              table.hasRows = body.rows.length > 0;
      
              // Make a tHead if there isn't one (fixes #8)
              // Should move this to dataToTable method
              if (!head) {
                  var h = createElement("thead");
                  var t = createElement("tr");
      
                  if (table.hasRows) {
                      each(body.rows[0].cells, function () {
                          t.appendChild(createElement("th"));
                      });
      
                      h.appendChild(t);
                  }
      
                  head = h;
      
                  table.insertBefore(head, body);
              }
      
              table.hasHeadings = head.rows.length > 0;
      
              if (table.hasHeadings) {
                  header = head.rows[0];
                  table.headings = [].slice.call(header.cells);
              }
      
              // Header
              if (!options.header) {
                  if (head) {
                      table.removeChild(table.tHead);
                  }
              }
      
              // Build
              wrapper = createElement("div", {
                  class: prefix + "table-cmplx-wrapper"
              });
      
              //////////////////////////////////////////////////////
              // Top template - Begin
              //////////////////////////////////////////////////////
     
              if (options.layout.row1) {
                  template += renderCustomRow(options.layout.row1);
              }

              if (options.layout.row2) {
                  template += renderCustomRow(options.layout.row2);
              }

              //////////////////////////////////////////////////////
              // Top template - End
              //////////////////////////////////////////////////////

              template += "<div class='" + prefix + "table-cmplx-container'></div>";
              
              //////////////////////////////////////////////////////
              // Bottom template - Begin
              //////////////////////////////////////////////////////

              template += "<div class='" + prefix + "table-cmplx-bottom'>";
              template += "</div>";
      
              //////////////////////////////////////////////////////
              // Bottom template - End
              //////////////////////////////////////////////////////

              if (table.hasHeadings) {
                  // Sortable
                  renderHeader();
              }
      
              // Add table class
              table.classList.add(prefix + "table-cmplx");
              
              wrapper.innerHTML = template;
      
              container = wrapper.querySelector("." + prefix + "table-cmplx-container");

              bottom = wrapper.querySelector("." + prefix + "table-cmplx-bottom");
      
              // Pagination
              options.pagination = getSibling(element, ".dds__pagination") ? true : false;
              if (options.pagination) {
                  paginationElement = getSibling(element, ".dds__pagination");
                  bottom.appendChild(paginationElement);
              }

              columnBox = wrapper.querySelector("[data-toggle='data-column-box']");
      
              // Insert in to DOM tree
              table.parentNode.replaceChild(wrapper, table);
              container.appendChild(table);
      
              // Store the table dimensions
              rect = table.getBoundingClientRect();
      
              // Convert rows to array for processing
              table.data = [];
              table.activeRows = [];

              var dataIdx = 0;
              each(body.rows, function(row, idx) {
                  if (options.expand) {
                      if (idx % 2 == 0) {
                          row.dataIndex = dataIdx++;
                          table.activeRows.push(row);
                          table.data.push(row);
                      }
                  } else {
                      row.dataIndex = idx;
                      table.activeRows.push(row);
                      table.data.push(row);
                  }
              }, true);

              table.activeHeadings = table.headings.slice();

              // Update
              self.update();
      
              // Set Columns
              setColumns();

              // Fix columns, think this is the only valid call for fixColumns
              fixColumns();

              // Options condensed
              if (options.condensed) {
                  wrapper.querySelector("." + prefix + "table-cmplx").classList.add(prefix + "condensed");
              }
              
              // This needs to run after the options.condensed
              if (options.fixedHeight) {
                  if (options.origPerPage > table.activeRows.length) {
                      metHeight = false;
                  } else {
                      // Fix height
                      fixHeight();
                  }
              }
      
              bindEvents();
          },
          renderPage = function () {
              if (options.search && searching === true && table.searchData.length === 0) return;
              if (table.hasRows && totalPages) {
      
                  // Use a fragment to limit touching the DOM
                  var index = currentPage - 1,
                      frag = DOC.createDocumentFragment();
      
                  var page = pages[index];
                  var selectHeader;
                  var selectCellIdx;
                  
                  if (table.hasHeadings) {
                      flush(header, isIE);
                      
                      each(table.activeHeadings, function (th) {
                          if (options.select) {
                              each(th.children, function(el) {
                                  if (el && el.classList.contains(prefix + "table-cmplx-select-all")) {
                                      selectHeader = el;
                                      selectCellIdx = th.originalCellIndex;
                                      if(page.selected) {
                                          selectHeader.checked = true;
                                          selectHeader.state = "checked"; // set the state
                                      } else {
                                          selectHeader.checked = false;
                                          selectHeader.state = "unchecked"; // set the state
                                      }
                                  } 
                              });
                          }
                          // reest sortable columns
                          if (th.hasAttribute("data-sortable") && th.originalCellIndex != sortedColumnIdx) {
                              th.setAttribute("aria-sort", "none");
                          }
                          header.appendChild(th);
                      }, this);
                  }
                  
                  var selectedRows = 0;
                  each(page, function (row, idx) {
                      //row.className = "";
                      row.removeAttribute("class");
                      var selected = false;
                      // redo if previously selected
                      if (options.select) {
                          if(table.data[row.dataIndex].cells[selectCellIdx].querySelector("input[type='checkbox']").checked) {
                              row.classList.add("selected");
                              selected = true;
                              selectedRows++;
                              if (!selectHeader.checked) {
                                  selectHeader.indeterminate = true;
                                  selectHeader.state = "indeterminate"; // set the state
                              }
                          }
                      }
                      // redo if stripped table
                      if (table.classList.contains(prefix + "table-striped")) {
                          var stripeColor = idx % 2 > 0 ? prefix + "table-cmplx-row-odd" : prefix + "table-cmplx-row-even";
                          row.classList.add(stripeColor);
                      }
                      frag.appendChild(rows().render(row));
                      if(options.expand) {
                          row.querySelector("." + prefix + "table-cmplx-accordion-btn").classList.add(prefix + "collapsed");
                          var detailsRow = renderDetails(row, table.headings.length, stripeColor, selected);
                          detailsRow.children[0].classList.remove(prefix + "show");
                          frag.appendChild(detailsRow);
                      }
                  }, this);

                  if (options.select) {
                      if (selectedRows === page.length) {
                          selectHeader.indeterminate = false;
                          selectHeader.checked = true;
                          selectHeader.state = "checked";
                      } else if (selectedRows === 0 && options.select) {
                          selectHeader.indeterminate = false;
                          selectHeader.checked = false;
                          selectHeader.state = "unchecked";
                      }
                      handleSelectAllChange(selectHeader.state);
                  }
                  self.clear(frag);
      
              } else if (searching && totalPages == 0) {
                  if (table.hasHeadings) {
                      flush(header, isIE);
      
                      each(table.activeHeadings, function (th) {
                          header.appendChild(th);
                      }, this);
                  }
              } else {
                  self.clear();
              }
              if(!metHeight) {
                  fixHeight();
              }
          },
          renderHeader = function () {
      
              labels = [];
      
              if (table.headings && table.headings.length) {

                  each(table.headings, function (th, i) {
      
                      labels[i] = th.textContent;
      
                      th.sortable = th.hasAttribute("data-sortable");
      
                      th.originalCellIndex = i;
                      if (options.sort && th.sortable) {
                          var sortLabel = createElement("label", {
                              class: prefix + "table-cmplx-sorter",
                              html: th.textContent
                          });
                          th.textContent = "";
                          th.setAttribute("tabindex","0");
                          th.appendChild(sortLabel);
                      }
                  });
              }
      
              fixColumns();
          },
          getHeaderCellIndex = function(selector) {
              var cellIdx = 0;
              each(table.activeHeadings, function(header) {
                  each(header.children, function(el) {
                      if (el.classList.contains(selector)) {
                          cellIdx = header.originalCellIndex;
                      }
                  });
              });
              return cellIdx;
          },
          bindEvents = function () {

              // Batch Actions
              if (options.select) {
                  var actionSelect = wrapper.querySelector("#cmplxTablesActions");
                  actionSelect.addEventListener("keydown", function(e) {
                      if (e.keyCode == 13) {
                          e.preventDefault();
                          var actionButton = e.target.querySelector("button");
                          if (actionButton.innerHTML ===  options.text.deleteRow) {
                              handleDeleteActionEvent();
                          } else if (actionButton.innerHTML === options.text.exportCsv ) {
                              createSpecialCharModal();
                          } else if (actionButton.innerHTML === options.text.exportJson) {
                              handleExportActionEvent(e.target);
                          }
                      }
                  });
                  actionSelect.addEventListener("mousedown", function(e) {
                      e.preventDefault();
                      var actionButton = e.target;
                      if (actionButton.innerHTML ===  options.text.deleteRow) {
                          handleDeleteActionEvent();
                      } else if (actionButton.innerHTML === options.text.exportCsv ) {
                          createSpecialCharModal();
                      } else if (actionButton.innerHTML === options.text.exportJson) {
                          handleExportActionEvent(e.target);
                      }
                  });
              } 

              // Search
              if (options.search) {
                  input = wrapper.querySelector("." + prefix + "table-cmplx-search").querySelector("input[type=search]");
                  if (input) {
                      input.addEventListener("keyup",function (e) {
                          if (e.keyCode === 9 || e.keyCode === 16 || e.keyCode === 13) return;
                          self.search(input.value);
                          e.preventDefault();
                      }, false);
                      input.addEventListener("mouseup", function (e) {
                          var origInput = input.value;
                          setTimeout ( function() {
                              if (input.value == "" && origInput != "") { //the 'x' was pressed and removed the orig query string
                                  self.search(input.value);
                              }
                          }, 100);
                          e.preventDefault();
                      }, false);
                  }
              }
      
              // Settings
              if (options.settings) {
                  var settingsCtnr = wrapper.querySelector("." + prefix + "table-cmplx-settings");
                  if (options.column) {
                      var button = settingsCtnr.querySelector("button[aria-label='table settings columns']");
                      button.addEventListener("click", function(e) {
                          if(columnBox.classList.contains(prefix + "show")) {
                              columnBox.classList.remove(prefix + "show");
                          } else {
                              renderSettingsDropDown();
                              columnBox.classList.add(prefix + "show");
                              columnBox.addEventListener("click", function(e) {
                                  var t = e.target;
                                  if (t.nodeName.toLowerCase() === "button") {
                                      handleButtonEvent(t);
                                      settingsCtnr.querySelector("button[aria-label='table settings columns']").focus();
                                  } else if(t.nodeName.toLowerCase() === "input") {
                                      var applyButton = columnBox.querySelector("."+prefix+"btn-primary");
                                      if (applyButton.disabled) {
                                          applyButton.removeAttribute("disabled");
                                      }
                                  }
                              });
                          }
                          e.preventDefault();
                      }, false);
                  }
                  
                  if (options.print) {
                      button = settingsCtnr.querySelector("button[aria-label='table settings print']");
                      button.addEventListener("click", function(e) {
                          self.print();
                          e.preventDefault();
                      }, false);
                  }

                  if (options.import) {
                      var fileImport = settingsCtnr.querySelector("."+prefix+"table-cmplx-file-import");
                      fileImport.addEventListener("change", handleImportActionEvent, false);
                      
                      button = settingsCtnr.querySelector("button[aria-label='table settings import']");
                      button.addEventListener("click", function(e) {
                          fileImport.click();
                          e.preventDefault();
                      }, false);
                  }
              }        
      
              // All listeners with in the table are should use wrapper.
              // Pager(s) / sorting
              wrapper.addEventListener("keydown" ,function (e) {
                  var t = e.target;
                  // Checks for headers
                  if (t.nodeName.toLowerCase() === "th" && e.keyCode === 13) { 
                      handleTableHeaderEvent(e,t);
                  }
                  // Checks for buttons
                  if (t.nodeName.toLowerCase() === "button" && e.keyCode === 13 && t.classList.contains(prefix+"table-cmplx-accordion-btn")) {
                      handleAccordionEvent(t);
                      e.preventDefault();
                  }
              }, false);

              wrapper.addEventListener("click" ,function (e) {
                  var t = e.target;
                  // Checks for headers
                  if (t.classList.contains(prefix+"table-cmplx-sorter")) { 
                      handleTableHeaderEvent(e,t.parentNode); 
                  }
                  // Checks for buttons
                  if (t.nodeName.toLowerCase() === "button") {
                      handleAccordionEvent(t);
                      e.preventDefault();
                  }
                  // Checks for inputs
                  if (t.nodeName.toLowerCase() === "input") {
                      if(t.type === "checkbox") {
                          handleCheckBoxEvent(t);
                      }
                  }
              }, false);
          },
          setColumns = function () {
              each(table.data, function (row) {
                  each(row.cells, function (cell) {
                      cell.data = cell.innerHTML;
                  });
              });
             
              // Check for the columns option
              if (options.data.columns && table.headings.length) {
      
                  each(options.data.columns, function (data) {
                     
                      // convert single column selection to array
                      if (!isArray(data.select)) {
                          data.select = [data.select];
                      }
      
                      if (Object.prototype.hasOwnProperty.call(data, "render") && (typeof data.render === "function" || (typeof data.render === "string" && window[data.render]))) {
                          var nCIdx = parseInt(data.select)+baseCellIdx();
                          selectedColumns = selectedColumns.concat(nCIdx);
      
                          columnRenderers.push({
                              columns: nCIdx,
                              renderer: window[data.render]
                          });
                      }
                     
                      // Add the data attributes to the th elements
                      each(data.select, function (column) {
                          var th = table.headings[baseCellIdx()+column];
                          if (data.type) {
                              th.setAttribute("data-type", data.type);
                          }
                          if (data.format) {
                              th.setAttribute("data-format", data.format);
                          }
                          if (options.sort) {
                              if (Object.prototype.hasOwnProperty.call(data, "sortable") && data.sortable) {
                                  th.setAttribute("data-sortable", "");
                                  th.setAttribute("aria-sort","none");
                              }
                              if (Object.prototype.hasOwnProperty.call(data, "sort")) {
                                  th.setAttribute("data-sortable", "");
                                  th.setAttribute("aria-sort","none");
                              }
                          }
                          if (Object.prototype.hasOwnProperty.call(data, "fixed")) {
                              th.setAttribute("data-fixed", data.fixed);
                          }
                          if (Object.prototype.hasOwnProperty.call(data, "control")) {
                              th.setAttribute("data-control", data.control);
                          }
                          if (Object.prototype.hasOwnProperty.call(data, "hidden")) {
                              if (data.hidden) {
                                  columns().hide([baseCellIdx()+column]);
                                  self.update();
                              }
                          }
                          if (Object.prototype.hasOwnProperty.call(data, "sort") && data.select.length ==1 ) {
                              sortedColumnIdx = baseCellIdx()+data.select[0];
                              columns().sort(sortedColumnIdx, data.sort);
                              self.update();
                              uicoreCustomEvent("Table", "SortEvent", table, { "column" : sortedColumnIdx, "direction" : (data.sort === "asc" ? "ascending":"descending"), "currentPage": currentPage, "perPage": options.perPage });
                          }
                      });
                  });
              }
      
              if (table.hasRows) {
                  each(table.data, function (row, idx) {
                      row.dataIndex = idx;
                      each(row.cells, function (cell) {
                          cell.data = cell.innerHTML;
                      });
                  });
      
                  setRenderColumns();
                  columns().rebuild();
                  self.update();
              }

              renderHeader();
              
          },
          renderSettingsDropDown = function() {

              flush(columnBox, isIE);
              var columnContainer = createElement("div", {
                  class: prefix + "table-cmplx-column-cntr"
              });

              var unOderedList = createElement("ul");
          
              each(table.headings, function(header, idx) {

                  if (idx >= baseCellIdx() && !header.dataset["fixed"] && (options.rearrangeableColumns || header.dataset["control"] !== "false")) {
                      var listItem;
                      var dragSvg;
                      if (options.rearrangeableColumns) {
                          listItem = createElement("li", {
                              class: prefix + "table-cmplx-drag-li",
                              draggable: true
                          });
                          dragSvg = renderSvg([{name:"handle", show:true}]);
                          setupDragEvents(listItem);
                          moveableCols.push(listItem);
                      } else {
                          listItem = createElement("li", {
                              class: prefix + "table-cmplx-li"
                          });
                      }
                      var columnLabel = createElement("label",{ 
                          for: idx,
                          class: prefix + "text-truncate"
                      });
                      var boxLabel = createElement("span");
                      if (header.dataset["control"] !== "false") {
                          var columnInput = createElement("input",{   id: idx,
                              type: "checkbox"
                          });
                          columnInput.checked = columns().visible(idx);
                          columnLabel.appendChild(columnInput);
                      } else {
                          boxLabel.style.marginLeft = "1.75rem";
                      }
                      boxLabel.innerHTML = header.textContent;
                      columnLabel.appendChild(boxLabel);
                      if(dragSvg) {
                          listItem.appendChild(dragSvg);
                      }
                      listItem.appendChild(columnLabel);
                      unOderedList.appendChild(listItem);
                      columnContainer.appendChild(unOderedList);
                  }
              });
              if (columnContainer.querySelectorAll("ul").length === 0) {
                  var emptySpan = createElement("span", {
                      class: prefix + "text-wrap",
                      html: "Cannot rearrange or turn columns on/off."
                  });
                  columnContainer.appendChild(emptySpan);
              }
              var buttonContainer = createElement("div", {
                  class: prefix + "row " + prefix + "no-gutters"
              });
              var cancelButton = createElement("button", {
                  class: prefix + "btn " + prefix + "btn-secondary",
                  html: options.text.cancel
              });
              var applyButton = createElement("button", {
                  class: prefix + "btn " + prefix + "btn-primary",
                  html: options.text.apply,
                  disabled: ""
              });
              buttonContainer.appendChild(cancelButton);
              buttonContainer.appendChild(applyButton);
              columnContainer.appendChild(buttonContainer);
              columnBox.appendChild(columnContainer);
          },
          paginate = function() {

              var perPage = options.perPage,
                  rows = table.activeRows;
                  
              if (searching) {
                  rows = [];
      
                  each(table.searchData, function (index) {
                      rows.push(table.activeRows[index]);
                  }, this);
              }
      
              // Check for hidden columns
              pages = rows
                  .map(function (tr, i) {
                      return i % perPage === 0 ? rows.slice(i, i + perPage) : null;
                  })
                  .filter(function (page) {
                      return page;
                  });
      
              totalPages = pages.length;
          },
          fixColumns = function () {
              rect = table.getBoundingClientRect();
              if (   options.fixedColumns 
                  && table.activeHeadings 
                  && table.activeHeadings.length
                  && !columnsFixed) {
                  var cells,
                      hd = false,
                      reducePx = 0;
      
                  // If we have headings we need only set the widths on them
                  // otherwise we need a temp header and the widths need applying to all cells
                  if (table.tHead) {
                      each(table.activeHeadings, function (cell) {
                          cell.style.maxWidth = "";
                          cell.style.width = "";
                      });
                      var expandDone, selectDone = false;
                      each(table.activeHeadings, function (cell, i) {
                          if ((i==0) && options.expand && !expandDone){
                              expandDone = true;
                              cell.style.maxWidth = "20px";
                              cell.style.width = "20px";
                              reducePx += 20;
                          }
                          else if ((i==0||i==1) && options.select && !selectDone){
                              selectDone = true;
                              cell.style.maxWidth = "20px";
                              cell.style.width = "20px";
                              reducePx += 20;
                          }
                          else {
                              var ow = cell.offsetWidth;
                              var w = ow / (rect.width - reducePx) * 100;
                              cell.style.width = w + "%";
                          }
                      });
                  } else {
                      cells = [];
      
                      // Make temperary headings
                      hd = createElement("thead");
                      var r = createElement("tr");
                      each(table.tBodies[0].rows[0].cells, function() {
                          var th = createElement("th");
                          r.appendChild(th);
                          cells.push(th);
                      });
      
                      hd.appendChild(r);
                      table.insertBefore(hd, body);
      
                      var widths = [];
                      each(cells, function (cell, i) {
                          if ((i==0) && options.expand){
                              reducePx += 20;
                          }
                          else if((i==0||i==1) && options.select){
                              reducePx += 20;
                          } 
                          else {
                              var ow = cell.offsetWidth;
                              var w = ow / (rect.width - reducePx) * 100;
                              widths.push(w);
                          }
                      }, this);
      
                      each(table.data, function (row) {
                          each(row.cells, function (cell, i) {
                              if((i==0) && options.expand){
                                  cell.style.width = "20px";
                              }
                              else if ((i==0||i==1) && options.select){
                                  cell.style.width = "20px";
                              }
                              else if (columns().visible(baseCellIdx()+cell.cellIndex))
                                  cell.style.width = widths[i] + "%";
                          }, this);
                      }, this);
      
                      // Discard the temp header
                      table.removeChild(hd);
                  }
                  columnsFixed = true;
              }
          },
          fixHeight = function () { 
              if (options.fixedHeight) {
                  container.style.height = null;
                  rect = container.getBoundingClientRect();
                  container.style.height = rect.height + "px";
              }
              metHeight = options.origPerPage <= table.activeRows.length && options.perPage == options.origPerPage;
          },
          resetCollapse = function() {
              each(table.activeRows, function(row) {
                  var button = row.querySelector("."+ prefix + "table-cmplx-accordion-btn");
                  if(button && !button.classList.contains(prefix + "collapsed")) {
                      button.classList.add(prefix + "collapsed");
                  }
              });
          },
          insert = function (data) {
              var newrows = [];
              if (isObject(data)) {
                  if (data.headings) {
                      if (!table.hasHeadings && !table.hasRows) {
                          var tr = createElement("tr"),
                              th;
                          each(data.headings, function (heading) {
                              th = createElement("th", {
                                  html: heading
                              });

                              tr.appendChild(th);
                          });
                          head.appendChild(tr);

                          header = tr;
                          table.headings = [].slice.call(header.cells);
                          table.hasHeadings = true;

                          // Re-enable sorting if it was disabled due
                          // to missing header
                          // options.sort = initialSortable;
                      }
                  }

                  if (data.rows && isArray(data.rows)) {
                      each(data.rows, function (row, rowIdx) {
                          var headerCount = [];
                          for (var l = 0; l < labels.length; l++) {
                              headerCount.push(l);
                          }
                          var padR = 0,
                              r = [];
                          if (options.expand) {
                              r[0] = renderExpand().outerHTML;
                              padR++;
                              delete headerCount[0];
                          }
                          if (options.select) {
                              var selectData = renderSelect().outerHTML;
                              if (options.expand) {
                                  r[1] = selectData;
                                  padR++;
                                  delete headerCount[1];
                              } else {
                                  r[0] = selectData;
                                  padR++;
                              }
                          }
                          each(row, function (cell, idx) {
                              var index;
                              if(data.headings) {
                                  index = labels.indexOf(data.headings[idx]);
                                  delete headerCount[index];
                              } else {
                                  index = idx;
                              }
                              
                              if (index > -1) {
                                  r[index] = cell;
                              }
                          });
                          for (var z = 0; z < headerCount.length; z++) {
                              if (headerCount[z]) {
                                  r[headerCount[z]] = "";
                              }
                          }
                          if (r.length == (data.headings ? labels.length : (padR + labels.length))) {
                              newrows.push(r);
                          } else {
                              var msg = "Row found at index, [ "+rowIdx+" ] that did not match the current headers.";
                              console.error(msg);
                              uicoreCustomEvent("Table", "Error", table, {"msg": msg});
                          }
                      });
                  }
              }

              if (newrows.length) {
                  if(data.details) {
                      rows().add(newrows, data.details);
                  } else {
                      rows().add(newrows);
                  }
                  columns().rebuild();
                  if(searching) {
                      var query = wrapper.querySelector("input[type='search']").value;
                      self.search(query);
                  }
                  table.hasRows = true;
              }

              fixColumns();
              setRenderColumns();
              columns().rebuild();
              self.update();

              if (!metHeight) {
                  fixHeight();
              }
          },
          createSpecialCharModal = function(){
              var modal = document.getElementById(prefix +"csvSpecialChars");
              if (!modal) {
                  var modalEl = createElement("div", {
                      class: prefix + "modal " + prefix + "fade",
                      role: "dialog",
                      aria_labelledby: prefix + "modal-title",
                      id: prefix+"csvSpecialChars",
                      tabindex: "-1",
                      html: "<div class=\"dds__modal-dialog\" role=\"document\"><div class=\"dds__modal-content\"><div class=\"dds__modal-header\">" +
                          "<h3 class=\"dds__modal-title\" id=\"dds__modal-title1\">CSV with Special Characters</h3></div><button class=\"dds__close\" data-dismiss=\"dds__modal\" aria-label=\"Close\"><span class=\"dds__icons dds__close-x\" aria-hidden=\"true\"></span></button>" +
                          "<div class=\"dds__modal-body\"><p>If you are exporting table data that includes special characters, then you may need to use the following process to see these within Excel:</p><ol class=\"dds__list-group\">" +
                              "<li class=\"dds__list-group-item-ordered\">Open <strong>Excel.</strong></li>" +
                              "<li class=\"dds__list-group-item-ordered\">Open the <strong>Data menu.</strong></li>" +
                              "<li class=\"dds__list-group-item-ordered\">Select the option <strong>From Text/CSV.</strong></li>" +
                              "<li class=\"dds__list-group-item-ordered\">Select the <strong>CSV file.</strong> This should open an import dialog.</li>"+
                              "<li class=\"dds__list-group-item-ordered\">Go to <strong>File Origin </strong> menu and choose the Unicode (UTF-8) options.</li>" +
                              "<li class=\"dds__list-group-item-ordered\"><strong>Load</strong> the file to complete the process.</li>" +
                          "</ol>" +
                          "</div>" +
                          "<div class=\"dds__modal-footer\">" +
                              "<button class=\"dds__btn dds__btn-secondary\" data-dismiss=\"dds__modal\">Cancel</button>" +
                              "<button class=\"dds__btn dds__btn-primary\">Continue Export</button>" +
                          "</div>" +
                          "</div>" +
                          "</div>"
                  });
                  wrapper.appendChild(modalEl);
                  var batchActions = wrapper.querySelector("."+prefix+"table-cmplx-action ." + prefix + "btn-dropdown");
                  var csvBtn = batchActions.querySelector("[data-target='#"+prefix+"csvSpecialChars']");
                  setTimeout(function() {
                      var csvModal = new Modal(csvBtn, {
                          static: false
                      });
                      csvModal.show();
                      modal = document.getElementById(prefix +"csvSpecialChars");
                      var continueBtn = modal.querySelector("." +prefix +"btn-primary");
                      continueBtn.addEventListener("click", function() {
                          handleExportActionEvent(csvBtn);
                      });
                  }, 200);
              }
          },
          isUrl = function (value) {
              return value.match(/(?:(?:https?|ftp):\/\/|\b(?:[a-z\d]+\.))(?:(?:[^\s()<>]+|\((?:[^\s()<>]+|(?:\([^\s()<>]+\)))?\))+(?:\((?:[^\s()<>]+|(?:\(?:[^\s()<>]+\)))?\)|[^\s`!()[\]{};:'".,<>?«»“”‘’]))?/g);
          },
          isEmail = function(value) {
              /* eslint-disable */ 
              return value.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
              /* eslint-enable */ 
          },                                 
          modifyText = function(text) {
              text = text.trim();
              text = text.replace(/\s{2,}/g, " ");
              text = text.replace(/\n/g, "  ");
              text = text.replace(/"/g, "\"\"");
              if (text.indexOf(",") > -1) text = "\"" + text + "\"";
              return text;
          };

      if (!options.header) {
          options.sort = false;
      }

      if (table.tHead === null) {
          if (!options.data ||
              (options.data && !options.data.headings)
          ) {
              options.sort = false;
          }
      }

      if (table.tBodies.length && !table.tBodies[0].rows.length) {
          if (options.data) {
              if (!options.data.rows) {
                  throw new Error(
                      "You seem to be using the data option, but you've not defined any rows."
                  );
              }
          }
      }

      /**
       * Expand a row
       * @param  {number} rowIdx
       * @return {Void} 
       */
      this.expandRow = function(rowIdx) {
          var theRowIdx = validateNum(rowIdx, 0);

          if (typeof theRowIdx === "number") {
              var expandCell = table.activeRows[theRowIdx].querySelector("." + prefix + "table-cmplx-accordion-btn");
              handleAccordionEvent(expandCell);
          }
          return false;
      };

      /**
       * Update the instance
       * @return {Void}
       */
      this.update = function() {
          // Remove class that was set from setMessage if applicable
          if (!(options.search && searching && table.searchData.length == 0)) {
              wrapper.classList.remove(prefix + "table-cmplx-empty");
          }

          paginate();

          renderPage();

          table.sorting = false;

          rows().update();

          if (table.hasRows) {
              table.setAttribute("aria-rowcount", table.activeRows.length);
          } else {
              table.setAttribute("aria-rowcount", 0);
          }

          table.setAttribute("aria-colcount", table.activeHeadings.length);

          uicoreCustomEvent("Table", "UpdateEvent", table);
      };

      /**
       * Perform a search of the data set
       * @param  {string} query
       * @return {void}
       */
      this.search = function(query) {
          if (!table.hasRows) return false;
          
          resetCollapse();
          
          query = query.toLowerCase();

          searching = true;
          table.searchData = [];

          if (!query.length) {
              searching = false;
              if (currentPage != 1) { //if not already on the first page 
                  pagination.page(1);
                  currentPage = 1;
              }
              this.update();
              pagination.setItems(table.activeRows.length);
              uicoreCustomEvent("Table", "SearchEvent", table, { "query": query, "searchData": table.searchData});
              wrapper.classList.remove("search-results");

              return false;
          }

          this.clear();

          each(table.data, function (row, idx) {
              var inArray = table.searchData.indexOf(row) > -1;

              var doesQueryMatch = query.split(" ").reduce(function (bool, word) {
                  
                  var includes = false,
                      cell = null,
                      content = null;

                  for (var x = baseCellIdx(); x < row.cells.length; x++) {
                      cell = row.cells[x];
                      content = cell.hasAttribute("data-content") ? cell.getAttribute("data-content") : cell.textContent;
                      if (
                          content.toLowerCase().indexOf(word) > -1 &&
                          columns().visible(cell.cellIndex)
                      ) {
                          includes = true;
                          break;
                      }
                  }

                  return bool && includes;
              }, true);

              if (doesQueryMatch && !inArray) {
                  row.searchIndex = idx;
                  table.searchData.push(idx);
              } else {
                  row.searchIndex = null;
              }
          }, this);

          wrapper.classList.add("search-results");
          if (!table.searchData.length) {
              wrapper.classList.remove("search-results");
              this.setMessage(options.labels.noRows);
          } else {
              if (table.searchData.length > options.perPage && currentPage != 1) { //if not already on the first page 
                  pagination.page(1);
              }
              currentPage = 1;
              this.update();
          }
          pagination.setItems(table.searchData.length);
          uicoreCustomEvent("Table", "SearchEvent", table, {"query": query, "searchData": table.searchData});
      };

      /**
       * Change page
       * @param  {int} page
       * @return {void}
       */
      this.page = function(page) {
          
          var newPage;

          if (!isNaN(page)) {
              newPage = parseInt(page, 10);    
          } else {
              newPage = page;
          }

          if (newPage == currentPage || newPage > pages.length || newPage < 0) {
              return false;
          }

          currentPage = newPage;

          renderPage();

          if (options.items > 0) {
              pagination.page(newPage);
          }

          uicoreCustomEvent("Table", "PageChangedEvent", table, { "currentPage": currentPage});
      };

      this.perPage = function(detail) {
          
          var newPerPage, newPage, newPages;
          if (!isNaN(detail.perPage)) {
              newPerPage = parseInt(detail.perPage, 10);
          } else {
              newPerPage = detail.perPage;
          }
          if (!isNaN(detail.page)) {
              newPage = parseInt(detail.page, 10);
          } else {
              newPage = detail.page;
          }
          if (!isNaN(detail.pages)) {
              newPages = parseInt(detail.pages, 10);
          } else {
              newPages = detail.perPage;
          }

          if (options.perPage != newPerPage) {
              options.perPage = newPerPage;
              totalPages = newPages;
              currentPage = newPage;

              this.update();

              if (options.items > 0) {
                  pagination.perPage(newPerPage);
              }
              
              if(!metHeight) {
                  fixHeight();
              }
          }
      };

      /**
       * Refresh the instance
       * @return {void}
       */
      this.refresh = function () {

          var that = this;
          if (options.search) {
              input.value = "";
              searching = false;
          }
          currentPage = 1;
          that.update();

          uicoreCustomEvent("Table", "RefreshEvent", table);
      };

      /**
       * Truncate the table
       * @param  {mixes} html - HTML string or HTMLElement
       * @return {void}
       */
      this.clear = function (html) {
          
          if (body) {
              flush(body, isIE);
          }

          var parent = body;
          if (!body) {
              parent = table;
          }

          if (html) {
              if (typeof html === "string") {
                  var frag = DOC.createDocumentFragment();
                  frag.innerHTML = html;
                  parent.appendChild(frag);
              } else {
                  parent.appendChild(html);
              }
          }
      };

      /**
       * Export table to various formats (csv, txt or sql)
       * @param  {Object} exportOptions User options
       * @return {Boolean}
       */
      this.export = function (exportOptions) {
          if (!table.hasHeadings && !table.hasRows) return false;

          var headers = table.activeHeadings,
              rows = [],
              arr = [],
              i,
              x,
              str,
              link;

          var defaults = {
              download: true,
              skipColumn: [],

              filename: params.exportFileName,
      
              // csv
              lineDelimiter: "\n",
              columnDelimiter: ",",

              // sql
              tableName: "myTable",

              // json
              replacer: null,
              space: 4
          };

          // Check for the options object
          if (!isObject(exportOptions)) {
              return false;
          }

          var o = extend(defaults, exportOptions);

          if (o.type) {
              if (options.select) {
                  each(table.selectedRows, function(rowIdx) {
                      rows = rows.concat(table.activeRows[rowIdx]);
                  });
              } else {
                  if (o.currentPage) {
                      rows = rows.concat(pages[currentPage-1]);
                  } else {
                      rows = rows.concat(table.activeRows);
                  }
              }
              // Only proceed if we have data
              if (rows.length) {
                  var blob;
                  if (o.type === "txt" || o.type === "csv") {
                      rows.unshift(header);
                      str = "";

                      each(rows, function(row) {
                          for (x = 0; x < (options.exportDetails ? row.cells.length + 1: row.cells.length) ; x++) {
                              var text;
                              if (x === row.cells.length) {
                                  //add details column if exportDetails = true
                                  if (rows.indexOf(row) > 0) {
                                      text = table.data[rows.indexOf(row)-1].details ? table.data[rows.indexOf(row)-1].details : null;
                                  } else {
                                      text = "Details";
                                  }
                                  if (text) {
                                      str += modifyText(text) + o.columnDelimiter;
                                  }
                              } else if (
                                  x < row.cells.length &&
                                  o.skipColumn.indexOf(headers[x].originalCellIndex) < 0 &&
                                  columns(headers[x].originalCellIndex).visible()
                                  // Check for column skip and visibility
                              ) {
                                  text = row.cells[x].getAttribute("data-content") ? row.cells[x].getAttribute("data-content") : row.cells[x].textContent;
                                  text = modifyText(text);
                                  
                                  var isLink = row.cells[x].querySelector("a");
                                  if (isLink) {
                                      text = isLink.getAttribute("href");
                                      if (text.substring(0,2) === "//") { //Excel won't interpret `//www.example.com` as a hyperlink, but will for links in format `www.example.com` or `http://www.example.com`)
                                          text = text.substring(2, text.length);
                                      } else if (text.substring(0,7) === "mailto:") {
                                          text = text.substring(7,text.length);
                                      }
                                  }
                                  str += text + o.columnDelimiter;
                              }
                          }
                          // Remove trailing column delimiter
                          str = str.trim().substring(0, str.length - 1);

                          // Apply line delimiter
                          str += o.lineDelimiter;
                      });

                      // Remove trailing line delimiter
                      str = str.trim().substring(0, str.length - 1);

                      if (isIE || isEdge) {
                          str = encodeURI(str);
                          blob = new Blob([decodeURIComponent(str)],{type:"text/csv;charset=UTF-8"});
                      }
                  } else if (o.type === "json") {
                      // Iterate rows
                      each(rows, function(row, idx) {
                          arr[idx] = arr[idx] || {};
                          // Iterate columns
                          for (i = 0; i < (options.exportDetails ? headers.length + 1 : headers.length) ; i++) {
                              if (i === headers.length) {
                                  if (table.data[rows.indexOf(row)].details) {
                                      arr[idx]["Details"] = table.data[rows.indexOf(row)].details;
                                  }
                              } else if (
                                  // Check for column skip and column visibility
                                  i < row.cells.length &&
                                  o.skipColumn.indexOf(headers[i].originalCellIndex) < 0 &&
                                  columns(headers[i].originalCellIndex).visible()
                              ) {
                                  if (row.cells[i].getAttribute("data-content")) {
                                      var isLink = row.cells[i].querySelector("a");

                                      if (isLink) { // Aligning with format for exporting to excel
                                          var url = isLink.getAttribute("href");
                                          if (url.substring(0,2) === "//") {
                                              arr[idx][headers[i].textContent] =  url.substring(2, url.length);
                                          } else if (url.substring(0,7) === "mailto:") {
                                              arr[idx][headers[i].textContent] = url.substring(7, url.length);
                                          } else {
                                              arr[idx][headers[i].textContent] = url;
                                          }
                                      } else {
                                          arr[idx][headers[i].textContent] = row.cells[i].getAttribute("data-content");
                                      }
                                  } else {
                                      arr[idx][headers[i].textContent] = row.cells[i].textContent;
                                  }
                              }
                          }
                      });

                      // Convert the array of objects to JSON string
                      str = JSON.stringify(arr, o.replacer, o.space);
                      if (isIE || isEdge) {
                          blob = new Blob([decodeURIComponent(str)],{type:"text/json;charset=UTF-8"});
                      }
                  }

                  // Download
                  if (o.download) {
                      // Filename
                      o.filename = o.filename || "datatable_export";
                      o.filename += "." + o.type;

                     
                      if (isIE || isEdge) {
                          //Internet Explorer
                          window.navigator.msSaveBlob(blob, o.filename);
                      } else {
                          // Create a link to trigger the download
                          if (o.type === "json") {
                              str = "data:application/json;charset=utf-8," + str;
                              str = encodeURI(str);
                          } else if (o.type === "csv") {
                              str = encodeURI(str);
                              str = "data:application/csv;charset=utf-8," + str;
                          }
                          link = createElement("a", {
                              href: str,
                              download: o.filename
                          });

                          // Append the link
                          body.appendChild(link);

                          // Trigger the download
                          link.click();

                          // Remove the link
                          body.removeChild(link);
                      }
                  }

                  return str;
              }
          }

          return false;
      };

      /**
       * Import data to the table
       * @param  {Object} newData User newData
       * @return {Boolean}
       */
      this.import = function (newData) {
          var obj = false;
          var defaults = {
              // csv
              lineDelimiter: "\n",
              columnDelimiter: ","
          };

          // Check for the newData object
          if (!isObject(newData)) {
              return false;
          }
          newData = extend(defaults, newData);

          if (newData.data.length || isObject(newData.data)) {
              // Import CSV
              if (newData.type === "csv") {
                  obj = {
                      rows: [],
                      details: [],
                      headings: []
                  };

                  // Split the string into rows
                  var rows = newData.data.split(newData.lineDelimiter);

                  if (rows.length) {
                      // var importHeaders = rows[0].replace(/\r?\n|\r/g, "").split(newData.columnDelimiter);
                      newData.skipColumn = [];
                      newData.details = -1;
                      // each(importHeaders, function(importHeader, idx) {
                      each(rows[0].replace(/\r?\n|\r/g, "").split(newData.columnDelimiter), function(importHeader, idx) {
                          if (labels.indexOf(importHeader) < 0) {
                              if (importHeader != "Details") {
                                  newData.skipColumn.push(idx);
                              } else {
                                  newData.details = idx;
                              }
                          } else {
                              obj.headings.push(importHeader);
                          }
                      });

                      if(obj.headings) { //.length + baseCellIdx() >= labels.length) {
                          rows.shift();
                          if (rows[rows.length-1] == "") {
                              rows = rows.splice(0, rows.length-1);
                          }
                          each(rows, function (row, i) {
                              row = row.replace(/\r?\n|\r/g, "");
                              obj.rows[i] = [];

                              // Split the rows into values
                              each(row.split(newData.columnDelimiter), function(value, v) {
                                  if (newData.skipColumn.indexOf(v) == -1 && newData.details != v) {
                                      if (isEmail(value)) {
                                          value = "<a href=mailto:" + value + ">" + value + "</a>";
                                      } else if (isUrl(value)) {
                                          value = value.substring(0,3) === "www" ? 
                                              "<a href='//" + value + "'>" + value + "</a>" :
                                              "<a href='" + value + "'>" + value + "</a>";
                                      }
                                      obj.rows[i].push(value);
                                  } else if (newData.details == v) {
                                      obj.details[i] = value;
                                  }
                              });
                          });
                      } else {
                          var msg = "Supplied text/csv file does not contain the correct Header row!";
                          console.error(msg);
                          uicoreCustomEvent("Table", "Error", table, {"msg": msg});
                      }
                  }
              } else if (newData.type === "json") {
                  var json = isJson(newData.data);

                  // Valid JSON string
                  if (json) {
                      obj = {
                          rows: [],
                          details: [],
                          headings: []
                      };

                      if(isArray(json)) {
                          var idx = 0;
                          each(json, function (data) {
                              obj.rows[idx] = [];
                              obj.details[idx] = "";
                              each(data, function(value, importHeader) {
                                  if (labels.indexOf(importHeader) < 0) {
                                      if (importHeader === "Details") {
                                          obj.details[idx] = value;
                                      }
                                  } else {
                                      if (obj.headings.indexOf(importHeader) < 0) {
                                          obj.headings.push(importHeader);
                                      }
                                      if (isEmail(value)) {
                                          value = "<a href=mailto:" + value + ">" + value + "</a>";
                                      } else if (isUrl(value)) {
                                          value = value.substring(0,3) === "www" ?
                                              "<a href='//" + value + "'>" + value + "</a>" :
                                              "<a href='" + value + "'>" + value + "</a>";
                                      }
                                      obj.rows[idx].push(value);
                                  }
                              });
                              idx++;
                          });
                      } else {
                          msg = "That's not valid JSON array data!";
                          console.error(msg);
                          uicoreCustomEvent("Table", "Error", table, {"msg": msg});
                      }
                  } else {
                      msg = "That's not valid JSON!";
                      console.error(msg);
                      uicoreCustomEvent("Table", "Error", table, {"msg": msg});
                  }
              } else if (isObject(newData.data)) {
                  obj = newData.data;
                  obj.details = [];
                  each(obj.rows, function(row, idx) {
                      obj.rows[idx] = row.data;
                      obj.details.push(row.details);
                  });
              } else {
                  return new Error("");
              }
              if (obj) {
                  // Add the rows
                  insert(obj);
              }
          }

          return false;
      };

      /**
       * Print the table
       * @return {void}
       */
      this.print = function () {
          var headings = table.activeHeadings;
          var rows = table.activeRows;

          // Open new window
          var w = window.open();
          var d = w.document;

          var pTable = d.createElement("table");
          var thead = d.createElement("thead");
          var tbody = d.createElement("tbody");

          var tr = d.createElement("tr");
          each(headings, function (th) {
              var newTh = d.createElement("th");
              newTh.appendChild(d.createTextNode(th.textContent));
              tr.appendChild(newTh);
          });

          thead.appendChild(tr);

          each(rows, function (row) {
              var tr = d.createElement("tr");
              each(row.cells, function (cell) {
                  var newCell = d.createElement("td");
                  newCell.appendChild(d.createTextNode(cell.textContent));
                  tr.appendChild(newCell);
              });
              tbody.appendChild(tr);
          });

          pTable.appendChild(thead);
          pTable.appendChild(tbody);

          d.body.appendChild(pTable);

          // Print
          w.print();
      };

      /**
       * Show a message in the table
       * @param {string} message
       */
      this.setMessage = function (message) {

          var colspan = labels.length;
          wrapper.classList.add(prefix + "table-cmplx-empty");

          this.clear(
              createElement("tr", {
                  html: "<td class=\"dataTables-empty\" colspan=\"" +
                      colspan +
                      "\">" +
                      message +
                      "</td>"
              })
          );

          if(!metHeight) {
              fixHeight();
          }
      };

      this.insertDetails = function(rowId, details) {
          var row = table.activeRows[rowId];
          if (row.event != "ExpandCancelEvent") {
              var stripeColor = false;
              if (table.classList.contains(prefix + "table-striped")) {
                  stripeColor = rowId % 2 > 0 ? prefix + "table-cmplx-row-odd" : prefix + "table-cmplx-row-even";
              }
              table.data[rowId].details = row.details = details;
              renderDetails(row, table.headings.length, stripeColor);

              var button = row.cells[0].querySelector("." + prefix + "table-cmplx-accordion-btn");
              each(row.cells[0].querySelectorAll("use"), function(use) {
                  if (use.getAttribute("xlink:href").indexOf(prefix + "loading-sqrs") != -1) {
                      classRemove(use, prefix +"show");
                  } else {
                      classAdd(use, prefix + "show");
                      button.classList.remove(prefix + "collapsed");
                      button.setAttribute("aria-expanded", true);
                  }
              });
              this.update();
              uicoreCustomEvent("Table", "ExpandEndEvent", table, {"rowId": rowId});
          } else {
              return false;
          }
          return true;
      };

      this.delete = function() {
          var that = this;
          if (table.selectedRows.length == 0) {
              return false;
          } else {
              rows().remove(table.selectedRows);
              columns().rebuild();
              pagination.removeItems(table.selectedRows.length);
              if (options.items > 0) {
                  options.items -= table.selectedRows.length;
              }
          }

          if (table.activeRows.length == 0) {
              table.hasRows = false;
              var cell = header.cells[getHeaderCellIndex(prefix + "table-cmplx-select-all")];
              var input = cell.querySelector("input[type='checkbox']");
              if (input.checked) {
                  input.checked = false;
                  input.state = "unchecked";
              }
              handleSelectAllChange(input.state);
          }

          if (searching) {
              var query = wrapper.querySelector("input[type='search']").value;
              var searchResults = table.searchData.length;
              table.searchData = [];
              searching = false;
              if (searchResults == table.selectedRows.length) {
                  wrapper.querySelector("input[type='search']").value = "";
                  that.update();
              } else {
                  that.search(query);
              }
          } else {
              that.update();
          }

          table.selectedRows = [];
          if (!table.hasRows) {
              this.setMessage(options.labels.noRows);
          }
          uicoreCustomEvent("Table","DeleteEvent", table, { "rowIds": table.selectedRows});

      };

      this.deleteAll = function() {
          var that = this;
          if (table.data.length == 0) {
              return false;
          } else { 
              table.data = [];
              pages = [];
              currentPage = 1;
              rows().update();
              columns().rebuild();
              options.items = 0;
              options.perPage = options.origPerPage;
              pagination.setItems(0);
          }

          table.hasRows = false;

          if (options.select) {
              var cell = header.cells[getHeaderCellIndex(prefix + "table-cmplx-select-all")];
              var input = cell.querySelector("input[type='checkbox']");
              if (input && (input.checked || input.state === "indeterminate")) {
                  input.click();
                  input.checked = false;
                  input.state = "unchecked";
              }
              handleSelectAllChange(input.state);
          }


          if (searching) {
              searching = false;
              wrapper.querySelector("input[type='search']").value = "";
          } 
          that.update(); 

          this.setMessage(options.labels.noRows);

          uicoreCustomEvent("Table","DeleteAllEvent", table);  
      };

      this.setItems = function(items) {
          var newNum = validateNum(items);
          if (!newNum || options.items != 0) {
              return false;
          } else {
              options.items = newNum;
              pagination.setItems(options.items);
          }
      };

      //init
      if (!(stringTable in element)) {
          // Set the tables Id
          var crypto = window.crypto || window.msCrypto;
          batchId = crypto.getRandomValues(new Uint32Array(10))[0];
          if (options.search && options.text.search.label) {
              searchId = crypto.getRandomValues(new Uint32Array(10))[0];
          }

          table.data = null; // populated in dataToTable
          table.hasRows = false; // set in render
          table.headings = []; // duplicate commented out of code in render
          table.hasHeadings = false;
          
          // IE detection
          isIE = !!/(msie|trident)/i.test(navigator.userAgent);

          currentPage = 1;

          columnRenderers = [];
          selectedColumns = [];

          
          table.activeHeadings = [];
          
          table.sorting = false;
          
          table.searchData = [];
          table.hiddenColumns = [];
          if (options.select)
              table.selectedRows = [];

          render();

          // Options pagination
          if (options.pagination) {
              var itemCount = options.items > 0 ? options.items : table.activeRows.length;
              pagination = new Pagination(paginationElement, {
                  perPageSelect: options.perPageSelect,
                  perPage: options.perPage,
                  items: itemCount,
                  pageText: params.text && params.text.pageText,
                  itemsPerPageText: params.text && params.text.itemsPerPageText,
                  hidePages: params.hidePages,
                  external: options.items == 0 ? false : true,
                  buttonLabelLeft: options.buttonLabelLeft,
                  buttonLabelRight: options.buttonLabelRight,
                  disablePaginationInput: options.disablePaginationInput,
                  showTotal: options.showTotal
              });
              // Option to override the item count was padded in
              if (options.items == 0) {
                  paginationElement.parentNode.addEventListener("uicPaginationPageUpdateEvent", function(e) {
                      self.page(e.detail.page);
                  }, false);
                  paginationElement.parentNode.addEventListener("uicPaginationPerPageUpdateEvent", function(e) {
                      self.perPage(e.detail);
                  }, false);
              } else {
                  paginationElement.parentNode.addEventListener("uicPaginationPageChangeEvent", function(e) {
                      if (table.activeRows.length < (e.detail.page * e.detail.perPage)) {
                          var rowsNeeded = (e.detail.page * e.detail.perPage) - table.activeRows.length;
                          if ((e.detail.page * e.detail.perPage) > options.items) {
                              rowsNeeded = options.items - table.activeRows.length;
                          }
                          if (rowsNeeded > 0) {
                              uicoreCustomEvent("Table", "NewPageEvent", table, { "page": e.detail.page, "rows" : rowsNeeded });
                          } else {
                              self.page(e.detail.page);
                          }
                      } else {
                          self.page(e.detail.page);
                      }
                  }, false);
                  paginationElement.parentNode.addEventListener("uicPaginationPerPageChangeEvent", function(e) {
                      if ((e.detail.page * e.detail.perPage) > table.activeRows.length ) {
                          var rowsNeeded = (e.detail.page * e.detail.perPage) - table.activeRows.length;
                          if ((e.detail.page * e.detail.perPage) <= options.items) {
                              uicoreCustomEvent("Table", "MoreRowsEvent", table, { "page": e.detail.page, "perPage": e.detail.perPage, "rows" : rowsNeeded });
                          } else {
                              self.perPage(e.detail);
                          }
                      } else {
                          self.perPage(e.detail);
                      }
                  }, false);
              }
          }

          // Options condensed
          if (options.condensed) {
              wrapper.querySelector("." + prefix + "table-cmplx").classList.add(prefix + "condensed");
          }

          each(wrapper.querySelectorAll("[data-toggle=\"dds__dropdown\"]"), function(drop) {
              if (drop.classList.contains(prefix+"table-cmplx-action-button")) {
                  new Dropdown(drop);
              }
          });
      }

      element[stringTable] = self;
  }

  function Tooltip(element, options) {
      // initialization element
      element = element instanceof HTMLElement ? element : (function() {
          return false;
      })();

      // set options
      options = options || {};
      options = jsonOptionsInit(element, options);
      var textAlignments = ["left", "center", "right"];
      // init options
      options.title = element.dataset.title ? element.dataset.title : options.data_title ? options.data_title : null,
      options.animation = options.animation && options.animation === "boolean" ? options.animation : options.animation && options.animation === prefix + "fade" ? prefix + "fade" : false;
      options.placement = element.dataset.placement ? element.dataset.placement : options.data_placement ? options.data_placement : null;
      options.textAlign = element.dataset.text_align && textAlignments.indexOf(element.dataset.text_align.toLowerCase()) > -1 
          ? element.dataset.text_align.toLowerCase() : options.text_align && textAlignments.indexOf(options.text_align.toLowerCase()) > -1 
              ? options.text_align.toLowerCase() : "center";
      options.delay = element.dataset.delay ? validateNum(element.dataset.delay, 60) : validateNum(options.delay, 60);
      options.container = element.dataset.container ? element.dataset.container : options.container ? options.container : DOC.body;

      
      // validate options
      (function () {
          if (options.title == null) {
              throw new Error("There was a problem found with title value, please correct and try again");
          }
          if (options.placement == null) {
              throw new Error("There was a problem found with placement value, please correct and try again");
          }
          var inOffCanvas = getClosest(element, "." + prefix + "modal-offcanvas");
          if(inOffCanvas) {
              options.container = inOffCanvas;
          } else {
              var inFixedTop = getClosest(element, ".fixed-top");
              if(inFixedTop) {
                  options.container = inFixedTop;
              } else {
                  var inFixedBottom = getClosest(element, ".fixed-bottom");
                  if(inFixedBottom) {
                      options.container = inFixedBottom;
                  }
              }
          }

      })();

      // bind, event targets, title and constants
      var self = this,
          stringTooltip = "Tooltip",
          mouseHover = "onmouseleave" in DOC ? ["mouseenter", "mouseleave"] : ["mouseover", "mouseout"],
          tooltip,
          tooltipArrow,
          createToolTip = function() {

              var tooltipIdText = options.title.replace(/[\s\W]/g, "").toLowerCase().substring(0, 15);
              var tooltipId = tooltipIdText;
              var counter = 1;
              while (DOC.getElementById(tooltipId)) {
                  tooltipId = tooltipIdText + counter;
                  counter++;
              }

              tooltip = createElement("div", {
                  role: "tooltip",
                  aria_describedby: tooltipId
              });
              tooltip.style["top"] = "0px"; //move tooltip to top to prevent scrollbar during calculation

              // tooltip arrow
              tooltipArrow = createElement("div", {
                  class: prefix + "arrow " + prefix + "position-absolute " + prefix + "d-block"
              });

              tooltip.appendChild(tooltipArrow);
              // tooltip inner

              var tooltipInner = createElement("div", {
                  class: prefix+"tooltip-inner " + prefix + "text-" + options.textAlign,
                  html: options.title,
                  id: tooltipId
              });
              tooltip.appendChild(tooltipInner);

              options.container.appendChild(tooltip);
              tooltip.setAttribute("class", prefix+"tooltip " + prefix+"bs-tooltip"+"-"+options.placement + " " + options.animation + " " + prefix + "position-absolute " + prefix + "d-block " + prefix + "break-word");
          },
          updateTooltip = function() {
              tooltip.setAttribute("style", "");
              tooltipArrow.setAttribute("style", "");
              styleTip(element, tooltip, options.placement, options.container, true);
          },
          showTooltip = function() {
              !(tooltip.classList.contains(prefix + "show")) && tooltip.classList.add(prefix + "show");
          },
          // triggers
          showTrigger = function() {
              globalObject.addEventListener("resize", self.hide, false);
              uicoreCustomEvent("Tooltip", "Shown", element);
          },
          hideTrigger = function() {
              globalObject.removeEventListener("resize", self.hide);
              uicoreCustomEvent("Tooltip", "Hidden", element);
          },
          keyHandler = function(e) {
              var key = e.which || e.keyCode;
              if (key === 27) {
                  self.hide(e);
              } else if (key === 13) {
                  self.show();
              }
          },
          touchHandler = function(e) {
              if (tooltip.classList.contains(prefix + "show")) {
                  if ((!e.target === tooltip || !tooltip.contains(e.target)) && element !== e.target) {
                      self.hide();
                  }
              }
          };

      // public methods
      this.show = function() {
          setTimeout(function() {
              updateTooltip();
              showTooltip();
              uicoreCustomEvent("Tooltip", "ShowEvent", element);
              options.animation
                  ? emulateTransitionEnd(tooltip, showTrigger)
                  : showTrigger();
          }, options.delay);
      };
      this.hide = function(e) {
          var target = DOC.activeElement;
          if (e && e.relatedTarget) {
              target = e.relatedTarget;
          }
          if ((!target === tooltip || !tooltip.contains(target)) && target !== element) {
              setTimeout(function() {
                  if (tooltip && tooltip.classList.contains(prefix + "show")) {
                      uicoreCustomEvent("Tooltip", "HideEvent", element);
                      tooltip.classList.remove(prefix + "show");
                      options.animation
                          ? emulateTransitionEnd(tooltip, hideTrigger)
                          : hideTrigger();
                  }
              }, options.delay);
          }
      };
      this.toggle = function() {
          if (!tooltip) {
              self.show();
          } else {
              self.hide();
          }
      };

      // init
      if (!(stringTooltip in element)) {
          // prevent adding event handlers twice
          element.setAttribute("data-original-title", options.title);
          element.removeAttribute("title");
          element.addEventListener(mouseHover[0], self.show, false);
          element.addEventListener("focusin", self.show, false);
          element.addEventListener(mouseHover[1], self.hide, false);   
          element.addEventListener("focusout", self.hide, false);
          element.addEventListener("keydown", keyHandler, false);
          if(isIOS){
              element.addEventListener("click", self.show, false);
              window.addEventListener("touchstart", touchHandler, false);
          }
          if (!tooltip) {
              createToolTip();
              tooltip.addEventListener("mouseleave", self.hide, false);
          }
      }

      element[stringTooltip] = self;
  }

  // globals
  var body = "body", // allow the library to be used in <head>
      supports = [];

  var initializeDataAPI = function (constructor, collection) {
      each(collection, function(i) {
          new constructor(i);
      });
      },
      initCallback = function (lookUp) {
          lookUp = lookUp || DOC;
          each(supports, function(support) {
              initializeDataAPI(
                  support[0],
                  lookUp["querySelectorAll"](support[1])
              );

          });
  };

  // ALERT DATA API
  supports["push"]([Alert, "[data-dismiss=\"" + prefix + "alert\"]"]);

  // BUTTON DATA API
  supports["push"]([Button, "[data-toggle=\"" + prefix + "button\"]"]);

  // BUTTON DATA API
  supports["push"]([BarSelect, "[data-toggle=\"" + prefix + "bar-select\"]"]);

  // BUTTON FILTER DATA API
  supports["push"]([ButtonFilter, "[data-toggle=\"" + prefix + "button-filter\"]"]);

  // CAROUSEL DATA API
  supports["push"]([Carousel, "[data-ride=\"" + prefix + "carousel\"]"]);

  // CAROUSEL FILMSTRIP DATA API
  supports["push"]([FilmstripCarousel, "[data-toggle=\"" + prefix + "filmstrip-carousel\"]"]);

  // COLLAPSE DATA API
  supports["push"]([Collapse, "[data-toggle=\"" + prefix + "collapse\"]"]);

  // CONTACT DRAWER DATA API
  supports["push"]([ContactDrawer, "[data-toggle=\"" + prefix + "contact-drawer\"]"]);

  // DROPDOWN DATA API
  supports["push"]([Dropdown, "[data-toggle=\"" + prefix + "dropdown\"]"]);

  // DATEPICKER DATA API
  supports["push"]([DatePicker, "[data-toggle=\"" + prefix + "datepicker\"]"]);

  // FILTER COLLECTION DATA API
  supports["push"]([FilterCollection, "[data-toggle=\"" + prefix + "filter-collection\"]"]);

  // KEYWORD FILTER DATA API
  supports["push"]([FilterKeyword, "[data-toggle=\"" + prefix + "filter-keyword\"]"]);

  // FORM CAROUSEL DATA API
  supports["push"]([Forms, "[data-toggle=\"" + prefix + "form-validation\"]"]);

  // LINKPICKER DATA API
  supports["push"]([LinkPicker, "[data-toggle=\"" + prefix + "linkpicker\"]"]);

  // MASTHEAD DATA API
  supports["push"]([Masthead, "[data-toggle=\"" + prefix + "msthd\"]"]);

  // MODAL DATA API
  supports["push"]([Modal, "[data-toggle=\"" + prefix + "modal\"]"]);

  // NAVIGATION ANCHORED DATA API
  supports["push"]([NavAnchored, "[data-toggle=\"" + prefix + "nav-anchored\"]"]);

  // NAVIGATION ANCHORED VERTICAL DATA API
  supports["push"]([NavAnchoredVertical, "[data-toggle=\"" + prefix + "nav-anchored-vertical\"]"]);

  // NAV LEFT DATA API
  supports["push"]([NavLeft, "[data-toggle=\"" + prefix +"nav-left\"]"]);

  // SKIPNAV DATA API
  supports["push"]([NavSkip, "[data-toggle=\"" + prefix +"nav-skip\"]"]);

  // PAGINATION DATA API
  supports["push"]([Pagination, "[data-toggle=\"" + prefix + "pagination\"]"]);

  // POPOVER DATA API
  supports["push"]([Popover, "[data-toggle=\"" + prefix + "popover\"]"]);

  // PRODUCTSTACK DATA API
  supports["push"]([ProductStack, "[data-toggle=\"" + prefix + "product-stack\"]"]);

  // PROGRESS DATA API
  supports["push"]([Progress, "[data-toggle=\"" + prefix + "progress\"]"]);

  // SKIPNAV DATA API
  supports["push"]([NavSkip, "[data-toggle=\"" + prefix +"nav-skip\"]"]);

  // Slider DATA API
  supports["push"]([Slider, "[data-toggle=\"" + prefix + "slider\"]"]);

  // Spinbox DATA API
  supports["push"]([Spinbox, "[data-toggle=\"" + prefix + "spinbox\"]"]);

  // TABLE DATA API
  supports["push"]([TableComplex, "[data-table=\"" + prefix + "table\"]"]);

  // TAB DATA API
  supports["push"]([Tab, "[data-toggle=\"" + prefix + "tab\"]"]);

  // TOOLTIP DATA API
  supports["push"]([Tooltip, "[data-toggle=\"" + prefix + "tooltip\"]"]);

  // bulk initialize all components
  DOC[body] ? initCallback() : DOC.addEventListener("DOMContentLoaded", function () {
      initCallback();
  });

  window.addEventListener("keydown", handleFirstTab);

  exports.Alert = Alert;
  exports.BarSelect = BarSelect;
  exports.Button = Button;
  exports.ButtonFilter = ButtonFilter;
  exports.Carousel = Carousel;
  exports.Collapse = Collapse;
  exports.ContactDrawer = ContactDrawer;
  exports.DatePicker = DatePicker;
  exports.Dropdown = Dropdown;
  exports.FilmstripCarousel = FilmstripCarousel;
  exports.FilterCollection = FilterCollection;
  exports.FilterKeyword = FilterKeyword;
  exports.Form = Forms;
  exports.LinkPicker = LinkPicker;
  exports.Masthead = Masthead;
  exports.Modal = Modal;
  exports.NavAnchored = NavAnchored;
  exports.NavAnchoredVertical = NavAnchoredVertical;
  exports.NavLeft = NavLeft;
  exports.NavSkip = NavSkip;
  exports.Pagination = Pagination;
  exports.Popover = Popover;
  exports.ProductStack = ProductStack;
  exports.Progress = Progress;
  exports.SkipNav = NavSkip;
  exports.Slider = Slider;
  exports.Spinbox = Spinbox;
  exports.Tab = Tab;
  exports.Table = TableComplex;
  exports.Tooltip = Tooltip;
  exports.handleFirstTab = handleFirstTab;
  exports.loadURLSVGs = loadURLSVGs;

  Object.defineProperty(exports, '__esModule', { value: true });

})));

//# sourceMappingURL=dds-all.js.map
