const offlineCars = [
  {
    id: 'offline-honda-brio',
    brand: 'Honda',
    model: 'Brio RS',
    year: 2021,
    transmission: 'CVT',
    fuelType: 'Bensin',
    mileage: 22_000,
    price: '185000000',
    imageUrl: '/offline-cars/honda_brio_rs.jpg',
    images: ['/offline-cars/honda_brio_rs.jpg'],
    sellerName: 'CarHub — data contoh',
    sellerPhone: '',
    location: 'Jakarta',
    description: 'Listing contoh untuk melihat tampilan katalog saat offline.',
    createdAt: '2026-03-10T00:00:00.000Z',
    isOfflineSample: true,
  },
  {
    id: 'offline-toyota-innova',
    brand: 'Toyota',
    model: 'Innova Reborn',
    year: 2020,
    transmission: 'Automatic',
    fuelType: 'Diesel',
    mileage: 58_000,
    price: '325000000',
    imageUrl: '/offline-cars/innova_reborn.jpg',
    images: ['/offline-cars/innova_reborn.jpg'],
    sellerName: 'CarHub — data contoh',
    sellerPhone: '',
    location: 'Bandung',
    description: 'Listing contoh untuk melihat tampilan katalog saat offline.',
    createdAt: '2026-03-08T00:00:00.000Z',
    isOfflineSample: true,
  },
  {
    id: 'offline-mitsubishi-pajero',
    brand: 'Mitsubishi',
    model: 'Pajero Sport',
    year: 2019,
    transmission: 'Automatic',
    fuelType: 'Diesel',
    mileage: 72_000,
    price: '410000000',
    imageUrl: '/offline-cars/mitsubishi_pajerosport.jpeg',
    images: ['/offline-cars/mitsubishi_pajerosport.jpeg'],
    sellerName: 'CarHub — data contoh',
    sellerPhone: '',
    location: 'Surabaya',
    description: 'Listing contoh untuk melihat tampilan katalog saat offline.',
    createdAt: '2026-03-05T00:00:00.000Z',
    isOfflineSample: true,
  },
  {
    id: 'offline-mitsubishi-destinator',
    brand: 'Mitsubishi',
    model: 'Destinator',
    year: 2025,
    transmission: 'CVT',
    fuelType: 'Bensin',
    mileage: 1_500,
    price: '425000000',
    imageUrl: '/offline-cars/mitsubishi-destinator-99110.webp',
    images: ['/offline-cars/mitsubishi-destinator-99110.webp'],
    sellerName: 'CarHub — data contoh',
    sellerPhone: '',
    location: 'Yogyakarta',
    description: 'Listing contoh untuk melihat tampilan katalog saat offline.',
    createdAt: '2026-03-01T00:00:00.000Z',
    isOfflineSample: true,
  },
]

function hasValue(value) {
  return value !== undefined && value !== null && value !== ''
}

export function getOfflineCars({
  search,
  brand,
  transmission,
  minPrice,
  maxPrice,
  minYear,
  maxYear,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  page = 1,
  pageSize = 20,
} = {}) {
  const searchTerm = search?.trim().toLocaleLowerCase('id-ID')
  const brandTerm = brand?.trim().toLocaleLowerCase('id-ID')
  let matches = offlineCars.filter((car) => (
    (!searchTerm || `${car.brand} ${car.model}`.toLocaleLowerCase('id-ID').includes(searchTerm))
    && (!brandTerm || car.brand.toLocaleLowerCase('id-ID') === brandTerm)
    && (!transmission || car.transmission === transmission)
    && (!hasValue(minPrice) || BigInt(car.price) >= BigInt(minPrice))
    && (!hasValue(maxPrice) || BigInt(car.price) <= BigInt(maxPrice))
    && (!hasValue(minYear) || car.year >= Number(minYear))
    && (!hasValue(maxYear) || car.year <= Number(maxYear))
  ))

  const direction = sortOrder === 'asc' ? 1 : -1
  matches = [...matches].sort((first, second) => {
    const firstValue = sortBy === 'price'
      ? BigInt(first.price)
      : sortBy === 'year' ? first.year : Date.parse(first.createdAt)
    const secondValue = sortBy === 'price'
      ? BigInt(second.price)
      : sortBy === 'year' ? second.year : Date.parse(second.createdAt)
    return firstValue < secondValue ? -direction : firstValue > secondValue ? direction : 0
  })

  const totalItems = matches.length
  const start = (page - 1) * pageSize
  return {
    data: matches.slice(start, start + pageSize),
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    },
  }
}

export function getOfflineCar(id) {
  return offlineCars.find((car) => car.id === id) ?? null
}

export function getOfflineCarBrands() {
  return [...new Set(offlineCars.map((car) => car.brand))]
    .sort((first, second) => first.localeCompare(second, 'id-ID'))
}

export function canUseOfflineFallback(error) {
  return error?.status === 0 || (error?.status >= 500 && error?.status < 600)
}
