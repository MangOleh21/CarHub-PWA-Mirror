export function buildCarShareDetails(car, origin) {
  const name = `${car.brand} ${car.model}`
  return {
    title: `${name} ${car.year} | CarHub`,
    text: `Lihat ${name} tahun ${car.year} di CarHub.`,
    url: new URL(`/cars/${encodeURIComponent(car.id)}`, origin).href,
  }
}

export async function shareLink({ title, text, url, share, writeClipboard }) {
  if (typeof share === 'function') {
    try {
      await share({ title, text, url })
      return 'shared'
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled'
      if (typeof writeClipboard !== 'function') throw error
    }
  }

  if (typeof writeClipboard !== 'function') {
    throw new Error('Browser tidak mendukung berbagi atau menyalin tautan.')
  }

  await writeClipboard(url)
  return 'copied'
}
