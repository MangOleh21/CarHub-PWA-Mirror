import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { normalizePageInput } from '../lib/pagination.js'

const PAGE_SIZE_OPTIONS = [5, 6, 9, 10, 12, 18, 20, 30, 50]

export default function PaginationControls({
  currentPage,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  label,
}) {
  const [pageInput, setPageInput] = useState({
    page: currentPage,
    value: String(currentPage),
  })
  const pageInputValue = pageInput.page === currentPage
    ? pageInput.value
    : String(currentPage)

  function commitPageInput() {
    const nextPage = normalizePageInput(pageInputValue, currentPage, totalPages)
    setPageInput({ page: nextPage, value: String(nextPage) })
    if (nextPage !== currentPage) onPageChange(nextPage)
  }

  const hasPageControls = totalPages > 1

  return (
    <nav
      className={`pagination pagination-controls${hasPageControls ? ' has-page-controls' : ''}`}
      aria-label={label}
    >
      {hasPageControls && (
        <>
          <button
            className="button button-outline"
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeft size={15} aria-hidden="true" /> Sebelumnya
          </button>
          <label className="pagination-page">
            <span>Halaman</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              step="1"
              aria-label="Pilih halaman"
              value={pageInputValue}
              onChange={(event) => setPageInput({
                page: currentPage,
                value: event.target.value,
              })}
              onBlur={commitPageInput}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  event.currentTarget.blur()
                }
              }}
            />
            <span>dari {totalPages}</span>
          </label>
        </>
      )}
      <label className="pagination-size">
        <span>Item per halaman</span>
        <select
          aria-label="Jumlah item per halaman"
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </label>
      {hasPageControls && (
        <button
          className="button button-outline"
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Berikutnya <ChevronRight size={15} aria-hidden="true" />
        </button>
      )}
    </nav>
  )
}
