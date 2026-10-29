const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

export const APP_NOME = 'FrentesPro';
export const APP_DESCRICAO = 'Controle de frentes de serviço';
export const LOGO_URL =
  'https://media.db.com/images/public/6ae06e534fd073512ae9f265/a947aa9c0_generated_image.png';