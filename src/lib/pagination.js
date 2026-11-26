export function normalizePageInput(value, currentPage, totalPages) {
  const requestedPage = Number(value)
  if (!Number.isInteger(requestedPage) || requestedPage < 1 || totalPages < 1) {
    return currentPage
  }
  return Math.min(requestedPage, totalPages)
}
