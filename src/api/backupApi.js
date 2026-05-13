import { api } from './client';

export const backupApi = {
  export: () => api.get('/backup/export'),
  import: (data) => api.post('/backup/import', { data }),
};
