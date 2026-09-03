# Coherencia del resumen y la frontera · P6

Fecha: 03-09-2026. Orden del fundador: «go» para revisar la discrepancia detectada
en la cartera mixta. Solo copia local oficial. Sin modificar base, precios, pesos,
permisos, niveles de acceso, publicar ni operar.

## Revisión previa · marco §12

1. Necesidad: explicar y verificar por qué dos paneles calculan cifras diferentes.
2. Entradas: las mismas series diarias alineadas y los pesos ya elegidos; modelos
   predefinidos en las pruebas reales, sin carteras personales.
3. Transformaciones: contraste del historial sin rebalanceo con el modelo de
   covarianzas a pesos constantes y media ponderada de rentabilidades anualizadas.
4. Salidas: métricas descriptivas y sus métodos explícitos; no forzar su igualdad.
5. Instrumentos: los mismos, incluidos los dos ETF ya autorizados y cargados.
6. Circunstancias personales: ninguna nueva entrada.
7. Operaciones: ninguna recomendación de comprar, vender, mantener o rebalancear.
8. Futuro: no añadir previsiones ni opiniones sobre precios.
9. Atractivo: ninguna selección o ranking de productos por mérito inversor.
10. Terceros: no reproducir recomendaciones.
11. Interfaz: distinguir métodos con etiquetas neutrales; conservar paneles y acceso.
12. Acciones: solo consulta y cálculos existentes, sin contratación ni derivación.
13. Remuneración: sin cambios.
14. Separación: solo el proyecto NUVIA; sin datos ni recursos de la actividad bancaria.
15. Datos personales: no consultar carteras guardadas ni escribir datos personales.
16. IA: ninguna nueva función de IA en el producto.
17. Transparencia: fórmulas, anualización, muestra aproximada y límites del modelo;
    no presentar una media de rentabilidades individuales como un backtest.
18. Verificación: reproducción independiente con series ficticias y los cuatro
    modelos reales, pruebas de interfaz y regresión; ausencia explícita si faltan datos.

Clasificación interna: se conserva ámbar por instrumentos concretos y comparación.
Validación jurídica externa fuera del alcance alfa; sin nueva restricción.

## Causa identificada en el código

`serieCartera` suma los niveles rebasados con los pesos iniciales. Es un historial
sin rebalanceo: las cantidades permanecen constantes y los pesos efectivos derivan.
El resumen calcula la rentabilidad compuesta y volatilidad de esa serie resultante.

La frontera y diversificación usan pesos constantes en la matriz de covarianzas.
La coordenada de rentabilidad es la media ponderada de las rentabilidades compuestas
anualizadas de cada activo, no la rentabilidad compuesta del historial agregado ni
la de una estrategia rebalanceada cada día. Las series, periodo y escala de 252
observaciones anuales son compartidos; el método de agregación es distinto.

La reparación prevista conserva las fórmulas, precios y pesos. Corrige el lenguaje
que daba a entender equivalencia, identifica cada método junto a sus resultados y
presenta ambas cifras con sus etiquetas. No se mueve artificialmente el punto de
la cartera sobre otra geometría para ocultar la diferencia.

La inspección visual también detectó solape entre «Mayor Sharpe» y «Tu combinación».
Se separan únicamente las etiquetas y se añade una guía cuando se desplazan;
los puntos, la curva y sus valores quedan intactos.

## Resultado y evidencias

**P6 resuelto localmente:** corregida la atribución y presentación de métodos,
sin cambiar ninguna fórmula financiera, precio ni peso. No era un precio erróneo
ni una ventana distinta: las dos agregaciones contestan preguntas diferentes.
No se afirma que las cifras deban coincidir ni que ahora coincidan por esta reparación.

| Modelo | Historial: rentabilidad / volatilidad | Modelo: rentabilidad / volatilidad |
|---|---|---|
| Bolsa mundial indexada | 16,97 % / 11,88 % | 16,97 % / 11,88 % |
| Grandes cotizadas españolas | 37,76 % / 17,43 % | 34,50 % / 16,08 % |
| Value de gestoras independientes | 20,17 % / 11,90 % | 19,88 % / 11,92 % |
| Mitad bolsa mundial, mitad bonos en euros | 11,28 % / 6,71 % | 10,93 % / 6,41 % |

Cifras del motor redondeadas a cuatro decimales; la pantalla presenta porcentajes
con un decimal. Que la primera cartera coincida al redondear no convierte los dos
métodos en equivalentes. El cálculo independiente sin redondeo se conserva en la
evidencia; tolerancia absoluta 0,0002 (0,02 puntos porcentuales) para comprobar la
acumulación de redondeos de volatilidades/correlaciones del motor existente.

### Fórmulas comprobadas

- Historial: `V(t) = suma(w_i * P_i(t) / P_i(0))`; rentabilidad anual compuesta
  `V(fin)^(252/n) - 1`, con `n` retornos diarios; volatilidad muestral de
  `V(t)/V(t-1)-1`, anualizada con raíz de 252.
- Modelo: media ponderada de los CAGR individuales y
  `raíz(w' * Cov(retornos diarios) * w * 252)`.
- El oráculo comprueba la segunda volatilidad mediante la desviación de la suma
  ponderada de retornos diarios, independiente del camino de Pearson del producto.
- Se calcula también una estrategia ficticia rebalanceada diariamente para probar
  que su CAGR NO es la media ponderada de CAGR individuales. No se añade esa
  estrategia a la interfaz ni se presenta como recomendación.

### Cambios visibles

1. Nota junto al resumen: historial sin rebalanceo y deriva de pesos con los precios.
2. Frontera identificada como modelo aproximado de 4.000 mezclas; eliminada la
   afirmación de representar todas las combinaciones o la rentabilidad realizada.
3. Tabla «Dos métodos, los mismos datos», alimentada con las cifras de ambos motores,
   no con números duplicados ni constantes. Ausencias como guion; ceros y pérdidas
   conservados. Cabeceras, leyenda y nota explican qué mide la rentabilidad.
4. Diversificación, contribución al riesgo y Sharpe distinguen resultados del modelo
   y del historial. Mínimo riesgo y mayor Sharpe se acotan a las mezclas muestreadas.
5. Etiquetas próximas de la frontera separadas sin alterar sus puntos ni la curva.

### Verificaciones terminadas

- Cinco pruebas nuevas: cálculo independiente de cuatro series divergentes,
  coincidencia legítima, ausencias/ceros/pérdidas, conexión de la comparación y
  separación de rótulos. Incluidas en la batería general.
- Reproducción de los cuatro modelos reales, nueve consultas de lectura, cero
  escrituras; comprobación de no mutación de precios ni pesos y huella de las series.
- En navegador, las cuatro tablas muestran los valores de sus dos motores.
  Inspección de la comparación en escritorio (1440) y tablet (768); tabla sin
  desbordamiento en 768 (649 px útiles y 649 px de contenido).
- Construcción general correcta: validadores, pruebas, 30 vistas a 1440 y
  fundamentales en cinco anchos. Después del último ajuste de rótulos se repite
  la batería de análisis, el empaquetado y la comprobación estática de dist.
- Barrido final de la vista de modelos: **7/7 anchos correctos**, 1440, 1280,
  1180, 1024, 900, 820 y 768 px, registrado por separado.
  El barrido aislado no verifica los servicios remotos; se distingue del recorrido
  con datos reales anterior. No se certifica universalmente accesibilidad ni todas
  las variantes de cartera.

Evidencias:

- `output/coherencia-metodos/contraste-2026-09-03T16-45-56-325Z.json`.
- `output/coherencia-metodos/build.log`.
- `output/coherencia-metodos/pruebas-finales.log`.
- `output/coherencia-metodos/render-final.log`.
- Revisión visual manual en la conversación, sin atribuir archivos de captura inexistentes.

Sin cambios en Firebase, datos personales, estimaciones de empresas, permisos,
funciones disponibles, commits, merge, push o publicación. El fallo aislado de
preparación de fichas del acta de ETF no se ha reproducido en estos cuatro recorridos;
no se atribuye su solución a este cambio de explicación.
