# NUVIA — Marco regulatorio obligatorio y compatibilidad profesional

**Versión:** 1.0  
**Fecha:** 23 de agosto de 2026  
**Estado:** norma interna obligatoria y transversal  
**Ámbito:** todo NUVIA Portal Lab, incluida la copia local de `company-analysis/`

---

## 0. Naturaleza, jerarquía y efecto obligatorio

Este documento establece las reglas regulatorias y de compatibilidad profesional
que deben cumplirse en el diseño, desarrollo, revisión, publicación y operación
de NUVIA Portal Lab.

No es una declaración comercial ni un aviso legal para el usuario. Es una
**restricción de producto, contenido, arquitectura y desarrollo**.

Se aplica, sin excepción, a:

- páginas, secciones, módulos y rutas;
- textos, titulares, etiquetas, colores, iconos y llamadas a la acción;
- cálculos, algoritmos, filtros, comparadores, rankings y simuladores;
- gráficos, tablas, informes, exportaciones y documentos descargables;
- contenidos editoriales, educativos, audiovisuales y de Academia NUVIA;
- análisis de cartera, empresas, instrumentos, mercados y fiscalidad;
- sistemas de IA, prompts, respuestas, resúmenes y explicaciones automáticas;
- personalización, cuentas, persistencia, telemetría y tratamiento de datos;
- integraciones, APIs, enlaces, directorios, colaboraciones y monetización;
- prototipos, demostraciones, pruebas piloto y funcionalidades no publicadas.

### Jerarquía

1. La legislación y los criterios vinculantes de las autoridades competentes.
2. Las obligaciones contractuales y de compliance derivadas de la condición de
   agente financiero vinculado de uno de los promotores.
3. Este documento.
4. Los demás documentos funcionales, planes, diseños y decisiones del proyecto.

Si cualquier documento, diseño o implementación contradice este marco,
**prevalece este marco**. La contradicción no se resuelve mediante un descargo de
responsabilidad: la función debe corregirse, desactivarse o quedar bloqueada.

### Regla de prudencia

Cuando exista una duda razonable sobre la calificación regulatoria de una
función, no se presumirá que está permitida. Se clasificará como pendiente y no
se publicará hasta disponer de una conclusión documentada y, cuando proceda, de
validación jurídica o de compliance.

Este documento no sustituye el asesoramiento jurídico externo ni puede prometer
por sí solo una compatibilidad absoluta ante cualquier cambio normativo. Su
finalidad es imponer **cumplimiento por diseño**, revisión continua y bloqueo
preventivo de las zonas dudosas.

---

## 1. Modelo regulatorio de NUVIA

NUVIA es una plataforma digital de:

- información financiera objetiva;
- educación financiera;
- explicación de conceptos y métodos académicos;
- organización y visualización de datos;
- cálculos financieros y estadísticos;
- análisis descriptivo;
- simulación de escenarios definidos y controlados por el usuario.

NUVIA no es, ni debe funcionar en la práctica como:

- servicio de asesoramiento en materia de inversión;
- gestor de carteras;
- receptor, transmisor o ejecutor de órdenes;
- mediador o comercializador de productos financieros;
- canal de captación o derivación de clientes hacia el agente vinculado;
- comparador que ordena productos o emisores por conveniencia financiera;
- sistema de señales de compra, venta o mantenimiento;
- sistema que determina la idoneidad o conveniencia de una inversión;
- sustituto de una entidad autorizada o de un profesional habilitado.

La naturaleza de NUVIA se determinará por su funcionamiento real y por el efecto
previsible del conjunto de la experiencia, no por su nombre, CNAE, objeto social
o avisos legales.

---

## 2. Marcos regulatorios que deben contemplarse

La revisión de cada función deberá considerar, como mínimo y según resulte
aplicable:

1. **MiFID II y su normativa de desarrollo**, especialmente la frontera entre
   información y recomendación personalizada, la idoneidad, la conveniencia, la
   promoción y los servicios de inversión reservados.
2. **Reglamento de abuso de mercado —MAR—** y Reglamento Delegado (UE)
   2016/958, en relación con recomendaciones públicas, estrategias de inversión,
   opiniones sobre valor o precio, presentación objetiva y conflictos.
3. **Ley 6/2023, de los Mercados de Valores y de los Servicios de Inversión**, y
   **Real Decreto 813/2023**, incluido el régimen aplicable a agentes y la
   responsabilidad y control de la entidad representada.
4. Normativa y políticas de **publicidad de productos y servicios de inversión**.
5. **RGPD y LOPDGDD**, incluidas minimización, transparencia, perfiles,
   decisiones automatizadas, seguridad, conservación y derechos.
6. **Reglamento de Inteligencia Artificial de la Unión Europea**, además de las
   obligaciones de transparencia, supervisión y gobernanza que correspondan.
7. **LSSI-CE**, contratación electrónica, cookies y comunicaciones comerciales.
8. Normativa de **consumidores y usuarios**, prácticas comerciales, información
   precontractual, suscripciones, renovaciones y derecho de desistimiento.
9. Propiedad intelectual, derechos sobre bases de datos, licencias y condiciones
   de uso de proveedores de datos.
10. Normas fiscales, de accesibilidad y cualquier otra regulación que resulte
    aplicable a la función concreta.

La lista no es cerrada. Una función novedosa puede exigir una revisión adicional.

---

## 3. Principio central: NUVIA calcula y muestra; el usuario decide

NUVIA puede realizar un cálculo financiero o estadístico y mostrar su resultado
sin que ello implique necesariamente una recomendación.

La función se mantendrá en el plano descriptivo cuando concurran conjuntamente
estas condiciones:

- el método, las fórmulas y los supuestos están identificados;
- el usuario elige los datos, instrumentos, pesos, periodos o restricciones;
- el resultado responde exactamente a la operación matemática solicitada;
- NUVIA explica qué mide el indicador y cuáles son sus limitaciones;
- no se deduce del resultado qué debería comprar, vender o mantener el usuario;
- no se afirma que el resultado sea adecuado para sus circunstancias personales;
- no se convierte el resultado en una propuesta de operación o rebalanceo;
- no existe conexión inmediata con contratación, ejecución o derivación comercial;
- la IA no añade una conclusión prescriptiva a un resultado descriptivo.

La inclusión de una fórmula en un manual o libro de texto es un criterio fuerte
de normalidad académica, pero no constituye por sí sola una excepción legal. La
presentación, el contexto, la personalización y el efecto conjunto siguen siendo
decisivos.

### Tres capas que deben permanecer separadas

1. **Cálculo:** obtiene una cifra o solución matemática.
2. **Explicación:** describe qué significa, de qué depende y qué limitaciones tiene.
3. **Decisión:** determina qué debería hacer una persona.

NUVIA puede realizar las capas 1 y 2. La capa 3 queda prohibida.

---

## 4. Laboratorio de cartera: métodos permitidos

El laboratorio puede mostrar métodos y métricas tradicionales de finanzas,
entre otros:

- rentabilidad histórica y rentabilidad estimada, claramente diferenciadas;
- volatilidad, varianza, covarianza y correlación;
- beta y otras medidas de sensibilidad;
- ratio de Sharpe, Sortino y métricas equivalentes, con su definición;
- drawdown y medidas históricas de pérdida;
- concentración por posición, emisor, sector, geografía o divisa;
- contribución de cada posición al riesgo o a la rentabilidad;
- solapamiento entre fondos o instrumentos;
- frontera eficiente;
- cartera de mínima volatilidad;
- cartera de máximo ratio de Sharpe;
- escenarios, simulaciones y análisis de sensibilidad;
- costes y efecto matemático de comisiones conocidas;
- distribución histórica de resultados y simulaciones probabilísticas.

### Presentación de máximo Sharpe y mínima volatilidad

Es admisible identificar:

- «Cartera con mayor ratio de Sharpe dentro del universo, periodo, restricciones
  y supuestos seleccionados».
- «Cartera con menor volatilidad estimada dentro del universo y restricciones
  seleccionados».

La palabra **óptima** solo podrá utilizarse si se acompaña inmediatamente de la
función matemática respecto de la que se optimiza. No se utilizará como juicio
absoluto ni como sinónimo de adecuada o recomendable.

Formulaciones admisibles:

- «Óptima respecto de la maximización del ratio de Sharpe bajo estos supuestos».
- «Solución matemática de mínima volatilidad para las restricciones elegidas».
- «Este resultado describe el modelo y los datos utilizados; no determina la
  adecuación para una persona».

Formulaciones prohibidas:

- «La cartera óptima para ti».
- «La mejor cartera» sin identificar una métrica objetiva concreta.
- «Esta es la cartera que deberías tener».
- «Recomendamos cambiar a esta distribución».
- «Tu cartera ideal».

### Pesos y soluciones matemáticas

La herramienta puede mostrar los pesos que resultan de un algoritmo si:

- se identifica la función objetivo;
- se muestran las restricciones;
- se distinguen datos históricos de hipótesis futuras;
- no se selecciona la solución como opción predeterminada de inversión;
- no se genera una lista prescriptiva de compras y ventas;
- no se habilita ejecución, contratación o copia automática hacia una cartera real;
- no se presenta la solución como idónea para el usuario.

---

## 5. Reglas de lenguaje, interfaz y experiencia

El cumplimiento se evalúa sobre el efecto conjunto. Una frase neutral puede
convertirse en recomendación implícita por su ubicación, color, jerarquía o
proximidad a una llamada a la acción.

### Permitido

- describir hechos verificables;
- explicar fórmulas y conceptos;
- mostrar resultados numéricos;
- comparar por una métrica objetiva elegida y visible;
- ordenar alfabéticamente, cronológicamente o mediante filtros del usuario;
- señalar limitaciones, incertidumbre y calidad del dato;
- describir concentración, exposición o comportamiento histórico;
- mostrar escenarios sin decidir cuál debe elegir el usuario.

### Prohibido salvo revisión y autorización expresa

- «comprar», «vender», «mantener», «entrar», «salir» o equivalentes como consejo;
- «recomendado», «adecuado», «ideal para ti», «oportunidad» o «momento de»;
- puntuaciones o semáforos de atractivo financiero;
- rankings de emisores o instrumentos por mérito inversor;
- precios objetivo propios, potencial alcista o bajista y veredictos de valoración;
- urgencia, escasez o presión comercial;
- botones que conviertan un análisis en contratación, contacto o ejecución;
- mensajes que juzguen la conveniencia a partir del perfil del usuario;
- avisos que sugieran una operación aunque se presenten como advertencia de riesgo.

Un descargo de responsabilidad no corrige una experiencia que en sustancia
recomienda, promociona o asesora.

---

## 6. Información sobre empresas, emisores e instrumentos

Las fichas e informes pueden incluir:

- descripción del negocio y fuentes de ingresos;
- estados financieros y evolución histórica;
- ratios calculados con fórmula, fuente y fecha;
- contexto sectorial descriptivo;
- riesgos y limitaciones con tratamiento equilibrado;
- comparaciones por variables objetivas claramente identificadas;
- información histórica de mercado.

No podrán incluir, sin revisión regulatoria específica:

- veredicto sobre la conveniencia de invertir;
- calificación global de atractivo;
- infravalorada, sobrevalorada, barata o cara como conclusión propia;
- precio objetivo propio;
- expectativa propia sobre precio o valor futuro;
- señal técnica de compra, venta o mantenimiento;
- selección editorial de «las mejores» compañías o instrumentos;
- consenso de terceros transformado en conclusión de NUVIA;
- reproducción o difusión de recomendaciones de terceros sin analizar las
  obligaciones que pueda generar dicha difusión.

El análisis técnico puede explicarse con finalidad educativa y mediante ejemplos
históricos. Su aplicación a instrumentos actuales no podrá producir señales,
veredictos, alertas operativas ni llamadas a la acción.

---

## 7. Inteligencia artificial

Toda función de IA queda sometida a las mismas prohibiciones que el contenido
humano. La IA no dispone de una excepción por ser automática, educativa o
conversacional.

### Requisitos mínimos

- finalidad y alcance definidos;
- instrucciones de sistema alineadas con este documento;
- fuentes y fecha cuando se utilicen datos externos;
- separación visible entre dato, inferencia y contenido generado;
- controles para impedir recomendaciones personalizadas o públicas;
- control de alucinaciones y afirmaciones no verificadas;
- revisión humana proporcional al riesgo;
- registro de versión del modelo, prompt y controles relevantes;
- información al usuario cuando interactúe con contenido generado por IA;
- minimización de datos personales y prohibición de reutilización no autorizada;
- mecanismo para informar y corregir resultados problemáticos.

### Prohibiciones específicas

La IA no podrá:

- traducir una métrica en una orden o consejo;
- elaborar una cartera «adecuada» a partir de patrimonio, edad, objetivos o riesgo;
- completar silenciosamente datos o supuestos financieros;
- inventar precios, ratios, fuentes o acontecimientos;
- cambiar el sentido de una salida cuantitativa mediante lenguaje persuasivo;
- utilizar datos familiares o patrimoniales para entrenamiento sin base y
  autorización específicas;
- responder fuera del perímetro porque el usuario insista o reformule la petición.

Las respuestas libres de IA sobre inversión deberán incorporar límites técnicos,
no depender exclusivamente de instrucciones textuales.

---

## 8. Compatibilidad con la condición de agente financiero vinculado

La participación de un promotor que actúa como agente financiero vinculado exige
una separación reforzada entre NUVIA y la entidad representada.

### Reglas obligatorias

- NUVIA no se presentará como iniciativa del banco ni utilizará sus marcas,
  documentación, sistemas o recursos sin autorización escrita.
- No se importarán, copiarán ni reutilizarán datos obtenidos en la actividad
  bancaria.
- No se incorporarán clientes o potenciales clientes del banco por razón de esa
  relación profesional sin autorización escrita y una base jurídica independiente.
- NUVIA no generará, calificará, venderá ni derivará contactos comerciales para
  el agente vinculado.
- La información introducida en NUVIA no podrá utilizarse para asesorar,
  comercializar o captar negocio bancario.
- No se mezclará la prestación externa del agente con la interfaz, las cuentas,
  el soporte o los datos de NUVIA.
- El agente no prestará dentro de NUVIA servicios que excedan o eludan el mandato,
  autorización, control y procedimientos de la entidad a la que representa.
- La condición profesional no se utilizará para inducir al usuario a entender que
  el contenido de NUVIA está aprobado, garantizado o supervisado por el banco.
- Las posiciones personales, relaciones económicas y conflictos relevantes de
  promotores o autores se gestionarán y revelarán cuando corresponda.
- Las operaciones personales y las obligaciones de comunicación del agente se
  respetarán con independencia de que NUVIA no emita recomendaciones.

### Aprobación del banco

Antes del lanzamiento público, y antes de cualquier cambio material que afecte a
instrumentos concretos, colaboradores financieros, monetización, captación,
publicidad o personalización, deberá comprobarse si el contrato o las políticas
de la entidad exigen comunicación o autorización previa.

Cuando sea exigible, la conformidad deberá constar por escrito. El silencio, una
conversación informal o la ausencia de competencia comercial directa no se
considerarán autorización.

Si el banco impone una restricción más severa, prevalecerá esa restricción para
la participación del agente y para cualquier función que pueda vincularse con él.

---

## 9. Colaboradores, directorios y contactos

Como regla inicial, NUVIA no actuará como sistema de captación o derivación hacia
profesionales financieros.

Cualquier futuro directorio, formulario de contacto, agenda o relación con un
profesional financiero se considerará función de riesgo alto y exigirá, antes de
su desarrollo:

- definición jurídica de la relación;
- análisis de promoción, intermediación y conflictos;
- revisión de protección de datos y consentimiento;
- reglas de verificación profesional;
- política de remuneración;
- separación respecto del agente vinculado y del banco;
- aprobación de compliance cuando corresponda.

No se permitirán comisiones por operación, producto, patrimonio captado, contacto
o contratación. Cualquier excepción futura exigiría modificar expresamente este
documento después de una validación jurídica y profesional documentada.

---

## 10. Publicidad, monetización e independencia

La monetización no podrá alterar resultados, coberturas, orden, disponibilidad o
tratamiento de emisores e instrumentos.

Quedan prohibidos como modelo de partida:

- afiliación con brokers, bancos, gestoras, emisores o plataformas de inversión;
- pago por leads o apertura de cuentas;
- comisiones ligadas a productos u operaciones;
- patrocinio que influya en contenidos, comparaciones o herramientas;
- publicidad nativa confundible con contenido educativo o analítico.

Las suscripciones por acceso a funciones neutrales pueden evaluarse, siempre que
cumplan información precontractual, precios, impuestos, renovación, cancelación,
desistimiento y normativa de consumo.

Cualquier publicidad futura deberá identificarse de manera inequívoca, quedar
separada del análisis y pasar una revisión regulatoria específica antes de su
diseño y contratación.

---

## 11. Datos personales, información familiar y comunidad

Los datos patrimoniales, familiares, fiscales y de comportamiento requieren una
protección reforzada.

### Requisitos

- inventario de datos y flujos;
- finalidad, base jurídica y roles de responsable y encargados;
- minimización y privacidad desde el diseño;
- consentimiento granular cuando sea la base aplicable;
- cifrado, control de accesos y separación de entornos;
- conservación limitada, exportación y supresión;
- evaluación de impacto cuando el riesgo lo requiera;
- contratos y revisión de proveedores;
- control de transferencias internacionales;
- transparencia sobre perfiles, IA y decisiones automatizadas;
- prohibición de reutilización para fines bancarios o comerciales no consentidos.

El tratamiento en el navegador reduce exposición, pero no elimina por sí solo
las obligaciones de NUVIA si determina las finalidades o medios del tratamiento.

### Inteligencia comunitaria

No se publicarán estadísticas de «más comprado», «más vendido», «más mantenido»
o equivalentes mientras no exista:

- volumen suficiente para impedir reidentificación;
- evaluación de impacto específica;
- umbrales mínimos y supresión de grupos pequeños;
- revisión del riesgo de recomendación implícita y prueba social;
- base jurídica y transparencia adecuadas.

Esta función queda fuera del MVP salvo aprobación expresa y documentada.

---

## 12. Prueba regulatoria obligatoria para cada función

Antes de diseñar o modificar una función debe responderse por escrito:

1. ¿Qué necesidad educativa o informativa resuelve?
2. ¿Qué datos recibe y quién los elige?
3. ¿Qué cálculo o transformación realiza?
4. ¿Qué resultado exacto muestra?
5. ¿Se refiere a instrumentos o emisores identificables?
6. ¿Utiliza circunstancias personales del usuario?
7. ¿Sugiere explícita o implícitamente comprar, vender, mantener o no actuar?
8. ¿Opina sobre el valor o precio actual o futuro?
9. ¿Puntúa, selecciona, destaca u ordena por atractivo inversor?
10. ¿Reproduce una recomendación de un tercero?
11. ¿El color, diseño o navegación convierten el resultado en un veredicto?
12. ¿Existe llamada a la acción, contacto, contratación o ejecución?
13. ¿Existe remuneración, patrocinio, afiliación o conflicto?
14. ¿Puede afectar a la condición de agente vinculado o a la entidad representada?
15. ¿Qué datos personales trata y con qué base jurídica?
16. ¿Interviene IA y puede exceder el resultado permitido?
17. ¿Qué fuentes, fechas, fórmulas, supuestos y limitaciones se muestran?
18. ¿Qué prueba automática y revisión humana impedirán una regresión?

### Clasificación

- **Verde:** cálculo o información objetiva; sin personalización decisoria,
  veredicto, incentivo ni acción. Puede desarrollarse con los controles normales.
- **Ámbar:** instrumento concreto, personalización, IA abierta, comparación
  sensible, datos patrimoniales, colaborador o posible conflicto. Requiere revisión
  documentada antes de desarrollar y nueva revisión antes de publicar.
- **Rojo:** recomendación, asesoramiento, señal, precio objetivo propio, idoneidad,
  ejecución, derivación comercial o incompatibilidad profesional. No se desarrolla
  ni publica dentro del modelo actual de NUVIA.

La ausencia de una palabra prohibida no basta para clasificar una función como
verde. Se revisa el efecto global.

---

## 13. Puertas de control del desarrollo

Ningún módulo se considerará terminado si no supera estas puertas:

### Antes del diseño

- ficha regulatoria completada;
- clasificación verde, ámbar o roja;
- identificación de datos, fuentes y terceros;
- identificación del posible impacto sobre el agente vinculado.

### Antes de programar

- resultados y lenguaje permitidos definidos;
- estados prohibidos y casos límite definidos;
- arquitectura de datos e IA revisada;
- controles automáticos previstos.

### Antes de integrar

- revisión de código y contenido;
- pruebas sobre textos, botones, orden, colores y resultados;
- pruebas de IA con intentos de obtener recomendaciones;
- verificación de fuentes, fechas, fórmulas y supuestos;
- comprobación de que no existe derivación, contratación o reutilización de datos.

### Antes de publicar

- validación funcional y regulatoria registrada;
- validación jurídica o de compliance cuando la clasificación sea ámbar;
- aprobación escrita del banco cuando resulte exigible;
- revisión de avisos legales, privacidad, cookies y consumo;
- mecanismo de retirada inmediata.

Una aprobación interna de producto no equivale a validación jurídica. Las dos
deben quedar diferenciadas en la documentación.

---

## 14. Controles técnicos y regresiones

El cumplimiento debe apoyarse en controles verificables. Según el módulo, se
incorporarán:

- búsqueda automática de expresiones prescriptivas;
- pruebas que impidan mostrar recomendaciones o botones operativos;
- listas permitidas de métricas y tipos de salida;
- pruebas de neutralidad de ordenación y filtros;
- comprobación de atribución, fecha y fuente;
- pruebas de separación entre datos del usuario y contenido editorial;
- pruebas de aislamiento de datos respecto de la actividad bancaria;
- pruebas adversariales para IA;
- registro de cambios en prompts y modelos;
- pruebas de privacidad, borrado y consentimiento;
- revisión manual obligatoria de las pantallas de mayor riesgo.

Los controles automáticos ayudan, pero no sustituyen la revisión del efecto
completo de la experiencia.

---

## 15. Gestión de cambios e incidentes

- Toda función nueva o cambio material debe repetir la prueba regulatoria.
- Un cambio de texto, orden, color, monetización o enlace puede ser material
  aunque el algoritmo no cambie.
- Las nuevas normas, guías y criterios de autoridades se revisarán periódicamente.
- Si se detecta una salida potencialmente incompatible, se desactivará o aislará
  primero y se investigará después.
- El incidente, alcance, causa, corrección y medidas preventivas quedarán registrados.
- Este documento se actualizará con versión, fecha y motivo del cambio.

---

## 16. Fuentes regulatorias principales

- [Reglamento (UE) 596/2014 sobre abuso de mercado —MAR—](https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32014R0596)
- [Reglamento Delegado (UE) 2016/958](https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0958)
- [Guía de la CNMV para finfluencers: cómo actuar con responsabilidad](https://www.cnmv.es/DocPortal/Publicaciones/Guias/GuiaparaFinfluencers.pdf)
- [Ley 6/2023, de los Mercados de Valores y de los Servicios de Inversión](https://www.boe.es/eli/es/l/2023/03/17/6/con)
- [Real Decreto 813/2023](https://www.boe.es/eli/es/rd/2023/11/08/813/con)
- [Circular 2/2020 de la CNMV sobre publicidad](https://www.cnmv.es/Portal/Legislacion/Circulares-2016-2020)
- [Reglamento General de Protección de Datos](https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=es)
- [Ley Orgánica 3/2018 —LOPDGDD—](https://www.boe.es/eli/es/lo/2018/12/05/3/con)
- [Reglamento (UE) 2024/1689 de Inteligencia Artificial](https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32024R1689)
- [Ley 34/2002 —LSSI-CE—](https://www.boe.es/eli/es/l/2002/07/11/34/con)
- [Texto refundido de la Ley General para la Defensa de los Consumidores y Usuarios](https://www.boe.es/eli/es/rdlg/2007/11/16/1/con)

Las fuentes se revisarán siempre en su versión vigente. Las guías y este marco
no sustituyen el análisis de la función concreta.

---

## 17. Regla final de aprobación

Una función solo puede formar parte de NUVIA cuando sea posible explicar de
forma clara y documentada que:

1. informa, educa, calcula o simula;
2. no decide por el usuario;
3. no recomienda explícita ni implícitamente una actuación inversora;
4. no invade una actividad reservada;
5. no crea una recomendación pública sin cumplir las obligaciones aplicables;
6. protege los datos y los derechos del usuario;
7. mantiene la independencia comercial;
8. es compatible con la condición de agente financiero vinculado y con las
   obligaciones frente a la entidad representada;
9. dispone de controles que evitan que una modificación futura rompa el perímetro.

Si cualquiera de estos puntos no puede acreditarse, la función no se publicará.

