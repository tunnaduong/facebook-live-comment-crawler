function websocketHandler(evt) {
  const decoder = new TextDecoder("utf-8");
  const rootJson = decoder.decode(evt.data);

  // The message seems to contain a "topic" name at the start and end of the data.
  // I think it is MQTT stuff and I do not know how to work with it
  // especially in the browser AND without loading external scripts.
  const startOfJson = rootJson.indexOf("{");
  const endOfJson = rootJson.lastIndexOf("}");
  const normalizedJson = rootJson.slice(startOfJson, endOfJson + 1);

  try {
    const parsedJson = JSON.parse(normalizedJson);
    const comment = (
      ((parsedJson || {}).data || {}).live_video_comment_create_subscribe || {}
    ).comment;

    // The message received does not contain a comment.
    // Could be for other stuff that we don't need.
    if (!comment) {
      return;
    }

    console.log("Has a comment.", comment);

    const dataToSend = {
      name: comment.author.name,
      comment: comment.body.text,
    };

    // Send data to the API
    fetch("http://localhost:3103/php-test-live-chat/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: dataToSend }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Success:", data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  } catch (e) {
    // not the data we want and just dont crash at all whatever happens.
  }
}

// Copy the original WebSocket function
// because we are going to override it.
const NativeWebSocket = window.WebSocket;

// Override original WebSocket so we can
// have a reference to the instance FB will use.
// Can't find a way to make a connection to them manually.
window.WebSocket = function (...args) {
  const instance = new NativeWebSocket(...args);

  // Listen for new comments and do stuff.
  instance.addEventListener("message", websocketHandler);

  return instance;
};
