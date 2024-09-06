// Load saved values when the popup opens
window.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(
    ["urlClassName", "commentClassName", "endCommentClassName", "timer"],
    (data) => {
      document.getElementById("urlClassName").value = data.urlClassName || "";
      document.getElementById("commentClassName").value =
        data.commentClassName || "";
      document.getElementById("endCommentClassName").value =
        data.endCommentClassName || "";
      document.getElementById("timer").value = data.timer || "";
    }
  );
});

document.getElementById("crawlButton").addEventListener("click", () => {
  const urlClassName = document.getElementById("urlClassName").value.trim();
  const commentClassName = document
    .getElementById("commentClassName")
    .value.trim();
  const endCommentClassName = document
    .getElementById("endCommentClassName")
    .value.trim();
  const timerValue = parseInt(
    document.getElementById("timer").value.trim(),
    10
  );

  // Validate inputs
  if (
    !urlClassName ||
    !commentClassName ||
    !endCommentClassName ||
    isNaN(timerValue)
  ) {
    document.getElementById("status").innerText =
      "Please fill in all fields correctly.";
    return;
  }

  // Send start message to background script
  chrome.runtime.sendMessage(
    {
      action: "startExtraction",
      urlClassName,
      commentClassName,
      endCommentClassName,
      timer: timerValue,
    },
    (response) => {
      document.getElementById("status").innerText = response.status;
    }
  );
});

document.getElementById("stopButton").addEventListener("click", () => {
  // Send stop message to the background script
  chrome.runtime.sendMessage({ action: "stopExtraction" }, (response) => {
    document.getElementById("status").innerText = response.status;
  });
});
