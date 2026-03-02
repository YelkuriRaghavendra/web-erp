export interface License {
  id: string;
  licencia: string;
  compania: string;
  rol: string;
  contrato: string;
  inicio: string;
  finaliza: string;
  estado: 'Active' | 'Inactive';
}

// Mock license data - keyed by userId
export const mockLicensesByUser: Record<string, License[]> = {
  'usr-001': [
    {
      id: 'lic-001-001',
      licencia: 'Saffer App',
      compania: 'Tech Solutions',
      rol: 'Manager',
      contrato: 'Saffer-TechSolutions',
      inicio: '02/01/2026',
      finaliza: '10/01/2026',
      estado: 'Active',
    },
    {
      id: 'lic-001-002',
      licencia: 'Checkingmate',
      compania: 'Tech Solutions',
      rol: 'Supervisor',
      contrato: 'Check-TechSolutions',
      inicio: '01/08/2025',
      finaliza: '01/09/2025',
      estado: 'Inactive',
    },
  ],
  'usr-002': [
    {
      id: 'lic-002-001',
      licencia: 'FIT 2000',
      compania: 'Tech Solutions',
      rol: 'Manager',
      contrato: 'FIT2000-TechSolutions',
      inicio: '01/01/2026',
      finaliza: '10/01/2026',
      estado: 'Active',
    },
    {
      id: 'lic-002-002',
      licencia: 'Checkingmate',
      compania: 'Summit Group',
      rol: 'Manager',
      contrato: 'Check-TechSolutions',
      inicio: '15/12/2025',
      finaliza: '01/01/2026',
      estado: 'Active',
    },
    {
      id: 'lic-002-003',
      licencia: 'FIT 2000',
      compania: 'Summit Group',
      rol: 'Worker',
      contrato: 'FIT2000-TechSolutions',
      inicio: '22/12/2026',
      finaliza: '02/01/2026',
      estado: 'Active',
    },
  ],
  'usr-003': [
    {
      id: 'lic-003-001',
      licencia: 'Saffer App',
      compania: 'BHP Chile',
      rol: 'Supervisor',
      contrato: 'Saffer-BHP',
      inicio: '05/01/2026',
      finaliza: '15/01/2026',
      estado: 'Active',
    },
  ],
  'usr-004': [
    {
      id: 'lic-004-001',
      licencia: 'Checkingmate',
      compania: 'Codelco',
      rol: 'Editor',
      contrato: 'Check-Codelco',
      inicio: '01/01/2026',
      finaliza: '30/06/2026',
      estado: 'Active',
    },
  ],
  'usr-005': [
    {
      id: 'lic-005-001',
      licencia: 'FIT 2000',
      compania: 'Collahuasi',
      rol: 'Admin',
      contrato: 'FIT2000-Collahuasi',
      inicio: '10/01/2026',
      finaliza: '31/12/2026',
      estado: 'Active',
    },
    {
      id: 'lic-005-002',
      licencia: 'Saffer App',
      compania: 'Collahuasi',
      rol: 'Manager',
      contrato: 'Saffer-Collahuasi',
      inicio: '15/01/2026',
      finaliza: '20/02/2026',
      estado: 'Inactive',
    },
    {
      id: 'lic-005-003',
      licencia: 'Checkingmate',
      compania: 'Collahuasi',
      rol: 'Supervisor',
      contrato: 'Check-Collahuasi',
      inicio: '01/02/2026',
      finaliza: '28/02/2026',
      estado: 'Active',
    },
    {
      id: 'lic-005-004',
      licencia: 'FIT 2000',
      compania: 'Antofagasta',
      rol: 'Worker',
      contrato: 'FIT2000-Antofagasta',
      inicio: '20/01/2026',
      finaliza: '15/03/2026',
      estado: 'Active',
    },
  ],
};
