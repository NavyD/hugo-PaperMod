// [Infinite Scrolling on Hugo List Pages](https://sentamal.in/articles/infinite-scrolling-on-hugo-list-pages/)

function getNextPageLink(page) {
    if (!page) {
        page = document;
    }
    return page.querySelector('main footer.page-footer a.next');
}

async function loadNextPageEntries() {
    const container = document.querySelector("main.main");
    const curPageLink = getNextPageLink();
    const curNextPageUrl = curPageLink.getAttribute('href');

    console.log(`fetching next page from ${curNextPageUrl}`);
    const resp = await fetch(curNextPageUrl);
    if (!resp.ok) {
        throw new Error("response.ok was unsuccessful with status '" + resp.statusText
            + " (" + resp.status + ")'");
    }
    const data = await resp.text();
    const nextPageDom = new DOMParser().parseFromString(data, "text/html");
    console.log("pagination: Data parsed into temporary DOM!");

    const nextEntries = nextPageDom.querySelectorAll('main .post-entry');
    const curPageFooter = document.querySelector('main footer.page-footer');
    console.log(`adding new ${nextEntries.length} entries`);
    for (let i = 0; i < nextEntries.length; i++) {
        container.insertBefore(nextEntries[i], curPageFooter)
    }

    /* Update the history to the last page loaded */
    const state = {
        "status": "pagination: New list items added",
        "previousPage": window.location.pathname + window.location.search,
        "currentPage": curNextPageUrl
    };
    console.log(`pushing history state ${state}`);
    history.pushState(state, "", curNextPageUrl);

    /* Update the next page link on the current page */
    let nextPageLink = getNextPageLink(nextPageDom);
    if (nextPageLink) { // When there is no next page, newNextLink is 'null'
        const nextPageUrl = nextPageLink.getAttribute("href");
        console.log(`updating next page url ${nextPageUrl}`)
        curPageLink.setAttribute("href", nextPageUrl);
    } else { // When there are no other pages, remove the next page link
        console.log("removing next page anchor for pagination end");
        container.removeChild(curPageFooter);
    }
}

/* Add onclick to '.paginator-next-page' if Fetch API is available */
function mannualFetchSupport() {
    const curPageLink = getNextPageLink();
    if ("fetch" in window && curPageLink) {
        console.log("pagination: Fetch API available");
        curPageLink.onclick = function (e) {
            loadNextPageEntries();
            e.preventDefault();
        };
    }
}

/* Use the Intersection Observer API to get new items when scrolled down */
function observeForInfiniteScroll() {
    let nextPageObserver = new IntersectionObserver((entries, observer) => {
        /* This is the callback function */
        let firstEntry = entries[0]; // I'm not using multiple thresholds, so 0 suffices
        if (firstEntry.isIntersecting) { // Basically if the footer is in view, run
            if (!getNextPageLink()) {
                observer.disconnect(); // Stop the observer when there's no more pages
                console.log("pagination: IntersectionObserver disconnected!");
            } else {
                loadNextPageEntries();
            }
        }
    }, {
        rootMargin: "0px 0px 80px 0px"
    });
    nextPageObserver.observe(document.querySelector("main footer.page-footer"));
}

function init() {
    window.addEventListener('load', (e) => {
        if ("IntersectionObserver" in window && "fetch" in window) {
            console.log("pagination: IntersectionObserver and Fetch API available")
            observeForInfiniteScroll();
        }
        mannualFetchSupport();
    });

    window.addEventListener('popstate', (e) => {
        document.querySelector("main").scrollIntoView(true);
        history.go();
        console.log("pagination: Previous page loaded!");
    });
}

init()
