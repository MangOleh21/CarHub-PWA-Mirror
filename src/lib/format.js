export function formatPrice(value) {
  try {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(BigInt(value))
  } catch {
    throw new TypeError('Price must be a whole-number amount.')
  }
}

export function formatMileage(value) {
  return `${new Intl.NumberFormat('id-ID').format(value)} km`
}

export function whatsappUrl(phone, message) {
  if (typeof phone !== 'string' || !/^\+?\d[\d\s()-]{7,19}$/.test(phone)) {
    throw new TypeError('Phone number is invalid.')
  }

  const digits = phone.replace(/\D/g, '')
  const internationalPhone = phone.startsWith('+') || digits.startsWith('62')
    ? digits
    : digits.startsWith('0')
      ? `62${digits.slice(1)}`
      : `62${digits}`

  return `https://wa.me/${internationalPhone}?text=${encodeURIComponent(message)}`
}
