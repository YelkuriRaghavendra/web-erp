export interface Company {
  id: string; //unique_id or RUT
  nombre: string; //company_name
  tipo: string; //type
  padre: string; //parent_company_id
  pais: string; //country
  ubicacion: string; //address
  is_active?: number; //is_active
  contacto: {
    nombre: string;
    telefono: string;
    email: string;
  };
  administradores: string;
}

export const mockCompanies: Company[] = [
  {
    id: '1',
    nombre: 'Grupo Minero Los Andes S.A',
    tipo: 'Holding',
    padre: 'N/A',
    pais: 'Chile',
    ubicacion: 'Av. Apoquindo 4500, Las Condes',
    contacto: {
      nombre: 'Andrea López',
      telefono: '+54 11 5432 1098',
      email: 'a.lopez@gmla.com',
    },
    administradores: 'Pablo Gómez Martínez',
  },
  {
    id: '2',
    nombre: 'Minera Norte Grande Ltda.',
    tipo: 'Subsidiaria',
    padre: 'Grupo Minero Los Andes S.A.',
    pais: 'Chile',
    ubicacion: 'Av. Apoquindo 3200, Las Condes',
    contacto: {
      nombre: 'Rodrigo Valenzuela',
      telefono: '+56 9 8765 4321',
      email: 'r.valenzuela@mng.cl',
    },
    administradores: 'María José Rojas Arellano',
  },
  {
    id: '3',
    nombre: 'División Mina El Bronce',
    tipo: 'División',
    padre: 'Antofagasta Minerals S.A.',
    pais: 'Chile',
    ubicacion: 'Faena Minera El Bronce S/N, Lo Barnechea',
    contacto: {
      nombre: 'Carlos Vera Amunátegui',
      telefono: '+56 2 2798 1234',
      email: 'c.vera@mng.cl',
    },
    administradores: 'Raimundo Fuentes Valdés',
  },
  {
    id: '4',
    nombre: 'Antofagasta Minerals S.A.',
    tipo: 'Holding',
    padre: 'N/A',
    pais: 'Chile',
    ubicacion: 'Av. El Golf 2340, Las Condes,RM',
    contacto: {
      nombre: 'Francisco Pizarro Roa',
      telefono: '+56 2 2490 1022',
      email: 'f.pizarro@aminerals.cl',
    },
    administradores: 'Sofía Tapia Hurtado',
  },
  {
    id: '5',
    nombre: 'División El Teniente',
    tipo: 'División',
    padre: 'Codelco',
    pais: 'Chile',
    ubicacion: "Av. Bernardo O'Higgins 1302, Rancagua",
    contacto: {
      nombre: 'Laura Paredes Guzmán',
      telefono: '+56 9 5555 1234',
      email: 'laura.paredes@codelco.cl',
    },
    administradores: 'Marco Córdoba Fernández',
  },
  {
    id: '6',
    nombre: 'Compañía Minera Centinela',
    tipo: 'Subsidiaria',
    padre: 'Antofagasta Minerals S.A',
    pais: 'Chile',
    ubicacion: 'Av. Pedro Aguirre Cerda 6052, Antofagasta',
    contacto: {
      nombre: 'Daniel Torres Figueroa',
      telefono: '+56 55 2456 7890',
      email: 'd.torres.figueroa@aminerals.cl',
    },
    administradores: 'Leonardo Jiménez Albornoz',
  },
  {
    id: '7',
    nombre: 'Ingeniería y Servicios Andina S.A.',
    tipo: 'Servicios',
    padre: 'N/A',
    pais: 'Chile',
    ubicacion: 'Calle Prat 1120, Valparaíso',
    contacto: {
      nombre: 'Sergio Muñoz',
      telefono: '+56 32 2233 4455',
      email: 's.muñoz@iasa.cl',
    },
    administradores: 'Patricia Salas Ríos',
  },
  {
    id: '8',
    nombre: 'Comercializadora Atacama SpA',
    tipo: 'Subsidiaria',
    padre: 'Compañía Minera Centinela',
    pais: 'Chile',
    ubicacion: 'Av. Copayapu 45, Copiapó',
    contacto: {
      nombre: 'Patricia Orellana',
      telefono: '+56 9 6123 3344',
      email: 'p.orellana@catacama.cl',
    },
    administradores: 'Gonzalo Fuentes Pizarro',
  },
  {
    id: '9',
    nombre: 'Operaciones Puerto Norte Ltda.',
    tipo: 'Sucursal',
    padre: 'Grupo Minero Los Andes S.A.',
    pais: 'Chile',
    ubicacion: 'Puerto Angamos 7, Iquique',
    contacto: {
      nombre: 'Diego Ramírez',
      telefono: '+56 57 3344 5566',
      email: 'd.ramirez@puertonorte.cl',
    },
    administradores: 'Verónica Castillo Muñoz',
  },
  {
    id: '10',
    nombre: 'Exploraciones Austral S.A.',
    tipo: 'Empresa de Exploración',
    padre: 'N/A',
    pais: 'Chile',
    ubicacion: 'Av. Magallanes 210, Punta Arenas',
    contacto: {
      nombre: 'Marta Villanueva',
      telefono: '+56 61 2233 7788',
      email: 'm.villanueva@exploraustral.cl',
    },
    administradores: 'Óscar Méndez López',
  },
  {
    id: '11',
    nombre: 'Fundición Sur S.A.',
    tipo: 'Planta',
    padre: 'Antofagasta Minerals S.A.',
    pais: 'Chile',
    ubicacion: 'Ruta 25 km 12, Calama',
    contacto: {
      nombre: 'Hernán Aguilar',
      telefono: '+56 55 9988 1122',
      email: 'h.aguilar@fundicionsur.cl',
    },
    administradores: 'Cecilia Moreno Riquelme',
  },
  {
    id: '12',
    nombre: 'Transporte Minero Talca Ltda.',
    tipo: 'Logística',
    padre: 'División El Teniente',
    pais: 'Chile',
    ubicacion: 'Camino a San Clemente 77, Talca',
    contacto: {
      nombre: 'Camila Soto',
      telefono: '+56 71 3344 2211',
      email: 'c.soto@tmtalca.cl',
    },
    administradores: 'Raúl Pinto Araya',
  },
  {
    id: '13',
    nombre: 'Servicios Ambientales Andes',
    tipo: 'Servicios',
    padre: 'N/A',
    pais: 'Chile',
    ubicacion: 'Av. Libertador Bernardo O´Higgins 800, Santiago',
    contacto: {
      nombre: 'Ignacio Herrera',
      telefono: '+56 2 2677 4455',
      email: 'i.herrera@saandes.cl',
    },
    administradores: 'María Fernanda Olivares',
  },
  {
    id: '14',
    nombre: 'Compañía de Inversiones Patagonia',
    tipo: 'Holding',
    padre: 'N/A',
    pais: 'Chile',
    ubicacion: 'Calle Principal 1, Puerto Varas',
    contacto: {
      nombre: 'Lorena Sáez',
      telefono: '+56 65 2121 0099',
      email: 'l.saez@cipatagonia.cl',
    },
    administradores: 'Rafael Duarte Silva',
  },
  {
    id: '15',
    nombre: 'Joint Venture Cerro Azul',
    tipo: 'Joint Venture',
    padre: 'Minera Norte Grande Ltda.',
    pais: 'Chile',
    ubicacion: 'Camino Real 99, Coquimbo',
    contacto: {
      nombre: 'Felipe Araya',
      telefono: '+56 51 7788 9900',
      email: 'f.araya@cerroazuljv.cl',
    },
    administradores: 'Nuria Campos León',
  },
  {
    id: '16',
    nombre: 'Solutions Tech Mining SpA',
    tipo: 'Tecnología',
    padre: 'N/A',
    pais: 'Chile',
    ubicacion: 'Av. Nueva Tajamar 555, Santiago',
    contacto: {
      nombre: 'Ana Beltrán',
      telefono: '+56 2 2345 6677',
      email: 'ana.beltran@stmining.cl',
    },
    administradores: 'Mauricio Reyes Cortés',
  },
];

export const getCompanies = (): Company[] => {
  return mockCompanies;
};

export const getCompanyById = (id: string): Company | undefined => {
  return mockCompanies.find(company => company.id === id);
};
