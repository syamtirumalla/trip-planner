/**
 * Pure helper for WAI-ARIA compliant tab keyboard navigation.
 * Calculates next tab index on ArrowRight, ArrowLeft, Home, and End with wrap-around.
 *
 * @param {number} currentIndex
 * @param {number} totalCount
 * @param {string} key
 * @returns {number | null}
 */
export function getNextTabIndex(currentIndex, totalCount, key) {
  if (typeof currentIndex !== 'number' || totalCount <= 0) return null;

  switch (key) {
    case 'ArrowRight':
      return (currentIndex + 1) % totalCount;
    case 'ArrowLeft':
      return (currentIndex - 1 + totalCount) % totalCount;
    case 'Home':
      return 0;
    case 'End':
      return totalCount - 1;
    default:
      return null;
  }
}

