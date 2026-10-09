(()=>{
  'use strict';
  /* Doxa 62 · ATLAS (em teste: Êxodo)
     Modo de leitura (entra por Ferramentas › Explorar o texto). Enquanto se rola Êxodo, sobe um cartão
     de até meia tela com o mapa: onde a passagem acontece e o trajeto. Nos trechos de viagem, o ponto
     anda junto com a leitura (versos 12:37, 13:20, 14:1–31…) ou percorre o trecho sozinho ao chegar.

     Rotas:
       • Pela Arábia (destaque): Paulo — “Agar é o monte Sinai, na Arábia” (Gl 4:25); Moisés chega ao
         Horebe vindo de Midiã (Êx 3:1). Monte Sinai = Jabal al-Lawz; travessia de Nuweiba à costa de
         Midiã, no golfo de Ácaba (o “mar Vermelho” de 1Rs 9:26). Lugares sem identificação firme ficam
         marcados como aproximados.
       • Tradicional (opcional, em Rotas): Jebel Musa, no sul da península do Sinai.

     Dados: litoral, lagos e rios de Natural Earth (domínio público); identificações dos lugares de
     OpenBible.info Bible Geocoding Data (CC BY 4.0), e as da rota pela Arábia segundo seus defensores
     (Wyatt, Cornuke, Möller, Fritz). Projeção: x = (lon−28,8)·cos30°·100, y = (33,5−lat)·100.
     Numeração da Almeida (a mesma da KJV); no hebraico, o verso é convertido por DoxaVersif. */
  if(window.__doxa62AtlasInstalled)return;
  window.__doxa62AtlasInstalled=true;

  const D={"w":744.8,"h":690.0,"land":"M1 254.3l1.5 4.2l0.6 0.4l16.7 8.4l16.5 -1.1l24.6 -11.9l4.6 -3.4l4.1 -2.1l1.3 -1.7l12.8 -9.3l1.3 -2.6l2.4 0.6l2.5 -1.2l4 -3.6l-0.7 -1.1l-1.1 0.5l1.2 -1.8l0.6 0l0.6 1.1l0.6 0l5 -4.7l2.4 -1.3l1.7 -2.4l1.9 -0.8l2.1 -1.8l-0.7 -0.2l0.1 -0.6l2.3 -1.2l-0.2 2.8l2.4 1.9l6.8 1.5l-2.4 1.9l-0.1 0.5l0.7 0.3l-1 0.7l0.3 0.8l1.8 1.2l3.6 -2.1l-0.4 1.1l0.5 0.6l1.1 0.1l3 -3.2l0.6 0.8l0.6 -2.1l0.5 0l0.2 1.9l1 0.8l1.3 -3.3l-1.4 -0.7l-4 1.3l0 -0.6l1.2 0l0 -0.7l-6.5 0.7l0 -0.7l3.2 -0.8l3 -1.7l5.3 -4.8l1.9 -3l1.2 -4l0.3 -4.2l-0.7 -3.5l0.6 0l1.2 3.8l1.2 1.3l1.7 0.4l-2.4 -1.9l-1.3 -2.9l0.6 -1.8l5.5 3.5l2.6 1.1l3.2 0.4l3.7 -0.5l12.2 -3.2l25.8 -9.1l0 0.7l-9.3 3.2l-11.3 5.9l-3.7 2.5l-2.4 0.7l-3.3 2.3l-6.1 1.2l-1.3 2l0 0.7l1.8 0.5l1.8 -0.5l1.3 0.8l2.4 -0.2l2.3 -0.7l1.9 -2.6l1.7 0.5l2.8 2.9l0.6 0l0.6 -1.8l1.3 -1.7l3.7 -2.3l3.3 1.7l3.2 -0.6l1 0.6l-0.6 0.2l0 0.5l1.2 0.3l1.5 -0.5l2.6 -1.9l-0.6 -0.2l0.6 -1.2l3 1.3l0.6 0.7l1.4 -1.4l0.9 -2l-0.5 -0.9l1.7 -1.8l0.1 -1.6l0.5 -0.4l3.7 0.1l2.3 1.2l0.3 1.3l1.5 -0.1l0.9 -1.1l-1.6 -0.8l1.7 -0.5l-1.7 -2.3l-3.4 -2.5l-4.2 -1.8l-3.9 -0.1l3 -1.3l7.4 -1.1l2.7 0.3l8 2.5l13.6 6.2l3.6 2.7l9 4.1l2.8 0.7l3.6 -0.1l13 -3.8l7.8 -4.3l3.1 -1.1l3.4 0.1l2.8 1.4l1.6 3.9l2.8 3.6l1.1 2.9l1.4 1.7l2.8 2.5l4.1 1.4l2.1 2.4l6.1 4.2l-2.6 -0.6l-8.6 -5.3l1.8 0.7l-0.6 -1.2l-2.4 -0.4l-1.1 -1.2l-3.2 -2l-1 0l-0.8 -2.5l-1.5 -1.7l2.2 -0.1l-6.6 -8.6l-2.4 -0.8l-1 1.4l-1.1 -0.7l0 1.3l-1.3 -0.6l-0.5 2l1.8 0l-0.5 1.1l1.3 2.4l-0.2 1.3l0.5 0l0 0.7l-0.5 0l0.5 1.4l-0.5 0l-0.9 -2.2l-2.1 -0.6l0.3 -0.8l-1 0.6l-0.5 1.6l0.8 -0.1l0.4 -0.6l1.8 0.7l0 0.6l-0.7 0l0.4 1.4l2 0.7l-1.5 0.8l-2 -0.8l0 0.5l-0.7 0.2l1.3 1.4l-1.2 1.5l-0.3 1.2l0.8 0.6l1.9 0.1l0 0.7l-2.9 -0.7l-1.3 0.7l-1.1 -0.6l-0.6 1.7l1 1.2l-1 0.4l0.5 1.6l-2.4 1.2l-0.2 1.4l0.6 0.9l0.9 0.3l1.1 -0.5l-0.5 -0.7l2.6 0.7l0.7 0.4l0.5 2.2l2.3 1l2.1 1.8l1.8 -2.8l-0.5 1.6l0.5 1.2l-1.2 0l0 0.7l1.2 0l-0.7 0.7l0.1 0.7l1.2 -0.8l0.6 0.8l0 -0.8l0.6 0l-0.5 1.5l0.5 0.9l0.7 -0.1l0.5 -1.5l1 -0.2l3 -2.5l1.9 0.6l-1.2 0l0 0.7l1.2 0.6l1.2 -1.3l1.2 0.7l-0.6 2.7l1.2 -0.6l-0.3 1.4l-0.9 0.6l0.6 2.6l-1.8 1.5l0 0.7l1.7 -0.2l0.7 -1.2l0.6 0l0.4 1.9l1.3 0.9l0 0.7l-1.5 0.6l-0.8 1.5l1.2 0.6l0.8 -0.5l1.5 0.1l0.6 0.4l-0.6 1.4l1.9 1.3l1.2 0l1.1 -0.7l0 -0.6l-1.3 0l-0.9 -0.7l-0.8 -2l4.2 1.3l-0.7 -1.3l1.8 0l-0.5 -1.4l1.1 -0.7l0.1 0.6l1.1 0.1l-0.3 -1.1l0.6 -0.7l1 -0.1l0.9 1.7l2.5 0.4l3.3 -1.4l1 -1.8l-0.3 -1.8l-1.5 -1.5l2.3 0l0.5 -4.3l-0.5 -1.7l-1.6 -2.8l1 -0.7l-3.1 -1.4l-2.8 0.1l-0.6 -1.7l8 1.4l1.2 0.8l1.5 0.2l0.2 1.6l0.9 1.3l4 1.5l7.9 7.8l2.5 4.2l4.8 3.6l3.1 1l7.5 -0.3l6.4 -1.7l14.3 -7.4l0 0.7l-2.7 1.1l-4.9 3.6l-7.5 3l-7.4 1.9l4.2 0l0 0.6l-1.3 0.7l2.7 0l1 -0.4l0.5 -0.9l1.8 0.6l5.3 -3.4l4.5 -1.4l0.9 -0.7l2.1 0.9l-0.9 0.6l0 0.6l0.9 -0.3l2 -1l0 -0.8l-2.4 0l0 -0.6l1.2 -0.5l1.5 0.4l2.1 2.2l0.6 2l-1.2 0l2.9 1l1.3 0l1.2 -1l0 -0.7l-1.3 -0.7l0 -0.6l4.2 -1.5l-0.4 -0.7l1 -2.7l-0.6 0l-2.3 2.1l-0.6 0.6l0.6 0.7l-3.2 0.3l-3.4 -0.9l2.6 -0.3l4 -5.2l4.1 -1.4l1.7 -1.6l1 -0.4l1.5 0l0 0.6l-2.4 0l0 0.7l1.1 0.8l4 5.7l-2.7 1.7l-0.2 -0.7l-0.5 0.1l0 0.6l1.5 1l0.8 1.3l-0.1 1.5l-0.9 1.7l4.7 -1.6l2.9 0.2l0 -0.6l-1.2 -0.7l-1.1 0.7l0 -0.7l5.9 -2.8l0.6 0l-0.6 0.8l0.6 0.7l1.3 -0.7l1 1.3l0.7 0l-0.1 -2l1.2 -0.1l-3.5 -0.6l9.5 -0.7l-0.8 -1.9l2.5 -0.4l0 -1.8l1.3 0.7l1.7 -0.3l5.1 2.3l6.3 0.6l1.7 0.8l0 -0.7l2 0.6l2.8 -0.2l17.9 -4.6l16.7 -6.6l15.2 -9.8l5.1 -5l1.8 -3.1l4 -3l1.7 -3l6.5 -6.7l14.4 -23.1l7.3 -16l1.6 -2.6l2.7 -8.8l0 -2l1.2 -0.7l7 -21.4l6.2 -28.9l1 -5.8l-0.2 -1.5l2 -8.2l0.5 -8.9l0.7 -2l1.3 -0.7l2.8 1.3l2.1 0.1l3.1 -3.1l1.4 -4.8l-0.1 -1.2l-1.1 -0.5l0.5 -1.5l0.6 -6.1l1.6 -5.1l-0.4 -1.8l1.3 -1.3l-0.6 -0.7l0.6 -0.7l-0.6 -0.1l0 -0.5l2.2 -3.2l1.9 -0.7l1.8 -3l-0.6 -0.7l0.9 0l0.3 0.7l2.6 -5.5l0.3 -3l-1.8 -2.5l1.9 -1.3l1.3 -1.9l1.6 -4.4l0.6 -5.4l2.2 -3.5l-0.4 -1.3l5.4 -4.2l179 0l0 690l-100 0l-5.5 -8l-7.3 -7.4l-1.4 -4.3l-2.6 -4.8l-1.7 -6.2l-1.6 0.5l-1.1 -1.2l-2.1 -3.4l-5.6 -5.2l-6.9 -9.3l-2.8 -5.7l0.1 -1.8l1 -2.3l-2.5 -4.4l-7.2 -9l-5.2 -3.8l-4.4 -6.6l-2.6 -2.7l-4.3 -8.8l-0.8 -7.5l-5.2 -7.1l-2.2 -6.1l-1.8 -2.6l-2.6 -1.3l-1.1 -1.1l-1.3 -3.3l-0.4 -2.8l-0.8 -1.4l-4.5 -5.2l-2.2 -3.4l-5.5 -4.1l0 0.7l-0.6 0l-1 -1.3l4.6 -2.9l0.9 0.5l-0.9 -2.1l-3.6 -1.1l-1.2 0.7l-1.4 -1.8l-3 -0.3l-5.1 -4.1l-0.8 0.7l-2 0l1 1.4l-2.8 -1.5l-5.3 2.3l-0.8 1.2l-0.6 0l0 -0.6l-5.3 0l-1.2 1.4l-0.6 -0.8l0 -0.6l0.6 0l-0.3 -1.5l2.1 -1.3l-2.6 -0.3l-1 0.3l0.7 1.4l-1.6 1l-0.9 1.8l-1.1 -0.8l0.9 -1.1l1.5 -0.9l0 -1.4l-2.2 0.2l-0.7 0.6l-0.1 1.2l-1.2 0l0 -1.3l-0.5 0l0 0.7l-0.7 0l-0.8 -1.3l-1 0.6l-0.8 -0.6l-1.5 -2.8l-1.3 1.4l-1.1 -0.9l-0.6 2.2l-2.4 1.4l0 0.6l1.8 1.4l0 0.8l-1.1 0.6l-0.7 -0.6l-0.5 2.9l-0.6 0.9l-1.9 0.3l0.7 -0.8l-1.1 -2.1l-0.2 -3.7l-0.6 -0.7l-2.1 0.9l0.4 -1.2l-0.6 -0.7l1.3 -1.9l3.4 -2.9l-0.5 -0.6l0.5 -1l1.2 -0.4l-0.6 0.6l1.6 0.7l0.5 -0.3l0.3 -1l-0.5 0l-0.5 -2l1.6 -0.8l-0.3 -1.6l0.9 -4.5l1.2 0.6l0 -1.3l-0.7 0.5l-0.5 -0.5l1.7 -1.7l1.8 -3.3l1.3 -3.7l0.9 -4.7l1.7 -2.6l1.3 -4.6l2.4 -4.4l-0.9 -9.2l-1.2 -4.6l1.5 -6.1l2.5 -5.8l0 -0.7l-0.5 0l1.7 -3.8l-0.5 -1.7l0.9 -3l-0.2 -1.4l-1.4 -0.4l0 -0.6l1.3 -2.2l1.4 -4.2l0.6 -4.2l-0.9 -2.5l0 -1.4l1.8 -4l1.7 -9l1.4 -3.5l0 -2.1l2.8 -1.9l-0.8 -3.9l0.3 -1.5l1 0.6l0.3 -0.8l0.4 0.1l-0.9 -3.2l0.4 -1.5l1.1 -0.8l0.6 -9.1l0.6 -2.6l1.8 -4.1l0 -1.6l-1.8 -1.8l-1.2 0l-0.2 -0.8l-0.4 0.1l-0.4 1.3l-3.5 5.6l-2.1 0l-2.3 1.8l-1.9 3.9l-1.1 0.4l0.7 0.3l0 0.5l-1.4 0.9l0.2 1.1l-1.2 0.5l0.6 0.8l-3 4.2l-3.6 3.5l0.8 2l-1.4 4.1l0 5.1l-0.5 1.2l-2.5 2.3l-0.4 3l-1.3 2.7l0 7.3l1 2.2l-0.1 2.3l-3.4 2.2l-0.5 1.8l0.5 2.7l0.1 5.9l-2.3 1.7l0.5 2.9l-0.5 2.6l1.1 2l-0.9 1.1l0.1 2.4l-1.4 3.5l-2.1 2.9l-1.2 4.6l-3.5 5.3l-1.1 3.4l-0.5 0.1l1.1 3.1l-1.1 1.9l-3.6 3.3l0.5 0.7l-1.2 0.6l-0.6 1.3l-1.2 5.6l-1.2 1.7l-1.7 4.8l0.3 3l0.9 2.2l-0.7 2.3l3.7 5.8l-2.5 9.3l1.5 2.8l-1.5 7.1l0.7 0.7l-3 0.7l-0.9 2.4l-1.1 0.7l-0.5 1.4l-3.5 1l0.7 0.7l-1.6 4.6l-0.8 0.9l-2.2 -1.2l-0.6 0.6l-1.3 3.3l0.7 1.3l-1.1 1l-3.9 1.1l0.6 2.1l3.1 0l-0.6 1.4l1.2 2l-1.2 -0.7l0.6 0.7l0 0.7l-0.6 0l-2 -2.9l-3.2 -2.9l-9.7 -1.4l-2.1 -1.4l-5.7 -7.2l-1.2 -0.2l-6.1 -5.3l-1.1 -0.1l-1 0.8l-1.2 -2.6l-0.6 0.6l-4.7 -4.1l-0.9 -1.7l-2.7 -1.1l0.1 -2.5l-4.2 -2.6l0 -1.8l-2.7 -3.1l-1 -2.2l0.2 -1.5l-1.3 -1.4l-0.5 0l0 0.8l-0.7 0l-1 -1.4l-1.4 -5.2l-0.5 -0.8l-0.6 0.5l-3.6 -6.1l-11.3 -6.9l-2.9 -4.8l-2.7 -2.8l0 -0.6l-5.5 -4.2l-2.3 -3.8l-2 -1.6l0.6 -0.8l0 0.8l0.6 0l-0.6 -3.3l-1.5 -0.2l-0.7 1.3l1.6 1.4l-1.4 -0.5l-1 -1.2l-0.8 -5.9l-2.1 -4.7l2.9 -8.9l-1.6 -2.1l-0.4 -2l-2.1 -1.4l-0.6 -1.8l-0.6 -6.3l0.9 -1.8l-1 -5.8l1 -1.4l-0.6 -1.3l-1 -1.1l-0.5 0.1l-0.7 -1.9l-1.6 0.1l-0.9 -1.2l-3.3 -2.2l-1.5 -3.6l-8.9 -10.1l-3.3 -1.6l-3 -2.5l-1.5 -5.4l-2.5 -1.9l-1.9 -4.4l0.3 -3.7l-0.3 -1.7l-6.6 -4.2l0.7 0l-0.3 -0.7l-1.5 -0.7l0.6 -1.4l-0.6 0l-0.6 1.7l0.6 1.1l-1.1 0l0.7 -8.4l-1 -4l-2.7 -2l0.5 -1.8l-0.5 -4.3l1.1 -4.5l-0.3 -2.8l-3.6 -6.1l-2 -2l-1.8 -0.9l1.8 -2.2l0 -2.8l-1.1 -2l-3.6 -3.5l1.1 -1l-0.5 -1l0.6 -0.3l-2 -2.4l1.4 -0.8l0 -2.7l-0.6 0l-1.2 3.5l1.1 2l0.1 1.3l-0.6 0l-0.2 -1.2l-0.7 -0.7l-2.1 0.6l-1.4 -0.6l-1.7 1.1l-1.5 1.9l-0.7 1.7l-0.1 1.8l0.5 1.5l1.2 1l2 0.5l-1.6 1.3l-8.6 12l-2.5 4.6l-0.5 1.6l0 4.1l-1.7 3.9l1.9 2.1l1.5 3.5l0.9 1l5.5 3.9l4 4.7l2.7 1.6l2.5 2.6l2.1 2.9l0.9 1.9l1.2 5.8l2.3 4.9l-0.3 2.4l2.6 10.8l0.1 2.2l-3.1 4.1l0.7 1l-0.6 6.5l4.1 5.1l0.7 4.1l2.3 2.5l3.6 5.1l3.1 0.6l1.9 2.1l1.2 3l4.2 16.9l5 2.7l3.2 3.4l0.8 1.8l2.6 1.1l0.9 2.6l3.2 5.6l-0.1 0.6l-0.5 0l3.8 3.2l1.7 2.2l-0.1 2.1l1.2 1.7l0.6 2.1l6.4 7.7l1 2.1l2.6 1.5l0.6 3.2l3 1.1l2.8 3.6l1.9 1.1l-0.2 2.8l0.7 0.6l1.9 0l0.8 1.5l5.8 1.9l6.1 5.8l2 4.3l1.6 2l1.9 4.6l1.4 5.9l-1.8 0l-1 -2.2l-6.1 -3.3l-0.6 0l-0.8 2.3l0.8 1.8l2.5 3l1 2.3l3 -0.8l-0.4 2.8l-1.4 2.4l3.3 2.7l1.5 3.4l-3 -3.4l-0.6 0l0 0.7l0.6 1.4l-0.6 0l-0.5 -1.9l-1.6 0.1l-1.6 1.4l-1 1.7l2 1.1l3.9 6.4l-0.5 1.5l-0.1 2l5.3 2.9l1.2 1.2l0.7 4.1l2.7 3.5l1.7 7.8l2.9 2.8l8.7 5.4l1.1 1.7l0 4.9l-1.1 1.4l1 5.9l5.6 6.2l0.6 1.7l-1.3 -0.2l0 1.6l0.7 1.4l1.7 2.5l2.6 5.8l3.5 2.4l1 4.2l0 1.6l-0.6 1.1l-1.4 0.1l-1.8 -1.3l-0.9 1.9l-0.3 3.1l0.6 5.7l-1.7 6l0.8 2.9l1.2 1.1l4.1 1.7l1.3 2.6l-451.9 0l0 -435.8l1 0.1zM452.8 599.8l0.9 3.5l1.1 1.2l0 0.6l-1.8 -0.2l-2.1 -2.5l-2.6 -1.1l-1.8 -1.7l-1.9 0.9l-0.8 -0.6l-1 -2.3l1.7 -1.2l2.7 0.2l2.6 2l3 1.2zM446.4 671l1.8 0l1.7 3.8l0.7 2l0 2.4l-1.2 -1.2l-3 -7zM398.9 231.6l6 4.2l-1.8 -1.3l-13.5 -5.8l-2.5 -0.4l2.7 0.1l4.5 2.1l4.6 1.1zM372.8 226l13.7 1.6l-1.7 0.5l-7.8 -1.3l-3 0.8l-1.4 -0.3l-12.7 6.4l-1.8 1.5l1 -1.5l10.4 -5.4l3.3 -2.3zM513.7 558.1l-2.3 1.1l-2.1 -0.7l-1.7 -1.5l1.8 -2.9l4.3 0.2l0 3.8zM501 554.5l3.1 2.7l0 0.8l-6.4 0l-2.5 -1l-1.9 -2.5l0.1 -1.4l-0.7 -2.7l0.4 -0.6l0.2 0.6l0.8 -1.4l1 -0.7l1.6 0.9l0.8 1.2l-3.3 1l-0.3 1l0.8 0.9l5 -0.7l1.3 1.9zM604 639l0.9 3.1l-2.9 -3.4l-0.3 -2.3l0.6 -0.1l1.7 2.7z","green":"data:image/png;base64,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","lakes":"M592.2 62.5l0.2 5.4l-0.4 3.9l0.4 1l-0.5 0.2l0 1.8l-3.1 3.4l-1.9 -0.2l-0.9 -3.7l-1.5 -1.3l-2.8 -5.1l0.6 -3.1l2.7 -2.9l3.2 -1.7l1.9 0.2l2.1 2.1zM587.7 174.7l0.2 2.2l-0.9 3l-2 16.3l1.5 7l-2.4 11.4l0.3 2.2l-2.1 2.2l-1.7 0.4l0.5 -6.2l-1.6 0.1l-4.3 4.5l-2.3 -0.5l-0.8 -1.8l-1.1 -9.1l0.6 -3.6l-0.7 -4.2l2 -5.2l-0.6 -4.9l5.9 -11.6l2.6 -2.5l4.6 -1l2.3 1.3zM582.5 231.1l0.4 1.9l-2.3 3.1l1.2 2.9l-2.8 2.2l-2.3 0.1l-5.1 -1.4l-1 -4.1l-2.2 -3.4l-0.4 -3.4l1 -2.5l2.6 0.5l1.8 -2.2l3.5 3.3l5.6 3zM325.6 332l-1.4 -3l-0.6 0.7l0 -2.7l-0.5 0.1l-3.4 -3.6l-2.9 2.4l-5.2 -3.9l-4.7 -1.9l-4.1 -4.8l1.2 -3.4l-0.4 -1.9l1.8 -1.3l4 -1.6l1.2 0.7l5.3 7.5l0.6 3.4l-0.4 1l0.8 1.1l2.6 1.4l3.3 0.5l2 2.3l0.6 -0.8l0.6 0.8l-0.6 0.6l1.2 0.7l-0.7 0.2l0.9 2.3l-0.4 2.2l-0.8 1z","nile":"M211 337.6l-0.7 -1.7l-5.4 -1.5l-1.8 -1.9l-6.7 -4.7l-1.5 0l-1.8 1.3l-3.4 -0.6l-1 -1.1l-0.8 -4.7l-3.7 -1.9l-0.9 -4.4l-3 -1l-2.7 2l-1.5 -0.8l-0.6 -1.4l0.6 -1.4l4 -1.1l-0.6 -1.1l-2.5 -1.7l-0.2 -1.5l0.8 -3.7l-1.8 -4.4l1.3 -2.1l0.5 -2.8l-2.3 -0.6l-0.3 -1.6l1.4 -1.1l0 -0.8l-1.7 -0.9l-1.1 -1.7l-1 -8.1l-1.6 -2.2l1.9 -3.1l-0.4 -1.6l-2 0.3l-1.2 -0.4l-0.2 -1.1l1.5 -2.5l3.9 -1.8l0.1 -0.9l-0.8 -0.6l-3.9 0.6l2.4 -2l0.3 -2.1l-0.3 -1l-2.8 -0.8l2.2 -3.7l-2.7 -5.4l1 -0.6l-3.1 -3.6l0 -3.3l-2.4 -4l-4.1 -2.2l-4 -5.9l-2.2 -1.3l-0.9 -1.3l-1.3 -0.4l-1.1 0.7l-1.5 0l-0.9 -4.2l-0.6 0l0 0.8l-1.2 -0.8l2.3 -5.1l-0.2 -3.9l-3 -2.6l-0.9 1.4l-1.3 -0.8l-0.9 -2.7l-1.9 -1l-0.1 -4.4l-0.8 -1.2l-1.5 -0.2M203.1 332.5l-3 -5.2l-0.2 -4.4l-0.7 -0.7l0.3 -5.4l-4.1 -4.3l2.7 0.5l1.7 -1.2l-0.5 -3.4l1.5 0.5l0.6 0.8l0.9 -4.3l0.8 -1l3 -1.4l-0.1 -1.8l4.3 -3l-0.7 -2.4l0.7 -1.8l1.8 1.2l1.1 -0.4l-0.9 -1.3l1.6 -9.6l-1.5 -8l-1 -0.6l-0.6 -2.5l-0.3 -4.2l-1.5 -2.3l3.6 -1.7l-0.2 -1.4l-1.6 -1.4l1.8 -0.6l-1.1 -1.1l1.7 -2.4l-0.8 -2.8l0.2 -1.3l0.7 -1l2.9 -1l0.8 -3.3l1.5 -0.8l1.2 -1.6l1.8 -1.1l3.2 -0.3l0.4 -1.8l3.3 -5.6l1.4 -1.3l-0.3 -1.5l2.2 -2.6l2.6 1l0.8 -0.1l-0.6 -1.6l0.6 -0.6l2.7 0.8l3.1 0.2l2.7 -0.9l1.6 -2.2l-0.5 -2.6l3.1 -0.6l1.3 -1l0.1 -1.1l-1.6 -0.8l0.6 -1.5l1.3 0.7l1 -0.5l-0.5 -1.5l2.6 -4l0 -3.6l1.6 0.1l1.1 -1.1l0.6 -1.7l1.2 0.5l3.6 -1.8l-0.8 -2l0.3 -1.6l2 -1.9l-0.2 -0.7l1.7 -4.1M251.9 690l0.5 -2.6l-1 -1.5l-3.7 0.3l-2.1 -1.2l-0.7 -4.1l-2.7 -2.4l-6.3 -8.4l-3.7 -10.8l-1.2 -1.8l-7.4 -6.7l-2.5 -3.2l-4.3 -7.5l-0.5 -3.9l-1.5 -2l-7.1 -1.6l-1.9 -4.1l-1.1 -0.4l-1.9 1.2l-2.4 0.5l-0.3 -6.8l-6.5 -1.4l-3.5 -4.7l-2.5 -1.6l-0.3 -0.9l1 -1.6l-5.8 -2.9l-4.3 -4l-0.8 -1.9l1.4 -4l-1.2 -5.4l0 -2.4l2.4 -7.2l1.8 -2.8l-1.2 -4.4l0 -7.9l-2 -1.5l-1.6 -3.6l-0.2 -1.8l0.8 -4.7l-0.1 -5.7l-1.1 -6.4l-2.4 -3.3l-4.1 -3.5l-1.7 -4.4l0.2 -3.9l1 -1.9l-1.6 -5.4l0.3 -6l2.4 -5.8l4.2 -3.5l1.6 -3.3l0 -2.3l-1.4 -3.7l1.1 -6.5l1.1 -2.5l-0.7 -2.9l2.6 -4.3l0.6 -3.8l2.9 -5.2l0.2 -7l2.6 -4.4l6.1 -6.8l1.7 -2.7l2 -6l5.6 -4.3l3.6 -5.1l5.4 -11l-0.8 -11.5l1.4 -4.6l-1.3 -3.5l2.7 -4.4l1.5 -5.9l1.6 -1.5l0.2 -1.2l-1.2 -4.1l0.1 -2.5l0.6 -2l2.3 -2.4l-2 -2.8l-1 -3.6l0.3 -2.1l2.1 -5.1l-0.7 -8l-2.3 -6.4l-3.2 -4l-0.3 -1.9l1.3 -11.6","jordan":"M604.4 0l-1.5 2.3l-2.7 1l-1.2 1.3l-3.5 4.3l-3.3 9.9l-0.9 5.8l-2.7 5.6l-1.1 20.2l1.3 9.6M586.9 78l-1.1 1.5l0.7 0.8l-1 0.5l-0.2 1.1l0.6 2.9l-0.5 1.9l1.1 1.2l-0.6 1.3l1.2 4.7l-0.5 0.6l-0.1 -0.6l-0.6 1.5l-0.6 -0.7l0.6 2.7l-1.2 0l0 0.7l0.8 0l1.6 2.7l-1.6 1.5l-0.2 0.6l1.2 0.7l0 0.7l-1.2 0.6l0.6 0.7l-1.2 0.8l0.6 0.6l-0.6 0l0.6 1.6l-1.2 0.4l1.8 4.2l-1.2 -0.7l0.4 4.7l0.8 1.4l-0.4 3.1l1 3.1l-1.2 1.4l1.2 0l-1.5 6.3l0.3 2l-1.1 0.8l0.5 1.2l-1.5 2.4l0 1.2l0.9 1.2l-1.5 1.2l-0.4 1.7l0.1 4.6l1.9 6.7l-0.1 0.8l-1.5 0.9l-0.3 0.9l2.1 8l-0.9 1.9l1.8 5.5M573.6 217.5l-0.1 2.2l-2.3 4.5l0.4 2.8","pel":"M207.8 335 234.7 293 251.1 278 263.3 270 277.1 262 291.9 258 311.8 252 324.8 246","pl":{"ramesses":{"x":262.8,"y":270.1,"k":"city","n":"Ramessés","s":"Pi-Ramessés (Qantir), no delta oriental do Nilo","t":"Cidade-armazém construída com o trabalho forçado de Israel. Dela o povo partiu na noite da Páscoa.","r":["Gen 47:11","Exod 1:11","Exod 12:37","Num 33:3","Num 33:5"],"l":"","p":1,"q":"Qantir"},"pitom":{"x":274.0,"y":295.3,"k":"city","n":"Pitom","s":"Tell er-Retaba, no Wadi Tumilat","t":"A outra cidade-armazém que Israel edificou para Faraó.","r":["Exod 1:11"],"l":"","p":2,"q":"Tell er-Retaba"},"gosen":{"x":244.2,"y":284.0,"k":"region","n":"Gósen","s":"delta oriental do Nilo","t":"A terra onde Israel morava no Egito. As pragas das moscas e do granizo não a atingiram.","r":["Gen 45:10","Gen 47:27","Exod 8:22","Exod 9:26"],"l":"","p":1},"egito":{"x":151.6,"y":395.0,"k":"region","n":"EGITO","s":"","t":"","r":[],"l":"","p":3},"nilo":{"x":192.3,"y":475.0,"k":"river","n":"Nilo","s":"","t":"O rio onde Moisés foi posto num cesto de juncos e cujas águas se tornaram sangue. Na época, um braço do Nilo (o pelúsico, hoje seco) passava junto a Ramessés.","r":["Exod 1:22","Exod 2:3","Exod 7:20"],"l":"","p":3},"sucote":{"x":285.7,"y":294.7,"k":"city","n":"Sucote","s":"Tell el-Maskhuta, no Wadi Tumilat","t":"O primeiro acampamento depois de Ramessés.","r":["Exod 12:37","Exod 13:20","Num 33:5","Num 33:6"],"l":"","p":1,"q":"Tell el-Maskhuta"},"eta":{"x":311.8,"y":290.0,"k":"site","n":"Etã","s":"local não identificado · “à entrada do deserto”","t":"Em Números 33:8, depois de atravessar o mar, o povo ainda anda três dias “pelo deserto de Etã”: o mesmo deserto dos dois lados do mar — um dos argumentos para a travessia no golfo de Ácaba.","r":["Exod 13:20","Num 33:6","Num 33:8"],"l":"","p":1,"q":"aproximado"},"gaza":{"x":490.2,"y":200.0,"k":"city","n":"Gaza","s":"fim do caminho da costa","t":"","r":[],"l":"","p":3},"pihairote":{"x":508.8,"y":450.0,"k":"site","n":"Pi-Hairote","s":"praia de Nuweiba, na boca do Wadi Watir (proposta)","t":"“Entre Migdol e o mar até Baal-Zefom” (Êx 14:2). Na proposta da Arábia, o povo desce o desfiladeiro do Wadi Watir e fica encurralado nesta praia larga, entre as montanhas e o mar.","r":["Exod 14:2","Exod 14:9","Num 33:7"],"l":"a","p":1,"q":"Nuweiba"},"margem":{"x":524.6,"y":453.5,"k":"site","n":"Costa de Midiã","s":"desembarque proposto, na Arábia","t":"Do outro lado do golfo, o povo entra no deserto: “passaram por meio do mar ao deserto” (Nm 33:8).","r":["Exod 14:29","Exod 15:22","Num 33:8"],"l":"a","p":3,"q":"desembarque"},"sur":{"x":542.1,"y":464.0,"k":"region","n":"Deserto de Sur","s":"","t":"Três dias de caminho sem achar água. Números 33:8 chama o mesmo trecho de “deserto de Etã”.","r":["Exod 15:22","Num 33:8"],"l":"a","p":2},"mara":{"x":530.9,"y":476.0,"k":"water","n":"Mara","s":"local aproximado","t":"Águas amargas que se tornaram doces quando Moisés lançou nelas um lenho.","r":["Exod 15:23","Exod 15:25","Num 33:8","Num 33:9"],"l":"a","p":1,"q":"aproximado"},"elim":{"x":526.5,"y":497.0,"k":"water","n":"Elim","s":"aproximado · região dos oásis de al-Bad’ e Maqna","t":"Doze fontes de águas e setenta palmeiras. Nesta região ficam os oásis de al-Bad’ e de Maqna, com fontes e palmeirais; a tradição local mostra ali um “poço de Moisés”.","r":["Exod 15:27","Exod 16:1","Num 33:9","Num 33:10"],"l":"a","p":1,"q":"aproximado"},"midia":{"x":538.2,"y":502.5,"k":"city","n":"Midiã","s":"al-Bad’ (Madyan), noroeste da Arábia Saudita","t":"Onde Moisés viveu como pastor com Jetro, o sacerdote de Midiã. As grutas ao sul da cidade são chamadas pelos moradores de “Grutas de Jetro” (Maghāʾir Shuʿayb).","r":["Exod 2:15","Exod 3:1","Exod 4:19","Exod 18:1","Acts 7:29"],"l":"","p":1,"q":"al-Bad’"},"midiaR":{"x":573.3,"y":528.0,"k":"region","n":"MIDIÃ","s":"","t":"A terra de Jetro, a leste do golfo de Ácaba, no noroeste da atual Arábia Saudita.","r":["Exod 2:15","Exod 3:1","Acts 7:29"],"l":"","p":3},"sim":{"x":547.3,"y":491.5,"k":"region","n":"Deserto de Sim","s":"aproximado · “entre Elim e Sinai”","t":"Onde Deus deu as codornizes e o maná. Israel comeu maná quarenta anos, até chegar ao limite da terra de Canaã.","r":["Exod 16:1","Exod 16:35","Exod 17:1","Num 33:11","Num 33:12"],"l":"a","p":2},"refidim":{"x":557.5,"y":477.5,"k":"water","n":"Refidim","s":"a “rocha fendida” proposta, a noroeste de Jabal al-Lawz","t":"Moisés fere a rocha em Horebe e dela sai água; o lugar é chamado Massá e Meribá. Ali Israel vence Amaleque. Os defensores da rota pela Arábia apontam aqui uma grande rocha partida de alto a baixo, com marcas de erosão de água.","r":["Exod 17:1","Exod 17:6","Exod 17:7","Exod 17:8","Exod 19:2","Num 33:14"],"l":"a","p":1,"q":"rocha fendida"},"sinai":{"x":563.3,"y":484.6,"k":"mount","n":"Monte Sinai","s":"Jabal al-Lawz (2.580 m), noroeste da Arábia Saudita","t":"Paulo escreve: “Agar é o monte Sinai, na Arábia” (Gl 4:25); e Moisés chegou ao Horebe vindo de Midiã (Êx 3:1). Por isso o Atlas destaca Jabal al-Lawz, na antiga Midiã. A tradição, desde o séc. IV, aponta Jebel Musa, no sul da península do Sinai — veja em Rotas › Rota tradicional.","r":["Exod 3:1","Exod 3:12","Exod 4:27","Exod 18:5","Exod 19:2","Exod 19:18","Exod 24:16","Exod 31:18","Exod 34:2","Deut 1:2","1Kgs 19:8","Acts 7:30","Acts 7:38","Gal 4:25"],"l":"","p":0,"q":"Jabal al-Lawz"},"arabia":{"x":653.8,"y":425.0,"k":"region","n":"ARÁBIA","s":"","t":"Paulo: “Agar é o monte Sinai, na Arábia” (Gl 4:25). Depois da conversão, ele mesmo foi à Arábia (Gl 1:17).","r":["Gal 4:25","Gal 1:17"],"l":"","p":3},"pihairote_t":{"x":317.8,"y":327.5,"k":"site","n":"Pi-Hairote","s":"tradicional · junto aos lagos Amargos","t":"Uma das propostas tradicionais: a planície junto a Jabal Jinayfah, ao sul dos lagos Amargos.","r":["Exod 14:2","Num 33:7"],"l":"t","p":2,"q":"lagos Amargos"},"mara_t":{"x":358.8,"y":415.4,"k":"water","n":"Mara","s":"tradicional · Ain Hawarah","t":"Fonte salobra a sudeste de Suez.","r":["Exod 15:23"],"l":"t","p":2,"q":"Ain Hawarah"},"elim_t":{"x":356.4,"y":424.5,"k":"water","n":"Elim","s":"tradicional · Wadi Gharandal","t":"Vale com fontes e palmeiras.","r":["Exod 15:27"],"l":"t","p":2,"q":"Wadi Gharandal"},"sim_t":{"x":410.2,"y":435.2,"k":"region","n":"Deserto de Sim","s":"tradicional · Debbet er-Ramleh","t":"","r":["Exod 16:1"],"l":"t","p":2},"refidim_t":{"x":440.0,"y":487.7,"k":"water","n":"Refidim","s":"tradicional · Wadi Refayid","t":"","r":["Exod 17:1"],"l":"t","p":2,"q":"Wadi Refayid"},"sinai_t":{"x":448.0,"y":496.0,"k":"mount","n":"Jebel Musa","s":"monte Sinai da tradição (2.285 m), sul da península do Sinai","t":"Identificação tradicional desde o séc. IV, com o mosteiro de Santa Catarina ao pé do monte.","r":["Exod 19:2"],"l":"t","p":2},"canaa":{"x":547.3,"y":158.0,"k":"region","n":"CANAÃ","s":"","t":"A terra prometida, “uma terra que flui leite e mel”.","r":["Exod 3:8","Exod 6:4","Exod 15:15","Exod 16:35"],"l":"","p":2},"filistia":{"x":486.7,"y":188.0,"k":"region","n":"FILÍSTIA","s":"","t":"O caminho pela costa até a Filístia era o mais curto, mas Deus não levou o povo por ali.","r":["Exod 13:17","Exod 15:14"],"l":"","p":2},"edom":{"x":587.2,"y":308.0,"k":"region","n":"EDOM","s":"","t":"","r":["Exod 15:15","Num 20:14","1Kgs 9:26"],"l":"","p":2},"moabe":{"x":611.4,"y":218.0,"k":"region","n":"MOABE","s":"","t":"","r":["Exod 15:15"],"l":"","p":2},"peninsula":{"x":428.7,"y":395.0,"k":"region","n":"península do Sinai","s":"nome moderno","t":"O nome “Sinai” para a península inteira é posterior; na proposta da Arábia, o monte fica do outro lado do golfo de Ácaba.","r":[],"l":"","p":4},"med":{"x":307.4,"y":95.0,"k":"sea","n":"Mar Mediterrâneo","s":"“mar de filístia” (Êx 23:31)","t":"","r":["Exod 23:31"],"l":"","p":3},"vermelho":{"x":541.3,"y":615.0,"k":"sea","n":"MAR VERMELHO","s":"","t":"","r":["Exod 13:18","Exod 15:4","Heb 11:29"],"l":"","p":3},"aqaba":{"x":514.0,"y":488.0,"k":"sea","n":"golfo de Ácaba","s":"“mar Vermelho”","t":"Em 1Rs 9:26, Eziom-Geber fica “junto a Elate na beira do mar Vermelho, na terra de Edom” — isto é, neste golfo. Na proposta da Arábia, Israel atravessou aqui, de Nuweiba à costa de Midiã.","r":["Exod 14:21","Exod 14:22","Exod 15:4","1Kgs 9:26","Acts 7:36","Heb 11:29"],"l":"","p":2},"suez":{"x":349.9,"y":408.0,"k":"sea","n":"golfo de Suez","s":"","t":"","r":["Exod 10:19"],"l":"","p":4},"mmorto":{"x":577.6,"y":210.0,"k":"sea","n":"Mar Morto","s":"","t":"","r":[],"l":"","p":4},"jordao":{"x":588.9,"y":145.0,"k":"river","n":"Jordão","s":"","t":"","r":[],"l":"","p":4},"eufrates":{"x":653.8,"y":70.0,"k":"river","n":"Eufrates ↗","s":"fora do mapa, a nordeste","t":"“Desde o deserto até o rio” (Êx 23:31).","r":["Exod 23:31"],"l":"","p":2,"an":"end"}},"rt":{"x1":{"k":"main","p":[[262.8,270.1],[272.8,284.0],[285.7,294.7]]},"x2":{"k":"main","p":[[285.7,294.7],[298.8,291.5],[311.8,290.0]]},"x3":{"k":"main","p":[[311.8,290.0],[337.7,310.0],[381.1,335.0],[428.7,358.0],[467.7,388.0],[486.7,415.0],[498.0,435.0],[508.8,450.0]]},"x4":{"k":"main","p":[[508.8,450.0],[517.0,451.8],[524.6,453.5]]},"x5":{"k":"main","p":[[524.6,453.5],[532.6,463.0],[530.9,476.0]]},"x6":{"k":"main","p":[[530.9,476.0],[528.3,487.0],[526.5,497.0]]},"x7":{"k":"main","p":[[526.5,497.0],[536.9,495.0],[547.3,491.5]]},"x8":{"k":"main","p":[[547.3,491.5],[552.5,484.0],[557.5,477.5]]},"x9":{"k":"main","p":[[557.5,477.5],[560.8,480.5],[562.6,483.6]]},"t3":{"k":"trad","p":[[311.8,290.0],[302.2,308.0],[310.0,325.0],[317.8,327.5]]},"t4":{"k":"trad","p":[[317.8,327.5],[323.0,327.0],[329.1,326.5]]},"t5":{"k":"trad","p":[[329.1,326.5],[339.5,355.0],[351.6,390.0],[358.8,415.4]]},"t6":{"k":"trad","p":[[358.8,415.4],[356.4,424.5]]},"t7":{"k":"trad","p":[[356.4,424.5],[369.8,448.0],[392.3,442.0],[410.2,435.2]]},"t8":{"k":"trad","p":[[410.2,435.2],[420.9,464.0],[440.0,487.7]]},"t9":{"k":"trad","p":[[440.0,487.7],[448.0,496.0]]},"m1":{"k":"moses","p":[[272.8,285.0],[285.8,288.0],[311.8,290.0],[337.7,310.0],[381.1,335.0],[428.7,358.0],[480.6,375.0],[519.6,388.0],[533.5,391.5],[539.5,400.0],[534.3,418.0],[536.1,455.0],[537.8,485.0],[538.2,502.5]]},"m2":{"k":"moses","p":[[538.2,502.5],[549.9,497.0],[558.6,489.0],[563.3,484.6]]},"m3":{"k":"moses","p":[[563.3,484.6],[558.6,489.0],[549.9,497.0],[538.2,502.5]]},"m4":{"k":"moses","p":[[538.2,502.5],[549.9,497.0],[558.6,489.0],[563.3,484.6]]},"m5":{"k":"moses","p":[[563.3,484.6],[556.0,455.0],[543.0,412.0],[539.5,400.0],[533.5,391.5],[519.6,388.0],[480.6,375.0],[428.7,358.0],[381.1,335.0],[337.7,310.0],[311.8,290.0],[285.8,288.0],[272.8,285.0]]},"a1":{"k":"aaron","p":[[272.8,285.0],[285.8,288.0],[311.8,290.0],[337.7,310.0],[381.1,335.0],[428.7,358.0],[480.6,375.0],[519.6,388.0],[533.5,391.5],[539.5,400.0],[543.0,412.0],[556.0,455.0],[563.3,484.6]]},"e1":{"k":"army","p":[[262.8,270.1],[272.8,284.0],[285.7,294.7],[298.8,291.5],[311.8,290.0],[337.7,310.0],[381.1,335.0],[428.7,358.0],[467.7,388.0],[486.7,415.0],[498.0,435.0],[507.5,449.0]]},"e2":{"k":"army","p":[[508.5,448.7],[512.7,449.5],[516.8,450.4]]},"j1":{"k":"jethro","p":[[538.2,502.5],[549.9,497.0],[558.6,488.0],[562.1,483.2]]},"j2":{"k":"jethro","p":[[562.1,483.2],[558.6,488.0],[549.9,497.0],[538.2,502.5]]},"f1":{"k":"phil","p":[[262.8,270.1],[285.8,267.0],[304.8,264.0],[342.1,248.0],[385.4,240.0],[433.0,237.0],[472.0,218.0],[490.2,200.0]]}},"main":["x1","x2","x3","x4","x5","x6","x7","x8","x9"],"tradof":{"x3":"t3","x4":"t4","x5":"t5","x6":"t6","x7":"t7","x8":"t8","x9":"t9"},"twin":{"pihairote":"pihairote_t","mara":"mara_t","elim":"elim_t","sim":"sim_t","refidim":"refidim_t","sinai":"sinai_t","margem":"pihairote_t","sur":"mara_t"},"sc":[{"a":"1:1","t":"Israel no Egito","n":"Os filhos de Jacó se multiplicam na terra de Gósen, no delta oriental do Nilo.","fit":["ramesses","pitom","sucote","gosen","eta"],"pins":["gosen"],"show":["egito"],"minspan":125,"lbl":{"sinai":"Horebe"},"b":"1:7"},{"a":"1:8","t":"Escravos de Faraó","n":"Um novo rei oprime Israel, que edifica para ele as cidades-armazém de Pitom e Ramessés (Êx 1:11).","fit":["ramesses","pitom","sucote","gosen","eta"],"pins":["pitom","ramesses"],"show":["gosen"],"minspan":125,"lbl":{"sinai":"Horebe"},"b":"1:21"},{"a":"1:22","t":"Tirado das águas","n":"Faraó manda lançar no rio os meninos hebreus. Moisés é posto num cesto de juncos à beira do Nilo e adotado pela filha de Faraó (Êx 2:3–10).","fit":["ramesses","pitom","sucote","gosen","eta","egito"],"pins":["nilo"],"show":["ramesses","gosen"],"hl":"nile","minspan":125,"lbl":{"sinai":"Horebe"},"b":"2:10"},{"a":"2:11","t":"Moisés defende um hebreu","n":"Já adulto, Moisés vê a opressão dos irmãos e mata um egípcio (Êx 2:11–14).","fit":["ramesses","pitom","sucote","gosen","eta"],"pins":["gosen"],"show":["ramesses","pitom"],"minspan":125,"lbl":{"sinai":"Horebe"},"b":"2:14"},{"a":"2:15","t":"Fuga para Midiã","n":"Ameaçado por Faraó, Moisés atravessa o deserto até Midiã — do outro lado do golfo de Ácaba, no noroeste da atual Arábia Saudita.","fit":["m1"],"leg":"m1","walk":"a","pins":["midia"],"show":["arabia","aqaba"],"lbl":{"sinai":"Horebe"},"b":"2:15"},{"a":"2:16","t":"Em Midiã, com Jetro","n":"Junto ao poço, Moisés defende as filhas do sacerdote de Midiã; casa-se com Zípora e fica ali como pastor (Êx 2:16–22).","fit":["midia","sinai","margem","elim"],"pins":["midia"],"show":["midiaR","arabia"],"lbl":{"sinai":"Horebe"},"b":"2:22"},{"a":"2:23","t":"Israel clama no Egito","n":"Morre o rei do Egito; Deus ouve o gemido de Israel e se lembra da aliança (Êx 2:23–25).","fit":["ramesses","pitom","sucote","gosen","eta"],"pins":["gosen"],"show":["egito"],"minspan":125,"lbl":{"sinai":"Horebe"},"b":"2:25"},{"a":"3:1","t":"Até o Horebe, o monte de Deus","n":"Pastoreando as ovelhas de Jetro, Moisés vai “ao outro lado do deserto” e chega ao Horebe. Na proposta da Arábia, é Jabal al-Lawz, a uns 35 km de al-Bad’.","fit":["m2","refidim","aqaba"],"leg":"m2","walk":"a","pins":["sinai","midia"],"lbl":{"sinai":"Horebe"},"b":"3:1"},{"a":"3:2","t":"A sarça ardente","n":"“Tira teus calçados de teus pés, porque o lugar em que estás é terra santa” (Êx 3:5). E Deus promete: “servireis a Deus sobre este monte” (Êx 3:12).","fit":["sinai","refidim","aqaba","midia"],"pins":["sinai"],"lbl":{"sinai":"Horebe"},"b":"3:6"},{"a":"3:7","t":"Enviado ao Egito","n":"Do Horebe, Deus envia Moisés para tirar o povo do Egito e levá-lo a “uma terra que flui leite e mel” (Êx 3:8).","fit":["gosen","canaa","sinai","midia"],"pins":["sinai"],"show":["canaa","egito","gosen"],"lbl":{"sinai":"Horebe"},"b":"4:17"},{"a":"4:18","t":"Moisés volta a Jetro","n":"Moisés pede licença ao sogro para voltar aos irmãos no Egito (Êx 4:18).","fit":["m3"],"leg":"m3","walk":"a","pins":["midia"],"lbl":{"sinai":"Horebe"},"b":"4:18"},{"a":"4:19","t":"De volta ao Egito","n":"Com Zípora e os filhos sobre um asno e a vara de Deus na mão, Moisés toma o caminho de volta (Êx 4:20) — e no monte de Deus Arão o encontra (Êx 4:27).","fit":["m4","midia"],"leg":"m4","walk":"v","pins":["sinai"],"lbl":{"sinai":"Horebe"},"b":"4:26"},{"a":"4:27","t":"Arão encontra Moisés","n":"“Vai receber a Moisés ao deserto.” Arão vem do Egito e o encontra no monte de Deus (Êx 4:27).","fit":["a1"],"leg":"a1","walk":"a","pins":["sinai"],"lbl":{"sinai":"Horebe"},"b":"4:28"},{"a":"4:29","t":"Diante dos anciãos de Israel","n":"Moisés e Arão chegam ao Egito e reúnem os anciãos; o povo crê e adora (Êx 4:29–31).","fit":["m5"],"leg":"m5","walk":"a","pins":["gosen"],"lbl":{"sinai":"Horebe"},"b":"4:31"},{"a":"5:1","t":"Diante de Faraó","n":"“Deixa ir meu povo a celebrar-me festa no deserto” (Êx 5:1). Faraó recusa e endurece o trabalho: “Eu não vos dou palha” (Êx 5:10).","fit":["ramesses","pitom","sucote","gosen","eta"],"pins":["gosen"],"show":["egito","ramesses"],"minspan":125,"lbl":{"sinai":"Horebe"},"b":"5:23"},{"a":"6:1","t":"A promessa de Canaã","n":"Deus reafirma a aliança com Abraão, Isaque e Jacó: “de dar-lhes a terra de Canaã” (Êx 6:4).","fit":["gosen","canaa","filistia"],"pins":["canaa"],"show":["gosen","egito"],"lbl":{"sinai":"Horebe"},"b":"6:13"},{"a":"6:14","t":"A família de Moisés e Arão","n":"As genealogias de Rúben, Simeão e Levi (Êx 6:14–27).","fit":["ramesses","pitom","sucote","gosen","eta"],"pins":["gosen"],"minspan":125,"lbl":{"sinai":"Horebe"},"b":"6:27"},{"a":"6:28","t":"O cajado diante de Faraó","n":"A vara de Arão se torna serpente e engole as dos magos (Êx 7:10–12).","fit":["ramesses","pitom","sucote","gosen","eta"],"pins":["gosen"],"show":["egito"],"minspan":125,"lbl":{"sinai":"Horebe"},"b":"7:13"},{"a":"7:14","t":"O Nilo em sangue","n":"Moisés fere as águas do rio, e todas se convertem em sangue (Êx 7:20).","fit":["ramesses","pitom","sucote","gosen","eta","egito"],"pins":["nilo"],"show":["gosen"],"hl":"nile","minspan":125,"lbl":{"sinai":"Horebe"},"b":"7:25"},{"a":"8:1","t":"Rãs, piolhos e moscas","n":"Na praga das moscas, Deus separa a terra de Gósen: ali não houve moscas (Êx 8:22).","fit":["ramesses","pitom","sucote","gosen","eta"],"pins":["gosen"],"show":["egito"],"minspan":125,"lbl":{"sinai":"Horebe"},"b":"8:32"},{"a":"9:1","t":"Peste, úlceras e granizo","n":"“Somente na terra de Gósen, onde os filhos de Israel estavam, não houve granizo” (Êx 9:26).","fit":["ramesses","pitom","sucote","gosen","eta"],"pins":["gosen"],"show":["egito"],"minspan":125,"lbl":{"sinai":"Horebe"},"b":"9:35"},{"a":"10:1","t":"Gafanhotos e trevas","n":"Um vento ocidental lança os gafanhotos no mar Vermelho (Êx 10:19). Nas trevas, “todos os filhos de Israel tinham luz em suas habitações” (Êx 10:23).","fit":["ramesses","pitom","sucote","gosen","eta","suez"],"pins":["gosen"],"show":["suez","egito"],"minspan":125,"lbl":{"sinai":"Horebe"},"b":"10:29"},{"a":"11:1","t":"O último aviso","n":"Moisés anuncia a morte dos primogênitos (Êx 11).","fit":["ramesses","pitom","sucote","gosen","eta"],"pins":["gosen"],"show":["egito"],"minspan":125,"lbl":{"sinai":"Horebe"},"b":"11:10"},{"a":"12:1","t":"A Páscoa","n":"O cordeiro, o sangue nas portas e os pães sem fermento (Êx 12:1–28).","fit":["ramesses","pitom","sucote","gosen","eta"],"pins":["gosen"],"minspan":125,"lbl":{"sinai":"Horebe"},"b":"12:28"},{"a":"12:29","t":"A noite da saída","n":"À meia-noite morrem os primogênitos do Egito, e Faraó manda Israel sair (Êx 12:29–36).","fit":["ramesses","pitom","sucote","gosen","eta"],"pins":["ramesses","gosen"],"show":["egito"],"minspan":125,"lbl":{"sinai":"Horebe"},"b":"12:36"},{"a":"12:37","t":"De Ramessés a Sucote","n":"Uns seiscentos mil homens a pé, sem contar as crianças, e “grande multidão de diversa variedade de gentes” (Êx 12:37–38).","fit":["x1","pitom"],"leg":"x1","walk":"v","pins":["ramesses","sucote"],"done":0,"lbl":{"sinai":"Horebe"},"b":"12:42"},{"a":"12:43","t":"Leis da Páscoa e dos primogênitos","n":"Em Sucote, as ordens sobre a Páscoa e a consagração dos primogênitos (Êx 12:43–13:16).","fit":["x1","x2"],"pins":["sucote"],"done":1,"lbl":{"sinai":"Horebe"},"b":"13:16"},{"a":"13:17","t":"Não pelo caminho dos filisteus","n":"O caminho pela costa até a Filístia era o mais curto, mas Deus “fez ao povo que rodeasse pelo caminho do deserto do mar Vermelho” (Êx 13:17–18). Moisés leva os ossos de José.","fit":["f1","x3"],"also":["f1"],"pins":["sucote"],"show":["filistia","gaza","canaa"],"done":1,"lbl":{"sinai":"Horebe"},"b":"13:19"},{"a":"13:20","t":"De Sucote a Etã","n":"Acampam em Etã, “à entrada do deserto”. O SENHOR ia adiante deles numa coluna de nuvem de dia e de fogo à noite (Êx 13:20–22).","fit":["x2","ramesses","x1"],"leg":"x2","walk":"v","pins":["eta"],"done":1,"lbl":{"sinai":"Horebe"},"b":"13:22"},{"a":"14:1","t":"Voltam e acampam diante de Pi-Hairote","n":"Deus manda o povo dar a volta e acampar “entre Migdol e o mar até Baal-Zefom” (Êx 14:2). Na proposta da Arábia, o povo cruza o deserto e desce o desfiladeiro do Wadi Watir até a praia de Nuweiba, cercada de montanhas.","fit":["x3"],"leg":"x3","walk":"v","pins":["pihairote"],"done":2,"lbl":{"sinai":"Horebe"},"b":"14:4"},{"a":"14:5","t":"Faraó persegue Israel","n":"Seiscentos carros escolhidos alcançam o povo acampado junto ao mar. A coluna de nuvem se põe entre os dois acampamentos (Êx 14:7–20).","fit":["e1"],"leg":"e1","walk":"v","pins":["pihairote"],"done":3,"lbl":{"sinai":"Horebe"},"b":"14:20"},{"a":"14:21","t":"A travessia do mar","n":"O mar se abre e Israel passa em seco; as águas voltam sobre os egípcios (Êx 14:21–28). Na proposta da Arábia, de Nuweiba à costa de Midiã: cerca de 18 km.","fit":["x4","pihairote","margem"],"leg":"x4","walk":"v","also":["e2"],"pins":["pihairote","margem"],"show":["aqaba"],"done":3,"minspan":60,"lbl":{"sinai":"Horebe"},"b":"14:31"},{"a":"15:1","t":"O cântico do mar","n":"“Ouviram-no os povos, e tremerão” — Filístia, Edom, Moabe e Canaã (Êx 15:14–15).","fit":["filistia","edom","moabe","canaa","margem","sinai","sucote"],"pins":["margem"],"show":["filistia","edom","moabe","canaa","arabia"],"done":4,"lbl":{"sinai":"Horebe"},"b":"15:21"},{"a":"15:22","t":"Três dias no deserto de Sur","n":"“Andaram três dias pelo deserto sem achar água” (Êx 15:22) — em Nm 33:8, “pelo deserto de Etã”.","fit":["x4","x5","x6"],"leg":"x5","walk":"a","pins":["sur","mara"],"done":4,"lbl":{"sinai":"Horebe"},"b":"15:22"},{"a":"15:23","t":"Mara: as águas amargas","n":"Moisés lança na água um lenho, e ela se torna doce (Êx 15:25).","fit":["x5","x6"],"pins":["mara"],"done":5,"lbl":{"sinai":"Horebe"},"b":"15:26"},{"a":"15:27","t":"Elim: doze fontes e setenta palmeiras","n":"Acampam junto às águas (Êx 15:27).","fit":["x6","x5","midia"],"leg":"x6","walk":"a","pins":["elim"],"done":5,"lbl":{"sinai":"Horebe"},"b":"15:27"},{"a":"16:1","t":"O deserto de Sim: o maná","n":"Entre Elim e Sinai, Deus dá codornizes à tarde e maná pela manhã. Israel comeu maná quarenta anos, até chegar ao limite da terra de Canaã (Êx 16:35).","fit":["x7","x8","sinai"],"leg":"x7","walk":"a","pins":["sim"],"show":["midia"],"done":6,"b":"16:36"},{"a":"17:1","t":"Refidim: água da rocha","n":"“Ferirás a rocha, e sairão dela águas” (Êx 17:6). O lugar é chamado Massá e Meribá.","fit":["x8","sinai","sim","aqaba"],"leg":"x8","walk":"a","pins":["refidim","sinai"],"lbl":{"sinai":"Horebe"},"done":7,"b":"17:7"},{"a":"17:8","t":"Amaleque em Refidim","n":"Josué luta no vale; Moisés, com Arão e Hur, ergue as mãos no alto do monte (Êx 17:8–13).","fit":["sinai","refidim","aqaba","midia"],"pins":["refidim"],"done":8,"b":"17:16"},{"a":"18:1","t":"Jetro vem ao monte de Deus","n":"Jetro traz Zípora e os filhos e encontra Moisés “no deserto, onde tinha o acampamento junto ao monte de Deus” (Êx 18:5).","fit":["j1","refidim"],"leg":"j1","walk":"v","pins":["midia","sinai"],"lbl":{"sinai":"monte de Deus"},"done":8,"b":"18:12"},{"a":"18:13","t":"Os juízes de Israel","n":"A conselho de Jetro, Moisés escolhe homens capazes para julgar o povo (Êx 18:13–26).","fit":["sinai","refidim","aqaba","midia"],"pins":["sinai"],"lbl":{"sinai":"monte de Deus"},"done":8,"b":"18:26"},{"a":"18:27","t":"Jetro volta para a sua terra","n":"Moisés despede o sogro, que volta para Midiã (Êx 18:27).","fit":["j2"],"leg":"j2","walk":"a","pins":["midia"],"done":8,"b":"18:27"},{"a":"19:1","t":"Diante do monte Sinai","n":"No terceiro mês, Israel acampa diante do monte. Todo o monte fumega e estremece quando o SENHOR desce sobre ele (Êx 19:18). Paulo: “o monte Sinai, na Arábia” (Gl 4:25).","fit":["sinai","refidim","aqaba","midia","x9"],"leg":"x9","walk":"a","pins":["sinai"],"done":8,"b":"19:25"},{"a":"20:1","t":"Os Dez Mandamentos","n":"Deus fala do alto do monte (Êx 20:1–17); o povo, de longe, treme (Êx 20:18–21).","fit":["sinai","refidim","aqaba","midia"],"pins":["sinai"],"done":9,"b":"20:21"},{"a":"20:22","t":"As leis da aliança","n":"O altar, os servos, os danos, as festas (Êx 20:22–23:19).","fit":["sinai","refidim","aqaba","midia"],"pins":["sinai"],"done":9,"b":"23:19"},{"a":"23:20","t":"O Anjo e os limites da terra","n":"“Porei teu termo desde o mar Vermelho até o mar de filístia, e desde o deserto até o rio” (Êx 23:31) — o golfo de Ácaba, o Mediterrâneo e o Eufrates.","fit":["sinai","canaa","med","eufrates","aqaba"],"pins":["med","aqaba","eufrates"],"show":["canaa","filistia","arabia"],"done":9,"b":"23:33"},{"a":"24:1","t":"A aliança é selada","n":"Moisés edifica “um altar ao pé do monte, e doze colunas” (Êx 24:4) e sobe ao monte, onde fica quarenta dias e quarenta noites (Êx 24:18). Os defensores de Jabal al-Lawz apontam, ao pé do monte, restos de um altar e de colunas de pedra.","fit":["sinai","refidim","aqaba","midia"],"pins":["sinai"],"done":9,"b":"24:18"},{"a":"25:1","t":"O modelo do tabernáculo","n":"No monte, Deus mostra a Moisés o modelo do tabernáculo e de seus utensílios (Êx 25–31).","fit":["sinai","refidim","aqaba","midia"],"pins":["sinai"],"done":9,"b":"31:18"},{"a":"32:1","t":"O bezerro de ouro","n":"Ao pé do monte, o povo faz um bezerro de ouro. Moisés desce, vê as danças e quebra as tábuas “ao pé do monte” (Êx 32:19).","fit":["sinai","refidim","aqaba","midia"],"pins":["sinai"],"done":9,"b":"32:35"},{"a":"33:1","t":"A tenda fora do arraial","n":"Os israelitas se despojam dos enfeites “desde o monte Horebe” (Êx 33:6). Moisés fala com Deus face a face na tenda.","fit":["sinai","refidim","aqaba","midia"],"pins":["sinai"],"lbl":{"sinai":"Horebe"},"done":9,"b":"33:23"},{"a":"34:1","t":"Novas tábuas","n":"“Sobe pela manhã ao monte de Sinai” (Êx 34:2). Deus renova a aliança, e o rosto de Moisés resplandece (Êx 34:29).","fit":["sinai","refidim","aqaba","midia"],"pins":["sinai"],"done":9,"b":"34:35"},{"a":"35:1","t":"O tabernáculo é feito","n":"O povo traz ofertas, e Bezalel e Aoliabe fazem o tabernáculo ao pé do monte (Êx 35–40).","fit":["sinai","refidim","aqaba","midia"],"pins":["sinai"],"done":9,"b":"40:33"},{"a":"40:34","t":"A nuvem enche o tabernáculo","n":"“Quando a nuvem se erguia do tabernáculo, os filhos de Israel se moviam em todas suas jornadas” (Êx 40:36). A viagem continua em Números.","fit":["sinai","canaa","midia"],"pins":["sinai"],"show":["canaa"],"done":9,"b":"40:38"}],"exl":[0,22,25,22,31,23,30,25,32,35,29,10,51,22,31,27,36,16,27,25,26,36,31,33,18,40,37,21,43,46,38,18,35,23,35,35,38,29,31,43,38]};

  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const NT=new Set(['Matt','Mark','Luke','John','Acts','Rom','1Cor','2Cor','Gal','Eph','Phil','Col','1Thess','2Thess','1Tim','2Tim','Titus','Phlm','Heb','Jas','1Pet','2Pet','1John','2John','3John','Jude','Rev']);
  const ABBR={Gen:'Gn',Exod:'Êx',Num:'Nm',Deut:'Dt','1Kgs':'1Rs',Acts:'At',Gal:'Gl',Heb:'Hb'};
  const NS='http://www.w3.org/2000/svg';
  const SVG_ATLAS='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4.6 3.8 6.7v12.7L9 17.3l6 2.1 5.2-2.1V4.6L15 6.7z"/><path d="M9 4.6v12.7M15 6.7v12.7"/></svg>';
  const SVG_LAYERS='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 4 8.5 4.6L12 13.2 3.5 8.6z"/><path d="m3.5 12.4 8.5 4.6 8.5-4.6"/><path d="m3.5 16.2 8.5 4.6 8.5-4.6"/></svg>';
  const SVG_DOWN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>';
  const SVG_FIT='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3"/></svg>';

  /* ================= DADOS ================= */
  const PL=D.pl,SC=D.sc,MAIN=D.main;
  SC.forEach(s=>{[s.c1,s.v1]=s.a.split(':').map(Number);[s.c2,s.v2]=s.b.split(':').map(Number)});
  // posição de um verso de Êxodo na contagem corrida
  const ORD=[0];for(let c=1;c<D.exl.length;c++)ORD[c]=ORD[c-1]+(D.exl[c-1]||0);
  const ord=(c,v)=>(ORD[c]||0)+v;
  SC.forEach(s=>{s.o1=ord(s.c1,s.v1);s.o2=ord(s.c2,s.v2)});
  function sceneIdx(c,v){const o=ord(c,v);let lo=0,hi=SC.length-1,best=0;while(lo<=hi){const m=(lo+hi)>>1;if(SC[m].o1<=o){best=m;lo=m+1}else hi=m-1}return best}
  // trechos: curva suave (Catmull-Rom) em pontos densos, com o comprimento acumulado
  const LEG={};
  for(const id in D.rt){
    const p=D.rt[id].p,pts=[];
    for(let i=0;i<p.length-1;i++){
      const a=p[i-1]||p[i],b=p[i],c=p[i+1],d=p[i+2]||c;const n=p.length===2?2:9;
      for(let k=0;k<n;k++){const t=k/n,t2=t*t,t3=t2*t;
        pts.push([0,1].map(j=>0.5*((2*b[j])+(-a[j]+c[j])*t+(2*a[j]-5*b[j]+4*c[j]-d[j])*t2+(-a[j]+3*b[j]-3*c[j]+d[j])*t3)))}
    }
    pts.push(p[p.length-1]);
    const len=[0];for(let i=1;i<pts.length;i++)len.push(len[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));
    LEG[id]={id,k:D.rt[id].k,pts,len,L:len[len.length-1]||1};
  }
  function cut(leg,f){
    const t=Math.max(0,Math.min(1,f))*leg.L;let i=1;while(i<leg.pts.length-1&&leg.len[i]<t)i++;
    const a=leg.pts[i-1],b=leg.pts[i],seg=(leg.len[i]-leg.len[i-1])||1,u=Math.max(0,Math.min(1,(t-leg.len[i-1])/seg));
    const h=[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u];
    return{pts:leg.pts.slice(0,i).concat([h]),head:h};
  }
  const bookName=b=>(typeof BOOK_NAMES!=='undefined'&&BOOK_NAMES[b])||b;
  const refLabel=r=>{const m=String(r).match(/^(\S+) (\d+):(\d+)$/);return m?((ABBR[m[1]]||bookName(m[1]))+' '+m[2]+':'+m[3]):r};
  const scRef=s=>'Êx '+(s.c1===s.c2?(s.c1+':'+s.v1+(s.v2!==s.v1?'–'+s.v2:'')):(s.c1+':'+s.v1+'–'+s.c2+':'+s.v2));

  /* ================= VERSÕES ================= */
  const versif=()=>window.DoxaVersif;
  function readerRef(el){
    try{
      if(typeof mode==='undefined'||mode==='hyper'||!CORPORA[mode])return null;
      const v=Number(String(el.id||'').replace(/^v/,''));if(!v)return null;
      const p=pos(),b=CORPORA[mode].books[p.b];let c=Number(p.c),vv=v;
      if(mode==='wlc'&&versif()){const r=versif().toPt(b.book,c,vv);if(!r)return null;c=r.chapter;vv=r.verse}
      return{book:b.book,c,v:vv};
    }catch(e){return null}
  }

  /* ================= ESTADO ================= */
  let on=false;
  const st={sc:-1,min:false,trad:false,user:false,f:0,fT:0,autoT:0,away:false,hideT:0,shownAt:0,pop:''};
  try{st.trad=localStorage.getItem('doxa:atlas:trad')==='1'}catch(e){}
  const V={s:1,tx:0,ty:0,W:0,H:0};
  let anim=null,raf=0,drawRaf=0;
  const R={};   // elementos do mapa
  let items={routes:[],pins:[],labels:[],walkers:[]};

  /* ================= O CARTÃO ================= */
  function sheet(){
    let s=$('atlasSheet');if(s)return s;
    s=document.createElement('section');s.id='atlasSheet';s.className='atlas-sheet';s.setAttribute('aria-label','Atlas');
    s.innerHTML='<div class="atlas-grip" aria-hidden="true"><i></i></div>'
      +'<div class="atlas-head"><div class="atlas-titles"><span class="atlas-ref"></span><strong class="atlas-title"></strong></div>'
      +'<button type="button" class="atlas-hbtn atlas-rbtn" aria-label="Rotas" aria-expanded="false">'+SVG_LAYERS+'<span>Rotas</span></button>'
      +'<button type="button" class="atlas-hbtn atlas-min" aria-label="Recolher">'+SVG_DOWN+'</button></div>'
      +'<p class="atlas-note"></p>'
      +'<div class="atlas-map"><svg class="atlas-svg" xmlns="'+NS+'" role="img" aria-label="Mapa"></svg>'
      +'<div class="atlas-ctrl"><button type="button" data-z="in" aria-label="Aproximar">+</button><button type="button" data-z="out" aria-label="Afastar">−</button><button type="button" data-z="fit" aria-label="Centralizar a cena">'+SVG_FIT+'</button></div>'
      +'<div class="atlas-scale" aria-hidden="true"><i></i><span></span></div>'
      +'<div class="atlas-credit">Natural Earth · OpenBible.info (CC BY)</div>'
      +'<div class="atlas-pop" hidden></div>'
      +'<div class="atlas-layers" hidden><div class="atlas-lh">Rotas do Êxodo</div>'
      +'<div class="atlas-lrow main"><i></i><span><b>Pela Arábia · em destaque</b><small>Monte Sinai em Midiã: “o monte Sinai, na Arábia” (Gl 4:25)</small></span></div>'
      +'<label class="atlas-lrow trad"><i></i><span><b>Tradicional</b><small>Jebel Musa, no sul da península do Sinai</small></span><input type="checkbox" class="atlas-trad" role="switch"><em aria-hidden="true"></em></label>'
      +'<div class="atlas-legend"><span class="lg done">percorrido</span><span class="lg next">a seguir</span><span class="lg moses">Moisés · Arão · Jetro</span><span class="lg army">exército de Faraó</span></div>'
      +'<p class="atlas-lfoot">Lugares sem identificação firme aparecem como aproximados.</p></div>'
      +'</div>'
      +'<div class="atlas-away"><span>Abra Êxodo e role a leitura: o mapa acompanha o texto.</span><button type="button" class="atlas-go">Abrir Êxodo</button></div>';
    document.body.appendChild(s);
    buildSvg(s.querySelector('.atlas-svg'));
    s.querySelector('.atlas-min').addEventListener('click',()=>setMin(!st.min));
    s.querySelector('.atlas-note').addEventListener('click',e=>e.currentTarget.classList.toggle('open'));
    s.querySelector('.atlas-go').addEventListener('click',()=>goVerse('Exod',1,1));
    const lb=s.querySelector('.atlas-rbtn'),ly=s.querySelector('.atlas-layers');
    lb.addEventListener('click',()=>{if(st.min)setMin(false);const o=ly.hidden;ly.hidden=!o;lb.setAttribute('aria-expanded',String(o));lb.classList.toggle('on',o);closePop()});
    const tr=s.querySelector('.atlas-trad');tr.checked=st.trad;
    tr.addEventListener('change',()=>{st.trad=tr.checked;try{localStorage.setItem('doxa:atlas:trad',st.trad?'1':'0')}catch(e){}
      buildOverlay();fitScene(true)});
    s.querySelector('.atlas-ctrl').addEventListener('click',e=>{const b=e.target.closest('[data-z]');if(!b)return;
      const z=b.dataset.z;if(z==='fit'){st.user=false;fitScene(true);return}
      st.user=true;const k=z==='in'?1.8:1/1.8;const cx=(V.W/2-V.tx)/V.s,cy=(V.H/2-V.ty)/V.s;flyTo(cx,cy,clampS(V.s*k),260)});
    s.querySelector('.atlas-pop').addEventListener('click',e=>{
      if(e.target.closest('.atlas-pop-x')){closePop();return}
      const r=e.target.closest('[data-ref]');if(r){const m=r.dataset.ref.match(/^(\S+) (\d+):(\d+)$/);if(m){closePop();goVerse(m[1],+m[2],+m[3])}}});
    // alça: arrastar para baixo recolhe; para cima abre
    let y0=null,x0=0;const grip=s.querySelector('.atlas-grip'),head=s.querySelector('.atlas-head');
    [grip,head].forEach(el=>{
      el.addEventListener('touchstart',e=>{if(e.target.closest('button'))return;y0=e.touches[0].clientY;x0=e.touches[0].clientX},{passive:true});
      el.addEventListener('touchend',e=>{if(y0==null)return;const dy=e.changedTouches[0].clientY-y0,dx=e.changedTouches[0].clientX-x0;y0=null;
        if(Math.abs(dy)<Math.abs(dx)*1.5)return;if(dy>36)setMin(true);else if(dy<-36)setMin(false)},{passive:true});
    });
    grip.addEventListener('click',()=>setMin(!st.min));
    const map=s.querySelector('.atlas-map');
    if('ResizeObserver' in window)new ResizeObserver(()=>measure(true)).observe(map);
    return s;
  }
  function setMin(v){st.min=!!v;const s=$('atlasSheet');if(!s)return;s.classList.toggle('min',st.min);
    if(!st.min){requestAnimationFrame(()=>{measure(false);if(!st.user)fitScene(false);draw()})}else{closePop();const ly=s.querySelector('.atlas-layers');if(ly){ly.hidden=true;s.querySelector('.atlas-rbtn')?.classList.remove('on')}}}
  function placeSheet(){
    const s=$('atlasSheet');if(!s)return;
    const w=document.querySelector('.doxa30-bottom-wrap');const h=w&&w.offsetHeight?w.offsetHeight+4:96;
    if(s._h!==h){s._h=h;s.style.setProperty('--cb',h+'px')}
  }
  function hideSheet(now){
    clearTimeout(st.hideT);
    const go=()=>{const s=$('atlasSheet');if(s)s.classList.remove('on');document.body.classList.remove('atlas-sheet-on');closePop()};
    if(now)go();else st.hideT=setTimeout(go,650);
  }
  function openSheet(){
    clearTimeout(st.hideT);const s=sheet();placeSheet();
    if(!s.classList.contains('on')){s.classList.add('on');s.classList.toggle('min',st.min);document.body.classList.add('atlas-sheet-on');st.shownAt=performance.now();return true}
    return false;
  }

  /* ================= O MAPA ================= */
  function mk(tag,attrs,parent){const e=document.createElementNS(NS,tag);if(attrs)for(const k in attrs)e.setAttribute(k,attrs[k]);if(parent)parent.appendChild(e);return e}
  function buildSvg(svg){
    R.svg=svg;
    R.sea=mk('rect',{class:'atlas-sea',x:0,y:0,width:'100%',height:'100%'},svg);
    R.world=mk('g',{class:'atlas-world'},svg);
    mk('path',{class:'atlas-land',d:D.land},R.world);
    mk('image',{class:'atlas-green',href:D.green,x:0,y:0,width:D.w,height:D.h,preserveAspectRatio:'none'},R.world);
    mk('path',{class:'atlas-lake',d:D.lakes},R.world);
    mk('path',{class:'atlas-river atlas-pel',d:D.pel},R.world);
    mk('path',{class:'atlas-river atlas-nile',d:D.nile},R.world);
    mk('path',{class:'atlas-river',d:D.jordan},R.world);
    R.routes=mk('g',{class:'atlas-routes'},svg);
    R.pins=mk('g',{class:'atlas-pins'},svg);
    R.labels=mk('g',{class:'atlas-labels'},svg);
    bindGestures(svg);
  }
  function measure(keep){
    const map=document.querySelector('#atlasSheet .atlas-map');if(!map)return;
    const W=map.clientWidth,H=map.clientHeight;if(!W||!H)return;
    if(W===V.W&&H===V.H)return;
    const had=V.W>0;
    if(had&&keep){const cx=(V.W/2-V.tx)/V.s,cy=(V.H/2-V.ty)/V.s;V.W=W;V.H=H;V.tx=W/2-V.s*cx;V.ty=H/2-V.s*cy;clampView()}
    else{V.W=W;V.H=H}
    if(!st.user&&st.sc>=0)fitScene(false);else draw();
  }
  const sMin=()=>Math.max(V.W/D.w,V.H/D.h);
  const S_MAX=14;
  const clampS=s=>Math.max(sMin(),Math.min(S_MAX,s));
  function clampView(){
    V.s=clampS(V.s);
    V.tx=Math.min(0,Math.max(V.W-V.s*D.w,V.tx));
    V.ty=Math.min(0,Math.max(V.H-V.s*D.h,V.ty));
  }
  function setCenter(cx,cy,s){V.s=s;V.tx=V.W/2-s*cx;V.ty=V.H/2-s*cy;clampView()}
  // voo curto: centro em linha reta, zoom em escala logarítmica
  function flyTo(cx,cy,s,dur){
    if(!V.W)return;
    const c0=[(V.W/2-V.tx)/V.s,(V.H/2-V.ty)/V.s],s0=V.s;
    // centro alvo já corrigido pelos limites
    const keep={s:V.s,tx:V.tx,ty:V.ty};setCenter(cx,cy,s);const c1=[(V.W/2-V.tx)/V.s,(V.H/2-V.ty)/V.s],s1=V.s;Object.assign(V,keep);
    if(!dur||matchMedia('(prefers-reduced-motion: reduce)').matches){setCenter(c1[0],c1[1],s1);draw();return}
    anim={c0,c1,s0,s1,t0:performance.now(),dur};loop();
  }
  function stopAnim(){anim=null}
  // caixa da cena; os nomes de regiões entram pela largura do rótulo (em pixels, convertidos pela escala s)
  function sceneBox(S,s){
    const xs=[],ys=[];const add=(x,y)=>{xs.push(x);ys.push(y)};
    const addId=id=>{const p=PL[id];if(p){add(p.x,p.y);if(s&&(p.k==='region'||p.k==='sea'||p.k==='river')){const hw=(p.n.length*7+8)/s;
        if(p.an==='end')add(p.x-2*hw,p.y);else{add(p.x-hw,p.y);add(p.x+hw,p.y)}}}
      else if(LEG[id])LEG[id].pts.forEach(p=>add(p[0],p[1]))};
    const ids=(S.fit||[]).concat(S.pins||[]);
    ids.forEach(addId);
    if(st.trad){ids.forEach(id=>{if(D.twin[id])addId(D.twin[id]);if(D.tradof[id])addId(D.tradof[id])});
      if(S.leg&&D.tradof[S.leg])addId(D.tradof[S.leg])}
    if(!xs.length)return{x0:0,y0:0,x1:D.w,y1:D.h};
    let x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
    const ms=S.minspan||64;
    if(x1-x0<ms){const c=(x0+x1)/2;x0=c-ms/2;x1=c+ms/2}
    if(y1-y0<ms*0.8){const c=(y0+y1)/2;y0=c-ms*0.4;y1=c+ms*0.4}
    return{x0,y0,x1,y1};
  }
  function fitScene(animate){
    const S=SC[st.sc];if(!S||!V.W)return;
    // margens: à direita ficam os botões; embaixo, a escala
    const pl=Math.min(34,V.W*0.09),pr=58,pt=26,pb=32;
    const sOf=b=>clampS(Math.min((V.W-pl-pr)/(b.x1-b.x0),(V.H-pt-pb)/(b.y1-b.y0)));
    let b=sceneBox(S),s=sOf(b);b=sceneBox(S,s);s=sOf(b);b=sceneBox(S,s);s=sOf(b);
    const cx=(b.x0+b.x1)/2+(pr-pl)/2/s,cy=(b.y0+b.y1)/2+(pb-pt)/2/s;
    flyTo(cx,cy,s,animate?760:0);
  }

  /* ---------- camadas da cena ---------- */
  const TWIN_NAME=new Set(['pihairote_t','mara_t','elim_t','refidim_t','sim_t']);
  function placeVisible(id,S){
    const p=PL[id];if(p.l==='t'&&!st.trad)return false;
    if(id==='eufrates'||id==='gaza')return!!(S&&((S.pins||[]).includes(id)||(S.show||[]).includes(id)));
    return true;
  }
  function buildOverlay(){
    if(!R.svg)return;
    const S=SC[st.sc]||null;
    R.routes.textContent='';R.pins.textContent='';R.labels.textContent='';
    items={routes:[],pins:[],labels:[],walkers:[]};
    R.svg.classList.toggle('hl-nile',!!(S&&S.hl==='nile'));
    const done=S?(S.done||0):0,cur=S&&S.leg;
    const layers=[[],[],[],[],[]];  // a seguir · tradicional · percorrido · outros · em movimento
    MAIN.forEach((id,i)=>{const m=i<done?'done':(id===cur?'cur':'next');layers[m==='next'?0:m==='done'?2:4].push([id,'main',m])});
    if(st.trad)MAIN.forEach((id,i)=>{const t=D.tradof[id];if(!t)return;const m=i<done?'done':(id===cur?'cur':'next');layers[m==='cur'?4:1].push([t,'trad',m])});
    if(cur&&!MAIN.includes(cur))layers[4].push([cur,LEG[cur].k,'cur']);
    ((S&&S.also)||[]).forEach(id=>layers[3].push([id,LEG[id].k,'also']));
    for(const L of layers)for(const [id,k,m] of L){
      const leg=LEG[id];if(!leg)continue;
      if(m==='cur'){
        const base=mk('path',{class:'r r-'+k+' base'},R.routes),prog=mk('path',{class:'r r-'+k+' prog'},R.routes);
        const w=mk('g',{class:'atlas-walker w-'+k},R.routes);mk('circle',{class:'halo',r:11,cx:0,cy:0},w);mk('circle',{class:'core',r:5.2,cx:0,cy:0},w);
        items.routes.push({leg,el:base,full:true});items.walkers.push({leg,prog,w});
      }else{
        const el=mk('path',{class:'r r-'+k+' '+m},R.routes);items.routes.push({leg,el,full:true});
        if(k==='phil'){items.labels.push(labelItem('phil',null,'caminho dos filisteus','note',1,leg.pts[Math.floor(leg.pts.length*0.55)]))}
      }
    }
    // lugares
    const pins=new Set((S&&S.pins)||[]),show=new Set((S&&S.show)||[]),lbl=(S&&S.lbl)||{};
    for(const id in PL){
      if(!placeVisible(id,S))continue;
      const p=PL[id],em=pins.has(id),sh=show.has(id);
      let name=lbl[id]||p.n;if(TWIN_NAME.has(id))name+=' (trad.)';
      const area=p.k==='region'||p.k==='sea'||p.k==='river';
      if(area){items.labels.push(labelItem(id,p,name,p.k+(em?' em':sh?' sh':'')+(p.l==='t'?' trad':'')+(p.k==='region'&&name!==name.toUpperCase()?' small':''),em?-1:sh?0.5:p.p,[p.x,p.y]));continue}
      const g=mk('g',{class:'pin k-'+p.k+(em?' em':'')+(p.l==='t'?' trad':'')},R.pins);
      if(em)mk('circle',{class:'halo',r:12,cx:0,cy:0},g);
      if(p.k==='mount')mk('path',{class:'glyph',d:em?'M0 -8.5L8 5.5H-8z':'M0 -6L5.6 4H-5.6z'},g);
      else mk('circle',{class:'glyph',r:em?5.6:(p.k==='site'?3.6:3.4),cx:0,cy:0},g);
      items.pins.push({id,p,g,em});
      items.labels.push(labelItem(id,p,name,'place'+(em?' em':'')+(p.l==='t'?' trad':''),em?-1:(sh?0.5:p.p),[p.x,p.y],true,em&&p.q));
    }
    items.labels.sort((a,b)=>a.pri-b.pri);
    for(const L of items.labels)R.labels.appendChild(L.el);
    draw();
  }
  // rótulo; nos lugares em destaque, uma 2ª linha com a identificação (ex.: Jabal al-Lawz)
  function labelItem(id,p,text,cls,pri,xy,pin,q){
    const el=mk('text',{class:'lab '+cls});let t2=null;
    if(q){mk('tspan',{},el).textContent=text;t2=mk('tspan',{class:'q',dy:'13'},el);t2.textContent=q}else el.textContent=text;
    const fs=/\bem\b/.test(cls)?13:(/region/.test(cls)?(text===text.toUpperCase()?11:11.5):12);
    const ls=/region/.test(cls)&&text===text.toUpperCase()?0.17*fs:0;
    const w=Math.max(text.length*fs*0.56+text.length*ls,q?q.length*10.5*0.55:0),h=fs*1.15+(q?13:0);
    return{id,el,t2,pri,x:xy[0],y:xy[1],w,h,pin:!!pin,fs,ex:q?13:0,an:p&&p.an};
  }

  /* ---------- desenho ---------- */
  const sx=x=>V.tx+V.s*x,sy=y=>V.ty+V.s*y;
  const dPath=pts=>{let d='';for(let i=0;i<pts.length;i++)d+=(i?'L':'M')+sx(pts[i][0]).toFixed(1)+' '+sy(pts[i][1]).toFixed(1);return d};
  function draw(){if(drawRaf)return;drawRaf=requestAnimationFrame(()=>{drawRaf=0;render()})}
  function render(){
    if(!R.svg||!V.W)return;
    R.world.setAttribute('transform','translate('+V.tx.toFixed(2)+' '+V.ty.toFixed(2)+') scale('+V.s.toFixed(4)+')');
    for(const r of items.routes)r.el.setAttribute('d',dPath(r.leg.pts));
    for(const w of items.walkers){const c=cut(w.leg,st.f);w.prog.setAttribute('d',dPath(c.pts));
      w.w.setAttribute('transform','translate('+sx(c.head[0]).toFixed(1)+' '+sy(c.head[1]).toFixed(1)+')')}
    // botões, escala e créditos ocupam espaço; os pinos também: rótulos não ficam por cima deles
    const placed=[[V.W-50,0,V.W,134],[0,V.H-22,112,V.H],[V.W-196,V.H-15,V.W,V.H]];
    for(const P of items.pins){const X=sx(P.p.x),Y=sy(P.p.y);P.sx=X;P.sy=Y;
      const inV=X>-30&&X<V.W+30&&Y>-30&&Y<V.H+30;P.g.style.display=inV?'':'none';
      if(inV){P.g.setAttribute('transform','translate('+X.toFixed(1)+' '+Y.toFixed(1)+')');const r=P.em?7:4;placed.push([X-r,Y-r,X+r,Y+r])}}
    for(const w of items.walkers){const c=cut(w.leg,st.f);const X=sx(c.head[0]),Y=sy(c.head[1]);placed.push([X-7,Y-7,X+7,Y+7])}
    const hit=(a)=>a[0]<4||a[2]>V.W-4||a[1]<2||a[3]>V.H-4||placed.some(b=>a[0]<b[2]&&a[2]>b[0]&&a[1]<b[3]&&a[3]>b[1]);
    for(const L of items.labels){
      const X=sx(L.x),Y=sy(L.y);let ok=null;
      if(L.pin){
        const g=L.pri<0?10:8,e=L.ex,b0=Y+L.fs*0.36-e/2,cands=[['start',X+g,b0,[X+g-2,Y-L.h/2,X+g+L.w+2,Y+L.h/2]],['end',X-g,b0,[X-g-L.w-2,Y-L.h/2,X-g+2,Y+L.h/2]],
          ['middle',X,Y-g-2-e,[X-L.w/2-2,Y-g-L.h-2,X+L.w/2+2,Y-g]],['middle',X,Y+g+L.fs,[X-L.w/2-2,Y+g,X+L.w/2+2,Y+g+L.h+2]]];
        for(const c of cands)if(!hit(c[3])){ok=c;break}
      }else{
        const c=L.an==='end'?['end',X,Y+L.fs*0.36,[X-L.w-2,Y-L.h/2,X+2,Y+L.h/2]]:['middle',X,Y+L.fs*0.36,[X-L.w/2-2,Y-L.h/2,X+L.w/2+2,Y+L.h/2]];
        if(!hit(c[3]))ok=c;
      }
      // o que está em destaque aparece mesmo apertado (só não sai do quadro)
      // o que está em destaque aparece mesmo apertado: fica na posição que menos cobre os outros
      if(!ok&&L.pri<0){
        const cs=L.pin?[0,1,2,3].map(k=>{const g=10,e=L.ex,b0=Y+L.fs*0.36-e/2;return[['start',X+g,b0,[X+g-2,Y-L.h/2,X+g+L.w+2,Y+L.h/2]],['end',X-g,b0,[X-g-L.w-2,Y-L.h/2,X-g+2,Y+L.h/2]],
          ['middle',X,Y-g-2-e,[X-L.w/2-2,Y-g-L.h-2,X+L.w/2+2,Y-g]],['middle',X,Y+g+L.fs,[X-L.w/2-2,Y+g,X+L.w/2+2,Y+g+L.h+2]]][k]}):[L.an==='end'?['end',X,Y+L.fs*0.36,[X-L.w,Y-L.h/2,X,Y+L.h/2]]:['middle',X,Y+L.fs*0.36,[X-L.w/2,Y-L.h/2,X+L.w/2,Y+L.h/2]]];
        const cost=a=>{let o=0;for(const b of placed)o+=Math.max(0,Math.min(a[2],b[2])-Math.max(a[0],b[0]))*Math.max(0,Math.min(a[3],b[3])-Math.max(a[1],b[1]));
          o+=Math.max(0,4-a[0])*40+Math.max(0,a[2]-V.W+4)*40+Math.max(0,2-a[1])*40+Math.max(0,a[3]-V.H+4)*40;return o};
        ok=cs.reduce((m,c)=>cost(c[3])<cost(m[3])?c:m,cs[0])}
      if(ok){L.el.style.display='';const xs=ok[1].toFixed(1);L.el.setAttribute('x',xs);L.el.setAttribute('y',ok[2].toFixed(1));L.el.setAttribute('text-anchor',ok[0]);
        if(L.t2){L.el.firstChild.setAttribute('x',xs);L.t2.setAttribute('x',xs)}placed.push(ok[3]);L.box=ok[3]}
      else{L.el.style.display='none';L.box=null}
    }
    scaleBar();
  }
  function scaleBar(){
    const el=document.querySelector('#atlasSheet .atlas-scale');if(!el)return;
    const kmPx=1.112/V.s;let best=10;for(const k of [5,10,20,25,50,100,200,250,500])if(k/kmPx<=92)best=k;
    el.querySelector('i').style.width=(best/kmPx).toFixed(0)+'px';el.querySelector('span').textContent=best+' km';
  }
  // um só laço para o voo, o ponto que anda e a suavização
  function loop(){if(raf)return;raf=requestAnimationFrame(tick)}
  function tick(now){
    raf=0;let more=false;
    if(anim){const t=Math.min(1,(now-anim.t0)/anim.dur),e=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
      const s=Math.exp(Math.log(anim.s0)+(Math.log(anim.s1)-Math.log(anim.s0))*e);
      setCenter(anim.c0[0]+(anim.c1[0]-anim.c0[0])*e,anim.c0[1]+(anim.c1[1]-anim.c0[1])*e,s);
      if(t>=1)anim=null;else more=true}
    const S=SC[st.sc];
    if(S&&S.leg){
      if(S.walk==='a'){const L=LEG[S.leg].L;const dur=1500+Math.min(1400,L*3.2);const t=Math.min(1,Math.max(0,(now-st.autoT)/dur));
        st.f=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;if(t<1)more=true}
      else{const d=st.fT-st.f;if(Math.abs(d)>0.0015){st.f+=d*0.16;more=true}else st.f=st.fT}
    }
    if(!st.min)render();
    if(more)loop();
  }

  /* ---------- toque: arrastar, pinçar, roda, toque duplo ---------- */
  function bindGestures(svg){
    const ptr=new Map();let g=null,lastTap=0,lastXY=[0,0];
    const rel=e=>{const r=svg.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
    svg.addEventListener('pointerdown',e=>{
      try{svg.setPointerCapture(e.pointerId)}catch(_){}
      ptr.set(e.pointerId,rel(e));stopAnim();
      if(ptr.size===1){const p=ptr.get(e.pointerId);g={t:'pan',x0:p[0],y0:p[1],tx:V.tx,ty:V.ty,moved:false,t0:performance.now()}}
      else if(ptr.size===2){const [a,b]=[...ptr.values()];g={t:'pinch',d0:Math.hypot(a[0]-b[0],a[1]-b[1])||1,s0:V.s,wx:((a[0]+b[0])/2-V.tx)/V.s,wy:((a[1]+b[1])/2-V.ty)/V.s,moved:true}}
    });
    svg.addEventListener('pointermove',e=>{
      if(!ptr.has(e.pointerId)||!g)return;ptr.set(e.pointerId,rel(e));
      if(g.t==='pan'&&ptr.size===1){const p=ptr.get(e.pointerId),dx=p[0]-g.x0,dy=p[1]-g.y0;
        if(!g.moved&&Math.hypot(dx,dy)<6)return;g.moved=true;st.user=true;V.tx=g.tx+dx;V.ty=g.ty+dy;clampView();draw()}
      else if(g.t==='pinch'&&ptr.size>=2){const [a,b]=[...ptr.values()];const d=Math.hypot(a[0]-b[0],a[1]-b[1]);
        const s=clampS(g.s0*d/g.d0),mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;V.s=s;V.tx=mx-s*g.wx;V.ty=my-s*g.wy;clampView();st.user=true;draw()}
    });
    const end=e=>{
      if(!ptr.has(e.pointerId))return;const p=ptr.get(e.pointerId);ptr.delete(e.pointerId);
      if(g&&g.t==='pan'&&!g.moved&&e.type==='pointerup'&&performance.now()-g.t0<450){
        const now=performance.now();
        if(now-lastTap<320&&Math.hypot(p[0]-lastXY[0],p[1]-lastXY[1])<28){lastTap=0;st.user=true;zoomAt(p[0],p[1],2,true)}
        else{lastTap=now;lastXY=p;tap(p[0],p[1])}
      }
      if(ptr.size===1){const q=[...ptr.values()][0];g={t:'pan',x0:q[0],y0:q[1],tx:V.tx,ty:V.ty,moved:true,t0:0}}
      else if(!ptr.size)g=null;
    };
    svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);
    svg.addEventListener('wheel',e=>{e.preventDefault();stopAnim();const p=rel(e);st.user=true;zoomAt(p[0],p[1],Math.exp(-e.deltaY*(e.deltaMode?0.05:0.0018)),false)},{passive:false});
  }
  function zoomAt(px,py,k,animate){
    const s=clampS(V.s*k);if(animate){const wx=(px-V.tx)/V.s,wy=(py-V.ty)/V.s;
      // mantém o ponto tocado no mesmo lugar da tela
      const cx=wx-(px-V.W/2)/s,cy=wy-(py-V.H/2)/s;flyTo(cx,cy,s,260);return}
    V.tx=px-(px-V.tx)*(s/V.s);V.ty=py-(py-V.ty)*(s/V.s);V.s=s;clampView();draw();
  }
  function tap(x,y){
    // o pino mais perto, depois os nomes de regiões
    let best=null,bd=24;
    for(const P of items.pins){if(P.g.style.display==='none')continue;const d=Math.hypot(P.sx-x,P.sy-y);if(d<bd){bd=d;best=P.id}}
    if(!best)for(const L of items.labels){const b=L.box;if(b&&PL[L.id]&&x>=b[0]-6&&x<=b[2]+6&&y>=b[1]-6&&y<=b[3]+6){best=L.id;break}}
    if(best&&(PL[best].t||PL[best].s||PL[best].r.length))openPop(best);else closePop();
    const ly=document.querySelector('#atlasSheet .atlas-layers');if(ly&&!ly.hidden){ly.hidden=true;document.querySelector('#atlasSheet .atlas-rbtn')?.classList.remove('on')}
  }
  function openPop(id){
    const p=PL[id],S=SC[st.sc];const el=document.querySelector('#atlasSheet .atlas-pop');if(!el)return;
    const name=(S&&S.lbl&&S.lbl[id])?S.lbl[id]+' · '+p.n:p.n;
    el.innerHTML='<div class="atlas-pop-h"><strong>'+esc(name)+'</strong><button type="button" class="atlas-pop-x" aria-label="Fechar">×</button></div>'
      +(p.s?'<small class="atlas-pop-s">'+esc(p.s)+'</small>':'')+(p.t?'<p>'+esc(p.t)+'</p>':'')
      +(p.r.length?'<div class="atlas-pop-refs">'+p.r.map(r=>'<button type="button" data-ref="'+esc(r)+'">'+esc(refLabel(r))+'</button>').join('')+'</div>':'');
    el.hidden=false;el.scrollTop=0;st.pop=id;
  }
  function closePop(){const el=document.querySelector('#atlasSheet .atlas-pop');if(el)el.hidden=true;st.pop=''}

  /* ================= LEITURA ================= */
  const readingNow=()=>$('p-ler')?.classList.contains('on')&&!document.body.classList.contains('parallel-mode')&&!document.body.classList.contains('doxa-home-open');
  function lineVerse(){
    const host=$('textBody');if(!host)return null;
    const vs=host.querySelectorAll('.verse[id^="v"]');if(!vs.length)return null;
    const line=window.innerHeight*0.32;
    let lo=0,hi=vs.length-1,best=-1;
    while(lo<=hi){const mid=(lo+hi)>>1;if(vs[mid].getBoundingClientRect().top<=line){best=mid;lo=mid+1}else hi=mid-1}
    if(best<0){const r=vs[0].getBoundingClientRect();return r.top<window.innerHeight*0.55?vs[0]:null}
    const r=vs[best].getBoundingClientRect();if(r.bottom<0)return null;
    return vs[best];
  }
  let uRaf=0;
  function update(){
    uRaf=0;if(!on)return;
    placeSheet();
    if(!readingNow()){hideSheet(true);return}
    const el=lineVerse();const ref=el&&readerRef(el);
    if(!ref){hideSheet(false);return}
    const s=sheet();
    if(ref.book!=='Exod'){
      const opened=openSheet();if(!st.away||opened){st.away=true;s.classList.add('away');s.querySelector('.atlas-ref').textContent='Atlas · em teste';s.querySelector('.atlas-title').textContent='Por enquanto, só Êxodo';closePop()}
      return;
    }
    if(st.away){st.away=false;s.classList.remove('away')}
    const opened=openSheet();
    const i=sceneIdx(ref.c,ref.v),S=SC[i];
    const r=el.getBoundingClientRect(),fr=Math.max(0,Math.min(1,(window.innerHeight*0.32-r.top)/Math.max(1,r.height)));
    const fT=S.leg&&S.walk==='v'?Math.max(0,Math.min(1,(ord(ref.c,ref.v)-S.o1+fr)/(S.o2-S.o1+1))):1;
    if(i!==st.sc){
      st.sc=i;st.user=false;
      s.querySelector('.atlas-ref').textContent=scRef(S);s.querySelector('.atlas-title').textContent=S.t;
      const n=s.querySelector('.atlas-note');n.textContent=S.n;n.classList.remove('open');
      closePop();buildOverlay();
      st.fT=fT;st.f=S.walk==='v'?fT:0;st.autoT=performance.now()+(opened?420:180);
      requestAnimationFrame(()=>{measure(false);fitScene(!opened);loop()});
    }else if(S.leg&&S.walk==='v'&&Math.abs(fT-st.fT)>1e-4){st.fT=fT;loop()}
  }
  const queue=()=>{if(on&&!uRaf)uRaf=requestAnimationFrame(update)};

  /* ================= IR PARA O VERSO ================= */
  function goVerse(book,c,v){
    try{
      let md=typeof mode!=='undefined'&&CORPORA[mode]&&mode!=='hyper'?mode:'almeida';
      if(md==='wlc'&&NT.has(book))md='almeida';if(md==='tr'&&!NT.has(book))md='almeida';
      let cc=+c,vv=+v;if(md==='wlc'&&versif()){const h=versif().toHeb(book,cc,vv);cc=h.chapter;vv=h.verse}
      const bi=CORPORA[md].books.findIndex(x=>x.book===book);if(bi<0)return;
      if(md!==mode)mode=md;positions[mode]={...(positions[mode]||{}),b:bi,c:cc};focusVerse=vv;
      renderReader();try{savePrefs()}catch(e){}
      const place=()=>{const el=document.getElementById('v'+vv);if(!el)return;const y=el.getBoundingClientRect().top+window.scrollY-window.innerHeight*0.26;
        try{window.scrollTo({top:Math.max(0,y),behavior:'smooth'})}catch(e){window.scrollTo(0,Math.max(0,y))}};
      setTimeout(place,70);setTimeout(queue,700);
    }catch(e){}
  }

  /* ================= MODO ================= */
  // em Ferramentas › Explorar o texto, depois da Linha do tempo
  function ensureCard(){
    let b=$('toolsAtlasStart');
    if(!b){
      b=document.createElement('button');b.className='tool-card';b.id='toolsAtlasStart';b.type='button';
      b.innerHTML='<span class="tool-card-icon">'+SVG_ATLAS+'</span><span class="tool-card-copy"><strong>Atlas</strong><small>O mapa e o trajeto do texto. Em teste: Êxodo.</small></span><span class="tool-card-arrow" aria-hidden="true">›</span>';
      b.addEventListener('click',()=>setMode(true));
    }
    const tl=$('toolsTimelineStart');
    const ref=tl&&tl.closest('.doxa59-tools-stack')?tl:($('toolsCronoStart')||tl||$('toolsLupaStart'));
    if(ref&&ref.nextElementSibling!==b)ref.after(b);
  }
  function leaveOthers(){
    try{if(window.DoxaCrono?.isOn?.())window.DoxaCrono.setMode(false)}catch(e){}
    try{window.DoxaLupa?.setMode?.(false)}catch(e){}
    try{if(document.body.classList.contains('doxa-timeline-mode'))$('tlModeExit')?.click()}catch(e){}
    try{const bar=$('hlModeBar');if(bar&&!bar.hidden)$('hlModeExit')?.click()}catch(e){}
  }
  function openPanelLer(){try{openPanel('ler')}catch(e){}}
  function setMode(v){
    v=!!v;if(v===on&&v)return openPanelLer();
    if(v===on)return;
    const tools=$('doxa30Tools');
    if(v){
      leaveOthers();
      on=true;document.body.classList.add('doxa-atlas-on');
      if(tools){if(!tools.dataset.atlasPrev)tools.dataset.atlasPrev=tools.innerHTML;tools.innerHTML=SVG_ATLAS+'<span>Sair</span>';tools.classList.add('lupa-exit','atlas-exit');tools.setAttribute('aria-label','Sair do Atlas')}
      openPanelLer();
      const s=document.createElement('div');s.className='lupa-sweep';s.innerHTML='<i></i><span>'+SVG_ATLAS+' Atlas · role o texto</span>';
      document.body.appendChild(s);setTimeout(()=>s.remove(),2600);
      st.sc=-1;st.away=false;st.min=false;
      setTimeout(queue,420);
    }else{
      on=false;document.body.classList.remove('doxa-atlas-on');
      if(tools&&tools.dataset.atlasPrev){tools.innerHTML=tools.dataset.atlasPrev;delete tools.dataset.atlasPrev;tools.classList.remove('lupa-exit','atlas-exit');tools.setAttribute('aria-label','Ferramentas')}
      hideSheet(true);st.sc=-1;stopAnim();
    }
  }

  // outros modos que usam a aba Ferramentas: sai do Atlas antes
  document.addEventListener('click',e=>{
    if(!on)return;
    if(e.target.closest?.('#toolsLupaStart,#toolsTimelineStart,#toolsHighlightStart,#toolsCopyVersesStart,#toolsCronoStart'))setMode(false);
  },true);
  window.addEventListener('click',e=>{
    if(!on)return;
    if(e.target.closest?.('#doxa30Tools.atlas-exit:not(.doxa-copy-action)')){e.preventDefault();e.stopImmediatePropagation();setMode(false)}
  },true);
  window.addEventListener('scroll',queue,{passive:true});
  window.addEventListener('resize',()=>{queue();measure(true)},{passive:true});
  const host=$('textBody');
  if(host&&'MutationObserver' in window){let t=0;new MutationObserver(()=>{if(!on)return;clearTimeout(t);t=setTimeout(queue,90)}).observe(host,{childList:true})}
  const origOpen=window.openPanel;
  if(typeof origOpen==='function'&&!origOpen.__doxa62){
    const w=function(name){const r=origOpen.apply(this,arguments);if(name==='marcar')ensureCard();if(on){setTimeout(queue,60);setTimeout(queue,400)}return r};
    w.__doxa62=true;for(const k of Object.keys(origOpen))try{w[k]=origOpen[k]}catch(e){}window.openPanel=w;
  }

  ensureCard();setTimeout(ensureCard,1200);setTimeout(ensureCard,3000);
  window.DoxaAtlas={setMode,isOn:()=>on,update:queue,
    scene:(c,v)=>{const S=SC[sceneIdx(c,v)];return S&&{ref:scRef(S),title:S.t,leg:S.leg||null,pins:S.pins||[]}},
    view:()=>({...V,sc:st.sc,f:st.f,user:st.user,trad:st.trad,away:st.away}),scenes:()=>SC.length};
})();
