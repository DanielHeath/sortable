const JS = `
function rev(sortFn) {
  return function(a, b) { return sortFn(b, a) }
}
document.querySelectorAll('table').forEach((table) => {
  let currentSort;
  let reverse = false;
  function sort(rowa, rowb) {

    let a = rowa.children[currentSort].innerText;
    let b = rowb.children[currentSort].innerText;

    if (isNaN(parseFloat(a)) || isNaN(parseFloat(b))) {
      return a.localeCompare(b);
    }
    return parseFloat(a) - parseFloat(b);
  }


  header = table.querySelector('tr')
  Array.from(header.children).map((child, idx) => {
    child.onclick = function onChildClick() {
      if (currentSort == idx) {
        reverse = !reverse
      } else {
        reverse = false
      }
      currentSort = idx

      rows = Array.from(table.querySelectorAll('tr'))
      let parentNode = rows[0].parentNode;
      rows.shift() // remove header row
      if (reverse) {
        rows.sort(rev(sort))
      } else {
        rows.sort(sort)
      }

      rows.forEach((row) => parentNode.insertBefore(row, null))
    }
  })
})
`;
const TITLE_APPLY = "Make sortable";
const TITLE_REMOVE = "Already sortable";
const APPLICABLE_PROTOCOLS = ["http:", "https:"];

/*
Toggle JS: based on the current title, insert or remove the JS.
Update the page action's title and icon to reflect its state.
*/
function toggleJS(tab) {

  function gotTitle(title) {
    if (title === TITLE_APPLY) {
      browser.pageAction.setIcon({tabId: tab.id, path: "icons/on.svg"});
      browser.pageAction.setTitle({tabId: tab.id, title: TITLE_REMOVE});
      browser.tabs.executeScript({code: JS});
    } else {
      // browser.pageAction.setIcon({tabId: tab.id, path: "icons/off.svg"});
      // browser.pageAction.setTitle({tabId: tab.id, title: TITLE_APPLY});
      // browser.tabs.executeScript({code: OppositeOfJS});
    }
  }

  var gettingTitle = browser.pageAction.getTitle({tabId: tab.id});
  gettingTitle.then(gotTitle);
}

/*
Returns true only if the URL's protocol is in APPLICABLE_PROTOCOLS.
*/
function protocolIsApplicable(url) {
  var anchor =  document.createElement('a');
  anchor.href = url;
  return APPLICABLE_PROTOCOLS.includes(anchor.protocol);
}

/*
Initialize the page action: set icon and title, then show.
Only operates on tabs whose URL's protocol is applicable.
*/
function initializePageAction(tab) {
  if (protocolIsApplicable(tab.url)) {
    browser.pageAction.setIcon({tabId: tab.id, path: "icons/off.svg"});
    browser.pageAction.setTitle({tabId: tab.id, title: TITLE_APPLY});
    browser.pageAction.show(tab.id);
  }
}

/*
When first loaded, initialize the page action for all tabs.
*/
var gettingAllTabs = browser.tabs.query({});
gettingAllTabs.then((tabs) => {
  for (let tab of tabs) {
    initializePageAction(tab);
  }
});

/*
Each time a tab is updated, reset the page action for that tab.
*/
browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
  initializePageAction(tab);
});

/*
Toggle JS when the page action is clicked.
*/
browser.pageAction.onClicked.addListener(toggleJS);
