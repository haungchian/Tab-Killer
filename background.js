console.log("background loaded");


var isEnabled = true;
var maxTabs = 3;
var tabsCount;
var scaling = false;
var displays = [];
let scale = 1;

function updateBadgeText() {
    var tabsBalance = maxTabs - tabsCount;
    var tabsAllowanceRemaining = (tabsBalance > 0) ? tabsBalance : 0;

    chrome.browserAction.setBadgeText({
        text: "" + tabsAllowanceRemaining
    });
}

function updateTabsCount() {
    chrome.tabs.query({
        windowType: 'normal',
        pinned: false
    }, function (tabs) {
        tabsCount = tabs.length;
        updateBadgeText();
    });
}

function handleTabCreated(tab) {
    if (tabsCount >= maxTabs) {
        // chrome.tabs.remove(tab.id);
        // setTimeout(function(){chrome.tabs.remove(tab.id)}, 5000);
        scale = scale /2;
        console.log(scale);
        scaleWindow(tab.windowId, scale);
    }
    else {
        updateTabsCount();
    }
}

function handleTabRemoved(tab) {
    updateTabsCount();
}

function handleTabUpdated(tab) {
    updateTabsCount();
}

function init() {
    updateTabsCount();
    chrome.tabs.onCreated.addListener(handleTabCreated);
    chrome.tabs.onRemoved.addListener(handleTabRemoved);
    chrome.tabs.onUpdated.addListener(handleTabUpdated);
}

function teardown() {
    chrome.tabs.onCreated.removeListener(handleTabCreated);
    chrome.tabs.onRemoved.removeListener(handleTabRemoved);
    chrome.tabs.onUpdated.removeListener(handleTabUpdated);
}

chrome.browserAction.onClicked.addListener(function (tab) {
    if (!isEnabled) {
        init();
        chrome.browserAction.setIcon({ path: "enable.png" });
    }
    else {
        teardown();
        chrome.browserAction.setIcon({ path: "disable.png" });
        chrome.browserAction.setBadgeText({ 'text': ' ' });
    }

    isEnabled = !isEnabled;
});

init();

chrome.system.display.getInfo(function (ds){
  for (var display of ds){
    displays.push(display.bounds);
  }
});

function initWin(win){
  for (var display of displays){
    if (win.left >= display.left && win.left <= display.left + display.width &&
      win.top >= display.top && win.top <= display.top + display.height){
        win.left = display.left;
        win.top = display.top;
        win.width = display.width;
        win.height = display.height;
        originalWins[win.id] = win;
        break;
    }
  }
}


var originalWins = {};
chrome.windows.getAll({}, function (winArr){
  for (var win of winArr){
    initWin(win);
  }
});

chrome.windows.onCreated.addListener(function (win){
  initWin(win);
});

function scaleWindow(windowId, scale){
  scaling = true;

  var original = originalWins[windowId];

  var newWidth = Math.round(original.width - original.width * scale);
  var params = {
    left: Math.round((original.width - newWidth) / 2),
    width: newWidth,
    height: Math.round(original.height - original.height * scale)
  };
  if (newWidth < 400){
    delete params.left;
  }

  chrome.windows.update(windowId, params, function (win){
    scaling = false;
  });
}
