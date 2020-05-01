const JS = `

function rev(sortFn) {
  return function(a, b) { return sortFn(b, a) }
}
function coresortable(a, b) {
  let amatch = a.match(/^\\d+([^\\d]\\d+)*/g)
  let bmatch = b.match(/^\\d+([^\\d]\\d+)*/g)
  if (!amatch) {
    return a.localeCompare(b);
  }
  if (!bmatch) {
    return a.localeCompare(b);
  }

  let aparts = amatch[0].split(/[^\\d]/)
  let bparts = bmatch[0].split(/[^\\d]/)
  if (aparts.length != bparts.length) {
    return aparts.length - bparts.length;
  }
  for (let i = 0; i < aparts.length; i++) {
    if (parseInt(aparts[i]) != parseInt(bparts[i])) {
      return parseInt(aparts[i]) - parseInt(bparts[i])
    }
  }
  return 0
}

document.querySelectorAll('table').forEach((table) => {
  let currentSort;
  let reverse = false;
  function sort(rowa, rowb) {
    let a = rowa.children[currentSort].innerText;
    let b = rowb.children[currentSort].innerText;
    return coresortable(a, b)
  }

  let testruns = []
  function test(label, a, b, expected) {
    let result = coresortable(a, b)

    if (result > 0) {
      result = 1
    }
    if (result < 0) {
      result = -1
    }

    if (result !== expected) {
      debugger
      coresortable(a, b)
    }

    testruns.push({
      label,
      a,
      b,
      result,
      expected,
      success: result === expected
    })
  }
  test("number", "1", "2", -1)
  test("ip address1", "1.1.1.1", "1.1.8.8", -1)
  test("ip address2", "1.250.1.1", "1.1.8.8", 1)
  test("thousand separator", "1,000,000.05", "2", 1)
  test("german thousand separator", "1.000.000,05", "2", 1)
  test("just text", "the quick brown fox", "the slow brown fox", -1)
  test("fraction", "1/100", "1/1000", -1)
  console.table(testruns)
  header = table.querySelector('tr')
  let parentNode = table.querySelector('tbody');
  Array.from(header.children).map((child, idx) => {

    child.onclick = function onChildClick(e) {
      e.stopPropagation()
      e.stopImmediatePropagation()
      e.preventDefault()
      if (currentSort == idx) {
        reverse = !reverse
      } else {
        reverse = false
      }
      currentSort = idx
      rows = Array.from(table.querySelectorAll(':scope > tbody > tr'))
      if (reverse) {
        rows.sort(rev(sort))
      } else {
        rows.sort(sort)
      }

      rows.forEach((row) => {
        parentNode.insertBefore(row, null)
      })
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
