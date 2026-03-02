import argentina from '@/assets/flags/argentina.svg';
import chile from '@/assets/flags/chile_modificada.png';
import peru from '@/assets/flags/peru.svg';
import china from '@/assets/flags/chile_modificada.png';
import colombia from '@/assets/flags/colombia.svg';
import mexico from '@/assets/flags/mexico.svg';

interface Country {
  src: string;
  alt: string;
}

const flags: Country[] = [
  { src: argentina, alt: 'Argentina' },
  { src: chile, alt: 'Chile' },
  { src: peru, alt: 'Peru' },
  { src: china, alt: 'Brazil' },
  { src: colombia, alt: 'Colombia' },
  { src: mexico, alt: 'Mexico' },
];

export const CountryFlags: React.FC = () => {
  return (
    <div className='flex items-center gap-3'>
      {flags.map(flag => (
        <img
          key={flag.alt}
          src={flag.src}
          alt={flag.alt}
          title={flag.alt}
          className='w-10 h-10 rounded-full shadow-sm cursor-pointer hover:scale-110 transition-transform duration-200'
        />
      ))}
    </div>
  );
};
