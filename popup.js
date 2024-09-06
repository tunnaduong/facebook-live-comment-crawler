// Popup script: popup.js

// Load saved values from localStorage when the popup is opened
window.addEventListener("DOMContentLoaded", () => {
  const savedUrlClassName = localStorage.getItem("urlClassName");
  const savedCommentClassName = localStorage.getItem("commentClassName");
  const savedEndCommentClassName = localStorage.getItem("endCommentClassName");

  // Set saved values to the input fields if available
  if (savedUrlClassName) {
    document.getElementById("urlClassName").value = savedUrlClassName;
  }
  if (savedCommentClassName) {
    document.getElementById("commentClassName").value = savedCommentClassName;
  }
  if (savedEndCommentClassName) {
    document.getElementById("endCommentClassName").value =
      savedEndCommentClassName;
  }
});

document.getElementById("crawlButton").addEventListener("click", () => {
  const urlClassName = document.getElementById("urlClassName").value.trim();
  const commentClassName = document
    .getElementById("commentClassName")
    .value.trim();
  const endCommentClassName = document
    .getElementById("endCommentClassName")
    .value.trim();

  // Validate inputs
  if (!urlClassName || !commentClassName || !endCommentClassName) {
    document.getElementById("status").innerText = "Please fill in both fields.";
    return;
  }

  // Save input values to localStorage
  localStorage.setItem("urlClassName", urlClassName);
  localStorage.setItem("commentClassName", commentClassName);
  localStorage.setItem("endCommentClassName", endCommentClassName);

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: extractAndSendData,
      args: [urlClassName, commentClassName, endCommentClassName],
    });
  });

  document.getElementById("status").innerText = "Extracting comments...";
});

// Define the function to be executed in the content script context
function extractAndSendData(
  urlClassName,
  commentClassName,
  endCommentClassName
) {
  // Create dynamic regex patterns with the class names
  const authorPattern = new RegExp(`=R&amp;paipv=0">(.*?)<\/a`, "g"); // Example for URL class name
  const commentContentPattern = new RegExp(
    `class="${commentClassName}">(.*?)<\\/div><div class="${endCommentClassName}"`,
    "g"
  ); // Example for comment class name
  const profileUrlPattern = new RegExp(`${urlClassName}" href="(.*?)eav`, "g"); // Author's profile URL

  const html = document.documentElement.innerHTML;

  // Extracting authors, profile URLs, and comments
  const authors = [...html.matchAll(authorPattern)].map((match) => match[1]);
  const profileUrls = [...html.matchAll(profileUrlPattern)].map(
    (match) => match[1]
  );
  const comments = [...html.matchAll(commentContentPattern)].map(
    (match) => match[1]
  );

  // Combine extracted data into a structured JSON array
  const extractedData = authors.map((name, index) => ({
    profile_url: profileUrls[index] || "N/A",
    name: name || "N/A",
    comment: comments[index] || "N/A",
  }));

  //   console.log("Extracted Data:", extractedData);

  // Send data to API
  fetch("https://tunnaduong.com/test_api/fb_live_chat.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content: extractedData }),
  })
    .then((response) => response.json())
    .then((data) => {
      //   console.log("Success:", data);
      chrome.runtime.sendMessage({ status: "Comments extracted and sent!" });
    })
    .catch((error) => {
      console.error("Error:", error);
      chrome.runtime.sendMessage({ status: "Error occurred." });
    });
}

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.status) {
    document.getElementById("status").innerText = message.status;
  }
});
