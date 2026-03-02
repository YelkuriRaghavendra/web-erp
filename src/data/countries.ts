export interface Country {
  value: string;
  label: string;
}

export const countries: Country[] = [
  { value: 'Argentina', label: 'Argentina' },
  { value: 'Belize', label: 'Belize' },
  { value: 'Bolivia', label: 'Bolivia' },
  { value: 'Brazil', label: 'Brazil' },
  { value: 'Chile', label: 'Chile' },
  { value: 'Colombia', label: 'Colombia' },
  { value: 'Costa Rica', label: 'Costa Rica' },
  { value: 'Cuba', label: 'Cuba' },
  { value: 'Dominican Republic', label: 'Dominican Republic' },
  { value: 'Ecuador', label: 'Ecuador' },
  { value: 'El Salvador', label: 'El Salvador' },
  { value: 'French Guiana', label: 'French Guiana' },
  { value: 'Guatemala', label: 'Guatemala' },
  { value: 'Guyana', label: 'Guyana' },
  { value: 'Haiti', label: 'Haiti' },
  { value: 'Honduras', label: 'Honduras' },
  { value: 'Mexico', label: 'Mexico' },
  { value: 'Nicaragua', label: 'Nicaragua' },
  { value: 'Panama', label: 'Panama' },
  { value: 'Paraguay', label: 'Paraguay' },
  { value: 'Peru', label: 'Peru' },
  { value: 'Puerto Rico', label: 'Puerto Rico' },
  { value: 'Saint Martin', label: 'Saint Martin' },
  { value: 'Suriname', label: 'Suriname' },
  { value: 'Uruguay', label: 'Uruguay' },
  { value: 'Venezuela', label: 'Venezuela' },
  // Additional global countries can be added here
  { value: 'United States', label: 'United States' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Spain', label: 'Spain' },
  { value: 'France', label: 'France' },
  { value: 'Germany', label: 'Germany' },
  { value: 'Italy', label: 'Italy' },
  { value: 'Portugal', label: 'Portugal' },
  { value: 'United Kingdom', label: 'United Kingdom' },
];

export const countryOptions = countries;
