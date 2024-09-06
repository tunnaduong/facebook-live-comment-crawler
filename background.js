// background.js

let extractionInterval = null;

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startExtraction") {
    // Save class names and timer value to storage
    chrome.storage.local.set({
      urlClassName: message.urlClassName,
      commentClassName: message.commentClassName,
      endCommentClassName: message.endCommentClassName,
      timer: message.timer,
    });

    // Clear any existing interval
    if (extractionInterval) clearInterval(extractionInterval);

    // Set the extraction interval
    extractionInterval = setInterval(() => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: extractAndSendData,
            args: [
              message.urlClassName,
              message.commentClassName,
              message.endCommentClassName,
            ],
          });
        }
      });
    }, message.timer);

    sendResponse({ status: "Extraction started" });
  } else if (message.action === "stopExtraction") {
    // Stop the extraction process
    if (extractionInterval) {
      clearInterval(extractionInterval);
      extractionInterval = null;
      sendResponse({ status: "Extraction stopped" });
    } else {
      sendResponse({ status: "Extraction is not running." });
    }
  }
});

// Function executed in the content script context
function extractAndSendData(
  urlClassName,
  commentClassName,
  endCommentClassName
) {
  const authorPattern = /=R&amp;paipv=0">(.*?)<\/a/g;
  const profileUrlPattern = new RegExp(`${urlClassName}" href="(.*?)eav`, "g");
  const commentContentPattern = new RegExp(
    `class="${commentClassName}">(.*?)<\\/div><div class="${endCommentClassName}"`,
    "g"
  );

  const html = document.documentElement.innerHTML;

  // Extract authors, profile URLs, and comments
  const authors = [...html.matchAll(authorPattern)].map((match) => match[1]);
  const profileUrls = [...html.matchAll(profileUrlPattern)].map(
    (match) => match[1]
  );
  const comments = [...html.matchAll(commentContentPattern)].map(
    (match) => match[1]
  );

  // Combine data into JSON
  const extractedData = authors.map((name, index) => ({
    profile_url: profileUrls[index] || "N/A",
    name: name || "N/A",
    comment: comments[index] || "N/A",
  }));

  // Send data to the API
  fetch("https://tunnaduong.com/test_api/fb_live_chat.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content: extractedData }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Success:", data);
      chrome.runtime.sendMessage({ status: "Comments extracted and sent!" });
    })
    .catch((error) => {
      console.error("Error:", error);
      chrome.runtime.sendMessage({ status: "Error occurred." });
    });
}
