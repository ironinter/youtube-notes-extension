// Get video ID from the active tab
async function getVideoIdFromTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tabs[0] || !tabs[0].url) {
    return null;
  }

  // The error debugging (try section) was done by Claude Haiku
  try {
    const url = new URL(tabs[0].url);
    return url.searchParams.get('v');
  } catch (error) {
    console.error('Invalid URL:', tabs[0].url, error);
    return null;
  }
}

// Format time for display
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Load and display bookmarks
async function loadBookmarks() {
  const videoId = await getVideoIdFromTab();

  if (!videoId) {
    document.getElementById('bookmarks').innerHTML = '<p>Not a YouTube video page</p>';
    return;
  }

  chrome.storage.local.get([videoId], function(result) {
    const videoData = result[videoId];
    const bookmarksContainer = document.getElementById('bookmarks');

    if (!videoData || videoData.timestamps.length === 0) {
      bookmarksContainer.innerHTML = '<p style="text-align: center; color: #999;">No bookmarks yet</p>';
      return;
    }

    // Create list of bookmarks
    let html = '<ul style="list-style: none; padding: 0; margin: 0;">';

    videoData.timestamps.forEach((bookmark, index) => {
      html += `
        <li class="bookmark-item" data-index="${index}">
          <div class="bookmark-header">
            <span class="timestamp">${bookmark.time}</span>
            <button class="delete-btn" data-index="${index}">Delete</button>
          </div>
          <textarea class="footnote-input" data-index="${index}" placeholder="Add note...">${bookmark.footnote || ''}</textarea>
        </li>
      `;
    });

    html += '</ul>';
    bookmarksContainer.innerHTML = html;

    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        deleteBookmark(videoId, parseInt(this.getAttribute('data-index')));
      });
    });

    // Add event listeners for footnote inputs (auto-save)
    document.querySelectorAll('.footnote-input').forEach(textarea => {
      textarea.addEventListener('blur', function() {
        updateFootnote(videoId, parseInt(this.getAttribute('data-index')), this.value);
      });
    });
  });
}

// Delete a bookmark
function deleteBookmark(videoId, index) {
  chrome.storage.local.get([videoId], function(result) {
    const videoData = result[videoId];
    if (videoData) {
      videoData.timestamps.splice(index, 1);
      chrome.storage.local.set({ [videoId]: videoData }, function() {
        loadBookmarks();
      });
    }
  });
}

// Update footnote for a bookmark
function updateFootnote(videoId, index, footnote) {
  chrome.storage.local.get([videoId], function(result) {
    const videoData = result[videoId];
    if (videoData && videoData.timestamps[index]) {
      videoData.timestamps[index].footnote = footnote;
      chrome.storage.local.set({ [videoId]: videoData }, function() {
        console.log('Footnote updated');
      });
    }
  });
}

// Load bookmarks when popup opens
document.addEventListener('DOMContentLoaded', loadBookmarks);