// Global variables
let allPublications = [];
let showingSelected = true;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
  loadPublications();

  const sections = document.querySelectorAll('section');
  sections.forEach((section, index) => {
    section.style.animationDelay = `${index * 0.1}s`;
  });

  const toggleButton = document.getElementById('toggle-publications');
  if (toggleButton) {
    toggleButton.addEventListener('click', togglePublications);
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeModal();
    }
  });
});

// Load publications from the static JSON file
function loadPublications() {
  fetch('publications.json?v=20260621')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (!Array.isArray(data.publications)) {
        throw new Error('publications.json must contain a publications array.');
      }
      allPublications = data.publications;
      renderPublications(true);
    })
    .catch(error => {
      console.error('Error loading publications:', error);
      displayFallbackPublications();
    });
}

function displayFallbackPublications() {
  const container = document.getElementById('publications-container');
  if (container) {
    container.textContent = 'Error loading publications.';
  }
}

// Toggle between selected and all publications
function togglePublications() {
  showingSelected = !showingSelected;
  renderPublications(showingSelected);

  const toggleButton = document.getElementById('toggle-publications');
  const toggleHeader = document.getElementById('toggle-header');

  if (toggleButton) {
    toggleButton.textContent = showingSelected ? 'Show All' : 'Show Selected';
  }
  if (toggleHeader) {
    toggleHeader.textContent = showingSelected ? 'Selected Publications' : 'All Publications';
  }
}

// Render publications based on selection state
function renderPublications(selectedOnly) {
  const publicationsContainer = document.getElementById('publications-container');
  if (!publicationsContainer) {
    return;
  }

  publicationsContainer.innerHTML = '';

  const publicationsToShow = selectedOnly
    ? allPublications.filter(publication => publication.selected === 1)
    : allPublications;

  publicationsToShow
    .slice()
    .sort(comparePublicationsByTime)
    .forEach(publication => {
      publicationsContainer.appendChild(createPublicationElement(publication));
    });
}

function comparePublicationsByTime(a, b) {
  const yearDifference = getPublicationYear(b) - getPublicationYear(a);
  if (yearDifference !== 0) {
    return yearDifference;
  }
  return allPublications.indexOf(a) - allPublications.indexOf(b);
}

function getPublicationYear(publication) {
  const years = String(publication.venue || '').match(/\b(?:19|20)\d{2}\b/g);
  if (!years) {
    return 0;
  }
  return Math.max(...years.map(Number));
}

// Create one publication row
function createPublicationElement(publication) {
  const publicationItem = document.createElement('div');
  publicationItem.className = 'publication-item';

  const hasThumbnail = typeof publication.thumbnail === 'string' && publication.thumbnail.trim().length > 0;

  if (hasThumbnail) {
    const thumbnail = document.createElement('div');
    thumbnail.className = 'pub-thumbnail';
    thumbnail.setAttribute('role', 'button');
    thumbnail.setAttribute('tabindex', '0');
    thumbnail.setAttribute('aria-label', `Open image preview for ${publication.title}`);

    const openThumbnail = () => openModal(publication.thumbnail);
    thumbnail.addEventListener('click', openThumbnail);
    thumbnail.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openThumbnail();
      }
    });

    const thumbnailImage = document.createElement('img');
    thumbnailImage.src = publication.thumbnail;
    thumbnailImage.alt = `${publication.title} thumbnail`;
    thumbnail.appendChild(thumbnailImage);
    publicationItem.appendChild(thumbnail);
  } else {
    publicationItem.classList.add('no-thumb');
  }

  const content = document.createElement('div');
  content.className = 'pub-content';

  const title = document.createElement('div');
  title.className = 'pub-title';
  title.textContent = publication.title;
  content.appendChild(title);

  const authors = document.createElement('div');
  authors.className = 'pub-authors';

  publication.authors.forEach((author, index) => {
    if (isYujiCaoAuthor(author)) {
      const highlightedAuthor = document.createElement('span');
      highlightedAuthor.className = 'highlight-name';
      highlightedAuthor.textContent = author;
      authors.appendChild(highlightedAuthor);
    } else {
      authors.appendChild(document.createTextNode(author));
    }

    if (index < publication.authors.length - 1) {
      authors.appendChild(document.createTextNode(', '));
    }
  });

  if (publication.corresponding_author_note) {
    const correspondingNote = document.createElement('span');
    correspondingNote.className = 'corresponding-note';
    correspondingNote.textContent = ` ${publication.corresponding_author_note}`;
    authors.appendChild(correspondingNote);
  }

  content.appendChild(authors);

  const venueContainer = document.createElement('div');
  venueContainer.className = 'pub-venue-container';

  const venue = document.createElement('div');
  venue.className = 'pub-venue';
  venue.textContent = publication.venue;
  venueContainer.appendChild(venue);

  if (publication.award) {
    const award = document.createElement('div');
    award.className = 'pub-award';
    award.textContent = publication.award;
    venueContainer.appendChild(award);
  }

  content.appendChild(venueContainer);

  if (publication.links) {
    const links = document.createElement('div');
    links.className = 'pub-links';

    appendPublicationLink(links, publication.links.link || publication.links.pdf, '[Link]');
    appendPublicationLink(links, publication.links.code, '[Code]');
    appendPublicationLink(links, publication.links.project, '[Project Page]');

    if (links.childElementCount > 0) {
      content.appendChild(links);
    }
  }

  publicationItem.appendChild(content);
  return publicationItem;
}

function isYujiCaoAuthor(author) {
  const normalizedAuthor = author.replace('*', '').trim();
  return normalizedAuthor === 'Yuji Cao' || normalizedAuthor === 'Y. Cao';
}

function appendPublicationLink(container, href, label) {
  if (!href) {
    return;
  }

  const link = document.createElement('a');
  link.href = href;
  link.textContent = label;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  container.appendChild(link);
}

// Modal functionality for viewing publication images
function openModal(imageSource) {
  if (!imageSource) {
    return;
  }

  const modal = document.getElementById('imageModal');
  const modalImage = document.getElementById('modalImage');
  if (!modal || !modalImage) {
    return;
  }

  modalImage.src = imageSource;
  modal.style.display = 'block';
  requestAnimationFrame(() => modal.classList.add('show'));
}

function closeModal() {
  const modal = document.getElementById('imageModal');
  const modalImage = document.getElementById('modalImage');
  if (!modal || modal.style.display !== 'block') {
    return;
  }

  modal.classList.remove('show');
  setTimeout(() => {
    modal.style.display = 'none';
    if (modalImage) {
      modalImage.removeAttribute('src');
    }
  }, 300);
}

// Close the modal when clicking its backdrop
window.addEventListener('click', event => {
  const modal = document.getElementById('imageModal');
  if (event.target === modal) {
    closeModal();
  }
});
