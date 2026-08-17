import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const FPS = 30;
const jobs = [
  { folder: 'video-01-seguridad-estabilidad', output: 'locucion-completa-temporizada-30fps-v2-pausas-10.md', scale: 1.1 },
  { folder: 'video-02-crecimiento-diversificacion', output: 'locucion-completa-temporizada-30fps-v2-pausas-10.md', scale: 1.1 },
  { folder: 'video-03-activos-complementarios', output: 'locucion-completa-temporizada-30fps-v2-pausas-10.md', scale: 1.1 },
  {
    folder: 'video-02-crecimiento-diversificacion',
    output: 'locucion-completa-temporizada-30fps-v3-if2-mas-10.md',
    scale: 8081 / 7200,
    pauseNote: 'duración ajustada al 110 % exacto de IF2.mp4: 5.877 fotogramas a 24 fps, convertidos a una línea de tiempo de 30 fps; el tiempo adicional se reparte entre ideas y cambios de bloque.',
  },
  {
    folder: 'video-01-seguridad-estabilidad',
    output: 'locucion-definitiva-IF1-110-30fps.md',
    scale: 8101 / 7740,
    timingCsv: '03-preproduccion/timing-locucion-30fps-youtube-v4.csv',
    videoReference: 'D:\\DaVinci\\IF1-110.mp4 · 8.101 fotogramas · 00:04:30:01',
    pauseNote: 'intervalos sincronizados con las escenas de IF1-110.mp4; la información se mantiene a velocidad natural y el margen disponible de cada escena se convierte en pausas antes y después de cada idea.',
    wordCount: 495,
    textReplacements: [
      [
        'Esas preguntas crean tres zonas: hoy, pronto y más adelante. En cada una buscamos una combinación distinta de liquidez, estabilidad y rentabilidad.',
        'Así aparecen tres zonas: hoy, pronto y más adelante. Cada una combina liquidez, estabilidad y rentabilidad.',
      ],
      [
        'Ya tenemos el mapa: primero define el objetivo; después, el plazo y la liquidez. Solo entonces compara activos, costes, fiscalidad y riesgos.',
        'Ya tienes el mapa: define objetivo, plazo y liquidez. Después compara activos, costes, fiscalidad y riesgos.',
      ],
    ],
  },
  {
    folder: 'video-02-crecimiento-diversificacion',
    output: 'locucion-definitiva-IF2-110-30fps.md',
    scale: 7919 / 7200,
    videoReference: 'D:\\DaVinci\\IF2-110.mp4 · 7.919 fotogramas · 00:04:23:29',
    pauseNote: 'intervalos ajustados fotograma a fotograma a IF2-110.mp4; la voz conserva su velocidad natural y el margen de cada bloque se utiliza como pausa pedagógica.',
    wordCount: 443,
    textReplacements: [
      [
        'Tienes dinero para el largo plazo. ¿Compras una empresa, un fondo o un ETF? Las tres opciones buscan crecimiento, pero no estás comprando lo mismo.',
        'Imagina que quieres invertir a largo plazo. ¿Eliges acciones, un fondo o un ETF? Buscan crecimiento, pero funcionan diferente.',
      ],
      [
        'Cuando el horizonte es largo, una parte del patrimonio puede participar en el crecimiento de empresas y mercados. A cambio, su valor fluctuará y habrá periodos de pérdidas.',
        'A largo plazo, el patrimonio puede participar en el crecimiento de empresas y mercados. A cambio, su valor fluctuará y habrá pérdidas.',
      ],
      [
        'La distinción esencial es esta: una acción es un activo. Un fondo o un ETF son vehículos que reúnen activos dentro de una cartera.',
        'Una acción es un activo. Un fondo o un ETF son vehículos que agrupan distintos activos dentro de una cartera.',
      ],
      [
        'Por eso hay dos decisiones diferentes. Primero eliges qué exposición quieres: empresas, sectores, países o mercados. Después decides cómo acceder a ella.',
        'Hay dos decisiones. Primero eliges la exposición: empresas, sectores, países o mercados. Después decides mediante qué vehículo acceder.',
      ],
      [
        'Una acción representa una pequeña parte de una empresa. Si compras una, tu resultado depende del negocio y también del precio que pagaste.',
        'Una acción representa una parte de una empresa. Tu resultado depende de la evolución del negocio y del precio que pagaste.',
      ],
      [
        'La rentabilidad puede llegar por los dividendos y por una subida de la cotización. Ninguna de las dos está garantizada, y el precio puede caer con fuerza.',
        'La rentabilidad llega por dividendos o por una subida de la cotización. Ninguna está garantizada y el precio puede caer con fuerza.',
      ],
      [
        'Elegir compañías concretas ofrece mucho control, pero también concentra el riesgo. Un error en una empresa puede pesar demasiado si la cartera tiene pocas posiciones.',
        'Elegir empresas concretas ofrece control, pero concentra el riesgo. Un error puede pesar demasiado cuando la cartera tiene pocas posiciones.',
      ],
      [
        'Un fondo reúne el dinero de muchos partícipes y lo invierte siguiendo una política definida. Puede contener acciones, bonos, liquidez o una combinación.',
        'Un fondo reúne dinero de muchos inversores según una política definida. Puede contener acciones, bonos, liquidez o una combinación.',
      ],
      [
        'La gestión puede ser activa o indexada. En ambos casos conviene mirar qué hay dentro, qué riesgo asume, cuánto cuesta y qué horizonte propone.',
        'La gestión puede ser activa o indexada. En ambos casos, revisa qué contiene, qué riesgo asume, cuánto cuesta y qué horizonte plantea.',
      ],
      [
        'En un fondo tradicional suscribes o reembolsas participaciones. La operación se ejecuta al valor liquidativo aplicable, que normalmente no conoces exactamente al dar la orden.',
        'En un fondo tradicional suscribes o reembolsas participaciones al valor liquidativo, que normalmente desconoces cuando das la orden.',
      ],
      [
        'Para una persona física residente en España, determinados traspasos entre fondos pueden diferir la tributación si se cumplen los requisitos. No es una exención: se aplaza hasta el reembolso definitivo.',
        'En España, los traspasos entre fondos pueden diferir la tributación si cumplen requisitos. No es una exención: se aplaza hasta el reembolso definitivo.',
      ],
      [
        'Un ETF también es una cartera. Muchos replican un índice de empresas, sectores o bonos. La diferencia visible está en cómo se compran y venden sus participaciones.',
        'Un ETF también es una cartera. Muchos replican índices de empresas o bonos. La diferencia está en cómo se compran y venden.',
      ],
      [
        'El ETF cotiza en bolsa como una acción. Ves un precio durante la sesión y puedes lanzar la orden en ese momento, usando una cuenta de valores.',
        'El ETF cotiza en bolsa como una acción. Ves su precio durante la sesión y operas mediante una cuenta de valores.',
      ],
      [
        'Además de la comisión de gestión, pueden existir gastos de compraventa, custodia y diferencia entre el precio comprador y vendedor. Un coste pequeño repetido también cuenta.',
        'Además de la comisión de gestión, puede haber gastos de compraventa, custodia y diferencia entre precios de compra y venta. Todo suma.',
      ],
      [
        'En España, los ETF no disfrutan del diferimiento por traspaso de los fondos tradicionales. Al vender con ganancia o pérdida se produce el efecto fiscal correspondiente.',
        'En España, los ETF no permiten el diferimiento por traspaso de los fondos. Al vender se aplica la fiscalidad correspondiente.',
      ],
      [
        'Diversificar significa repartir la exposición entre muchas fuentes de resultado. Así reduces la dependencia de una sola empresa, un sector o un país.',
        'Diversificar reparte la exposición entre distintas fuentes de resultado. Así reduces la dependencia de una sola empresa, sector o país.',
      ],
      [
        'Pero diversificar no garantiza beneficios. Si cae el mercado completo, un fondo o un ETF diversificado también puede perder valor durante meses o años.',
        'Diversificar no garantiza beneficios. Si cae el mercado completo, un fondo o un ETF también puede perder valor durante meses o años.',
      ],
      [
        'La comparación queda así: las acciones dan selección directa; los fondos delegan la cartera y operan por valor liquidativo; los ETF ofrecen una cartera negociada en bolsa.',
        'En resumen: las acciones permiten selección directa; los fondos delegan la cartera y operan por valor liquidativo; los ETF cotizan en bolsa.',
      ],
      [
        'No existe un ganador universal. Compara la exposición real, el grado de control, la diversificación, los costes totales, la operativa y la fiscalidad que te corresponda.',
        'No hay un ganador universal. Compara exposición, control, diversificación, costes totales, operativa y la fiscalidad que se aplique en tu caso.',
      ],
      [
        'Y antes de invertir, responde con honestidad: ¿podrás mantener la estrategia si ves una caída importante sin necesitar ese dinero ni vender por miedo?',
        'Antes de invertir, pregúntate: ¿mantendrás la estrategia durante una caída importante sin necesitar el dinero ni vender por miedo?',
      ],
      [
        'Primero decide qué quieres tener. Después elige el vehículo. El largo plazo solo ayuda cuando la cartera encaja con tu objetivo y con tu comportamiento.',
        'Decide qué quieres tener y luego elige el vehículo. El largo plazo ayuda si la cartera encaja con tu objetivo.',
      ],
      [
        'En el próximo capítulo veremos cómo completar una cartera con criterio. Suscríbete para seguir aprendiendo con NUVIA Academy.',
        'Próximo capítulo: cómo completar la cartera. Suscríbete a NUVIA Academy.',
      ],
    ],
  },
  {
    folder: 'video-03-activos-complementarios',
    output: 'locucion-definitiva-IF3-110-30fps.md',
    scale: 8711 / 7920,
    videoReference: 'D:\\DaVinci\\IF3-110.mp4 · 8.711 fotogramas · 00:04:50:11',
    pauseNote: 'intervalos ajustados fotograma a fotograma a IF3-110.mp4; la voz conserva su velocidad natural y el margen de cada bloque se utiliza como pausa pedagógica.',
    wordCount: 474,
    textReplacements: [
      [
        'Inmuebles, SOCIMI, oro, planes de pensiones y criptoactivos aparecen a menudo como alternativas. Pero añadir más productos no significa tener una cartera mejor diversificada.',
        'Inmuebles, SOCIMI, oro, pensiones y criptoactivos parecen alternativas. Pero acumular productos no garantiza una mejor diversificación.',
      ],
      [
        'Un activo complementario solo tiene sentido cuando cumple una función concreta: generar rentas, diversificar una fuente de riesgo, proteger una finalidad o aportar una exposición diferente.',
        'Un activo complementario debe cumplir una función: generar rentas, diversificar riesgos, proteger un objetivo o aportar otra exposición.',
      ],
      [
        'Antes de incorporarlo, responde dos preguntas. ¿Qué aporta a la cartera? ¿Y qué riesgo nuevo introduce? Si la respuesta no es sencilla, todavía falta comprender la inversión.',
        'Antes de añadirlo, responde dos preguntas: ¿qué aporta a la cartera y qué riesgo introduce? Si no puedes explicarlo, aún no comprendes la inversión.',
      ],
      [
        'También conviene separar tres conceptos. El inmueble y el oro son activos. Una SOCIMI o un plan de pensiones son vehículos. La jubilación es una finalidad.',
        'Separa conceptos. El inmueble y el oro son activos. Una SOCIMI y un plan de pensiones son vehículos. La jubilación es una finalidad.',
      ],
      [
        'Un inmueble directo es una propiedad física. Puede utilizarse, alquilarse o venderse, y puede generar una renta periódica si existe un inquilino que paga.',
        'Un inmueble directo es una propiedad física. Puede utilizarse, alquilarse o venderse, y generar rentas si existe un inquilino que paga.',
      ],
      [
        'Pero concentra mucho capital en una ubicación y un activo. Mantenimiento, impuestos, financiación, periodos vacíos y tiempo de venta forman parte del resultado real.',
        'Pero concentra capital en una ubicación. Mantenimiento, impuestos, financiación, periodos vacíos y tiempo de venta afectan al resultado real.',
      ],
      [
        'Una SOCIMI es una sociedad cotizada dedicada principalmente al negocio inmobiliario en alquiler. El inversor accede comprando acciones, no adquiriendo directamente los edificios.',
        'Una SOCIMI es una sociedad cotizada centrada en inmuebles en alquiler. El inversor compra acciones; no adquiere directamente los edificios.',
      ],
      [
        'La entrada y la salida suelen ser más sencillas que en un inmueble físico. A cambio, el precio fluctúa en bolsa y depende de rentas, ocupación, deuda y tipos de interés.',
        'Entrar y salir suele ser más sencillo que en un inmueble físico. A cambio, el precio fluctúa y depende de rentas, ocupación, deuda y tipos.',
      ],
      [
        'La diferencia esencial es esta: el inmueble ofrece control directo y baja liquidez; la SOCIMI ofrece gestión profesional y liquidez de mercado, pero sigue siendo renta variable.',
        'El inmueble ofrece control directo y poca liquidez. La SOCIMI ofrece gestión profesional y liquidez de mercado, pero sigue siendo renta variable.',
      ],
      [
        'El oro es un activo real escaso. No representa una empresa ni una deuda. Puede comportarse de forma distinta en determinados periodos de incertidumbre.',
        'El oro es un activo real escaso. No representa una empresa ni una deuda, y puede comportarse de forma distinta durante la incertidumbre.',
      ],
      [
        'Pero el oro no genera intereses, dividendos ni alquileres. La rentabilidad depende del precio futuro y deben considerarse compra, diferencial, custodia, seguro y vehículo utilizado.',
        'El oro no genera intereses, dividendos ni alquileres. Su rentabilidad depende del precio futuro y también de compra, custodia, seguro y vehículo.',
      ],
      [
        'Su posible función es diversificar, no producir una renta estable ni garantizar protección. Además, no todo objeto de oro cumple la definición legal de oro de inversión.',
        'Puede diversificar, pero no garantiza protección ni una renta estable. Además, no todo objeto de oro se considera legalmente oro de inversión.',
      ],
      [
        'Un plan de pensiones tampoco es una clase de activo. Es un vehículo de ahorro para una finalidad, que invierte en renta fija, acciones u otras inversiones.',
        'Un plan de pensiones no es una clase de activo. Es un vehículo que puede invertir en renta fija, acciones u otros activos.',
      ],
      [
        'Por eso su riesgo depende de la cartera que contiene. Antes de contratarlo hay que revisar la política, el horizonte, los costes y la forma prevista de cobro.',
        'Su riesgo depende de la cartera interior. Antes de contratarlo, revisa política, horizonte, costes y opciones de cobro.',
      ],
      [
        'La liquidez está limitada por las contingencias y supuestos legales. Desde 2025 también pueden recuperarse aportaciones que hayan cumplido al menos diez años, según las condiciones aplicables.',
        'La liquidez está limitada por la ley. Desde 2025 pueden recuperarse aportaciones con al menos diez años de antigüedad, según las condiciones aplicables.',
      ],
      [
        'Las aportaciones pueden reducir la base imponible dentro de los límites legales. Al cobrar el plan, la prestación tributa con carácter general como rendimiento del trabajo.',
        'Las aportaciones pueden reducir la base imponible dentro de los límites legales. Al cobrar, la prestación tributa normalmente como rendimiento del trabajo.',
      ],
      [
        'Los criptoactivos son representaciones digitales de valor o derechos. Existen categorías muy diferentes y no todas ofrecen los mismos derechos ni tienen un activo que las respalde.',
        'Los criptoactivos representan digitalmente valor o derechos. Hay categorías muy distintas, con derechos diferentes, y no todas cuentan con activos de respaldo.',
      ],
      [
        'Pueden sufrir oscilaciones extremas, fraude, fallos tecnológicos, problemas de custodia y pérdida total. Regular el mercado no convierte el activo en seguro ni garantiza compensación.',
        'Puede haber grandes oscilaciones, fraude, fallos tecnológicos, problemas de custodia y pérdida total. La regulación no garantiza seguridad ni compensación.',
      ],
      [
        'Antes de operar, hay que comprender el activo, leer su información y verificar que el proveedor esté autorizado en la Unión Europea. Proteger las claves también forma parte del riesgo.',
        'Antes de operar, comprende el activo, lee su información y verifica que el proveedor esté autorizado en la Unión Europea. Protege también tus claves.',
      ],
      [
        'La comparación muestra riesgos distintos: iliquidez en el inmueble, mercado y deuda en la SOCIMI, ausencia de rentas en el oro, restricciones en pensiones y pérdida total en cripto.',
        'Los riesgos cambian: iliquidez inmobiliaria; mercado y deuda en la SOCIMI; ausencia de rentas en el oro; restricciones en pensiones; pérdida total en cripto.',
      ],
      [
        'No preguntes cuál parece más sofisticado. Pregunta qué función aporta, cuánto puede pesar, cómo recuperas el dinero, qué cuesta mantenerlo y qué puede salir mal.',
        'No busques sofisticación. Pregunta qué función aporta, cuánto debe pesar, cómo recuperas el dinero, qué cuesta mantenerlo y qué puede salir mal.',
      ],
      [
        'Complementar no significa acumular. Significa añadir solo aquello que mejora la cartera y cuyo riesgo puedes explicar. Suscríbete para seguir aprendiendo con NUVIA Academy.',
        'Complementar no es acumular. Es añadir solo aquello que mejora la cartera y cuyo riesgo puedes explicar. Suscríbete a NUVIA Academy.',
      ],
    ],
  },
];

function frameToTimecode(frame) {
  const frames = frame % FPS;
  const totalSeconds = Math.floor(frame / FPS);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  return [hours, minutes, seconds, frames]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

for (const job of jobs) {
  const directory = join('output', 'videos', job.folder, '02-guion');
  const sourcePath = join(directory, 'locucion-completa-temporizada-30fps-v1.md');
  const outputPath = join(directory, job.output);
  const source = await readFile(sourcePath, 'utf8');
  const timingByPlan = new Map();
  if (job.timingCsv) {
    const timingSource = await readFile(join('output', 'videos', job.folder, job.timingCsv), 'utf8');
    timingSource.split(/\r?\n/).slice(1).forEach((row) => {
      const [plan, , , startFrame, endFrame] = row.split(',');
      if (plan && Number.isFinite(Number(startFrame)) && Number.isFinite(Number(endFrame))) {
        timingByPlan.set(plan, { startFrame: Number(startFrame), endExclusiveFrame: Number(endFrame) });
      }
    });
  }

  let finalExclusiveFrame = 0;
  let updated = source.replace(
    /^### P(\d+) · [0-9:]+–[0-9:]+ · F(\d+)–F(\d+)$/gm,
    (_match, plan, sourceStart, sourceEnd) => {
      const planKey = `P${plan}`;
      const sourceTiming = timingByPlan.get(planKey);
      const baseStartFrame = sourceTiming?.startFrame ?? Number(sourceStart);
      const baseEndExclusiveFrame = sourceTiming?.endExclusiveFrame ?? Number(sourceEnd) + 1;
      const startFrame = Math.round(baseStartFrame * job.scale);
      const endExclusiveFrame = Math.round(baseEndExclusiveFrame * job.scale);
      finalExclusiveFrame = Math.max(finalExclusiveFrame, endExclusiveFrame);
      return `### P${plan} · ${frameToTimecode(startFrame)}–${frameToTimecode(endExclusiveFrame)} · F${String(startFrame).padStart(4, '0')}–F${String(endExclusiveFrame - 1).padStart(4, '0')}`;
    }
  );
  for (const [before, after] of job.textReplacements ?? []) {
    updated = updated.replaceAll(before, after);
  }

  const durationSeconds = finalExclusiveFrame / FPS;
  const wordMatch = updated.match(/\*\*Extensión:\*\*\s*(\d+) palabras/);
  const words = job.wordCount ?? (wordMatch ? Number(wordMatch[1]) : 0);
  const pace = Math.round(words / (durationSeconds / 60));
  const finalText = updated
    .replace(
      /\*\*Duración de montaje:\*\*\s*[0-9:]+\s{2}/,
      `**Duración de montaje:** ${frameToTimecode(finalExclusiveFrame)}  `
    )
    .replace(
      /\*\*Fotogramas:\*\*\s*F\d+–F\d+; final exclusivo F\d+\s{2}/,
      `**Fotogramas:** F0000–F${String(finalExclusiveFrame - 1).padStart(4, '0')}; final exclusivo F${String(finalExclusiveFrame).padStart(4, '0')}  `
    )
    .replace(
      /\*\*Ritmo de referencia:\*\*[^\n]+/,
      `**Ritmo de referencia:** aproximadamente ${pace} palabras por minuto, incluidas las pausas  `
    )
    .replace(
      /\*\*Extensión:\*\*\s*\d+ palabras\s{2}/,
      `**Extensión:** ${words} palabras  `
    )
    .replace(
      /\*\*Uso:\*\*[^\n]+/,
      '**Uso:** cargar este Markdown en Texto a Voz, mantener activado «Encajar cada bloque con pausas» y generar con «Natural por bloques · Flash». La voz conserva su velocidad natural.  '
    )
    .replace(
      /(\*\*Uso:\*\*[^\n]+\n)/,
      `$1**Tratamiento de pausas:** ${job.pauseNote ?? 'duración ampliada un 10 %; el tiempo adicional se reparte entre ideas y cambios de bloque, no al final.'}  \n`
    )
    .replace(
      /(\*\*Duración de montaje:\*\*[^\n]+\n)/,
      job.videoReference ? `$1**Vídeo de referencia:** ${job.videoReference}  \n` : '$1'
    );

  await writeFile(outputPath, finalText, 'utf8');
  console.log(`${outputPath} -> ${frameToTimecode(finalExclusiveFrame)} (${finalExclusiveFrame} fotogramas)`);
}
