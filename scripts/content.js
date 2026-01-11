// Extract video ID from current URL
function getVideoId() {
  const url = new URL(window.location.href);
  return url.searchParams.get('v');
}

// Convert video time (in seconds) to MM:SS format
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Get current playback time from the video player
function getCurrentTime() {
  const video = document.querySelector('video');
  return video ? Math.floor(video.currentTime) : 0;
}

// Insert button into YouTube player
function insertButtonIntoPlayer() {
  // Find the YouTube player controls
  const playerControls = document.querySelector('.ytp-right-controls');

  if (playerControls) {
    // Check if button already exists
    if (document.getElementById('extension-button')) return;

    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'ytp-button';
    buttonContainer.id = 'extension-button';
    buttonContainer.style.cursor = 'pointer';

    // Create image element
    const img = document.createElement('img');
    img.src = chrome.runtime.getURL('assets/bookmark.png');
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.display = 'block';

    // Add click handler
    buttonContainer.addEventListener('click', function() {
      const videoId = getVideoId();
      const currentTime = getCurrentTime();
      const timestamp = formatTime(currentTime);

      if (!videoId) {
        console.error('Could not extract video ID');
        return;
      }

      // Get existing bookmarks for this video or create new object
      chrome.storage.local.get([videoId], function(result) {
        const videoData = result[videoId] || { timestamps: [] };

        // Add new timestamp entry
        videoData.timestamps.push({
          time: timestamp,
          seconds: currentTime,
          footnote: ''
        });

        // Save back to storage
        chrome.storage.local.set({ [videoId]: videoData }, function() {
          console.log('Bookmark added:', timestamp);
          // Optional: Show visual feedback
          buttonContainer.style.opacity = '0.5';
          setTimeout(() => {
            buttonContainer.style.opacity = '1';
          }, 200);
        });
      });
    });

    // Append image to button
    buttonContainer.appendChild(img);

    // Insert button before the settings button (or at the end)
    playerControls.insertBefore(buttonContainer, playerControls.firstChild);
  }
}

// Run when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', insertButtonIntoPlayer);
} else {
  insertButtonIntoPlayer();
}

// Re-run on dynamic content changes (YouTube's SPA navigation)
const observer = new MutationObserver(insertButtonIntoPlayer);
observer.observe(document.body, { childList: true, subtree: true });
