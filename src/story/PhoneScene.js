export const PHONE_LINES = [
  {
    id: 'line-1',
    from: 'Bilinmeyen',
    delay: 2,
    text: 'Sadece ilerle, ışıklar seni kandırmasın.',
  },
  {
    id: 'line-2',
    from: 'Bilinmeyen',
    delay: 3,
    text: 'Bir şeyler dinliyorsan geri dönmeyeceksen, takip et.',
  },
  {
    id: 'line-3',
    from: 'Sistem',
    delay: 5,
    text: 'Kalp atışın yükseliyor. Nefes alışını düzenle.',
  },
];

export function getPhoneLine(index) {
  return PHONE_LINES[index] ?? null;
}
