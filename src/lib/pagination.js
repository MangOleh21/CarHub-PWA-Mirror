export function getPageItems(items, page, pageSize) {
  const totalPages = Math.ceil(items.length / pageSize)
  const activePage = totalPages
    ? Math.max(1, Math.min(page, totalPages))
    : 1
  const start = (activePage - 1) * pageSize

  return {
    items: items.slice(start, start + pageSize),
    page: activePage,
    totalPages,
  }
}

export function normalizePageInput(value, currentPage, totalPages) {
  const requestedPage = Number(value)
  if (!Number.isInteger(requestedPage) || requestedPage < 1 || totalPages < 1) {
    return currentPage
  }
  return Math.min(requestedPage, totalPages)
}
